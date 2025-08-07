//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

/**
 * @title IUniswapV2Router02
 * @dev Interface for Uniswap V2 Router to enable token swaps and price calculations
 * @notice This interface provides the essential functions needed for DEX interactions
 */
interface IUniswapV2Router02 {
    /**
     * @dev Executes a token swap with exact input amount
     * @param amountIn The exact amount of input tokens to swap
     * @param amountOutMin The minimum amount of output tokens to receive (slippage protection)
     * @param path Array of token addresses representing the swap path
     * @param to The recipient address for the output tokens
     * @param deadline Unix timestamp after which the transaction will revert
     * @return amounts Array containing input amount and output amounts for each step
     */
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    /**
     * @dev Calculates the output amount for a given input amount and swap path
     * @param amountIn The input amount to calculate output for
     * @param path Array of token addresses representing the swap path
     * @return amounts Array containing input amount and output amounts for each step
     */
    function getAmountsOut(uint amountIn, address[] calldata path) 
        external view returns (uint[] memory amounts);
}

/**
 * @title SoarBot
 * @dev Advanced arbitrage bot that exploits price differences across DEX pools
 * @notice This contract implements real arbitrage logic comparing direct swaps vs cross-arbitrage paths
 * @author AI Assistant
 * @custom:security-contact This contract uses Ownable pattern for access control
 */
contract SoarBot is Ownable {
    // ==================== STATE VARIABLES ====================
    
    /**
     * @dev WETH (Wrapped ETH) address for Sepolia testnet
     * @notice Immutable to prevent changes after deployment
     */
    address immutable WETH;
    
    /**
     * @dev Uniswap V2 Router address for executing swaps
     * @notice Public for transparency and verification
     */
    address public router;

    // ==================== PROFIT TRACKING ====================
    
    /**
     * @dev Total profit accumulated across all arbitrage operations
     * @notice Tracks cumulative profit in the most recent profit token
     */
    uint256 public totalProfit;
    
    /**
     * @dev Mapping to track profit for each specific token
     * @notice tokenProfits[tokenAddress] = profit amount for that token
     */
    mapping(address => uint256) public tokenProfits;
    
    /**
     * @dev Counter for total number of arbitrage operations performed
     * @notice Used for generating unique arbitrage IDs
     */
    uint256 public arbitrageCount;

    // ==================== EVENTS ====================
    
    /**
     * @dev Emitted when a real arbitrage operation is completed
     * @param tokenA The first token in the arbitrage path
     * @param tokenB The intermediate token in the arbitrage path
     * @param tokenC The final token in the arbitrage path
     * @param amountIn The input amount for the arbitrage
     * @param directAmount The amount received from direct swap (A → C)
     * @param arbitrageAmount The amount received from arbitrage path (A → B → C)
     * @param profit The actual profit achieved
     * @param arbitrageProfitable Whether the arbitrage path was more profitable
     * @param arbitrageId Unique identifier for this arbitrage operation
     */
    event RealArbitrageExecuted(
        address indexed tokenA,
        address indexed tokenB,
        address indexed tokenC,
        uint256 amountIn,
        uint256 directAmount,
        uint256 arbitrageAmount,
        uint256 profit,
        bool arbitrageProfitable,
        uint256 arbitrageId
    );

    /**
     * @dev Emitted when tokens are approved for spending
     * @param token The token address that was approved
     * @param spender The address approved to spend the tokens
     * @param amount The amount approved for spending
     */
    event TokenApproved(
        address indexed token,
        address indexed spender,
        uint256 amount
    );

    // ==================== CONSTRUCTOR ====================
    
    /**
     * @dev Initializes the SoarBot contract with WETH and Router addresses
     * @param _WETH The WETH token address for the target network
     * @param _router The Uniswap V2 Router address for the target network
     * @notice Called once during contract deployment
     */
    constructor(address _WETH, address _router) {
        WETH = _WETH;
        router = _router;
    }

    // ==================== FALLBACK FUNCTIONS ====================
    
    /**
     * @dev Allows the contract to receive ETH
     * @notice Required for contracts that may receive ETH transfers
     */
    receive() external payable {}

    // ==================== TOKEN MANAGEMENT ====================
    
    /**
     * @dev Approves a specific amount of tokens for spending by another address
     * @param token The token address to approve
     * @param spender The address to approve for spending
     * @param amount The amount to approve
     * @notice Only the contract owner can call this function
     * @notice Emits TokenApproved event
     */
    function approveToken(address token, address spender, uint256 amount) external onlyOwner {
        IERC20(token).approve(spender, amount);
        emit TokenApproved(token, spender, amount);
    }

    /**
     * @dev Checks the current allowance for a token spender
     * @param token The token address to check allowance for
     * @param spender The address to check allowance for
     * @return The current allowance amount
     * @notice View function - does not modify state
     */
    function getTokenAllowance(address token, address spender) external view returns (uint256) {
        return IERC20(token).allowance(address(this), spender);
    }

    // ==================== HELPER FUNCTIONS ====================
    
    /**
     * @dev Creates a swap path array for two tokens
     * @param tokenIn The input token address
     * @param tokenOut The output token address
     * @return path Array containing [tokenIn, tokenOut]
     * @notice Internal pure function - no state changes
     */
    function _getPath(address tokenIn, address tokenOut) internal pure returns (address[] memory) {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        return path;
    }

    // ==================== CORE SWAP FUNCTION ====================
    
    /**
     * @dev Executes a single token swap with slippage protection
     * @param tokenIn The input token address
     * @param tokenOut The output token address
     * @param amountIn The amount of input tokens to swap
     * @return amountOut The amount of output tokens received
     * @notice Internal function used by arbitrage operations
     * @notice Includes 5% slippage tolerance for safety
     * @notice Requires sufficient token balance and router approval
     */
    function executeSwap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal returns (uint256 amountOut) {
        // Validate input amount
        require(amountIn > 0, "Amount must be greater than 0");
        
        // Check if contract has sufficient tokens
        uint256 balance = IERC20(tokenIn).balanceOf(address(this));
        require(balance >= amountIn, "Insufficient token balance");

        // Calculate expected output using router
        address[] memory path = _getPath(tokenIn, tokenOut);
        uint256[] memory amounts = IUniswapV2Router02(router).getAmountsOut(amountIn, path);
        uint256 expectedOutput = amounts[1];
        
        // Execute swap with slippage protection (5% tolerance)
        IERC20(tokenIn).approve(router, amountIn);
        uint256[] memory swapAmounts = IUniswapV2Router02(router).swapExactTokensForTokens(
            amountIn,
            expectedOutput * 95 / 100, // 5% slippage tolerance
            path,
            address(this),
            block.timestamp + 300 // 5 minute deadline
        );
        
        amountOut = swapAmounts[1];
        return amountOut;
    }

    // ==================== ARBITRAGE CALCULATION ====================
    
    /**
     * @dev Calculates arbitrage opportunity by comparing direct swap vs cross-arbitrage
     * @param tokenA The starting token (e.g., DAI)
     * @param tokenB The intermediate token (e.g., WETH)
     * @param tokenC The final token (e.g., FOGG)
     * @param amountIn The input amount to test
     * @return isProfitable Whether the arbitrage path is more profitable
     * @return directAmount The amount received from direct swap (A → C)
     * @return arbitrageAmount The amount received from arbitrage (A → B → C)
     * @return profit The calculated profit difference
     * @notice Internal view function - no state changes
     * @notice Uses try-catch to handle router failures gracefully
     */
    function calculateArbitrageOpportunity(
        address tokenA,
        address tokenB,
        address tokenC,
        uint256 amountIn
    ) internal view returns (
        bool isProfitable,
        uint256 directAmount,
        uint256 arbitrageAmount,
        uint256 profit
    ) {
        // Calculate direct swap: A → C
        uint256 directSwap = 0;
        try IUniswapV2Router02(router).getAmountsOut(amountIn, _getPath(tokenA, tokenC)) returns (uint256[] memory amounts) {
            directSwap = amounts[1];
        } catch {
            directSwap = 0; // If direct swap fails, set to 0
        }

        // Calculate arbitrage: A → B → C
        uint256 arbitrageSwap = 0;
        try IUniswapV2Router02(router).getAmountsOut(amountIn, _getPath(tokenA, tokenB)) returns (uint256[] memory amounts1) {
            uint256 step1Output = amounts1[1];
            try IUniswapV2Router02(router).getAmountsOut(step1Output, _getPath(tokenB, tokenC)) returns (uint256[] memory amounts2) {
                arbitrageSwap = amounts2[1];
            } catch {
                arbitrageSwap = 0; // If step 2 fails, set to 0
            }
        } catch {
            arbitrageSwap = 0; // If step 1 fails, set to 0
        }

        // Compare and calculate profit
        if (arbitrageSwap > directSwap && arbitrageSwap > 0) {
            isProfitable = true;
            profit = arbitrageSwap - directSwap;
        } else {
            isProfitable = false;
            profit = 0;
        }

        directAmount = directSwap;
        arbitrageAmount = arbitrageSwap;
    }

    // ==================== MAIN ARBITRAGE FUNCTION ====================
    
    /**
     * @dev Executes real arbitrage by comparing direct swap vs cross-arbitrage paths
     * @param tokenA The starting token address (e.g., DAI)
     * @param tokenB The intermediate token address (e.g., WETH)
     * @param tokenC The final token address (e.g., FOGG)
     * @param amountIn The amount of tokenA to use for arbitrage
     * @notice Only contract owner can call this function
     * @notice Automatically chooses the most profitable path
     * @notice Updates profit tracking and emits events
     * @notice Emits RealArbitrageExecuted event with detailed results
     */
    function executeRealArbitrage(
        address tokenA,
        address tokenB,
        address tokenC,
        uint256 amountIn
    ) external onlyOwner {
        // Validate input amount
        require(amountIn > 0, "Amount must be greater than 0");
        
        // Increment arbitrage counter and generate unique ID
        arbitrageCount++;
        uint256 arbitrageId = arbitrageCount;
        
        // Calculate arbitrage opportunities
        (bool isProfitable, uint256 directAmount, uint256 arbitrageAmount, uint256 expectedProfit) = 
            calculateArbitrageOpportunity(tokenA, tokenB, tokenC, amountIn);
        
        // Initialize result variables
        uint256 finalAmount = 0;
        uint256 actualProfit = 0;
        
        // Execute the most profitable path
        if (isProfitable && arbitrageAmount > directAmount) {
            // Execute arbitrage: A → B → C
            uint256 step1Output = executeSwap(tokenA, tokenB, amountIn);
            uint256 step2Output = executeSwap(tokenB, tokenC, step1Output);
            
            finalAmount = step2Output;
            actualProfit = finalAmount - directAmount;
            
            // Update profit tracking if profit was achieved
            if (actualProfit > 0) {
                totalProfit += actualProfit;
                tokenProfits[tokenC] += actualProfit;
            }
        } else {
            // Execute direct swap: A → C
            finalAmount = executeSwap(tokenA, tokenC, amountIn);
            actualProfit = 0;
        }
        
        // Emit detailed arbitrage event
        emit RealArbitrageExecuted(
            tokenA,
            tokenB,
            tokenC,
            amountIn,
            directAmount,
            arbitrageAmount,
            actualProfit,
            isProfitable,
            arbitrageId
        );
    }

    // ==================== EMERGENCY FUNCTIONS ====================
    
    /**
     * @dev Emergency function to rescue specific amount of tokens
     * @param token The token address to rescue
     * @param amount The amount of tokens to rescue
     * @notice Only contract owner can call this function
     * @notice Transfers tokens to the contract owner
     * @notice Requires sufficient token balance
     */
    function rescueTokens(address token, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance >= amount, "Insufficient token balance");
        IERC20(token).transfer(owner(), amount);
    }

    /**
     * @dev Withdraws all tokens from the contract to the owner
     * @notice Only contract owner can call this function
     * @notice Withdraws FOGG, DAI, and WETH tokens
     * @notice Hardcoded addresses for Sepolia testnet
     * @notice Only withdraws if balance > 0 for each token
     */
    function withdrawAllTokens() external onlyOwner {
        // Withdraw FOGG tokens
        uint256 fogBalance = IERC20(0x4b39323d4708dDee635ee1be054f3cB9a95D4090).balanceOf(address(this));
        if (fogBalance > 0) {
            IERC20(0x4b39323d4708dDee635ee1be054f3cB9a95D4090).transfer(owner(), fogBalance);
        }
        
        // Withdraw DAI tokens
        uint256 daiBalance = IERC20(0xd07A73dBC01e3ca6f60e49Dd079C1C8164efb45d).balanceOf(address(this));
        if (daiBalance > 0) {
            IERC20(0xd07A73dBC01e3ca6f60e49Dd079C1C8164efb45d).transfer(owner(), daiBalance);
        }
        
        // Withdraw WETH tokens
        uint256 wethBalance = IERC20(0x6A05167EC0C3f5684525C1bCa2ff25B31950a45e).balanceOf(address(this));
        if (wethBalance > 0) {
            IERC20(0x6A05167EC0C3f5684525C1bCa2ff25B31950a45e).transfer(owner(), wethBalance);
        }
    }
}
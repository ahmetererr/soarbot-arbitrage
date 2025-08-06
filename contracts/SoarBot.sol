//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

interface IUniswapV2Router02 {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function getAmountsOut(uint amountIn, address[] calldata path) 
        external view returns (uint[] memory amounts);
}

contract SoarBot is Ownable {
    // WETH address for Sepolia
    address immutable WETH;
    
    // Uniswap V2 Router
    address public router;

    // Profit tracking
    uint256 public totalProfit;
    mapping(address => uint256) public tokenProfits;
    uint256 public arbitrageCount;

    // Events
    event ArbitrageExecuted(
        address indexed baseToken,
        address indexed quoteToken,
        uint256 amountIn,
        uint256 amountOut,
        uint256 profit,
        uint256 arbitrageId
    );

    event CrossArbitrageExecuted(
        address indexed tokenA,
        address indexed tokenB,
        address indexed tokenC,
        uint256 amountIn,
        uint256 finalAmount,
        uint256 totalProfit,
        uint256 arbitrageId
    );

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

    event TokenApproved(
        address indexed token,
        address indexed spender,
        uint256 amount
    );

    event PriceCalculated(
        address tokenA,
        address tokenB,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor(address _WETH, address _router) {
        WETH = _WETH;
        router = _router;
    }

    receive() external payable {}

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            payable(owner()).transfer(balance);
        }
    }

    // Approve tokens for arbitrage
    function approveToken(address token, address spender, uint256 amount) external onlyOwner {
        IERC20(token).approve(spender, amount);
        emit TokenApproved(token, spender, amount);
    }

    // Check token allowance
    function getTokenAllowance(address token, address spender) external view returns (uint256) {
        return IERC20(token).allowance(address(this), spender);
    }

    // Calculate price for a swap
    function calculatePrice(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        try IUniswapV2Router02(router).getAmountsOut(amountIn, _getPath(tokenIn, tokenOut)) returns (uint256[] memory amounts) {
            amountOut = amounts[1];
            return amountOut;
        } catch {
            // If router fails, return 0
            return 0;
        }
    }

    // Helper function to create path
    function _getPath(address tokenIn, address tokenOut) internal pure returns (address[] memory) {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        return path;
    }

    // Execute single swap with profit calculation
    function executeSwap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal returns (uint256 amountOut) {
        require(amountIn > 0, "Amount must be greater than 0");
        
        // Check if we have enough tokens
        uint256 balance = IERC20(tokenIn).balanceOf(address(this));
        require(balance >= amountIn, "Insufficient token balance");

        // Calculate expected output
        address[] memory path = _getPath(tokenIn, tokenOut);
        uint256[] memory amounts = IUniswapV2Router02(router).getAmountsOut(amountIn, path);
        uint256 expectedOutput = amounts[1];
        
        // Execute swap with slippage protection
        IERC20(tokenIn).approve(router, amountIn);
        uint256[] memory swapAmounts = IUniswapV2Router02(router).swapExactTokensForTokens(
            amountIn,
            expectedOutput * 95 / 100, // 5% slippage tolerance
            path,
            address(this),
            block.timestamp + 300
        );
        
        amountOut = swapAmounts[1];
        return amountOut;
    }

    // Calculate arbitrage opportunity
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
            directSwap = 0;
        }

        // Calculate arbitrage: A → B → C
        uint256 arbitrageSwap = 0;
        try IUniswapV2Router02(router).getAmountsOut(amountIn, _getPath(tokenA, tokenB)) returns (uint256[] memory amounts1) {
            uint256 step1Output = amounts1[1];
            try IUniswapV2Router02(router).getAmountsOut(step1Output, _getPath(tokenB, tokenC)) returns (uint256[] memory amounts2) {
                arbitrageSwap = amounts2[1];
            } catch {
                arbitrageSwap = 0;
            }
        } catch {
            arbitrageSwap = 0;
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

    // Execute real arbitrage with comparison
    function executeRealArbitrage(
        address tokenA,
        address tokenB,
        address tokenC,
        uint256 amountIn
    ) external onlyOwner {
        require(amountIn > 0, "Amount must be greater than 0");
        
        arbitrageCount++;
        uint256 arbitrageId = arbitrageCount;
        
        // Calculate opportunities
        (bool isProfitable, uint256 directAmount, uint256 arbitrageAmount, uint256 expectedProfit) = 
            calculateArbitrageOpportunity(tokenA, tokenB, tokenC, amountIn);
        
        uint256 finalAmount = 0;
        uint256 actualProfit = 0;
        
        if (isProfitable && arbitrageAmount > directAmount) {
            // Execute arbitrage: A → B → C
            
            uint256 step1Output = executeSwap(tokenA, tokenB, amountIn);
            uint256 step2Output = executeSwap(tokenB, tokenC, step1Output);
            
            finalAmount = step2Output;
            actualProfit = finalAmount - directAmount;
            
            if (actualProfit > 0) {
                totalProfit += actualProfit;
                tokenProfits[tokenC] += actualProfit;
            }
        } else {
            // Execute direct swap: A → C
            finalAmount = executeSwap(tokenA, tokenC, amountIn);
            actualProfit = 0;
        }
        
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

    // Execute full cross-arbitrage: A → B → C (legacy function)
    function executeCrossArbitrage(
        address tokenA,
        address tokenB,
        address tokenC,
        uint256 amountIn
    ) external onlyOwner {
        require(amountIn > 0, "Amount must be greater than 0");
        
        arbitrageCount++;
        uint256 arbitrageId = arbitrageCount;
        
        // Store initial amounts for profit calculation
        uint256 initialAmount = amountIn;
        uint256 currentAmount = amountIn;
        
        // Step 1: A → B
        uint256 step1Output = executeSwap(tokenA, tokenB, currentAmount);
        currentAmount = step1Output;
        
        // Step 2: B → C
        uint256 step2Output = executeSwap(tokenB, tokenC, currentAmount);
        currentAmount = step2Output;
        
        // Calculate profit
        uint256 profit = 0;
        if (currentAmount > initialAmount) {
            profit = currentAmount - initialAmount;
            totalProfit += profit;
            tokenProfits[tokenC] += profit;
        }
        
        emit CrossArbitrageExecuted(
            tokenA,
            tokenB,
            tokenC,
            initialAmount,
            currentAmount,
            profit,
            arbitrageId
        );
    }

    // Execute simple arbitrage between two tokens
    function executeArbitrage(
        address baseToken,
        address quoteToken,
        uint256 amountIn
    ) external onlyOwner {
        require(amountIn > 0, "Amount must be greater than 0");
        
        arbitrageCount++;
        uint256 arbitrageId = arbitrageCount;
        
        uint256 amountOut = executeSwap(baseToken, quoteToken, amountIn);
        
        // Calculate profit (simplified - assumes we want more of quoteToken)
        uint256 profit = amountOut;
        
        emit ArbitrageExecuted(
            baseToken,
            quoteToken,
            amountIn,
            amountOut,
            profit,
            arbitrageId
        );
    }

    // Get arbitrage statistics
    function getArbitrageStats() external view returns (
        uint256 _totalProfit,
        uint256 _arbitrageCount,
        uint256 _contractBalance
    ) {
        return (totalProfit, arbitrageCount, address(this).balance);
    }

    // Emergency function to rescue tokens
    function rescueTokens(address token, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance >= amount, "Insufficient token balance");
        IERC20(token).transfer(owner(), amount);
    }

    // Withdraw profits
    function withdrawProfits(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        IERC20(token).transfer(owner(), balance);
    }

    // Withdraw specific token amount
    function withdrawToken(address token, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance >= amount, "Insufficient token balance");
        IERC20(token).transfer(owner(), amount);
    }

    // Withdraw all tokens
    function withdrawAllTokens() external onlyOwner {
        // Withdraw FOGG
        uint256 fogBalance = IERC20(0x4b39323d4708dDee635ee1be054f3cB9a95D4090).balanceOf(address(this));
        if (fogBalance > 0) {
            IERC20(0x4b39323d4708dDee635ee1be054f3cB9a95D4090).transfer(owner(), fogBalance);
        }
        
        // Withdraw DAI
        uint256 daiBalance = IERC20(0xd07A73dBC01e3ca6f60e49Dd079C1C8164efb45d).balanceOf(address(this));
        if (daiBalance > 0) {
            IERC20(0xd07A73dBC01e3ca6f60e49Dd079C1C8164efb45d).transfer(owner(), daiBalance);
        }
        
        // Withdraw WETH
        uint256 wethBalance = IERC20(0x6A05167EC0C3f5684525C1bCa2ff25B31950a45e).balanceOf(address(this));
        if (wethBalance > 0) {
            IERC20(0x6A05167EC0C3f5684525C1bCa2ff25B31950a45e).transfer(owner(), wethBalance);
        }
    }
}
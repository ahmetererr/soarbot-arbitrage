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

    // Events
    event ArbitrageExecuted(
        address indexed baseToken,
        address indexed quoteToken,
        uint256 amountIn,
        uint256 profit
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

    // Execute real arbitrage between two pools
    function executeArbitrage(
        address baseToken,
        address quoteToken,
        uint256 amountIn,
        address pool1,
        address pool2
    ) external onlyOwner {
        require(amountIn > 0, "Amount must be greater than 0");
        
        // Check if we have enough tokens
        uint256 balance = IERC20(baseToken).balanceOf(address(this));
        require(balance >= amountIn, "Insufficient token balance");

        // Calculate expected output from first swap
        address[] memory path1 = new address[](2);
        path1[0] = baseToken;
        path1[1] = quoteToken;
        
        uint256[] memory amounts1 = IUniswapV2Router02(router).getAmountsOut(amountIn, path1);
        uint256 expectedOutput = amounts1[1];
        
        // Execute first swap
        IERC20(baseToken).approve(router, amountIn);
        IUniswapV2Router02(router).swapExactTokensForTokens(
            amountIn,
            expectedOutput * 95 / 100, // 5% slippage tolerance
            path1,
            address(this),
            block.timestamp + 300
        );
        
        // Get actual output
        uint256 actualOutput = IERC20(quoteToken).balanceOf(address(this));
        
        emit ArbitrageExecuted(
            baseToken,
            quoteToken,
            amountIn,
            actualOutput
        );
    }

    // Emergency function to rescue tokens
    function rescueTokens(address token, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance >= amount, "Insufficient token balance");
        IERC20(token).transfer(owner(), amount);
    }
}
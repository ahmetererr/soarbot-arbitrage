// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IUniswapV2Factory.sol";
import "./interfaces/IUniswapV2Pair.sol";
import "./interfaces/IUniswapV2Callee.sol";

contract SoarArbitrage is IUniswapV2Callee {

    address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address private constant FACTORY = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;  // Uniswap V2 factory

    event Log(string message, uint val);

    function flashSwap(address _tokenBorrow, uint _amount) external {
        // Getting pair address with given token addresses
        address pair = IUniswapV2Factory(FACTORY).getPair(_tokenBorrow, WETH);
        require(pair != address(0), "Pair doesn't exist!");

        // Find out token0 and token1
        address token0 = IUniswapV2Pair(pair).token0();
        address token1 = IUniswapV2Pair(pair).token1();

        // Find out which on of the token0 and token1 matches with the token we want to borrow
        uint amoun0Out = _tokenBorrow == token0 ? _amount : 0;
        uint amoun1Out = _tokenBorrow == token1 ? _amount : 0;

        // function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data);
        // This is the same function that executes both regular swaps and flash swaps
        // If 'data'.length = 0 => regular swap , else => flash swap
        bytes memory data = abi.encode(_tokenBorrow, _amount);
        IUniswapV2Pair(pair).swap(amoun0Out, amoun1Out, address(this), data);
    }

    // We must implement this on our side!
    // After the flash swap, Uniswap (or Uniswap like AMMs) will call this function
    function uniswapV2Call(
        address _sender,
        uint _amount0,
        uint _amount1,
        bytes calldata _data) external override{
            address token0 = IUniswapV2Pair(msg.sender).token0();
            address token1 = IUniswapV2Pair(msg.sender).token1();
            address pair = IUniswapV2Factory(FACTORY).getPair(token0, token1);
            require(msg.sender == pair, "Not sent by correct pair!");
            require(_sender == address(this), "Sender originator must be this contract!");

            (address tokenBorrow, uint amount) = abi.decode(_data, (address, uint));

            // fee info - taken from Uniswap docs
            uint fee = ((amount * 3) / 997) + 1;
            uint amountToRepay = fee + amount;

            // emitting events
            emit Log("amount", amount);
            emit Log("amount0", _amount0);
            emit Log("amount1", _amount1);
            emit Log("fee", fee);
            emit Log("amount to repay", amountToRepay);

            //transfer(recipient, amount)
            IERC20(tokenBorrow).transfer(pair, amountToRepay);

        }
   
}

//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';

// DEX imports
import "@traderjoe-xyz/core/contracts/traderjoe/interfaces/IJoePair.sol";

contract SoarBot is Ownable {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    struct OrderedReserves {
        uint256 a1; // base asset
        uint256 b1;
        uint256 a2;
        uint256 b2;
    }

    // Mainnet: 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7
    // Fuji: 0xd00ae08403B9bbb9124bB305C09058E32C39A48c
    address immutable WAVAX;

    // AVAILABLE BASE TOKENS
    EnumerableSet.AddressSet baseTokens;

    constructor(address _WAVAX) {
        WAVAX = _WAVAX;
    }

    receive() external payable {}

     function withdraw() external {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            payable(owner()).transfer(balance);
        }

        for (uint256 i = 0; i < baseTokens.length(); i++) {
            address token = baseTokens.at(i);
            balance = IERC20(token).balanceOf(address(this));
            if (balance > 0) {
                // do not use safe transfer here to prevents revert by any untrusted token
                IERC20(token).transfer(owner(), balance);
            }
        }
    }

    function addBaseToken(address token) external onlyOwner {
        baseTokens.add(token);
    }

    function removeBaseToken(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance > 0) {
            // do not use safe transfer to prevents revert by any shitty token
            IERC20(token).transfer(owner(), balance);
        }
        baseTokens.remove(token);
    }

    function getBaseTokens() external view returns (address[] memory tokens) {
        uint256 length = baseTokens.length();
        tokens = new address[](length);
        for (uint256 i = 0; i < length; i++) {
            tokens[i] = baseTokens.at(i);
        }
    }

    function baseTokensContains(address token) public view returns (bool) {
        return baseTokens.contains(token);
    }

    function isbaseTokenSmaller(address pool0, address pool1)
        internal
        view
        returns (
            bool baseSmaller,
            address baseToken,
            address quoteToken
        )
    {
        require(pool0 != pool1, 'Same pair address');
        // Check if IJoePair, IPangolinPair and IUniswapV2Pair is interchangable
        (address pool0Token0, address pool0Token1) = (IJoePair(pool0).token0(), IJoePair(pool0).token1());
        (address pool1Token0, address pool1Token1) = (IJoePair(pool1).token0(), IJoePair(pool1).token1());
        require(pool0Token0 < pool0Token1 && pool1Token0 < pool1Token1, 'Non standard uniswap AMM pair');
        require(pool0Token0 == pool1Token0 && pool0Token1 == pool1Token1, 'Require same token pair');
        require(baseTokensContains(pool0Token0) || baseTokensContains(pool0Token1), 'No base token in pair');

        (baseSmaller, baseToken, quoteToken) = baseTokensContains(pool0Token0)
            ? (true, pool0Token0, pool0Token1)
            : (false, pool0Token1, pool0Token0);
    }

     /// @dev Compare price denominated in quote token between two pools
    /// We borrow base token by using flash swap from lower price pool and sell them to higher price pool
    function getOrderedReserves(
        address pool0,
        address pool1,
        bool baseTokenSmaller
    )
        internal
        view
        returns (
            address lowerPool,
            address higherPool,
            OrderedReserves memory orderedReserves
        )
    {
        (uint256 pool0Reserve0, uint256 pool0Reserve1, ) = IJoePair(pool0).getReserves();
        (uint256 pool1Reserve0, uint256 pool1Reserve1, ) = IJoePair(pool1).getReserves();

        // TODO: Calc price based on AMM functions:
        
        // // Calculate the price denominated in quote asset token
        // (Decimal.D256 memory price0, Decimal.D256 memory price1) =
        //     baseTokenSmaller
        //         ? (Decimal.from(pool0Reserve0).div(pool0Reserve1), Decimal.from(pool1Reserve0).div(pool1Reserve1))
        //         : (Decimal.from(pool0Reserve1).div(pool0Reserve0), Decimal.from(pool1Reserve1).div(pool1Reserve0));

        // // get a1, b1, a2, b2 with following rule:
        // // 1. (a1, b1) represents the pool with lower price, denominated in quote asset token
        // // 2. (a1, a2) are the base tokens in two pools
        // if (price0.lessThan(price1)) {
        //     (lowerPool, higherPool) = (pool0, pool1);
        //     (orderedReserves.a1, orderedReserves.b1, orderedReserves.a2, orderedReserves.b2) = baseTokenSmaller
        //         ? (pool0Reserve0, pool0Reserve1, pool1Reserve0, pool1Reserve1)
        //         : (pool0Reserve1, pool0Reserve0, pool1Reserve1, pool1Reserve0);
        // } else {
        //     (lowerPool, higherPool) = (pool1, pool0);
        //     (orderedReserves.a1, orderedReserves.b1, orderedReserves.a2, orderedReserves.b2) = baseTokenSmaller
        //         ? (pool1Reserve0, pool1Reserve1, pool0Reserve0, pool0Reserve1)
        //         : (pool1Reserve1, pool1Reserve0, pool0Reserve1, pool0Reserve0);
        // }
        // console.log('Borrow from pool:', lowerPool);
        // console.log('Sell to pool:', higherPool);
    }

}
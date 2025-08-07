/**
 * @fileoverview SoarBot Contract Deployment Script
 * @description Deploys the SoarBot arbitrage contract to the specified network
 * @author AI Assistant
 * @version 1.0.0
 * @license MIT
 */

// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

/**
 * @async
 * @function main
 * @description Main deployment function that deploys the SoarBot contract
 * @returns {Promise<void>} Returns a promise that resolves when deployment is complete
 * @throws {Error} Throws an error if deployment fails or no deployer account is found
 */
async function main() {
  /**
   * @description Get the deployer account from Hardhat's signers
   * @type {import('ethers').Signer}
   */
  const [deployer] = await hre.ethers.getSigners();

  /**
   * @description Check if deployer account exists
   * @type {boolean}
   */
  if (!deployer) {
    console.error("No deployer account found. Please check your PRIVATE_KEY in .env file");
    return;
  }

  /**
   * @description Log deployment information
   */
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Network:", hre.network.name);

  // ==================== SEPOLIA ADDRESSES ====================
  
  /**
   * @description WETH (Wrapped ETH) address for Sepolia testnet
   * @type {string}
   * @constant
   */
  const WETH = "0x6A05167EC0C3f5684525C1bCa2ff25B31950a45e";
  
  /**
   * @description Uniswap V2 Router address for Sepolia testnet
   * @type {string}
   * @constant
   */
  const UNISWAP_ROUTER = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";

  /**
   * @description Log the addresses being used for deployment
   */
  console.log("WETH:", WETH);
  console.log("Uniswap Router:", UNISWAP_ROUTER);

  // ==================== CONTRACT DEPLOYMENT ====================
  
  /**
   * @description Deploy the SoarBot contract
   * @type {import('ethers').ContractFactory}
   */
  console.log("Deploying SoarBot...");
  const SoarBot = await hre.ethers.getContractFactory("SoarBot");
  
  /**
   * @description Create contract instance with constructor parameters
   * @type {import('ethers').Contract}
   */
  const soarBot = await SoarBot.deploy(WETH, UNISWAP_ROUTER);
  
  /**
   * @description Wait for contract deployment to complete
   */
  await soarBot.deployed();

  /**
   * @description Log successful deployment information
   */
  console.log("SoarBot deployed to:", soarBot.address);
  console.log("Owner:", await soarBot.owner());

  /**
   * @description Log deployment completion
   */
  console.log("Deployment completed!");

  // ==================== NETWORK INFORMATION ====================
  
  /**
   * @description Display Sepolia testnet information for reference
   */
  console.log("\n=== SEPOLIA TESTNET INFO ===");
  console.log("Token Addresses:");
  
  /**
   * @description FOGG token address on Sepolia testnet
   * @type {string}
   */
  console.log("FOGG: 0x4b39323d4708dDee635ee1be054f3cB9a95D4090");
  
  /**
   * @description WETH token address on Sepolia testnet
   * @type {string}
   */
  console.log("WETH: 0x6A05167EC0C3f5684525C1bCa2ff25B31950a45e");
  
  /**
   * @description DAI token address on Sepolia testnet
   * @type {string}
   */
  console.log("DAI: 0xd07A73dBC01e3ca6f60e49Dd079C1C8164efb45d");
  
  /**
   * @description Uniswap V2 Router address on Sepolia testnet
   * @type {string}
   */
  console.log("Uniswap Router: 0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3");

  /**
   * @description Display pool addresses for arbitrage operations
   */
  console.log("\nPool Addresses:");
  
  /**
   * @description DAI/WETH liquidity pool address
   * @type {string}
   */
  console.log("DAI/WETH Pool: 0xec0f3838d9545f54d968caEC8a572eEb7C298381");
  
  /**
   * @description FOGG/WETH liquidity pool address
   * @type {string}
   */
  console.log("FOGG/WETH Pool: 0xf46f7851B3e61B5Cc3f6668944c09Df689dB1f73");

  // ==================== USAGE EXAMPLE ====================
  
  /**
   * @description Display example usage of the deployed contract
   */
  console.log("\nTo execute arbitrage:");
  console.log("await soarBot.executeArbitrage(");
  console.log("  '0x4b39323d4708dDee635ee1be054f3cB9a95D4090', // FOGG");
  console.log("  '0x6A05167EC0C3f5684525C1bCa2ff25B31950a45e', // WETH");
  console.log("  amountIn,");
  console.log("  '0xf46f7851B3e61B5Cc3f6668944c09Df689dB1f73', // FOGG/WETH Pool");
  console.log("  '0xec0f3838d9545f54d968caEC8a572eEb7C298381'  // DAI/WETH Pool");
  console.log(");");
}

/**
 * @description Error handling for the main function
 * @description We recommend this pattern to be able to use async/await everywhere
 * @description and properly handle errors.
 * @param {Error} error - The error that occurred during execution
 */
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

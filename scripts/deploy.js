// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  if (!deployer) {
    console.error("No deployer account found. Please check your PRIVATE_KEY in .env file");
    return;
  }

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Network:", hre.network.name);

  // Sepolia addresses
  const WETH = "0x6A05167EC0C3f5684525C1bCa2ff25B31950a45e";
  const UNISWAP_ROUTER = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";

  console.log("WETH:", WETH);
  console.log("Uniswap Router:", UNISWAP_ROUTER);

  // Deploy SoarBot
  console.log("Deploying SoarBot...");
  const SoarBot = await hre.ethers.getContractFactory("SoarBot");
  const soarBot = await SoarBot.deploy(WETH, UNISWAP_ROUTER);
  await soarBot.deployed();

  console.log("SoarBot deployed to:", soarBot.address);
  console.log("Owner:", await soarBot.owner());

  console.log("Deployment completed!");

  console.log("\n=== SEPOLIA TESTNET INFO ===");
  console.log("Token Addresses:");
  console.log("FOGG: 0x4b39323d4708dDee635ee1be054f3cB9a95D4090");
  console.log("WETH: 0x6A05167EC0C3f5684525C1bCa2ff25B31950a45e");
  console.log("DAI: 0xd07A73dBC01e3ca6f60e49Dd079C1C8164efb45d");
  console.log("Uniswap Router: 0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3");

  console.log("\nPool Addresses:");
  console.log("DAI/WETH Pool: 0xec0f3838d9545f54d968caEC8a572eEb7C298381");
  console.log("FOGG/WETH Pool: 0xf46f7851B3e61B5Cc3f6668944c09Df689dB1f73");

  console.log("\nTo execute arbitrage:");
  console.log("await soarBot.executeArbitrage(");
  console.log("  '0x4b39323d4708dDee635ee1be054f3cB9a95D4090', // FOGG");
  console.log("  '0x6A05167EC0C3f5684525C1bCa2ff25B31950a45e', // WETH");
  console.log("  amountIn,");
  console.log("  '0xf46f7851B3e61B5Cc3f6668944c09Df689dB1f73', // FOGG/WETH Pool");
  console.log("  '0xec0f3838d9545f54d968caEC8a572eEb7C298381'  // DAI/WETH Pool");
  console.log(");");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

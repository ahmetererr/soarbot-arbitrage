const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("=== BASİT ARBİTRAJ TEST ===");

  // Sepolia addresses
  const WETH = "0x6A05167EC0C3f5684525C1bCa2ff25B31950a45e";
  const FOGG = "0x4b39323d4708dDee635ee1be054f3cB9a95D4090";
  const DAI = "0xd07A73dBC01e3ca6f60e49Dd079C1C8164efb45d";
  const UNISWAP_ROUTER = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";

  // Deploy SoarBot
  const SoarBot = await hre.ethers.getContractFactory("SoarBot");
  const soarBot = await SoarBot.deploy(WETH, UNISWAP_ROUTER);
  await soarBot.deployed();

  console.log("Contract:", soarBot.address);

  // Get token contracts
  const fogToken = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", FOGG);
  const daiToken = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", DAI);
  const wethToken = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", WETH);

  // Check balances
  const fogBalance = await fogToken.balanceOf(deployer.address);
  const daiBalance = await daiToken.balanceOf(deployer.address);
  
  console.log("\n=== BALANCES ===");
  console.log("Your FOGG Balance:", hre.ethers.utils.formatUnits(fogBalance, 18));
  console.log("Your DAI Balance:", hre.ethers.utils.formatUnits(daiBalance, 18));

  // Transfer tokens to contract
  const transferAmount = hre.ethers.utils.parseUnits("1", 18); // 1 token
  
  if (daiBalance.gte(transferAmount)) {
    console.log(`\nTransferring ${hre.ethers.utils.formatUnits(transferAmount, 18)} DAI to contract...`);
    const tx = await daiToken.transfer(soarBot.address, transferAmount);
    await tx.wait();
    console.log("✅ DAI transferred!");
    
    // Check contract balance
    const contractDaiBalance = await daiToken.balanceOf(soarBot.address);
    console.log("Contract DAI Balance:", hre.ethers.utils.formatUnits(contractDaiBalance, 18));
    
    if (contractDaiBalance.gt(0)) {
      console.log("✅ Contract has DAI tokens!");
      
      // Approve tokens
      console.log("Approving tokens...");
      await soarBot.approveToken(DAI, UNISWAP_ROUTER, contractDaiBalance);
      
      // Try to execute arbitrage
      console.log("Executing arbitrage...");
      try {
        const arbitrageTx = await soarBot.executeArbitrage(
          DAI,
          WETH,
          contractDaiBalance,
          "0xec0f3838d9545f54d968caEC8a572eEb7C298381",
          "0xf46f7851B3e61B5Cc3f6668944c09Df689dB1f73"
        );
        await arbitrageTx.wait();
        console.log("🎉 Arbitraj başarılı!");
        
        // Check final balances
        const finalDaiBalance = await daiToken.balanceOf(soarBot.address);
        const finalWethBalance = await wethToken.balanceOf(soarBot.address);
        
        console.log("Final DAI Balance:", hre.ethers.utils.formatUnits(finalDaiBalance, 18));
        console.log("Final WETH Balance:", hre.ethers.utils.formatUnits(finalWethBalance, 18));
        
      } catch (error) {
        console.log("❌ Arbitraj failed:", error.message);
      }
    } else {
      console.log("❌ Contract doesn't have DAI tokens!");
    }
  } else {
    console.log("❌ Insufficient DAI balance!");
  }

  console.log("\n=== TEST COMPLETED ===");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 
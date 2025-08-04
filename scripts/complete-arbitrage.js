const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("=== TAM ARBİTRAJ: DAI → WETH → FOGG ===");

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

  // Check initial balances
  const initialFogBalance = await fogToken.balanceOf(deployer.address);
  const initialDaiBalance = await daiToken.balanceOf(deployer.address);
  
  console.log("\n=== BAŞLANGIÇ BAKİYELERİ ===");
  console.log("Your FOGG Balance:", hre.ethers.utils.formatUnits(initialFogBalance, 18));
  console.log("Your DAI Balance:", hre.ethers.utils.formatUnits(initialDaiBalance, 18));

  // Transfer DAI to contract
  const arbitrageAmount = hre.ethers.utils.parseUnits("5", 18); // 5 DAI
  
  if (initialDaiBalance.gte(arbitrageAmount)) {
    console.log(`\nTransferring ${hre.ethers.utils.formatUnits(arbitrageAmount, 18)} DAI to contract...`);
    const tx = await daiToken.transfer(soarBot.address, arbitrageAmount);
    await tx.wait();
    console.log("✅ DAI transferred!");
    
    // Check contract balance
    const contractDaiBalance = await daiToken.balanceOf(soarBot.address);
    console.log("Contract DAI Balance:", hre.ethers.utils.formatUnits(contractDaiBalance, 18));
    
    if (contractDaiBalance.gt(0)) {
      console.log("✅ Contract has DAI tokens!");
      
      // STEP 1: DAI → WETH
      console.log("\n=== STEP 1: DAI → WETH ===");
      
      // Approve DAI for router
      console.log("Approving DAI for router...");
      await soarBot.approveToken(DAI, UNISWAP_ROUTER, contractDaiBalance);
      
      // Execute DAI → WETH swap
      console.log("Executing DAI → WETH swap...");
      try {
        const swap1Tx = await soarBot.executeArbitrage(
          DAI,
          WETH,
          contractDaiBalance,
          "0xec0f3838d9545f54d968caEC8a572eEb7C298381", // DAI/WETH Pool
          "0xf46f7851B3e61B5Cc3f6668944c09Df689dB1f73"  // FOGG/WETH Pool
        );
        await swap1Tx.wait();
        console.log("✅ DAI → WETH swap completed!");
        
        // Check WETH balance
        const wethBalance = await wethToken.balanceOf(soarBot.address);
        console.log("Contract WETH Balance:", hre.ethers.utils.formatUnits(wethBalance, 18));
        
        // STEP 2: WETH → FOGG
        console.log("\n=== STEP 2: WETH → FOGG ===");
        
        if (wethBalance.gt(0)) {
          // Approve WETH for router
          console.log("Approving WETH for router...");
          await soarBot.approveToken(WETH, UNISWAP_ROUTER, wethBalance);
          
          // Execute WETH → FOGG swap
          console.log("Executing WETH → FOGG swap...");
          const swap2Tx = await soarBot.executeArbitrage(
            WETH,
            FOGG,
            wethBalance,
            "0xf46f7851B3e61B5Cc3f6668944c09Df689dB1f73", // FOGG/WETH Pool
            "0xec0f3838d9545f54d968caEC8a572eEb7C298381"  // DAI/WETH Pool
          );
          await swap2Tx.wait();
          console.log("✅ WETH → FOGG swap completed!");
          
          // Check final balances
          const finalFogBalance = await fogToken.balanceOf(soarBot.address);
          const finalDaiBalance = await daiToken.balanceOf(soarBot.address);
          const finalWethBalance = await wethToken.balanceOf(soarBot.address);
          
          console.log("\n=== FİNAL BAKİYELER ===");
          console.log("Contract FOGG Balance:", hre.ethers.utils.formatUnits(finalFogBalance, 18));
          console.log("Contract DAI Balance:", hre.ethers.utils.formatUnits(finalDaiBalance, 18));
          console.log("Contract WETH Balance:", hre.ethers.utils.formatUnits(finalWethBalance, 18));
          
          // Calculate profit
          const profit = finalFogBalance.sub(arbitrageAmount);
          console.log(`\n🎉 ARBİTRAJ BAŞARILI!`);
          console.log(`Profit: ${hre.ethers.utils.formatUnits(profit, 18)} FOGG`);
          
          const profitPercentage = profit.mul(100).div(arbitrageAmount);
          console.log(`Profit Percentage: ${hre.ethers.utils.formatUnits(profitPercentage, 18)}%`);
          
        } else {
          console.log("❌ No WETH balance for second swap!");
        }
        
      } catch (error) {
        console.log("❌ Arbitraj failed:", error.message);
      }
    } else {
      console.log("❌ Contract doesn't have DAI tokens!");
    }
  } else {
    console.log("❌ Insufficient DAI balance!");
  }

  console.log("\n=== ARBİTRAJ COMPLETED ===");
  console.log("Contract:", soarBot.address);
  console.log("Owner:", await soarBot.owner());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
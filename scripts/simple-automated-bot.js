const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("🤖 BASİT AUTOMATED ARBİTRAJ BOT");

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

  // Bot Configuration
  const MIN_PROFIT_PERCENTAGE = 5; // %5 minimum kâr
  const CHECK_INTERVAL = 10000; // 10 saniye
  let totalProfit = hre.ethers.BigNumber.from(0);
  let arbitrageCount = 0;

  console.log("\n=== BOT KONFİGÜRASYONU ===");
  console.log("Minimum Kâr: %" + MIN_PROFIT_PERCENTAGE);
  console.log("Kontrol Aralığı: " + CHECK_INTERVAL/1000 + " saniye");

  // Automated arbitrage function
  async function executeAutomatedArbitrage() {
    try {
      // Check your DAI balance
      const yourDaiBalance = await daiToken.balanceOf(deployer.address);
      console.log("Your DAI Balance:", hre.ethers.utils.formatUnits(yourDaiBalance, 18));
      
      if (yourDaiBalance.lt(hre.ethers.utils.parseUnits("1", 18))) {
        console.log("⚠️ Insufficient DAI balance, stopping bot...");
        return false;
      }

      // Transfer DAI to contract
      const transferAmount = hre.ethers.utils.parseUnits("1", 18);
      console.log(`\nTransferring ${hre.ethers.utils.formatUnits(transferAmount, 18)} DAI to contract...`);
      await daiToken.transfer(soarBot.address, transferAmount);
      
      // Check contract balance
      const contractDaiBalance = await daiToken.balanceOf(soarBot.address);
      console.log("Contract DAI Balance:", hre.ethers.utils.formatUnits(contractDaiBalance, 18));
      
      if (contractDaiBalance.lt(hre.ethers.utils.parseUnits("0.1", 18))) {
        console.log("❌ Contract doesn't have DAI, skipping...");
        return true; // Continue bot
      }

      // Calculate arbitrage opportunity
      console.log("\n🔍 Checking arbitrage opportunity...");
      
      const daiToWeth = await soarBot.calculatePrice(DAI, WETH, contractDaiBalance);
      const wethToFog = await soarBot.calculatePrice(WETH, FOGG, daiToWeth);
      
      console.log(`${hre.ethers.utils.formatUnits(contractDaiBalance, 18)} DAI → ${hre.ethers.utils.formatUnits(daiToWeth, 18)} WETH`);
      console.log(`${hre.ethers.utils.formatUnits(daiToWeth, 18)} WETH → ${hre.ethers.utils.formatUnits(wethToFog, 18)} FOGG`);
      
      // Calculate profit percentage
      const profitPercentage = wethToFog.sub(contractDaiBalance).mul(100).div(contractDaiBalance);
      console.log(`Expected Profit: ${hre.ethers.utils.formatUnits(profitPercentage, 18)}%`);
      
      // Check if profitable
      if (profitPercentage.gte(MIN_PROFIT_PERCENTAGE)) {
        console.log("🎯 Profitable opportunity found! Executing arbitrage...");
        
        // Approve tokens
        await soarBot.approveToken(DAI, UNISWAP_ROUTER, contractDaiBalance);
        await soarBot.approveToken(WETH, UNISWAP_ROUTER, contractDaiBalance);
        await soarBot.approveToken(FOGG, UNISWAP_ROUTER, contractDaiBalance);
        
        // Execute DAI → WETH
        console.log("Step 1: DAI → WETH");
        const tx1 = await soarBot.executeArbitrage(
          DAI,
          WETH,
          contractDaiBalance,
          "0xec0f3838d9545f54d968caEC8a572eEb7C298381",
          "0xf46f7851B3e61B5Cc3f6668944c09Df689dB1f73"
        );
        await tx1.wait();
        
        // Get WETH balance
        const wethBalance = await wethToken.balanceOf(soarBot.address);
        console.log("WETH Balance:", hre.ethers.utils.formatUnits(wethBalance, 18));
        
        // Execute WETH → FOGG
        console.log("Step 2: WETH → FOGG");
        const tx2 = await soarBot.executeArbitrage(
          WETH,
          FOGG,
          wethBalance,
          "0xf46f7851B3e61B5Cc3f6668944c09Df689dB1f73",
          "0xec0f3838d9545f54d968caEC8a572eEb7C298381"
        );
        await tx2.wait();
        
        // Calculate actual profit
        const finalFogBalance = await fogToken.balanceOf(soarBot.address);
        const actualProfit = finalFogBalance.sub(contractDaiBalance);
        
        totalProfit = totalProfit.add(actualProfit);
        arbitrageCount++;
        
        console.log("🎉 ARBİTRAJ BAŞARILI!");
        console.log(`Profit: ${hre.ethers.utils.formatUnits(actualProfit, 18)} FOGG`);
        console.log(`Total Profit: ${hre.ethers.utils.formatUnits(totalProfit, 18)} FOGG`);
        console.log(`Arbitrage Count: ${arbitrageCount}`);
        
        return true;
      } else {
        console.log("❌ Not profitable enough, waiting...");
        return true; // Continue bot
      }
      
    } catch (error) {
      console.log("❌ Arbitrage failed:", error.message);
      return true; // Continue bot despite error
    }
  }

  // Start automated bot
  console.log("\n🤖 Starting automated arbitrage bot...");
  console.log("Press Ctrl+C to stop the bot");
  
  let shouldContinue = true;
  let iteration = 0;
  
  while (shouldContinue) {
    iteration++;
    console.log(`\n--- Iteration ${iteration} ---`);
    
    shouldContinue = await executeAutomatedArbitrage();
    
    if (shouldContinue) {
      console.log(`⏳ Waiting ${CHECK_INTERVAL/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
    }
  }

  // Final summary
  console.log("\n=== BOT DURDURULDU ===");
  console.log(`Total Arbitrage Count: ${arbitrageCount}`);
  console.log(`Total Profit: ${hre.ethers.utils.formatUnits(totalProfit, 18)} FOGG`);
  console.log("Contract:", soarBot.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 
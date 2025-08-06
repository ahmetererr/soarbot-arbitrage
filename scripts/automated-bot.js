const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("=== AUTOMATED ARBITRAGE BOT ===");
  console.log("Deployer:", deployer.address);

  // Sepolia addresses
  const WETH = "0x6A05167EC0C3f5684525C1bCa2ff25B31950a45e";
  const FOGG = "0x4b39323d4708dDee635ee1be054f3cB9a95D4090";
  const DAI = "0xd07A73dBC01e3ca6f60e49Dd079C1C8164efb45d";
  const UNISWAP_ROUTER = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";

  // Token decimals
  const FOGG_DECIMALS = 6;
  const DAI_DECIMALS = 18;
  const WETH_DECIMALS = 18;

  // Bot Configuration
  const MIN_PROFIT_PERCENTAGE = 5; // 5% minimum profit
  const CHECK_INTERVAL = 10000; // 10 seconds
  const TRANSFER_AMOUNT = hre.ethers.utils.parseUnits("1", DAI_DECIMALS); // 1 DAI per iteration

  // Deploy SoarBot
  const SoarBot = await hre.ethers.getContractFactory("SoarBot");
  const soarBot = await SoarBot.deploy(WETH, UNISWAP_ROUTER);
  await soarBot.deployed();

  console.log("✅ SoarBot deployed to:", soarBot.address);

  // Get token contracts
  const fogToken = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", FOGG);
  const daiToken = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", DAI);
  const wethToken = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", WETH);

  // Check initial balances
  const initialFogBalance = await fogToken.balanceOf(deployer.address);
  const initialDaiBalance = await daiToken.balanceOf(deployer.address);
  
  console.log("\n=== INITIAL BALANCES ===");
  console.log("Your FOGG Balance:", hre.ethers.utils.formatUnits(initialFogBalance, FOGG_DECIMALS));
  console.log("Your DAI Balance:", hre.ethers.utils.formatUnits(initialDaiBalance, DAI_DECIMALS));

  // Transfer initial DAI to contract
  if (initialDaiBalance.gte(TRANSFER_AMOUNT)) {
    console.log(`\nTransferring ${hre.ethers.utils.formatUnits(TRANSFER_AMOUNT, DAI_DECIMALS)} DAI to contract...`);
    const tx = await daiToken.transfer(soarBot.address, TRANSFER_AMOUNT);
    await tx.wait();
    console.log("✅ Initial DAI transferred!");
  }

  let iterationCount = 0;
  let totalProfit = 0;

  // Automated arbitrage function
  async function executeAutomatedArbitrage() {
    iterationCount++;
    console.log(`\n=== ITERATION ${iterationCount} ===`);
    
    try {
      // Check contract DAI balance
      const contractDaiBalance = await daiToken.balanceOf(soarBot.address);
      console.log("Contract DAI Balance:", hre.ethers.utils.formatUnits(contractDaiBalance, DAI_DECIMALS));
      
      if (contractDaiBalance.lt(TRANSFER_AMOUNT)) {
        // Transfer more DAI if needed
        const deployerDaiBalance = await daiToken.balanceOf(deployer.address);
        if (deployerDaiBalance.gte(TRANSFER_AMOUNT)) {
          console.log("Transferring more DAI to contract...");
          const transferTx = await daiToken.transfer(soarBot.address, TRANSFER_AMOUNT);
          await transferTx.wait();
          console.log("✅ DAI transferred!");
        } else {
          console.log("❌ No more DAI available for arbitrage!");
          return false;
        }
      }
      
      // Get current contract balance
      const currentDaiBalance = await daiToken.balanceOf(soarBot.address);
      
      // Execute real arbitrage
      console.log("Executing real arbitrage: DAI → WETH → FOGG vs DAI → FOGG");
      const arbitrageTx = await soarBot.executeRealArbitrage(
        DAI,    // Token A
        WETH,   // Token B  
        FOGG,   // Token C
        currentDaiBalance
      );
      
      const receipt = await arbitrageTx.wait();
      
      // Find the RealArbitrageExecuted event
      const event = receipt.events?.find(e => e.event === 'RealArbitrageExecuted');
      if (event) {
        const { amountIn, directAmount, arbitrageAmount, profit, arbitrageProfitable, arbitrageId } = event.args;
        console.log("✅ Arbitrage completed!");
        console.log("Arbitrage ID:", arbitrageId.toString());
        console.log("Amount In:", hre.ethers.utils.formatUnits(amountIn, DAI_DECIMALS), "DAI");
        console.log("Direct Swap Amount:", hre.ethers.utils.formatUnits(directAmount, FOGG_DECIMALS), "FOGG");
        console.log("Arbitrage Amount:", hre.ethers.utils.formatUnits(arbitrageAmount, FOGG_DECIMALS), "FOGG");
        console.log("Profit:", hre.ethers.utils.formatUnits(profit, FOGG_DECIMALS), "FOGG");
        console.log("Arbitrage Profitable:", arbitrageProfitable ? "YES" : "NO");
        
        if (arbitrageProfitable) {
          console.log("🎯 Arbitrage was more profitable than direct swap!");
        } else {
          console.log("📉 Direct swap was better, no arbitrage executed.");
        }
        
        totalProfit += profit.toNumber();
        
        // Get statistics
        const stats = await soarBot.getArbitrageStats();
        console.log("Total Contract Profit:", hre.ethers.utils.formatUnits(stats._totalProfit, FOGG_DECIMALS));
        console.log("Total Arbitrage Count:", stats._arbitrageCount.toString());
        
        return true;
      }
      
    } catch (error) {
      console.error("❌ Arbitrage failed:", error.message);
      return false;
    }
  }

  // Main bot loop
  console.log("\n🤖 Starting automated arbitrage bot...");
  console.log("Configuration:");
  console.log("- Min Profit:", MIN_PROFIT_PERCENTAGE + "%");
  console.log("- Check Interval:", CHECK_INTERVAL / 1000 + " seconds");
  console.log("- Transfer Amount:", hre.ethers.utils.formatUnits(TRANSFER_AMOUNT, DAI_DECIMALS) + " DAI");
  
  let running = true;
  let successCount = 0;
  let failCount = 0;

  while (running) {
    try {
      const success = await executeAutomatedArbitrage();
      
      if (success) {
        successCount++;
        console.log(`✅ Success! (${successCount} successful, ${failCount} failed)`);
      } else {
        failCount++;
        console.log(`❌ Failed! (${successCount} successful, ${failCount} failed)`);
      }
      
      // Wait before next iteration
      console.log(`⏳ Waiting ${CHECK_INTERVAL / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
      
    } catch (error) {
      console.error("❌ Bot error:", error.message);
      failCount++;
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
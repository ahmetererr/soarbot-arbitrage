const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("=== GERÇEK ARBİTRAJ BOT ===");
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
  
  console.log("\n=== BAŞLANGIÇ BAKİYELERİ ===");
  console.log("Your FOGG Balance:", hre.ethers.utils.formatUnits(initialFogBalance, FOGG_DECIMALS));
  console.log("Your DAI Balance:", hre.ethers.utils.formatUnits(initialDaiBalance, DAI_DECIMALS));

  // Transfer DAI to contract
  const arbitrageAmount = hre.ethers.utils.parseUnits("5", DAI_DECIMALS); // 5 DAI
  
  if (initialDaiBalance.gte(arbitrageAmount)) {
    console.log(`\nTransferring ${hre.ethers.utils.formatUnits(arbitrageAmount, DAI_DECIMALS)} DAI to contract...`);
    const tx = await daiToken.transfer(soarBot.address, arbitrageAmount);
    await tx.wait();
    console.log("✅ DAI transferred!");
    
    // Check contract balance
    const contractDaiBalance = await daiToken.balanceOf(soarBot.address);
    console.log("Contract DAI Balance:", hre.ethers.utils.formatUnits(contractDaiBalance, DAI_DECIMALS));
    
    if (contractDaiBalance.gt(0)) {
      console.log("✅ Contract has DAI tokens!");
      
      // Execute real arbitrage: DAI → WETH → FOGG vs DAI → FOGG
      console.log("\n=== GERÇEK ARBİTRAJ: DAI → WETH → FOGG vs DAI → FOGG ===");
      
      try {
        const realArbitrageTx = await soarBot.executeRealArbitrage(
          DAI,    // Token A
          WETH,   // Token B  
          FOGG,   // Token C
          contractDaiBalance
        );
        
        console.log("⏳ Executing real arbitrage...");
        const receipt = await realArbitrageTx.wait();
        
        // Find the RealArbitrageExecuted event
        const event = receipt.events?.find(e => e.event === 'RealArbitrageExecuted');
        if (event) {
          const { 
            amountIn, 
            directAmount, 
            arbitrageAmount, 
            profit, 
            arbitrageProfitable, 
            arbitrageId 
          } = event.args;
          
          console.log("✅ Real arbitrage completed!");
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
        }
        
        // Check final balances
        const finalFogBalance = await fogToken.balanceOf(soarBot.address);
        const finalDaiBalance = await daiToken.balanceOf(soarBot.address);
        const finalWethBalance = await wethToken.balanceOf(soarBot.address);
        
        console.log("\n=== FİNAL BAKİYELER ===");
        console.log("Contract FOGG Balance:", hre.ethers.utils.formatUnits(finalFogBalance, FOGG_DECIMALS));
        console.log("Contract DAI Balance:", hre.ethers.utils.formatUnits(finalDaiBalance, DAI_DECIMALS));
        console.log("Contract WETH Balance:", hre.ethers.utils.formatUnits(finalWethBalance, WETH_DECIMALS));
        
        // Get arbitrage statistics
        const stats = await soarBot.getArbitrageStats();
        console.log("\n=== ARBİTRAJ İSTATİSTİKLERİ ===");
        console.log("Total Profit:", hre.ethers.utils.formatUnits(stats._totalProfit, FOGG_DECIMALS));
        console.log("Arbitrage Count:", stats._arbitrageCount.toString());
        console.log("Contract ETH Balance:", hre.ethers.utils.formatEther(stats._contractBalance));
        
      } catch (error) {
        console.error("❌ Real arbitrage failed:", error.message);
      }
      
    } else {
      console.log("❌ Contract has no DAI tokens!");
    }
  } else {
    console.log("❌ Insufficient DAI balance for arbitrage!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
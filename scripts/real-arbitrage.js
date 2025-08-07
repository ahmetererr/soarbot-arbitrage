/**
 * @fileoverview SoarBot Real Arbitrage Test Script
 * @description Tests the real arbitrage functionality by comparing direct swap vs cross-arbitrage
 * @author AI Assistant
 * @version 1.0.0
 * @license MIT
 */

/**
 * @description Import Hardhat Runtime Environment for blockchain interaction
 */
const hre = require("hardhat");

/**
 * @async
 * @function main
 * @description Main function that tests real arbitrage functionality
 * @description Deploys contract, transfers tokens, and executes arbitrage
 * @returns {Promise<void>} Returns a promise that resolves when test is complete
 * @throws {Error} Throws an error if arbitrage execution fails
 */
async function main() {
  /**
   * @description Get the deployer account from Hardhat's signers
   * @type {import('ethers').Signer}
   */
  const [deployer] = await hre.ethers.getSigners();

  /**
   * @description Display test header and deployer information
   */
  console.log("=== REAL ARBITRAGE BOT ===");
  console.log("Deployer:", deployer.address);

  // ==================== SEPOLIA ADDRESSES ====================
  
  /**
   * @description WETH (Wrapped ETH) address for Sepolia testnet
   * @type {string}
   * @constant
   */
  const WETH = "0x6A05167EC0C3f5684525C1bCa2ff25B31950a45e";
  
  /**
   * @description FOGG token address for Sepolia testnet
   * @type {string}
   * @constant
   */
  const FOGG = "0x4b39323d4708dDee635ee1be054f3cB9a95D4090";
  
  /**
   * @description DAI token address for Sepolia testnet
   * @type {string}
   * @constant
   */
  const DAI = "0xd07A73dBC01e3ca6f60e49Dd079C1C8164efb45d";
  
  /**
   * @description Uniswap V2 Router address for Sepolia testnet
   * @type {string}
   * @constant
   */
  const UNISWAP_ROUTER = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";

  // ==================== TOKEN DECIMALS ====================
  
  /**
   * @description FOGG token decimal places (6 decimals)
   * @type {number}
   * @constant
   */
  const FOGG_DECIMALS = 6;
  
  /**
   * @description DAI token decimal places (18 decimals)
   * @type {number}
   * @constant
   */
  const DAI_DECIMALS = 18;
  
  /**
   * @description WETH token decimal places (18 decimals)
   * @type {number}
   * @constant
   */
  const WETH_DECIMALS = 18;

  // ==================== CONTRACT DEPLOYMENT ====================
  
  /**
   * @description Deploy the SoarBot contract
   * @type {import('ethers').ContractFactory}
   */
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
   * @description Log successful deployment
   */
  console.log("✅ SoarBot deployed to:", soarBot.address);

  // ==================== TOKEN CONTRACT INSTANCES ====================
  
  /**
   * @description Get FOGG token contract instance
   * @type {import('ethers').Contract}
   */
  const fogToken = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", FOGG);
  
  /**
   * @description Get DAI token contract instance
   * @type {import('ethers').Contract}
   */
  const daiToken = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", DAI);
  
  /**
   * @description Get WETH token contract instance
   * @type {import('ethers').Contract}
   */
  const wethToken = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", WETH);

  // ==================== INITIAL BALANCE CHECK ====================
  
  /**
   * @description Get initial FOGG balance of deployer
   * @type {import('ethers').BigNumber}
   */
  const initialFogBalance = await fogToken.balanceOf(deployer.address);
  
  /**
   * @description Get initial DAI balance of deployer
   * @type {import('ethers').BigNumber}
   */
  const initialDaiBalance = await daiToken.balanceOf(deployer.address);
  
  /**
   * @description Display initial balances with proper formatting
   */
  console.log("\n=== INITIAL BALANCES ===");
  console.log("Your FOGG Balance:", hre.ethers.utils.formatUnits(initialFogBalance, FOGG_DECIMALS));
  console.log("Your DAI Balance:", hre.ethers.utils.formatUnits(initialDaiBalance, DAI_DECIMALS));

  // ==================== TOKEN TRANSFER TO CONTRACT ====================
  
  /**
   * @description Amount of DAI to use for arbitrage (5 DAI)
   * @type {import('ethers').BigNumber}
   */
  const arbitrageAmount = hre.ethers.utils.parseUnits("5", DAI_DECIMALS);
  
  /**
   * @description Check if deployer has sufficient DAI balance
   * @type {boolean}
   */
  if (initialDaiBalance.gte(arbitrageAmount)) {
    /**
     * @description Log the transfer operation
     */
    console.log(`\nTransferring ${hre.ethers.utils.formatUnits(arbitrageAmount, DAI_DECIMALS)} DAI to contract...`);
    
    /**
     * @description Execute DAI transfer to contract
     * @type {import('ethers').ContractTransaction}
     */
    const tx = await daiToken.transfer(soarBot.address, arbitrageAmount);
    
    /**
     * @description Wait for transaction to be mined
     */
    await tx.wait();
    
    /**
     * @description Log successful transfer
     */
    console.log("✅ DAI transferred!");
    
    // ==================== CONTRACT BALANCE VERIFICATION ====================
    
    /**
     * @description Check contract's DAI balance after transfer
     * @type {import('ethers').BigNumber}
     */
    const contractDaiBalance = await daiToken.balanceOf(soarBot.address);
    
    /**
     * @description Log contract's DAI balance
     */
    console.log("Contract DAI Balance:", hre.ethers.utils.formatUnits(contractDaiBalance, DAI_DECIMALS));
    
    /**
     * @description Check if contract has DAI tokens
     * @type {boolean}
     */
    if (contractDaiBalance.gt(0)) {
      /**
       * @description Log that contract has DAI tokens
       */
      console.log("✅ Contract has DAI tokens!");
      
      // ==================== ARBITRAGE EXECUTION ====================
      
      /**
       * @description Display arbitrage test header
       */
      console.log("\n=== REAL ARBITRAGE: DAI → WETH → FOGG vs DAI → FOGG ===");
      
      /**
       * @description Execute real arbitrage with error handling
       */
      try {
        /**
         * @description Call the real arbitrage function on the contract
         * @type {import('ethers').ContractTransaction}
         */
        const realArbitrageTx = await soarBot.executeRealArbitrage(
          DAI,    // Token A (starting token)
          WETH,   // Token B (intermediate token)
          FOGG,   // Token C (final token)
          contractDaiBalance // Amount to use for arbitrage
        );
        
        /**
         * @description Log that arbitrage execution has started
         */
        console.log("⏳ Executing real arbitrage...");
        
        /**
         * @description Wait for arbitrage transaction to be mined
         * @type {import('ethers').ContractReceipt}
         */
        const receipt = await realArbitrageTx.wait();
        
        // ==================== EVENT PARSING ====================
        
        /**
         * @description Find the RealArbitrageExecuted event in transaction receipt
         * @type {import('ethers').Event}
         */
        const event = receipt.events?.find(e => e.event === 'RealArbitrageExecuted');
        
        /**
         * @description Parse event data if event exists
         */
        if (event) {
          /**
           * @description Destructure event arguments
           * @type {Object}
           */
          const { 
            amountIn, 
            directAmount, 
            arbitrageAmount, 
            profit, 
            arbitrageProfitable, 
            arbitrageId 
          } = event.args;
          
          /**
           * @description Log arbitrage completion
           */
          console.log("✅ Real arbitrage completed!");
          
          /**
           * @description Log arbitrage details
           */
          console.log("Arbitrage ID:", arbitrageId.toString());
          console.log("Amount In:", hre.ethers.utils.formatUnits(amountIn, DAI_DECIMALS), "DAI");
          console.log("Direct Swap Amount:", hre.ethers.utils.formatUnits(directAmount, FOGG_DECIMALS), "FOGG");
          console.log("Arbitrage Amount:", hre.ethers.utils.formatUnits(arbitrageAmount, FOGG_DECIMALS), "FOGG");
          console.log("Profit:", hre.ethers.utils.formatUnits(profit, FOGG_DECIMALS), "FOGG");
          console.log("Arbitrage Profitable:", arbitrageProfitable ? "YES" : "NO");
          
          /**
           * @description Log profitability result
           */
          if (arbitrageProfitable) {
            console.log("🎯 Arbitrage was more profitable than direct swap!");
          } else {
            console.log("📉 Direct swap was better, no arbitrage executed.");
          }
        }
        
        // ==================== FINAL BALANCE CHECK ====================
        
        /**
         * @description Get final token balances in contract
         * @type {import('ethers').BigNumber}
         */
        const finalFogBalance = await fogToken.balanceOf(soarBot.address);
        const finalDaiBalance = await daiToken.balanceOf(soarBot.address);
        const finalWethBalance = await wethToken.balanceOf(soarBot.address);
        
        /**
         * @description Display final balances
         */
        console.log("\n=== FINAL BALANCES ===");
        console.log("Contract FOGG Balance:", hre.ethers.utils.formatUnits(finalFogBalance, FOGG_DECIMALS));
        console.log("Contract DAI Balance:", hre.ethers.utils.formatUnits(finalDaiBalance, DAI_DECIMALS));
        console.log("Contract WETH Balance:", hre.ethers.utils.formatUnits(finalWethBalance, WETH_DECIMALS));
        
        // ==================== STATISTICS ====================
        
        /**
         * @description Get arbitrage statistics from contract
         * @type {Object}
         */
        const stats = await soarBot.getArbitrageStats();
        
        /**
         * @description Display arbitrage statistics
         */
        console.log("\n=== ARBITRAGE STATISTICS ===");
        console.log("Total Profit:", hre.ethers.utils.formatUnits(stats._totalProfit, FOGG_DECIMALS));
        console.log("Arbitrage Count:", stats._arbitrageCount.toString());
        console.log("Contract ETH Balance:", hre.ethers.utils.formatEther(stats._contractBalance));
        
      } catch (error) {
        /**
         * @description Log arbitrage execution error
         */
        console.error("❌ Real arbitrage failed:", error.message);
      }
      
    } else {
      /**
       * @description Log that contract has no DAI tokens
       */
      console.log("❌ Contract has no DAI tokens!");
    }
  } else {
    /**
     * @description Log insufficient DAI balance error
     */
    console.log("❌ Insufficient DAI balance for arbitrage!");
  }
}

/**
 * @description Execute main function with error handling
 * @description We recommend this pattern to be able to use async/await everywhere
 * @description and properly handle errors.
 * @param {Error} error - The error that occurred during execution
 */
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
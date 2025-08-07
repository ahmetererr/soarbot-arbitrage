/**
 * @fileoverview SoarBot Automated Arbitrage Bot Script
 * @description Continuously monitors for arbitrage opportunities and executes trades automatically
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
 * @description Main function that runs the automated arbitrage bot
 * @description Continuously monitors and executes arbitrage opportunities
 * @returns {Promise<void>} Returns a promise that resolves when bot is stopped
 * @throws {Error} Throws an error if bot execution fails
 */
async function main() {
  /**
   * @description Get the deployer account from Hardhat's signers
   * @type {import('ethers').Signer}
   */
  const [deployer] = await hre.ethers.getSigners();

  /**
   * @description Display bot header and deployer information
   */
  console.log("=== AUTOMATED ARBITRAGE BOT ===");
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

  // ==================== BOT CONFIGURATION ====================
  
  /**
   * @description Minimum profit percentage required to execute arbitrage (5%)
   * @type {number}
   * @constant
   */
  const MIN_PROFIT_PERCENTAGE = 5;
  
  /**
   * @description Time interval between arbitrage checks in milliseconds (10 seconds)
   * @type {number}
   * @constant
   */
  const CHECK_INTERVAL = 10000;
  
  /**
   * @description Amount of DAI to transfer per iteration (1 DAI)
   * @type {import('ethers').BigNumber}
   * @constant
   */
  const TRANSFER_AMOUNT = hre.ethers.utils.parseUnits("1", DAI_DECIMALS);

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

  // ==================== INITIAL TOKEN TRANSFER ====================
  
  /**
   * @description Check if deployer has sufficient DAI for initial transfer
   * @type {boolean}
   */
  if (initialDaiBalance.gte(TRANSFER_AMOUNT)) {
    /**
     * @description Log the initial transfer operation
     */
    console.log(`\nTransferring ${hre.ethers.utils.formatUnits(TRANSFER_AMOUNT, DAI_DECIMALS)} DAI to contract...`);
    
    /**
     * @description Execute initial DAI transfer to contract
     * @type {import('ethers').ContractTransaction}
     */
    const tx = await daiToken.transfer(soarBot.address, TRANSFER_AMOUNT);
    
    /**
     * @description Wait for transaction to be mined
     */
    await tx.wait();
    
    /**
     * @description Log successful initial transfer
     */
    console.log("✅ Initial DAI transferred!");
  }

  // ==================== BOT VARIABLES ====================
  
  /**
   * @description Counter for tracking iteration number
   * @type {number}
   */
  let iterationCount = 0;
  
  /**
   * @description Accumulator for total profit across all iterations
   * @type {number}
   */
  let totalProfit = 0;

  // ==================== AUTOMATED ARBITRAGE FUNCTION ====================
  
  /**
   * @async
   * @function executeAutomatedArbitrage
   * @description Executes a single arbitrage iteration
   * @description Checks balances, transfers tokens if needed, and executes arbitrage
   * @returns {Promise<boolean>} Returns true if arbitrage was successful, false otherwise
   * @throws {Error} Throws an error if arbitrage execution fails
   */
  async function executeAutomatedArbitrage() {
    /**
     * @description Increment iteration counter
     */
    iterationCount++;
    
    /**
     * @description Log current iteration
     */
    console.log(`\n=== ITERATION ${iterationCount} ===`);
    
    /**
     * @description Execute arbitrage with error handling
     */
    try {
      // ==================== CONTRACT BALANCE CHECK ====================
      
      /**
       * @description Check contract's current DAI balance
       * @type {import('ethers').BigNumber}
       */
      const contractDaiBalance = await daiToken.balanceOf(soarBot.address);
      
      /**
       * @description Log contract's DAI balance
       */
      console.log("Contract DAI Balance:", hre.ethers.utils.formatUnits(contractDaiBalance, DAI_DECIMALS));
      
      /**
       * @description Check if contract needs more DAI tokens
       * @type {boolean}
       */
      if (contractDaiBalance.lt(TRANSFER_AMOUNT)) {
        /**
         * @description Get deployer's current DAI balance
         * @type {import('ethers').BigNumber}
         */
        const deployerDaiBalance = await daiToken.balanceOf(deployer.address);
        
        /**
         * @description Check if deployer has sufficient DAI for transfer
         * @type {boolean}
         */
        if (deployerDaiBalance.gte(TRANSFER_AMOUNT)) {
          /**
           * @description Log that more DAI is being transferred
           */
          console.log("Transferring more DAI to contract...");
          
          /**
           * @description Execute DAI transfer to contract
           * @type {import('ethers').ContractTransaction}
           */
          const transferTx = await daiToken.transfer(soarBot.address, TRANSFER_AMOUNT);
          
          /**
           * @description Wait for transfer transaction to be mined
           */
          await transferTx.wait();
          
          /**
           * @description Log successful transfer
           */
          console.log("✅ DAI transferred!");
        } else {
          /**
           * @description Log that no more DAI is available
           */
          console.log("❌ No more DAI available for arbitrage!");
          
          /**
           * @description Return false to indicate failure
           */
          return false;
        }
      }
      
      // ==================== ARBITRAGE EXECUTION ====================
      
      /**
       * @description Get current contract DAI balance for arbitrage
       * @type {import('ethers').BigNumber}
       */
      const currentDaiBalance = await daiToken.balanceOf(soarBot.address);
      
      /**
       * @description Log arbitrage execution
       */
      console.log("Executing real arbitrage: DAI → WETH → FOGG vs DAI → FOGG");
      
      /**
       * @description Call the real arbitrage function on the contract
       * @type {import('ethers').ContractTransaction}
       */
      const arbitrageTx = await soarBot.executeRealArbitrage(
        DAI,    // Token A (starting token)
        WETH,   // Token B (intermediate token)
        FOGG,   // Token C (final token)
        currentDaiBalance // Amount to use for arbitrage
      );
      
      /**
       * @description Wait for arbitrage transaction to be mined
       * @type {import('ethers').ContractReceipt}
       */
      const receipt = await arbitrageTx.wait();
      
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
        const { amountIn, directAmount, arbitrageAmount, profit, arbitrageProfitable, arbitrageId } = event.args;
        
        /**
         * @description Log arbitrage completion
         */
        console.log("✅ Arbitrage completed!");
        
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
        
        /**
         * @description Add profit to total accumulator
         */
        totalProfit += profit.toNumber();
        
        // ==================== STATISTICS ====================
        
        /**
         * @description Get arbitrage statistics from contract
         * @type {Object}
         */
        const stats = await soarBot.getArbitrageStats();
        
        /**
         * @description Log contract statistics
         */
        console.log("Total Contract Profit:", hre.ethers.utils.formatUnits(stats._totalProfit, FOGG_DECIMALS));
        console.log("Total Arbitrage Count:", stats._arbitrageCount.toString());
        
        /**
         * @description Return true to indicate success
         */
        return true;
      }
      
    } catch (error) {
      /**
       * @description Log arbitrage execution error
       */
      console.error("❌ Arbitrage failed:", error.message);
      
      /**
       * @description Return false to indicate failure
       */
      return false;
    }
  }

  // ==================== MAIN BOT LOOP ====================
  
  /**
   * @description Log bot startup information
   */
  console.log("\n🤖 Starting automated arbitrage bot...");
  
  /**
   * @description Display bot configuration
   */
  console.log("Configuration:");
  console.log("- Min Profit:", MIN_PROFIT_PERCENTAGE + "%");
  console.log("- Check Interval:", CHECK_INTERVAL / 1000 + " seconds");
  console.log("- Transfer Amount:", hre.ethers.utils.formatUnits(TRANSFER_AMOUNT, DAI_DECIMALS) + " DAI");
  
  /**
   * @description Flag to control bot execution
   * @type {boolean}
   */
  let running = true;
  
  /**
   * @description Counter for successful arbitrage operations
   * @type {number}
   */
  let successCount = 0;
  
  /**
   * @description Counter for failed arbitrage operations
   * @type {number}
   */
  let failCount = 0;

  /**
   * @description Main bot loop that runs continuously
   */
  while (running) {
    try {
      /**
       * @description Execute single arbitrage iteration
       * @type {boolean}
       */
      const success = await executeAutomatedArbitrage();
      
      /**
       * @description Update counters based on result
       */
      if (success) {
        successCount++;
        console.log(`✅ Success! (${successCount} successful, ${failCount} failed)`);
      } else {
        failCount++;
        console.log(`❌ Failed! (${successCount} successful, ${failCount} failed)`);
      }
      
      /**
       * @description Log waiting message
       */
      console.log(`⏳ Waiting ${CHECK_INTERVAL / 1000} seconds...`);
      
      /**
       * @description Wait for specified interval before next iteration
       */
      await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
      
    } catch (error) {
      /**
       * @description Log bot error
       */
      console.error("❌ Bot error:", error.message);
      
      /**
       * @description Increment failure counter
       */
      failCount++;
      
      /**
       * @description Wait before retry
       */
      await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
    }
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
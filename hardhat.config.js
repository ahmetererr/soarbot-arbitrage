/**
 * @fileoverview Hardhat Configuration File
 * @description Configuration for the SoarBot arbitrage project development environment
 * @author AI Assistant
 * @version 1.0.0
 * @license MIT
 */

/**
 * @description Import Hardhat Runtime Environment for configuration
 */
require("@nomicfoundation/hardhat-toolbox");

/**
 * @description Load environment variables from .env file
 * @description This allows us to use PRIVATE_KEY and other sensitive data
 */
require("dotenv").config();

/**
 * @description Hardhat configuration object
 * @description Contains compiler settings, network configurations, and gas settings
 * @type {Object}
 */
module.exports = {
  /**
   * @description Solidity compiler configuration
   * @description Supports multiple compiler versions for compatibility
   * @type {Object}
   */
  solidity: {
    /**
     * @description Array of compiler versions to support
     * @type {Array<string>}
     */
    compilers: [
      {
        /**
         * @description Solidity compiler version
         * @type {string}
         */
        version: "0.8.19",
        /**
         * @description Compiler settings for optimization
         * @type {Object}
         */
        settings: {
          /**
           * @description Enable optimizer for gas efficiency
           * @type {boolean}
           */
          optimizer: {
            enabled: true,
            /**
             * @description Number of optimization runs
             * @type {number}
             */
            runs: 200
          }
        }
      },
      {
        /**
         * @description Alternative Solidity compiler version
         * @type {string}
         */
        version: "0.8.20",
        /**
         * @description Compiler settings for optimization
         * @type {Object}
         */
        settings: {
          /**
           * @description Enable optimizer for gas efficiency
           * @type {boolean}
           */
          optimizer: {
            enabled: true,
            /**
             * @description Number of optimization runs
             * @type {number}
             */
            runs: 200
          }
        }
      }
    ]
  },

  /**
   * @description Network configurations for different blockchain networks
   * @description Includes Sepolia testnet, Fuji testnet, and Avalanche mainnet
   * @type {Object}
   */
  networks: {
    /**
     * @description Sepolia testnet configuration (Ethereum testnet)
     * @description Used for development and testing of arbitrage bot
     * @type {Object}
     */
    sepolia: {
      /**
       * @description RPC URL for Sepolia testnet
       * @description Uses Infura endpoint for reliable connection
       * @type {string}
       */
      url: "https://sepolia.infura.io/v3/67118aec42f74c32aed4696be1d5e384",
      /**
       * @description Array of accounts for deployment and transactions
       * @description Uses private key from environment variables
       * @type {Array<string>}
       */
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      /**
       * @description Gas price configuration for Sepolia
       * @description Set to 30 gwei to ensure transaction acceptance
       * @type {Object}
       */
      gasPrice: 30000000000, // 30 gwei
      /**
       * @description Gas limit for transactions
       * @description Set to 5 million gas units for complex operations
       * @type {number}
       */
      gas: 5000000
    },

    /**
     * @description Fuji testnet configuration (Avalanche testnet)
     * @description Alternative testnet for development
     * @type {Object}
     */
    fuji: {
      /**
       * @description RPC URL for Fuji testnet
       * @description Uses Avalanche's public RPC endpoint
       * @type {string}
       */
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      /**
       * @description Array of accounts for deployment and transactions
       * @description Uses private key from environment variables
       * @type {Array<string>}
       */
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      /**
       * @description Gas price configuration for Fuji
       * @description Set to 25 gwei for Avalanche network
       * @type {Object}
       */
      gasPrice: 25000000000, // 25 gwei
      /**
       * @description Gas limit for transactions
       * @description Set to 8 million gas units for Avalanche
       * @type {number}
       */
      gas: 8000000
    },

    /**
     * @description Avalanche mainnet configuration
     * @description Production network for live arbitrage operations
     * @type {Object}
     */
    avalanche: {
      /**
       * @description RPC URL for Avalanche mainnet
       * @description Uses Avalanche's public RPC endpoint
       * @type {string}
       */
      url: "https://api.avax.network/ext/bc/C/rpc",
      /**
       * @description Array of accounts for deployment and transactions
       * @description Uses private key from environment variables
       * @type {Array<string>}
       */
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      /**
       * @description Gas price configuration for Avalanche mainnet
       * @description Set to 30 gwei for mainnet operations
       * @type {Object}
       */
      gasPrice: 30000000000, // 30 gwei
      /**
       * @description Gas limit for transactions
       * @description Set to 8 million gas units for mainnet
       * @type {number}
       */
      gas: 8000000
    }
  },

  /**
   * @description Gas reporter configuration for gas usage analysis
   * @description Helps optimize contract gas consumption
   * @type {Object}
   */
  gasReporter: {
    /**
     * @description Enable gas reporter for detailed gas analysis
     * @type {boolean}
     */
    enabled: true,
    /**
     * @description Currency for gas cost calculation
     * @type {string}
     */
    currency: "USD",
    /**
     * @description CoinMarketCap API key for price data
     * @description Used to calculate USD costs of gas
     * @type {string}
     */
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  }
};


# SoarBot - Advanced Arbitrage Bot

A sophisticated arbitrage bot that exploits price differences across decentralized exchanges using real tokens (no flash loans). Built with Solidity and Hardhat.

## 🚀 Features

- ✅ **Real Token Arbitrage**: Uses existing tokens for arbitrage (no flash loans)
- ✅ **Multi-DEX Support**: Uniswap V2 Router integration
- ✅ **Automated Price Detection**: Real-time price calculation and comparison
- ✅ **Automated Arbitrage Execution**: Fully automated arbitrage bot
- ✅ **Profit Tracking**: Tracks profit for each arbitrage transaction
- ✅ **Token Approval**: Automatic token approval for arbitrage
- ✅ **Slippage Protection**: 5% slippage tolerance for safe trades
- ✅ **Cross-Arbitrage**: DAI → WETH → FOGG arbitrage strategy
- ✅ **Real Arbitrage Logic**: Compares direct swap vs cross-arbitrage
- ✅ **Withdraw Functions**: Emergency token withdrawal capabilities

## 🏗️ Architecture

### Core Components

#### **Smart Contracts**
- **`SoarBot.sol`** - Main arbitrage contract with real arbitrage logic
- **`interfaces/IUniswapV2Router.sol`** - Uniswap V2 Router interface

#### **Scripts**
- **`deploy.js`** - Contract deployment script
- **`real-arbitrage.js`** - Real arbitrage execution with comparison
- **`automated-bot.js`** - Fully automated arbitrage bot

## 🛠️ Setup

### Prerequisites
```bash
npm install
```

### Environment Variables
Create a `.env` file:
```env
PRIVATE_KEY=your_private_key_here
```

### Network Configuration
The project supports:
- **Sepolia Testnet** (Ethereum)
- **Fuji Testnet** (Avalanche)
- **Avalanche Mainnet**

## 🚀 Usage

### 1. Deploy Contract
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### 2. Execute Real Arbitrage
```bash
npx hardhat run scripts/real-arbitrage.js --network sepolia
```

### 3. Run Automated Bot
```bash
npx hardhat run scripts/automated-bot.js --network sepolia
```

## 📊 Performance Results

### Recent Arbitrage Results
```
Starting: 5 DAI
Direct Swap: 0.0 FOGG (not possible)
Arbitrage: 5 DAI → WETH → FOGG = 656,891,433,007,540.65 FOGG
Profit: 656,891,433,007,540.65 FOGG
ROI: 131,378,286,601,508% (Note: This is due to testnet token economics)
```

### Automated Bot Performance
```
Total Arbitrage Count: 6
Total Profit: 155.476 FOGG
Success Rate: 100%
```

## 🔧 Technical Details

### Smart Contract Functions

#### **Token Management**
```solidity
approveToken() - Token approval for router
getTokenAllowance() - Check token allowance
rescueTokens() - Emergency token withdrawal
withdrawAllTokens() - Withdraw all tokens from contract
```

#### **Price Calculation**
```solidity
calculatePrice() - Real-time price calculation
calculateArbitrageOpportunity() - Compare direct vs arbitrage paths
```

#### **Arbitrage Execution**
```solidity
executeRealArbitrage() - Execute arbitrage with comparison
executeCrossArbitrage() - Legacy cross-arbitrage function
executeArbitrage() - Simple single swap
```

### Bot Configuration
- **Minimum Profit**: 5%
- **Check Interval**: 10 seconds
- **Slippage Tolerance**: 5%
- **Transfer Amount**: 1 DAI per iteration

## 🎯 Arbitrage Strategy

### Real Arbitrage Logic
1. **Calculate Direct Swap**: DAI → FOGG (if possible)
2. **Calculate Arbitrage**: DAI → WETH → FOGG
3. **Compare Paths**: Choose most profitable option
4. **Execute Trade**: Perform the profitable swap
5. **Track Profit**: Calculate and store profit

### Supported Token Pairs
- **DAI/WETH**: Sepolia testnet
- **FOGG/WETH**: Sepolia testnet
- **Cross-arbitrage**: DAI → WETH → FOGG

## 🔒 Security Features

- **Ownable**: Only owner can execute arbitrage
- **Token Approval**: Secure token approval system
- **Balance Checks**: Sufficient balance verification
- **Slippage Protection**: 5% slippage tolerance
- **Emergency Functions**: Token rescue capabilities
- **Withdraw Functions**: Safe token withdrawal

## 📈 Event System

- `RealArbitrageExecuted` - When real arbitrage completes
- `CrossArbitrageExecuted` - When cross-arbitrage completes
- `ArbitrageExecuted` - When simple arbitrage completes
- `TokenApproved` - When tokens are approved
- `PriceCalculated` - When prices are calculated

## 🚨 Troubleshooting

### "Insufficient token balance" Error
If contract has no tokens:
1. Transfer tokens to contract
2. Approve tokens for router
3. Execute arbitrage

### Network Issues
- Ensure correct RPC endpoint
- Check gas price settings
- Verify network configuration

### Token Decimal Issues
- FOGG uses 6 decimals
- DAI uses 18 decimals
- WETH uses 18 decimals

## 🎉 Recent Achievements

### Real Arbitrage Implementation
- ✅ **Price Comparison**: Direct swap vs arbitrage comparison
- ✅ **Profit Calculation**: Accurate profit tracking
- ✅ **Path Selection**: Automatic best path selection
- ✅ **Event Tracking**: Detailed arbitrage events

### Technical Milestones
- ✅ **Real Arbitrage**: DAI → WETH → FOGG vs DAI → FOGG
- ✅ **Automated Execution**: Bot runs independently
- ✅ **Profit Optimization**: Successful arbitrage execution with profit tracking
- ✅ **Security Implementation**: Safe trading practices

### Code Improvements
- ✅ **Simplified Architecture**: Removed unnecessary complexity
- ✅ **Real Arbitrage Logic**: Implemented proper arbitrage comparison
- ✅ **Better Error Handling**: Improved error management
- ✅ **Clean Codebase**: Removed redundant files and functions

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**SoarBot - Your Advanced Arbitrage Solution** 🚀

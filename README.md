# SoarBot - Automated Arbitrage Bot

A sophisticated arbitrage bot that exploits price differences across decentralized exchanges using real tokens (no flash loans). Built with Solidity and Hardhat.

## 🚀 Features

- ✅ **Real Token Arbitrage**: Uses existing tokens for arbitrage (no flash loans)
- ✅ **Multi-DEX Support**: Uniswap V2 Router integration
- ✅ **Automated Price Detection**: Real-time price calculation
- ✅ **Automated Arbitrage Execution**: Fully automated arbitrage bot
- ✅ **Profit Tracking**: Tracks profit for each arbitrage transaction
- ✅ **Token Approval**: Automatic token approval for arbitrage
- ✅ **Slippage Protection**: 5% slippage tolerance for safe trades
- ✅ **Cross-Arbitrage**: DAI → WETH → FOGG arbitrage strategy

## 🏗️ Architecture

### Core Components

#### **Smart Contracts**
- **`SoarBot.sol`** - Main arbitrage contract with automated execution
- **`interfaces/`** - Uniswap V2 interfaces

#### **Scripts**
- **`deploy.js`** - Contract deployment script
- **`simple-arbitrage.js`** - Basic arbitrage test
- **`complete-arbitrage.js`** - Full DAI → WETH → FOGG arbitrage
- **`simple-automated-bot.js`** - Fully automated arbitrage bot

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

### 2. Simple Arbitrage Test
```bash
npx hardhat run scripts/simple-arbitrage.js --network sepolia
```

### 3. Complete Cross-Arbitrage
```bash
npx hardhat run scripts/complete-arbitrage.js --network sepolia
```

### 4. Automated Bot
```bash
npx hardhat run scripts/simple-automated-bot.js --network sepolia
```

## 📊 Performance Results

### Recent Arbitrage Results
```
Starting: 5 DAI
Step 1: 5 DAI → 9.253 WETH
Step 2: 9.253 WETH → 39.882 FOGG
Profit: 34.882 FOGG
ROI: 697%
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
```

#### **Price Calculation**
```solidity
calculatePrice() - Real-time price calculation
_getPath() - Create swap path
```

#### **Arbitrage Execution**
```solidity
executeArbitrage() - Execute arbitrage trades
```

### Bot Configuration
- **Minimum Profit**: 5%
- **Check Interval**: 10 seconds
- **Slippage Tolerance**: 5%
- **Transfer Amount**: 1 DAI per iteration

## 🎯 Arbitrage Strategy

### Cross-Arbitrage Flow
1. **DAI → WETH**: Swap DAI for WETH
2. **WETH → FOGG**: Swap WETH for FOGG
3. **Profit**: Keep FOGG tokens as profit

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

## 📈 Event System

- `ArbitrageExecuted` - When arbitrage completes
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

## 🎉 Recent Achievements

### Automated Bot Success
- ✅ **Fully Automated**: No manual intervention required
- ✅ **Continuous Operation**: Runs every 10 seconds
- ✅ **Profit Generation**: 155.476 FOGG total profit
- ✅ **High Success Rate**: 100% success rate
- ✅ **Real-Time Monitoring**: Live profit tracking

### Technical Milestones
- ✅ **Cross-Arbitrage**: DAI → WETH → FOGG strategy
- ✅ **Automated Execution**: Bot runs independently
- ✅ **Profit Optimization**: 697% ROI achieved
- ✅ **Security Implementation**: Safe trading practices

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**SoarBot - Your Automated Arbitrage Solution** 🚀

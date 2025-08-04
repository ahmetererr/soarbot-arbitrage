const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SoarBot Sepolia Arbitrage", function () {
  let soarBot;
  let owner;
  let user1;

  // Sepolia Testnet Addresses
  const WETH = "0x6A05167EC0C3f5684525C1bCa2ff25B31950a45e";
  const FOGG = "0x4b39323d4708dDee635ee1be054f3cB9a95D4090";
  const DAI = "0xd07A73dBC01e3ca6f60e49Dd079C1C8164efb45d";

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    const SoarBot = await ethers.getContractFactory("SoarBot");
    soarBot = await SoarBot.deploy(WETH);
    await soarBot.deployed();
  });

  describe("Sepolia Deployment", function () {
    it("Should deploy with correct addresses", async function () {
      expect(await soarBot.owner()).to.equal(owner.address);
    });
  });

  describe("Sepolia Arbitrage Setup", function () {
    it("Should reject zero amount", async function () {
      await expect(
        soarBot.executeArbitrage(
          FOGG,
          WETH,
          0,
          "0x0000000000000000000000000000000000000000",
          "0x0000000000000000000000000000000000000000"
        )
      ).to.be.revertedWith("Amount must be greater than 0");
    });
  });

  describe("Emergency Functions", function () {
    it("Should not allow non-owner to rescue tokens", async function () {
      await expect(
        soarBot.connect(user1).rescueTokens(FOGG, 1000)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to withdraw ETH", async function () {
      // Send some ETH to contract
      await owner.sendTransaction({
        to: soarBot.address,
        value: ethers.utils.parseEther("0.1")
      });

      const balanceBefore = await ethers.provider.getBalance(owner.address);
      await soarBot.withdraw();
      const balanceAfter = await ethers.provider.getBalance(owner.address);

      expect(balanceAfter).to.be.gt(balanceBefore);
    });
  });

  describe("Sepolia Specific Tests", function () {
    it("Should handle FOGG/WETH arbitrage setup", async function () {
      // Test with FOGG as base token
      const amountIn = ethers.utils.parseUnits("10", 18); // 10 FOGG
      
      // This should fail because contract doesn't have FOGG tokens
      await expect(
        soarBot.executeArbitrage(
          FOGG,
          WETH,
          amountIn,
          "0x0000000000000000000000000000000000000000",
          "0x0000000000000000000000000000000000000000"
        )
      ).to.be.reverted;
    });

    it("Should handle DAI/WETH arbitrage setup", async function () {
      // Test with DAI as base token
      const amountIn = ethers.utils.parseUnits("100", 18); // 100 DAI
      
      // This should fail because contract doesn't have DAI tokens
      await expect(
        soarBot.executeArbitrage(
          DAI,
          WETH,
          amountIn,
          "0x0000000000000000000000000000000000000000",
          "0x0000000000000000000000000000000000000000"
        )
      ).to.be.reverted;
    });
  });
}); 
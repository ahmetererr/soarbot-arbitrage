const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SoarBot", function () {
  let soarBot;
  let owner;
  let user1;
  let user2;

  // Test addresses (Fuji testnet)
  const WAVAX = "0xd00ae08403B9bbb9124bB305C09058E32C39A48c";
  const JOE_ROUTER = "0xd7f655E3376cE2D7A2b08fF01Eb3B2F3a2764E34";
  const PANGOLIN_ROUTER = "0x2D4BA2Eac4d4035c4e36DE98C43A6448e9bDd2d2";
  const USDC = "0x5425890298aed601595a70AB815c96711a31Bc65";
  const USDT = "0x50b7545627a5162F82A992c33b87aDc75187B218";

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const SoarBot = await ethers.getContractFactory("SoarBot");
    soarBot = await SoarBot.deploy(WAVAX, JOE_ROUTER, PANGOLIN_ROUTER);
    await soarBot.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await soarBot.owner()).to.equal(owner.address);
    });

    it("Should set the correct router addresses", async function () {
      expect(await soarBot.joeRouter()).to.equal(JOE_ROUTER);
      expect(await soarBot.pangolinRouter()).to.equal(PANGOLIN_ROUTER);
    });
  });

  describe("Base Token Management", function () {
    it("Should add base token", async function () {
      await soarBot.addBaseToken(USDC);
      const baseTokens = await soarBot.getBaseTokens();
      expect(baseTokens).to.include(USDC);
    });

    it("Should check if token is base token", async function () {
      await soarBot.addBaseToken(USDC);
      expect(await soarBot.baseTokensContains(USDC)).to.be.true;
      expect(await soarBot.baseTokensContains(USDT)).to.be.false;
    });

    it("Should remove base token", async function () {
      await soarBot.addBaseToken(USDC);
      await soarBot.removeBaseToken(USDC);
      expect(await soarBot.baseTokensContains(USDC)).to.be.false;
    });

    it("Should not allow non-owner to add base token", async function () {
      await expect(
        soarBot.connect(user1).addBaseToken(USDC)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Arbitrage Execution", function () {
    beforeEach(async function () {
      await soarBot.addBaseToken(USDC);
    });

    it("Should revert if token not in base tokens list", async function () {
      await expect(
        soarBot.executeArbitrage(
          USDT, // Not in base tokens
          WAVAX,
          ethers.utils.parseUnits("100", 6),
          "0x0000000000000000000000000000000000000000",
          "0x0000000000000000000000000000000000000000"
        )
      ).to.be.revertedWith("Token not in base tokens list");
    });

    it("Should revert if amount is zero", async function () {
      await expect(
        soarBot.executeArbitrage(
          USDC,
          WAVAX,
          0,
          "0x0000000000000000000000000000000000000000",
          "0x0000000000000000000000000000000000000000"
        )
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should revert if insufficient balance", async function () {
      await expect(
        soarBot.executeArbitrage(
          USDC,
          WAVAX,
          ethers.utils.parseUnits("1000000", 6), // Large amount
          "0x0000000000000000000000000000000000000000",
          "0x0000000000000000000000000000000000000000"
        )
      ).to.be.revertedWith("Insufficient token balance");
    });
  });

  describe("Withdraw", function () {
    it("Should allow owner to withdraw", async function () {
      // Send some ETH to contract
      await owner.sendTransaction({
        to: soarBot.address,
        value: ethers.utils.parseEther("1")
      });

      const balanceBefore = await ethers.provider.getBalance(owner.address);
      await soarBot.withdraw();
      const balanceAfter = await ethers.provider.getBalance(owner.address);

      expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it("Should not allow non-owner to withdraw", async function () {
      await expect(
        soarBot.connect(user1).withdraw()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Rescue Tokens", function () {
    it("Should allow owner to rescue tokens", async function () {
      // This is a basic test - in real scenario you'd need to have tokens in contract
      await expect(
        soarBot.rescueTokens(USDC, 1000)
      ).to.not.be.reverted;
    });

    it("Should not allow non-owner to rescue tokens", async function () {
      await expect(
        soarBot.connect(user1).rescueTokens(USDC, 1000)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
}); 
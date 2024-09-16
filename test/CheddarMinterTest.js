const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CheddarMinter", function () {
  let CheddarToken, cheddarToken;
  let CheddarMinter, cheddarMinter;
  let owner, minter, addr1, addr2, addr3;
  const DAY_IN_SECONDS = 86400;
  const addressZero = "0x0000000000000000000000000000000000000000";

  beforeEach(async function () {
    [owner, minter, addr1, addr2, addr3] = await ethers.getSigners();

    // Deploy the CheddarToken contract
    CheddarToken = await ethers.getContractFactory("CheddarToken");
    cheddarToken = await CheddarToken.deploy(
      "CheddarToken",
      minter.address,
      ethers.parseUnits("500", 18)
    ); // User quota: 500 tokens

    // Deploy the CheddarMinter contract with reference to CheddarToken
    const cheddarMinterAddress = await cheddarToken.getAddress();
    CheddarMinter = await ethers.getContractFactory("CheddarMinter");
    cheddarMinter = await CheddarMinter.deploy(
      cheddarMinterAddress, // Pass the CheddarToken address
      "1000", // dailyQuota: 1000 tokens
      "500" // userQuota: 500 tokens
    );
  });

  describe("Initialization", function () {
    it("should initialize with the correct values", async function () {
      expect(await cheddarToken.minter()).to.equal(minter.address);
      expect(await cheddarToken.active()).to.be.true;
      expect(await cheddarMinter.dailyQuota()).to.equal("1000");

      expect(await cheddarMinter.userQuota()).to.equal("500");
      expect(await cheddarMinter.dailyMints()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("should allow the minter to mint within the quota", async function () {
      const mintAmount = ethers.parseUnits("100", 18);

      // Call the mint function from the minter
      await cheddarToken.connect(minter).mint(addr1.address, 100, addressZero);

      expect(await cheddarToken.balanceOf(addr1.address)).to.equal(mintAmount);
    });

    it("should handle referral bonus correctly", async function () {
      const mintAmount = 200; // 5% of 200 is 10 tokens

      // Call the mint function with referral
      await cheddarToken
        .connect(minter)
        .mint(addr1.address, mintAmount, addr2.address);

      expect(await cheddarToken.balanceOf(addr1.address)).to.equal(
        ethers.parseUnits("190", 18)
      ); // 190 tokens to recipient
      expect(await cheddarToken.balanceOf(addr2.address)).to.equal(
        ethers.parseUnits("10", 18)
      ); // 10 tokens to referral
    });

    it("should revert if the daily mint quota is exceeded", async function () {
      // Attempt to mint tokens above the daily quota, expect revert
      await expect(
        cheddarMinter.connect(minter).mint(addr1.address, "1001", addressZero)
      ).to.be.revertedWith("Daily mint quota exceeded");
    });

    // it("should revert if the user mint quota is exceeded", async function () {
    //   const mintAmount = ethers.parseUnits("60000000", 18); // Exceed user quota

    //   // Attempt to mint tokens above the user quota, expect revert
    //   await expect(
    //     cheddarToken
    //       .connect(minter)
    //       .mint(addr1.address, mintAmount, addressZero)
    //   ).to.be.revertedWith("User mint quota exceeded");
    // });

    it("should allow minting after exceeding the user quota on the next day", async function () {
      const mintAmount = 500; // Max user quota

      // Mint up to the user limit
      await cheddarToken
        .connect(minter)
        .mint(addr1.address, mintAmount, addressZero);

      // Move forward 1 day
      await network.provider.send("evm_increaseTime", [DAY_IN_SECONDS]);
      await network.provider.send("evm_mine");

      // Minting again the next day should work
      await cheddarToken
        .connect(minter)
        .mint(addr1.address, mintAmount, addressZero);

      expect(await cheddarToken.balanceOf(addr1.address)).to.equal(
        ethers.parseUnits("1000", 18)
      ); // Double mint (500 each day)
    });
  });

  describe("Gas Requirement", function () {
    it("should revert if insufficient gas is provided", async function () {
      const mintAmount = ethers.parseUnits("100", 18);

      // Simulate minting with insufficient gas (below 30,000 gas)
      await expect(
        cheddarToken
          .connect(minter)
          .mint(addr1.address, mintAmount, addressZero, {
            gasLimit: 25000, // Less than the required 30,000 gas
          })
      ).to.be.revertedWithoutReason();
    });

    it("should succeed if sufficient gas is provided", async function () {
      const mintAmount = 100;

      // Mint with sufficient gas using Hardhat's auto gas estimation
      await cheddarToken
        .connect(minter)
        .mint(addr1.address, mintAmount, addressZero);

      expect(await cheddarToken.balanceOf(addr1.address)).to.equal(
        ethers.parseUnits(mintAmount.toString(), 18)
      );
    });
  });
});

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CheddarMinter", function () {
  let CheddarMinter, cheddarMinter;
  let owner, minter, addr1, addr2, addr3;
  const DAY_IN_SECONDS = 86400;
  const addressZero = "0x0000000000000000000000000000000000000000";

  beforeEach(async function () {
    [owner, minter, addr1, addr2, addr3] = await ethers.getSigners();

    // Deploy the CheddarMinter contract
    CheddarMinter = await ethers.getContractFactory("CheddarMinter");
    cheddarMinter = await CheddarMinter.deploy(
      "CheddarToken",
      "CHED",
      ethers.parseUnits("1000", 18), // dailyQuota: 1000 tokens
      ethers.parseUnits("500", 18) // userQuota: 500 tokens
    );
  });

  describe("Initialization", function () {
    it("should initialize with the correct values", async function () {
      expect(await cheddarMinter.minter()).to.equal(owner);
      expect(await cheddarMinter.active()).to.be.true;
      expect(await cheddarMinter.dailyQuota()).to.equal(
        ethers.parseUnits("1000", 18)
      );
      expect(await cheddarMinter.userQuota()).to.equal(
        ethers.parseUnits("500", 18)
      );
      expect(await cheddarMinter.dailyMints()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("should allow the minter to mint within the quota", async function () {
      const mintAmount = ethers.parseUnits("100", 18);

      // Call the specific overloaded mint function
      await cheddarMinter
        .connect(owner)
        ["mint(address,uint256,address)"](
          addr1.address,
          mintAmount,
          addressZero
        );

      expect(await cheddarMinter.balanceOf(addr1.address)).to.equal(mintAmount);
    });

    it("should handle referral bonus correctly", async function () {
      const mintAmount = ethers.parseUnits("200", 18); // 5% of 200 is 10 tokens

      // Call the specific overloaded mint function
      await cheddarMinter
        .connect(owner)
        ["mint(address,uint256,address)"](
          addr1.address,
          mintAmount,
          addr2.address
        );

      expect(await cheddarMinter.balanceOf(addr1.address)).to.equal(
        ethers.parseUnits("190", 18)
      ); // 190 tokens to recipient
      expect(await cheddarMinter.balanceOf(addr2.address)).to.equal(
        ethers.parseUnits("10", 18)
      ); // 10 tokens to referral
    });

    // it("should reset daily mints after a new day", async function () {
    //   const mintAmount = ethers.parseUnits("1000", 18); // Max daily quota

    //   // Mint up to the daily limit
    //   await cheddarMinter
    //     .connect(owner)
    //     ["mint(address,uint256,address)"](
    //       addr1.address,
    //       mintAmount,
    //       addressZero
    //     );

    //   // Move forward 1 day
    //   await network.provider.send("evm_increaseTime", [DAY_IN_SECONDS]);
    //   await network.provider.send("evm_mine");

    //   // Minting again after a day should reset the user mint count
    //   await cheddarMinter
    //     .connect(owner)
    //     ["mint(address,uint256,address)"](
    //       addr1.address,
    //       ethers.parseUnits("100", 18),
    //       addressZero
    //     );

    //   expect(await cheddarMinter.balanceOf(addr1.address)).to.equal(
    //     ethers.parseUnits("1100", 18)
    //   );
    // });

    it("should revert if the daily mint quota is exceeded", async function () {
      const mintAmount = ethers.parseUnits("1001", 18); // 1 token above the daily quota

      await expect(
        cheddarMinter
          .connect(owner)
          ["mint(address,uint256,address)"](
            addr1.address,
            mintAmount,
            addressZero
          )
      ).to.be.revertedWith("Daily mint quota exceeded");
    });

    it("should revert if the user mint quota is exceeded", async function () {
      const mintAmount = ethers.parseUnits("600", 18); // 100 tokens above the user quota

      await expect(
        cheddarMinter
          .connect(owner)
          ["mint(address,uint256,address)"](
            addr1.address,
            mintAmount,
            addressZero
          )
      ).to.be.revertedWith("User mint quota exceeded");
    });

    it("should allow minting after exceeding the user quota on the next day", async function () {
      const mintAmount = ethers.parseUnits("500", 18); // Max user quota

      // Mint up to the user limit
      await cheddarMinter
        .connect(owner)
        ["mint(address,uint256,address)"](
          addr1.address,
          mintAmount,
          addressZero
        );

      // Move forward 1 day
      await network.provider.send("evm_increaseTime", [DAY_IN_SECONDS]);
      await network.provider.send("evm_mine");

      // Minting again the next day should work
      await cheddarMinter
        .connect(owner)
        ["mint(address,uint256,address)"](
          addr1.address,
          mintAmount,
          addressZero
        );

      expect(await cheddarMinter.balanceOf(addr1.address)).to.equal(
        ethers.parseUnits("1000", 18)
      ); // Double mint (500 each day)
    });
  });

  describe("Gas Requirement", function () {
    it("should revert if insufficient gas is provided", async function () {
      const mintAmount = ethers.parseUnits("100", 18);

      // Simulate minting with insufficient gas (below 30,000 gas)
      await expect(
        cheddarMinter
          .connect(owner)
          ["mint(address,uint256,address)"](
            addr1.address,
            mintAmount,
            addressZero,
            {
              gasLimit: 25000, // Less than the required 30,000 gas
            }
          )
      ).to.be.revertedWithoutReason();
    });

    it("should succeed if sufficient gas is provided", async function () {
      const mintAmount = ethers.parseUnits("100", 18);

      // Mint with sufficient gas using Hardhat's auto gas estimation
      await cheddarMinter
        .connect(owner)
        ["mint(address,uint256,address)"](
          addr1.address,
          mintAmount,
          addressZero
        );

      expect(await cheddarMinter.balanceOf(addr1.address)).to.equal(mintAmount);
    });
  });
});

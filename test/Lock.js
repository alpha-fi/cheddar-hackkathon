const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CheddarToken", function () {
  let CheddarToken;
  let cheddar;
  let owner, addr1, addr2, addr3;
  let DAY_IN_SECONDS = 86400;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    CheddarToken = await ethers.getContractFactory("CheddarToken");
    cheddar = await CheddarToken.deploy("CheddarToken", addr1.address, 500);
  });

  describe("Initialization", function () {
    it("should have the correct initial settings", async function () {
      expect(await cheddar.minter()).to.equal(addr1.address);
      expect(await cheddar.dailyQuota()).to.equal(ethers.parseUnits("555", 18));
      expect(await cheddar.userQuota()).to.equal(ethers.parseUnits("500", 18));
    });
  });

  describe("Minting", function () {
    it("allows the minter to mint within the quota", async function () {
      await expect(() => cheddar.connect(addr1).mint(addr2.address, 100, "0x0000000000000000000000000000000000000000"))
        .to.changeTokenBalance(cheddar, addr2, ethers.parseUnits("100", 18));
    });

    it("resets the daily quota after a day", async function () {
      await cheddar.connect(addr1).mint(addr2.address, 555, "0x0000000000000000000000000000000000000000");
      await network.provider.send("evm_increaseTime", [DAY_IN_SECONDS]);
      await network.provider.send("evm_mine");
      await expect(() => cheddar.connect(addr1).mint(addr2.address, 100, "0x0000000000000000000000000000000000000000"))
        .to.changeTokenBalance(cheddar, addr2, ethers.parseUnits("100", 18));
    });

    it("handles referral bonus correctly", async function () {
      await cheddar.connect(addr1).mint(addr2.address, 200, addr3.address);
      expect(await cheddar.balanceOf(addr3.address)).to.equal(ethers.parseUnits("10", 18)); // 5% referral bonus
    });
  });

  describe("Owner Operations", function () {
    it("allows the owner to deactivate and reactivate the contract", async function () {
      await cheddar.connect(owner).toggleActive();
      expect(await cheddar.active()).to.be.false;
      await cheddar.connect(owner).toggleActive();
      expect(await cheddar.active()).to.be.true;
    });

    it("allows the owner to change the minter", async function () {
      await cheddar.connect(owner).changeMinter(addr2.address);
      expect(await cheddar.minter()).to.equal(addr2.address);
    });

    it("allows the owner to adjust quotas", async function () {
      await cheddar.connect(owner).setDailyQuota(1000);
      expect(await cheddar.dailyQuota()).to.equal(ethers.parseUnits("1000", 18));
      await cheddar.connect(owner).setUserQuota(200);
      expect(await cheddar.userQuota()).to.equal(ethers.parseUnits("200", 18));
    });
  });
});

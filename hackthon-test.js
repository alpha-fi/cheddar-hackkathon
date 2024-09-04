const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CheddarToken", function () {
  let CheddarToken;
  let cheddar;
  let owner;
  let admin;
  let minter;
  let user;
  let referral;
  let addrs;

  beforeEach(async function () {
    CheddarToken = await ethers.getContractFactory("CheddarToken");
    [owner, admin, minter, user, referral, ...addrs] = await ethers.getSigners();

    cheddar = await CheddarToken.deploy("CheddarToken", "CHD", admin.address, minter.address, 10000, 500);
    await cheddar.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      expect(await cheddar.admin()).to.equal(admin.address);
    });

    it("Should set the right minter", async function () {
      expect(await cheddar.minter()).to.equal(minter.address);
    });

    it("Contract should be active on deployment", async function () {
      expect(await cheddar.active()).to.be.true;
    });
  });

  describe("Minting tokens", function () {
    it("Should mint the correct amounts to user and referral", async function () {
      await cheddar.connect(minter).mint(user.address, 100, referral.address);
      expect(await cheddar.balanceOf(user.address)).to.equal(80); // 80% to user
      expect(await cheddar.balanceOf(referral.address)).to.equal(20); // 20% as referral
    });

    it("Should not allow non-minter to mint tokens", async function () {
      await expect(cheddar.connect(user).mint(user.address, 100, referral.address)).to.be.revertedWith("Caller is not the minter");
    });

    it("Should respect daily quotas", async function () {
      await cheddar.connect(minter).mint(user.address, 5000, referral.address);
      await expect(cheddar.connect(minter).mint(user.address, 6000, referral.address)).to.be.revertedWith("Daily mint quota exceeded");
    });
  });

  describe("Admin functions", function () {
    it("Should toggle active status", async function () {
      await cheddar.connect(admin).toggleActive();
      expect(await cheddar.active()).to.be.false;
      await cheddar.connect(admin).toggleActive();
      expect(await cheddar.active()).to.be.true;
    });

    it("Should change minter", async function () {
      await cheddar.connect(admin).changeMinter(user.address);
      expect(await cheddar.minter()).to.equal(user.address);
    });

    it("Should only allow admin to toggle active", async function () {
      await expect(cheddar.connect(user).toggleActive()).to.be.revertedWith("Caller is not the admin");
    });
  });
});

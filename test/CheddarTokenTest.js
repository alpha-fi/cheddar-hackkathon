const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CheddarToken", function () {
  let CheddarToken;
  let cheddarToken;
  let owner, addr1, addr2, addr3;

  beforeEach(async function () {
    // Get the signers for testing
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // Deploy the CheddarToken contract
    CheddarToken = await ethers.getContractFactory("CheddarToken");
    cheddarToken = await CheddarToken.deploy("CheddarToken", "CHED");
  });

  describe("Initialization", function () {
    it("should have the correct initial settings", async function () {
      // Owner should be the initial minter
      expect(await cheddarToken.minter()).to.equal(owner.address);

      // Contract should be active initially
      expect(await cheddarToken.active()).to.be.true;
    });
  });

  describe("Minting", function () {
    it("allows the minter to mint tokens", async function () {
      const mintAmount = ethers.parseUnits("100", 18);

      // Minter (owner) mints tokens to addr1
      await cheddarToken.connect(owner).mint(addr1.address, mintAmount);

      // Verify that addr1 received the tokens
      expect(await cheddarToken.balanceOf(addr1.address)).to.equal(mintAmount);
    });

    it("does not allow non-minters to mint tokens", async function () {
      const mintAmount = ethers.parseUnits("100", 18);

      // Try to mint from a non-minter address (addr1)
      await expect(
        cheddarToken.connect(addr1).mint(addr2.address, mintAmount)
      ).to.be.revertedWith("Only the minter can call this function");
    });
  });

  describe("Owner Operations", function () {
    it("allows the owner to change the minter", async function () {
      // Owner changes the minter to addr1
      await cheddarToken.connect(owner).adminChangeMinter(addr1.address);

      // Verify the new minter
      expect(await cheddarToken.minter()).to.equal(addr1.address);
    });

    it("allows the owner to toggle the contract's active state", async function () {
      // Owner deactivates the contract
      await cheddarToken.connect(owner).toggleActive();
      expect(await cheddarToken.active()).to.be.false;

      // Owner reactivates the contract
      await cheddarToken.connect(owner).toggleActive();
      expect(await cheddarToken.active()).to.be.true;
    });

    it("prevents minting when the contract is inactive", async function () {
      const mintAmount = ethers.parseUnits("100", 18);

      // Owner changes the minter to addr1
      await cheddarToken.connect(owner).adminChangeMinter(addr1.address);

      // Owner deactivates the contract
      await cheddarToken.connect(owner).toggleActive();
      expect(await cheddarToken.active()).to.be.false;

      // Attempt to mint while the contract is inactive
      await expect(
        cheddarToken.connect(addr1).mint(addr2.address, mintAmount)
      ).to.be.revertedWith("Contract is inactive");
    });

    it("allows minting after reactivating the contract", async function () {
      const mintAmount = ethers.parseUnits("100", 18);

      // Owner changes the minter to addr1
      await cheddarToken.connect(owner).adminChangeMinter(addr1.address);

      // Deactivate and then reactivate the contract
      await cheddarToken.connect(owner).toggleActive();
      await cheddarToken.connect(owner).toggleActive();
      expect(await cheddarToken.active()).to.be.true;

      // Minter (addr1) can now mint after reactivation
      await cheddarToken.connect(addr1).mint(addr2.address, mintAmount);
      expect(await cheddarToken.balanceOf(addr2.address)).to.equal(mintAmount);
    });
  });
});

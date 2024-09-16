const { ethers } = require("hardhat");

async function main() {
  // Deployment variables
  const tokenName = "CheddarToken";
  const dailyQuota = ethers.utils.parseUnits("1000", 18); // 1000 tokens per day, parsed to 18 decimals
  const userQuota = ethers.utils.parseUnits("100", 18); // 100 tokens per user per day, parsed to 18 decimals

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy the CheddarToken contract
  const CheddarToken = await ethers.getContractFactory("CheddarToken");
  const cheddarToken = await CheddarToken.deploy(
    tokenName,
    deployer.address,
    userQuota
  );

  // Wait for the CheddarToken deployment to complete
  await cheddarToken.deployed();
  console.log("CheddarToken deployed at:", cheddarToken.address);

  // Deploy the CheddarMinter contract, passing the address of the deployed CheddarToken
  const CheddarMinter = await ethers.getContractFactory("CheddarMinter");
  const cheddarMinter = await CheddarMinter.deploy(
    cheddarToken.address, // Pass the CheddarToken address
    dailyQuota,
    userQuota
  );

  // Wait for the CheddarMinter deployment to complete
  await cheddarMinter.deployed();
  console.log("CheddarMinter deployed at:", cheddarMinter.address);
}

// Run the script
main().catch((error) => {
  console.error("Error deploying contract:", error);
  process.exitCode = 1;
});

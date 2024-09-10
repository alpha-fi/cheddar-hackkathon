const { ethers } = require("hardhat");

async function main() {
  // Deployment variables
  const tokenName = "CheddarToken";
  const tokenSymbol = "CHED";
  const dailyQuota = ethers.utils.parseUnits("1000", 18); // 1000 tokens per day, parsed to 18 decimals
  const userQuota = ethers.utils.parseUnits("100", 18); // 100 tokens per user per day, parsed to 18 decimals

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy the CheddarMinter contract
  const CheddarMinter = await ethers.getContractFactory("CheddarMinter");
  const cheddarMinter = await CheddarMinter.deploy(
    tokenName,
    tokenSymbol,
    dailyQuota,
    userQuota
  );

  // Wait for the deployment to complete
  await cheddarMinter.deployed();

  // Log the address where the contract is deployed
  console.log("CheddarMinter deployed at:", cheddarMinter.address);
}

// Run the script
main().catch((error) => {
  console.error("Error deploying contract:", error);
  process.exitCode = 1;
});

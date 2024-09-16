import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "hardhat";

const tokenName = "CheddarToken";
const dailyQuota = ethers.parseUnits("1000", 18); // 1000 tokens per day, parsed to 18 decimals
const userQuota = ethers.parseUnits("100", 18); // 100 tokens per user per day, parsed to 18 decimals

const CheddarMinterModule = buildModule("CheddarMinterModule", (m) => {
  // Step 1: Deploy the CheddarToken contract
  const cheddarToken = m.contract("CheddarToken", [
    tokenName, // Name of the token
    m.getAccount(1), // Minter address (can be deployer)
    userQuota, // User minting quota
  ]);

  // Step 2: Deploy the CheddarMinter contract using the CheddarToken address
  const cheddarMinter = m.contract("CheddarMinter", [
    cheddarToken, // Pass the CheddarToken address to the constructor
    dailyQuota, // Daily mint quota
    userQuota, // User mint quota
  ]);

  return { cheddarToken, cheddarMinter };
});

export default CheddarMinterModule;

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "hardhat";
const tokenName = "CheddarToken";
const tokenSymbol = "CHED";
const dailyQuota = ethers.parseUnits("1000", 18); // 1000 tokens per day, parsed to 18 decimals
const userQuota = ethers.parseUnits("100", 18); // 100 tokens per user per day, parsed to 18 decimals

const CheddarMinterModule = buildModule("CheddarMinterModule", (m) => {
  const lock = m.contract("CheddarMinter", [
    tokenName,
    tokenSymbol,
    dailyQuota,
    userQuota,
  ]);

  return { lock };
});

export default CheddarMinterModule;

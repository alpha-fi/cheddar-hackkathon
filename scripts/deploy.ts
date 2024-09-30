import { ethers } from 'hardhat';

async function main() {
  const tokenName = "CheddarToken";
  const minterAddress = "0x30bA66f596eFBe4D1ee206f20C4CF03BeE3450e2";
  const userQuota = 10000;
  const cheddarToken = await ethers.deployContract('CheddarToken', [tokenName, minterAddress, userQuota]);

  await cheddarToken.waitForDeployment();

  console.log('NFT Contract Deployed at ' + cheddarToken.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
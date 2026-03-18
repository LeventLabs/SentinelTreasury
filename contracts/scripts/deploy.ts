import { ethers } from "hardhat";

async function main() {
  const usdcAddress = process.env.USDC_ADDRESS;
  if (!usdcAddress) throw new Error("Set USDC_ADDRESS in .env");

  console.log("Deploying MockYieldVault...");
  const MockYieldVault = await ethers.getContractFactory("MockYieldVault");
  const yieldVault = await MockYieldVault.deploy(usdcAddress);
  await yieldVault.waitForDeployment();
  const yieldVaultAddr = await yieldVault.getAddress();
  console.log("MockYieldVault:", yieldVaultAddr);

  console.log("Deploying TreasuryVault...");
  const TreasuryVault = await ethers.getContractFactory("TreasuryVault");
  const treasury = await TreasuryVault.deploy(usdcAddress, yieldVaultAddr);
  await treasury.waitForDeployment();
  const treasuryAddr = await treasury.getAddress();
  console.log("TreasuryVault:", treasuryAddr);

  console.log("\nDeployment complete!");
  console.log("---");
  console.log("TREASURY_ADDRESS=" + treasuryAddr);
  console.log("YIELD_VAULT_ADDRESS=" + yieldVaultAddr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // 1. Deploy MockERC20 as demo USDC (no official USDC on HashKey testnet)
  console.log("\nDeploying MockERC20 (demo USDC)...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdc = await MockERC20.deploy();
  await usdc.waitForDeployment();
  const usdcAddr = await usdc.getAddress();
  console.log("MockERC20 (USDC):", usdcAddr);

  // Mint 100,000 USDC to deployer
  const mintAmount = ethers.parseUnits("100000", 6);
  await usdc.mint(deployer.address, mintAmount);
  console.log("Minted 100,000 USDC to deployer");

  // 2. Deploy MockYieldVault
  console.log("\nDeploying MockYieldVault...");
  const MockYieldVault = await ethers.getContractFactory("MockYieldVault");
  const yieldVault = await MockYieldVault.deploy(usdcAddr);
  await yieldVault.waitForDeployment();
  const yieldVaultAddr = await yieldVault.getAddress();
  console.log("MockYieldVault:", yieldVaultAddr);

  // 3. Deploy TreasuryVault
  console.log("\nDeploying TreasuryVault...");
  const TreasuryVault = await ethers.getContractFactory("TreasuryVault");
  const treasury = await TreasuryVault.deploy(usdcAddr, yieldVaultAddr);
  await treasury.waitForDeployment();
  const treasuryAddr = await treasury.getAddress();
  console.log("TreasuryVault:", treasuryAddr);

  console.log("\n--- Deployment complete ---");
  console.log("USDC_ADDRESS=" + usdcAddr);
  console.log("TREASURY_ADDRESS=" + treasuryAddr);
  console.log("YIELD_VAULT_ADDRESS=" + yieldVaultAddr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

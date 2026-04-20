import { ethers } from "hardhat";

// APRO USDC/USD feed on HashKey testnet (Chainlink AggregatorV3 compatible, 8 decimals).
const APRO_USDC_FEED = "0xCdB10dC9dB30B6ef2a63aB4460263655808fAE27";

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

  // 4. Deploy MockKycSBT (demo stand-in; canonical HashKey KycSBT is not present on testnet)
  console.log("\nDeploying MockKycSBT...");
  const MockKycSBT = await ethers.getContractFactory("MockKycSBT");
  const kycSBT = await MockKycSBT.deploy();
  await kycSBT.waitForDeployment();
  const kycSBTAddr = await kycSBT.getAddress();
  console.log("MockKycSBT:", kycSBTAddr);

  // 5. Post-deploy wiring — Phase 2 integrations. Abort on first revert, no partial-success summary.
  try {
    console.log("\nWiring Phase 2 integrations...");

    let tx = await treasury.setKycSBT(kycSBTAddr);
    await tx.wait();
    console.log("TreasuryVault.setKycSBT -> MockKycSBT");

    tx = await treasury.setAproUsdcFeed(APRO_USDC_FEED);
    await tx.wait();
    console.log("TreasuryVault.setAproUsdcFeed -> " + APRO_USDC_FEED);

    // Seed deployer at ULTIMATE(4) + APPROVED(1) so owner-only flows survive the new KYC gates.
    tx = await kycSBT.setKycInfo(deployer.address, "deployer.sentinel", 4, 1);
    await tx.wait();
    console.log("MockKycSBT.setKycInfo(deployer) -> ULTIMATE / APPROVED");

    const basic = process.env.DEMO_BASIC_ADDRESS;
    if (basic && ethers.isAddress(basic)) {
      tx = await kycSBT.setKycInfo(basic, "", 1, 1);
      await tx.wait();
      console.log(`MockKycSBT.setKycInfo(${basic}) -> BASIC / APPROVED`);
    }

    const advanced = process.env.DEMO_ADVANCED_ADDRESS;
    if (advanced && ethers.isAddress(advanced)) {
      tx = await kycSBT.setKycInfo(advanced, "", 2, 1);
      await tx.wait();
      console.log(`MockKycSBT.setKycInfo(${advanced}) -> ADVANCED / APPROVED`);
    }
  } catch (err) {
    console.error("\nPost-deploy wiring FAILED. Treasury is NOT fully configured.");
    console.error(err);
    process.exitCode = 1;
    return;
  }

  console.log("\n--- Deployment complete ---");
  console.log("USDC_ADDRESS=" + usdcAddr);
  console.log("TREASURY_ADDRESS=" + treasuryAddr);
  console.log("YIELD_VAULT_ADDRESS=" + yieldVaultAddr);
  console.log("KYC_SBT_ADDRESS=" + kycSBTAddr);
  console.log("NEXT_PUBLIC_KYC_SBT_ADDRESS=" + kycSBTAddr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

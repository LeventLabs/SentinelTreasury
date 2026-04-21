import { ethers } from "hardhat";

async function main() {
  const FRESH = process.env.FRESH;
  if (!FRESH) throw new Error("Set FRESH=<0x…> env var");

  const KYC_SBT = "0x5cEd9f517101B25D575aA19f620077543cA83454";
  const TREASURY = "0xCd93E05Df0C0bB8C40a9BD592b4bB4d1a6DaE931";

  const kyc = await ethers.getContractAt("MockKycSBT", KYC_SBT);
  const treasury = await ethers.getContractAt("TreasuryVault", TREASURY);

  // Upgrade tier BASIC (1) → ADVANCED (2), status APPROVED (1)
  const tx1 = await kyc.setKycInfo(FRESH, "rehearsal.sentinel", 2, 1);
  console.log("setKycInfo tx:", tx1.hash);
  await tx1.wait();

  // Whitelist as Treasury approver
  const tx2 = await treasury.addApprover(FRESH);
  console.log("addApprover tx:", tx2.hash);
  await tx2.wait();

  console.log("Rehearsal wallet now ADVANCED + approver on Treasury.");
}

main().catch((e) => { console.error(e); process.exit(1); });

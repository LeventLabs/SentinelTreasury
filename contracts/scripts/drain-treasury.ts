import { ethers } from "hardhat";

// Drains the treasury to a clean $0/$0 state for a fresh demo run:
//   1. Pulls any yield-vault balance back into the treasury via withdrawFromYield.
//   2. Withdraws the treasury USDC balance to the deployer (owner).
// Deployer is auto-approver by constructor, so one signer handles both calls.

async function main() {
  const TREASURY = "0xCd93E05Df0C0bB8C40a9BD592b4bB4d1a6DaE931";
  const YIELD_VAULT = "0x3f0335AeA55FD00E85DC8DA345F67fFba0730774";

  const treasury = await ethers.getContractAt("TreasuryVault", TREASURY);
  const yieldVault = await ethers.getContractAt("MockYieldVault", YIELD_VAULT);

  const treasuryBefore = await treasury.getBalance();
  const yieldBefore = await yieldVault.getBalance(TREASURY);
  console.log("Treasury USDC before:", treasuryBefore.toString());
  console.log("Yield    USDC before:", yieldBefore.toString());

  if (yieldBefore > 0n) {
    const tx = await treasury.withdrawFromYield(yieldBefore);
    console.log("withdrawFromYield tx:", tx.hash);
    await tx.wait();
  } else {
    console.log("Yield vault already empty.");
  }

  const treasuryMid = await treasury.getBalance();
  if (treasuryMid > 0n) {
    const tx = await treasury.withdraw(treasuryMid);
    console.log("withdraw tx:", tx.hash);
    await tx.wait();
  } else {
    console.log("Treasury already empty.");
  }

  const treasuryAfter = await treasury.getBalance();
  const yieldAfter = await yieldVault.getBalance(TREASURY);
  console.log("Treasury USDC after: ", treasuryAfter.toString());
  console.log("Yield    USDC after: ", yieldAfter.toString());
}

main().catch((e) => { console.error(e); process.exit(1); });

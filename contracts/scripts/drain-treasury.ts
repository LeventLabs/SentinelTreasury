import { ethers } from "hardhat";

async function main() {
  const TREASURY = "0xCd93E05Df0C0bB8C40a9BD592b4bB4d1a6DaE931";
  const treasury = await ethers.getContractAt("TreasuryVault", TREASURY);
  const bal = await treasury.getBalance();
  console.log("Treasury USDC before:", bal.toString());
  if (bal === 0n) { console.log("Already empty."); return; }
  const tx = await treasury.withdraw(bal);
  console.log("withdraw tx:", tx.hash);
  await tx.wait();
  const after = await treasury.getBalance();
  console.log("Treasury USDC after:", after.toString());
}

main().catch((e) => { console.error(e); process.exit(1); });

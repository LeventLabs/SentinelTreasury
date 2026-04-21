import { ethers } from "hardhat";

async function main() {
  const FRESH = process.env.FRESH;
  if (!FRESH) throw new Error("Set FRESH=<0x…> env var");
  const USDC = "0x06Dd39741a02DdA6105505BE4073aDbbf393701C";
  const usdc = await ethers.getContractAt("MockERC20", USDC);
  const tx = await usdc.mint(FRESH, 1_000_000_000n);
  console.log("mint tx:", tx.hash);
  await tx.wait();
  const bal = await usdc.balanceOf(FRESH);
  console.log("USDC balance:", bal.toString(), "(expect 1000000000 = 1000 USDC)");
}

main().catch((e) => { console.error(e); process.exit(1); });

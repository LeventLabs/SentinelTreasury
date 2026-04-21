import { ethers } from "hardhat";

async function main() {
  const TREASURY = "0xCd93E05Df0C0bB8C40a9BD592b4bB4d1a6DaE931";
  const AMOUNT = ethers.parseEther("0.2");

  const [signer] = await ethers.getSigners();
  const before = await ethers.provider.getBalance(TREASURY);
  console.log("Treasury HSK before:", ethers.formatEther(before));

  const Forwarder = await ethers.getContractFactory("HskForwarder");
  const fwd = await Forwarder.deploy(TREASURY, { value: AMOUNT });
  console.log("Forwarder deploy tx:", fwd.deploymentTransaction()?.hash);
  await fwd.waitForDeployment();

  const after = await ethers.provider.getBalance(TREASURY);
  console.log("Treasury HSK after:", ethers.formatEther(after));
}

main().catch((e) => { console.error(e); process.exit(1); });

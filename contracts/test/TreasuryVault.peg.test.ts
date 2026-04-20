import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

const USDC = (n: number) => ethers.parseUnits(n.toString(), 6);
const PEG = 1_00_000_000n; // 1e8
const DEVIATION = 500_000n; // 5e5 (0.5%)

async function baseFixture() {
  const [owner, approver, user, recipient] = await ethers.getSigners();

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdc = await MockERC20.deploy();

  const MockYieldVault = await ethers.getContractFactory("MockYieldVault");
  const yieldVault = await MockYieldVault.deploy(await usdc.getAddress());

  const TreasuryVault = await ethers.getContractFactory("TreasuryVault");
  const treasury = await TreasuryVault.deploy(
    await usdc.getAddress(),
    await yieldVault.getAddress()
  );

  await usdc.mint(owner.address, USDC(10000));

  // Seed treasury with balance so allocation can actually move USDC.
  await usdc.connect(owner).approve(await treasury.getAddress(), USDC(1000));
  await treasury.connect(owner).deposit(USDC(1000));

  return { treasury, yieldVault, usdc, owner, approver, user, recipient };
}

async function deployFeed(initialAnswer: bigint) {
  const MockAggregator = await ethers.getContractFactory("MockAggregator");
  const feed = await MockAggregator.deploy(initialAnswer);
  return feed;
}

describe("TreasuryVault APRO peg gate", function () {
  describe("when aproUsdcFeed is unset", function () {
    it("allocateToYield proceeds without feed read (MVP parity)", async function () {
      const { treasury, owner } = await loadFixture(baseFixture);
      await expect(treasury.connect(owner).allocateToYield(USDC(500))).to.not.be.reverted;
    });
  });

  describe("setAproUsdcFeed", function () {
    it("owner can set feed and emits AproUsdcFeedUpdated", async function () {
      const { treasury, owner } = await loadFixture(baseFixture);
      const feed = await deployFeed(PEG);
      const feedAddr = await feed.getAddress();

      await expect(treasury.connect(owner).setAproUsdcFeed(feedAddr))
        .to.emit(treasury, "AproUsdcFeedUpdated")
        .withArgs(feedAddr);

      expect(await treasury.aproUsdcFeed()).to.equal(feedAddr);
    });

    it("non-owner cannot set feed", async function () {
      const { treasury, user } = await loadFixture(baseFixture);
      const feed = await deployFeed(PEG);
      await expect(
        treasury.connect(user).setAproUsdcFeed(await feed.getAddress())
      ).to.be.revertedWith("not owner");
    });
  });

  describe("peg gate on allocateToYield", function () {
    it("passes with exact peg answer (1e8)", async function () {
      const { treasury, owner } = await loadFixture(baseFixture);
      const feed = await deployFeed(PEG);
      await treasury.connect(owner).setAproUsdcFeed(await feed.getAddress());

      await expect(treasury.connect(owner).allocateToYield(USDC(500)))
        .to.emit(treasury, "AllocatedToYield");
    });

    it("passes at 0.4% below peg (1e8 - 4e5)", async function () {
      const { treasury, owner } = await loadFixture(baseFixture);
      const feed = await deployFeed(PEG - 400_000n);
      await treasury.connect(owner).setAproUsdcFeed(await feed.getAddress());

      await expect(treasury.connect(owner).allocateToYield(USDC(500))).to.not.be.reverted;
    });

    it("passes at 0.4% above peg (1e8 + 4e5)", async function () {
      const { treasury, owner } = await loadFixture(baseFixture);
      const feed = await deployFeed(PEG + 400_000n);
      await treasury.connect(owner).setAproUsdcFeed(await feed.getAddress());

      await expect(treasury.connect(owner).allocateToYield(USDC(500))).to.not.be.reverted;
    });

    it("passes exactly at boundary 0.5% below (1e8 - 5e5)", async function () {
      const { treasury, owner } = await loadFixture(baseFixture);
      const feed = await deployFeed(PEG - DEVIATION);
      await treasury.connect(owner).setAproUsdcFeed(await feed.getAddress());

      await expect(treasury.connect(owner).allocateToYield(USDC(500))).to.not.be.reverted;
    });

    it("reverts 'peg deviation' at 0.6% below (1e8 - 6e5)", async function () {
      const { treasury, owner } = await loadFixture(baseFixture);
      const feed = await deployFeed(PEG - 600_000n);
      await treasury.connect(owner).setAproUsdcFeed(await feed.getAddress());

      await expect(treasury.connect(owner).allocateToYield(USDC(500)))
        .to.be.revertedWith("peg deviation");
    });

    it("reverts 'peg deviation' at 0.6% above (1e8 + 6e5)", async function () {
      const { treasury, owner } = await loadFixture(baseFixture);
      const feed = await deployFeed(PEG + 600_000n);
      await treasury.connect(owner).setAproUsdcFeed(await feed.getAddress());

      await expect(treasury.connect(owner).allocateToYield(USDC(500)))
        .to.be.revertedWith("peg deviation");
    });

    it("reverts 'bad feed' when answer is zero", async function () {
      const { treasury, owner } = await loadFixture(baseFixture);
      const feed = await deployFeed(0n);
      await treasury.connect(owner).setAproUsdcFeed(await feed.getAddress());

      await expect(treasury.connect(owner).allocateToYield(USDC(500)))
        .to.be.revertedWith("bad feed");
    });

    it("reverts 'bad feed' when answer is negative", async function () {
      const { treasury, owner } = await loadFixture(baseFixture);
      const feed = await deployFeed(-1n);
      await treasury.connect(owner).setAproUsdcFeed(await feed.getAddress());

      await expect(treasury.connect(owner).allocateToYield(USDC(500)))
        .to.be.revertedWith("bad feed");
    });

    it("does not cache — updates to feed take effect immediately", async function () {
      const { treasury, owner } = await loadFixture(baseFixture);
      const feed = await deployFeed(PEG);
      await treasury.connect(owner).setAproUsdcFeed(await feed.getAddress());

      await expect(treasury.connect(owner).allocateToYield(USDC(100))).to.not.be.reverted;

      // De-peg the feed and try again
      await feed.setAnswer(PEG - 600_000n);
      await expect(treasury.connect(owner).allocateToYield(USDC(100)))
        .to.be.revertedWith("peg deviation");

      // Re-peg and retry
      await feed.setAnswer(PEG);
      await expect(treasury.connect(owner).allocateToYield(USDC(100))).to.not.be.reverted;
    });
  });

  describe("peg deviation does NOT block other flows", function () {
    it("deposit is not gated by peg", async function () {
      const { treasury, usdc, owner, user } = await loadFixture(baseFixture);
      const feed = await deployFeed(PEG - 600_000n); // 0.6% below — would fail allocate
      await treasury.connect(owner).setAproUsdcFeed(await feed.getAddress());

      await usdc.mint(user.address, USDC(500));
      await usdc.connect(user).approve(await treasury.getAddress(), USDC(500));
      await expect(treasury.connect(user).deposit(USDC(500))).to.not.be.reverted;
    });

    it("withdraw is not gated by peg", async function () {
      const { treasury, owner } = await loadFixture(baseFixture);
      const feed = await deployFeed(PEG + 600_000n);
      await treasury.connect(owner).setAproUsdcFeed(await feed.getAddress());

      await expect(treasury.connect(owner).withdraw(USDC(200))).to.not.be.reverted;
    });

    it("withdrawFromYield is not gated by peg", async function () {
      const { treasury, owner } = await loadFixture(baseFixture);
      // Put some USDC in yield first while peg is good
      const peggedFeed = await deployFeed(PEG);
      await treasury.connect(owner).setAproUsdcFeed(await peggedFeed.getAddress());
      await treasury.connect(owner).allocateToYield(USDC(500));

      // Now de-peg
      const badFeed = await deployFeed(PEG - 600_000n);
      await treasury.connect(owner).setAproUsdcFeed(await badFeed.getAddress());

      await expect(treasury.connect(owner).withdrawFromYield(USDC(200))).to.not.be.reverted;
    });

    it("payout is not gated by peg", async function () {
      const { treasury, owner, recipient } = await loadFixture(baseFixture);
      const feed = await deployFeed(PEG - 600_000n);
      await treasury.connect(owner).setAproUsdcFeed(await feed.getAddress());

      await expect(treasury.connect(owner).payout(recipient.address, USDC(100))).to.not.be.reverted;
    });
  });
});

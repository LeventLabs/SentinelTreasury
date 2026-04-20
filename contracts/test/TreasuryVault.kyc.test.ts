import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

const USDC = (n: number) => ethers.parseUnits(n.toString(), 6);
const FEE = ethers.parseEther("0.0001");

const NONE = 0;
const BASIC = 1;
const ADVANCED = 2;
const PREMIUM = 3;
const ULTIMATE = 4;
const STATUS_APPROVED = 1;

async function deployFixture() {
  const [owner, alice, bob, carol, recipient] = await ethers.getSigners();

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdc = await MockERC20.deploy();

  const MockYieldVault = await ethers.getContractFactory("MockYieldVault");
  const yieldVault = await MockYieldVault.deploy(await usdc.getAddress());

  const TreasuryVault = await ethers.getContractFactory("TreasuryVault");
  const treasury = await TreasuryVault.deploy(
    await usdc.getAddress(),
    await yieldVault.getAddress()
  );

  const MockKycSBT = await ethers.getContractFactory("MockKycSBT");
  const kyc = await MockKycSBT.deploy();

  await treasury.connect(owner).setKycSBT(await kyc.getAddress());

  await usdc.mint(owner.address, USDC(10000));
  await usdc.mint(alice.address, USDC(10000));
  await usdc.mint(bob.address, USDC(10000));
  await usdc.mint(carol.address, USDC(10000));

  // Owner seeded at ULTIMATE so owner-level flows (withdraw, addApprover, payout)
  // in this fixture work independently of KYC tier.
  await kyc.connect(owner).setKycInfo(owner.address, "owner.sentinel", ULTIMATE, STATUS_APPROVED);

  return { treasury, yieldVault, usdc, kyc, owner, alice, bob, carol, recipient };
}

describe("TreasuryVault KYC gating", function () {
  describe("deposit", function () {
    it("reverts 'KYC required' for unregistered caller", async function () {
      const { treasury, usdc, alice } = await loadFixture(deployFixture);
      await usdc.connect(alice).approve(await treasury.getAddress(), USDC(100));
      await expect(treasury.connect(alice).deposit(USDC(100)))
        .to.be.revertedWith("KYC required");
    });

    it("allows BASIC-tier caller to deposit", async function () {
      const { treasury, usdc, kyc, alice } = await loadFixture(deployFixture);
      await kyc.connect(alice).requestKyc("alice.sentinel", { value: FEE });
      await usdc.connect(alice).approve(await treasury.getAddress(), USDC(500));
      await expect(treasury.connect(alice).deposit(USDC(500)))
        .to.emit(treasury, "Deposited")
        .withArgs(alice.address, USDC(500));
    });

    it("reverts 'KYC required' after revocation", async function () {
      const { treasury, usdc, kyc, owner, alice } = await loadFixture(deployFixture);
      await kyc.connect(alice).requestKyc("alice.sentinel", { value: FEE });
      await kyc.connect(owner).revokeKyc(alice.address);
      await usdc.connect(alice).approve(await treasury.getAddress(), USDC(100));
      await expect(treasury.connect(alice).deposit(USDC(100)))
        .to.be.revertedWith("KYC required");
    });
  });

  describe("addApprover", function () {
    it("reverts 'approver KYC insufficient' for unregistered address", async function () {
      const { treasury, owner, alice } = await loadFixture(deployFixture);
      await expect(treasury.connect(owner).addApprover(alice.address))
        .to.be.revertedWith("approver KYC insufficient");
    });

    it("reverts 'approver KYC insufficient' for BASIC address", async function () {
      const { treasury, kyc, owner, alice } = await loadFixture(deployFixture);
      await kyc.connect(alice).requestKyc("alice.sentinel", { value: FEE });
      await expect(treasury.connect(owner).addApprover(alice.address))
        .to.be.revertedWith("approver KYC insufficient");
    });

    it("succeeds for ADVANCED address", async function () {
      const { treasury, kyc, owner, alice } = await loadFixture(deployFixture);
      await kyc.connect(owner).setKycInfo(alice.address, "alice.sentinel", ADVANCED, STATUS_APPROVED);
      await expect(treasury.connect(owner).addApprover(alice.address))
        .to.emit(treasury, "ApproverUpdated")
        .withArgs(alice.address, true);
    });

    it("succeeds for PREMIUM address", async function () {
      const { treasury, kyc, owner, alice } = await loadFixture(deployFixture);
      await kyc.connect(owner).setKycInfo(alice.address, "alice.sentinel", PREMIUM, STATUS_APPROVED);
      await expect(treasury.connect(owner).addApprover(alice.address)).to.not.be.reverted;
    });

    it("succeeds for ULTIMATE address", async function () {
      const { treasury, kyc, owner, alice } = await loadFixture(deployFixture);
      await kyc.connect(owner).setKycInfo(alice.address, "alice.sentinel", ULTIMATE, STATUS_APPROVED);
      await expect(treasury.connect(owner).addApprover(alice.address)).to.not.be.reverted;
    });
  });

  describe("payout", function () {
    it("reverts 'payout KYC insufficient' when approver is ADVANCED (< PREMIUM)", async function () {
      const { treasury, usdc, kyc, owner, alice, recipient } = await loadFixture(deployFixture);
      // Seed alice at ADVANCED so addApprover passes
      await kyc.connect(owner).setKycInfo(alice.address, "alice.sentinel", ADVANCED, STATUS_APPROVED);
      await treasury.connect(owner).addApprover(alice.address);

      await usdc.connect(owner).approve(await treasury.getAddress(), USDC(1000));
      await treasury.connect(owner).deposit(USDC(1000));

      await expect(treasury.connect(alice).payout(recipient.address, USDC(100)))
        .to.be.revertedWith("payout KYC insufficient");
    });

    it("succeeds when approver is PREMIUM", async function () {
      const { treasury, usdc, kyc, owner, alice, recipient } = await loadFixture(deployFixture);
      await kyc.connect(owner).setKycInfo(alice.address, "alice.sentinel", PREMIUM, STATUS_APPROVED);
      await treasury.connect(owner).addApprover(alice.address);

      await usdc.connect(owner).approve(await treasury.getAddress(), USDC(1000));
      await treasury.connect(owner).deposit(USDC(1000));

      await expect(treasury.connect(alice).payout(recipient.address, USDC(100)))
        .to.emit(treasury, "PayoutSent")
        .withArgs(recipient.address, USDC(100));
    });

    it("succeeds when approver is ULTIMATE", async function () {
      const { treasury, usdc, kyc, owner, alice, recipient } = await loadFixture(deployFixture);
      await kyc.connect(owner).setKycInfo(alice.address, "alice.sentinel", ULTIMATE, STATUS_APPROVED);
      await treasury.connect(owner).addApprover(alice.address);

      await usdc.connect(owner).approve(await treasury.getAddress(), USDC(1000));
      await treasury.connect(owner).deposit(USDC(1000));

      await expect(treasury.connect(alice).payout(recipient.address, USDC(100))).to.not.be.reverted;
    });
  });

  describe("known limitation: post-revocation approver retention", function () {
    it("approver retains approver status on-chain after KYC is revoked", async function () {
      const { treasury, kyc, owner, alice } = await loadFixture(deployFixture);
      await kyc.connect(owner).setKycInfo(alice.address, "alice.sentinel", PREMIUM, STATUS_APPROVED);
      await treasury.connect(owner).addApprover(alice.address);
      expect(await treasury.approvers(alice.address)).to.be.true;

      await kyc.connect(owner).revokeKyc(alice.address);
      expect(await treasury.approvers(alice.address)).to.be.true;
    });

    it("but KYC-gated actions (payout) fail after revocation", async function () {
      const { treasury, usdc, kyc, owner, alice, recipient } = await loadFixture(deployFixture);
      await kyc.connect(owner).setKycInfo(alice.address, "alice.sentinel", PREMIUM, STATUS_APPROVED);
      await treasury.connect(owner).addApprover(alice.address);
      await usdc.connect(owner).approve(await treasury.getAddress(), USDC(1000));
      await treasury.connect(owner).deposit(USDC(1000));

      await kyc.connect(owner).revokeKyc(alice.address);
      await expect(treasury.connect(alice).payout(recipient.address, USDC(100)))
        .to.be.revertedWith("payout KYC insufficient");
    });

    it("allocateToYield is NOT gated by KYC level — still works after revocation", async function () {
      const { treasury, usdc, kyc, owner, alice } = await loadFixture(deployFixture);
      await kyc.connect(owner).setKycInfo(alice.address, "alice.sentinel", PREMIUM, STATUS_APPROVED);
      await treasury.connect(owner).addApprover(alice.address);
      await usdc.connect(owner).approve(await treasury.getAddress(), USDC(1000));
      await treasury.connect(owner).deposit(USDC(1000));

      await kyc.connect(owner).revokeKyc(alice.address);
      await expect(treasury.connect(alice).allocateToYield(USDC(500))).to.not.be.reverted;
    });

    it("owner can always removeApprover regardless of KYC state", async function () {
      const { treasury, kyc, owner, alice } = await loadFixture(deployFixture);
      await kyc.connect(owner).setKycInfo(alice.address, "alice.sentinel", PREMIUM, STATUS_APPROVED);
      await treasury.connect(owner).addApprover(alice.address);
      await kyc.connect(owner).revokeKyc(alice.address);

      await expect(treasury.connect(owner).removeApprover(alice.address)).to.not.be.reverted;
      expect(await treasury.approvers(alice.address)).to.be.false;
    });
  });

  describe("setKycSBT(address(0)) disables all gates", function () {
    it("unregistered address can deposit after SBT is unset", async function () {
      const { treasury, usdc, owner, alice } = await loadFixture(deployFixture);
      await treasury.connect(owner).setKycSBT(ethers.ZeroAddress);

      await usdc.connect(alice).approve(await treasury.getAddress(), USDC(100));
      await expect(treasury.connect(alice).deposit(USDC(100))).to.not.be.reverted;
    });

    it("addApprover works without KYC after SBT is unset", async function () {
      const { treasury, owner, alice } = await loadFixture(deployFixture);
      await treasury.connect(owner).setKycSBT(ethers.ZeroAddress);

      await expect(treasury.connect(owner).addApprover(alice.address)).to.not.be.reverted;
      expect(await treasury.approvers(alice.address)).to.be.true;
    });

    it("payout works without KYC after SBT is unset", async function () {
      const { treasury, usdc, owner, alice, recipient } = await loadFixture(deployFixture);
      await treasury.connect(owner).setKycSBT(ethers.ZeroAddress);
      await treasury.connect(owner).addApprover(alice.address);
      await usdc.connect(owner).approve(await treasury.getAddress(), USDC(1000));
      await treasury.connect(owner).deposit(USDC(1000));

      await expect(treasury.connect(alice).payout(recipient.address, USDC(100))).to.not.be.reverted;
    });
  });

  describe("removeApprover / withdraw / allocate / withdrawFromYield are NOT KYC-gated", function () {
    it("removeApprover does not call kycSBT", async function () {
      const { treasury, kyc, owner, alice } = await loadFixture(deployFixture);
      await kyc.connect(owner).setKycInfo(alice.address, "alice.sentinel", PREMIUM, STATUS_APPROVED);
      await treasury.connect(owner).addApprover(alice.address);

      // Revoke KYC — removeApprover should still succeed
      await kyc.connect(owner).revokeKyc(alice.address);
      await expect(treasury.connect(owner).removeApprover(alice.address)).to.not.be.reverted;
    });

    it("withdraw (owner) is not KYC-gated", async function () {
      const { treasury, usdc, owner } = await loadFixture(deployFixture);
      await usdc.connect(owner).approve(await treasury.getAddress(), USDC(1000));
      await treasury.connect(owner).deposit(USDC(1000));

      // Owner is already seeded at ULTIMATE, but even if revoked, withdraw is not gated.
      // Verify withdraw works in the normal path as a minimum baseline.
      await expect(treasury.connect(owner).withdraw(USDC(500))).to.not.be.reverted;
    });
  });
});

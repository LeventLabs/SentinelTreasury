import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

const NONE = 0;
const BASIC = 1;
const ADVANCED = 2;
const PREMIUM = 3;
const ULTIMATE = 4;

const STATUS_NONE = 0;
const STATUS_APPROVED = 1;
const STATUS_REVOKED = 2;

const DEFAULT_FEE = ethers.parseEther("0.0001");

async function deployFixture() {
  const [owner, alice, bob, mallory] = await ethers.getSigners();
  const MockKycSBT = await ethers.getContractFactory("MockKycSBT");
  const kyc = await MockKycSBT.deploy();
  return { kyc, owner, alice, bob, mallory };
}

describe("MockKycSBT", function () {
  describe("deployment", function () {
    it("sets deployer as owner", async function () {
      const { kyc, owner } = await loadFixture(deployFixture);
      expect(await kyc.owner()).to.equal(owner.address);
    });

    it("initializes totalFee to 0.0001 ether", async function () {
      const { kyc } = await loadFixture(deployFixture);
      expect(await kyc.getTotalFee()).to.equal(DEFAULT_FEE);
    });
  });

  describe("requestKyc", function () {
    it("records BASIC + APPROVED when called with sufficient fee", async function () {
      const { kyc, alice } = await loadFixture(deployFixture);
      await kyc.connect(alice).requestKyc("alice.sentinel", { value: DEFAULT_FEE });

      const [isValid, level] = await kyc.isHuman(alice.address);
      expect(isValid).to.be.true;
      expect(level).to.equal(BASIC);
    });

    it("sets ensName and createTime", async function () {
      const { kyc, alice } = await loadFixture(deployFixture);
      await kyc.connect(alice).requestKyc("alice.sentinel", { value: DEFAULT_FEE });
      const blockTime = await time.latest();

      const info = await kyc.getKycInfo(alice.address);
      expect(info.ensName).to.equal("alice.sentinel");
      expect(info.level).to.equal(BASIC);
      expect(info.status).to.equal(STATUS_APPROVED);
      expect(info.createTime).to.equal(blockTime);
    });

    it("emits KycRequested and KycLevelUpdated", async function () {
      const { kyc, alice } = await loadFixture(deployFixture);
      const tx = kyc.connect(alice).requestKyc("alice.sentinel", { value: DEFAULT_FEE });
      await expect(tx)
        .to.emit(kyc, "KycRequested")
        .withArgs(alice.address, "alice.sentinel")
        .and.to.emit(kyc, "KycLevelUpdated")
        .withArgs(alice.address, BASIC);
    });

    it("accepts payment above fee (no refund required)", async function () {
      const { kyc, alice } = await loadFixture(deployFixture);
      await expect(
        kyc.connect(alice).requestKyc("alice.sentinel", { value: DEFAULT_FEE * 2n })
      ).to.not.be.reverted;
    });

    it("reverts with 'insufficient fee' when underpaid", async function () {
      const { kyc, alice } = await loadFixture(deployFixture);
      await expect(
        kyc.connect(alice).requestKyc("alice.sentinel", { value: DEFAULT_FEE - 1n })
      ).to.be.revertedWith("insufficient fee");
    });

    it("reverts with 'already registered' on second call", async function () {
      const { kyc, alice } = await loadFixture(deployFixture);
      await kyc.connect(alice).requestKyc("alice.sentinel", { value: DEFAULT_FEE });
      await expect(
        kyc.connect(alice).requestKyc("alice2.sentinel", { value: DEFAULT_FEE })
      ).to.be.revertedWith("already registered");
    });

    it("reverts with 'already registered' if owner pre-seeded the address", async function () {
      const { kyc, owner, alice } = await loadFixture(deployFixture);
      await kyc.connect(owner).setKycInfo(alice.address, "seeded.sentinel", ADVANCED, STATUS_APPROVED);
      await expect(
        kyc.connect(alice).requestKyc("alice.sentinel", { value: DEFAULT_FEE })
      ).to.be.revertedWith("already registered");
    });
  });

  describe("isHuman", function () {
    it("returns (false, 0) for unregistered address", async function () {
      const { kyc, alice } = await loadFixture(deployFixture);
      const [isValid, level] = await kyc.isHuman(alice.address);
      expect(isValid).to.be.false;
      expect(level).to.equal(0);
    });

    it("returns (true, level) when status is APPROVED", async function () {
      const { kyc, owner, alice } = await loadFixture(deployFixture);
      await kyc.connect(owner).setKycInfo(alice.address, "alice.sentinel", PREMIUM, STATUS_APPROVED);
      const [isValid, level] = await kyc.isHuman(alice.address);
      expect(isValid).to.be.true;
      expect(level).to.equal(PREMIUM);
    });

    it("returns (false, 0) after revocation", async function () {
      const { kyc, owner, alice } = await loadFixture(deployFixture);
      await kyc.connect(alice).requestKyc("alice.sentinel", { value: DEFAULT_FEE });
      await kyc.connect(owner).revokeKyc(alice.address);
      const [isValid, level] = await kyc.isHuman(alice.address);
      expect(isValid).to.be.false;
      expect(level).to.equal(0);
    });

    it("returns (false, 0) when status is NONE even if level is non-zero", async function () {
      const { kyc, owner, alice } = await loadFixture(deployFixture);
      await kyc.connect(owner).setKycInfo(alice.address, "alice.sentinel", ADVANCED, STATUS_NONE);
      const [isValid] = await kyc.isHuman(alice.address);
      expect(isValid).to.be.false;
    });
  });

  describe("setKycInfo", function () {
    it("owner can seed any level and status", async function () {
      const { kyc, owner, alice, bob } = await loadFixture(deployFixture);
      await kyc.connect(owner).setKycInfo(alice.address, "alice.sentinel", ULTIMATE, STATUS_APPROVED);
      await kyc.connect(owner).setKycInfo(bob.address, "bob.sentinel", BASIC, STATUS_REVOKED);

      const aliceInfo = await kyc.getKycInfo(alice.address);
      expect(aliceInfo.level).to.equal(ULTIMATE);
      expect(aliceInfo.status).to.equal(STATUS_APPROVED);

      const bobInfo = await kyc.getKycInfo(bob.address);
      expect(bobInfo.level).to.equal(BASIC);
      expect(bobInfo.status).to.equal(STATUS_REVOKED);
    });

    it("preserves createTime on subsequent updates", async function () {
      const { kyc, owner, alice } = await loadFixture(deployFixture);
      await kyc.connect(owner).setKycInfo(alice.address, "alice.sentinel", BASIC, STATUS_APPROVED);
      const firstInfo = await kyc.getKycInfo(alice.address);

      await time.increase(3600);
      await kyc.connect(owner).setKycInfo(alice.address, "alice.sentinel", ADVANCED, STATUS_APPROVED);
      const secondInfo = await kyc.getKycInfo(alice.address);

      expect(secondInfo.createTime).to.equal(firstInfo.createTime);
      expect(secondInfo.level).to.equal(ADVANCED);
    });

    it("reverts with 'not owner' for non-owner caller", async function () {
      const { kyc, alice, bob } = await loadFixture(deployFixture);
      await expect(
        kyc.connect(alice).setKycInfo(bob.address, "bob.sentinel", ADVANCED, STATUS_APPROVED)
      ).to.be.revertedWith("not owner");
    });
  });

  describe("revokeKyc / restoreKyc", function () {
    it("revokeKyc emits KycRevoked", async function () {
      const { kyc, owner, alice } = await loadFixture(deployFixture);
      await kyc.connect(alice).requestKyc("alice.sentinel", { value: DEFAULT_FEE });
      await expect(kyc.connect(owner).revokeKyc(alice.address))
        .to.emit(kyc, "KycRevoked")
        .withArgs(alice.address);
    });

    it("restoreKyc emits KycRestored and restores isHuman", async function () {
      const { kyc, owner, alice } = await loadFixture(deployFixture);
      await kyc.connect(alice).requestKyc("alice.sentinel", { value: DEFAULT_FEE });
      await kyc.connect(owner).revokeKyc(alice.address);

      await expect(kyc.connect(owner).restoreKyc(alice.address))
        .to.emit(kyc, "KycRestored")
        .withArgs(alice.address);

      const [isValid, level] = await kyc.isHuman(alice.address);
      expect(isValid).to.be.true;
      expect(level).to.equal(BASIC);
    });

    it("revokeKyc reverts with 'not owner' for non-owner", async function () {
      const { kyc, alice, bob } = await loadFixture(deployFixture);
      await kyc.connect(alice).requestKyc("alice.sentinel", { value: DEFAULT_FEE });
      await expect(kyc.connect(bob).revokeKyc(alice.address))
        .to.be.revertedWith("not owner");
    });

    it("restoreKyc reverts with 'not owner' for non-owner", async function () {
      const { kyc, owner, alice, bob } = await loadFixture(deployFixture);
      await kyc.connect(alice).requestKyc("alice.sentinel", { value: DEFAULT_FEE });
      await kyc.connect(owner).revokeKyc(alice.address);
      await expect(kyc.connect(bob).restoreKyc(alice.address))
        .to.be.revertedWith("not owner");
    });
  });

  describe("fee management", function () {
    it("owner can set a new totalFee", async function () {
      const { kyc, owner } = await loadFixture(deployFixture);
      const newFee = ethers.parseEther("0.001");
      await kyc.connect(owner).setTotalFee(newFee);
      expect(await kyc.getTotalFee()).to.equal(newFee);
    });

    it("setTotalFee reverts with 'not owner' for non-owner", async function () {
      const { kyc, alice } = await loadFixture(deployFixture);
      await expect(
        kyc.connect(alice).setTotalFee(ethers.parseEther("0.001"))
      ).to.be.revertedWith("not owner");
    });

    it("requestKyc honours a freshly updated fee", async function () {
      const { kyc, owner, alice } = await loadFixture(deployFixture);
      const newFee = ethers.parseEther("0.002");
      await kyc.connect(owner).setTotalFee(newFee);

      await expect(
        kyc.connect(alice).requestKyc("alice.sentinel", { value: DEFAULT_FEE })
      ).to.be.revertedWith("insufficient fee");

      await expect(
        kyc.connect(alice).requestKyc("alice.sentinel", { value: newFee })
      ).to.not.be.reverted;
    });
  });

  describe("ens name approval", function () {
    it("owner can approve an ENS name and it is readable", async function () {
      const { kyc, owner, alice } = await loadFixture(deployFixture);
      await kyc.connect(owner).approveEnsName(alice.address, "alice.sentinel");
      expect(await kyc.isEnsNameApproved(alice.address, "alice.sentinel")).to.be.true;
      expect(await kyc.isEnsNameApproved(alice.address, "other.sentinel")).to.be.false;
    });

    it("approveEnsName emits EnsNameApproved", async function () {
      const { kyc, owner, alice } = await loadFixture(deployFixture);
      await expect(kyc.connect(owner).approveEnsName(alice.address, "alice.sentinel"))
        .to.emit(kyc, "EnsNameApproved")
        .withArgs(alice.address, "alice.sentinel");
    });

    it("approveEnsName reverts with 'not owner' for non-owner", async function () {
      const { kyc, alice, bob } = await loadFixture(deployFixture);
      await expect(
        kyc.connect(alice).approveEnsName(bob.address, "bob.sentinel")
      ).to.be.revertedWith("not owner");
    });
  });

  describe("ownership transfer", function () {
    it("current owner can transferOwnership", async function () {
      const { kyc, owner, alice } = await loadFixture(deployFixture);
      await kyc.connect(owner).transferOwnership(alice.address);
      expect(await kyc.owner()).to.equal(alice.address);
    });

    it("non-owner cannot transferOwnership", async function () {
      const { kyc, alice, bob } = await loadFixture(deployFixture);
      await expect(
        kyc.connect(alice).transferOwnership(bob.address)
      ).to.be.revertedWith("not owner");
    });
  });
});

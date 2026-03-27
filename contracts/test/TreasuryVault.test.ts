import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

const USDC = (n: number) => ethers.parseUnits(n.toString(), 6);

async function deployFixture() {
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

  // Mint USDC to users for testing
  await usdc.mint(owner.address, USDC(10000));
  await usdc.mint(user.address, USDC(10000));

  return { treasury, yieldVault, usdc, owner, approver, user, recipient };
}

describe("TreasuryVault", function () {
  describe("constructor", function () {
    it("sets deployer as owner", async function () {
      const { treasury, owner } = await loadFixture(deployFixture);
      expect(await treasury.owner()).to.equal(owner.address);
    });

    it("sets deployer as first approver", async function () {
      const { treasury, owner } = await loadFixture(deployFixture);
      expect(await treasury.approvers(owner.address)).to.be.true;
    });

    it("sets token and yieldVault", async function () {
      const { treasury, usdc, yieldVault } = await loadFixture(deployFixture);
      expect(await treasury.token()).to.equal(await usdc.getAddress());
      expect(await treasury.yieldVault()).to.equal(await yieldVault.getAddress());
    });
  });

  describe("deposit", function () {
    it("pulls USDC from caller", async function () {
      const { treasury, usdc, user } = await loadFixture(deployFixture);
      const treasuryAddr = await treasury.getAddress();
      await usdc.connect(user).approve(treasuryAddr, USDC(500));
      await treasury.connect(user).deposit(USDC(500));
      expect(await treasury.getBalance()).to.equal(USDC(500));
      expect(await usdc.balanceOf(user.address)).to.equal(USDC(9500));
    });

    it("emits Deposited event", async function () {
      const { treasury, usdc, user } = await loadFixture(deployFixture);
      await usdc.connect(user).approve(await treasury.getAddress(), USDC(100));
      await expect(treasury.connect(user).deposit(USDC(100)))
        .to.emit(treasury, "Deposited")
        .withArgs(user.address, USDC(100));
    });

    it("reverts without approval", async function () {
      const { treasury, user } = await loadFixture(deployFixture);
      await expect(treasury.connect(user).deposit(USDC(100))).to.be.reverted;
    });
  });

  describe("withdraw", function () {
    it("owner can withdraw to self", async function () {
      const { treasury, usdc, owner } = await loadFixture(deployFixture);
      await usdc.connect(owner).approve(await treasury.getAddress(), USDC(1000));
      await treasury.connect(owner).deposit(USDC(1000));

      await treasury.connect(owner).withdraw(USDC(400));
      expect(await treasury.getBalance()).to.equal(USDC(600));
      // Owner started with 10000, deposited 1000, withdrew 400 back
      expect(await usdc.balanceOf(owner.address)).to.equal(USDC(9400));
    });

    it("emits Withdrawn event", async function () {
      const { treasury, usdc, owner } = await loadFixture(deployFixture);
      await usdc.connect(owner).approve(await treasury.getAddress(), USDC(1000));
      await treasury.connect(owner).deposit(USDC(1000));

      await expect(treasury.connect(owner).withdraw(USDC(1000)))
        .to.emit(treasury, "Withdrawn")
        .withArgs(owner.address, USDC(1000));
    });

    it("reverts for non-owner", async function () {
      const { treasury, usdc, owner, user } = await loadFixture(deployFixture);
      await usdc.connect(owner).approve(await treasury.getAddress(), USDC(1000));
      await treasury.connect(owner).deposit(USDC(1000));

      await expect(treasury.connect(user).withdraw(USDC(100)))
        .to.be.revertedWith("not owner");
    });
  });

  describe("allocateToYield", function () {
    it("moves USDC from treasury to yield vault", async function () {
      const { treasury, yieldVault, usdc, owner } = await loadFixture(deployFixture);
      const treasuryAddr = await treasury.getAddress();
      await usdc.connect(owner).approve(treasuryAddr, USDC(1000));
      await treasury.connect(owner).deposit(USDC(1000));

      await treasury.connect(owner).allocateToYield(USDC(600));

      expect(await treasury.getBalance()).to.equal(USDC(400));
      expect(await yieldVault.getBalance(treasuryAddr)).to.equal(USDC(600));
    });

    it("resets allowance to zero after deposit", async function () {
      const { treasury, yieldVault, usdc, owner } = await loadFixture(deployFixture);
      await usdc.connect(owner).approve(await treasury.getAddress(), USDC(1000));
      await treasury.connect(owner).deposit(USDC(1000));

      await treasury.connect(owner).allocateToYield(USDC(500));

      const allowance = await usdc.allowance(
        await treasury.getAddress(),
        await yieldVault.getAddress()
      );
      expect(allowance).to.equal(0);
    });

    it("emits AllocatedToYield event", async function () {
      const { treasury, usdc, owner } = await loadFixture(deployFixture);
      await usdc.connect(owner).approve(await treasury.getAddress(), USDC(1000));
      await treasury.connect(owner).deposit(USDC(1000));

      await expect(treasury.connect(owner).allocateToYield(USDC(600)))
        .to.emit(treasury, "AllocatedToYield")
        .withArgs(USDC(600));
    });

    it("reverts for non-approver", async function () {
      const { treasury, usdc, owner, user } = await loadFixture(deployFixture);
      await usdc.connect(owner).approve(await treasury.getAddress(), USDC(1000));
      await treasury.connect(owner).deposit(USDC(1000));

      await expect(treasury.connect(user).allocateToYield(USDC(100)))
        .to.be.revertedWith("not approver");
    });
  });

  describe("withdrawFromYield", function () {
    it("moves USDC from yield vault back to treasury", async function () {
      const { treasury, yieldVault, usdc, owner } = await loadFixture(deployFixture);
      const treasuryAddr = await treasury.getAddress();
      await usdc.connect(owner).approve(treasuryAddr, USDC(1000));
      await treasury.connect(owner).deposit(USDC(1000));
      await treasury.connect(owner).allocateToYield(USDC(600));

      await treasury.connect(owner).withdrawFromYield(USDC(300));

      expect(await treasury.getBalance()).to.equal(USDC(700));
      expect(await yieldVault.getBalance(treasuryAddr)).to.equal(USDC(300));
    });

    it("emits WithdrawnFromYield event", async function () {
      const { treasury, usdc, owner } = await loadFixture(deployFixture);
      await usdc.connect(owner).approve(await treasury.getAddress(), USDC(1000));
      await treasury.connect(owner).deposit(USDC(1000));
      await treasury.connect(owner).allocateToYield(USDC(600));

      await expect(treasury.connect(owner).withdrawFromYield(USDC(600)))
        .to.emit(treasury, "WithdrawnFromYield")
        .withArgs(USDC(600));
    });

    it("reverts for non-approver", async function () {
      const { treasury, usdc, owner, user } = await loadFixture(deployFixture);
      await usdc.connect(owner).approve(await treasury.getAddress(), USDC(1000));
      await treasury.connect(owner).deposit(USDC(1000));
      await treasury.connect(owner).allocateToYield(USDC(600));

      await expect(treasury.connect(user).withdrawFromYield(USDC(100)))
        .to.be.revertedWith("not approver");
    });
  });

  describe("payout", function () {
    it("sends USDC to recipient", async function () {
      const { treasury, usdc, owner, recipient } = await loadFixture(deployFixture);
      await usdc.connect(owner).approve(await treasury.getAddress(), USDC(1000));
      await treasury.connect(owner).deposit(USDC(1000));

      await treasury.connect(owner).payout(recipient.address, USDC(200));

      expect(await treasury.getBalance()).to.equal(USDC(800));
      expect(await usdc.balanceOf(recipient.address)).to.equal(USDC(200));
    });

    it("emits PayoutSent event", async function () {
      const { treasury, usdc, owner, recipient } = await loadFixture(deployFixture);
      await usdc.connect(owner).approve(await treasury.getAddress(), USDC(1000));
      await treasury.connect(owner).deposit(USDC(1000));

      await expect(treasury.connect(owner).payout(recipient.address, USDC(200)))
        .to.emit(treasury, "PayoutSent")
        .withArgs(recipient.address, USDC(200));
    });

    it("reverts for non-approver", async function () {
      const { treasury, usdc, owner, user, recipient } = await loadFixture(deployFixture);
      await usdc.connect(owner).approve(await treasury.getAddress(), USDC(1000));
      await treasury.connect(owner).deposit(USDC(1000));

      await expect(treasury.connect(user).payout(recipient.address, USDC(100)))
        .to.be.revertedWith("not approver");
    });
  });

  describe("getBalance", function () {
    it("returns zero initially", async function () {
      const { treasury } = await loadFixture(deployFixture);
      expect(await treasury.getBalance()).to.equal(0);
    });

    it("reflects deposits and withdrawals", async function () {
      const { treasury, usdc, owner } = await loadFixture(deployFixture);
      await usdc.connect(owner).approve(await treasury.getAddress(), USDC(1000));
      await treasury.connect(owner).deposit(USDC(1000));
      expect(await treasury.getBalance()).to.equal(USDC(1000));

      await treasury.connect(owner).withdraw(USDC(300));
      expect(await treasury.getBalance()).to.equal(USDC(700));
    });
  });

  describe("approver management", function () {
    it("owner can add approver", async function () {
      const { treasury, owner, approver } = await loadFixture(deployFixture);
      await treasury.connect(owner).addApprover(approver.address);
      expect(await treasury.approvers(approver.address)).to.be.true;
    });

    it("owner can remove approver", async function () {
      const { treasury, owner, approver } = await loadFixture(deployFixture);
      await treasury.connect(owner).addApprover(approver.address);
      await treasury.connect(owner).removeApprover(approver.address);
      expect(await treasury.approvers(approver.address)).to.be.false;
    });

    it("emits ApproverUpdated on add", async function () {
      const { treasury, owner, approver } = await loadFixture(deployFixture);
      await expect(treasury.connect(owner).addApprover(approver.address))
        .to.emit(treasury, "ApproverUpdated")
        .withArgs(approver.address, true);
    });

    it("emits ApproverUpdated on remove", async function () {
      const { treasury, owner, approver } = await loadFixture(deployFixture);
      await treasury.connect(owner).addApprover(approver.address);
      await expect(treasury.connect(owner).removeApprover(approver.address))
        .to.emit(treasury, "ApproverUpdated")
        .withArgs(approver.address, false);
    });

    it("non-owner cannot add approver", async function () {
      const { treasury, user, approver } = await loadFixture(deployFixture);
      await expect(treasury.connect(user).addApprover(approver.address))
        .to.be.revertedWith("not owner");
    });

    it("non-owner cannot remove approver", async function () {
      const { treasury, user, owner } = await loadFixture(deployFixture);
      await expect(treasury.connect(user).removeApprover(owner.address))
        .to.be.revertedWith("not owner");
    });

    it("added approver can execute allocateToYield", async function () {
      const { treasury, usdc, owner, approver } = await loadFixture(deployFixture);
      await treasury.connect(owner).addApprover(approver.address);
      await usdc.connect(owner).approve(await treasury.getAddress(), USDC(1000));
      await treasury.connect(owner).deposit(USDC(1000));

      await expect(treasury.connect(approver).allocateToYield(USDC(500)))
        .to.not.be.reverted;
    });

    it("removed approver cannot execute", async function () {
      const { treasury, usdc, owner, approver } = await loadFixture(deployFixture);
      await treasury.connect(owner).addApprover(approver.address);
      await treasury.connect(owner).removeApprover(approver.address);
      await usdc.connect(owner).approve(await treasury.getAddress(), USDC(1000));
      await treasury.connect(owner).deposit(USDC(1000));

      await expect(treasury.connect(approver).allocateToYield(USDC(500)))
        .to.be.revertedWith("not approver");
    });
  });
});

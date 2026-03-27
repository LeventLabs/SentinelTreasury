import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

const USDC = (n: number) => ethers.parseUnits(n.toString(), 6);

async function deployFixture() {
  const [owner, depositor, other] = await ethers.getSigners();

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdc = await MockERC20.deploy();

  const MockYieldVault = await ethers.getContractFactory("MockYieldVault");
  const vault = await MockYieldVault.deploy(await usdc.getAddress());

  await usdc.mint(depositor.address, USDC(10000));

  return { vault, usdc, owner, depositor, other };
}

describe("MockYieldVault", function () {
  describe("deposit", function () {
    it("pulls USDC and credits balance", async function () {
      const { vault, usdc, depositor } = await loadFixture(deployFixture);
      await usdc.connect(depositor).approve(await vault.getAddress(), USDC(500));
      await vault.connect(depositor).deposit(USDC(500));

      expect(await vault.getBalance(depositor.address)).to.equal(USDC(500));
      expect(await usdc.balanceOf(depositor.address)).to.equal(USDC(9500));
    });

    it("emits Deposited event", async function () {
      const { vault, usdc, depositor } = await loadFixture(deployFixture);
      await usdc.connect(depositor).approve(await vault.getAddress(), USDC(100));
      await expect(vault.connect(depositor).deposit(USDC(100)))
        .to.emit(vault, "Deposited")
        .withArgs(depositor.address, USDC(100));
    });

    it("accumulates across multiple deposits", async function () {
      const { vault, usdc, depositor } = await loadFixture(deployFixture);
      await usdc.connect(depositor).approve(await vault.getAddress(), USDC(1000));
      await vault.connect(depositor).deposit(USDC(300));
      await vault.connect(depositor).deposit(USDC(200));
      expect(await vault.getBalance(depositor.address)).to.equal(USDC(500));
    });
  });

  describe("withdraw", function () {
    it("sends USDC and debits balance", async function () {
      const { vault, usdc, depositor } = await loadFixture(deployFixture);
      await usdc.connect(depositor).approve(await vault.getAddress(), USDC(500));
      await vault.connect(depositor).deposit(USDC(500));

      await vault.connect(depositor).withdraw(USDC(200));

      expect(await vault.getBalance(depositor.address)).to.equal(USDC(300));
      expect(await usdc.balanceOf(depositor.address)).to.equal(USDC(9700));
    });

    it("emits Withdrawn event", async function () {
      const { vault, usdc, depositor } = await loadFixture(deployFixture);
      await usdc.connect(depositor).approve(await vault.getAddress(), USDC(500));
      await vault.connect(depositor).deposit(USDC(500));

      await expect(vault.connect(depositor).withdraw(USDC(500)))
        .to.emit(vault, "Withdrawn")
        .withArgs(depositor.address, USDC(500));
    });

    it("reverts on insufficient balance", async function () {
      const { vault, usdc, depositor } = await loadFixture(deployFixture);
      await usdc.connect(depositor).approve(await vault.getAddress(), USDC(100));
      await vault.connect(depositor).deposit(USDC(100));

      await expect(vault.connect(depositor).withdraw(USDC(200)))
        .to.be.revertedWith("insufficient balance");
    });

    it("reverts with zero balance", async function () {
      const { vault, depositor } = await loadFixture(deployFixture);
      await expect(vault.connect(depositor).withdraw(USDC(1)))
        .to.be.revertedWith("insufficient balance");
    });
  });

  describe("getAPY", function () {
    it("returns 800", async function () {
      const { vault } = await loadFixture(deployFixture);
      expect(await vault.getAPY()).to.equal(800);
    });
  });

  describe("getBalance", function () {
    it("returns zero for account with no deposits", async function () {
      const { vault, other } = await loadFixture(deployFixture);
      expect(await vault.getBalance(other.address)).to.equal(0);
    });

    it("tracks per-account balances independently", async function () {
      const { vault, usdc, owner, depositor } = await loadFixture(deployFixture);
      await usdc.mint(owner.address, USDC(1000));
      await usdc.connect(owner).approve(await vault.getAddress(), USDC(300));
      await vault.connect(owner).deposit(USDC(300));

      await usdc.connect(depositor).approve(await vault.getAddress(), USDC(700));
      await vault.connect(depositor).deposit(USDC(700));

      expect(await vault.getBalance(owner.address)).to.equal(USDC(300));
      expect(await vault.getBalance(depositor.address)).to.equal(USDC(700));
    });
  });

  describe("totalDeposits", function () {
    it("returns zero initially", async function () {
      const { vault } = await loadFixture(deployFixture);
      expect(await vault.totalDeposits()).to.equal(0);
    });

    it("returns token balance of contract", async function () {
      const { vault, usdc, depositor } = await loadFixture(deployFixture);
      await usdc.connect(depositor).approve(await vault.getAddress(), USDC(500));
      await vault.connect(depositor).deposit(USDC(500));
      expect(await vault.totalDeposits()).to.equal(USDC(500));
    });

    it("decreases after withdrawal", async function () {
      const { vault, usdc, depositor } = await loadFixture(deployFixture);
      await usdc.connect(depositor).approve(await vault.getAddress(), USDC(500));
      await vault.connect(depositor).deposit(USDC(500));
      await vault.connect(depositor).withdraw(USDC(200));
      expect(await vault.totalDeposits()).to.equal(USDC(300));
    });
  });

  describe("simulateYield", function () {
    it("owner can credit balance without transfer", async function () {
      const { vault, owner, depositor } = await loadFixture(deployFixture);
      await vault.connect(owner).simulateYield(depositor.address, USDC(50));
      expect(await vault.getBalance(depositor.address)).to.equal(USDC(50));
    });

    it("emits YieldSimulated event", async function () {
      const { vault, owner, depositor } = await loadFixture(deployFixture);
      await expect(vault.connect(owner).simulateYield(depositor.address, USDC(50)))
        .to.emit(vault, "YieldSimulated")
        .withArgs(USDC(50));
    });

    it("reverts for non-owner", async function () {
      const { vault, depositor, other } = await loadFixture(deployFixture);
      await expect(vault.connect(other).simulateYield(depositor.address, USDC(50)))
        .to.be.revertedWith("not owner");
    });
  });
});

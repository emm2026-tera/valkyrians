const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("DogzyBridge security", () => {
  let owner, signer, player, attacker, token, bridge;
  const RATE = 1_000_000n * 10n ** 18n / 1_000_000n; // 1 DOGZY per game token (rate/1e6 scaling)

  async function voucher(who, amount, nonce, deadline, by = signer) {
    const h = await bridge.voucherHash(who.address, amount, nonce, deadline);
    return by.signMessage(ethers.getBytes(h));
  }
  const dl = async () => (await time.latest()) + 3600;

  beforeEach(async () => {
    [owner, signer, player, attacker] = await ethers.getSigners();
    token = await (await ethers.getContractFactory("DogzyToken")).deploy(owner.address, 1_000_000n * 10n ** 18n);
    bridge = await (await ethers.getContractFactory("DogzyBridge")).deploy(
      await token.getAddress(), signer.address, RATE, owner.address);
    await token.approve(await bridge.getAddress(), 10_000n * 10n ** 18n);
    await bridge.fund(10_000n * 10n ** 18n);
  });

  it("valid claim pays out correctly", async () => {
    const d = await dl();
    await bridge.connect(player).claim(100, 1, d, await voucher(player, 100, 1, d));
    expect(await token.balanceOf(player.address)).to.equal(100n * RATE / 1_000_000n);
  });

  it("rejects replay of the same voucher", async () => {
    const d = await dl(), s = await voucher(player, 100, 1, d);
    await bridge.connect(player).claim(100, 1, d, s);
    await expect(bridge.connect(player).claim(100, 1, d, s)).to.be.revertedWithCustomError(bridge, "VoucherUsed");
  });

  it("rejects voucher used by another address (front-running)", async () => {
    const d = await dl(), s = await voucher(player, 100, 1, d);
    await expect(bridge.connect(attacker).claim(100, 1, d, s)).to.be.revertedWithCustomError(bridge, "InvalidSignature");
  });

  it("rejects voucher signed by non-signer", async () => {
    const d = await dl();
    await expect(bridge.connect(attacker).claim(100, 1, d, await voucher(attacker, 100, 1, d, attacker)))
      .to.be.revertedWithCustomError(bridge, "InvalidSignature");
  });

  it("rejects tampered amount", async () => {
    const d = await dl(), s = await voucher(player, 100, 1, d);
    await expect(bridge.connect(player).claim(10000, 1, d, s)).to.be.revertedWithCustomError(bridge, "InvalidSignature");
  });

  it("rejects expired voucher", async () => {
    const d = await dl(), s = await voucher(player, 100, 1, d);
    await time.increase(7200);
    await expect(bridge.connect(player).claim(100, 1, d, s)).to.be.revertedWithCustomError(bridge, "VoucherExpired");
  });

  it("rejects zero amount and malformed signatures", async () => {
    const d = await dl();
    await expect(bridge.connect(player).claim(0, 1, d, "0x")).to.be.revertedWithCustomError(bridge, "ZeroAmount");
    await expect(bridge.connect(player).claim(1, 1, d, "0x1234")).to.be.reverted;
  });

  it("enforces maxClaim", async () => {
    await bridge.setMaxClaim(50);
    const d = await dl();
    await expect(bridge.connect(player).claim(100, 1, d, await voucher(player, 100, 1, d)))
      .to.be.revertedWithCustomError(bridge, "ExceedsMaxClaim");
  });

  it("cannot pay out more than the reserve", async () => {
    const d = await dl();
    await expect(bridge.connect(player).claim(10n ** 13n, 1, d, await voucher(player, 10n ** 13n, 1, d))).to.be.reverted;
  });

  it("admin functions are owner-only", async () => {
    const a = bridge.connect(attacker);
    await expect(a.withdraw(attacker.address, 1)).to.be.reverted;
    await expect(a.setSigner(attacker.address)).to.be.reverted;
    await expect(a.setRate(10n ** 30n)).to.be.reverted;
    await expect(a.setMaxClaim(0)).to.be.reverted;
    await expect(a.pause()).to.be.reverted;
  });

  it("pause blocks claims", async () => {
    const d = await dl(), s = await voucher(player, 100, 1, d);
    await bridge.pause();
    await expect(bridge.connect(player).claim(100, 1, d, s)).to.be.reverted;
    await bridge.unpause();
    await bridge.connect(player).claim(100, 1, d, s);
  });

  it("signature does not replay across contract instances", async () => {
    const b2 = await (await ethers.getContractFactory("DogzyBridge")).deploy(
      await token.getAddress(), signer.address, RATE, owner.address);
    await token.approve(await b2.getAddress(), 1000n * 10n ** 18n);
    await b2.fund(1000n * 10n ** 18n);
    const d = await dl(), s = await voucher(player, 100, 1, d);
    await expect(b2.connect(player).claim(100, 1, d, s)).to.be.revertedWithCustomError(b2, "InvalidSignature");
  });
});

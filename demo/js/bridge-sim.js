// SIMULATION of the DogzyBridge flow (contracts/DogzyBridge.sol). No network, no wallet, no transaction.
// Mirrors the contract's rules: voucher (player, gameAmount, nonce, deadline), maxClaim,
// out = gameAmount * rate / RATE_DENOMINATOR, single-use vouchers.
const BridgeSim = {
  RATE_DENOMINATOR: 1000000,
  rate: 1000000,        // 1 in-game token = 1 DOGZY (sample value)
  maxClaim: 500,        // max in-game tokens per claim (sample value)
  network: "Avalanche Fuji (simulated)",

  quote(amount) { return (amount * this.rate) / this.RATE_DENOMINATOR; },

  validate(address, amount, balance) {
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return "Enter a valid Avalanche address (0x + 40 hex characters).";
    if (!Number.isInteger(amount) || amount <= 0) return "Amount must be a positive whole number.";
    if (amount > this.maxClaim) return "Amount exceeds the per-claim limit (" + this.maxClaim + ").";
    if (amount > balance) return "Insufficient in-game balance.";
    return null;
  },

  // Runs the fake flow step by step; `log(line, cls)` receives progress lines.
  async run(address, amount, state, log) {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const nonce = ++state.nonce;
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    log("[SIMULATION] 1/4 Game backend debits " + amount + " in-game tokens", "sim");
    state.balance -= amount; State.save();
    await wait(600);
    const voucher = { player: address, gameAmount: amount, nonce, deadline };
    log("[SIMULATION] 2/4 Backend signs voucher: " + JSON.stringify(voucher), "sim");
    await wait(700);
    const signature = randomHex(65);
    log("             signature (fake): " + signature, "sim");
    log("[SIMULATION] 3/4 Player calls claim() on DogzyBridge - " + this.network, "sim");
    await wait(800);
    const out = this.quote(amount);
    const tx = randomHex(32);
    log("[SIMULATION] 4/4 Bridge pays " + out + " DOGZY to " + address, "sim");
    log("             tx hash (fake, not on chain): " + tx, "sim");
    log("Done. No real transaction was sent.", "ok");
    state.exports.unshift({ address, amount, out, tx, at: new Date().toISOString() });
    state.exports = state.exports.slice(0, 10);
    State.save();
    return out;
  },
};

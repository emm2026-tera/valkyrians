// Player state persisted in localStorage (demo only).
const STORE_KEY = "dogzy-demo-v1";
const DEFAULT_STATE = { balance: 250, inventory: {}, equipped: {}, character: null, nonce: 0, exports: [] };

const State = {
  data: null,
  load() {
    try { this.data = Object.assign({}, DEFAULT_STATE, JSON.parse(localStorage.getItem(STORE_KEY) || "{}")); }
    catch (e) { this.data = Object.assign({}, DEFAULT_STATE); }
  },
  save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(this.data)); } catch (e) { /* storage unavailable */ }
    const b = document.getElementById("balance");
    if (b) b.textContent = this.data.balance;
  },
  reset() { this.data = Object.assign({}, DEFAULT_STATE, { inventory: {}, equipped: {}, exports: [] }); this.save(); },
};

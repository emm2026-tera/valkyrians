# Dogzy Family Universe - Investor Demo (mockup)

Static HTML/CSS/JS demo (English). Open `index.html` in a browser - no server, no build step.
All data is **SAMPLE** content marked as such. The Avalanche export is a **simulation**: no wallet, no network, no real transaction.

## Structure
```
demo/
  index.html          single page, hash routing (#/home, #/characters, #/city, #/wardrobe, #/wallet)
  css/style.css
  js/util.js          safe DOM helpers (no innerHTML), emoji fallback for missing images
  js/state.js         player state in localStorage (balance, inventory, equipped, selected dog)
  js/bridge-sim.js    simulated DogzyBridge flow (voucher -> claim), rate/maxClaim mirror the contract
  js/views.js         the five screens
  js/app.js           router + data loading
  data/*.json         characters, businesses (+ shop items), accessories  (source of truth)
  data/data.js        generated bundle of the JSON files (so it works from file://)
  tools/build-data.js regenerates data/data.js
  assets/             your images (see assets/README.md); emojis are shown until provided
```

## Editing content
1. Edit `data/*.json` (remove `"sample": true` once content is final).
2. Run `node demo/tools/build-data.js` to refresh `data/data.js`
   (browsers block `fetch` of local JSON on `file://`; if `data.js` is absent the app falls back to `fetch`, which works when served over HTTP).
3. Drop images in `assets/...` using the paths in the JSON.

## Notes
- Prices/balances are in-game (off-chain) tokens. Starting balance: 250. "Reset demo" restores it.
- Nothing is deployed anywhere.

## Credits
Universe and characters by the artist **Valkyrie** (Sania Labbe). Replace sample visuals in `assets/` with her artwork.

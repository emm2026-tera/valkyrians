const Views = {
  home() {
    return h("div", {},
      h("section", { class: "hero" },
        h("h1", {}, "Welcome to Dogzy Family Universe"),
        h("p", {}, "A living dog city where every job, shop and accessory matters. Play, earn in-game DOGZY tokens, and export them to your Avalanche wallet."),
        h("a", { class: "btn", href: "#/characters" }, "Meet the dogs "),
        " ",
        h("a", { class: "btn secondary", href: "#/city" }, "Explore the city")),
      h("div", { class: "grid" },
        [["🐕 Characters", "Dogs with real jobs: chef, barmaid, vet...", "#/characters"],
         ["🏙️ City", "Shops and businesses to visit.", "#/city"],
         ["🎩 Wardrobe", "Equip accessories on your dog.", "#/wardrobe"],
         ["🪙 Wallet", "Simulated export to Avalanche.", "#/wallet"]].map(([t, d, l]) =>
          h("a", { class: "card", href: l, style: "color:inherit;text-decoration:none" }, h("h2", {}, t), h("span", { class: "muted" }, d)))));
  },

  characters(D) {
    const st = State.data;
    return h("div", {}, h("h1", {}, "Characters"),
      h("div", { class: "grid" }, D.characters.characters.map((c) =>
        h("div", { class: "card" }, pic(c),
          h("strong", {}, c.name),
          h("div", {}, h("span", { class: "tag" }, c.job), " ", h("span", { class: "tag" }, c.rarity), " ", c.sample && h("span", { class: "tag sample" }, "sample")),
          h("span", { class: "muted" }, c.description),
          h("button", { class: st.character === c.id ? "secondary" : "", onclick: () => { st.character = c.id; State.save(); toast(c.name + " selected"); App.render(); } },
            st.character === c.id ? "Selected ✓" : "Select")))));
  },

  city(D) {
    const st = State.data;
    return h("div", {}, h("h1", {}, "Dogzy City"),
      h("p", { class: "muted" }, "Buy goods with your in-game tokens (sample prices)."),
      h("div", { class: "grid" }, D.businesses.businesses.map((b) =>
        h("div", { class: "card" }, pic(b),
          h("strong", {}, b.name, " ", b.sample && h("span", { class: "tag sample" }, "sample")),
          h("span", { class: "muted" }, b.description),
          b.items.map((it) => h("div", { class: "item" },
            h("span", {}, it.emoji + " " + it.name),
            h("button", { disabled: st.balance < it.price, onclick: () => {
              st.balance -= it.price; st.inventory[it.id] = (st.inventory[it.id] || 0) + 1; State.save();
              toast("Bought " + it.name); App.render();
            } }, it.price + " 🪙")))))));
  },

  wardrobe(D) {
    const st = State.data, A = D.accessories;
    const chars = D.characters.characters;
    const ch = chars.find((c) => c.id === st.character) || chars[0];
    const avatar = h("div", { class: "avatar" });
    avatar.append(ch.emoji || "🐶");
    const base = h("img", { class: "base", src: ch.image, alt: ch.name });
    base.addEventListener("load", () => { avatar.textContent = ""; avatar.append(base); A.slots.forEach(addSlot); });
    function addSlot(s) {
      const a = A.accessories.find((x) => x.id === st.equipped[s]);
      if (a) avatar.append(h("span", { class: "slot " + s, title: a.name }, a.emoji));
    }
    A.slots.forEach(addSlot);
    return h("div", {}, h("h1", {}, "Wardrobe"),
      h("div", { class: "row" },
        h("div", {}, avatar, h("p", { class: "muted", style: "text-align:center" }, ch.name + " the " + ch.job),
          h("p", { style: "text-align:center" }, h("button", { class: "secondary", onclick: () => { st.equipped = {}; State.save(); App.render(); } }, "Remove all"))),
        h("div", {}, A.slots.map((s) => h("div", { class: "card", style: "margin-bottom:1rem" },
          h("strong", {}, s.charAt(0).toUpperCase() + s.slice(1)),
          h("div", { class: "grid", style: "grid-template-columns:repeat(auto-fill,minmax(110px,1fr))" },
            A.accessories.filter((a) => a.slot === s).map((a) =>
              h("button", { class: st.equipped[s] === a.id ? "" : "secondary", onclick: () => {
                if (st.equipped[s] === a.id) delete st.equipped[s]; else st.equipped[s] = a.id;
                State.save(); App.render();
              } }, a.emoji + " " + a.name))))))));
  },

  wallet(D) {
    const st = State.data;
    const items = D.businesses.businesses.flatMap((b) => b.items);
    const owned = Object.entries(st.inventory);
    const log = h("div", { class: "log" }, "Waiting for export...");
    const addr = h("input", { placeholder: "0x... (sample: 0x000000000000000000000000000000000000dEaD)" });
    const amt = h("input", { type: "number", min: "1", step: "1", value: "10" });
    const quote = h("p", { class: "muted" });
    const btn = h("button", {}, "Simulate export");
    const upd = () => { quote.textContent = "You would receive ≈ " + BridgeSim.quote(parseInt(amt.value, 10) || 0) + " DOGZY (rate: 1 token = " + (BridgeSim.rate / BridgeSim.RATE_DENOMINATOR) + " DOGZY, max " + BridgeSim.maxClaim + " per claim)"; };
    amt.addEventListener("input", upd); upd();
    btn.addEventListener("click", async () => {
      const amount = Number(amt.value);
      const err = BridgeSim.validate(addr.value.trim(), amount, st.balance);
      if (err) { log.textContent = ""; log.append(h("span", { class: "err" }, err)); return; }
      btn.disabled = true; log.textContent = "";
      await BridgeSim.run(addr.value.trim(), amount, st, (line, cls) => log.append(h("div", { class: cls }, line)));
      btn.disabled = false;
      document.getElementById("balance").textContent = st.balance;
    });
    return h("div", {}, h("h1", {}, "Inventory & Wallet"),
      h("div", { class: "row" },
        h("div", { class: "card" }, h("h2", {}, "Game inventory"),
          h("div", { class: "item" }, h("span", {}, "🪙 DOGZY game tokens (off-chain)"), h("strong", {}, st.balance)),
          owned.length ? owned.map(([id, n]) => { const it = items.find((i) => i.id === id) || { name: id, emoji: "📦" };
            return h("div", { class: "item" }, h("span", {}, it.emoji + " " + it.name), h("span", {}, "x" + n)); })
            : h("p", { class: "muted" }, "No items yet - visit the City."),
          h("button", { class: "secondary", onclick: () => { State.reset(); App.render(); } }, "Reset demo")),
        h("div", { class: "card" }, h("h2", {}, "Export to Avalanche ", h("span", { class: "tag sample" }, "simulation")),
          h("p", { class: "muted" }, "Mirrors the DogzyBridge flow: debit → signed voucher → claim(). Nothing is sent to any network."),
          h("label", {}, "Avalanche wallet address"), addr,
          h("label", {}, "In-game tokens to export"), amt, quote, btn, log)),
      st.exports.length ? h("div", { class: "card", style: "margin-top:1rem" }, h("h2", {}, "Simulated export history"),
        st.exports.map((e) => h("div", { class: "item" }, h("span", {}, e.amount + " tokens → " + e.out + " DOGZY"), h("span", { class: "muted" }, e.address.slice(0, 10) + "…")))) : null);
  },
};

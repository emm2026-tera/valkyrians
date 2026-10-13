const App = {
  data: null,
  async loadData() {
    if (window.DOGZY_DATA) return window.DOGZY_DATA;
    const names = ["characters", "businesses", "accessories"];
    const res = await Promise.all(names.map((n) => fetch("data/" + n + ".json").then((r) => r.json())));
    return Object.fromEntries(names.map((n, i) => [n, res[i]]));
  },
  render() {
    const route = (location.hash.replace(/^#\//, "") || "home");
    const view = Views[route] ? route : "home";
    document.querySelectorAll("#nav a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#/" + view));
    const app = document.getElementById("app");
    app.textContent = "";
    app.append(Views[view](this.data));
    State.save();
  },
  async start() {
    State.load();
    try { this.data = await this.loadData(); }
    catch (e) {
      document.getElementById("app").append(h("p", { class: "err" },
        "Could not load data/*.json (browsers block this on file://). Run `node demo/tools/build-data.js` or serve the folder."));
      return;
    }
    window.addEventListener("hashchange", () => this.render());
    this.render();
  },
};
App.start();

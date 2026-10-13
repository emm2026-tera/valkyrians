// Safe DOM helper: all text goes through textContent, so JSON data can never inject HTML.
function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === "class") el.className = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}

// Image with emoji fallback when the file has not been provided yet.
function pic(item, cls) {
  const box = h("div", { class: cls || "pic" }, item.emoji || "🐶");
  if (item.image) {
    const img = h("img", { src: item.image, alt: item.name || "" });
    img.addEventListener("load", () => { box.textContent = ""; box.append(img); });
  }
  return box;
}

function toast(msg) {
  const t = h("div", { class: "toast" }, msg);
  document.body.append(t);
  setTimeout(() => t.remove(), 2200);
}

function randomHex(bytes) {
  const a = new Uint8Array(bytes);
  (window.crypto || { getRandomValues: (x) => x.map(() => Math.random() * 256) }).getRandomValues(a);
  return "0x" + Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

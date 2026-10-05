// The Infinite Paradox page: word reveals, reading focus, chapter label, progress, the ice cream demo, optional lo-fi.
import * as music from "./music.js";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;

function split(h) {
  const label = h.textContent.trim(), frag = document.createDocumentFragment(); let n = 0;
  const word = (node) => {
    const w = document.createElement("span"), i = document.createElement("span");
    w.className = "w"; i.className = "wi"; w.setAttribute("aria-hidden", "true");
    i.style.setProperty("--i", Math.min(n++, 40)); i.append(node); w.append(i); frag.append(w, " ");
  };
  h.childNodes.forEach((c) => c.nodeType === 3
    ? c.textContent.split(/\s+/).filter(Boolean).forEach((t) => word(document.createTextNode(t)))
    : word(c.cloneNode(true)));
  h.setAttribute("aria-label", label); if (h.tagName === "P") h.setAttribute("role", "text"); h.textContent = ""; h.append(frag);
}
$$("[data-split]").forEach(split);

const once = (els, opts) => {
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), opts);
  els.forEach((el) => io.observe(el));
};
once($$(".rv,[data-split]"), { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
requestAnimationFrame(() => $("h1").classList.add("in"));

// reading focus: the paragraph near the middle of the screen is the bright one
const focusIO = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle("f", e.isIntersecting)), { rootMargin: "-38% 0px -38% 0px" });
$$(".manu p, .manu li").forEach((p) => focusIO.observe(p));

// chapter label
const label = $("#chlabel");
const chIO = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  const h = $("h2", e.target);
  label.textContent = e.target.dataset.n + " / XIV" + (h ? "  " + h.getAttribute("aria-label") : "");
}), { rootMargin: "-40% 0px -55% 0px" });
$$("[data-n]").forEach((s) => chIO.observe(s));

// progress bar
const bar = $(".bar"); let queued = false;
const frame = () => { const m = root.scrollHeight - innerHeight; bar.style.transform = `scaleX(${m > 0 ? Math.min(scrollY / m, 1) : 0})`; queued = false; };
addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(frame); } }, { passive: true });

// pause ring tunnels off screen and in hidden tabs
$$(".tunnel").forEach((t) => new IntersectionObserver(([e]) => t.classList.toggle("off", !e.isIntersecting)).observe(t));
document.addEventListener("visibilitychange", () => root.classList.toggle("paused", document.hidden));

// the ice cream demo: each choice adds one more layer of "I know that you know..."
const phrase = (k) => {
  let s = (k % 2 ? "You" : "I") + " know", w = k % 2 ? "I" : "you";
  for (let i = 0; i < k; i++) { s += ` that ${w} know`; w = w === "I" ? "you" : "I"; }
  return s + ".";
};
let depth = 0, predicted = "chocolate";
$$(".dbtn button").forEach((b) => b.addEventListener("click", () => {
  const c = b.dataset.f; depth++;
  const log = $("#dlog"), row = document.createElement("p");
  row.textContent = `${c === predicted ? "You complied." : "You defied it."} My variant had already expected ${c}. ${phrase(depth)}`;
  log.append(row); while (log.children.length > 4) log.firstChild.remove();
  predicted = c === "vanilla" ? "chocolate" : "vanilla";
  $("#dpred").textContent = predicted; $("#dcount").textContent = depth;
  if (depth === 8) { const e = document.createElement("p"); e.className = "end"; e.textContent = "There is no last layer here. The loop is the point."; log.after(e); }
}));

// optional lo-fi while reading (same rules as the main site: on by default, quiet, starts after a tap, remembers "off")
const mt = $("#nm");
const labels = { off: "Music off", waiting: "Tap for music", on: "Music on" };
const paint = () => { const s = music.state(); mt.setAttribute("aria-pressed", s !== "off"); mt.querySelector("span").textContent = labels[s]; };
music.onChange(paint);
mt.addEventListener("click", () => { const s = music.state(); s === "waiting" ? music.unlock() : s === "on" ? music.stop() : music.start(); });
if (!music.userOff()) {
  music.start();
  const unlock = (e) => {
    if (e.target.closest && e.target.closest("#nm")) return;
    music.unlock(); ["pointerdown", "keydown", "touchend"].forEach((ev) => removeEventListener(ev, unlock));
  };
  ["pointerdown", "keydown", "touchend"].forEach((ev) => addEventListener(ev, unlock, { passive: true }));
}
paint();

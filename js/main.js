import { CONFIG } from "./config.js";
import { projects } from "./projects.js";
import * as music from "./music.js";
import { initFx } from "./fx.js";
import { initExtras } from "./extras.js";
import { initBeats } from "./beats.js";
import { art } from "./art.js";
import { initPalette } from "./palette.js";
import { initGame } from "./game.js";

const $ = (s) => document.querySelector(s);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };

// Contact links come from config so they are edited in one place.
document.querySelectorAll("[data-discord]").forEach((a) => (a.href = CONFIG.discordUrl));
document.querySelectorAll("[data-email]").forEach((a) => (a.href = `mailto:${CONFIG.email}`));
document.querySelectorAll("[data-email-text]").forEach((n) => (n.textContent = CONFIG.email));
document.querySelectorAll("[data-handle]").forEach((n) => (n.textContent = CONFIG.discordHandle));

// Projects
const list = $("#project-list");
projects.forEach((p, i) => {
  const card = el("article", "project" + (p.featured ? " featured" : ""));
  const media = el("div", "media");
  if (p.tags[0]) media.append(el("span", "badge", p.tags[0]));
  media.append(el("span", "num", String(i + 1).padStart(2, "0")));
  if (p.image) {
    const img = new Image(); img.src = p.image; img.alt = p.alt || `Illustration for ${p.title}`;
    img.loading = "lazy"; img.decoding = "async"; img.width = 1200; img.height = 750;
    media.append(img);
  } else if (p.art && art[p.art]) {
    media.setAttribute("role", "img"); media.setAttribute("aria-label", p.alt || `Illustration for ${p.title}`);
    const st = el("div", "stage"); st.innerHTML = `<i class="l1"></i><div class="l2">${art[p.art]}</div><div class="l3">${art[p.art]}</div>`; media.append(st);
  } else { media.append(el("span", "ph", p.title)); media.setAttribute("aria-hidden", "true"); }
  const body = el("div", "body");
  body.append(el("h3", "", p.title), el("p", "", p.detail || p.summary));
  const tags = el("ul", "tags"); p.tags.forEach((t) => tags.append(el("li", "", t)));
  body.append(tags);
  const links = el("p", "links");
  [["GitHub", p.github], ["Live", p.live]].forEach(([n, u]) => {
    if (u) { const a = el("a", "", n); a.href = u; a.rel = "noopener"; a.target = "_blank"; a.setAttribute("aria-label", `${n}: ${p.title}`); links.append(a); }
  });
  if (links.children.length) body.append(links);
  card.append(media, body); list.append(card);
});

// Mobile nav
const btn = $("#menu"), nav = $("#nav");
const setNav = (open) => { nav.classList.toggle("open", open); btn.setAttribute("aria-expanded", open); };
btn.addEventListener("click", () => setNav(btn.getAttribute("aria-expanded") !== "true"));
nav.addEventListener("click", (e) => e.target.tagName === "A" && setNav(false));
document.addEventListener("keydown", (e) => e.key === "Escape" && setNav(false));

// Music: on by default at low volume. Browsers only allow sound after a tap, so it starts on the first one.
const mb = $("#music"), vol = $("#vol");
vol.value = music.getVolume();
const labels = { off: "Music off", waiting: "Tap for music", on: "Music on" };
const paint = () => { const s = music.state(); mb.setAttribute("aria-pressed", s !== "off"); mb.querySelector("span").textContent = labels[s]; };
music.onChange(paint);
let noteTimer;
music.onChange(() => {
  clearInterval(noteTimer);
  if (music.state() !== "on") return;
  noteTimer = setInterval(() => {
    if (document.hidden) return;
    const n = document.createElement("b"); n.className = "mnote"; n.setAttribute("aria-hidden", "true"); n.textContent = "\u266A";
    n.style.setProperty("--x", (Math.random() * 30 - 15).toFixed(0) + "px");
    n.addEventListener("animationend", () => n.remove()); mb.append(n);
  }, 2600);
});
mb.addEventListener("click", () => {
  const s = music.state();
  if (s === "waiting") music.unlock(); else if (s === "on") music.stop(); else music.start();
});
vol.addEventListener("input", () => music.setVolume(+vol.value));
if (!music.userOff()) {
  music.start();
  const unlock = (e) => {
    if (e.target.closest && e.target.closest("#music")) return;
    music.unlock();
    ["pointerdown", "keydown", "touchend"].forEach((ev) => removeEventListener(ev, unlock));
  };
  ["pointerdown", "keydown", "touchend"].forEach((ev) => addEventListener(ev, unlock, { passive: true }));
}
paint();
initBeats();
initFx();
initExtras();
initPalette();
initGame();

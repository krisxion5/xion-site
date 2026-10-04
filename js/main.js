import { CONFIG } from "./config.js";
import { projects } from "./projects.js";
import * as music from "./music.js";
import { initFx } from "./fx.js";

const $ = (s) => document.querySelector(s);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };

// Contact links come from config so they are edited in one place.
document.querySelectorAll("[data-discord]").forEach((a) => (a.href = CONFIG.discordUrl));
document.querySelectorAll("[data-email]").forEach((a) => (a.href = `mailto:${CONFIG.email}`));
document.querySelectorAll("[data-email-text]").forEach((n) => (n.textContent = CONFIG.email));
document.querySelectorAll("[data-handle]").forEach((n) => (n.textContent = CONFIG.discordHandle));

// Projects
const list = $("#project-list");
projects.forEach((p) => {
  const card = el("article", "project" + (p.featured ? " featured" : ""));
  const media = el("div", "media");
  if (p.image) {
    const img = new Image(); img.src = p.image; img.alt = `Screenshot of ${p.title}`;
    img.loading = "lazy"; img.decoding = "async"; img.width = 1200; img.height = 750;
    media.append(img);
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

// Music: off until a click. If it was on earlier this session, resume on the first interaction.
const mb = $("#music");
const paint = () => { mb.setAttribute("aria-pressed", music.isOn()); mb.querySelector("span").textContent = music.isOn() ? "Music on" : "Music off"; };
mb.addEventListener("click", async () => { music.isOn() ? music.stop() : await music.start(); paint(); });
if (music.wasOn()) {
  const resume = async () => { await music.start(); paint(); };
  addEventListener("pointerdown", resume, { once: true }); addEventListener("keydown", resume, { once: true });
}
paint();

initFx();

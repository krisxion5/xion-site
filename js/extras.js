// Extra personality: typed roles, card tilt, magnetic buttons, cursor ring. Mouse-only parts skip touch devices.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
import { blip } from "./music.js";
const roles = ["Discord bots", "Minecraft Bedrock add-ons", "fast, tidy websites", "AI-integrated tools", "fixes for broken projects"];

function typed() {
  const t = $("#role"), hero = $(".hero");
  if (!t) return;
  if (reduce) { t.textContent = roles[0]; return; }
  let i = 0, j = 0, del = false;
  const tick = () => {
    if (hero.classList.contains("off") || document.hidden) return setTimeout(tick, 600);
    const w = roles[i]; j += del ? -1 : 1; t.textContent = w.slice(0, j);
    let d = del ? 35 : 70;
    if (!del && j === w.length) { del = true; d = 1600; }
    else if (del && j === 0) { del = false; i = (i + 1) % roles.length; d = 300; }
    setTimeout(tick, d);
  };
  setTimeout(tick, 1600);
}

function pauseOffscreen(sel) {
  $$(sel).forEach((el) => new IntersectionObserver(([e]) => el.classList.toggle("off", !e.isIntersecting)).observe(el));
}

function tilt() {
  $$(".project").forEach((c) => {
    c.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = c.getBoundingClientRect();
      c.style.setProperty("--ry", ((e.clientX - r.left) / r.width - 0.5) * 8 + "deg");
      c.style.setProperty("--rx", -((e.clientY - r.top) / r.height - 0.5) * 6 + "deg");
    }, { passive: true });
    c.addEventListener("pointerleave", () => { c.style.removeProperty("--rx"); c.style.removeProperty("--ry"); });
  });
}

function magnet() {
  $$(".btn").forEach((b) => {
    b.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = b.getBoundingClientRect();
      b.style.setProperty("--tx", (e.clientX - r.left - r.width / 2) * 0.18 + "px");
      b.style.setProperty("--ty", (e.clientY - r.top - r.height / 2) * 0.3 + "px");
    }, { passive: true });
    b.addEventListener("pointerleave", () => { b.style.removeProperty("--tx"); b.style.removeProperty("--ty"); });
  });
}

function cursor() {
  const c = document.createElement("div"); c.className = "cursor"; c.setAttribute("aria-hidden", "true"); document.body.append(c);
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
  const loop = () => {
    x += (tx - x) * 0.22; y += (ty - y) * 0.22;
    c.style.transform = `translate3d(${x - 14}px,${y - 14}px,0)`;
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(loop) : 0;
  };
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    tx = e.clientX; ty = e.clientY; c.classList.add("on"); raf = raf || requestAnimationFrame(loop);
  }, { passive: true });
  document.addEventListener("pointerover", (e) => c.classList.toggle("big", !!e.target.closest("a,button,input,.project,.strings")));
  document.documentElement.addEventListener("mouseleave", () => c.classList.remove("on"));
}

export function burst(x, y, n = 6) {
  for (let i = 0; i < n; i++) {
    const s = document.createElement("i"), a = (Math.PI * 2 * i) / n + Math.random() * 0.6, d = 28 + Math.random() * 34;
    s.className = "spark"; s.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px`;
    s.addEventListener("animationend", () => s.remove()); document.body.append(s);
  }
}
function sparks() {
  let last = 0;
  document.addEventListener("click", (e) => { if (e.target.closest("a,button")) blip(520); const n = performance.now(); if (n - last > 150) { last = n; burst(e.clientX, e.clientY); } });
  let buf = "";
  addEventListener("keydown", (e) => { buf = (buf + e.key).slice(-4).toLowerCase(); if (buf === "xion") burst(innerWidth / 2, innerHeight / 2, 18); });
}
function mascot() {
  const m = $(".mascot"); if (!m) return;
  const b = $(".bubble", m), lines = ["Hey, I'm the mascot.", "Need a bot built?", "Try the volume slider.", "Tap me again."]; let k = 0;
  m.addEventListener("click", () => {
    b.textContent = lines[k++ % lines.length];
    if (k === 5) { m.classList.add("cool"); b.textContent = "Cool mode: on."; }
    if (k === 10) { m.classList.remove("cool"); b.textContent = "Okay, shades off."; }
    const r = m.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 3, 8);
    if (!reduce) m.animate([{ transform: "none" }, { transform: "translateY(-14px) rotate(-3deg)" }, { transform: "none" }], { duration: 450, easing: "ease-out" });
  });
  if (fine && !reduce) {
    let rect, dirty = true, raf = 0, ex = 0, ey = 0;
    addEventListener("scroll", () => (dirty = true), { passive: true });
    addEventListener("pointermove", (e) => {
      if (dirty) { rect = m.getBoundingClientRect(); dirty = false; }
      ex = Math.max(-1, Math.min(1, (e.clientX - rect.left - rect.width / 2) / 200)) * 3;
      ey = Math.max(-1, Math.min(1, (e.clientY - rect.top - rect.height * 0.45) / 200)) * 3;
      raf = raf || requestAnimationFrame(() => { m.style.setProperty("--ex", ex.toFixed(2)); m.style.setProperty("--ey", ey.toFixed(2)); raf = 0; });
    }, { passive: true });
  }
}

function glow() { // soft pink light under the mouse, one fixed element
  const g = document.createElement("div"); g.className = "glow"; g.setAttribute("aria-hidden", "true"); document.body.append(g);
  let x = 0, y = 0, raf = 0;
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    x = e.clientX - 240; y = e.clientY - 240; g.classList.add("on");
    raf = raf || requestAnimationFrame(() => { g.style.transform = `translate3d(${x}px,${y}px,0)`; raf = 0; });
  }, { passive: true });
  document.documentElement.addEventListener("mouseleave", () => g.classList.remove("on"));
}

function depth() { // touch: layers follow a finger resting on the picture
  $$(".media").forEach((m) => {
    m.addEventListener("pointermove", (e) => {
      const r = m.getBoundingClientRect();
      m.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(2));
      m.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(2));
    }, { passive: true });
    ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => m.addEventListener(ev, () => { m.style.removeProperty("--px"); m.style.removeProperty("--py"); }));
  });
}
function rail() { // desktop section dots
  const items = [["work", "Work"], ["mcpe", "MCPE"], ["skills", "Skills"], ["process", "How I work"], ["beats", "Beats"], ["about", "About"], ["contact", "Contact"]];
  const n = document.createElement("nav"); n.className = "rail"; n.setAttribute("aria-label", "Sections");
  items.forEach(([id, label]) => { const a = document.createElement("a"); a.href = "#" + id; a.dataset.l = label; a.setAttribute("aria-label", label); n.append(a); });
  document.body.append(n);
  const io = new IntersectionObserver((es) => es.forEach((en) => {
    if (!en.isIntersecting) return;
    n.querySelectorAll("a").forEach((a) => a.getAttribute("href") === "#" + en.target.id ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current"));
  }), { rootMargin: "-45% 0px -50% 0px" });
  items.forEach(([id]) => { const s = document.getElementById(id); if (s) io.observe(s); });
}

export function initExtras() {
  const t0 = document.title;
  document.addEventListener("visibilitychange", () => (document.title = document.hidden ? "psst. come back" : t0));
  typed(); pauseOffscreen(".marquee"); pauseOffscreen(".mascot"); pauseOffscreen(".rig"); pauseOffscreen(".media"); pauseOffscreen(".notecard"); pauseOffscreen(".room");
  const stars = document.createElement("div"); stars.className = "stars"; stars.setAttribute("aria-hidden", "true"); document.body.prepend(stars); rail(); if (!fine && !reduce) depth(); mascot();
  if (!reduce) sparks();
  if (fine && !reduce) { tilt(); magnet(); cursor(); glow(); }
}

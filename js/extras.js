// Extra personality: typed roles, card tilt, magnetic buttons, cursor ring. Mouse-only parts skip touch devices.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
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
  const el = $(sel); if (!el) return;
  new IntersectionObserver(([e]) => el.classList.toggle("off", !e.isIntersecting)).observe(el);
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

export function initExtras() {
  typed(); pauseOffscreen(".marquee");
  if (fine && !reduce) { tilt(); magnet(); cursor(); }
}

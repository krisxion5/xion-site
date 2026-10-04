// Motion layer. Everything here is optional polish: the page works if this file fails.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

// Split a heading into masked words so each can rise in. Screen readers get the original text.
function split(h) {
  const label = h.textContent.trim(), frag = document.createDocumentFragment();
  let n = 0;
  const word = (node) => {
    const w = document.createElement("span"), i = document.createElement("span");
    w.className = "w"; i.className = "wi"; w.setAttribute("aria-hidden", "true");
    i.style.setProperty("--i", n++); i.append(node); w.append(i); frag.append(w, " ");
  };
  h.childNodes.forEach((c) => c.nodeType === 3
    ? c.textContent.split(/\s+/).filter(Boolean).forEach((t) => word(document.createTextNode(t)))
    : word(c.cloneNode(true)));
  h.setAttribute("aria-label", label); h.textContent = ""; h.append(frag);
}

function reveals(heroTitle) {
  const count = new Map();
  $$(".sub,.cols p,.skills li,.contact .cta,.project").forEach((el) => {
    const k = count.get(el.parentNode) || 0; count.set(el.parentNode, k + 1);
    el.classList.add("rv"); el.style.setProperty("--i", Math.min(k, 8));
  });
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
  $$(".rv,[data-split],section").forEach((el) => el !== heroTitle && io.observe(el));
}

function navState() {
  const links = $$("#nav a[href^='#']");
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    links.forEach((a) => a.toggleAttribute("aria-current", a.getAttribute("href") === "#" + e.target.id));
    links.forEach((a) => a.hasAttribute("aria-current") && a.setAttribute("aria-current", "true"));
  }), { rootMargin: "-45% 0px -50% 0px" });
  $$("section[id]").forEach((s) => io.observe(s));
}

function scrollUi() {
  const header = $("header.top"), bar = document.createElement("i"), menu = $("#menu");
  bar.className = "bar"; bar.setAttribute("aria-hidden", "true"); header.append(bar);
  let last = 0, queued = false;
  const frame = () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    if (!reduce && menu.getAttribute("aria-expanded") !== "true" && Math.abs(y - last) > 6) {
      header.classList.toggle("hide", y > last && y > 240);
    }
    last = y; queued = false;
  };
  addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(frame); } }, { passive: true });
  frame();
}

// One soft light follows a mouse over the hero; touch devices simply see it parked.
function heroLight(hero) {
  const spot = document.createElement("div"); spot.className = "spot"; hero.prepend(spot);
  let rect, dirty = true, x = 0, y = 0, raf = 0;
  addEventListener("scroll", () => (dirty = true), { passive: true });
  hero.addEventListener("pointerenter", () => hero.classList.add("live"));
  hero.addEventListener("pointerleave", () => hero.classList.remove("live"));
  hero.addEventListener("pointermove", (e) => {
    if (dirty) { rect = hero.getBoundingClientRect(); dirty = false; }
    x = e.clientX - rect.left - 260; y = e.clientY - rect.top - 260;
    raf = raf || requestAnimationFrame(() => { spot.style.transform = `translate3d(${x}px,${y}px,0)`; raf = 0; });
  }, { passive: true });
}

function cardGlow() {
  $$(".project .media").forEach((m) => m.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const r = m.getBoundingClientRect();
    m.style.setProperty("--mx", e.clientX - r.left + "px");
    m.style.setProperty("--my", e.clientY - r.top + "px");
  }, { passive: true }));
}

export function initFx() {
  const hero = $(".hero"), title = $("h1", hero);
  $$("[data-split]").forEach(split);
  reveals(title); navState(); scrollUi();
  const fonts = document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 700))]) : Promise.resolve();
  fonts.then(() => requestAnimationFrame(() => title.classList.add("in")));
  new IntersectionObserver(([e]) => hero.classList.toggle("off", !e.isIntersecting)).observe(hero);
  document.addEventListener("visibilitychange", () => document.documentElement.classList.toggle("paused", document.hidden));
  if (fine && !reduce) { heroLight(hero); cardGlow(); }
}

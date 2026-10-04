// Squash the bugs: 20 seconds, best score saved on this device. At most a few DOM nodes at a time.
import { burst } from "./extras.js";
import { blip } from "./music.js";
const $ = (s) => document.querySelector(s);
export function initGame() {
  const arena = $("#arena"), start = $("#gstart"), score = $("#gscore"), best = $("#gbest"), time = $("#gtime");
  let n = 0, left = 0, run = false, spawnT, tick, hi = 0;
  try { hi = +localStorage.getItem("xion-bugs") || 0; } catch {}
  best.textContent = hi;
  const spawn = () => {
    if (!run) return;
    const b = document.createElement("button");
    b.className = "bug"; b.type = "button"; b.setAttribute("aria-label", "Squash bug");
    b.style.left = 6 + Math.random() * 82 + "%"; b.style.top = 8 + Math.random() * 70 + "%";
    const gone = setTimeout(() => b.remove(), 1500);
    b.addEventListener("click", (e) => {
      e.stopPropagation(); clearTimeout(gone); n++; score.textContent = n;
      const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 6);
      blip(700 + n * 8); b.remove();
    });
    arena.append(b); spawnT = setTimeout(spawn, Math.max(380, 760 - n * 14));
  };
  const end = () => {
    run = false; clearInterval(tick); clearTimeout(spawnT);
    arena.querySelectorAll(".bug").forEach((b) => b.remove());
    start.textContent = `Score ${n}. Play again`; start.disabled = false;
    if (n > hi) { hi = n; best.textContent = hi; try { localStorage.setItem("xion-bugs", hi); } catch {} }
  };
  start.addEventListener("click", () => {
    n = 0; left = 20; score.textContent = 0; time.textContent = left; run = true;
    start.disabled = true; start.textContent = "Go"; spawn();
    tick = setInterval(() => { time.textContent = --left; if (left <= 0) end(); }, 1000);
  });
}

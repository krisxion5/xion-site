// Your beats. Copy mp3 files into /audio, then add an entry below. Entries with no audio and no link stay hidden.
// Example: { title: "Midnight loop", meta: "78 BPM", audio: "audio/midnight-loop.mp3", link: "" },
import * as music from "./music.js";
export const beats = [];

const $ = (s) => document.querySelector(s);
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x) e.textContent = x; return e; };
const active = new Set(); // anything audible here quiets the background lo-fi
const setActive = (k, on) => { on ? active.add(k) : active.delete(k); music.duck(active.size > 0); };

function cards() {
  const list = $("#beat-list"), real = beats.filter((b) => b.audio || b.link);
  $("#beat-empty").hidden = real.length > 0;
  let current = null;
  real.forEach((b, n) => {
    const card = el("article", "beat"), info = el("div", "info"), prog = el("i", "prog");
    info.append(el("h3", "", b.title), el("p", "", b.meta || ""));
    if (b.audio) {
      const a = new Audio(), btn = el("button", "play");
      a.preload = "none"; a.src = b.audio;
      btn.type = "button"; btn.setAttribute("aria-label", `Play ${b.title}`); btn.setAttribute("aria-pressed", "false");
      const off = () => { btn.setAttribute("aria-pressed", "false"); setActive("beat" + n, false); };
      btn.addEventListener("click", () => {
        if (!a.paused) return a.pause();
        if (current && current !== a) current.pause();
        current = a;
        a.play().then(() => { btn.setAttribute("aria-pressed", "true"); setActive("beat" + n, true); }).catch(() => {});
      });
      a.addEventListener("pause", off); a.addEventListener("ended", off);
      a.addEventListener("timeupdate", () => { prog.style.transform = `scaleX(${a.duration ? a.currentTime / a.duration : 0})`; });
      card.append(btn);
    }
    card.append(info);
    if (b.link) {
      const l = el("a", "listen", "Listen"); l.href = b.link; l.target = "_blank"; l.rel = "noopener";
      l.setAttribute("aria-label", `Listen to ${b.title}`); card.append(l);
    }
    card.append(prog); list.append(card);
  });
}

// 16-step drum pad: real synthesized sound, starts only after the visitor taps Play.
const ROWS = ["Kick", "Snare", "Hat"], DEFAULT = [[0, 6, 10], [4, 12], [0, 2, 4, 6, 8, 10, 12, 14]];
function pad() {
  const host = $("#pad"), bpmEl = $("#padbpm"), bpmV = $("#padbpmv"), playBtn = $("#padplay");
  const grid = ROWS.map((_, r) => Array.from({ length: 16 }, (_, i) => DEFAULT[r].includes(i)));
  let ctx, nb, out, timer, step = 0, next = 0, playing = false, last = -1;
  const cells = ROWS.map((name, r) => {
    const row = el("div", "prow"); row.append(el("span", "", name));
    const rc = grid[r].map((on, i) => {
      const c = el("button", "cell"); c.type = "button";
      c.setAttribute("aria-pressed", on); c.setAttribute("aria-label", `${name} step ${i + 1}`);
      c.addEventListener("click", () => { grid[r][i] = !grid[r][i]; c.setAttribute("aria-pressed", grid[r][i]); });
      row.append(c); return c;
    });
    host.append(row); return rc;
  });
  const kick = (t) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.15);
    g.gain.setValueAtTime(0.6, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g).connect(out); o.start(t); o.stop(t + 0.32);
  };
  const noise = (t, type, f, v, d) => {
    const s = ctx.createBufferSource(), b = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = nb; b.type = type; b.frequency.value = f;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    s.connect(b).connect(g).connect(out); s.start(t, Math.random() * 0.3); s.stop(t + d + 0.02);
  };
  const mark = (i, t) => setTimeout(() => {
    if (!playing) return;
    cells.forEach((rc) => { rc[last]?.classList.remove("now"); rc[i].classList.add("now"); }); last = i;
  }, Math.max(0, (t - ctx.currentTime) * 1000));
  const tick = () => {
    const sd = 60 / bpmEl.value / 4;
    while (next < ctx.currentTime + 0.15) {
      const i = step % 16, t = next + (i % 2 ? sd * 0.12 : 0);
      if (grid[0][i]) kick(t);
      if (grid[1][i]) noise(t, "bandpass", 1700, 0.12, 0.14);
      if (grid[2][i]) noise(t, "highpass", 5000, 0.035, 0.04);
      mark(i, t); next += sd; step++;
    }
  };
  const stop = () => {
    if (!playing) return;
    playing = false; clearInterval(timer); playBtn.textContent = "Play"; playBtn.setAttribute("aria-pressed", "false");
    cells.forEach((rc) => rc.forEach((c) => c.classList.remove("now"))); setActive("pad", false);
  };
  playBtn.addEventListener("click", async () => {
    if (playing) return stop();
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      nb = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate);
      const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      out = ctx.createGain(); out.gain.value = 0.5;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 4500; out.connect(lp).connect(ctx.destination);
    }
    await ctx.resume();
    playing = true; step = 0; next = ctx.currentTime + 0.05; timer = setInterval(tick, 50);
    playBtn.textContent = "Stop"; playBtn.setAttribute("aria-pressed", "true"); setActive("pad", true);
  });
  bpmEl.addEventListener("input", () => (bpmV.textContent = bpmEl.value));
  $("#padclear").addEventListener("click", () => grid.forEach((r, ri) => r.forEach((_, i) => { r[i] = false; cells[ri][i].setAttribute("aria-pressed", "false"); })));
  document.addEventListener("visibilitychange", () => document.hidden && stop());
}

export function initBeats() { cards(); pad(); }

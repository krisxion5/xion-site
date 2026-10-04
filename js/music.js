// Original lo-fi, synthesized live (no audio files, no licensing): warm electric-piano chords, soft drums, bass, vinyl crackle.
// On by default at low volume. Browsers only let audio start after a tap, so "on" waits for the first interaction.
const K = "xion-music", V = "xion-vol", BPM = 72, SD = 60 / BPM / 4;
const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const store = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
const sv = read(V);
let vol = sv === null ? 35 : +sv;
let ctx, master, bus, verbIn, echoIn, nb, timer, want = false, step = 0, next = 0;
const listeners = [];
const gainOf = (v) => Math.pow(v / 100, 1.5) * 1.6;
const hz = (m) => 440 * 2 ** ((m - 69) / 12);
const prog = [ // Dm9, G13, Cmaj9, Am9, Fmaj9, Bm7b5, E7b9, Am9
  { bass: 50, notes: [53, 57, 60, 64] }, { bass: 55, notes: [59, 62, 64, 65] },
  { bass: 48, notes: [52, 55, 59, 62] }, { bass: 45, notes: [55, 59, 60, 64] },
  { bass: 53, notes: [57, 60, 64, 67] }, { bass: 47, notes: [57, 62, 65, 69] },
  { bass: 52, notes: [56, 59, 62, 65] }, { bass: 45, notes: [55, 59, 60, 64] },
];

export const getVolume = () => vol;
export const userOff = () => read(K) === "off";
export const state = () => (!want ? "off" : ctx && ctx.state === "running" ? "on" : "waiting");
export const onChange = (cb) => listeners.push(cb);
const emit = () => listeners.forEach((f) => f());

function build() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  ctx.onstatechange = () => { pump(); emit(); };
  master = ctx.createGain(); master.gain.value = 0;
  const warm = ctx.createBiquadFilter(); warm.type = "lowpass"; warm.frequency.value = 3800;
  const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -14; lim.ratio.value = 10;
  master.connect(warm).connect(lim).connect(ctx.destination);
  const lfo = ctx.createOscillator(), lg = ctx.createGain(); // slow "tape" breathing on the filter
  lfo.frequency.value = 0.07; lg.gain.value = 600; lfo.connect(lg).connect(warm.frequency); lfo.start();
  echoIn = ctx.createGain(); echoIn.gain.value = 0.22; // dotted-eighth echo
  const dl = ctx.createDelay(1), fb = ctx.createGain(), ef = ctx.createBiquadFilter();
  dl.delayTime.value = (60 / BPM) * 0.75; fb.gain.value = 0.38; ef.type = "lowpass"; ef.frequency.value = 1800;
  echoIn.connect(dl); dl.connect(ef); ef.connect(fb); fb.connect(dl); ef.connect(master);
  bus = ctx.createGain(); bus.connect(master);
  const len = ctx.sampleRate * 1.8, ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3; }
  const verb = ctx.createConvolver(); verb.buffer = ir; verbIn = ctx.createGain(); verbIn.gain.value = 0.3;
  verbIn.connect(verb).connect(master);
  nb = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate);
  const n = nb.getChannelData(0); for (let i = 0; i < n.length; i++) n[i] = Math.random() * 2 - 1;
  const cl = ctx.sampleRate * 3, cb = ctx.createBuffer(1, cl, ctx.sampleRate), cd = cb.getChannelData(0);
  for (let i = 0; i < cl; i++) cd[i] = (Math.random() * 2 - 1) * (Math.random() > 0.9993 ? 0.7 : 0.012);
  const cs = ctx.createBufferSource(); cs.buffer = cb; cs.loop = true;
  const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1200;
  const cg = ctx.createGain(); cg.gain.value = 0.1; cs.connect(hp).connect(cg).connect(master); cs.start();
}

function tine(m, t, dur, peak, echo, pan) { // soft electric-piano note
  const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), g2 = ctx.createGain();
  o.type = o2.type = "sine"; o.frequency.value = hz(m); o2.frequency.value = hz(m) * 4;
  o.detune.value = o2.detune.value = (Math.random() - 0.5) * 10;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g2.gain.setValueAtTime(peak * 0.25, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
  o.connect(g); o2.connect(g2); g2.connect(g);
  let out = g;
  if (ctx.createStereoPanner) { out = ctx.createStereoPanner(); out.pan.value = pan || 0; g.connect(out); }
  out.connect(bus); out.connect(verbIn); if (echo) out.connect(echoIn);
  o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
}
function bass(m, t, dur) {
  const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = hz(m);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.09, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(bus); o.start(t); o.stop(t + dur + 0.05);
}
function kick(t, vel = 1) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
  g.gain.setValueAtTime(0.3 * vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
  o.connect(g).connect(master); o.start(t); o.stop(t + 0.3);
  if (vel === 1) { // duck the rest slightly (lo-fi pump) and pulse the page on the beat
    bus.gain.setValueAtTime(1, t); bus.gain.linearRampToValueAtTime(0.78, t + 0.012); bus.gain.linearRampToValueAtTime(1, t + 0.3);
    setTimeout(() => { const c = document.documentElement.classList; c.add("beat"); setTimeout(() => c.remove("beat"), 140); }, Math.max(0, (t - ctx.currentTime) * 1000));
  }
}
function hit(t, type, freq, peak, dur) {
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = nb; f.type = type; f.frequency.value = freq;
  g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(bus); if (type === "bandpass") g.connect(verbIn);
  s.start(t, Math.random() * 0.3); s.stop(t + dur + 0.02);
}
function sched(i, t) {
  const b = i % 16, p = i % 32, ch = prog[Math.floor(i / 32) % prog.length], h = (Math.random() - 0.5) * 0.012;
  const sw = b % 4 === 2 ? 0.04 : 0, r = Math.random(), open = b === 14 && r < 0.5;
  if (p === 0) ch.notes.forEach((m, k) => tine(m, t + k * 0.02, 3.4, 0.05, false, (k - 1.5) * 0.25));
  if (p === 26) ch.notes.forEach((m, k) => tine(m, t + k * 0.025, 1.6, 0.03, true, (1.5 - k) * 0.25));
  if (b === 0 || b === 10) kick(t + h); else if ((b === 6 || b === 13) && r < 0.25) kick(t + h, 0.5);
  if (b === 4 || b === 12) hit(t + h, "bandpass", 1700, 0.09, 0.14);
  else if ((b === 7 || b === 14) && r < 0.3) hit(t + h, "bandpass", 2000, 0.03, 0.08);
  if (b % 2 === 0 && Math.random() > 0.12) hit(t + sw + h, "highpass", open ? 6500 : 7500, open ? 0.03 : 0.02 + Math.random() * 0.02, open ? 0.14 : 0.04);
  if (p === 0 || p === 16 || p === 24) bass(ch.bass, t, 0.9);
  if (p === 10) bass(ch.bass, t, 0.35);
  if (i % 2 === 0 && Math.random() < 0.16) {
    const pool = [...ch.notes.map((n) => n + 12), ch.bass + 24];
    tine(pool[(Math.random() * pool.length) | 0], t + sw, 1.8, 0.024, true, Math.random() * 1.2 - 0.6);
  }
}
function pump() {
  if (!want || !ctx || ctx.state !== "running") return;
  if (next < ctx.currentTime) next = ctx.currentTime + 0.05;
  while (next < ctx.currentTime + 1) { sched(step++, next); next += SD; }
}

export function start() {
  want = true; store(K, "on");
  if (!ctx) build();
  master.gain.setTargetAtTime(gainOf(vol), ctx.currentTime, 0.4);
  ctx.resume().then(() => { pump(); emit(); }).catch(() => {});
  if (!timer) timer = setInterval(pump, 250);
  emit();
}
export function stop() {
  want = false; store(K, "off");
  if (ctx) { master.gain.setTargetAtTime(0, ctx.currentTime, 0.15); setTimeout(() => { if (!want) ctx.suspend(); }, 700); }
  emit();
}
export function unlock() { if (want && ctx && ctx.state !== "running") ctx.resume().catch(() => {}); }
export function setVolume(v) {
  vol = v; store(V, v);
  if (master && want) master.gain.setTargetAtTime(gainOf(v), ctx.currentTime, 0.08);
}
document.addEventListener("visibilitychange", () => {
  if (!ctx || !want) return;
  document.hidden ? ctx.suspend() : ctx.resume().catch(() => {});
});

// Tiny UI blip, only while music is on, so it follows the same volume.
export function blip(f = 660) {
  if (state() !== "on") return;
  const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.6, t + 0.08);
  g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  o.connect(g); g.connect(bus); g.connect(verbIn); o.start(t); o.stop(t + 0.14);
}

// Quiet the background lo-fi while a beat or the pad is playing.
export function duck(on) {
  if (master && want) master.gain.setTargetAtTime(on ? gainOf(vol) * 0.12 : gainOf(vol), ctx.currentTime, 0.2);
}

// Soft, cute lo-fi, synthesized live (no files, no licensing). Only smooth tones: warm electric-piano chords,
// a little music-box melody, a gentle bass and soft ticks. No noise, no crackle, no deep sub bass (phone speakers hate that).
// On by default at low volume. Browsers only let audio start after a tap, so "on" waits for the first interaction.
const K = "xion-music", V = "xion-vol", BPM = 68, SD = 60 / BPM / 2; // eighth-note grid
const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const store = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
const sv = read(V);
let vol = sv === null ? 35 : +sv;
let ctx, master, bus, echoIn, timer, want = false, step = 0, next = 0;
const listeners = [];
const gainOf = (v) => Math.pow(v / 100, 1.5) * 2;
const hz = (m) => 440 * 2 ** ((m - 69) / 12);
const prog = [ // Cmaj9, Am9, Fmaj9, G6: two bars each, with a short music-box phrase per chord
  { bass: 48, notes: [52, 55, 59, 62], mel: [[2, 79], [4, 76], [7, 74], [10, 76], [12, 72]] },
  { bass: 45, notes: [55, 59, 60, 64], mel: [[2, 76], [4, 72], [7, 76], [10, 81], [12, 79]] },
  { bass: 53, notes: [57, 60, 64, 67], mel: [[2, 81], [4, 77], [7, 72], [10, 77], [12, 74]] },
  { bass: 55, notes: [59, 62, 64, 67], mel: [[2, 74], [4, 79], [7, 71], [10, 74], [12, 79]] },
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
  const soft = ctx.createBiquadFilter(); soft.type = "lowpass"; soft.frequency.value = 2800; soft.Q.value = 0.4;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 24; comp.ratio.value = 3; comp.attack.value = 0.02; comp.release.value = 0.3;
  master.connect(soft).connect(comp).connect(ctx.destination);
  bus = ctx.createGain(); bus.connect(master);
  echoIn = ctx.createGain(); echoIn.gain.value = 0.35; // dotted-eighth echo, softened
  const dl = ctx.createDelay(1), fb = ctx.createGain(), ef = ctx.createBiquadFilter();
  dl.delayTime.value = (60 / BPM) * 0.75; fb.gain.value = 0.3; ef.type = "lowpass"; ef.frequency.value = 1500;
  echoIn.connect(dl); dl.connect(ef); ef.connect(fb); fb.connect(dl); ef.connect(master);
}
function out(node, pan, echo) { // send a voice to the mix with a little stereo placement
  let o = node;
  if (ctx.createStereoPanner) { o = ctx.createStereoPanner(); o.pan.value = pan || 0; node.connect(o); }
  o.connect(bus); if (echo) o.connect(echoIn);
}
function note(m, t, dur, peak, pan, echo) { // warm electric piano / music box: two slightly detuned sines plus a quiet octave
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  [[1, 3, 0.5], [1, -3, 0.5], [2, 0, 0.06]].forEach(([mul, d, a]) => {
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.frequency.value = hz(m) * mul; o.detune.value = d; og.gain.value = a;
    o.connect(og).connect(g); o.start(t); o.stop(t + dur + 0.05);
  });
  out(g, pan, echo);
}
function bass(m, t, dur) {
  const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = hz(m);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.11, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); out(g, 0, false); o.start(t); o.stop(t + dur + 0.05);
}
function kick(t) { // a soft thump, plus a visual pulse on the page
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(75, t + 0.12);
  g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  o.connect(g); out(g, 0, false); o.start(t); o.stop(t + 0.22);
  setTimeout(() => { const els = document.querySelectorAll("[data-beat]"); els.forEach((e) => e.classList.add("pulse")); setTimeout(() => els.forEach((e) => e.classList.remove("pulse")), 140); }, Math.max(0, (t - ctx.currentTime) * 1000));
}
function tick(t) { // tiny wood-block tick instead of noisy snares or hats
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "triangle";
  o.frequency.setValueAtTime(1100, t); o.frequency.exponentialRampToValueAtTime(700, t + 0.04);
  g.gain.setValueAtTime(0.045, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  o.connect(g); out(g, 0.15, false); o.start(t); o.stop(t + 0.09);
}
function sched(i, t) {
  const p = i % 16, b = p % 8, ch = prog[Math.floor(i / 16) % prog.length], sw = i % 2 ? 0.03 : 0, h = (Math.random() - 0.5) * 0.01;
  if (p === 0) ch.notes.forEach((m, k) => note(m, t + k * 0.025, 4.2, 0.06, (k - 1.5) * 0.18, false));
  if (p === 8) ch.notes.forEach((m, k) => note(m, t + k * 0.03, 2.2, 0.035, (1.5 - k) * 0.18, true));
  if (b === 0) bass(ch.bass, t, 1.6); else if (b === 5) bass(ch.bass, t + sw, 0.7);
  if (b === 0 || b === 5) kick(t + h); else if (b === 2 || b === 6) tick(t + h);
  ch.mel.forEach(([s, m]) => { if (s === p && Math.random() > 0.12) note(m, t + sw, 1.5, 0.045, Math.random() * 0.8 - 0.4, true); });
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
export function duck(on) { // quiet the lo-fi while a beat or the pad plays
  if (master && want) master.gain.setTargetAtTime(on ? gainOf(vol) * 0.12 : gainOf(vol), ctx.currentTime, 0.2);
}
export function blip(f = 660) { // tiny UI blip, only while music is on
  if (state() !== "on") return;
  const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.4, t + 0.08);
  g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  o.connect(g); g.connect(bus); g.connect(echoIn); o.start(t); o.stop(t + 0.14);
}
document.addEventListener("visibilitychange", () => {
  if (!ctx || !want) return;
  document.hidden ? ctx.suspend() : ctx.resume().catch(() => {});
});

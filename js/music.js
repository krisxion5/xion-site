// Original generative lo-fi: soft chords + filtered vinyl hiss, synthesized live (no audio files, no licensing).
const KEY = "xion-music";
let ctx, master, timer, on = false;
const chords = [[57,60,64,67],[53,57,60,64],[55,59,62,65],[52,55,59,62]];
const hz = (m) => 440 * 2 ** ((m - 69) / 12);

function setup() {
  ctx = new AudioContext();
  master = ctx.createGain(); master.gain.value = 0;
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900;
  master.connect(lp).connect(ctx.destination);
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (Math.random() > 0.995 ? 0.5 : 0.04);
  const n = ctx.createBufferSource(); n.buffer = buf; n.loop = true;
  const g = ctx.createGain(); g.gain.value = 0.25; n.connect(g).connect(master); n.start();
}
function play(chord, t) {
  chord.forEach((m, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "triangle"; o.frequency.value = hz(m) * (1 + (i - 1.5) * 0.0015);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.07, t + 1.2);
    g.gain.linearRampToValueAtTime(0, t + 4.2);
    o.connect(g).connect(master); o.start(t); o.stop(t + 4.3);
  });
}
function loop() {
  let i = 0, next = ctx.currentTime + 0.1;
  const tick = () => { while (next < ctx.currentTime + 4) { play(chords[i++ % 4], next); next += 4; } };
  tick(); timer = setInterval(tick, 1000);
}
export async function start() {
  if (on) return;
  if (!ctx) setup();
  await ctx.resume();
  if (!timer) loop();
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2);
  on = true; sessionStorage.setItem(KEY, "on");
}
export function stop() {
  if (!on) return;
  master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
  on = false; sessionStorage.setItem(KEY, "off");
}
export const isOn = () => on;
export const wasOn = () => sessionStorage.getItem(KEY) === "on";

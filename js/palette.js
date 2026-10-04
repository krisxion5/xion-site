// Quick-jump menu (Ctrl/Cmd+K or the Jump button), copy buttons and toast.
import { CONFIG } from "./config.js";
import * as music from "./music.js";
const $ = (s) => document.querySelector(s);
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
let toastTimer;
export function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}
async function copy(text, label) {
  try { await navigator.clipboard.writeText(text); toast(label + " copied"); }
  catch { toast("Couldn't copy. Select it manually."); }
}
const go = (id) => () => document.getElementById(id)?.scrollIntoView({ behavior: calm ? "auto" : "smooth" });

export function initPalette() {
  const dlg = $("#cmd"), q = $("#cmdq"), list = $("#cmdl");
  const cmds = [
    ["Work", go("work")], ["MCPE Community", go("mcpe")], ["Skills", go("skills")], ["How I work", go("process")],
    ["Beyond code", go("beyond")], ["Beats", go("beats")], ["Questions", go("faq")], ["About", go("about")], ["Play: squash bugs", go("play")], ["Contact", go("contact")],
    ["Toggle music", () => { const s = music.state(); s === "waiting" ? music.unlock() : s === "on" ? music.stop() : music.start(); }],
    ["Copy email", () => copy(CONFIG.email, "Email")], ["Copy Discord handle", () => copy(CONFIG.discordHandle, "Handle")],
    ["Open Discord", () => window.open(CONFIG.discordUrl, "_blank", "noopener")], ["Back to top", go("top")],
  ];
  let shown = cmds, sel = 0;
  const draw = () => {
    list.textContent = "";
    shown.forEach(([n], i) => {
      const li = document.createElement("li"); li.setAttribute("role", "option"); li.textContent = n;
      li.setAttribute("aria-selected", i === sel); li.addEventListener("click", () => run(i)); list.append(li);
    });
    list.children[sel]?.scrollIntoView({ block: "nearest" });
  };
  const run = (i) => { const c = shown[i]; if (c) { dlg.close(); c[1](); } };
  const open = () => { q.value = ""; shown = cmds; sel = 0; draw(); dlg.showModal(); q.focus(); };
  q.addEventListener("input", () => { const v = q.value.toLowerCase(); shown = cmds.filter(([n]) => n.toLowerCase().includes(v)); sel = 0; draw(); });
  q.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(sel + 1, shown.length - 1); draw(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(sel - 1, 0); draw(); }
    else if (e.key === "Enter") { e.preventDefault(); run(sel); }
  });
  dlg.addEventListener("click", (e) => e.target === dlg && dlg.close());
  addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); dlg.open ? dlg.close() : open(); }
  });
  $("#quick").addEventListener("click", open);
  document.querySelectorAll("[data-copy]").forEach((b) => b.addEventListener("click", () =>
    b.dataset.copy === "email" ? copy(CONFIG.email, "Email") : copy(CONFIG.discordHandle, "Handle")));
}

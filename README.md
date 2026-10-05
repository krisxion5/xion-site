# Xion portfolio

Static site: plain HTML, CSS and ES modules. No build step, no dependencies, no secrets, no environment variables.

## Edit
- `js/config.js`: Discord profile URL/handle, email, site URL.
- `js/projects.js`: project data. Add screenshots to `img/` (WebP, about 1200x750) and set `image`, `github`, `live`.
- `index.html`: MCPE section. Confirm the community's member count before stating it.
- Add `img/og.png` (1200x630) for link previews.

## Run locally (Termux or desktop)
ES modules need a server, not `file://`:
```
pkg install python   # Termux only
python -m http.server 3000
```
Open http://localhost:3000

## Deploy: GitHub
```
git init && git add . && git commit -m "Initial portfolio"
git branch -M main
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```
## Deploy: Vercel
1. vercel.com > Add New > Project > import the GitHub repo.
2. Framework preset: **Other**. Leave build command and output directory empty.
3. Deploy. Every push to `main` redeploys. Update `siteUrl` after you get your domain.

## Music
Soft, cute lo-fi synthesized in the browser (`js/music.js`): electric-piano chords (Cmaj9, Am9, Fmaj9, G6), a little music-box melody, gentle bass and soft ticks. No noise, no crackle, no files and no licensing. On by default at a low volume with a slider in the nav. Browsers block sound until the first tap, so the button reads "Tap for music" until then. Turning it off is remembered. The logo dot and the mascot ring pulse on the thump, and small notes float up from the button while it plays.

## Motion and performance
Animations live in `js/fx.js` and the bottom of `css/style.css`. They use only transform and opacity, run once on scroll via IntersectionObserver, pause when the tab is hidden or the hero is off screen, and switch off with `prefers-reduced-motion`. There is no canvas, no particle system and no animated blur. Mouse-only extras (hero light, card glow) are skipped on touch devices.

## Features
Quick-jump menu (Ctrl/Cmd+K or the Jump button), copy-email and copy-handle buttons, a bug-squash mini game (best score saved on the device), a mascot with a hidden cool mode, tiny UI blips while music is on, and a one-time loading screen per session.

## Updating from a new zip
`js/config.js` is deliberately not inside update zips, so your details are never overwritten. First time on a fresh clone: copy `js/config.example.js` to `js/config.js` and fill it in.
```
cd ~/mysite
unzip -o ~/storage/downloads/xion-portfolio.zip
cd xion-portfolio
git add . && git commit -m "Update" && git push
```

## Adding your beats
Copy an mp3 into `audio/`, then add an entry in `js/beats.js`, for example `{ title: "Midnight loop", meta: "78 BPM", audio: "audio/midnight-loop.mp3", link: "" }`. Use only music you made or have rights to. The background lo-fi quiets itself while a beat plays.

## My note
`note.html` (with `css/note.css` and `js/note.js`) holds "The Infinite Paradox". Edit the text directly in `note.html`; chapters are plain `<section class="ch">` blocks.

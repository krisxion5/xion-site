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
Lo-fi is synthesized in the browser (`js/music.js`): electric-piano chords, soft drums, bass and vinyl crackle. No audio files, no licensing. It is on by default at a low volume, with a slider in the nav. Browsers block sound until the first tap, so the button reads "Tap for music" until then. Turning it off is remembered.

## Motion and performance
Animations live in `js/fx.js` and the bottom of `css/style.css`. They use only transform and opacity, run once on scroll via IntersectionObserver, pause when the tab is hidden or the hero is off screen, and switch off with `prefers-reduced-motion`. There is no canvas, no particle system and no animated blur. Mouse-only extras (hero light, card glow) are skipped on touch devices.

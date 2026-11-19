# Vice Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/redsparksz/gta6-cover-art-01/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/redsparksz/gta6-cover-art-01/reward.svg)](https://make.fun/c/gta6-cover-art-01)

**Your photo. Your caption. Vice City cover.**

Vice Cover Studio is an offline web app that turns your own photos and a
caption into GTA-style multi-panel poster cover art, and exports it as a PNG
to share. Made for the make.fun competition
[gta6-cover-art-01](https://make.fun/c/gta6-cover-art-01) ("Make GTA 6 Cover
Art").

## What it does

- **Any photo** — add one photo or several from your machine (nothing is
  ever uploaded). Click a panel in the live preview to select it, then click
  a thumbnail to place a photo there. Drag a panel to pan its photo, scroll
  to zoom, or use the zoom slider. One photo can fill several panels with a
  different crop in each.
- **Multi-panel poster** — three layouts: Hero + 2 (one tall hero panel and
  two stacked), Grid 2×2, and Full-bleed (one big photo plus a detail strip).
  Panels are separated by thick white frames, with a bold tilted caption
  across the bottom and a tracked-out strip label on top.
- **Vice City grades** — Sunset (magenta → orange), Neon Night (cyan /
  magenta on deep night blue) and Palm Dusk (gold / violet), each with a
  vignette and a fine printed-poster grain.
- **Fast and easy** — photo in, caption typed, size picked, one Export click.
  Three common post sizes: 1080 × 1080, 1080 × 1350 and 1920 × 1080, all
  rendered at full export resolution.
- **Bold lettering** — the caption is set in Anton with a thick dark outline,
  a hard offset colour layer for a 3D poster step, and auto-fit wrapping over
  at most two lines. The strip label is set in Bebas Neue.

## Run it

```bash
node serve.ts        # serves app/ at http://localhost:8080
```

No build step, no network request: every script, font and image is a file
under `app/`. Open `app/index.html` in desktop Chrome from any static file
server and it works offline.

## Files

- `app/index.html`, `app/style.css` — the editor (dark 21st.dev-style
  chrome, one magenta accent).
- `app/src/main.js` — wiring: uploads, panel picking, drag/wheel crop,
  pickers, export, `?shot=` scenes.
- `app/src/cover.js` — compositing: panel layout, frames, grade, caption
  band, selection outline (preview only).
- `app/src/photos.js` — photo state per panel: load, assign, zoom/pan crop.
- `app/src/grade.js` — the three colour-grade presets (pure data + paint).
- `app/src/lettering.js` — caption wrap/fit/outline and the strip label.
- `app/src/shots.js` — deterministic screenshot scenes (`?shot=cover` /
  `?shot=editor`).
- `app/fonts/` — Anton, Bebas Neue and Archivo Black (SIL Open Font
  License 1.1; see `app/fonts/OFL.txt`).
- `app/samples/` — two sample photos made with an image model for make.fun,
  free to use.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to
  `/output` and writes `dossier.json`.

## Credits

- Fonts: Anton, Bebas Neue and Archivo Black, all under the SIL Open Font
  License 1.1 (see `app/fonts/OFL.txt`).
- Sample photos: made with an image model for make.fun, free to use.
- An original design — no Rockstar Games logo, artwork, character or font.

## License

MIT — see [LICENSE](LICENSE).

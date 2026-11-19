// Colour grades for the cover: each preset is a small table of washes that
// get painted over the photo panels. All values are plain data so a preset
// can be swapped without touching the drawing code.

export const GRADES = {
  sunset: {
    label: 'Sunset',
    // Warm wash rising from the bottom, magenta into orange.
    bottom: [
      [0.0, 'rgba(255, 94, 58, 0)'],
      [0.45, 'rgba(255, 94, 58, 0.24)'],
      [1.0, 'rgba(255, 46, 136, 0.6)'],
    ],
    // Cool violet pulled down from the top edge.
    top: [
      [0.0, 'rgba(123, 47, 247, 0.34)'],
      [0.35, 'rgba(123, 47, 247, 0)'],
    ],
    veil: 'rgba(255, 122, 26, 0.10)',
    veilMode: 'soft-light',
    vignette: 'rgba(43, 10, 64, 0.55)',
    accent: '#ffd166',
  },
  neon: {
    label: 'Neon Night',
    bottom: [
      [0.0, 'rgba(0, 229, 255, 0)'],
      [0.5, 'rgba(0, 229, 255, 0.14)'],
      [1.0, 'rgba(255, 46, 136, 0.55)'],
    ],
    top: [
      [0.0, 'rgba(11, 6, 32, 0.55)'],
      [0.4, 'rgba(11, 6, 32, 0)'],
    ],
    veil: 'rgba(0, 229, 255, 0.16)',
    veilMode: 'overlay',
    vignette: 'rgba(4, 2, 18, 0.6)',
    accent: '#00e5ff',
  },
  dusk: {
    label: 'Palm Dusk',
    bottom: [
      [0.0, 'rgba(255, 179, 71, 0)'],
      [0.5, 'rgba(255, 179, 71, 0.26)'],
      [1.0, 'rgba(142, 45, 226, 0.58)'],
    ],
    top: [
      [0.0, 'rgba(70, 20, 110, 0.38)'],
      [0.35, 'rgba(70, 20, 110, 0)'],
    ],
    veil: 'rgba(255, 179, 71, 0.10)',
    veilMode: 'soft-light',
    vignette: 'rgba(46, 16, 60, 0.5)',
    accent: '#ffb347',
  },
};

/** Paint one vertical wash from a list of [stop, colour] pairs. */
function wash(ctx, w, h, stops, fromY, toY) {
  const g = ctx.createLinearGradient(0, fromY, 0, toY);
  for (const [at, colour] of stops) g.addColorStop(at, colour);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** Darken the corners so the middle of the cover glows. */
function vignette(ctx, w, h, colour) {
  const r = Math.hypot(w, h) / 2;
  const g = ctx.createRadialGradient(w / 2, h * 0.45, r * 0.35, w / 2, h * 0.45, r);
  g.addColorStop(0, 'rgba(0, 0, 0, 0)');
  g.addColorStop(1, colour);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** A faint printed-poster grain, drawn from a tiny generated tile. */
let grainTile = null;
function grain(ctx, w, h) {
  if (!grainTile) {
    const t = document.createElement('canvas');
    t.width = 128; t.height = 128;
    const tc = t.getContext('2d');
    const img = tc.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(Math.random() * 255);
      img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 14;
    }
    tc.putImageData(img, 0, 0);
    grainTile = t;
  }
  const pattern = ctx.createPattern(grainTile, 'repeat');
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Apply a named grade over the whole cover. Unknown names fall back to sunset. */
export function applyGrade(ctx, w, h, name) {
  const p = GRADES[name] || GRADES.sunset;
  ctx.save();
  wash(ctx, w, h, p.bottom, h * 0.3, h);
  wash(ctx, w, h, p.top, 0, h * 0.55);
  ctx.globalCompositeOperation = p.veilMode;
  ctx.fillStyle = p.veil;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  vignette(ctx, w, h, p.vignette);
  grain(ctx, w, h);
  ctx.restore();
  return p;
}

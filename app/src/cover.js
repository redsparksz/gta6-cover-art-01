// Compositing: turn the board's panels, a layout, a grade and two lines of
// text into one finished cover. The same function paints the live preview
// and the full-resolution export, so what you see is what you get.

import { applyGrade, GRADES } from './grade.js';
import { drawCaption, drawStripLabel, stripWidth } from './lettering.js';
import { PhotoBoard } from './photos.js';

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait' },
  '1920x1080': { w: 1920, h: 1080, label: 'Landscape' },
};

export const LAYOUTS = {
  hero: { label: 'Hero + 2', panels: 3 },
  quad: { label: 'Grid 2×2', panels: 4 },
  strip: { label: 'Full-bleed', panels: 2 },
};

/**
 * Panel rectangles for a layout at canvas size (w, h).
 * Returns { rects, captionBox, labelPos }: rects are the photo panels,
 * captionBox is where the big caption sits, labelPos the strip label.
 */
export function layoutPanels(layout, w, h) {
  const captionH = Math.round(h * 0.27);
  const photoH = h - captionH;
  const g = Math.max(4, Math.round(w * 0.008)); // white gutter between panels
  const rects = [];
  if (layout === 'quad') {
    const cw = (w - g) / 2;
    const ch = (photoH - g) / 2;
    rects.push(
      { x: 0, y: 0, w: cw, h: ch },
      { x: cw + g, y: 0, w: cw, h: ch },
      { x: 0, y: ch + g, w: cw, h: ch },
      { x: cw + g, y: ch + g, w: cw, h: ch },
    );
  } else if (layout === 'strip') {
    const stripH = Math.round(photoH * 0.2);
    rects.push(
      { x: 0, y: 0, w, h: photoH - stripH - g },
      { x: 0, y: photoH - stripH, w, h: stripH },
    );
  } else {
    // hero: one tall panel left, two stacked on the right.
    const heroW = Math.round(w * 0.58);
    const sideW = w - heroW - g;
    const sideH = (photoH - g) / 2;
    rects.push(
      { x: 0, y: 0, w: heroW, h: photoH },
      { x: heroW + g, y: 0, w: sideW, h: sideH },
      { x: heroW + g, y: sideH + g, w: sideW, h: sideH },
    );
  }
  return {
    rects,
    captionBox: { x: w * 0.04, y: photoH + captionH * 0.06, w: w * 0.92, h: captionH * 0.88 },
    labelPos: { x: w * 0.045, y: Math.round(h * 0.045) },
    gutter: g,
  };
}

/** A soft placeholder panel (diagonal sunset) for slots with no photo yet. */
function paintPlaceholder(ctx, rect, i) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  const hues = [['#ff5e3a', '#7b2ff7'], ['#00e5ff', '#ff2e88'], ['#ffb347', '#8e2de2'], ['#ff2e88', '#2b0a40']];
  const [a, b] = hues[i % hues.length];
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `${Math.max(14, rect.h * 0.06)}px "Bebas Neue", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ADD PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
}

/**
 * Paint the whole cover onto `canvas`.
 * opts: { board, layout, grade, caption, sub, highlight } — highlight is a
 * panel index outlined only in the live preview, never in an export.
 */
export function drawCover(canvas, opts) {
  const { board, layout = 'hero', grade = 'sunset', caption = '', sub = '' } = opts;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const plan = layoutPanels(layout, w, h);
  const preset = GRADES[grade] || GRADES.sunset;

  ctx.fillStyle = '#14081f';
  ctx.fillRect(0, 0, w, h);

  // Photos, each clipped to its panel, with a white frame between them.
  plan.rects.forEach((rect, i) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    const slot = board.slot(i);
    if (!slot || !PhotoBoard.paintSlot(ctx, slot, rect)) paintPlaceholder(ctx, rect, i);
    ctx.restore();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(3, plan.gutter * 0.9);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });

  // A diagonal accent slash across the photo area, poster style.
  ctx.save();
  ctx.strokeStyle = preset.accent;
  ctx.lineWidth = Math.max(3, w * 0.004);
  ctx.beginPath();
  ctx.moveTo(w * 0.02, plan.rects[0].h * 0.02);
  ctx.lineTo(w * 0.24, plan.rects[0].h * 0.02);
  ctx.stroke();
  ctx.restore();

  // The grade wash + grain over the photos.
  applyGrade(ctx, w, h, grade);

  // Darken the caption band so the lettering always reads.
  const band = ctx.createLinearGradient(0, h * 0.68, 0, h);
  band.addColorStop(0, 'rgba(13, 5, 18, 0)');
  band.addColorStop(1, 'rgba(13, 5, 18, 0.78)');
  ctx.fillStyle = band;
  ctx.fillRect(0, 0, w, h);

  // Strip label, top-left, with a small accent bar under it.
  const labelSize = Math.max(18, Math.round(w * 0.022));
  const lx = plan.labelPos.x;
  const ly = plan.labelPos.y;
  if (sub.trim()) {
    drawStripLabel(ctx, sub, lx, ly, labelSize, '#ffffff');
    const lw = stripWidth(ctx, sub, labelSize);
    ctx.fillStyle = preset.accent;
    ctx.fillRect(lx, ly + labelSize * 0.75, Math.min(lw, w * 0.22), Math.max(3, labelSize * 0.14));
  }

  // The big caption, tilted, outlined, with its hard offset layer.
  drawCaption(ctx, caption, plan.captionBox, preset.accent);

  // Preview-only: outline the selected panel so the user sees the target.
  if (typeof opts.highlight === 'number' && plan.rects[opts.highlight]) {
    const r = plan.rects[opts.highlight];
    ctx.save();
    ctx.strokeStyle = preset.accent;
    ctx.lineWidth = Math.max(4, w * 0.006);
    ctx.setLineDash([Math.max(10, w * 0.012), Math.max(8, w * 0.008)]);
    ctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
    ctx.restore();
  }
  return plan;
}

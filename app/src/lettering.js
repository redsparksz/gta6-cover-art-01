// Bold poster lettering: a caption drawn twice (hard offset colour layer
// behind, white face on top) with a thick dark outline, tilted a few
// degrees, plus a small tracked-out strip label in Bebas Neue.

/** Split a caption into at most two lines that fit inside `maxW`. */
export function wrapCaption(ctx, text, maxW) {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines = [''];
  for (const word of words) {
    const trial = lines[lines.length - 1] ? `${lines[lines.length - 1]} ${word}` : word;
    if (ctx.measureText(trial).width <= maxW || !lines[lines.length - 1]) {
      lines[lines.length - 1] = trial;
    } else if (lines.length < 2) {
      lines.push(word);
    } else {
      // Third line and beyond: squeeze the last word onto line two.
      lines[1] = `${lines[1]} ${word}`;
    }
  }
  return lines;
}

/** Shrink the font until the widest line fits, starting from `start`. */
function fitSize(ctx, lines, start, maxW, family) {
  let size = start;
  while (size > 16) {
    ctx.font = `${size}px ${family}`;
    if (Math.max(...lines.map((l) => ctx.measureText(l).width)) <= maxW) break;
    size -= 3;
  }
  ctx.font = `${size}px ${family}`;
  return size;
}

/**
 * Draw the main caption centred in `box` ({x, y, w, h}), tilted -3deg.
 * `accent` is the colour of the hard offset layer behind the white face.
 * Returns the font size used, so the caller can scale the strip label.
 */
export function drawCaption(ctx, text, box, accent) {
  const clean = (text || '').trim().toUpperCase();
  if (!clean) return 0;
  const family = 'Anton, "Archivo Black", sans-serif';
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  // Measure at a big size first, then fit.
  ctx.font = `100px ${family}`;
  const raw = wrapCaption(ctx, clean, box.w);
  const size = fitSize(ctx, raw, Math.min(box.h * 0.62, box.w * 0.24), box.w, family);
  const lineH = size * 1.02;
  const totalH = lineH * raw.length;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  ctx.translate(cx, cy);
  ctx.rotate((-3 * Math.PI) / 180);
  const outline = Math.max(3, size * 0.085);
  raw.forEach((line, i) => {
    const y = (i - (raw.length - 1) / 2) * lineH;
    const dx = size * 0.045;
    const dy = size * 0.05;
    // Back layer: solid accent, shifted down-right — the poster's 3D step.
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.lineWidth = outline + size * 0.02;
    ctx.strokeText(line, dx, y + dy);
    ctx.fillStyle = accent;
    ctx.fillText(line, dx, y + dy);
    // Face: thick dark outline, then white fill.
    ctx.strokeStyle = '#0d0512';
    ctx.lineWidth = outline;
    ctx.strokeText(line, 0, y);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(line, 0, y);
    // A thin bright edge on the upper-left of the face.
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(line, -size * 0.012, y - size * 0.012);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(line, 0, y);
  });
  ctx.restore();
  return size;
}

/** Draw a tracked-out uppercase strip label, one letter at a time. */
export function drawStripLabel(ctx, text, x, y, size, colour) {
  const clean = (text || '').trim().toUpperCase();
  if (!clean) return;
  ctx.save();
  ctx.font = `${size}px "Bebas Neue", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colour;
  const gap = size * 0.32;
  let cx = x;
  for (const ch of clean) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + gap;
  }
  ctx.restore();
}

/** Width of a strip label drawn with the same tracking as drawStripLabel. */
export function stripWidth(ctx, text, size) {
  const clean = (text || '').trim().toUpperCase();
  if (!clean) return 0;
  ctx.save();
  ctx.font = `${size}px "Bebas Neue", sans-serif`;
  let w = 0;
  const gap = size * 0.32;
  for (const ch of clean) w += ctx.measureText(ch).width + gap;
  ctx.restore();
  return w - gap;
}

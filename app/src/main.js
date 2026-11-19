// Wires the studio: photo tray, panel picking and dragging, the caption and
// picker controls, and the full-resolution PNG export. A `?shot=` query
// builds a fixed scene for screenshots instead (./shots.js).

import { PhotoBoard, loadImage } from './photos.js';
import { drawCover, layoutPanels, SIZES, LAYOUTS } from './cover.js';
import { runShot, loadShotPhotos } from './shots.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subInput = document.getElementById('sub');
const status = document.getElementById('status');
const tray = document.getElementById('tray');
const zoomInput = document.getElementById('zoom');
const zoomVal = document.getElementById('zoomVal');
const panelInfo = document.getElementById('panelInfo');
const exportBtn = document.getElementById('export');

const board = new PhotoBoard(4);
const state = { layout: 'hero', grade: 'sunset', size: '1920x1080' };

function currentSize() {
  return SIZES[state.size] || SIZES['1920x1080'];
}

function redraw(highlight = true) {
  const { w, h } = currentSize();
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCover(canvas, {
    board,
    layout: state.layout,
    grade: state.grade,
    caption: captionInput.value,
    sub: subInput.value,
    highlight: highlight ? board.selected : undefined,
  });
  const slot = board.slot(board.selected);
  zoomInput.value = String(slot ? slot.zoom : 1);
  zoomVal.textContent = `${(slot ? slot.zoom : 1).toFixed(2)}×`;
  panelInfo.textContent = `Panel ${board.selected + 1} of ${layoutPanels(state.layout, w, h).rects.length} selected — drag to move, scroll to zoom`;
}

function setStatus(text, ok = false) {
  status.textContent = text;
  status.classList.toggle('ok', ok);
}

/** Rebuild the photo tray thumbnails from the library. */
function renderTray() {
  tray.innerHTML = '';
  if (!board.library.length) {
    const p = document.createElement('p');
    p.className = 'tray-empty';
    p.textContent = 'No photos yet — the samples below fill the panels until you add your own.';
    tray.appendChild(p);
    return;
  }
  board.library.forEach((entry, i) => {
    const thumb = document.createElement('img');
    thumb.src = entry.url || '';
    thumb.alt = entry.name;
    thumb.title = entry.name;
    if (board.slot(board.selected) && board.slot(board.selected).name === entry.name) thumb.classList.add('picked');
    thumb.addEventListener('click', () => {
      board.assign(i);
      renderTray();
      redraw();
    });
    tray.appendChild(thumb);
  });
}

// ---- uploads ----
document.getElementById('photos').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  if (!files.length) return;
  let added = 0;
  for (const file of files) {
    try {
      const url = URL.createObjectURL(file);
      const img = await loadImage(url);
      board.library.push({ img, name: file.name, url });
      const empty = board.slots.findIndex((s) => !s.img);
      board.assign(board.library.length - 1, empty >= 0 ? empty : board.selected);
      added += 1;
    } catch {
      setStatus(`Could not read ${file.name}.`);
    }
  }
  e.target.value = '';
  renderTray();
  redraw();
  if (added) setStatus(`${added} photo${added > 1 ? 's' : ''} added. Click a panel, then a thumbnail, to place it.`, true);
});

// ---- panel picking + drag pan + wheel zoom on the preview ----
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}

function panelAt(x, y) {
  const plan = layoutPanels(state.layout, canvas.width, canvas.height);
  return plan.rects.findIndex((rect) => x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h);
}

let dragging = null;
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const hit = panelAt(p.x, p.y);
  if (hit < 0) return;
  board.selected = hit;
  const slot = board.slot(hit);
  dragging = { lastX: p.x, lastY: p.y, moved: false, slot };
  canvas.setPointerCapture(e.pointerId);
  canvas.classList.add('dragging');
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const p = canvasPoint(e);
  const slot = dragging.slot;
  if (!slot || !slot.img) return;
  const dx = (p.x - dragging.lastX) / canvas.width;
  const dy = (p.y - dragging.lastY) / canvas.height;
  if (Math.abs(p.x - dragging.lastX) + Math.abs(p.y - dragging.lastY) > 2) dragging.moved = true;
  // Pan is stored as a fraction of the overflow, so it scales with the panel.
  slot.dx = Math.max(-1, Math.min(1, slot.dx + dx * 2.4));
  slot.dy = Math.max(-1, Math.min(1, slot.dy + dy * 2.4));
  dragging.lastX = p.x;
  dragging.lastY = p.y;
  redraw();
});
canvas.addEventListener('pointerup', () => {
  dragging = null;
  canvas.classList.remove('dragging');
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const slot = board.slot(board.selected);
  if (!slot || !slot.img) return;
  slot.zoom = Math.max(1, Math.min(3, slot.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  redraw();
}, { passive: false });

// ---- zoom slider / crop buttons ----
zoomInput.addEventListener('input', () => {
  const slot = board.slot(board.selected);
  if (!slot) return;
  slot.zoom = Number(zoomInput.value);
  redraw();
});
document.getElementById('fitBtn').addEventListener('click', () => {
  board.resetCrop();
  redraw();
  setStatus('Crop reset for the selected panel.', true);
});
document.getElementById('swapBtn').addEventListener('click', () => {
  board.spreadSelected();
  renderTray();
  redraw();
  setStatus('Selected photo now fills every panel.', true);
});

// ---- segmented pickers ----
function wireSeg(id, key, onPick) {
  const seg = document.getElementById(id);
  seg.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    seg.querySelectorAll('button').forEach((b) => b.classList.remove('on'));
    btn.classList.add('on');
    state[key] = btn.dataset[key];
    if (key === 'layout') board.resize(LAYOUTS[state.layout].panels);
    onPick();
  });
}
wireSeg('layoutSeg', 'layout', () => redraw());
wireSeg('gradeSeg', 'grade', () => redraw());
wireSeg('sizeSeg', 'size', () => redraw());

captionInput.addEventListener('input', () => redraw());
subInput.addEventListener('input', () => redraw());

// ---- export ----
exportBtn.addEventListener('click', async () => {
  exportBtn.disabled = true;
  setStatus('Rendering PNG…');
  try {
    await document.fonts.ready;
    const { w, h } = currentSize();
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    drawCover(off, {
      board,
      layout: state.layout,
      grade: state.grade,
      caption: captionInput.value,
      sub: subInput.value,
    });
    const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${w}x${h}.png`;
    a.click();
    setStatus(`Saved vice-cover-${w}x${h}.png (${(blob.size / 1024).toFixed(0)} KiB).`, true);
  } catch (err) {
    setStatus(`Export failed: ${err.message}`);
  } finally {
    exportBtn.disabled = false;
  }
});

// ---- boot: fonts, then default samples, then shot scenes ----
async function boot() {
  try {
    await document.fonts.load('100px Anton');
    await document.fonts.load('40px "Bebas Neue"');
    await document.fonts.ready;
  } catch {
    // Fallbacks still paint; the cover just loses the display face.
  }
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (shot) {
    await runShot(shot, params, async (scene) => {
      const { hero, second } = await loadShotPhotos(scene);
      state.layout = scene.layout;
      state.grade = scene.grade;
      state.size = scene.size;
      board.resize(LAYOUTS[state.layout].panels);
      board.library.push({ img: hero, name: `${scene.photo}.jpg`, url: `samples/${scene.photo}.jpg` });
      board.library.push({ img: second, name: `${scene.photo2}.jpg`, url: `samples/${scene.photo2}.jpg` });
      board.slots.forEach((s, i) => {
        s.img = i === 0 ? hero : second;
        s.name = i === 0 ? `${scene.photo}.jpg` : `${scene.photo2}.jpg`;
        // Each panel shows a different crop of its photo, so repeated
        // photos never look like a copy-paste: alternate the zoom and pan.
        s.zoom = 1 + 0.16 * i;
        s.dx = i % 2 === 0 ? -0.25 : 0.3;
        s.dy = i === 2 ? -0.45 : 0.12;
      });
      // The wide strip panel crops hard vertically: pull the frame up so
      // the subject's face stays in view instead of the middle of the sea.
      if (scene.layout === 'strip' && board.slots[1]) {
        board.slots[1].zoom = 1.25;
        board.slots[1].dx = -0.55;
        board.slots[1].dy = -0.1;
      }
      captionInput.value = scene.caption;
      subInput.value = scene.sub;
      syncPickers();
      renderTray();
      redraw(shot !== 'cover');
    });
    return;
  }
  // No shot: fill the panels with the free samples so the editor never opens empty.
  try {
    const pier = await loadImage('samples/pier.jpg');
    const blvd = await loadImage('samples/boulevard.jpg');
    board.library.push({ img: pier, name: 'pier.jpg', url: 'samples/pier.jpg' });
    board.library.push({ img: blvd, name: 'boulevard.jpg', url: 'samples/boulevard.jpg' });
    board.slots.forEach((s, i) => {
      s.img = i % 2 === 0 ? pier : blvd;
      s.name = i % 2 === 0 ? 'pier.jpg' : 'boulevard.jpg';
    });
  } catch {
    // Samples missing: placeholders keep the editor usable.
  }
  renderTray();
  redraw();
}

function syncPickers() {
  for (const [id, key] of [['layoutSeg', 'layout'], ['gradeSeg', 'grade'], ['sizeSeg', 'size']]) {
    document.getElementById(id).querySelectorAll('button').forEach((b) => {
      b.classList.toggle('on', b.dataset[key] === state[key]);
    });
  }
}

boot();

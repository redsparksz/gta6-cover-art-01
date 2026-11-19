// Fixed scenes for screenshots. A `?shot=` URL sets the whole editor state
// deterministically (sample photo, caption, layout, grade, size), then sets
// window.__shotReady once the fonts are in and the cover has painted twice.
// `?shot=cover` hides the editor chrome and shows the cover alone;
// `?shot=editor` keeps the full editor visible with a photo loaded.

import { loadImage } from './photos.js';

function waitPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

/**
 * `setup` receives the resolved scene ({ photo, caption, sub, layout, grade,
 * size }) and applies it to the live editor. Returns nothing; sets the ready
 * flag after the fonts load and two paints.
 */
export async function runShot(shot, query, setup) {
  const scene = {
    photo: query.get('photo') ?? 'pier',
    photo2: query.get('photo2') ?? 'boulevard',
    caption: query.get('caption') ?? 'VICE NIGHTS',
    sub: query.get('sub') ?? 'VICE CITY · EST. 2026',
    layout: query.get('layout') ?? 'hero',
    grade: query.get('grade') ?? 'sunset',
    size: query.get('size') ?? '1920x1080',
  };
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await setup(scene);
  try {
    await document.fonts.load('100px Anton');
    await document.fonts.load('40px "Bebas Neue"');
    await document.fonts.ready;
  } catch {
    // Fonts are local files; if one fails the fallback still paints.
  }
  await waitPaint();
  await waitPaint();
  window.__shotReady = true;
}

/** Load the two sample photos used by the shot scenes. */
export async function loadShotPhotos(scene) {
  const hero = await loadImage(`samples/${scene.photo}.jpg`);
  let second = hero;
  try {
    second = await loadImage(`samples/${scene.photo2}.jpg`);
  } catch {
    second = hero;
  }
  return { hero, second };
}

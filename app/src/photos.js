// Photo state: one slot per cover panel. A slot keeps its own image plus a
// crop (zoom + pan offsets), so re-cropping one panel never disturbs the
// others, and the same photo can sit in several panels with different crops.

/** Load an image element from a URL (object URL or a sample path). */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

function blankSlot() {
  return { img: null, name: '', zoom: 1, dx: 0, dy: 0 };
}

export class PhotoBoard {
  constructor(count) {
    this.slots = Array.from({ length: count }, blankSlot);
    this.selected = 0;
    this.library = []; // { img, name, url } in load order
  }

  /** Grow or shrink the slot list when a layout needs more/fewer panels. */
  resize(count) {
    while (this.slots.length < count) this.slots.push(blankSlot());
    this.slots.length = count;
    if (this.selected >= count) this.selected = 0;
  }

  slot(i) {
    return this.slots[i];
  }

  /** Put a library photo into a slot (or the selected one), keeping its crop. */
  assign(libIndex, slotIndex = this.selected) {
    const entry = this.library[libIndex];
    if (!entry) return false;
    const s = this.slots[slotIndex];
    s.img = entry.img;
    s.name = entry.name;
    s.zoom = 1; s.dx = 0; s.dy = 0;
    return true;
  }

  /** Add a File (or a loaded image) to the library and fill the first empty slot. */
  async addFile(file) {
    const url = URL.createObjectURL(file);
    const img = await loadImage(url);
    return this.addImage(img, file.name || 'photo');
  }

  async addImage(img, name) {
    const entry = { img, name, url: null };
    this.library.push(entry);
    const empty = this.slots.findIndex((s) => !s.img);
    if (empty >= 0) this.assign(this.library.length - 1, empty);
    else this.assign(this.library.length - 1, this.selected);
    return entry;
  }

  /** Copy the selected slot's photo into every slot. */
  spreadSelected() {
    const src = this.slots[this.selected];
    if (!src.img) return;
    for (const s of this.slots) {
      s.img = src.img; s.name = src.name;
      s.zoom = 1; s.dx = 0; s.dy = 0;
    }
  }

  resetCrop(slotIndex = this.selected) {
    const s = this.slots[slotIndex];
    s.zoom = 1; s.dx = 0; s.dy = 0;
  }

  /** Cover-fit draw of one slot inside `rect`, honouring zoom and pan. */
  static paintSlot(ctx, slot, rect) {
    const { img } = slot;
    if (!img) return false;
    const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
    const scale = base * slot.zoom;
    const pw = img.naturalWidth * scale;
    const ph = img.naturalHeight * scale;
    // Pan is a fraction of the overflow; clamp so the panel never shows void.
    const ox = Math.max(0, (pw - rect.w) / 2);
    const oy = Math.max(0, (ph - rect.h) / 2);
    const px = Math.max(-ox, Math.min(ox, slot.dx * ox));
    const py = Math.max(-oy, Math.min(oy, slot.dy * oy));
    ctx.drawImage(img, rect.x + (rect.w - pw) / 2 - px, rect.y + (rect.h - ph) / 2 - py, pw, ph);
    return true;
  }
}

// Procedural facade textures for the context buildings. They are rasterised into plain
// typed arrays and wrapped in THREE.DataTexture, so they need no canvas and no DOM: the
// same pixels in the browser and in Node. Generated texture sets attached later by
// material id (materials.js applyTextureManifest) simply replace the albedo.
//
// Every pattern is drawn in TILE space: u, v in 0..1 over one repeat of `tile` metres,
// v = 0 at the bottom (DataTexture is not flipped).
import * as THREE from 'three';

export function hex(c) {
  const n = parseInt(c.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

export function raster(w, h, bg) {
  const data = new Uint8Array(w * h * 4);
  const c0 = typeof bg === 'string' ? hex(bg) : bg;
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = c0[0];
    data[i * 4 + 1] = c0[1];
    data[i * 4 + 2] = c0[2];
    data[i * 4 + 3] = 255;
  }
  const api = {
    w,
    h,
    data,
    /** Filled rectangle in tile space; colour as hex string or [r, g, b]. */
    rect(u0, v0, u1, v1, col, alpha = 1) {
      const c = typeof col === 'string' ? hex(col) : col;
      const x0 = Math.max(0, Math.round(u0 * w));
      const x1 = Math.min(w, Math.max(x0 + 1, Math.round(u1 * w)));
      const y0 = Math.max(0, Math.round(v0 * h));
      const y1 = Math.min(h, Math.max(y0 + 1, Math.round(v1 * h)));
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * w + x) * 4;
          data[i] = data[i] + (c[0] - data[i]) * alpha;
          data[i + 1] = data[i + 1] + (c[1] - data[i + 1]) * alpha;
          data[i + 2] = data[i + 2] + (c[2] - data[i + 2]) * alpha;
        }
      }
      return api;
    },
    /** Per-pixel function (u, v, current rgb) => rgb | null. */
    each(fn) {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const c = fn((x + 0.5) / w, (y + 0.5) / h, [data[i], data[i + 1], data[i + 2]]);
          if (c) {
            data[i] = c[0];
            data[i + 1] = c[1];
            data[i + 2] = c[2];
          }
        }
      }
      return api;
    },
    /** Fine value noise (weathering), ±amp in 0..255 units. */
    noise(amp, seed = 7) {
      const r = rng(seed);
      for (let i = 0; i < w * h; i++) {
        const d = (r() - 0.5) * 2 * amp;
        data[i * 4] = Math.max(0, Math.min(255, data[i * 4] + d));
        data[i * 4 + 1] = Math.max(0, Math.min(255, data[i * 4 + 1] + d));
        data[i * 4 + 2] = Math.max(0, Math.min(255, data[i * 4 + 2] + d));
      }
      return api;
    },
  };
  return api;
}

export function toTexture(r, tileU, tileV = tileU, { srgb = true, nearest = false } = {}) {
  const t = new THREE.DataTexture(r.data, r.w, r.h, THREE.RGBAFormat);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / tileU, 1 / tileV);
  t.magFilter = nearest ? THREE.NearestFilter : THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

/**
 * A facade drawn as a grid of bays x floors.
 *   wall        base colour of the opaque parts
 *   win         { u0, u1, v0, v1 } window rectangle inside one bay / floor cell (fractions), or an array of them
 *   glass       glass colour; glassVar = per-pane brightness variation (blinds, reflections)
 *   frame       optional frame colour drawn around each window, frameW in cell fractions
 *   mullions    optional [{ every (bays), w (fraction of a bay), col }] vertical lines
 *   bands       optional [{ v0, v1, col }] horizontal bands per floor (spandrels, slab edges)
 *   joints      optional { du, dv, col, a } panel joint grid in cell fractions
 */
export function gridFacade({ px = 256, bays, floors, wall, win: win0, glass, glassVar = 0.08, frame, frameW = 0.03, mullions = [], bands = [], joints, seed = 1, sky = 0.12, noise = 3 }) {
  const r = raster(px, px, wall);
  const rand = rng(seed);
  const bw = 1 / bays;
  const fh = 1 / floors;
  if (joints) {
    const c = hex(joints.col);
    if (joints.du) for (let u = 0; u < 1 - 1e-6; u += joints.du * bw) r.rect(u, 0, u + 1.2 / px, 1, c, joints.a ?? 0.6);
    if (joints.dv) for (let v = 0; v < 1 - 1e-6; v += joints.dv * fh) r.rect(0, v, 1, v + 1.2 / px, c, joints.a ?? 0.6);
  }
  for (let f = 0; f < floors; f++) {
    for (const b of bands) r.rect(0, (f + b.v0) * fh, 1, (f + b.v1) * fh, b.col, b.a ?? 1);
  }
  const g = hex(glass);
  for (const win of Array.isArray(win0) ? win0 : win0 ? [win0] : []) {
    for (let f = 0; f < floors; f++) {
      for (let b = 0; b < bays; b++) {
        const u0 = (b + win.u0) * bw;
        const u1 = (b + win.u1) * bw;
        const v0 = (f + win.v0) * fh;
        const v1 = (f + win.v1) * fh;
        if (frame) r.rect(u0 - frameW * bw, v0 - frameW * fh, u1 + frameW * bw, v1 + frameW * fh, frame);
        const k = 1 + (rand() - 0.5) * 2 * glassVar;
        // glass: a touch brighter toward the top of each pane (sky reflection)
        const steps = 4;
        for (let s = 0; s < steps; s++) {
          const t = s / (steps - 1);
          r.rect(u0, v0 + ((v1 - v0) * s) / steps, u1, v0 + ((v1 - v0) * (s + 1)) / steps, mul(mix(g, [200, 215, 228], sky * t), k));
        }
      }
    }
  }
  for (const m of mullions) {
    for (let b = 0; b < bays; b += m.every) r.rect(b * bw - (m.w * bw) / 2, 0, b * bw + (m.w * bw) / 2, 1, m.col);
    r.rect(1 - (m.w * bw) / 2, 0, 1, 1, m.col);
  }
  if (noise) r.noise(noise, seed + 11);
  return r;
}

/**
 * Night pattern for a grid facade: black, with a random share of the windows lit.
 * One texel block per window, so it repeats only every `bays` x `floors` windows.
 */
export function gridLights({ bays, floors, cell = 12, win, lit = 0.35, colors, seed = 3, rowBias = 0 }) {
  const w = bays * cell;
  const h = floors * cell;
  const r = raster(w, h, [0, 0, 0]);
  const rand = rng(seed);
  const cols = colors.map(hex);
  for (let f = 0; f < floors; f++) {
    // offices light whole stretches of a floor; flats light single windows
    const rowOn = rowBias ? rand() < 0.5 : true;
    let run = 0;
    for (let b = 0; b < bays; b++) {
      let on;
      if (rowBias) {
        if (run <= 0) run = rand() < (rowOn ? lit + rowBias : lit * 0.3) ? 2 + Math.floor(rand() * 7) : -(1 + Math.floor(rand() * 4));
        on = run > 0;
        run += run > 0 ? -1 : 1;
      } else on = rand() < lit;
      if (!on) continue;
      const c = cols[Math.floor(rand() * cols.length)];
      const k = 0.55 + rand() * 0.45;
      r.rect((b + win.u0) / bays, (f + win.v0) / floors, (b + win.u1) / bays, (f + win.v1) / floors, mul(c, k));
    }
  }
  return r;
}

/** Plain surface with faint panel joints. */
export function panelSurface({ px = 128, color, du = 0.5, dv = 0.5, joint, a = 0.5, noise = 4, seed = 5 }) {
  const r = raster(px, px, color);
  if (joint) {
    for (let u = 0; u < 1 - 1e-6; u += du) r.rect(u, 0, u + 1.2 / px, 1, joint, a);
    for (let v = 0; v < 1 - 1e-6; v += dv) r.rect(0, v, 1, v + 1.2 / px, joint, a);
  }
  if (noise) r.noise(noise, seed);
  return r;
}

/** Vertical or horizontal ribbing (corrugated sheet, louvres, standing seams). */
export function ribbed({ px = 128, color, shade, ribs = 16, vertical = true, duty = 0.5, noise = 3, seed = 9 }) {
  const r = raster(px, px, color);
  for (let i = 0; i < ribs; i++) {
    const a = (i + (1 - duty)) / ribs;
    const b = (i + 1) / ribs;
    if (vertical) r.rect(a, 0, b, 1, shade);
    else r.rect(0, a, 1, b, shade);
  }
  if (noise) r.noise(noise, seed);
  return r;
}

/** Rooftop helipad marking: deck, yellow circle, white H. UV 0..1 over the square pad. */
export function helipad({ px = 128, deck = '#6f7f78', ring = '#e2c53a', mark = '#f2f2ee', letter = 'H' } = {}) {
  const r = raster(px, px, deck);
  const dk = hex(deck);
  const rg = hex(ring);
  const mk = hex(mark);
  r.each((u, v) => {
    const d = Math.hypot(u - 0.5, v - 0.5);
    if (d > 0.4 && d < 0.445) return rg;
    const x = Math.abs(u - 0.5);
    const y = Math.abs(v - 0.5);
    if (letter === 'H') {
      if ((x > 0.1 && x < 0.15 && y < 0.2) || (x <= 0.1 && y < 0.03)) return mk;
    } else {
      // "R" rescue space: drawn as a simple ring-in-ring so it reads differently from H
      if (d > 0.2 && d < 0.235) return mk;
    }
    return d > 0.5 ? mul(dk, 0.92) : null;
  });
  r.noise(3, 21);
  return r;
}

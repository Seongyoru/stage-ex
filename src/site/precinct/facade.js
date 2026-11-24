// Facade helpers shared by the towers: axis-aligned faces in a building frame, a tiny
// block font for the lit signs, and a deterministic pseudo-random for lit windows.
import { lbox } from './kit.js';

/**
 * A vertical face inside a building frame (local a/b plan axes). x runs along the face,
 * d is the distance outward from the face plane, y is height.
 *   face.box(x0, x1, y0, y1, d0, d1) → local-space box geometry
 */
export function face(a, b, da, db, na, nb, length) {
  return {
    length,
    box(x0, x1, y0, y1, d0, d1) {
      const p = [a + x0 * da + d0 * na, b + x0 * db + d0 * nb];
      const q = [a + x1 * da + d1 * na, b + x1 * db + d1 * nb];
      return lbox(Math.min(p[0], q[0]), Math.max(p[0], q[0]), y0, y1, Math.min(p[1], q[1]), Math.max(p[1], q[1]));
    },
    at: (x, d = 0) => [a + x * da + d * na, b + x * db + d * nb],
  };
}

/** Faces of an axis-aligned rectangle [a0, a1] x [b0, b1] in a frame whose b axis points "north". */
export function rectFaces(a0, a1, b0, b1) {
  return {
    // seen from outside, x runs left → right (the frame's a axis points west, b north)
    north: face(a0, b1, 1, 0, 0, 1, a1 - a0),
    south: face(a1, b0, -1, 0, 0, -1, a1 - a0),
    east: face(a0, b0, 0, 1, -1, 0, b1 - b0), // the a0 side
    west: face(a1, b1, 0, -1, 1, 0, b1 - b0),
  };
}

// 4 x 7 block font: rectangles [x0, y0, x1, y1] in grid units; advance = width + 1.
const GLYPHS = {
  H: { w: 4, r: [[0, 0, 1, 7], [3, 0, 4, 7], [1, 3, 3, 4]] },
  i: { w: 1, r: [[0, 0, 1, 5], [0, 6, 1, 7]] },
  l: { w: 1, r: [[0, 0, 1, 7]] },
  t: { w: 3, r: [[1, 0, 2, 7], [0, 4, 3, 5], [2, 0, 3, 1]] },
  o: { w: 3, r: [[0, 0, 1, 5], [2, 0, 3, 5], [1, 0, 2, 1], [1, 4, 2, 5]] },
  n: { w: 3, r: [[0, 0, 1, 5], [2, 0, 3, 4], [1, 4, 3, 5]] },
  K: { w: 4, r: [[0, 0, 1, 7], [1, 3, 2, 4], [2, 4, 3, 5], [3, 5, 4, 7], [2, 2, 3, 3], [3, 0, 4, 2]] },
  '-': { w: 2, r: [[0, 3, 2, 4]] },
  A: { w: 4, r: [[0, 0, 1, 6], [3, 0, 4, 6], [1, 6, 3, 7], [1, 3, 3, 4]] },
  r: { w: 3, r: [[0, 0, 1, 5], [1, 4, 3, 5]] },
  e: { w: 3, r: [[0, 0, 1, 5], [1, 0, 3, 1], [1, 2, 3, 3], [1, 4, 3, 5], [2, 3, 3, 4]] },
  a: { w: 3, r: [[2, 0, 3, 5], [0, 0, 2, 1], [0, 2, 2, 3], [0, 4, 2, 5], [0, 1, 1, 2]] },
};
/** Width of a text in grid units. */
export function textWidth(text) {
  let w = 0;
  for (const ch of text) w += (GLYPHS[ch] ? GLYPHS[ch].w : 2) + 1;
  return w - 1;
}
/**
 * Block letters as boxes: calls emit(x0, x1, y0, y1) in metres for every stroke, the text
 * starting at x = 0 with its baseline at y = 0; `cap` = cap height in metres.
 */
export function blockText(text, cap, emit) {
  const u = cap / 7;
  let x = 0;
  for (const ch of text) {
    const g = GLYPHS[ch];
    if (g) for (const [x0, y0, x1, y1] of g.r) emit((x + x0) * u, (x + x1) * u, y0 * u, y1 * u);
    x += (g ? g.w : 2) + 1;
  }
  return (x - 1) * u;
}

/** Deterministic hash → [0, 1). */
export function rnd(a, b = 0, c = 0, d = 0) {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647 + d * 1274126177) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return ((h >>> 0) % 100000) / 100000;
}

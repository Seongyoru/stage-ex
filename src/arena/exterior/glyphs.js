// Outlines of the "K-Arena" wordmark (bold serif, high contrast) drawn for this model as
// simple polygons: unit = cap height, baseline y = 0. Each glyph is a set of overlapping
// polygons (stems, serifs, bowls); overlaps are harmless because all faces share one plane.
const R = (x0, y0, x1, y1) => ({
  pts: [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ],
});
const ell = (cx, cy, rx, ry, n = 28) => Array.from({ length: n }, (_, i) => [cx + rx * Math.cos((i / n) * 2 * Math.PI), cy + ry * Math.sin((i / n) * 2 * Math.PI)]);
/** Band between an outer and an inner elliptical arc, from angle a0 to a1 (degrees, CCW). */
function arc(o, i, a0, a1, n = 22) {
  const pts = [];
  for (let k = 0; k <= n; k++) {
    const t = ((a0 + ((a1 - a0) * k) / n) * Math.PI) / 180;
    pts.push([o[0] + o[2] * Math.cos(t), o[1] + o[3] * Math.sin(t)]);
  }
  for (let k = n; k >= 0; k--) {
    const t = ((a0 + ((a1 - a0) * k) / n) * Math.PI) / 180;
    pts.push([i[0] + i[2] * Math.cos(t), i[1] + i[3] * Math.sin(t)]);
  }
  return { pts };
}
const P = (...pts) => ({ pts });
const FLAG = P([0.0, 0.585], [0.23, 0.66], [0.23, 0.56], [0.07, 0.56]); // top-left serif of r and n

export const GLYPHS = {
  K: {
    adv: 0.86,
    parts: [
      R(0.07, 0, 0.25, 1),
      R(0.0, 0, 0.32, 0.045),
      R(0.0, 0.955, 0.32, 1),
      P([0.25, 0.4], [0.655, 0.955], [0.585, 0.955], [0.25, 0.49]),
      R(0.5, 0.955, 0.74, 1),
      P([0.33, 0.515], [0.565, 0.045], [0.76, 0.045], [0.415, 0.63]),
      R(0.5, 0, 0.84, 0.045),
    ],
  },
  '-': { adv: 0.38, parts: [R(0.04, 0.27, 0.32, 0.345)] },
  A: {
    adv: 0.9,
    ox: 0.04,
    parts: [
      P([0.345, 1.0], [0.405, 1.0], [0.755, 0.045], [0.565, 0.045], [0.2834, 0.813]),
      P([0.345, 1.0], [0.4, 1.0], [0.085, 0.045], [0.03, 0.045]),
      R(0.16, 0.3, 0.48, 0.352),
      R(-0.04, 0, 0.21, 0.045),
      R(0.46, 0, 0.85, 0.045),
    ],
  },
  r: {
    adv: 0.56,
    parts: [R(0.07, 0, 0.23, 0.62), R(0.0, 0, 0.31, 0.045), FLAG, arc([0.37, 0.45, 0.17, 0.21], [0.39, 0.43, 0.12, 0.15], 35, 170), { pts: ell(0.47, 0.565, 0.075, 0.075, 16) }],
  },
  e: {
    adv: 0.56,
    parts: [arc([0.27, 0.33, 0.25, 0.34], [0.295, 0.335, 0.125, 0.26], 5, 320, 36), R(0.1, 0.335, 0.52, 0.385)],
  },
  n: {
    adv: 0.68,
    parts: [
      R(0.07, 0, 0.23, 0.62),
      R(0.0, 0, 0.31, 0.045),
      FLAG,
      arc([0.36, 0.4, 0.215, 0.26], [0.335, 0.39, 0.105, 0.2], 0, 165),
      R(0.42, 0, 0.575, 0.42),
      R(0.34, 0, 0.66, 0.045),
    ],
  },
  a: {
    adv: 0.64,
    parts: [
      R(0.33, 0.03, 0.49, 0.5),
      arc([0.265, 0.43, 0.225, 0.24], [0.25, 0.42, 0.11, 0.17], 0, 150),
      { pts: ell(0.12, 0.5, 0.075, 0.075, 16) },
      { pts: ell(0.2, 0.17, 0.19, 0.18), holes: [ell(0.225, 0.165, 0.085, 0.12, 20)] },
      P([0.33, 0.03], [0.49, 0.0], [0.61, 0.0], [0.62, 0.045], [0.49, 0.06]),
    ],
  },
};

/**
 * Lay out a word: returns { parts: [{ pts, holes }], width } in metres for the given cap
 * height, starting at x = 0. `track` is extra letter spacing in cap heights.
 */
export function layoutWord(text, capHeight, track = 0) {
  const parts = [];
  let x = 0;
  for (const ch of text) {
    const g = GLYPHS[ch];
    if (!g) {
      x += 0.4 + track;
      continue;
    }
    const ox = x + (g.ox || 0);
    for (const p of g.parts)
      parts.push({
        pts: p.pts.map(([px, py]) => [(px + ox) * capHeight, py * capHeight]),
        holes: (p.holes || []).map((h) => h.map(([px, py]) => [(px + ox) * capHeight, py * capHeight])),
      });
    x += g.adv + track;
  }
  return { parts, width: (x - track) * capHeight };
}

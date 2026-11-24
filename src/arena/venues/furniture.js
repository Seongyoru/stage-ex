// Furniture and fittings of the venues, one function per type. Every function returns
//   [{ geometry, material }, ...]   (one entry per material, geometry in the piece's own frame)
// so a generated 3D prop can replace a type later by swapping this function only.
// Local frame of every piece: origin on the floor at the plan centre (hanging pieces: at the
// ceiling fixing point), +Y up, the piece FACES local +Z (a seated person looks toward +Z).
// Sizes: research/00-consolidated.md section 10 (generic, ESTIMATED) checked against the
// official venue photos.
import { bx, bxOn, cyl, rod, bar, lathe, tf, sweep, arcPath, plateXY, Asm, TAU, prism, roundedRectRing, strokeText } from './kit.js';
import { M } from './mats.js';

const D2R = Math.PI / 180;

// ---------------------------------------------------------------------------------------
// Lounge 5
// ---------------------------------------------------------------------------------------

/** Corner gussets of the riveted steel frames (quarter brackets under the top, on a long side). */
function gussets(L, W, yTop, size = 0.16) {
  const out = [];
  const tri = (sx) => [[0, 0], [sx * size, 0], [sx * size * 0.32, -size * 0.32], [0, -size]];
  for (const sz of [-1, 1]) {
    for (const sx of [-1, 1]) {
      // on the long faces
      out.push(tf(plateXY(tri(-sx), 0.006), { x: sx * (L / 2 - 0.045), y: yTop, z: sz * (W / 2 - 0.012) }));
      // on the short faces (plate turned into the YZ plane: local s → −z)
      out.push(tf(plateXY(tri(sz), 0.006), { ry: Math.PI / 2, x: sx * (L / 2 - 0.012), y: yTop, z: sz * (W / 2 - 0.045) }));
    }
  }
  return out;
}

/** Lounge 5 table: 1.8 x 0.75 x 0.74 m, rust-effect top in a riveted black steel frame. Long axis = local X. */
export function loungeTable() {
  const L = 1.8;
  const W = 0.75;
  const H = 0.74;
  const a = new Asm();
  a.add(M('venues.lounge5TableTop'), bx(L - 0.02, 0.03, W - 0.02, 0, H - 0.015, 0));
  const f = M('venues.lounge5Frame');
  a.add(f, bx(L, 0.06, 0.03, 0, H - 0.06, W / 2 - 0.015), bx(L, 0.06, 0.03, 0, H - 0.06, -W / 2 + 0.015));
  a.add(f, bx(0.03, 0.06, W - 0.06, L / 2 - 0.015, H - 0.06, 0), bx(0.03, 0.06, W - 0.06, -L / 2 + 0.015, H - 0.06, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.add(f, bxOn(0.045, H - 0.03, 0.045, sx * (L / 2 - 0.0225), 0, sz * (W / 2 - 0.0225)));
  a.add(f, gussets(L, W, H - 0.09));
  return a.parts();
}

/** Lounge 5 bench: 1.7 x 0.36 x 0.44 m, cobalt-blue top on a dark steel frame. Long axis = local X. */
export function loungeBench() {
  const L = 1.7;
  const W = 0.36;
  const H = 0.44;
  const a = new Asm();
  a.add(M('venues.lounge5Bench'), bx(L, 0.035, W, 0, H - 0.0175, 0));
  const f = M('venues.lounge5Frame');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.add(f, bxOn(0.035, H - 0.035, 0.035, sx * (L / 2 - 0.05), 0, sz * (W / 2 - 0.03)));
  a.add(f, bx(L - 0.1, 0.035, 0.022, 0, H - 0.055, W / 2 - 0.03), bx(L - 0.1, 0.035, 0.022, 0, H - 0.055, -W / 2 + 0.03));
  a.add(f, bx(0.022, 0.03, W - 0.06, L / 2 - 0.05, 0.11, 0), bx(0.022, 0.03, W - 0.06, -L / 2 + 0.05, 0.11, 0));
  return a.parts();
}

/** Lounge 5 high table: 1.8 x 0.6 x 1.05 m, dark top, steel frame with foot rails. Long axis = local X. */
export function highTable() {
  const L = 1.8;
  const W = 0.6;
  const H = 1.05;
  const a = new Asm();
  a.add(M('venues.lounge5DarkTop'), bx(L - 0.02, 0.03, W - 0.02, 0, H - 0.015, 0));
  const f = M('venues.lounge5Frame');
  a.add(f, bx(L, 0.06, 0.03, 0, H - 0.06, W / 2 - 0.015), bx(L, 0.06, 0.03, 0, H - 0.06, -W / 2 + 0.015));
  a.add(f, bx(0.03, 0.06, W - 0.06, L / 2 - 0.015, H - 0.06, 0), bx(0.03, 0.06, W - 0.06, -L / 2 + 0.015, H - 0.06, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.add(f, bxOn(0.045, H - 0.03, 0.045, sx * (L / 2 - 0.0225), 0, sz * (W / 2 - 0.0225)));
  a.add(f, bx(L - 0.05, 0.03, 0.03, 0, 0.28, W / 2 - 0.0225), bx(L - 0.05, 0.03, 0.03, 0, 0.28, -W / 2 + 0.0225));
  a.add(f, bx(0.03, 0.03, W - 0.09, L / 2 - 0.0225, 0.28, 0), bx(0.03, 0.03, W - 0.09, -L / 2 + 0.0225, 0.28, 0));
  a.add(f, gussets(L, W, H - 0.09, 0.14));
  return a.parts();
}

/**
 * Shell chair / stool on black wire legs (the Lounge 5 and Arena Bar 7 stools, the Lounge 5
 * cafe chairs and, larger and lower, the brown leather chairs of Arena Bar 7).
 *   seatH   seat height (0.76 bar stool, 0.45 chair, 0.40 lounge chair)
 *   shell   material id of the upholstered shell
 *   r       shell radius (0.2 stool, 0.27 lounge chair)
 */
export function shellChair({ seatH = 0.76, shell = 'venues.shellLeatherGrey', r = 0.2, backH = 0.3, footrest = true } = {}) {
  const a = new Asm();
  const s = M(shell);
  // seat pad
  a.add(s, cyl(r, 0.05, 0, seatH - 0.05, 0, 12));
  // wrap-around back: an arc behind the sitter (local −Z), thickness inward
  const path = arcPath(0, 0, r, 205 * D2R, 335 * D2R, 6);
  a.add(s, sweep([[-0.028, seatH - 0.04], [0, seatH - 0.04], [0, seatH + backH], [-0.028, seatH + backH - 0.02]], path));
  const legs = M('venues.blackSteel');
  const top = r * 0.6;
  const foot = r * 1.02 + 0.02;
  const yTop = seatH - 0.05;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.add(legs, rod([sx * top, yTop, sz * top], [sx * foot, 0, sz * foot], 0.009, 4));
  a.add(legs, cyl(r * 0.7, 0.012, 0, yTop - 0.012, 0, 8));
  if (footrest) {
    const yf = 0.3;
    const k = (yTop - yf) / yTop;
    const q = top + (foot - top) * k;
    a.add(legs, rod([-q, yf, q], [q, yf, q], 0.008, 4), rod([-q, yf, -q], [q, yf, -q], 0.008, 4), rod([q, yf, -q], [q, yf, q], 0.008, 4), rod([-q, yf, -q], [-q, yf, q], 0.008, 4));
  }
  return a.parts();
}

/** Small square cafe table of the Lounge 5 window zone: 0.7 x 0.7 x 0.72 m. */
export function cafeTable() {
  const a = new Asm();
  a.add(M('venues.lounge5DarkTop'), bx(0.7, 0.03, 0.7, 0, 0.705, 0));
  const f = M('venues.blackSteel');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.add(f, rod([sx * 0.26, 0.69, sz * 0.26], [sx * 0.31, 0, sz * 0.31], 0.012, 4));
  return a.parts();
}

/** "K-Arena" wordmark as thin strokes (idle content of the signage screens). */
function wordmark(height) {
  return strokeText('K-Arena', { height, weight: height * 0.17, depth: 0.003, shear: 0.18 }).geometry;
}

/** Track spotlight (black cylinder on a short stem), origin at the track. */
export function trackSpot() {
  const a = new Asm();
  const b = M('venues.trackBlack');
  a.add(b, bx(0.02, 0.07, 0.02, 0, -0.035, 0), cyl(0.045, 0.15, 0, -0.22, 0, 8));
  a.add(M('venues.spotLens'), cyl(0.036, 0.006, 0, -0.226, 0, 8));
  return a.parts();
}

/**
 * Portrait digital signage screen mounted on a column face (0.72 x 1.26 m, idle "K-Arena"
 * wordmark). Origin = centre of the back of the screen on the wall face; the screen faces local +Z.
 */
export function wallScreen() {
  const a = new Asm();
  const w = 0.72;
  const h = 1.26;
  a.add(M('venues.trackBlack'), bx(0.3, 0.4, 0.03, 0, 0, 0.015));
  a.add(M('venues.signageBezel'), bx(w, h, 0.045, 0, 0, 0.052));
  a.add(M('venues.signagePortrait'), bx(w - 0.05, h - 0.05, 0.006, 0, 0, 0.0775));
  const ink = M('venues.signageInk');
  a.add(ink, tf(wordmark(0.075), { x: 0, y: -0.02, z: 0.082 }), bx(0.3, 0.008, 0.003, 0, -0.06, 0.082));
  return a.parts();
}

// ---------------------------------------------------------------------------------------
// Arena Bar 7
// ---------------------------------------------------------------------------------------

/** Round standing table: dark top with a ribbed gold edge band, black column and disc base (0.7 dia x 1.05 m). */
export function roundBarTable() {
  const a = new Asm();
  a.add(M('venues.bar7TableTop'), cyl(0.343, 0.012, 0, 1.04, 0, 20));
  a.add(M('venues.brassRibbed'), cyl(0.352, 0.045, 0, 0.998, 0, 20));
  const b = M('venues.blackSteel');
  a.add(b, cyl(0.035, 0.98, 0, 0.02, 0, 8), cyl(0.24, 0.02, 0, 0, 0, 16), cyl(0.1, 0.02, 0, 0.978, 0, 8));
  return a.parts();
}

/** Low round table of the window seats: 0.6 dia x 0.5 m. */
export function lowRoundTable() {
  const a = new Asm();
  a.add(M('venues.bar7TableTop'), cyl(0.293, 0.012, 0, 0.49, 0, 16));
  a.add(M('venues.brassRibbed'), cyl(0.3, 0.04, 0, 0.452, 0, 16));
  const b = M('venues.blackSteel');
  a.add(b, cyl(0.03, 0.44, 0, 0.015, 0, 8), cyl(0.2, 0.015, 0, 0, 0, 14));
  return a.parts();
}

/** Liquor bottle, about 0.31 m tall (instance colour gives the glass tint). */
export function bottle() {
  const a = new Asm();
  a.add(M('venues.bottleGlass'), lathe([[0, 0], [0.038, 0], [0.038, 0.19], [0.014, 0.25], [0.014, 0.31], [0, 0.31]], 6));
  return a.parts();
}

/**
 * Arena Bar 7 chandelier: brass frame with seven ribbed-glass lantern cylinders, about
 * 1.2 m across and 1.35 m tall. Origin at the ceiling fixing point.
 */
export function chandelierBar7() {
  const a = new Asm();
  const brass = M('venues.brass');
  const glass = M('venues.chandelierGlass');
  a.add(brass, cyl(0.19, 0.03, 0, -0.03, 0, 12));
  a.add(brass, cyl(0.125, 0.025, 0, -0.2, 0, 10, 0.125, true), cyl(0.125, 0.025, 0, -0.42, 0, 10, 0.125, true));
  const R = 0.5;
  const lantern = (x, yTop, z, rot) => {
    const r = 0.17;
    const h = 0.42;
    a.add(glass, tf(cyl(r, h, 0, 0, 0, 6), { ry: rot, x, y: yTop - h, z }));
    a.add(brass, tf(cyl(r + 0.012, 0.024, 0, 0, 0, 6), { ry: rot, x, y: yTop - 0.012, z }), tf(cyl(r + 0.012, 0.024, 0, 0, 0, 6), { ry: rot, x, y: yTop - h - 0.012, z }));
    // brass ribs on the six arrises of the ribbed-glass cylinder
    for (let k = 0; k < 6; k++) {
      const t = (k / 6) * TAU + rot;
      a.add(brass, bx(0.014, h, 0.014, x + (r + 0.004) * Math.sin(t), yTop - h / 2, z + (r + 0.004) * Math.cos(t)));
    }
  };
  for (let i = 0; i < 6; i++) {
    const t = (i / 6) * TAU + 0.26;
    const c = Math.cos(t);
    const s = Math.sin(t);
    // flat bar: straight down the cage, then sweeping out to the lantern
    a.add(brass, bar([0.11 * c, -0.03, 0.11 * s], [0.11 * c, -0.48, 0.11 * s], 0.04, 0.008));
    a.add(brass, bar([0.11 * c, -0.48, 0.11 * s], [0.24 * c, -0.6, 0.24 * s], 0.04, 0.008));
    a.add(brass, bar([0.24 * c, -0.6, 0.24 * s], [R * c, -0.64, R * s], 0.04, 0.008));
    lantern(R * c, -0.66, R * s, t);
  }
  a.add(brass, rod([0, -0.03, 0], [0, -0.74, 0], 0.012, 5));
  lantern(0, -0.76, 0, 0);
  return a.parts();
}

// ---------------------------------------------------------------------------------------
// VIP lounge
// ---------------------------------------------------------------------------------------

/** Burgundy leather barrel chair on a mirror-gold frame, with a satin cushion (0.74 wide, 0.72 high). */
export function barrelChair() {
  const a = new Asm();
  const leather = M('venues.vipLeatherBurgundy');
  const gold = M('venues.goldPolished');
  const R = 0.36;
  // round seat cushion inside the barrel, straight front edge between the arm ends
  a.add(leather, cyl(R - 0.05, 0.17, 0, 0.25, 0.02, 14), bxOn(0.52, 0.17, 0.16, 0, 0.25, 0.26));
  const path = arcPath(0, 0.02, R, 150 * D2R, 390 * D2R, 10);
  a.add(leather, sweep([[-0.095, 0.25], [0, 0.25], [0, 0.7], [-0.03, 0.73], [-0.095, 0.7]], path));
  a.add(gold, sweep([[0, 0.215], [0.012, 0.215], [0.012, 0.255], [0, 0.255]], path, { caps: false }));
  for (const sx of [-1, 1]) {
    a.add(gold, bxOn(0.03, 0.25, 0.03, sx * 0.26, 0, -0.22));
    a.add(gold, bxOn(0.018, 0.71, 0.05, sx * (R - 0.04), 0, 0.02 + R * 0.52));
  }
  a.add(M('venues.vipCushion'), tf(bx(0.4, 0.34, 0.1), { rx: -0.3, y: 0.6, z: -0.2 }));
  return a.parts();
}

/** Square black-granite table on gold legs (0.72 x 0.72 x 0.5 m), chamfered corners. */
export function vipSquareTable() {
  const a = new Asm();
  const h = 0.36;
  const c = 0.3;
  a.add(M('venues.vipGranite'), prism([[-h, -c], [-c, -h], [c, -h], [h, -c], [h, c], [c, h], [-c, h], [-h, c]], 0.47, 0.5));
  const gold = M('venues.goldPolished');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.add(gold, bxOn(0.03, 0.47, 0.03, sx * 0.29, 0, sz * 0.29));
  a.add(gold, bx(0.58, 0.03, 0.02, 0, 0.45, 0.29), bx(0.58, 0.03, 0.02, 0, 0.45, -0.29), bx(0.02, 0.03, 0.56, 0.29, 0.45, 0), bx(0.02, 0.03, 0.56, -0.29, 0.45, 0));
  return a.parts();
}

/** Tan leather wing chair (0.78 wide, 1.15 high). */
export function wingChair() {
  const a = new Asm();
  const l = M('venues.vipLeatherTan');
  a.add(l, bxOn(0.6, 0.2, 0.6, 0, 0.24, 0.03));
  a.add(l, tf(bx(0.64, 0.8, 0.13), { rx: -0.13, y: 0.8, z: -0.3 }));
  for (const sx of [-1, 1]) {
    a.add(l, tf(bx(0.09, 0.46, 0.3), { ry: sx * -0.22, x: sx * 0.34, y: 0.92, z: -0.16 }));
    a.add(l, bx(0.11, 0.3, 0.56, sx * 0.34, 0.47, 0.02));
  }
  const w = M('venues.vipWoodDark');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.add(w, cyl(0.018, 0.24, sx * 0.26, 0, sz * 0.24 + 0.02, 6, 0.03));
  return a.parts();
}

/** Open gold cage side table (0.5 dia x 0.52 m) with a black top. */
export function cageTable() {
  const a = new Asm();
  const gold = M('venues.goldPolished');
  a.add(M('venues.vipGranite'), cyl(0.25, 0.025, 0, 0.495, 0, 14));
  a.add(gold, cyl(0.17, 0.02, 0, 0, 0, 14), cyl(0.245, 0.02, 0, 0.475, 0, 14, 0.245, true));
  for (let i = 0; i < 12; i++) {
    const t = (i / 12) * TAU;
    a.add(gold, rod([0.16 * Math.cos(t), 0.01, 0.16 * Math.sin(t)], [0.24 * Math.cos(t), 0.485, 0.24 * Math.sin(t)], 0.006, 3));
  }
  return a.parts();
}

/** Upholstered dining chair with a brass shell pull on the back (VIP rooms: cream damask; piano table: tan leather). */
export function diningChair(fabric = 'venues.vipDiningFabric') {
  const a = new Asm();
  const f = M(fabric);
  a.add(f, bx(0.48, 0.09, 0.46, 0, 0.45, 0.01));
  a.add(f, tf(bx(0.46, 0.54, 0.065), { rx: -0.14, y: 0.76, z: -0.235 }));
  const w = M('venues.vipWoodDark');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.add(w, cyl(0.014, 0.41, sx * 0.2, 0, sz * 0.19, 5, 0.022));
  a.add(M('venues.brass'), bx(0.08, 0.035, 0.025, 0, 0.9, -0.315));
  return a.parts();
}

/** Drum ottoman (0.5 dia x 0.42 m). */
export function ottoman(fabric = 'venues.vipSofaBoucle') {
  const a = new Asm();
  a.add(M(fabric), cyl(0.25, 0.4, 0, 0.02, 0, 14));
  a.add(M('venues.vipWoodDark'), cyl(0.235, 0.02, 0, 0, 0, 12));
  return a.parts();
}

/**
 * Curved sofa: section swept along an arc of radius R (to the back edge) between angles a0..a1
 * (radians, from +X toward +Z). The seat is on the inside of the arc. Origin = arc centre.
 */
export function curvedSofa(R, a0, a1, fabric = 'venues.vipSofaBoucle') {
  const a = new Asm();
  const n = Math.max(6, Math.round((Math.abs(a1 - a0) * R) / 0.35));
  const path = arcPath(0, 0, R, a0, a1, n);
  const section = [[0, 0.04], [0, 0.74], [-0.08, 0.8], [-0.2, 0.78], [-0.27, 0.45], [-0.9, 0.42], [-0.95, 0.37], [-0.95, 0.04]];
  a.add(M(fabric), sweep(section, path));
  a.add(M('venues.vipWoodDark'), sweep([[-0.05, 0], [-0.05, 0.04], [-0.9, 0.04], [-0.9, 0]], path));
  // throw cushions along the back
  const cushions = [];
  const count = Math.max(2, Math.round((Math.abs(a1 - a0) * R) / 0.75));
  for (let i = 0; i < count; i++) {
    const t = a0 + ((i + 0.5) / count) * (a1 - a0);
    const rr = R - 0.36;
    cushions.push(tf(bx(0.42, 0.36, 0.12), { rx: -0.25, ry: Math.atan2(-Math.cos(t), -Math.sin(t)), x: rr * Math.cos(t), y: 0.62, z: rr * Math.sin(t) }));
  }
  a.add(M('venues.vipCushion'), cushions);
  return a.parts();
}

/** Cloud-shaped black marble coffee table (about 1.5 x 1.0 x 0.38 m). */
export function cloudTable() {
  const a = new Asm();
  const ring = [];
  const lobes = [[-0.42, 0.05, 0.42], [0.1, -0.12, 0.5], [0.5, 0.12, 0.36], [0.02, 0.24, 0.36]];
  // union outline of the lobes sampled by angle from the centre
  for (let i = 0; i < 28; i++) {
    const t = (i / 28) * TAU;
    let best = 0;
    for (const [cx, cz, r] of lobes) {
      // ray-circle intersection distance from the origin
      const b = cx * Math.cos(t) + cz * Math.sin(t);
      const disc = b * b - (cx * cx + cz * cz - r * r);
      if (disc >= 0) best = Math.max(best, b + Math.sqrt(disc));
    }
    ring.push([best * Math.cos(t), best * Math.sin(t)]);
  }
  a.add(M('venues.vipMarbleBlack'), prism(ring, 0.33, 0.38));
  a.add(M('venues.vipGranite'), prism(ring.map(([x, z]) => [x * 0.78, z * 0.78]), 0.0, 0.33, { top: false }));
  return a.parts();
}

/** Round side table with a black marble top in a gold rim on a gold stem (0.6 dia x 0.5 m). */
export function goldRimTable() {
  const a = new Asm();
  a.add(M('venues.vipMarbleBlack'), cyl(0.28, 0.02, 0, 0.485, 0, 16));
  const gold = M('venues.goldPolished');
  a.add(gold, cyl(0.3, 0.035, 0, 0.455, 0, 16), cyl(0.2, 0.015, 0, 0, 0, 14));
  for (let i = 0; i < 3; i++) {
    const t = (i / 3) * TAU;
    a.add(gold, rod([0.16 * Math.cos(t), 0.01, 0.16 * Math.sin(t)], [0.22 * Math.cos(t), 0.46, 0.22 * Math.sin(t)], 0.012, 4));
  }
  return a.parts();
}

/** Tall gold fretwork screen in a black frame (default 1.25 x 3.3 m). The screen stands in the local XY plane. */
export function fretScreen(w = 1.25, h = 3.3) {
  const a = new Asm();
  const fr = M('venues.blackSteel');
  const t = 0.07;
  a.add(fr, bxOn(t, h, 0.09, -w / 2 + t / 2, 0, 0), bxOn(t, h, 0.09, w / 2 - t / 2, 0, 0), bx(w - 2 * t, t, 0.09, 0, h - t / 2, 0), bx(w - 2 * t, t * 1.6, 0.09, 0, t * 0.8, 0));
  const g = M('venues.vipFretwork');
  const cols = 7;
  const inner = w - 2 * t;
  const pitch = inner / (cols + 1);
  const y0 = t * 1.6;
  const hh = h - t - y0;
  for (let i = 1; i <= cols; i++) a.add(g, bx(0.016, hh, 0.014, -inner / 2 + i * pitch, y0 + hh / 2, 0));
  const cell = 0.42;
  for (let c = 0; c <= cols; c++) {
    const x = -inner / 2 + (c + 0.5) * pitch;
    for (let y = y0 + (c % 2 ? cell / 2 : cell); y < y0 + hh - 0.05; y += cell) {
      a.add(g, bx(pitch, 0.016, 0.014, x, y, 0));
      a.add(g, bx(0.016, cell * 0.3, 0.014, x, y - cell * 0.5, 0));
    }
  }
  return a.parts();
}

/** Five-tier ring chandelier of the VIP bar: frosted glass rings in a brass cage, 3.8 m across, 1.55 m deep. Origin at the ceiling. */
export function ringChandelier() {
  const a = new Asm();
  const glass = M('venues.vipRingGlass');
  const brass = M('venues.brass');
  const seg = 32;
  for (let i = 0; i < 5; i++) {
    const r = 1.85 - 0.2 * i;
    const yTop = -0.06 - 0.27 * i;
    a.add(glass, cyl(r, 0.24, 0, yTop - 0.24, 0, seg, r, true));
    a.add(brass, cyl(r + 0.012, 0.022, 0, yTop - 0.011, 0, seg, r + 0.012, true), cyl(r + 0.012, 0.022, 0, yTop - 0.251, 0, seg, r + 0.012, true));
  }
  for (let i = 0; i < 16; i++) {
    const t = ((i + 0.5) / 16) * TAU;
    a.add(brass, rod([1.9 * Math.cos(t), 0, 1.9 * Math.sin(t)], [1.9 * Math.cos(t), -1.5, 1.9 * Math.sin(t)], 0.012, 4));
  }
  const outer = [];
  const inner = [];
  for (let i = 0; i < seg; i++) {
    const t = (i / seg) * TAU;
    outer.push([1.93 * Math.cos(t), 1.93 * Math.sin(t)]);
    inner.push([1.5 * Math.cos(t), 1.5 * Math.sin(t)]);
  }
  a.add(M('venues.goldPolished'), prism(outer, -1.55, -1.5, { holes: [inner] }), prism(outer, -0.04, 0));
  return a.parts();
}

/** Drum lantern pendant of the VIP lounge trays (0.52 dia x 0.9 m lantern on a 0.25 m stem). Origin at the ceiling. */
export function lanternPendant() {
  const a = new Asm();
  const brass = M('venues.brass');
  a.add(brass, rod([0, 0, 0], [0, -0.25, 0], 0.014, 5), cyl(0.08, 0.02, 0, -0.02, 0, 8));
  a.add(M('venues.vipLantern'), cyl(0.25, 0.86, 0, -1.13, 0, 14));
  for (const y of [-0.27, -0.7, -1.15]) a.add(brass, cyl(0.265, 0.03, 0, y, 0, 14, 0.265, true));
  for (let i = 0; i < 4; i++) {
    const t = (i / 4) * TAU + 0.4;
    a.add(brass, bx(0.02, 0.9, 0.02, 0.262 * Math.cos(t), -0.7, 0.262 * Math.sin(t)));
  }
  return a.parts();
}

/** Grand piano with the lid propped open (1.5 x 2.2 m), keyboard toward local +Z. */
export function grandPiano() {
  const a = new Asm();
  const blk = M('venues.pianoBlack');
  // plan outline: straight bass side at x = −0.75, curved treble side
  const o = [[-0.75, 0.55], [0.75, 0.55], [0.75, -0.25], [0.68, -0.6], [0.45, -0.95], [0.1, -1.35], [-0.3, -1.6], [-0.62, -1.62], [-0.75, -1.5]];
  a.add(blk, prism(o, 0.72, 1.0));
  a.add(blk, bx(1.5, 0.1, 0.22, 0, 0.67, 0.66));
  a.add(M('venues.signWhite'), bx(1.22, 0.025, 0.14, 0, 0.74, 0.66));
  // lid hinged on the bass side, opened 32°
  const lid = prism(o.map(([x, z]) => [x + 0.75, z]), 0, 0.025);
  a.add(blk, tf(lid, { rz: 32 * D2R, x: -0.75, y: 1.0 }));
  a.add(blk, rod([0.5, 1.0, -0.3], [0.5, 1.0 + 1.25 * Math.tan(32 * D2R), -0.3], 0.01, 4));
  for (const [x, z] of [[-0.62, 0.42], [0.62, 0.42], [-0.2, -1.35]]) a.add(blk, cyl(0.035, 0.7, x, 0.02, z, 6, 0.055), cyl(0.04, 0.02, x, 0, z, 6));
  a.add(M('venues.brass'), bx(0.25, 0.03, 0.08, 0, 0.06, 0.52), rod([-0.06, 0.07, 0.5], [-0.06, 0.72, 0.5], 0.01, 4), rod([0.06, 0.07, 0.5], [0.06, 0.72, 0.5], 0.01, 4));
  return a.parts();
}

// ---------------------------------------------------------------------------------------
// VIP BOX rooms
// ---------------------------------------------------------------------------------------

/** Brass candelabra pendant over the dining table: bar of `len` metres with pairs of frosted glass tubes. Origin at the ceiling, bar along local X. */
export function candelabraPendant(len = 1.9, drop = 0.85) {
  const a = new Asm();
  const brass = M('venues.brass');
  const tube = M('venues.vipSconce');
  const n = Math.max(2, Math.round(len / 0.62));
  a.add(brass, bx(len, 0.03, 0.03, 0, -drop, 0));
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + ((i + 0.5) / n) * len;
    a.add(brass, bx(0.025, drop, 0.025, x, -drop / 2, 0), cyl(0.05, 0.02, x, -0.02, 0, 8), bx(0.03, 0.03, 0.24, x, -drop, 0));
    for (const sz of [-1, 1]) {
      a.add(brass, cyl(0.042, 0.05, x, -drop + 0.015, sz * 0.12, 6));
      a.add(tube, cyl(0.036, 0.27, x, -drop + 0.065, sz * 0.12, 6));
    }
  }
  return a.parts();
}

/** Rectangular dining table with a black marble top on dark legs. Long axis = local X. */
export function diningTable(L = 2.6, W = 1.0) {
  const a = new Asm();
  a.add(M('venues.vipMarbleBlack'), bx(L, 0.04, W, 0, 0.74, 0));
  const w = M('venues.vipWoodDark');
  a.add(w, bx(L - 0.3, 0.07, W - 0.3, 0, 0.685, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.add(w, bxOn(0.07, 0.65, 0.07, sx * (L / 2 - 0.2), 0, sz * (W / 2 - 0.18)));
  return a.parts();
}

// ---------------------------------------------------------------------------------------
// foyer
// ---------------------------------------------------------------------------------------

/** Free-standing portrait digital signage totem (0.74 x 0.2 x 2.05 m), screen toward local +Z. */
export function signageTotem() {
  const a = new Asm();
  a.add(M('venues.totemBody'), bxOn(0.74, 2.05, 0.2, 0, 0, 0), bxOn(0.86, 0.03, 0.5, 0, 0, 0));
  a.add(M('venues.signagePortrait'), bx(0.64, 1.14, 0.008, 0, 1.36, 0.104));
  a.add(M('venues.signageInk'), tf(wordmark(0.07), { x: 0, y: 1.38, z: 0.11 }), bx(0.28, 0.008, 0.003, 0, 1.34, 0.11));
  return a.parts();
}

/** Single chrome post of a ticket lane, centred on its floor slot. */
export function lanePost() {
  const a = new Asm();
  const ch = M('venues.laneChrome');
  a.add(ch, cyl(0.028, 0.94, 0, 0.015, 0, 8), cyl(0.17, 0.015, 0, 0, 0, 12), cyl(0.036, 0.06, 0, 0.93, 0, 8));
  return a.parts();
}

/** Ticket reader pedestal with its lane-number flag; the ticket holder approaches from local +Z. */
export function ticketReader() {
  const a = new Asm();
  const b = M('venues.totemBody');
  a.add(b, bxOn(0.36, 0.98, 0.36, 0, 0, 0), tf(bx(0.34, 0.03, 0.4), { rx: 0.35, y: 1.03, z: 0.02 }), rod([0, 0.98, -0.12], [0, 2.08, -0.12], 0.014, 5));
  a.add(M('venues.laneIndicator'), tf(bx(0.16, 0.012, 0.16), { rx: 0.35, y: 1.052, z: 0.03 }));
  a.add(M('venues.laneSign'), bx(0.26, 0.18, 0.02, 0, 2.17, -0.12));
  return a.parts();
}

// ---------------------------------------------------------------------------------------
// kiosk
// ---------------------------------------------------------------------------------------

/**
 * Kiosk fit-out inside a recess built by arena/structure (side / back walls, recess ceiling,
 * canopy fascia with four downlights): dark back lining, counter with a back-lit front, four
 * glass-door fridges with rows of bottles, four menu monitors under the recess ceiling, two
 * pairs of gold beer towers, card terminals.
 * Origin = centre of the opening line on the floor, opening toward local +Z; the recess is
 * `width` wide, `depth` deep (toward local −Z) and `opening` high.
 */
export function kioskFitout({ accent = 'red', width = 8.5, depth = 2.6, opening = 2.4 } = {}) {
  const a = new Asm();
  const W = width;
  const D = depth;
  const H = opening;
  const body = M('venues.kioskFridgeBody');
  // back lining
  a.add(M('venues.kioskBack'), bx(W - 0.04, H - 0.02, 0.03, 0, (H - 0.02) / 2, -D + 0.035));
  // counter
  const cw = W - 0.1;
  a.add(M('venues.kioskCounterTop'), bx(cw, 0.04, 0.65, 0, 1.03, -0.5));
  const cf = M('venues.kioskCounterFront');
  a.add(cf, bx(cw, 0.3, 0.04, 0, 0.86, -0.22), bx(cw, 0.12, 0.03, 0, 0.06, -0.26), bx(cw, 1.0, 0.03, 0, 0.505, -0.79));
  for (const sx of [-1, 1]) a.add(cf, bx(0.04, 1.01, 0.5, sx * (cw / 2 - 0.02), 0.505, -0.51));
  a.add(M(accent === 'blue' ? 'venues.kioskGlowBlue' : 'venues.kioskGlowRed'), bx(cw, 0.59, 0.03, 0, 0.415, -0.225));
  // fridges against the back lining
  const zb = -D + 0.05;
  const pitch = (W - 0.3) / 4;
  const fw = pitch - 0.1;
  const fh = H - 0.7;
  const light = M('venues.kioskFridgeLight');
  const gy0 = 0.3;
  const gy1 = fh - 0.1;
  const rows = [0.8, 0.5, 0.2].map((k) => gy0 + (gy1 - gy0) * k);
  const stockIds = ['venues.kioskStockBlue', 'venues.kioskStockGreen', 'venues.kioskStockRed'];
  for (let i = 0; i < 4; i++) {
    const x = (i - 1.5) * pitch;
    a.add(body, bxOn(fw, fh, 0.62, x, 0, zb + 0.31));
    a.add(light, bx(fw - 0.22, gy1 - gy0, 0.01, x, (gy0 + gy1) / 2, zb + 0.626));
    a.add(body, bx(0.05, gy1 - gy0, 0.02, x, (gy0 + gy1) / 2, zb + 0.636));
    rows.forEach((y, k) => {
      a.add(body, bx(fw - 0.22, 0.02, 0.016, x, y - 0.11, zb + 0.636));
      for (const sx of [-1, 1]) a.add(M(stockIds[k]), bx((fw - 0.22) / 2 - 0.09, 0.18, 0.008, x + sx * ((fw - 0.22) / 4 + 0.012), y, zb + 0.634));
    });
  }
  // menu monitors under the recess ceiling: soft drinks (blue), alcohol (purple), food, house slide
  const menu = M('venues.kioskMenu');
  for (let i = 0; i < 4; i++) {
    const x = (i - 1.5) * 1.1;
    const y = H - 0.36;
    const zs = zb + 0.036;
    a.add(body, bx(1.06, 0.58, 0.03, x, y, zb + 0.015));
    if (i === 0 || i === 1) {
      a.add(M(i === 0 ? 'venues.kioskStockBlue' : 'venues.kioskMenuPurple'), bx(1.0, 0.52, 0.012, x, y, zs));
      a.add(menu, bx(0.62, 0.07, 0.004, x - 0.14, y + 0.18, zs + 0.008), bx(0.2, 0.09, 0.004, x + 0.36, y + 0.17, zs + 0.008));
      for (let k = 0; k < 3; k++) a.add(menu, bx(0.4, 0.03, 0.004, x - 0.25, y + 0.05 - k * 0.09, zs + 0.008));
      a.add(menu, bx(0.3, 0.3, 0.004, x + 0.3, y - 0.07, zs + 0.008));
    } else if (i === 2) {
      a.add(menu, bx(1.0, 0.52, 0.012, x, y, zs));
      a.add(body, bx(0.42, 0.36, 0.004, x - 0.24, y + 0.04, zs + 0.008), bx(0.42, 0.36, 0.004, x + 0.24, y + 0.04, zs + 0.008));
    } else a.add(menu, bx(1.0, 0.52, 0.012, x, y, zs));
  }
  // beer towers, drip trays, card terminals
  const gold = M('venues.goldPolished');
  for (const sx of [-1, 1]) {
    for (const dx of [-0.16, 0.16]) {
      const x = sx * (W * 0.26) + dx;
      a.add(gold, cyl(0.035, 0.42, x, 1.05, -0.55, 8), bx(0.07, 0.06, 0.17, x, 1.5, -0.51));
    }
    a.add(body, bx(0.6, 0.02, 0.26, sx * (W * 0.26), 1.06, -0.47));
  }
  for (const x of [-W * 0.39, 0, W * 0.39]) a.add(M('venues.kioskTerminal'), bx(0.12, 0.06, 0.18, x, 1.08, -0.35));
  return a.parts();
}

export { roundedRectRing };

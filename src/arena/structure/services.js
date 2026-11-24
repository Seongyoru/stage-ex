// Interior columns and the exposed-services ceilings of the concourses: charcoal bulkheads,
// foil-wrapped ducts, pipe runs, cable trays and the linear LED tubes (warm orange on
// LEVEL 3 / 5, white on LEVEL 1 / 4, cool blue on LEVEL 7). Fact sheet §8 and §9.2.
import { frameC, frameW, xJ, aJ } from './kit.js';
import { R, Y, wallIn, A_IN, A_ZONE, GRID_X, GRID_A, ROW_A, ROW_B, ROW_C, ROW_D, BOX_Z, RC0, CIRC, standY } from './plan.js';
import { column } from './fittings.js';
import { signF } from './signs.js';

const casing = (lv) => (lv <= 2 ? 'concreteCore' : lv === 3 ? 'mortarL3' : lv >= 7 ? 'mortarL7' : 'mortar');

function columns(kit) {
  const y3 = Y[3];
  for (const s of [1, -1]) {
    const C = frameC(s);
    for (const x of GRID_X.slice(0, 3)) {
      const cut = [2, 3, 5, 6, 7, 8];
      column(kit, C, x, ROW_A, 1.2, 0.02, Y[8] - 0.3, casing, cut); // threshold of the glass box, all public storeys
      column(kit, C, x, ROW_B, 1.2, 0.02, Y[5] - 0.35, casing, cut); // middle of the main foyer
      column(kit, C, x, ROW_C, 1.2, 0.02, Y[5] - 0.35, casing, cut); // foot of the grand stair
      if (x < 20) column(kit, C, x, ROW_D, 1.2, 0.02, 12.2, casing, cut); // head of the stair, flanking the mural
    }
    // stainless corner guards of the foyer columns, 1.3 m high (official foyer photos)
    for (const x of GRID_X.slice(0, 3)) {
      for (const q of [ROW_A, ROW_B, ROW_C]) {
        for (const [dx, dq] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) kit.box(C, x + dx * 0.6 - 0.025, x + dx * 0.6 + 0.025, q + dq * 0.6 - 0.025, q + dq * 0.6 + 0.025, y3 + 0.01, y3 + 1.3, 'stainless', 3);
      }
    }
    // stencil graphics on the stair-foot columns (official foyer photo)
    signF(kit, C, 3, 4.27, ROW_C + 0.6, y3 + 1.8, 0, 1, 0.98, 2.5, { kind: 'level', level: 3, lines: [s < 0 ? '<- 301-302' : '303-304 ->'] });
    signF(kit, C, 3, 12.81, ROW_C + 0.6, y3 + 1.8, 0, 1, 0.98, 2.3, { kind: 'way', level: 1, dir: s < 0 ? Math.PI * 1.25 : Math.PI * 1.75 });
    signF(kit, C, 3, 12.81 + 0.6, ROW_C, y3 + 1.6, 1, 0, 0.95, 1.2, { kind: 'text', lines: ['GATE', s < 0 ? '302' : '303', s < 0 ? '303-304' : '301-302'] });
    signF(kit, C, 3, 21.36, ROW_C + 0.6, y3 + 1.8, 0, 1, 0.98, 2.3, { kind: 'way', level: 1, dir: s < 0 ? Math.PI * 1.25 : Math.PI * 1.75 });
  }
}

// --- service runs -------------------------------------------------------------------------------------
function rectDuct(kit, f, level, p0, p1, q, yTop, w = 1.0, h = 0.45, axis = 'p') {
  const b = (a0, a1, c0, c1, y0, y1, m) => (axis === 'p' ? kit.box(f, a0, a1, c0, c1, y0, y1, m, level) : kit.box(f, c0, c1, a0, a1, y0, y1, m, level));
  b(p0, p1, q - w / 2, q + w / 2, yTop - h, yTop, 'duct');
  for (let p = Math.min(p0, p1) + 0.6; p < Math.max(p0, p1); p += 2.4) b(p - 0.03, p + 0.03, q - w / 2 - 0.035, q + w / 2 + 0.035, yTop - h - 0.035, yTop + 0.035, 'duct');
}
function roundDuct(kit, f, level, p0, p1, q, y, r = 0.25, axis = 'p') {
  if (axis === 'p') kit.tube(f, [p0, q, y], [p1, q, y], r, 'duct', level, 12);
  else kit.tube(f, [q, p0, y], [q, p1, y], r, 'duct', level, 12);
}
function pipes(kit, f, level, p0, p1, q, y, axis = 'p') {
  if (kit.quality === 'low') return;
  for (const [dq, r] of [[-0.18, 0.05], [0, 0.07], [0.2, 0.05]]) {
    if (axis === 'p') kit.tube(f, [p0, q + dq, y], [p1, q + dq, y], r, 'pipe', level, 6);
    else kit.tube(f, [q + dq, p0, y], [q + dq, p1, y], r, 'pipe', level, 6);
  }
}
function tray(kit, f, level, p0, p1, q, y, axis = 'p') {
  if (kit.quality === 'low') return;
  if (axis === 'p') kit.box(f, p0, p1, q - 0.2, q + 0.2, y, y + 0.06, 'tray', level);
  else kit.box(f, q - 0.2, q + 0.2, p0, p1, y, y + 0.06, 'tray', level);
}
/** Linear LED tubes in a row: 3.6 m luminaires with 1.2 m gaps. */
function ledRow(kit, f, level, p0, p1, q, y, mat, axis = 'p', seg = 3.6, gap = 1.2) {
  const lo = Math.min(p0, p1);
  const hi = Math.max(p0, p1);
  for (let p = lo; p + seg <= hi + 0.01; p += seg + gap) {
    if (axis === 'p') {
      kit.box(f, p, p + seg, q - 0.035, q + 0.035, y, y + 0.06, mat, level);
      kit.box(f, p - 0.02, p + seg + 0.02, q - 0.045, q + 0.045, y + 0.06, y + 0.09, 'steelBlack', level);
    } else {
      kit.box(f, q - 0.035, q + 0.035, p, p + seg, y, y + 0.06, mat, level);
      kit.box(f, q - 0.045, q + 0.045, p - 0.02, p + seg + 0.02, y + 0.06, y + 0.09, 'steelBlack', level);
    }
  }
}
function downlights(kit, f, level, pts, y, size = 0.14) {
  if (kit.quality === 'low') return;
  for (const [p, q] of pts) kit.box(f, p - size / 2, p + size / 2, q - size / 2, q + size / 2, y - 0.015, y, 'spot', level);
}

function ceilings(kit) {
  const y3 = Y[3];
  const c3 = Y[5] - 0.35;
  const c5 = Y[6] - 0.35;
  const c7 = Y[8] - 0.3;
  const c1 = Y[2] - 0.35;

  for (const s of [1, -1]) {
    const C = frameC(s);
    const W = frameW(s);

    // ---------------- LEVEL 1: corridor under the Lower Stand ---------------------------------------
    {
      const q = 90.0;
      const yS = c1 - 0.2;
      ledRow(kit, W, 1, aJ(q) + 1.5, A_IN - 1, q, yS, 'ledWhite');
      ledRow(kit, C, 1, 0.6, xJ(q) - 1, q, yS, 'ledWhite');
      // flat black ceiling of the corridor under the rake of the Lower Stand (clear height 3.4 m)
      kit.prism(W, [[aJ(86.3), 86.3], [A_IN, 86.3], [A_IN, 93.3], [aJ(93.3), 93.3]], c1, c1 + 0.1, 'soffit', 1);
      kit.prism(C, [[0, 86.3], [xJ(86.3), 86.3], [xJ(93.3), 93.3], [0, 93.3]], c1, c1 + 0.1, 'soffit', 1);
      kit.wall(W, aJ(86.4), 86.4, A_IN, 86.4, 2.82, c1, 0.2, 'mortar', 1);
      kit.wall(C, 0, 86.4, xJ(86.4), 86.4, 2.82, c1, 0.2, 'mortar', 1);
      rectDuct(kit, W, 1, aJ(88.2) + 1, A_IN - 0.5, 88.2, c1 - 0.03, 0.8, 0.32);
      rectDuct(kit, C, 1, 0, xJ(88.2), 88.2, c1 - 0.03, 0.8, 0.32);
      pipes(kit, W, 1, aJ(91.6) + 1, A_IN - 0.5, 91.6, c1 - 0.12);
      pipes(kit, C, 1, 0, xJ(91.6), 91.6, c1 - 0.12);
      const dl = [];
      for (let a = -8; a < 34; a += 2.6) dl.push([a, 96.0]);
      downlights(kit, W, 1, dl, c1);
      const dc = [];
      for (let x = 1.4; x < 26; x += 2.6) dc.push([x, 96.0]);
      downlights(kit, C, 1, dc, c1);
    }

    // ---------------- LEVEL 3: main foyer (centre) -----------------------------------------------------
    {
      const zBox = BOX_Z + RC0;
      // charcoal bulkheads: transverse on the two column rows, longitudinal on the column lines
      kit.box(C, 0, 22.02, ROW_C - 0.66, ROW_C + 0.66, c3 - 0.85, c3, 'bulkhead', 3);
      kit.box(C, 0, 22.02, ROW_B - 0.66, ROW_B + 0.66, c3 - 0.85, c3, 'bulkhead', 3);
      kit.box(C, 0, 22.02, ROW_A - 0.66, ROW_A + 0.66, c3 - 0.85, c3, 'bulkhead', 3);
      kit.box(C, 12.81 - 0.45, 12.81 + 0.45, ROW_C + 0.66, ROW_B - 0.66, c3 - 0.7, c3, 'bulkhead', 3);
      kit.box(C, 12.81 - 0.45, 12.81 + 0.45, ROW_B + 0.66, ROW_A - 0.66, c3 - 0.7, c3, 'bulkhead', 3);
      kit.box(C, 12.81 - 0.45, 12.81 + 0.45, ROW_A + 0.66, zBox, c3 - 0.7, c3, 'bulkhead', 3);
      if (s > 0) {
        // the wide central bulkhead on the axis, with its return-air grilles
        kit.box(C, -1.2, 1.2, R.l5BackC, zBox, c3 - 1.15, c3, 'bulkhead', 3);
        for (const q of [106.0, 114.0, 122.5]) kit.box(C, -0.55, 0.55, q - 0.4, q + 0.4, c3 - 1.16, c3 - 1.15, 'steelBlack', 3);
      }
      // foil ducts and pipes between the bulkheads
      rectDuct(kit, C, 3, ROW_B + 0.8, zBox - 0.5, 2.6, c3 - 0.12, 1.3, 0.5, 'q');
      rectDuct(kit, C, 3, ROW_C + 0.8, ROW_B - 0.8, 2.6, c3 - 0.12, 1.3, 0.5, 'q');
      roundDuct(kit, C, 3, 3.4, 20.5, 106.6, c3 - 0.5, 0.28);
      roundDuct(kit, C, 3, 3.4, 20.5, 114.2, c3 - 0.5, 0.28);
      roundDuct(kit, C, 3, 3.4, 20.5, 122.8, c3 - 0.5, 0.28);
      pipes(kit, C, 3, 1.4, 21.5, 112.6, c3 - 0.35);
      pipes(kit, C, 3, ROW_B + 0.8, ROW_A - 0.8, 8.0, c3 - 0.3, 'q');
      tray(kit, C, 3, 1.4, 21.5, 116.2, c3 - 0.3);
      // warm linear LEDs in the chevron pattern of the official photo, pointing at the stair
      const yL = c3 - 1.0;
      for (let k = 0; k < 3; k++) {
        const x0 = 2.4 + k * 6.6;
        kit.beam(C, [x0, 110.9, yL], [x0 + 4.4, 117.4, yL], 0.07, 0.07, 'ledWarm', 3);
        kit.beam(C, [x0, 119.4, yL], [x0 + 4.2, 126.6, yL], 0.07, 0.07, 'ledWarm', 3);
      }
      for (let k = 0; k < 3; k++) {
        const x0 = 2.4 + k * 6.6;
        kit.beam(C, [x0, ROW_C + 1.0, yL], [x0 + 3.0, ROW_B - 1.0, yL], 0.07, 0.07, 'ledWarm', 3);
      }
      kit.beam(C, [5.0, ROW_C - 1.0, yL], [2.4, ROW_D + 1.2, yL], 0.07, 0.07, 'ledWarm', 3);
      // downlights at the column heads and over the gate passages
      const dl = [];
      for (const x of GRID_X.slice(0, 3)) for (const q of [ROW_C + 0.75, ROW_B + 0.75, ROW_B - 0.75, ROW_A + 0.75, ROW_A - 0.75]) dl.push([x - 0.45, q], [x + 0.45, q]);
      downlights(kit, C, 3, dl, c3 - 0.85);
      const dg = [];
      for (let q = 97.6; q < 106.5; q += 1.8) dg.push([15.8, q]);
      downlights(kit, C, 3, dg, Y[4] - 0.3);
    }

    // ---------------- LEVEL 3: wing concourse -----------------------------------------------------------
    {
      const r0 = R.l4Edge + 0.15;
      const r1 = R.shaft0;
      const a0 = aJ((r0 + r1) / 2) + 0.5;
      const a1 = A_IN - 0.4;
      for (const a of GRID_A) kit.box(W, a - 0.35, a + 0.35, r0, r1, c3 - 0.65, c3, 'bulkhead', 3);
      rectDuct(kit, W, 3, a0, a1, r0 + 1.3, c3 - 0.68, 1.0, 0.45);
      roundDuct(kit, W, 3, a0 + 1, a1, r1 - 1.0, c3 - 1.0, 0.24);
      pipes(kit, W, 3, a0 + 1, a1, r1 - 2.0, c3 - 0.78);
      tray(kit, W, 3, a0 + 1, a1, r0 + 2.6, c3 - 0.8);
      ledRow(kit, W, 3, a0 + 2.5, a1 - 0.5, (r0 + r1) / 2 + 0.3, c3 - 1.25, 'ledWarm');
      const dl = [];
      for (let a = -13; a < 30; a += 2.4) dl.push([a, 105.4]);
      downlights(kit, W, 3, dl, Y[4] - 0.3);
    }

    // ---------------- LEVEL 4: mezzanine ----------------------------------------------------------------
    {
      const q = 98.6;
      ledRow(kit, W, 4, aJ(q) + 1.0, 30.5, q, 12.2 - 0.07, 'ledWhite', 'p', 2.4, 1.6);
      ledRow(kit, C, 4, 13.5, xJ(q) - 0.5, 98.0, 12.2 - 0.07, 'ledWhite', 'p', 2.4, 1.6);
      ledRow(kit, C, 4, 99.9, R.l4Edge - 0.6, 27.6 - 4.2, Y[5] - 0.35 - 0.07, 'ledWhite', 'q', 2.4, 1.2);
    }

    // ---------------- LEVEL 5: concourse (wings and centre) ---------------------------------------------
    {
      const r0 = R.l5BackW + 0.45;
      const r1 = R.wall - 0.5;
      const a0 = aJ(113) + 0.6;
      const a1 = A_IN - 3.2;
      const yS = Y[5] + 4.05; // underside of the services zone ("about 4 m to services")
      const inCore = (a) => [...CIRC.s357.wing, CIRC.liftWing].some(([p0, p1]) => a > p0 - 0.4 && a < p1 + 0.4);
      for (const a of GRID_A) kit.box(W, a - 0.3, a + 0.3, r0, inCore(a) ? R.shaft0 : r1, c5 - 0.6, c5, 'beam', 5);
      rectDuct(kit, W, 5, a0, a1, r0 + 1.2, yS + 0.55, 1.0, 0.5);
      roundDuct(kit, W, 5, a0, a1, r0 + 2.9, yS + 0.3, 0.25);
      pipes(kit, W, 5, a0, a1, r1 - 0.9, yS + 0.3);
      tray(kit, W, 5, a0, a1, r0 + 3.9, yS + 0.2);
      ledRow(kit, W, 5, a0 + 1.5, a1, r0 + 2.1, yS - 0.12, 'ledWarm');
      // centre concourse in front of Lounge 5
      const q0 = R.l5Face + 0.1;
      for (const x of GRID_X.slice(0, 3)) kit.box(C, x - 0.3, x + 0.3, q0, ROW_A - 0.6, c5 - 0.6, c5, 'beam', 5);
      rectDuct(kit, C, 5, 0, 21.0, q0 + 1.3, yS + 0.55, 1.0, 0.5);
      roundDuct(kit, C, 5, 0, 21.0, q0 + 3.0, yS + 0.3, 0.25);
      pipes(kit, C, 5, 0, 22.0, ROW_A - 1.4, yS + 0.3);
      ledRow(kit, C, 5, 0.6, 22.0, q0 + 2.2, yS - 0.12, 'ledWarm');
      ledRow(kit, C, 5, 0.6, 20.0, q0 + 5.6, yS - 0.12, 'ledWarm');
      const dl = [];
      for (const p of [6.014, 18.139, 29.0]) for (const q of [103.5, 105.5, 107.5]) dl.push([p, q]);
      downlights(kit, C, 5, dl, c5);
    }

    // ---------------- LEVEL 6: VIP corridor -----------------------------------------------------------
    {
      const dl = [];
      for (let x = 1.5; x < 22; x += 3) dl.push([x, 112.4]);
      downlights(kit, C, 6, dl, Y[7] - 0.35, 0.12);
    }

    // ---------------- LEVEL 7: concourse ----------------------------------------------------------------
    {
      const rc0 = R.shaft1 + 0.25;
      const rc1 = wallIn(Y[7]) - 0.2;
      const a0 = aJ(119) + 0.6;
      const a1 = A_IN - 3.2;
      const yS = Y[7] + 3.25;
      rectDuct(kit, W, 7, a0, a1, rc0 + 0.75, c7 - 0.1, 0.8, 0.38);
      pipes(kit, W, 7, a0, a1, rc1 - 0.5, c7 - 0.3);
      ledRow(kit, W, 7, a0 + 1, a1, (rc0 + rc1) / 2 + 0.2, yS, 'ledBlue');
      rectDuct(kit, C, 7, 22.9, xJ(rc0 + 0.75), rc0 + 0.75, c7 - 0.1, 0.8, 0.38);
      ledRow(kit, C, 7, 0.6, xJ(119) - 0.5, (rc0 + rc1) / 2 + 0.2 > ROW_A - 0.8 ? ROW_A - 0.75 : (rc0 + rc1) / 2 + 0.2, yS, 'ledBlue');
      // blue tubes inside the gate lobbies and along the forward side corridor
      for (const id of s < 0 ? ['701', '702', '703'] : ['710', '711', '712']) void id;
      ledRow(kit, W, 7, 51, 108, A_IN - 0.9, Y[7] + 2.9 - 0.07, 'ledBlue', 'q', 2.4, 3.0);
      const dl = [];
      for (let x = 6.014; x < 20; x += 12.125) for (const q of [112, 114, 116]) dl.push([x, q]);
      downlights(kit, C, 7, dl, Y[8] - 0.3, 0.12);
    }
  }
  void y3;
  void A_ZONE;
  void CIRC;
}

export default function buildServices(kit) {
  columns(kit);
  ceilings(kit);
}

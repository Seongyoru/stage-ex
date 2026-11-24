// Arena Deck (+7.27, LEVEL 3), lower Music Terrace plaza (+5.0), their edges, paving
// pattern, podium walls, supporting structure and the service yard underneath.
import { prism, box, cylinder } from '../../core/geom.js';
import { GLASS_BOX } from '../../core/envelope.js';
import { M, E } from './mats.js';
import { Tris, distToRing, dist2, lbox, offsetPolyline, pointInRing, unit2, frame, place } from './kit.js';
import {
  ARENA_DECK_RING, COLUMNS, DECK_FL, DECK_OFF_L, DECK_S1, FACET_L, FACET_R, H, HF, HILTON, JOG_T, KTOWER, L3_WALL_RING, LIFT_N, NGATE, P, PLAZA_HOLES, PLAZA_RING, PROW, RAMP_E, RAMP_KNEE, SHOULDER_L, SHOULDER_R, SITE_RING, STEPS, WEST, Y_DECK, Y_PLAZA, facetColumnT, WALL_OFF, COL_OFF,
} from './layout.js';

export const SLAB = 0.45; // structural depth of the deck slabs
export const KERB = 0.15; // upstand along free edges
const FASCIA = 1.15; // depth of the white edge beam below the walking surface

// --- small plan helpers ---------------------------------------------------------------------
/** Parameters t where the line p + t·d crosses the ring (sorted). */
function crossings(p, d, ring) {
  const out = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const ex = b[0] - a[0];
    const ez = b[1] - a[1];
    const den = d[0] * ez - d[1] * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((a[0] - p[0]) * ez - (a[1] - p[1]) * ex) / den;
    const s = ((a[0] - p[0]) * d[1] - (a[1] - p[1]) * d[0]) / den;
    if (s >= 0 && s < 1) out.push(t);
  }
  return out.sort((x, y) => x - y);
}
/** Inside intervals of a line in a ring with holes (even-odd). */
export function clipLine(p, d, ring, holes = []) {
  const ts = crossings(p, d, ring);
  for (const h of holes) ts.push(...crossings(p, d, h));
  ts.sort((x, y) => x - y);
  const out = [];
  for (let i = 0; i + 1 < ts.length; i += 2) if (ts[i + 1] - ts[i] > 0.05) out.push([ts[i], ts[i + 1]]);
  return out;
}
/** Flat strip decal of width w along p + t·d for t in [t0, t1], at height y. */
function strip(tris, p, d, t0, t1, w, y) {
  const nx = -d[1] * (w / 2);
  const nz = d[0] * (w / 2);
  const a = [p[0] + d[0] * t0, p[1] + d[1] * t0];
  const b = [p[0] + d[0] * t1, p[1] + d[1] * t1];
  tris.quad([a[0] + nx, y, a[1] + nz], [b[0] + nx, y, b[1] + nz], [b[0] - nx, y, b[1] - nz], [a[0] - nx, y, a[1] - nz], [0, 1, 0]);
}
/** Strips along a line clipped to a ring; `inset` trims both ends of every interval. */
function clippedStrips(tris, p, d, ring, holes, w, y, { inset = 0.3, tMin = -Infinity, tMax = Infinity } = {}) {
  for (const [t0, t1] of clipLine(p, d, ring, holes)) {
    const a = Math.max(t0 + inset, tMin);
    const b = Math.min(t1 - inset, tMax);
    if (b - a > 0.4) strip(tris, p, d, a, b, w, y);
  }
}
/** Vertical wall slab on a ring edge a→b, lying on the inner side of the edge. */
function edgeWall(a, b, y0, y1, thick, ring) {
  const len = dist2(a, b);
  if (len < 0.02) return null;
  const d = unit2(a, b);
  let n = [-d[1], d[0]];
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  if (!pointInRing(mid[0] + n[0] * 0.25, mid[1] + n[1] * 0.25, ring)) n = [-n[0], -n[1]];
  return box(mid[0] + (n[0] * thick) / 2, (y0 + y1) / 2, mid[1] + (n[1] * thick) / 2, len + 0.0, y1 - y0, thick, Math.atan2(-d[1], d[0]));
}
/** Point moved toward the inside of a ring by `inset` (for rails that stand behind an edge). */
function insetPath(points, ring, inset) {
  const out = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const d = unit2(prev, next);
    let n = [-d[1], d[0]];
    if (!pointInRing(p[0] + n[0] * 0.3, p[1] + n[1] * 0.3, ring)) n = [-n[0], -n[1]];
    // at corners the two adjacent insets differ; a mitre factor keeps the offset about constant
    const d0 = unit2(prev, p);
    const d1 = unit2(p, next);
    const cosHalf = Math.sqrt(Math.max(0.25, (1 + d0[0] * d1[0] + d0[1] * d1[1]) / 2));
    out.push([p[0] + (n[0] * inset) / cosHalf, p[1] + (n[1] * inset) / cosHalf]);
  }
  return out;
}

/** Square opening for a column, aligned with its facet. */
function columnHole([x, z], size = 1.3) {
  let ux = 1;
  let uz = 0;
  if (Math.abs(z - 94.76) > 0.5) {
    const f = x > 0 ? FACET_R : FACET_L;
    ux = f.d[0];
    uz = f.d[1];
  }
  const h = size / 2;
  return [
    [x + ux * h - uz * h, z + uz * h + ux * h],
    [x - ux * h - uz * h, z - uz * h + ux * h],
    [x - ux * h + uz * h, z - uz * h - ux * h],
    [x + ux * h + uz * h, z + uz * h - ux * h],
  ];
}

// Ramp beside the North Gate: from the landing (+5.0) up to the Arena Deck at the jog.
export const NRAMP = (() => {
  const base = [[STEPS.xNorth, NGATE.zDeckEdge], RAMP_KNEE, FACET_L.at(JOG_T, 0)];
  const normals = [[0, 1], FACET_L.n];
  const inner = offsetPolyline(base, normals, 0.2);
  const outer = offsetPolyline(base, normals, 0.2 + NGATE.rampW);
  const mid = offsetPolyline(base, normals, 0.2 + NGATE.rampW / 2);
  const l0 = dist2(mid[0], mid[1]);
  const l1 = dist2(mid[1], mid[2]);
  const flat = 1.8; // level landing at the top
  const rise = Y_DECK - Y_PLAZA;
  const yKnee = Y_PLAZA + (rise * l0) / (l0 + l1 - flat);
  const tFlat = 1 - flat / l1;
  const flatPt = (line) => [line[1][0] + (line[2][0] - line[1][0]) * tFlat, line[1][1] + (line[2][1] - line[1][1]) * tFlat];
  return {
    base, normals, inner, outer, mid, yKnee,
    // stations: foot, knee, start of top landing, top
    innerPts: [inner[0], inner[1], flatPt(inner), inner[2]],
    outerPts: [outer[0], outer[1], flatPt(outer), outer[2]],
    ys: [Y_PLAZA, yKnee, Y_DECK, Y_DECK],
  };
})();

// Slope along the hotel's east face: +5.0 at the hotel's north-east corner up to the Arena Deck.
export const ERAMP = (() => {
  const b0 = RAMP_E.bFoot;
  const b1 = RAMP_E.bTop + 1.5; // 1.5 m level landing at the top
  return { b0, b1, yAt: (b) => (b >= b0 ? Y_PLAZA : b <= b1 ? Y_DECK : Y_PLAZA + ((Y_DECK - Y_PLAZA) * (b0 - b)) / (b0 - b1)) };
})();

export function buildDecks(bag, rails, ctx) {
  const paver = M('precinct.paver');
  const soffit = M('precinct.deckSoffit');
  const fascia = M('precinct.deckFascia');
  const concrete = M('precinct.concrete');
  const high = ctx.quality !== 'low';

  // ============================== ARENA DECK ==============================
  const ring = ARENA_DECK_RING;
  const holes = COLUMNS.map((c) => columnHole(c));
  bag.add(paver, prism(ring, Y_DECK - SLAB, Y_DECK, { holes, bottom: false, sides: false }), 3);
  bag.add(soffit, prism(ring, Y_DECK - SLAB, Y_DECK, { holes, top: false, sides: false }), 1);
  // shafts of the column openings (thin dark joint round each column)
  for (const h of holes) bag.add(M('precinct.drain'), prism(h, Y_DECK - SLAB, Y_DECK - 0.01, { top: false, bottom: false }), 3);

  // --- free edges: white edge beam + kerb, railing behind it -----------------------------
  const iOf = (p) => ring.findIndex((q) => Math.abs(q[0] - p[0]) < 1e-6 && Math.abs(q[1] - p[1]) < 1e-6);
  const seq = (from, to) => {
    const out = [];
    for (let i = iOf(from); ; i = (i + 1) % ring.length) {
      out.push(ring[i]);
      if (i === iOf(to)) break;
    }
    return out;
  };
  const edgeBeam = (pts, { y0 = Y_DECK - FASCIA, y1 = Y_DECK + KERB, thick = 0.35, material = fascia, rail = true, level = 3 } = {}) => {
    for (let i = 0; i < pts.length - 1; i++) bag.add(material, edgeWall(pts[i], pts[i + 1], y0, y1, thick, ring), level);
    if (rail) rails.run(insetPath(pts, ring, thick / 2).map((p) => [p[0], y1, p[1]]), { h: 1.1 - KERB + 0.05, level });
  };
  // south edge: flank wall end → shoulder → line to the hotel
  edgeBeam([lerpIn(L3_WALL_RING[9], SHOULDER_R, 0.02), SHOULDER_R, DECK_S1, H(0, -HILTON.eastBlockDepth)].map((p, i) => (i < 2 ? nudge(p, ring, 0.12) : p)));
  // house-left diagonal: jog → edge outside the Arena Tent → prow → East Gate end
  const leftEdge = seq(FACET_L.at(JOG_T, DECK_OFF_L), DECK_FL);
  // (the North lift tower stands on the first 7 m of this edge)
  const afterLift = FACET_L.at(JOG_T + LIFT_N.len, DECK_OFF_L);
  edgeBeam([afterLift, ...leftEdge.slice(1, -1)]);
  // East Gate end of the deck (perpendicular to the flank): stair head, see stairs.js
  bag.add(fascia, edgeWall(leftEdge[leftEdge.length - 2], DECK_FL, Y_DECK - FASCIA, Y_DECK + KERB, 0.35, ring), 3);
  rails.run(insetPath([leftEdge[leftEdge.length - 2], DECK_FL], ring, 0.18).map((p) => [p[0], Y_DECK + KERB, p[1]]), { h: 1.0, level: 3 });
  // open corner under the house-left eave prow (flank side)
  edgeBeam([nudge(SHOULDER_L, ring, 0.12), nudge(lerpIn(L3_WALL_RING[2], SHOULDER_L, 0.02), ring, 0.12)], { rail: false });

  // --- retaining edges toward the lower levels ---------------------------------------------
  // north end of the Big Steps: wall of the Arena Deck above the landing
  const nA = [STEPS.xNorth, STEPS.zTop + STEPS.depth];
  const nB = [STEPS.xNorth, NGATE.zDeckEdge];
  bag.add(concrete, edgeWall(nA, nB, Y_PLAZA - SLAB, Y_DECK + KERB, 0.4, ring), 3);
  rails.run([[STEPS.xNorth - 0.2, Y_DECK + KERB, nA[1]], [STEPS.xNorth - 0.2, Y_DECK + KERB, nB[1] - 0.2]], { h: 1.0, level: 3 });
  // deck edge above the north ramp (the ramp climbs along it)
  {
    const r = NRAMP;
    const t = new Tris();
    const top = Y_DECK + KERB;
    const inn = offsetPolyline(r.base, r.normals, -0.35);
    const pts = [r.base[0], r.base[1], r.base[2]];
    const yLow = [Y_PLAZA - 0.3, r.yKnee - 0.3, Y_DECK - FASCIA];
    for (let i = 0; i < 2; i++) {
      const n = r.normals[i];
      t.quad([pts[i][0], yLow[i], pts[i][1]], [pts[i + 1][0], yLow[i + 1], pts[i + 1][1]], [pts[i + 1][0], top, pts[i + 1][1]], [pts[i][0], top, pts[i][1]], [n[0], 0, n[1]]);
      t.quad([pts[i][0], top, pts[i][1]], [pts[i + 1][0], top, pts[i + 1][1]], [inn[i + 1][0], top, inn[i + 1][1]], [inn[i][0], top, inn[i][1]], [0, 1, 0]);
      t.quad([inn[i][0], Y_DECK, inn[i][1]], [inn[i + 1][0], Y_DECK, inn[i + 1][1]], [inn[i + 1][0], top, inn[i + 1][1]], [inn[i][0], top, inn[i][1]], [-n[0], 0, -n[1]]);
    }
    bag.add(concrete, t.build(), 3);
    const railLine = offsetPolyline(r.base, r.normals, -0.18);
    railLine[0] = [railLine[0][0] - 0.2, railLine[0][1]];
    rails.run(railLine.map((p) => [p[0], top, p[1]]), { h: 1.0, level: 3 });
  }
  // jog beside the North lift: short return of the edge beam
  bag.add(fascia, edgeWall(FACET_L.at(JOG_T, 2.9), FACET_L.at(JOG_T, LIFT_N.off0), Y_DECK - FASCIA, Y_DECK + KERB, 0.35, ring), 3);
  // hotel side: wall above the slope that runs along the hotel's east face, and above the plaza
  {
    const a = RAMP_E.wallA;
    const t = new Tris();
    const top = Y_DECK + KERB;
    const pts = [H(a, STEPS.southB), H(a, 0), H(a, ERAMP.b1), H(a, RAMP_E.bTop)];
    const yLow = [Y_PLAZA - 0.3, Y_PLAZA - 0.3, Y_DECK - 0.3, Y_DECK - 0.3];
    const inn = pts.map((p) => [p[0] - WEST[0] * 0.35, p[1] - WEST[1] * 0.35]);
    for (let i = 0; i < 3; i++) {
      t.quad([pts[i][0], yLow[i], pts[i][1]], [pts[i + 1][0], yLow[i + 1], pts[i + 1][1]], [pts[i + 1][0], top, pts[i + 1][1]], [pts[i][0], top, pts[i][1]], [WEST[0], 0, WEST[1]]);
      t.quad([pts[i][0], top, pts[i][1]], [pts[i + 1][0], top, pts[i + 1][1]], [inn[i + 1][0], top, inn[i + 1][1]], [inn[i][0], top, inn[i][1]], [0, 1, 0]);
      t.quad([inn[i][0], Y_DECK, inn[i][1]], [inn[i + 1][0], Y_DECK, inn[i + 1][1]], [inn[i + 1][0], top, inn[i + 1][1]], [inn[i][0], top, inn[i][1]], [-WEST[0], 0, -WEST[1]]);
    }
    bag.add(concrete, t.build(), 3);
    rails.run([H(a - 0.18, STEPS.southB - 0.2), H(a - 0.18, RAMP_E.bTop + 1.6)].map((p) => [p[0], top, p[1]]), { h: 1.0, level: 3 });
    // south end of the Big Steps (leg 2): cheek wall closing the deck toward the plaza
    bag.add(concrete, edgeWall(H(a, STEPS.southB), H(0, STEPS.southB), Y_PLAZA - 0.3, top, 0.35, ring), 3);
    rails.run([H(a - 0.1, STEPS.southB + 0.18), H(-0.1, STEPS.southB + 0.18)].map((p) => [p[0], top, p[1]]), { h: 1.0, level: 3 });
  }

  // --- paving pattern: dark bands on the column grid ---------------------------------------
  const bands = new Tris();
  const yB = Y_DECK + 0.004;
  for (const [cx, cz] of COLUMNS) {
    const onCentre = Math.abs(cz - 94.76) < 0.5;
    const d = onCentre ? [0, 1] : cx > 0 ? FACET_R.n : FACET_L.n;
    // from the wall behind the column out to the free edge of the deck
    for (const [t0, t1] of clipLine([cx, cz], d, ring)) {
      if (t1 < -0.5 || t0 > 0.5) continue;
      strip(bands, [cx, cz], d, t0 + 0.25, -0.75, 0.6, yB);
      strip(bands, [cx, cz], d, 0.75, t1 - 0.5, 0.6, yB);
    }
  }
  // bands along the facade: on the column line and under the eave edge
  for (const off of [COL_OFF, -0.6]) {
    for (const f of [FACET_R, FACET_L]) {
      const p = f.at(0, off);
      clippedStrips(bands, p, f.d, ring, [], off === COL_OFF ? 0.45 : 0.3, yB, { tMin: off === COL_OFF ? facetColumnT(1) + 0.8 : -3 });
    }
    const zc = 103.76 + off;
    clippedStrips(bands, [0, zc], [1, 0], ring, [], off === COL_OFF ? 0.45 : 0.3, yB, { tMin: off === COL_OFF ? -38.4 : -44, tMax: off === COL_OFF ? 38.4 : 44 });
  }
  bag.add(M('precinct.paverBand'), bands.build(), 3);

  // slot drains: in front of the glass box and doors, along the free edges
  const drains = new Tris();
  clippedStrips(drains, [0, GLASS_BOX.zFront + 0.9], [1, 0], ring, [], 0.14, yB + 0.002, { tMin: -34, tMax: 34 });
  for (const f of [FACET_R, FACET_L]) clippedStrips(drains, f.at(0, WALL_OFF + 1.1), f.d, ring, [], 0.14, yB + 0.002, { tMin: 8 });
  clippedStrips(drains, FACET_L.at(0, DECK_OFF_L - 0.75), FACET_L.d, ring, [], 0.14, yB + 0.002, { tMin: JOG_T + LIFT_N.len + 0.5, tMax: 46 });
  clippedStrips(drains, [0, STEPS.zTop - 0.7], [1, 0], ring, [], 0.14, yB + 0.002, { tMin: STEPS.xNorth + 0.5, tMax: STEPS.bend[0] - 1 });
  bag.add(M('precinct.drain'), drains.build(), 3);

  // tactile guide strips (yellow-brown) on the main routes
  const tact = new Tris();
  const yT = yB + 0.004;
  strip(tact, [2.4, GLASS_BOX.zFront + 1.6], [0, 1], 0, STEPS.zTop - 0.4 - (GLASS_BOX.zFront + 1.6), 0.3, yT); // steps → Main Entrance
  strip(tact, [-30, GLASS_BOX.zFront + 1.6], [1, 0], 0, 62, 0.3, yT); // along the door line
  {
    const a = FACET_L.at(JOG_T + 1, 1.4);
    const b = [-30, GLASS_BOX.zFront + 1.6];
    strip(tact, a, unit2(a, b), 0, dist2(a, b), 0.3, yT); // north ramp head → door line
    const c = [32, GLASS_BOX.zFront + 1.6];
    const e = H(RAMP_E.wallA - 1.6, RAMP_E.bTop + 0.5);
    strip(tact, c, unit2(c, e), 0, dist2(c, e), 0.3, yT); // door line → head of the hotel-side slope
  }
  bag.add(M('precinct.tactile'), tact.build(), 3);

  // ============================== LOWER PLAZA ==============================
  const pr = PLAZA_RING;
  bag.add(paver, prism(pr, Y_PLAZA - SLAB, Y_PLAZA, { holes: PLAZA_HOLES, bottom: false, sides: false }));
  bag.add(soffit, prism(pr, Y_PLAZA - SLAB, Y_PLAZA, { holes: PLAZA_HOLES, top: false, sides: false }), 1);
  const pEdge = (pts, { rail = true, y0 = Y_PLAZA - FASCIA, y1 = Y_PLAZA + KERB, material = fascia, thick = 0.35 } = {}) => {
    for (let i = 0; i < pts.length - 1; i++) bag.add(material, edgeWall(pts[i], pts[i + 1], y0, y1, thick, pr));
    if (rail) rails.run(insetPath(pts, pr, thick / 2).map((p) => [p[0], y1, p[1]]), { h: 1.0 });
  };
  const pi = (p) => pr.findIndex((q) => Math.abs(q[0] - p[0]) < 1e-6 && Math.abs(q[1] - p[1]) < 1e-6);
  const pseq = (from, to) => {
    const out = [];
    for (let i = pi(from); ; i = (i + 1) % pr.length) {
      out.push(pr[i]);
      if (i === pi(to)) break;
    }
    return out;
  };
  // north-west edge: beside the North Gate stair, round the Bay Tent corner, to the pavilion
  pEdge(pseq(P(2.3, 14.35), [NGATE.x1, NGATE.zTop + 0.0]).reverse());
  // west of the pavilion to the West Gate (opening 7 m wide where the city deck lands)
  const wg = H(89.1, 3.4);
  const wgIn = H(84.3, 12.5);
  const wgDir = unit2(wg, wgIn);
  const gateEnd = [wg[0] + wgDir[0] * 7.0, wg[1] + wgDir[1] * 7.0];
  pEdge([P(27.0, 13.9), H(58.5, 20.5), H(68.1, 24.2), H(84.3, 12.5), gateEnd]);
  // (K Tower side of the West Gate: stair head, see stairs.js)
  // south side: terraces along the towers
  // (gaps: head of the South Gate slope at a 26-28.5, the South lift at a 45.4-49.1)
  pEdge([H(4.2, -38.7), H(25.9, -38.7)]);
  bag.add(fascia, edgeWall(H(25.9, -38.7), H(28.5, -38.7), Y_PLAZA - FASCIA, Y_PLAZA, 0.35, pr));
  pEdge([H(44.0, -35.3), H(45.4, -35.3)]);
  bag.add(fascia, edgeWall(H(45.4, -35.3), H(49.1, -35.3), Y_PLAZA - FASCIA, Y_PLAZA, 0.35, pr));
  pEdge([H(49.1, -35.3), H(52.8, -35.3), H(52.8, -37.5), H(62.7, -37.5), H(62.7, -39.8), H(102, -39.8), H(102, KTOWER.b0)]);

  // paving bands of the plaza: Hilton grid, running north from the piers and across
  const pb = new Tris();
  const yP = Y_PLAZA + 0.004;
  for (let a = 0; a <= 101; a += HILTON.bay) clippedStrips(pb, H(a, 0), [HF.vx, HF.vz], pr, PLAZA_HOLES, 0.6, yP, { tMin: -39, tMax: 60 });
  for (const b of [6.0, 13.8, 21.6]) clippedStrips(pb, H(0, b), [HF.ux, HF.uz], pr, PLAZA_HOLES, 0.6, yP, { tMin: -2, tMax: 95 });
  // bands parallel to the Big Steps on the Music Terrace Stage side
  for (const z of [STEPS.zTop + STEPS.depth + 1.2, 131.5, 139.0, 146.5]) clippedStrips(pb, [0, z], [1, 0], pr, PLAZA_HOLES, 0.6, yP, { tMin: 1.5, tMax: 52 });
  bag.add(M('precinct.paverBand'), pb.build());
  const pt = new Tris();
  {
    const a = [(NGATE.x0 + NGATE.x1) / 2, NGATE.zTop - 0.6];
    strip(pt, a, [0, -1], 0, a[1] - (STEPS.zTop + STEPS.depth) - 0.4, 0.3, yP + 0.004);
    const b = H(86.5, 6.5);
    const c = H(35, 3.0);
    strip(pt, b, unit2(b, c), 0, dist2(b, c), 0.3, yP + 0.004); // West Gate → pilotis passage
    strip(pt, H(35, 3.0), [-HF.vx, -HF.vz], 0, 36, 0.3, yP + 0.004); // through the passage to the South Gate
    const d = [22, 118.5];
    strip(pt, c, unit2(c, d), 0, dist2(c, d), 0.3, yP + 0.004);
  }
  bag.add(M('precinct.tactile'), pt.build());

  // ============================== SLOPES ==============================
  buildNorthRamp(bag, rails);
  buildEastRamp(bag, rails);

  // ============================== PODIUM, STRUCTURE, YARD ==============================
  buildPodium(bag, ctx);
  buildUnderDeck(bag, high);
}

function lerpIn(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
/** Move a point slightly into a ring (keeps edge beams clear of the neighbour's wall planes). */
function nudge(p, ring, d) {
  let cx = 0;
  let cz = 0;
  for (const q of ring) {
    cx += q[0];
    cz += q[1];
  }
  cx /= ring.length;
  cz /= ring.length;
  const l = Math.hypot(cx - p[0], cz - p[1]) || 1;
  return [p[0] + ((cx - p[0]) / l) * d, p[1] + ((cz - p[1]) / l) * d];
}

function buildNorthRamp(bag, rails) {
  const r = NRAMP;
  const t = new Tris();
  const w = new Tris();
  const n = r.innerPts.length;
  for (let i = 0; i < n - 1; i++) {
    const a = r.innerPts[i];
    const b = r.innerPts[i + 1];
    const c = r.outerPts[i + 1];
    const d = r.outerPts[i];
    t.quad([a[0], r.ys[i], a[1]], [b[0], r.ys[i + 1], b[1]], [c[0], r.ys[i + 1], c[1]], [d[0], r.ys[i], d[1]], [0, 1, 0]);
  }
  bag.add(M('precinct.paver'), t.build(), 3);
  // outer parapet: white concrete from the ground up to 0.3 m above the slope, railing on top
  const nrm = [r.normals[0], r.normals[1], r.normals[1]];
  const out2 = r.outerPts.map((p, i) => {
    const nn = i === 0 ? r.normals[0] : i === 1 ? mitre(r.normals[0], r.normals[1]) : r.normals[1];
    return [p[0] + nn[0] * 0.3, p[1] + nn[1] * 0.3];
  });
  for (let i = 0; i < n - 1; i++) {
    const a = r.outerPts[i];
    const b = r.outerPts[i + 1];
    const a2 = out2[i];
    const b2 = out2[i + 1];
    const ya = r.ys[i] + 0.3;
    const yb = r.ys[i + 1] + 0.3;
    const nn = nrm[i];
    w.quad([a2[0], 0, a2[1]], [b2[0], 0, b2[1]], [b2[0], yb, b2[1]], [a2[0], ya, a2[1]], [nn[0], 0, nn[1]]);
    w.quad([a[0], ya, a[1]], [b[0], yb, b[1]], [b2[0], yb, b2[1]], [a2[0], ya, a2[1]], [0, 1, 0]);
    w.quad([a[0], r.ys[i] - 0.4, a[1]], [b[0], r.ys[i + 1] - 0.4, b[1]], [b[0], yb, b[1]], [a[0], ya, a[1]], [-nn[0], 0, -nn[1]]);
  }
  // end faces at the foot (toward the landing) and at the jog
  {
    const a = r.outerPts[0];
    const a2 = out2[0];
    w.quad([a[0], 0, a[1]], [a2[0], 0, a2[1]], [a2[0], r.ys[0] + 0.3, a2[1]], [a[0], r.ys[0] + 0.3, a[1]], [1, 0, 0]);
    const b = r.outerPts[n - 1];
    const b2 = out2[n - 1];
    const d = FACET_L.d;
    w.quad([b[0], 0, b[1]], [b2[0], 0, b2[1]], [b2[0], Y_DECK + 0.3, b2[1]], [b[0], Y_DECK + 0.3, b[1]], [d[0], 0, d[1]]);
  }
  bag.add(M('precinct.podiumWall'), w.build(), 1);
  const mids = r.outerPts.map((p, i) => [(p[0] + out2[i][0]) / 2, r.ys[i] + 0.3, (p[1] + out2[i][1]) / 2]);
  rails.run(mids, { h: 0.85, level: 3 });
  // handrail on the deck side of the slope
  rails.run(r.innerPts.map((p, i) => [p[0], r.ys[i], p[1]]), { h: 0.9, level: 3, handrail: true, post: 1.5 });
}
function mitre(n0, n1) {
  const k = 1 / (1 + n0[0] * n1[0] + n0[1] * n1[1]);
  return [(n0[0] + n1[0]) * k, (n0[1] + n1[1]) * k];
}

function buildEastRamp(bag, rails) {
  // 2.6 m wide slope between the hotel's east face and the Arena Deck edge wall
  const t = new Tris();
  const bs = [RAMP_E.bFoot, ERAMP.b1, RAMP_E.bTop];
  for (let i = 0; i < bs.length - 1; i++) {
    const a = H(RAMP_E.a0, bs[i]);
    const b = H(RAMP_E.a0, bs[i + 1]);
    const c = H(RAMP_E.a1 + 0.2, bs[i + 1]);
    const d = H(RAMP_E.a1 + 0.2, bs[i]);
    t.quad([a[0], ERAMP.yAt(bs[i]), a[1]], [b[0], ERAMP.yAt(bs[i + 1]), b[1]], [c[0], ERAMP.yAt(bs[i + 1]), c[1]], [d[0], ERAMP.yAt(bs[i]), d[1]], [0, 1, 0]);
  }
  bag.add(M('precinct.paver'), t.build(), 3);
  // wall-mounted handrail on the hotel side
  rails.run([H(-0.35, RAMP_E.bFoot - 0.3), H(-0.35, ERAMP.b1)].map((p, i) => [p[0], i === 0 ? Y_PLAZA : Y_DECK, p[1]]), { h: 0.9, level: 3, handrail: true, post: 2.0 });
  // structure below the slope (closes the gap between the deck and the hotel podium)
  const s = new Tris();
  const a = H(RAMP_E.wallA, RAMP_E.bFoot);
  const b = H(RAMP_E.wallA, RAMP_E.bTop);
  const c = H(0, RAMP_E.bTop);
  const d = H(0, RAMP_E.bFoot);
  s.quad([a[0], Y_PLAZA - SLAB, a[1]], [b[0], Y_PLAZA - SLAB, b[1]], [c[0], Y_PLAZA - SLAB, c[1]], [d[0], Y_PLAZA - SLAB, d[1]], [0, -1, 0]);
  bag.add(M('precinct.deckSoffit'), s.build(), 1);
}

// White vertically ribbed podium wall below the free edges on the north side, brick and
// glazed fronts below the plaza edge, P1 parking entrance, service openings.
function buildPodium(bag, ctx) {
  const wallM = M('precinct.podiumWall');
  const recess = M('precinct.podiumRecess');
  const yTop = Y_DECK - FASCIA;
  // --- house-left diagonal: from the North lift to the prow --------------------------------
  // facet-aligned frame: a = along the facet (t), b = outward offset from the eave edge
  const fl = frame(FACET_L.c[0], FACET_L.c[1], FACET_L.d[0], FACET_L.d[1]);
  // frame v must point outward: v = (−uz, ux); for FACET_L.d that is the INWARD normal, so b = −off.
  const L = (g) => place(g, fl);
  const off = DECK_OFF_L - 0.25; // outer face of the podium wall
  const b0 = -off;
  const b1 = -(off - 0.3);
  const tA = JOG_T + LIFT_N.len;
  const tB = 46.5;
  const p1 = [22.0, 29.0]; // P1 parking entrance (OSM node on the north facade), 7 m wide
  const hOpen = 3.1;
  // lower wall, set back 0.6 m, dark blue-grey with openings; upper white ribbed band
  const band0 = 3.6; // foot of the projecting white upper band
  bag.add(wallM, L(lbox(tA, tB, band0, yTop, b0, b1)), 1);
  bag.add(recess, L(lbox(tA, p1[0], 0, band0, b0 + 0.6, b1 + 0.6)), 1);
  bag.add(recess, L(lbox(p1[1], tB, 0, band0, b0 + 0.6, b1 + 0.6)), 1);
  bag.add(recess, L(lbox(p1[0], p1[1], hOpen, band0, b0 + 0.6, b1 + 0.6)), 1);
  // planter ledge on top of the set-back
  bag.add(M('precinct.concrete'), L(lbox(tA, tB, band0 - 0.25, band0, b0 - 0.05, b0 + 0.9)), 1);
  bag.add(M('precinct.planting'), L(lbox(tA + 0.3, p1[0] - 0.4, band0, band0 + 0.45, b0 + 0.05, b0 + 0.55)), 1);
  bag.add(M('precinct.planting'), L(lbox(p1[1] + 0.4, tB - 0.3, band0, band0 + 0.45, b0 + 0.05, b0 + 0.55)), 1);
  // P1 portal: jambs, dark soffit and a lit "P" lane inside
  bag.add(M('precinct.concrete'), L(lbox(p1[0] - 0.45, p1[0], 0, band0 - 0.25, b0 - 0.05, b1 + 0.6)), 1);
  bag.add(M('precinct.concrete'), L(lbox(p1[1], p1[1] + 0.45, 0, band0 - 0.25, b0 - 0.05, b1 + 0.6)), 1);
  bag.add(E('precinct.yardLight'), L(lbox(p1[0] + 0.6, p1[1] - 0.6, band0 - 0.34, band0 - 0.26, b0 + 1.2, b0 + 1.5)), 1);
  // row of square service windows in the white band (official night photo)
  for (let t = tA + 2.2; t < tB - 2; t += 3.05) bag.add(M('precinct.shopGlass'), L(lbox(t, t + 1.5, band0 + 0.7, band0 + 1.9, b0 - 0.02, b0 + 0.1)), 1);

  // --- prow (East Gate) and the end on the flank ---------------------------------------------
  const prow = [FACET_L.at(tB, DECK_OFF_L), ...PROW.slice(1), DECK_FL];
  const inset = (pts, d) => pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const u = unit2(a, b);
    // the deck lies to the right of travel here (clockwise round the tip seen from above)
    let n = [-u[1], u[0]];
    if (!pointInRing(p[0] + n[0] * 0.6, p[1] + n[1] * 0.6, ARENA_DECK_RING)) n = [-n[0], -n[1]];
    return [p[0] + n[0] * d, p[1] + n[1] * d];
  });
  const pOut = inset(prow, 0.25);
  const pIn = inset(prow, 0.55);
  const pw = new Tris();
  for (let i = 0; i < pOut.length - 1; i++) {
    const a = pOut[i];
    const b = pOut[i + 1];
    const n = [a[0] - pIn[i][0], 0, a[1] - pIn[i][1]];
    pw.quad([a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], yTop, b[1]], [a[0], yTop, a[1]], n);
  }
  bag.add(wallM, pw.build(), 1);

  // --- wall under the Arena Deck edge facing the North Gate garden (jog) ------------------
  bag.add(wallM, L(lbox(JOG_T - 0.3, JOG_T, 0, yTop, -(DECK_OFF_L - 0.25), -(0.2 + NGATE.rampW + 0.3))), 1);

  // --- lower plaza: brick wall beside the North Gate stair, glazed front under the Bay Tent ---
  const brick = M('precinct.brick');
  const yP = Y_PLAZA - FASCIA;
  const q0 = [NGATE.x1, NGATE.zTop];
  const q1 = [NGATE.x1, 141.0];
  const q2 = PLAZA_RING[PLAZA_RING.findIndex((p) => Math.abs(p[0] - NGATE.x1) < 1e-6 && Math.abs(p[1] - 141.0) < 1e-6) - 1];
  bag.add(brick, edgeWall(q0, q1, 0, yP, 0.3, PLAZA_RING).translate(0.28, 0, 0), 1);
  bag.add(brick, shifted(edgeWall(q1, q2, 0, yP, 0.3, PLAZA_RING), q1, q2, 0.28), 1);
  const q3 = PLAZA_RING[PLAZA_RING.findIndex((p) => p === q2) - 1];
  // showroom front: dark glass in a black frame under a white beam, with slim white posts
  bag.add(M('precinct.shopGlass'), shifted(edgeWall(q2, q3, 0.15, yP, 0.12, PLAZA_RING), q2, q3, 0.5), 1);
  const dq = unit2(q2, q3);
  const lq = dist2(q2, q3);
  for (let s = 0; s <= lq + 0.01; s += lq / 5) {
    const p = [q2[0] + dq[0] * s, q2[1] + dq[1] * s];
    const inn = edgeInward(q2, q3, PLAZA_RING);
    bag.add(M('precinct.darkMetal'), box(p[0] + inn[0] * 0.5, (0.15 + yP) / 2, p[1] + inn[1] * 0.5, 0.12, yP - 0.15, 0.2, Math.atan2(-dq[1], dq[0])), 1);
  }
  // remaining plaza edges stand on slim round columns (hotel porte cochère below)
  const colM = M('precinct.deckFascia');
  const openEdges = [
    [q3, PLAZA_RING[PLAZA_RING.findIndex((p) => p === q3) - 1]],
    [P(27.0, 13.9), H(58.5, 20.5)],
    [H(58.5, 20.5), H(68.1, 24.2)],
    [H(68.1, 24.2), H(84.3, 12.5)],
  ];
  for (const [a, b] of openEdges) {
    const l = dist2(a, b);
    const d = unit2(a, b);
    const inn = edgeInward(a, b, PLAZA_RING);
    const nCol = Math.max(1, Math.round(l / 6.5));
    for (let k = 0; k <= nCol; k++) {
      const s = 0.8 + ((l - 1.6) * k) / nCol;
      bag.add(colM, cylinder(a[0] + d[0] * s + inn[0] * 0.7, a[1] + d[1] * s + inn[1] * 0.7, 0, yP, 0.3, 12), 1);
    }
  }
}
function edgeInward(a, b, ring) {
  const d = unit2(a, b);
  let n = [-d[1], d[0]];
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  if (!pointInRing(mid[0] + n[0] * 0.25, mid[1] + n[1] * 0.25, ring)) n = [-n[0], -n[1]];
  return n;
}
function shifted(g, a, b, d) {
  const n = edgeInward(a, b, PLAZA_RING);
  return g.translate(n[0] * d, 0, n[1] * d);
}

// Columns and beams under the decks, yard paving, parking bays.
function buildUnderDeck(bag, high) {
  const colM = M('precinct.deckColumn');
  const beamM = M('precinct.deckSoffit');
  const grid = (ring, holes, f, pitchA, pitchB, yTop, extent, skip = () => false) => {
    const pts = [];
    for (let a = extent[0]; a <= extent[1]; a += pitchA) {
      for (let b = extent[2]; b <= extent[3]; b += pitchB) {
        const [x, z] = [f.ox + a * f.ux + b * f.vx, f.oz + a * f.uz + b * f.vz];
        if (!pointInRing(x, z, ring)) continue;
        if (holes.some((h) => pointInRing(x, z, h))) continue;
        if (distToRing(x, z, ring) < 1.3) continue;
        if (skip(x, z)) continue;
        pts.push([x, z, a, b]);
      }
    }
    for (const [x, z] of pts) bag.add(colM, box(x, yTop / 2, z, 0.8, yTop, 0.8, f.rotY), 1);
    if (!high) return;
    // downstand beams between neighbouring grid points
    const key = (a, b) => `${Math.round(a * 10)}|${Math.round(b * 10)}`;
    const set = new Map(pts.map((p) => [key(p[2], p[3]), p]));
    for (const p of pts) {
      for (const [da, db] of [[pitchA, 0], [0, pitchB]]) {
        const q = set.get(key(p[2] + da, p[3] + db));
        if (!q) continue;
        const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
        bag.add(beamM, box((p[0] + q[0]) / 2, yTop - 0.4, (p[1] + q[1]) / 2, len, 0.8, 0.5, Math.atan2(-(q[1] - p[1]), q[0] - p[0])), 1);
      }
    }
  };
  const yA = Y_DECK - SLAB;
  // Arena Deck: the 24 building columns carry the inner zone; extra deck columns outside the eave
  const fc = frame(0, 103.76, 1, 0);
  grid(ARENA_DECK_RING, [], fc, 8.54, 7.0, yA, [-38.43 - 8.54 * 6, 60, 2.6, 30]);
  const fL = frame(FACET_L.c[0], FACET_L.c[1], FACET_L.d[0], FACET_L.d[1]);
  grid(ARENA_DECK_RING, [], fL, 8.0, 5.0, yA, [facetColumnT(1) - 8, 70, -6.0, -1.0]);
  const fR = frame(FACET_R.c[0], FACET_R.c[1], FACET_R.d[0], FACET_R.d[1]);
  grid(ARENA_DECK_RING, [], fR, 8.0, 5.0, yA, [facetColumnT(1), 62, 1.2, 6.5]);
  // lower plaza on the Hilton grid
  grid(PLAZA_RING, PLAZA_HOLES, HF, HILTON.bay, 7.8, Y_PLAZA - SLAB, [-3.9, 105, -39, 70]);

  // --- ground: paving of the Music Terrace site, asphalt yard under the decks, bay lines ---
  bag.add(M('precinct.groundPaving'), prism(SITE_RING, 0.0, 0.05, { holes: [L3_WALL_RING], bottom: false }), 1);
  const yard = prism(ARENA_DECK_RING, 0.05, 0.062, { bottom: false, sides: false });
  bag.add(M('precinct.yardAsphalt'), yard, 1);
  bag.add(M('precinct.yardAsphalt'), prism(PLAZA_RING, 0.05, 0.062, { holes: PLAZA_HOLES, bottom: false, sides: false }), 1);
  const lines = new Tris();
  const yL = 0.07;
  // parking bays (P1) under the house-left diagonal and in front of the main facet
  const bays = (f, t0, t1, off0, off1) => {
    for (let t = t0; t <= t1 + 0.01; t += 2.5) strip(lines, f.at(t, off0), f.n, 0, off1 - off0, 0.12, yL);
    strip(lines, f.at(t0, off0), f.d, 0, t1 - t0, 0.12, yL);
  };
  bays(FACET_L, 31, 43.5, 1.5, 6.5);
  bays(FACET_L, 0, 17.5, 1.5, 6.5);
  bays(FACET_L, 12, 44.5, -8.0, -3.0);
  bays(FACET_R, 12, 49.5, -8.0, -3.0);
  for (let x = -35; x <= 37.5; x += 2.5) strip(lines, [x, 97.5], [0, 1], 0, 5, 0.12, yL);
  strip(lines, [-35, 97.5], [1, 0], 0, 72.5, 0.12, yL);
  bag.add(M('precinct.yardLine'), lines.build(), 1);
  // soffit lights of the yard (warm lines visible through the P1 entrance at night)
  for (const f of [FACET_L, FACET_R]) {
    for (let t = 14; t <= 54; t += 8) {
      const p = f.at(t, -4.5);
      bag.add(E('precinct.yardLight'), box(p[0], yA - 0.06, p[1], 1.2, 0.05, 0.12, Math.atan2(-f.d[1], f.d[0])), 1);
    }
  }
  for (let x = -30; x <= 30; x += 8.54) bag.add(E('precinct.yardLight'), box(x, yA - 0.06, 100, 1.2, 0.05, 0.12), 1);
}

// Big Steps, the North / South / West / East Gate stairs and slopes, and the brick lift towers.
import { prism, box } from '../../core/geom.js';
import { M, E } from './mats.js';
import { Tris, frame, lbox, offsetPolyline, stairBand, stairProfile, toW, unit2, Bag, band } from './kit.js';
import {
  DECK_FL, DECK_OFF_L, FACET_L, H, HF, HILTON, JOG_T, KTOWER, LIFT_E, LIFT_N, LIFT_S, LIFT_W, NGATE, PROW, SOUTH, STEPS, WEST, Y_DECK, Y_PLAZA, NORTH, EAST,
} from './layout.js';
import { SLAB, KERB } from './decks.js';

/** Rail along a stair: plan line from top nosing point `p` going along unit `d`, using a profile. */
function stairRail(rails, p, d, profile, opts = {}) {
  rails.run(profile.pts.map(([s, y]) => [p[0] + d[0] * s, y, p[1] + d[1] * s]), { h: 0.95, ...opts });
}

export function buildStairs(bag, rails, ctx) {
  bigSteps(bag, rails);
  northGate(bag, rails);
  southGate(bag, rails);
  westGate(bag, rails);
  eastGate(bag, rails);
  liftTowers(bag, ctx);
}

// --- Big Steps: reddish-brown, 15 risers with a mid landing, two legs with a mitred bend -------
function bigSteps(bag, rails) {
  const prof = { yTop: Y_DECK, n: STEPS.n, r: STEPS.r, t: STEPS.t, landings: STEPS.landings };
  const s = stairBand(STEPS.top, STEPS.normals, { ...prof, nosing: 0.06 });
  const stone = M('precinct.bigSteps');
  bag.add(stone, s.treads, 3);
  bag.add(stone, s.risers, 3);
  bag.add(M('precinct.bigStepsNosing'), s.nosings, 3);
  // warm LED line under each nosing (night)
  const led = new Tris();
  for (const { line, y } of s.lines) {
    for (let i = 0; i < line.length - 1; i++) {
      const n = STEPS.normals[i];
      const a = [line[i][0] + n[0] * 0.006, line[i][1] + n[1] * 0.006];
      const b = [line[i + 1][0] + n[0] * 0.006, line[i + 1][1] + n[1] * 0.006];
      led.quad([a[0], y - 0.045, a[1]], [b[0], y - 0.045, b[1]], [b[0], y - 0.02, b[1]], [a[0], y - 0.02, a[1]], [n[0], 0, n[1]]);
    }
  }
  const ledGeom = led.build();
  bag.add(E('precinct.stepLight'), ledGeom, 3);
  // closure under the steps (seen from the yard)
  const foot = offsetPolyline(STEPS.top, STEPS.normals, STEPS.depth);
  bag.add(M('precinct.deckSoffit'), prism([...STEPS.top, ...foot.slice().reverse()], Y_PLAZA - SLAB, Y_PLAZA - SLAB + 0.02, { top: false, sides: false }), 1);

  // cheek wall at the north end with the red zig-zag rail on top (see furniture.js for the rail)
  const w = new Tris();
  const p0 = STEPS.top[0];
  const pp = stairProfile(prof);
  const x = p0[0];
  for (let i = 0; i < pp.pts.length - 1; i++) {
    const [s0, y0] = pp.pts[i];
    const [s1, y1] = pp.pts[i + 1];
    for (const [xa, nx] of [[x, 1], [x - 0.4, -1]]) {
      w.quad([xa, Y_PLAZA - 0.3, p0[1] + s0], [xa, Y_PLAZA - 0.3, p0[1] + s1], [xa, y1 + 0.25, p0[1] + s1], [xa, y0 + 0.25, p0[1] + s0], [nx, 0, 0]);
    }
    w.quad([x, y0 + 0.25, p0[1] + s0], [x, y1 + 0.25, p0[1] + s1], [x - 0.4, y1 + 0.25, p0[1] + s1], [x - 0.4, y0 + 0.25, p0[1] + s0], [0, 1, 0]);
  }
  bag.add(M('precinct.concrete'), w.build(), 3);

  // black handrails across the wide flight (photos T6, B8): one every ~10 m on leg 1, one on leg 2
  for (const xr of [11, 21, 31, 41]) stairRail(rails, [xr, STEPS.zTop], [0, 1], pp, { level: 3, handrail: true, post: 1.2 });
  const m2 = [(STEPS.top[1][0] + STEPS.top[2][0]) / 2, (STEPS.top[1][1] + STEPS.top[2][1]) / 2];
  stairRail(rails, m2, WEST, pp, { level: 3, handrail: true, post: 1.2 });
  // south end of leg 2: cheek wall
  const e = STEPS.top[2];
  const c = new Tris();
  for (let i = 0; i < pp.pts.length - 1; i++) {
    const [s0, y0] = pp.pts[i];
    const [s1, y1] = pp.pts[i + 1];
    const a = [e[0] + WEST[0] * s0, e[1] + WEST[1] * s0];
    const b = [e[0] + WEST[0] * s1, e[1] + WEST[1] * s1];
    const a2 = [a[0] + SOUTH[0] * 0.35, a[1] + SOUTH[1] * 0.35];
    const b2 = [b[0] + SOUTH[0] * 0.35, b[1] + SOUTH[1] * 0.35];
    c.quad([a2[0], Y_PLAZA - 0.3, a2[1]], [b2[0], Y_PLAZA - 0.3, b2[1]], [b2[0], y1 + 0.25, b2[1]], [a2[0], y0 + 0.25, a2[1]], [SOUTH[0], 0, SOUTH[1]]);
    c.quad([a[0], y0 + 0.25, a[1]], [b[0], y1 + 0.25, b[1]], [b2[0], y1 + 0.25, b2[1]], [a2[0], y0 + 0.25, a2[1]], [0, 1, 0]);
    c.quad([a[0], Y_PLAZA - 0.3, a[1]], [b[0], Y_PLAZA - 0.3, b[1]], [b[0], y1 + 0.25, b[1]], [a[0], y0 + 0.25, a[1]], [NORTH[0], 0, NORTH[1]]);
  }
  {
    const [s1, y1] = pp.pts[pp.pts.length - 1];
    const b = [e[0] + WEST[0] * s1, e[1] + WEST[1] * s1];
    const b2 = [b[0] + SOUTH[0] * 0.35, b[1] + SOUTH[1] * 0.35];
    c.quad([b[0], Y_PLAZA - 0.3, b[1]], [b2[0], Y_PLAZA - 0.3, b2[1]], [b2[0], y1 + 0.25, b2[1]], [b[0], y1 + 0.25, b[1]], [WEST[0], 0, WEST[1]]);
  }
  bag.add(M('precinct.concrete'), c.build(), 3);
}

// --- North Gate: pale granite stair from the plaza level down to the street -------------------
function northGate(bag, rails) {
  const g = NGATE;
  const prof = { yTop: Y_PLAZA, n: g.n, r: g.r, t: g.t, landings: { 16: g.landing } };
  const s = stairBand([[g.x0, g.zTop], [g.x1, g.zTop]], [[0, 1]], { ...prof, nosing: 0.05 });
  const granite = M('precinct.granite');
  bag.add(granite, s.treads);
  bag.add(granite, s.risers);
  bag.add(M('precinct.graniteNosing'), s.nosings);
  const pp = stairProfile(prof);
  // left stringer: white concrete wall with railing; right side: brick wall of the plaza
  const w = new Tris();
  const side = (x0, x1) => {
    for (let i = 0; i < pp.pts.length - 1; i++) {
      const [s0, y0] = pp.pts[i];
      const [s1, y1] = pp.pts[i + 1];
      const za = g.zTop + s0;
      const zb = g.zTop + s1;
      w.quad([x0, 0, za], [x0, 0, zb], [x0, y1 + 0.3, zb], [x0, y0 + 0.3, za], [-1, 0, 0]);
      w.quad([x1, 0, za], [x1, 0, zb], [x1, y1 + 0.3, zb], [x1, y0 + 0.3, za], [1, 0, 0]);
      w.quad([x0, y0 + 0.3, za], [x0, y1 + 0.3, zb], [x1, y1 + 0.3, zb], [x1, y0 + 0.3, za], [0, 1, 0]);
    }
    const zf = g.zTop + pp.pts[pp.pts.length - 1][0];
    w.quad([x0, 0, zf], [x1, 0, zf], [x1, 0.3, zf], [x0, 0.3, zf], [0, 0, 1]);
  };
  side(g.x0 - 0.4, g.x0);
  bag.add(M('precinct.concrete'), w.build());
  rails.run(pp.pts.map(([d, y]) => [g.x0 - 0.2, y + 0.3, g.zTop + d]), { h: 0.8 });
  // landing notch wall (x from the steps' north end to the stair) and its railing toward the garden
  bag.add(M('precinct.concrete'), box((STEPS.xNorth + g.x0) / 2, (Y_PLAZA + KERB) / 2, 126.8 + 0.17, g.x0 - STEPS.xNorth + 0.4, Y_PLAZA + KERB, 0.35));
  bag.add(M('precinct.concrete'), box(g.x0 - 0.2, (Y_PLAZA + KERB) / 2, (g.zTop + 126.8) / 2 + 0.2, 0.4, Y_PLAZA + KERB, 126.8 - g.zTop + 0.4));
  rails.run([[STEPS.xNorth + 0.2 + 2.6, Y_PLAZA + KERB, 126.97], [g.x0 - 0.2, Y_PLAZA + KERB, 126.97]], { h: 1.0 });
  // central and intermediate handrails (photo B8 shows four lines)
  for (const x of [g.x0 + 3.2, g.x0 + 6.4, g.x0 + 9.6, g.x0 + 12.8]) rails.run(pp.pts.map(([d, y]) => [x, y, g.zTop + d]), { h: 0.95, handrail: true, post: 1.3 });
  rails.run(pp.pts.map(([d, y]) => [g.x1 - 0.25, y, g.zTop + d]), { h: 0.95, handrail: true, post: 1.3 });
  // solid base under the flights (toilets are behind the white wall at ground level)
  const zf = g.zTop + pp.depth;
  bag.add(M('precinct.concrete'), box((g.x0 + g.x1) / 2, 0.02, (g.zTop + zf) / 2, g.x1 - g.x0, 0.04, zf - g.zTop), 1);
  // door of the ground-floor toilets in the stringer wall (photo B8)
  bag.add(M('precinct.darkMetal'), box(g.x0 - 0.42, 1.1, g.zTop + 2.4, 0.06, 2.2, 1.4), 1);

  // pale granite forecourt with a dark diagonal joint grid between the stair foot and the sidewalk
  const fx0 = g.x0 - 6;
  const fx1 = g.x1 + 9;
  const fz0 = zf;
  const fz1 = zf + 8.2;
  const ring = [[fx0, fz0 - 6], [g.x0 - 0.4, fz0 - 6], [g.x0 - 0.4, fz0], [fx1 - 9, fz0], [fx1, fz0 + 4], [fx1, fz1 + 3.5], [fx0, fz1 - 4]];
  bag.add(M('precinct.forecourt'), prism(ring, 0.05, 0.09, { bottom: false }), 1);
  const grid = new Tris();
  const clip = (p, d) => {
    // crossings with the forecourt ring
    const ts = [];
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      const ex = b[0] - a[0];
      const ez = b[1] - a[1];
      const den = d[0] * ez - d[1] * ex;
      if (Math.abs(den) < 1e-9) continue;
      const t = ((a[0] - p[0]) * ez - (a[1] - p[1]) * ex) / den;
      const u = ((a[0] - p[0]) * d[1] - (a[1] - p[1]) * d[0]) / den;
      if (u >= 0 && u < 1) ts.push(t);
    }
    ts.sort((x, y) => x - y);
    for (let i = 0; i + 1 < ts.length; i += 2) {
      const a = [p[0] + d[0] * ts[i], p[1] + d[1] * ts[i]];
      const b = [p[0] + d[0] * ts[i + 1], p[1] + d[1] * ts[i + 1]];
      const nx = -d[1] * 0.035;
      const nz = d[0] * 0.035;
      grid.quad([a[0] + nx, 0.094, a[1] + nz], [b[0] + nx, 0.094, b[1] + nz], [b[0] - nx, 0.094, b[1] - nz], [a[0] - nx, 0.094, a[1] - nz], [0, 1, 0]);
    }
  };
  const d1 = [Math.SQRT1_2, Math.SQRT1_2];
  const d2 = [Math.SQRT1_2, -Math.SQRT1_2];
  for (let k = -40; k <= 40; k++) {
    clip([(fx0 + fx1) / 2 + k * 1.2 * Math.SQRT2, fz0], d1);
    clip([(fx0 + fx1) / 2 + k * 1.2 * Math.SQRT2, fz0], d2);
  }
  bag.add(M('precinct.forecourtGrid'), grid.build(), 1);

  // garden between the podium wall and the sidewalk (house-left of the stair)
  const gz = (x) => 127.3 + 0.0 * x;
  const bed = [[g.x0 - 0.5, gz(0)], [g.x0 - 0.5, fz0 - 6.2], [fx0 - 0.2, fz0 - 6.2], [fx0 - 0.2, fz1 - 4.3], [-14, 133.4], ...gardenEdge()];
  bag.add(M('precinct.planting'), prism(bed, 0.05, 0.38, { bottom: false }), 1);
}
/** Outer edge of the planted strip along the north ramp's podium wall (toward the house-left side). */
function gardenEdge() {
  const a = FACET_L.at(JOG_T - 0.4, DECK_OFF_L + 5.5);
  const b = FACET_L.at(JOG_T - 0.4, 0.2 + NGATE.rampW + 0.7);
  const c = FACET_L.at(-36.2, 0.2 + NGATE.rampW + 0.7);
  return [a, b, [c[0] + 0.2, 127.5]];
}

// --- South Gate: stair in front of the hotel's portal, switchback slope, small stair to the Arena Deck ---
function southGate(bag, rails) {
  const L = new Bag();
  const granite = M('precinct.granite');
  const a0 = 28.5;
  const a1 = 44.0;
  const bTop = -35.3;
  const n = 32;
  const r = Y_PLAZA / n;
  const prof = { yTop: Y_PLAZA, n, r, t: 0.3, landings: { 16: 2.0 } };
  const top = [toW(HF, a0, bTop), toW(HF, a1, bTop)];
  const s = stairBand(top, [SOUTH], { ...prof, nosing: 0.05 });
  bag.add(granite, s.treads);
  bag.add(granite, s.risers);
  bag.add(M('precinct.graniteNosing'), s.nosings);
  const pp = stairProfile(prof);
  for (const a of [a0 + 0.2, a0 + 3.9, a0 + 7.75, a0 + 11.6, a1 - 0.2]) {
    const p = toW(HF, a, bTop);
    rails.run(pp.pts.map(([d, y]) => [p[0] + SOUTH[0] * d, y, p[1] + SOUTH[1] * d]), { h: 0.95, handrail: true, post: 1.3 });
  }
  // cheek walls
  const cheek = (a) => {
    const w = new Tris();
    for (let i = 0; i < pp.pts.length - 1; i++) {
      const [s0, y0] = pp.pts[i];
      const [s1, y1] = pp.pts[i + 1];
      for (const da of [0, 0.35]) {
        const p = toW(HF, a + da, bTop - s0);
        const q = toW(HF, a + da, bTop - s1);
        w.quad([p[0], 0, p[1]], [q[0], 0, q[1]], [q[0], y1 + 0.2, q[1]], [p[0], y0 + 0.2, p[1]], [da ? WEST[0] : EAST[0], 0, da ? WEST[1] : EAST[1]]);
      }
      const p = toW(HF, a, bTop - s0);
      const q = toW(HF, a, bTop - s1);
      const p2 = toW(HF, a + 0.35, bTop - s0);
      const q2 = toW(HF, a + 0.35, bTop - s1);
      w.quad([p[0], y0 + 0.2, p[1]], [q[0], y1 + 0.2, q[1]], [q2[0], y1 + 0.2, q2[1]], [p2[0], y0 + 0.2, p2[1]], [0, 1, 0]);
    }
    bag.add(M('precinct.concrete'), w.build());
  };
  cheek(a0 - 0.35);
  cheek(a1);

  // switchback slope south of the hotel's east block (two runs at about 1:11)
  const ramp = new Tris();
  const walls = M('precinct.concrete');
  const lanes = [
    { b0: -41.3, b1: -38.9, aFrom: 26.0, aTo: 1.0, yFrom: Y_PLAZA, yTo: Y_PLAZA / 2 },
    { b0: -44.2, b1: -41.8, aFrom: 1.0, aTo: 28.5, yFrom: Y_PLAZA / 2, yTo: 0.05 },
  ];
  for (const ln of lanes) {
    const p = (a, b) => toW(HF, a, b);
    const A = p(ln.aFrom, ln.b0);
    const B = p(ln.aTo, ln.b0);
    const C = p(ln.aTo, ln.b1);
    const D = p(ln.aFrom, ln.b1);
    ramp.quad([A[0], ln.yFrom, A[1]], [B[0], ln.yTo, B[1]], [C[0], ln.yTo, C[1]], [D[0], ln.yFrom, D[1]], [0, 1, 0]);
    // side walls down to the ground with a low upstand, rails on both sides
    for (const [b, db] of [[ln.b0, -0.25], [ln.b1, 0.25]]) {
      const w = new Tris();
      const P0 = p(ln.aFrom, b);
      const P1 = p(ln.aTo, b);
      const Q0 = p(ln.aFrom, b + db);
      const Q1 = p(ln.aTo, b + db);
      const nrm = db < 0 ? SOUTH : NORTH;
      w.quad([Q0[0], 0, Q0[1]], [Q1[0], 0, Q1[1]], [Q1[0], ln.yTo + 0.15, Q1[1]], [Q0[0], ln.yFrom + 0.15, Q0[1]], [nrm[0], 0, nrm[1]]);
      w.quad([P0[0], ln.yFrom + 0.15, P0[1]], [P1[0], ln.yTo + 0.15, P1[1]], [Q1[0], ln.yTo + 0.15, Q1[1]], [Q0[0], ln.yFrom + 0.15, Q0[1]], [0, 1, 0]);
      bag.add(walls, w.build());
      const m0 = p(ln.aFrom, b + db / 2);
      const m1 = p(ln.aTo, b + db / 2);
      rails.run([[m0[0], ln.yFrom + 0.15, m0[1]], [m1[0], ln.yTo + 0.15, m1[1]]], { h: 0.95 });
    }
  }
  bag.add(M('precinct.paver'), ramp.build());
  // turning landing at the east end and the top landing beside the terrace
  L.add(M('precinct.paver'), lbox(-1.6, 1.0, Y_PLAZA / 2 - 0.3, Y_PLAZA / 2, -44.2, -38.9));
  L.add(walls, lbox(-1.85, -1.6, 0, Y_PLAZA / 2 + 0.15, -44.45, -38.65));
  L.add(walls, lbox(-1.85, 1.0, 0, Y_PLAZA / 2 + 0.15, -44.45, -44.2));
  L.add(M('precinct.paver'), lbox(26.0, 28.5, Y_PLAZA - 0.3, Y_PLAZA, -41.3, -38.7));
  L.add(walls, lbox(26.0, 28.5, 0, Y_PLAZA - 0.3, -41.3, -38.7));
  rails.run([toW(HF, -1.72, -44.3), toW(HF, -1.72, -38.8)].map((p) => [p[0], Y_PLAZA / 2 + 0.15, p[1]]), { h: 0.95 });

  // small stair from the south terrace (+5.0) up to the Arena Deck at the hotel's south-east corner
  {
    const n2 = 15;
    const prof2 = { yTop: Y_DECK, n: n2, r: (Y_DECK - Y_PLAZA) / n2, t: 0.29 };
    const topLine = [toW(HF, 0.0, -HILTON.eastBlockDepth - 0.3), toW(HF, 0.0, -38.4)];
    const st = stairBand(topLine, [WEST], { ...prof2, nosing: 0.04 });
    bag.add(granite, st.treads, 3);
    bag.add(granite, st.risers, 3);
    const pp2 = stairProfile(prof2);
    for (const b of [-HILTON.eastBlockDepth - 0.45, -38.25]) {
      const p = toW(HF, 0, b);
      rails.run(pp2.pts.map(([d, y]) => [p[0] + WEST[0] * d, y, p[1] + WEST[1] * d]), { h: 0.95, handrail: true, post: 1.2, level: 3 });
    }
    L.add(M('precinct.deckSoffit'), lbox(0, 4.2, Y_PLAZA - SLAB, Y_PLAZA - SLAB + 0.02, -38.7, -HILTON.eastBlockDepth), 1);
  }
  bag.absorb(L, HF);
}

// --- West Gate: stairs down to the street beside the landing of the city footbridge -------------
function westGate(bag, rails) {
  const granite = M('precinct.granite');
  // stair along the north face of K Tower, descending west (OSM way 1211706029, 29.8 m)
  const n = 32;
  const r = Y_PLAZA / n;
  const prof = { yTop: Y_PLAZA, n, r, t: 0.32, landings: { 11: 1.8, 22: 1.8 } };
  const bN = KTOWER.b1 + 4.0;
  const bS = KTOWER.b1 + 0.4;
  const aTop = 91.5;
  const top = [toW(HF, aTop, bS), toW(HF, aTop, bN)];
  const s = stairBand(top, [WEST], { ...prof, nosing: 0.05 });
  bag.add(granite, s.treads);
  bag.add(granite, s.risers);
  bag.add(M('precinct.graniteNosing'), s.nosings);
  const pp = stairProfile(prof);
  for (const b of [bS + 0.15, (bS + bN) / 2, bN - 0.15]) {
    const p = toW(HF, aTop, b);
    rails.run(pp.pts.map(([d, y]) => [p[0] + WEST[0] * d, y, p[1] + WEST[1] * d]), { h: 0.95, handrail: b === (bS + bN) / 2, post: 1.3 });
  }
  // solid white flank on the street side
  const w = new Tris();
  for (let i = 0; i < pp.pts.length - 1; i++) {
    const [s0, y0] = pp.pts[i];
    const [s1, y1] = pp.pts[i + 1];
    const p = toW(HF, aTop + s0, bN);
    const q = toW(HF, aTop + s1, bN);
    w.quad([p[0], 0, p[1]], [q[0], 0, q[1]], [q[0], y1, q[1]], [p[0], y0, p[1]], [NORTH[0], 0, NORTH[1]]);
  }
  bag.add(M('precinct.podiumWall'), w.build(), 1);
  // landing slab between the plaza edge and the stair head
  const L = new Bag();
  L.add(M('precinct.paver'), lbox(88.5, aTop, Y_PLAZA - 0.3, Y_PLAZA, KTOWER.b1, bN));
  bag.absorb(L, HF);

  // second stair on the north side of the footbridge, down to the perimeter road (OSM way 1211707833)
  const wg = toW(HF, 89.1, 3.4);
  const wgIn = toW(HF, 84.3, 12.5);
  const e = unit2(wg, wgIn);
  const out = [e[1], -e[0]][0] * WEST[0] + [e[1], -e[0]][1] * WEST[1] > 0 ? [e[1], -e[0]] : [-e[1], e[0]];
  const t0 = [wg[0] + e[0] * 3.75, wg[1] + e[1] * 3.75];
  const t1 = [wg[0] + e[0] * 6.85, wg[1] + e[1] * 6.85];
  const prof2 = { yTop: Y_PLAZA, n, r, t: 0.3, landings: { 11: 1.6, 22: 1.6 } };
  const s2 = stairBand([t0, t1], [out], { ...prof2, nosing: 0.05 });
  bag.add(granite, s2.treads);
  bag.add(granite, s2.risers);
  bag.add(M('precinct.graniteNosing'), s2.nosings);
  const pp2 = stairProfile(prof2);
  const w2 = new Tris();
  for (const [q, sgn] of [[t0, -1], [t1, 1]]) {
    rails.run(pp2.pts.map(([d, y]) => [q[0] + out[0] * d - e[0] * sgn * 0.12, y, q[1] + out[1] * d - e[1] * sgn * 0.12]), { h: 0.95 });
    for (let i = 0; i < pp2.pts.length - 1; i++) {
      const [s0, y0] = pp2.pts[i];
      const [s1, y1] = pp2.pts[i + 1];
      const A = [q[0] + out[0] * s0, q[1] + out[1] * s0];
      const B = [q[0] + out[0] * s1, q[1] + out[1] * s1];
      w2.quad([A[0], 0, A[1]], [B[0], 0, B[1]], [B[0], y1, B[1]], [A[0], y0, A[1]], [e[0] * sgn, 0, e[1] * sgn]);
    }
  }
  bag.add(M('precinct.podiumWall'), w2.build(), 1);
}

// --- East Gate: stair along the outside of the deck prow down to the street -----------------------
function eastGate(bag, rails) {
  const granite = M('precinct.granite');
  // runs from the East Gate end of the deck toward the stage end, along the flank (OSM way 1211706837)
  const end = PROW[PROW.length - 1];
  const d = unit2(end, DECK_FL); // toward the building
  const along = [d[1], -d[0]]; // toward the stage end (rotate)
  const dir = along[1] < 0 ? along : [-along[0], -along[1]];
  const n = 44;
  const prof = { yTop: Y_DECK, n, r: Y_DECK / n, t: 0.3, landings: { 15: 1.6, 30: 1.6 } };
  const a = [end[0] + d[0] * 0.5, end[1] + d[1] * 0.5];
  const b = [end[0] + d[0] * 3.3, end[1] + d[1] * 3.3];
  const s = stairBand([a, b], [dir], { ...prof, nosing: 0.05 });
  bag.add(granite, s.treads, 3);
  bag.add(granite, s.risers, 3);
  const pp = stairProfile(prof);
  for (const p of [a, b]) rails.run(pp.pts.map(([q, y]) => [p[0] + dir[0] * q, y, p[1] + dir[1] * q]), { h: 0.95 });
  const w = new Tris();
  for (const p of [a, b]) {
    for (let i = 0; i < pp.pts.length - 1; i++) {
      const [s0, y0] = pp.pts[i];
      const [s1, y1] = pp.pts[i + 1];
      const P0 = [p[0] + dir[0] * s0, p[1] + dir[1] * s0];
      const P1 = [p[0] + dir[0] * s1, p[1] + dir[1] * s1];
      w.quad([P0[0], 0, P0[1]], [P1[0], 0, P1[1]], [P1[0], y1, P1[1]], [P0[0], y0, P0[1]], p === a ? [-d[0], 0, -d[1]] : [d[0], 0, d[1]]);
    }
  }
  bag.add(M('precinct.podiumWall'), w.build(), 1);
}

// --- brick lift towers ---------------------------------------------------------------------------
function liftTowers(bag, ctx) {
  const brick = M('precinct.brick');
  const dark = M('precinct.darkMetal');
  const glass = M('precinct.liftGlass');
  // North lift (OSM node 11225961510): plain brick box, 7 x 5 m, ground to +12.6
  {
    const f = frame(FACET_L.c[0], FACET_L.c[1], FACET_L.d[0], FACET_L.d[1]); // b = −offset
    const L = new Bag();
    const t0 = LIFT_N.t;
    const t1 = LIFT_N.t + LIFT_N.len;
    const b0 = -LIFT_N.off1;
    const b1 = -LIFT_N.off0;
    L.add(brick, lbox(t0, t1, 0, LIFT_N.top, b0, b1));
    L.add(dark, lbox(t0 - 0.12, t1 + 0.12, LIFT_N.top, LIFT_N.top + 0.18, b0 - 0.12, b1 + 0.12));
    // lift doors toward the deck (inner side) and a canopy; ground-level door toward the garden
    L.add(dark, lbox(t0 + 2.3, t0 + 4.7, Y_DECK, Y_DECK + 2.3, b1, b1 + 0.06), 3);
    L.add(dark, lbox(t0 + 1.9, t0 + 5.1, Y_DECK + 2.5, Y_DECK + 2.62, b1, b1 + 1.4), 3);
    L.add(glass, lbox(t0 + 2.5, t0 + 3.4, Y_DECK + 0.1, Y_DECK + 2.15, b1 + 0.06, b1 + 0.09), 3);
    L.add(glass, lbox(t0 + 3.6, t0 + 4.5, Y_DECK + 0.1, Y_DECK + 2.15, b1 + 0.06, b1 + 0.09), 3);
    L.add(dark, lbox(t0 + 2.3, t0 + 4.7, 0, 2.5, b0 - 0.06, b0), 1);
    L.add(dark, lbox(t0 + 1.6, t0 + 5.4, 2.6, 2.75, b0 - 1.6, b0), 1);
    // warm wash on the brick at night
    L.add(E('precinct.liftGlow'), lbox(t0 + 0.6, t1 - 0.6, 0.6, 0.72, b0 - 0.12, b0 - 0.04), 1);
    bag.absorb(L, f);
  }
  // small brick lift pavilions with a dark pyramid roof and glazed doors: West, South, East
  const small = (x, z, rotY, yBase, level) => {
    const f = frame(x, z, Math.cos(rotY), -Math.sin(rotY));
    const L = new Bag();
    const top = yBase + 4.4;
    L.add(brick, lbox(-1.7, 1.7, 0, top, -1.7, 1.7));
    L.add(M('precinct.stoneBase'), lbox(-1.8, 1.8, top, top + 0.25, -1.8, 1.8));
    L.add(glass, lbox(-0.9, 0.9, yBase + 0.05, yBase + 2.4, 1.7, 1.74), level);
    L.add(dark, lbox(-1.05, 1.05, yBase + 2.4, yBase + 2.6, 1.7, 1.78), level);
    L.add(dark, lbox(-0.9, 0.9, 0.05, 2.4, -1.74, -1.7), 1);
    bag.absorb(L, f);
    // pyramid roof
    const o = [toW(f, -1.95, -1.95), toW(f, 1.95, -1.95), toW(f, 1.95, 1.95), toW(f, -1.95, 1.95)];
    const c = toW(f, 0, 0);
    const i = o.map(() => c);
    bag.add(M('hilton.mansard'), band(o, top + 0.25, i, top + 1.5));
  };
  const w = toW(HF, LIFT_W.a, LIFT_W.b);
  small(w[0], w[1], HF.rotY + Math.PI, Y_PLAZA);
  const sC = toW(HF, (LIFT_S.a0 + LIFT_S.a1) / 2, (LIFT_S.b0 + LIFT_S.b1) / 2);
  small(sC[0], sC[1], HF.rotY, Y_PLAZA);
  const fe = Math.atan2(-(DECK_FL[1] - PROW[PROW.length - 1][1]), DECK_FL[0] - PROW[PROW.length - 1][0]);
  small(LIFT_E[0], LIFT_E[1], fe, Y_DECK, 3);
}

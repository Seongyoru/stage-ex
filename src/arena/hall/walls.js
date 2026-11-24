// Hall side walls, stage rear wall, their linings, and the fill of the wall zone (poche).
import { Mesher } from './builder.js';
import {
  FRAME_R,
  FRAME_L,
  FRAME_B,
  REAR_LEN,
  MITRE,
  SIDE_T,
  REAR_T,
  POCHE_D,
  STAND_S,
  STAND_LINE,
  SIDE_END,
  wallTop,
  REAR_TOP,
  LEVEL_BANDS,
  LEVEL_Y,
  G,
  NOZZLE_S0,
  OPENINGS,
  curtainBands,
} from './layout.js';

const SIDES = [FRAME_R, FRAME_L];
// The wall zone of a side wall begins on the line of the back of the stage rear wall
// (z = const), which in the side-wall frame is the oblique line s = ZONE_S0 + ZONE_K·d.
const ZONE_S0 = -REAR_T / FRAME_R.tz;
const ZONE_K = -FRAME_R.nz / FRAME_R.tz;
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * A wall as vertical strips, split into the level bands of the floor selector.
 *   lb     lower edge: segments [s0, y0, s1, y1] in order, covering sMin..sMax
 *   top    upper edge: [y at sMin, y at sMax] (straight)
 *   doors  openings cut from the bottom: { s0, s1, h }
 *   back0 / back1  extra length of the back face at the two ends (corner joints)
 * Returns Map(level → Mesher) with the front face (d = 0), the back face (d = −thick) and the
 * free end at sMax.
 */
function wallBands({ sMin, sMax, lb, top, doors = [], thick, back0 = 0, back1 = 0, endFace = false }) {
  const topAt = (s) => lerp(top[0], top[1], (s - sMin) / (sMax - sMin));
  const cuts = [sMin, sMax];
  const add = (s) => {
    if (s > sMin + 1e-6 && s < sMax - 1e-6) cuts.push(s);
  };
  for (const [s0, y0, s1, y1] of lb) {
    add(s0);
    add(s1);
    for (const [, yb] of LEVEL_BANDS) {
      if ((y0 - yb) * (y1 - yb) < 0) add(lerp(s0, s1, (yb - y0) / (y1 - y0)));
    }
  }
  for (const [, yb] of LEVEL_BANDS) {
    if ((top[0] - yb) * (top[1] - yb) < 0) add(lerp(sMin, sMax, (yb - top[0]) / (top[1] - top[0])));
  }
  for (const d of doors) {
    add(d.s0);
    add(d.s1);
  }
  cuts.sort((a, b) => a - b);
  const out = new Map();
  const mesher = (lv) => {
    if (!out.has(lv)) out.set(lv, new Mesher());
    return out.get(lv);
  };
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  for (let i = 0; i + 1 < cuts.length; i++) {
    const a = cuts[i];
    const b = cuts[i + 1];
    if (b - a < 1e-6) continue;
    const mid = (a + b) / 2;
    const seg = lb.find(([s0, , s1]) => mid >= s0 && mid <= s1);
    if (!seg) continue;
    const lbAt = (s) => lerp(seg[1], seg[3], (s - seg[0]) / (seg[2] - seg[0] || 1));
    const door = doors.find((d) => mid > d.s0 && mid < d.s1);
    const loA = Math.max(lbAt(a), door ? door.h : -Infinity);
    const loB = Math.max(lbAt(b), door ? door.h : -Infinity);
    const hiA = topAt(a);
    const hiB = topAt(b);
    const aBack = a - (i === 0 ? back0 : 0);
    const bBack = b + (i + 2 === cuts.length ? back1 : 0);
    for (const [lv, y0, y1] of LEVEL_BANDS) {
      const la = clamp(loA, y0, y1);
      const lb2 = clamp(loB, y0, y1);
      const ha = clamp(hiA, y0, y1);
      const hb = clamp(hiB, y0, y1);
      if (ha - la < 1e-6 && hb - lb2 < 1e-6) continue;
      const m = mesher(lv);
      m.quadToward([a, la, 0], [b, lb2, 0], [b, hb, 0], [a, ha, 0], [0, 0, 1]);
      m.quadToward([aBack, la, -thick], [bBack, lb2, -thick], [bBack, hb, -thick], [aBack, ha, -thick], [0, 0, -1]);
      if (endFace && i + 2 === cuts.length) m.quadToward([b, lb2, 0], [b, lb2, -thick], [b, hb, -thick], [b, hb, 0], [1, 0, 0]);
    }
  }
  return out;
}

/**
 * Lower edge of a side wall: the floor up to the fixed Lower Stand, then 0.6 m below the tread
 * line of the stands (inside the stand structure; arena/structure runs its concourses through
 * to the flank wall under the stands, so the hall wall must not reach down into them).
 * Behind the last row of the Lower Stand the hall continues over the cross-aisle to its rear
 * wall; the Middle Stand ends against the wall of the VIP floor.
 */
function sideLowerEdge() {
  const S = STAND_S;
  const drop = 0.6;
  const on = ([s0, y0, s1, y1], s) => y0 + ((s - s0) / (s1 - s0)) * (y1 - y0) - drop;
  const { lower, middle, upper } = STAND_LINE;
  const s1 = S.lowerRearWall;
  const s2 = S.middleBack + 0.3;
  return [
    [0, 0, S.fixedFront, 0],
    [S.fixedFront, on(lower, S.fixedFront), S.lowerBack, on(lower, S.lowerBack)],
    [S.lowerBack, LEVEL_Y[3] - drop, s1, LEVEL_Y[3] - drop],
    [s1, on(middle, s1), S.middleBack, on(middle, S.middleBack)],
    [S.middleBack, LEVEL_Y[6] - drop, s2, LEVEL_Y[6] - drop],
    [s2, on(upper, s2), SIDE_END, on(upper, SIDE_END)],
  ];
}

/** A panel (box) on a wall with door openings cut from its bottom edge. */
function panelWithDoors(m, s0, s1, y0, y1, d0, d1, doors = [], k0 = 0, k1 = 0) {
  let s = s0;
  const list = doors.filter((d) => d.s1 > s0 && d.s0 < s1 && d.h > y0).sort((a, b) => a.s0 - b.s0);
  for (const d of list) {
    if (d.s0 > s) m.run(s, d.s0, d0, d1, y0, y1, s === s0 ? k0 : 0, 0);
    if (d.h < y1) m.box(Math.max(d.s0, s0), Math.min(d.s1, s1), d.h, y1, d0, d1);
    s = Math.max(s, d.s1);
  }
  if (s < s1) m.run(s, s1, d0, d1, y0, y1, s === s0 ? k0 : 0, k1);
}

export function buildWalls(B, { ends }) {
  const O = OPENINGS;
  const truck = { s0: O.truck.s0, s1: O.truck.s1, h: O.truck.h };
  const service = { s0: O.service.s0, s1: O.service.s1, h: O.service.h };
  const rearDoors = [
    { s0: O.rear.s0, s1: O.rear.s1, h: O.rear.h },
    { s0: REAR_LEN - O.rear.s1, s1: REAR_LEN - O.rear.s0, h: O.rear.h },
  ];

  // --- main walls: charcoal acoustic panels, full height -----------------------------------
  // back faces meet the back of the rear wall (different thicknesses, so no common mitre)
  const sideBack0 = (REAR_T - SIDE_T * FRAME_R.nz) / FRAME_R.tz; // 0.18
  const side = wallBands({
    sMin: 0,
    sMax: SIDE_END,
    lb: sideLowerEdge(),
    top: [wallTop(0), wallTop(SIDE_END)],
    doors: [truck],
    thick: SIDE_T,
    back0: sideBack0,
    endFace: true,
  });
  for (const [lv, m] of side) B.add('hall.wallPanel', lv, m, SIDES);

  const rearBack = SIDE_T * -FRAME_R.nx - sideBack0 * FRAME_R.tx; // 0.35: to the back corner of the side wall
  const rear = wallBands({
    sMin: 0,
    sMax: REAR_LEN,
    lb: [[0, 0, REAR_LEN, 0]],
    top: [REAR_TOP, REAR_TOP],
    doors: rearDoors,
    thick: REAR_T,
    back0: rearBack,
    back1: rearBack,
  });
  for (const [lv, m] of rear) B.add('hall.wallPanel', lv, m, [FRAME_B]);

  // --- linings ---------------------------------------------------------------------------------
  // olive-grey painted panels behind every curtain band (the sound-reflecting wall)
  for (const band of curtainBands(ends)) {
    const y0 = band.level === 1 ? 0 : LEVEL_Y[band.level];
    const y1 = LEVEL_Y[band.under] - G.topping - G.deck;
    const ms = new Mesher();
    ms.run(0, band.sideEnd + 0.25, 0, 0.05, y0, y1, MITRE, 0);
    B.add('hall.wallBehindCurtain', band.level, ms, SIDES);
    const mr = new Mesher();
    panelWithDoors(mr, 0, REAR_LEN, y0, y1, 0, 0.05, band.level === 1 ? rearDoors : [], MITRE, -MITRE);
    B.add('hall.wallBehindCurtain', band.level, mr, [FRAME_B]);
  }
  // black wall under the nozzle fascia of the 3F side gallery, with the cheek that stops the curtain
  {
    const y1 = LEVEL_Y[3] - G.topping - G.deck;
    const m = new Mesher();
    panelWithDoors(m, NOZZLE_S0 + 0.05, ends[3], 0, y1, 0, 0.06, [service, truck]);
    m.box(NOZZLE_S0 - 0.03, NOZZLE_S0 + 0.05, 0, y1, 0, 1.1);
    B.add('hall.wallBlack', 1, m, SIDES);
  }

  // --- wall zone (poche): floors at every level and a cap under the roof -----------------------
  // A floor exists only beside the open hall, i.e. as far as the wall above stands on it
  // (further back the stands and the concourses of arena/structure take over the wall zone).
  const lower = sideLowerEdge();
  const reach = (y) => {
    let s = 0;
    for (const [s0, y0, s1, y1] of lower) {
      if (y0 > y) break;
      s = y1 <= y ? s1 : s0 + ((y - y0) / (y1 - y0)) * (s1 - s0);
      if (y1 > y) break;
    }
    return s;
  };
  const limit = { 2: STAND_S.fixedFront - 0.3, 3: STAND_S.lowerBack, 4: STAND_S.lowerBack };
  const liftHole = { s0: 75.9, s1: 79.85, dIn: -0.9, dOut: -4.5 }; // lift shaft of arena/structure in the flank zone
  for (const [lv] of LEVEL_BANDS) {
    if (lv === 1) continue;
    const y1 = LEVEL_Y[lv] - 0.06; // inside the 300 mm slabs arena/structure lays in this zone
    const y0 = y1 - 0.2;
    const sB = Math.min(reach(y0 - 0.1), limit[lv] ?? Infinity);
    // start where the level is still under the wall top
    let sA = 0;
    if (wallTop(0) < LEVEL_Y[lv] + 0.3) sA = ((LEVEL_Y[lv] + 0.3 - wallTop(0)) / (wallTop(SIDE_END) - wallTop(0))) * SIDE_END;
    const m = new Mesher();
    const piece = (a, b) => {
      const a1 = Math.max(a, sA);
      const b1 = Math.min(b, sB);
      if (b1 - a1 < 0.05) return;
      // around the lift shaft; the zone starts on the line of the back of the rear wall
      const first = (b2) => (a1 > 0 ? m.box(a1, b2, y0, y1, POCHE_D, -SIDE_T) : m.run(ZONE_S0, b2, POCHE_D, -SIDE_T, y0, y1, ZONE_K));
      if (b1 <= liftHole.s0 || a1 >= liftHole.s1) first(b1);
      else {
        if (a1 < liftHole.s0) first(liftHole.s0);
        if (b1 > liftHole.s1) m.box(liftHole.s1, b1, y0, y1, POCHE_D, -SIDE_T);
        m.box(Math.max(a1, liftHole.s0), Math.min(b1, liftHole.s1), y0, y1, liftHole.dIn, -SIDE_T);
        m.box(Math.max(a1, liftHole.s0), Math.min(b1, liftHole.s1), y0, y1, POCHE_D, liftHole.dOut);
      }
    };
    if (lv === 2) {
      // the truck passage through the wall zone is higher than LEVEL 2
      piece(0, truck.s0 - 0.3);
      piece(truck.s1 + 0.3, SIDE_END);
    } else piece(0, SIDE_END);
    B.add('hall.poche', lv, m, SIDES);
  }
  {
    const m = new Mesher();
    const t0 = wallTop(0);
    const t1 = wallTop(SIDE_END);
    m.run(ZONE_S0, SIDE_END, POCHE_D, -0.02, [t0 - 0.2, t1 - 0.2], [t0, t1], ZONE_K);
    B.add('hall.poche', 9, m, SIDES);
    const r = new Mesher();
    r.run(-0.35, REAR_LEN + 0.35, -REAR_T, -0.02, REAR_TOP - 0.2, REAR_TOP);
    B.add('hall.poche', 9, r, [FRAME_B]);
  }
}

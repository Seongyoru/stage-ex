// Plan stations of everything behind and under the stands, in apothem coordinates (see
// kit.js). The numbers are derived from the shared envelope (stand back planes, wall ring,
// column line, levels) so that the concourses stay concentric with the bowl.
import { LEVEL_Y, STAND_EXTENT, L3_WALL_RING, GLASS_BOX, Z, outerHalfWidth } from '../../core/envelope.js';
import { GATES, rowElevation, ROW_TREAD } from '../../core/seating.js';
import { SPEC } from '../../core/spec.js';
import { RC0, RW0, xJ, aJ, frameC, frameW, toWing } from './kit.js';

export const Y = LEVEL_Y;

// --- radial stations (apothem R, metres from the fan apex) -----------------------------------
export const R = Object.freeze({
  arenaWall: Math.max(...SPEC.hall.arenaFloor.polygonStandsRetracted_H.map((p) => p[1])) + RC0, // 78.05 front of the fixed Lower Stand (row 12)
  l3Back: STAND_EXTENT['L3/C'].vBack + RC0, // 92.91 back plane of the Lower Stand
  l3Gate: 96.3, // hall rear wall at LEVEL 3 (front face); official gate markers are at 97.0
  l4Edge: 107.0, // outer edge of the LEVEL 4 mezzanine arms / wall line of the inner band
  l5BackC: STAND_EXTENT['L5/C'].vBack + RC0, // 101.60 back plane of the Middle Stand centre
  l5BackW: STAND_EXTENT['L5/RW'].vBack + RW0, // 109.04 back plane of the Middle Stand wings
  l5Face: 109.8, // concourse face of the centre block band on LEVEL 5 (lines up with the wing back plane)
  l6Front: 104.5, // front of the VIP box rooms (the box balconies in front belong to the bowl)
  l7Gate: 110.25, // back of the vomitory cut of the Upper Stand (back edge of row 10)
  shaft0: 113.6, // stair and lift shafts: inner face
  shaft1: 117.2, // … outer face
  wall: 118.3, // outer face of the LEVEL 3 wall line (rear facets), 18 m inside the eave edge
  column: 127.35,
});

/** Outward lean of the rear wall above LEVEL 6 (fact sheet §3.2: 7.4 m between +18.07 and +31.3). */
export function lean(y) {
  return y <= 18.07 ? 0 : (7.4 * (Math.min(y, 31.3) - 18.07)) / 13.23;
}
/** Inner face of the rear outer wall at height y (my slabs stop here; wall thickness 0.4 assumed). */
export function wallIn(y) {
  return R.wall + lean(y) - 0.4;
}

// --- lateral stations --------------------------------------------------------------------------
export const A_OUT = 36.85; // outer face of the flank wall in wing coordinates
export const A_IN = 36.4; // inner face of the flank wall (0.45 m wall assumed)
export const A_HALL = 31.66; // hall-side face of the hall side wall
export const A_ZONE = 32.2; // back of the hall side wall: start of the flank service zone
export const BOX_HALF = GLASS_BOX.halfWidth - 0.4; // glass box, inside the glazing
export const BOX_Z = GLASS_BOX.zFront - 0.4;

/** Interior column grid on the centre facet: lines up with the rear colonnade (8.54 m bays). */
export const GRID_X = [4.27, 12.81, 21.36, 29.9];
/** Column rows of the main foyer (apothem): threshold of the glass box, stair foot, upper stair. */
export const ROW_A = R.wall + 0.055; // z = 85.76
export const ROW_B = 109.8; // z = 77.2
export const ROW_C = 103.6; // z = 71.0: columns at the foot of the grand stair
export const ROW_D = 97.6; // z = 65.0: columns at the head of the grand stair, in front of the mural wall
/** Wing column lines (lateral a of the colonnade columns, 8.0 m bays). */
export const GRID_A = [-12.42, -4.42, 3.58, 11.58, 19.58, 27.58];

// --- gates ----------------------------------------------------------------------------------------
/** Gate positions in plan-frame coordinates: { id, side, facet: 'C' | 'W', p, R } (p = |x| or a). */
export const GATE_PLAN = Object.freeze(
  Object.fromEntries(
    Object.entries(GATES).map(([id, [x, z]]) => {
      const s = x >= 0 ? 1 : -1;
      const [a, Rw] = toWing(s, x, z);
      const Rc = z + RC0;
      // a gate belongs to the centre facet when it lies inside the junction lines
      const inCentre = Math.abs(x) <= xJ(Rc) + 0.6;
      return [id, Object.freeze(inCentre ? { id, side: s, facet: 'C', p: Math.abs(x), R: Rc } : { id, side: s, facet: 'W', p: a, R: Rw })];
    }),
  ),
);

// --- stand profiles (for soffits and headroom) ---------------------------------------------------
/** Tread level of each stand at apothem R (clamped to the stand's extent). */
export function standY(tier, Rr) {
  if (tier === 3) {
    const r = 12 + (Rr - 78.54) / ROW_TREAD;
    return rowElevation(3, Math.max(12, Math.min(29, r)));
  }
  if (tier === 5) return 10.2 + (0.316 / ROW_TREAD) * (Math.max(88.17, Math.min(108.67, Rr)) - 88.17);
  return 23.43 + (0.483 / ROW_TREAD) * (Math.max(102.46, Math.min(124.71, Rr)) - 102.46);
}

// --- rings ----------------------------------------------------------------------------------------
const C1 = frameC(1);
const W = { 1: frameW(1), '-1': frameW(-1) };

/**
 * Chevron band between apothems as a world ring. The centre part may start at a different
 * inner radius than the wings (`rc0` vs `rw0`); `box` adds the glass-box rectangle on the
 * rear centre; `aEnd` is the lateral end of the wings.
 */
export function bandRing({ rc0, rw0 = rc0, r1, aEnd = A_IN, box = false, boxZ = BOX_Z, boxHalf = BOX_HALF, aEnd0 = aEnd }) {
  const ring = [];
  ring.push(W[1].pt(aEnd0, rw0), W[1].pt(aEnd, r1), [xJ(r1), r1 - RC0]);
  if (box && boxZ > r1 - RC0) ring.push([boxHalf, r1 - RC0], [boxHalf, boxZ], [-boxHalf, boxZ], [-boxHalf, r1 - RC0]);
  ring.push([-xJ(r1), r1 - RC0], W[-1].pt(aEnd, r1), W[-1].pt(aEnd0, rw0));
  ring.push([-xJ(rw0), rw0 - RC0]);
  if (Math.abs(rc0 - rw0) > 1e-6) ring.push([-xJ(rc0), rc0 - RC0], [xJ(rc0), rc0 - RC0]);
  ring.push([xJ(rw0), rw0 - RC0]);
  return ring;
}

/** Rectangle in a frame as a world ring. */
export function rectRing(f, p0, p1, q0, q1) {
  return [f.pt(p0, q0), f.pt(p1, q0), f.pt(p1, q1), f.pt(p0, q1)];
}

// --- backstage block ---------------------------------------------------------------------------------
export const BS = Object.freeze({
  z0: Z.stageEndFacade + 0.4, // inside face of the stage-end wall
  z1: Z.stageRearWall - 0.45, // back of the stage rear wall (the wall itself belongs to arena/hall)
  bay1: Z.stageEndFacade + 4.6, // −30.1
  bay2: Z.stageEndFacade + 12.7, // −22.0
  notchHalf: 3.53 + 0.7 + 0.43, // the notch of the stage-end facade leans: 0.7 m wider at its floor (+10.3) than at the roof
  notchZ: Z.stageEndFacade + 7.86 + 0.4,
  halfWidth: (z) => outerHalfWidth(z) - 0.45,
  levels: [3, 5, 6, 7, 9],
});

export { L3_WALL_RING, GLASS_BOX, RC0, RW0, xJ, aJ, C1, W };

// --- vertical circulation (positions shared by slabs.js and circulation.js) -----------------------
const RISE_GS = (LEVEL_Y[4] - LEVEL_Y[3]) / 18;
export const CIRC = Object.freeze({
  // Red grand stair, LEVEL 3 → 4: 18 risers of 156 mm, 330 mm treads, climbing toward the stage.
  // Its head landing lies against the hall rear wall (the mural wall, apothem 96.7); the official
  // LEVEL 3 map draws the stair directly behind the wheelchair platform, between gates 302 / 303.
  grand: Object.freeze({
    rTop: 103.8 - 17 * 0.33, // 98.19 top nosing (edge of the LEVEL 4 landing), z = 65.6
    rFoot: 103.8, // z = 71.2, at the stair-foot columns
    n: 18,
    rise: RISE_GS,
    going: 0.33,
    centre: [0, 3.67], // clear between the columns at ±4.27
    inner: [4.87, 8.44], // red side flights
    outer: [8.74, 12.21], // voids with the stairs down to LEVEL 1 (and the 3-4-5 flights above)
    bayD: [13.41, 20.76], // voids either side: gate 302 / 303 passage + stair down
    bayE: [21.96, 0], // mezzanine either side
  }),
  // Stairs LEVEL 1 - 3 (four): straight, two flights of 22 risers with a landing at LEVEL 2,
  // climbing toward the rear (+z); they surface in the voids either side of the grand stair.
  s13: Object.freeze({
    xs: [10.475, 19.3],
    width: 2.4,
    rFoot: 106.2 - (2 * 21 * 0.27 + 1.3), // 93.56 first riser at LEVEL 1, on the wall line of the outer band
    flights: [
      { n: 22, rise: (LEVEL_Y[2] - 0.02) / 22 },
      { n: 22, rise: (LEVEL_Y[3] - LEVEL_Y[2]) / 22 },
    ],
    going: 0.27,
    landing: 1.3,
    rTop: 106.2, // z = 73.6
    open2: [62.7, 67.95], // world z range of the opening in the LEVEL 2 slab
    open3: [69.5, 73.65], // … in the LEVEL 3 slab
  }),
  // Stairs LEVEL 4 → 5 of the "3-4-5" group: start at the landing edge, climb toward the rear.
  // (in bay E, entirely behind the wall arena/bowl builds under row 17 of the Middle Stand centre)
  s45: Object.freeze({ xs: [23.7], width: 3.0, r0: 102.2, n: 16, rise: (LEVEL_Y[5] - LEVEL_Y[4]) / 16, going: 0.3 }),
  // Stairs LEVEL 3 → 4 into the mezzanine arms (the other two of the "3-4-5" group).
  s34: Object.freeze({ x: 28.0, width: 2.8, r0: 107.0, n: 17, rise: (LEVEL_Y[4] - LEVEL_Y[3]) / 17, going: 0.3 }),
  // Stair cores LEVEL 3 - 5 - 7 (six): dog-leg, 17 risers per flight, 2 flights per 5.4 m storey.
  s357: Object.freeze({
    wing: [
      [-11.0, -3.0],
      [14.4, 22.4],
    ],
    centre: [22.6, 30.6],
    n: 17,
    rise: 2.7 / 17,
    going: 0.27,
    flightW: 1.5,
  }),
  // Escalators LEVEL 3 ↔ 5: one up / down pair each side, running outward along the rear wall.
  esc: Object.freeze({ r0: 110.2, r1: 113.5, x0: 22.1, comb0: 23.9, rise: 5.4, run: 5.4 / Math.tan((30 * Math.PI) / 180), x1plate: 2.0 }),
  // Lift cores (5): one on each diagonal beside the stair core nearest the main foyer, one in each
  // flank service zone beside the stage (clear of the recessed opening of the flank facade), one backstage.
  liftWing: [-13.8, -11.0],
  liftFlank: Object.freeze({ a: [32.7, 36.0], r: [30.6, 34.2] }),
  // recess of the flank facade with its two service galleries (arena/exterior flanks.js): keep out
  flankRecess: Object.freeze({ a: 34.15, r: [36.4, 48.8], y: [14.2, 26.3] }),
  liftBackstage: Object.freeze({ x: [5.2, 8.6], z: [-33.9, -30.6] }),
});

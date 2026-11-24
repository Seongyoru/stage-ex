// Roof layout of the hall: pure math in the WORLD frame, no three.js.
//
// PLAN OF THE 18 TRUSSES (decision and evidence)
//   The trusses run PARALLEL to the hall axis, 9 on each side of it, at the 8.54 m pitch
//   of the rear colonnade:  x = ±(k + 0.5) · 8.542 m, k = 0 … 8.
//   - The 10 inner ones (|x| ≤ 38.44) land exactly on the 10 columns of the centre rear
//     facet (envelope COLUMNS); the 8 outer ones land on the diagonal column lines.
//   - 9 lines per side at this pitch is exactly what fits between the two flank walls
//     (the next line, x = 81.1, would have no span left), which gives Kajima's count of 18.
//   - Official photo taken from the stage (Oricon 20230922_111820): the heavy bottom-chord
//     lines converge on the vanishing point of the hall axis and sit at lateral offsets in
//     the ratio 1.5 : 2.5 : 3.5, i.e. half-pitch off the axis, no truss on the axis itself.
//   - Kajima BIM image and the official photo from the upper house-left side show an
//     orthogonal grid (long trusses + cross trusses, one light cluster per cell), and the
//     satellite image shows roof joints parallel / perpendicular to the axis, not a fan.
//   Trusses inside the width of the stage rear wall span the full 112 m from the stage-end
//   frame to the colonnade; the outer ones start on the flank-wall frame and get shorter.
//
// HEIGHTS
//   bottom chord underside: trussBottomY(z) for the full-length trusses. Every truss is one
//     straight line that reaches the same bearing level (+39.3) on the rear column line, so
//     the outer, shorter trusses rise a little faster (they have to clear the top rows of
//     the Upper Stand wings, which sit at the same +36.47 as the centre).
//   top chord top: min(trussTopY(z), roofY − 0.9): purlins (0.25) and the roof build-up
//     (0.6 + 0.02) sit between the chord and the outer roof surface.
import { SPEC } from '../../core/spec.js';
import {
  Z,
  LEVEL_Y,
  hallHalfWidth,
  roofY,
  trussBottomY,
  trussTopY,
  COLUMNS,
  COLUMN_TOP_Y,
  STAND_EXTENT,
} from '../../core/envelope.js';
import { WING_ANGLE, FAN_APEX_Z, ROW_TREAD, worldToUV } from '../../core/seating.js';

export const SIN_W = Math.sin(WING_ANGLE);
export const COS_W = Math.cos(WING_ANGLE);
export const TAN_HALF_W = Math.tan(WING_ANGLE / 2);

// --- stations along the axis ---------------------------------------------------------
export const Z0 = Z.stageRearWall; // −17.2
export const Z1 = Z.columnLine; // 94.76
export const N_PANELS = 18;
export const PANEL = (Z1 - Z0) / N_PANELS; // 6.22 m
/** Panel points z_0 … z_18. Warren diagonals meet at the TOP chord on odd points. */
export const STATIONS = Array.from({ length: N_PANELS + 1 }, (_, i) => Z0 + i * PANEL);

// --- truss lines -----------------------------------------------------------------------
const centreCols = COLUMNS.filter(([, z]) => Math.abs(z - Z1) < 0.01).map(([x]) => x).sort((a, b) => a - b);
export const PITCH = (centreCols[centreCols.length - 1] - centreCols[0]) / (centreCols.length - 1); // 8.542
export const CENTRE_HALF = centreCols[centreCols.length - 1]; // 38.44: outermost column of the centre facet
const diagCols = COLUMNS.filter(([x, z]) => x > 0 && z < Z1 - 0.01).sort((a, b) => a[0] - b[0]);
const lastDiag = diagCols[diagCols.length - 1];
/** dz/dx of the diagonal column line (negative of): z = Z1 − DIAG_M · (|x| − CENTRE_HALF). */
export const DIAG_M = (Z1 - lastDiag[1]) / (lastDiag[0] - CENTRE_HALF);
export const SHOULDER_COL = lastDiag; // last column of the diagonal, next to the flank wall

const flankSlope = hallHalfWidth(1) - hallHalfWidth(0); // 0.664 m per m
const WALL_ZONE = SPEC.hall.sideWalls.wallZoneThickness_m; // 5.2

/** z of the rear column line at lateral position x (centre facet or diagonal). */
export function columnLineZ(x) {
  const ax = Math.abs(x);
  return ax <= CENTRE_HALF ? Z1 : Z1 - DIAG_M * (ax - CENTRE_HALF);
}
/** z where a line x = const meets the middle of the flank-wall zone (truss bearing on the flank frame). */
function flankBearingZ(x) {
  return (Math.abs(x) - WALL_ZONE / 2 - hallHalfWidth(0)) / flankSlope;
}
/** z where a line x = const enters the hall through the side-wall face. */
export function hallEntryZ(x) {
  return Math.max(Z0, (Math.abs(x) - hallHalfWidth(0)) / flankSlope);
}

export const BEARING_Y = trussBottomY(Z1); // 39.3: bottom chord underside on the column line
export const CHORD_D = 0.7; // chord depth (built-up H), m
export const PURLIN_D = 0.25;
export const ROOF_BUILDUP = 0.62; // ceiling underside below roofY (0.6 + 0.02 so it never shares a face with the roof skin)
export const TOP_ALLOWANCE = ROOF_BUILDUP + PURLIN_D + 0.03; // 0.9

/** Underside of the roof build-up = the ceiling surface seen from the hall. */
export function ceilingY(x, z) {
  return roofY(x, z) - ROOF_BUILDUP;
}
/** Top of the top chord of a truss at lateral position x. */
export function chordTopY(x, z) {
  return Math.min(trussTopY(z), roofY(x, z) - TOP_ALLOWANCE);
}

function makeTruss(x, index) {
  const zs = Math.max(Z0, flankBearingZ(x));
  const ze = columnLineZ(x);
  const ys = trussBottomY(zs);
  const slope = (BEARING_Y - ys) / (ze - zs);
  // panel points: both ends plus every global station strictly inside (ends closer than 2 m are merged)
  const pts = [zs];
  for (const s of STATIONS) if (s > zs + 2.0 && s < ze - 2.0) pts.push(s);
  pts.push(ze);
  return Object.freeze({
    index,
    x,
    zs,
    ze,
    points: Object.freeze(pts),
    /** underside of the bottom chord */
    yb: (z) => ys + slope * (Math.min(Math.max(z, zs), ze) - zs),
    /** top of the top chord */
    yt: (z) => chordTopY(x, z),
    spans: (z) => z >= zs - 1e-6 && z <= ze + 1e-6,
    fullSpan: zs <= Z0 + 1e-6 && ze >= Z1 - 1e-6,
  });
}

/** The 18 trusses, sorted by x (house left → house right). */
export const TRUSSES = Object.freeze(
  [...Array(9).keys()]
    .flatMap((k) => [-(k + 0.5) * PITCH, (k + 0.5) * PITCH])
    .sort((a, b) => a - b)
    .map((x, i) => makeTruss(x, i)),
);
export const TRUSS_X = TRUSSES.map((t) => t.x);

// --- hall outline at truss level -------------------------------------------------------
export const WALL_GAP = 0.12; // closure walls stand this far behind the nominal hall wall faces
export const STAGE_CLOSURE_Z = Z0 - WALL_GAP;
export const REAR_CLOSURE_Z = Z1 - 0.86; // 93.9: just inside the inner face of the centre columns
/** Wing rear closure line in wing-facet coordinates: x·sin + z·cos = REAR_CLOSURE_V (0.8 m inside the column line). */
export const REAR_CLOSURE_V = SHOULDER_COL[0] * SIN_W + SHOULDER_COL[1] * COS_W - 0.75;

/** Half width of the hall at truss level at station z: side wall or rear diagonal, whichever is nearer. */
export function hallW(z) {
  const side = hallHalfWidth(z) + WALL_GAP;
  const diag = (REAR_CLOSURE_V - z * COS_W) / SIN_W;
  return Math.max(0, Math.min(side, diag));
}
/** Station where the side wall meets the rear diagonal (the "shoulder" of the hall). */
export const SHOULDER_Z = (() => {
  let lo = 40;
  let hi = 90;
  for (let i = 0; i < 50; i++) {
    const m = (lo + hi) / 2;
    if (hallHalfWidth(m) + WALL_GAP < (REAR_CLOSURE_V - m * COS_W) / SIN_W) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
})();
export function insideHall(x, z, margin = 0) {
  return z >= STAGE_CLOSURE_Z + margin && z <= REAR_CLOSURE_Z - margin && Math.abs(x) <= hallW(z) - margin;
}

/** Half width of the roof crown (replicates the crown term of envelope.roofY; used only for break lines). */
export function crownHalf(z) {
  const zz = Math.min(z, Z.columnLine);
  const t = (zz - Z.raisedRoofStart) / (Z.columnLine - Z.raisedRoofStart);
  return 22.3 + (38.3 - 22.3) * Math.min(Math.max(t, 0), 1);
}
/** Sorted x break points of a transverse line at station z between −w and +w (roof kinks included). */
export function crossBreaks(z, w, extra = []) {
  const c = crownHalf(z);
  const xs = [-w, w, 0, ...extra];
  if (c < w - 0.05) xs.push(-c, c);
  return [...new Set(xs.filter((x) => Math.abs(x) <= w + 1e-6).map((x) => +x.toFixed(4)))].sort((a, b) => a - b);
}

// --- Upper Stand under the roof (clearance) ----------------------------------------------
const U7 = { C: STAND_EXTENT['L7/C'], RW: STAND_EXTENT['L7/RW'] };
const U7_RISE = 0.483;
/** Floor height of the Upper Stand tread under (x, z), or −Infinity when no Upper Stand row is there. */
export function upperStandFloorY(x, z) {
  const ax = Math.abs(x);
  const onCentre = ax <= (z - FAN_APEX_Z) * TAN_HALF_W;
  const e = onCentre ? U7.C : U7.RW;
  const v = onCentre ? z : worldToUV('RW', ax, z)[1];
  if (v < e.vFront || v > e.vBack + 1.2) return -Infinity;
  if (!onCentre && worldToUV('RW', ax, z)[0] > hallHalfWidth(0) * COS_W + 0.2) return -Infinity; // beyond the side wall
  const rows = Math.min(e.rowLast - e.rowFirst, Math.floor((v - e.vFront) / ROW_TREAD));
  return e.yFront + U7_RISE * rows;
}

/**
 * Underside level of the bottom-chord plane at any plan point: interpolated between the two
 * neighbouring trusses, never less than 2.6 m above an Upper Stand tread. Secondary steel,
 * catwalks, lights and absorbers are placed from this field.
 */
export function bottomY(x, z) {
  const n = TRUSSES.length;
  let y;
  if (x <= TRUSSES[0].x) y = TRUSSES[0].yb(z);
  else if (x >= TRUSSES[n - 1].x) y = TRUSSES[n - 1].yb(z);
  else {
    let i = Math.min(n - 2, Math.max(0, Math.floor((x - TRUSSES[0].x) / PITCH)));
    while (i > 0 && x < TRUSSES[i].x) i--;
    while (i < n - 2 && x > TRUSSES[i + 1].x) i++;
    const a = TRUSSES[i];
    const b = TRUSSES[i + 1];
    const t = (x - a.x) / (b.x - a.x);
    // a truss that has not started yet at this station contributes the level of its own start
    y = a.yb(z) * (1 - t) + b.yb(z) * t;
  }
  return Math.max(y, trussBottomY(z), upperStandFloorY(x, z) + 2.6);
}

// --- pin-spot galleries ------------------------------------------------------------------
const PS = SPEC.production.pinSpotGallery;
export const GALLERY_DEPTH = 2.6; // JATET section: boxes 2.5–2.6 m deep
/**
 * A gallery row follows the three facets of the stands: straight across the centre facet at
 * station zc, then two wings turned 33.6° toward the stage that run to the hall side walls.
 * Returns the centre-line polyline [[x, z] × 4] from house left to house right.
 */
export function galleryPath(zc) {
  const xj = (zc - FAN_APEX_Z) * TAN_HALF_W;
  // wing direction (house right): (cos, −sin); stop 0.25 m short of the side-wall face
  // hallHalfWidth(z) = h0 + s·z  →  xj + c·t = h0 + s·(zc − sn·t) − 0.25
  const t = (hallHalfWidth(zc) - 0.25 - xj) / (COS_W + flankSlope * SIN_W);
  const xe = xj + COS_W * t;
  const ze = zc - SIN_W * t;
  return [
    [-xe, ze],
    [-xj, zc],
    [xj, zc],
    [xe, ze],
  ];
}
export const GALLERIES = Object.freeze([
  Object.freeze({ name: 'row 1', zc: PS.row1CentreY_H, floorY: PS.row1FloorElevation_m, height: PS.row1Height_m, cabins: 4 }),
  Object.freeze({ name: 'row 2', zc: PS.row2CentreY_H, floorY: PS.row2FloorElevation_m, height: PS.row2Height_m, cabins: 4 }),
]);

// --- rigging deck (sunoko) over the stage and the front arena ----------------------------
// Flat technical level at 9FL (the level the trusses bear on at the stage end and the floor
// level of pin-spot gallery row 1). It covers the eight lifting grids of the stage module.
const LG = SPEC.production.liftingGrids;
export const DECK = Object.freeze({
  y: LEVEL_Y[9], // 30.62
  x0: -1.5 * PITCH + 0.35,
  x1: 1.5 * PITCH - 0.35,
  z0: Z0 + 0.7,
  z1: Math.max(...LG.rowCentresY_H) + LG.frameDepth_m / 2 + 1.3, // 32.0
});
export function overDeck(x, z, margin = 0) {
  return x >= DECK.x0 - margin && x <= DECK.x1 + margin && z >= DECK.z0 - margin && z <= DECK.z1 + margin;
}

export { COLUMN_TOP_Y, trussBottomY, trussTopY, roofY };

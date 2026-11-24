// Procedural seat models of K-Arena Yokohama (Kotobuki Seating).
//
// Every model is built facing −Z (toward the stage) with the floor at y = 0 and the seat
// centred on x = 0; z = 0 is the row line (line of seat centres of the official seat map).
// +z is the rear of the chair. Dimensions are metres. Shapes follow the maker's product
// photos (Lux-M, Cadenza TS-71) and the K-Arena case-study photos; the chair sizes are
// ESTIMATED (research/00-consolidated.md 6.6: 0.494 wide, back top 0.95, seat 0.43,
// 0.30 deep folded).
//
// Each function returns { <part>: BufferGeometry } keyed by the material slot it uses.
// `detail` is 'high' or 'low'.
import { MeshBuilder } from './meshbuilder.js';

// --------------------------------------------------------------------------------------
// Lux (general seat: arena, telescopic rows, all stands)
// --------------------------------------------------------------------------------------
export const LUX = Object.freeze({
  width: 0.494, // seat module = centre spacing
  backTop: 0.95,
  shellHalfTop: 0.228,
  cushionHalf: 0.222,
  beamY: [0.195, 0.245],
  beamZ: [0.08, 0.13],
  bracketHalf: 0.019,
  ringY: 0.418,
  ringX: 0.15,
  ringCard: 0.106, // side of the square alpha card that carries one cup-holder ring
});

// Side profile of the back (it leans 10.8° to the rear):
//   R = rear face of the moulded shell, S = front of the shell = back of the pad,
//   F = front of the pad, CR / CF = rear (sitting side) and front (underside) of the
//   tipped-up seat cushion, which rests parallel to the back.
const R = (y) => 0.16 + (y - 0.32) * 0.19;
const SHELL_T = 0.024;
const PAD_T = 0.06;
const CUSH_GAP = 0.012;
const CUSH_T = 0.105;
const S = (y) => R(y) - SHELL_T;
const F = (y) => S(y) - PAD_T;
const CR = (y) => F(y) - CUSH_GAP;
const CF = (y) => CR(y) - CUSH_T;

// the tipped cushion: hinge end at CUSH_Y0, rolled front edge on top at CUSH_Y1
const CUSH_Y0 = 0.355;
const CUSH_Y1 = 0.775;
const PAD_Y0 = 0.36;
const PAD_Y2 = 0.908;
const padHalf = (y) => 0.203 + ((y - PAD_Y0) / (PAD_Y2 - PAD_Y0)) * 0.012;

/** Upholstery of one Lux chair: back pad and the tipped-up seat cushion. */
export function luxFabric(detail = 'high') {
  const b = new MeshBuilder();
  if (detail === 'high') {
    // back pad, top corners clipped (the real pad has about 40 mm corner radii)
    const y0 = PAD_Y0;
    const y1 = 0.868;
    const y2 = PAD_Y2;
    const yT = 0.957;
    const c = 0.04;
    const w0 = padHalf(y0);
    const w1 = padHalf(y1);
    const wT = padHalf(y2) - c;
    const BL = [-w0, y0, F(y0)];
    const BR = [w0, y0, F(y0)];
    const L1 = [-w1, y1, F(y1)];
    const R1 = [w1, y1, F(y1)];
    const TL = [-wT, y2, F(y2)];
    const TR = [wT, y2, F(y2)];
    b.bulge(0.3, () => b.fan([BL, BR, R1, TR, TL, L1], [0, 0.19, -1]));
    const zT = S(yT) - 0.004;
    const TLb = [-(wT - 0.004), yT, zT];
    const TRb = [wT - 0.004, yT, zT];
    b.quad(TL, TR, TRb, TLb, [0, 1, -0.5]); // rolled top edge
    const BLb = [-w0, y0, S(y0)];
    const BRb = [w0, y0, S(y0)];
    const L1b = [-w1, y1, S(y1)];
    const R1b = [w1, y1, S(y1)];
    b.quad(BR, BRb, R1b, R1, [1, 0, 0]);
    b.quad(BL, BLb, L1b, L1, [-1, 0, 0]);
    b.quad(R1, R1b, TRb, TR, [1, 1, -0.3]);
    b.quad(L1, L1b, TLb, TL, [-1, 1, -0.3]);
    // seat cushion, tipped up: A-B underside (faces the stage), B-C-D rolled front edge
    // (on top when tipped), D-E sitting surface (against the back pad, not drawn), E-A hinge end
    const cy0 = CUSH_Y0;
    const cy1 = CUSH_Y1 - 0.04;
    const cy2 = CUSH_Y1;
    const A = [cy0, CF(cy0)];
    const B = [cy1, CF(cy1)];
    const C = [cy2, CF(cy2) + 0.032];
    const D = [cy2 + 0.006, CR(cy2 + 0.006) - 0.012];
    const E = [cy0, CR(cy0)];
    const h = LUX.cushionHalf;
    b.bulge(0.22, () => b.quad([-h, A[0], A[1]], [h, A[0], A[1]], [h, B[0], B[1]], [-h, B[0], B[1]], [0, -0.19, -1]));
    // (the hinge end E-A faces the floor 0.35 m above it and is never seen: left open)
    b.extrudeX([A, B, C, D, E], -LUX.cushionHalf, LUX.cushionHalf, { skipEdges: [0, 3, 4] });
  } else {
    // low: one quad for the pad (it is also the front face of the low shell box),
    // one sloped quad for its top, a 4-sided cushion
    const y0 = 0.33;
    const y2 = 0.925;
    const w = 0.216;
    b.bulge(0.3, () => b.quad([-w, y0, F(y0)], [w, y0, F(y0)], [w, y2, F(y2)], [-w, y2, F(y2)], [0, 0.19, -1]));
    b.quad([-w, y2, F(y2)], [w, y2, F(y2)], [w, 0.95, S(0.95)], [-w, 0.95, S(0.95)], [0, 1, -0.5]);
    const cy0 = CUSH_Y0;
    const cy1 = CUSH_Y1 - 0.02;
    const A = [cy0, CF(cy0)];
    const B = [cy1, CF(cy1)];
    const D = [CUSH_Y1 + 0.005, CR(CUSH_Y1 + 0.005) - 0.012];
    const E = [cy0, CR(cy0)];
    b.extrudeX([A, B, D, E], -LUX.cushionHalf, LUX.cushionHalf, { skipEdges: [2, 3] });
  }
  return b.build({ crease: 56 });
}

/** Moulded rear shell of the back. */
export function luxShell(detail = 'high') {
  const b = new MeshBuilder();
  const y0 = 0.33;
  const yT = LUX.backTop;
  if (detail === 'high') {
    const c = 0.04;
    const w0 = padHalf(y0) + 0.013;
    const w1 = padHalf(yT - c) + 0.013;
    const wT = LUX.shellHalfTop - c;
    const ring = (fz) => [
      [-w0, y0, fz(y0)],
      [w0, y0, fz(y0)],
      [w1, yT - c, fz(yT - c)],
      [wT, yT, fz(yT)],
      [-wT, yT, fz(yT)],
      [-w1, yT - c, fz(yT - c)],
    ];
    const rear = ring(R);
    const front = ring(S);
    b.bulge(0.4, () => b.fan(rear, [0, -0.19, 1]));
    b.fan(front, [0, 0.19, -1]);
    b.quad(rear[1], front[1], front[2], rear[2], [1, 0, 0]);
    b.quad(rear[0], front[0], front[5], rear[5], [-1, 0, 0]);
    b.quad(rear[2], front[2], front[3], rear[3], [1, 1, 0]);
    b.quad(rear[5], front[5], front[4], rear[4], [-1, 1, 0]);
    b.quad(rear[4], rear[3], front[3], front[4], [0, 1, 0]);
  } else {
    const w = 0.216;
    b.bulge(0.4, () => b.quad([-w, y0, R(y0)], [w, y0, R(y0)], [w, yT, R(yT)], [-w, yT, R(yT)], [0, -0.19, 1]));
    b.quad([w, y0, F(y0)], [w, y0, R(y0)], [w, yT, R(yT)], [w, yT, S(yT)], [1, 0, 0]);
    b.quad([-w, y0, F(y0)], [-w, y0, R(y0)], [-w, yT, R(yT)], [-w, yT, S(yT)], [-1, 0, 0]);
    b.quad([-w, yT, S(yT)], [w, yT, S(yT)], [w, yT, R(yT)], [-w, yT, R(yT)], [0, 1, 0]);
  }
  return b.build({ crease: 30 });
}

// UV rectangles of the fittings atlas (see textures.js)
const RING_UV = { u0: 0.006, u1: 0.494 };
const TAG_UV = { u0: 0.508, u1: 0.992 };

function ringCard(b, cx, y, zNear, dir) {
  // square card lying flat; v = 0 at zNear (the side the stem points to), ring further along dir
  const h = LUX.ringCard / 2;
  const zFar = zNear + dir * LUX.ringCard;
  b.quad(
    [cx - h, y, zNear],
    [cx + h, y, zNear],
    [cx + h, y, zFar],
    [cx - h, y, zFar],
    [0, 1, 0],
    [
      [RING_UV.u0, 0.004],
      [RING_UV.u1, 0.004],
      [RING_UV.u1, 0.996],
      [RING_UV.u0, 0.996],
    ],
  );
}

/**
 * Fittings on the back of every Lux chair: two fold-out cup-holder rings low on the rear
 * shell (for the row behind) and the seat-number tag on the top edge. Alpha-tested cards
 * that use the built-in atlas of the 'seat.fittings' material.
 */
export function luxFittings() {
  const b = new MeshBuilder();
  const y = LUX.ringY;
  for (const sx of [-1, 1]) ringCard(b, sx * LUX.ringX, y, R(y) - 0.004, 1);
  const yTag = LUX.backTop + 0.0035;
  const zc = (S(LUX.backTop) + R(LUX.backTop)) / 2;
  b.quad(
    [-0.033, yTag, zc + 0.009],
    [0.033, yTag, zc + 0.009],
    [0.033, yTag, zc - 0.009],
    [-0.033, yTag, zc - 0.009],
    [0, 1, 0],
    [
      [TAG_UV.u0, 0.02],
      [TAG_UV.u1, 0.02],
      [TAG_UV.u1, 0.98],
      [TAG_UV.u0, 0.98],
    ],
  );
  return b.build({ crease: 1 });
}

// a texel in the opaque black part of the fittings atlas (the stem of the ring tile)
const ATLAS_BLACK = [0.25, 0.035];

function cupArm({ y, zBack, zRing, depth, bottom }) {
  const b = new MeshBuilder();
  b.constUV = ATLAS_BLACK;
  const r = 0.0445;
  // flat bar from between the chairs to the ring
  b.box(-0.015, 0.015, y - 0.016, y, zRing + r - 0.004, zBack, ['-z', '+z']);
  // ring wall (double-sided material) with the alpha card as its top rim
  b.tubeY(0, zRing, r - 0.004, r, y - depth, y, 8, { bottom });
  ringCard(b, 0, y + 0.001, zRing + r * (0.56 / 0.42), -1);
  return b.build({ crease: 50 });
}

/**
 * Cup holder of a front-row seat: a black arm that comes forward between two chairs at
 * 0.62 m with a ring at its end (Travel Watch photo 017). Modelled on the seat boundary
 * (x = 0). Uses the double-sided 'seat.fittings' material (atlas black + alpha ring card).
 */
export function luxCupArm() {
  return cupArm({ y: 0.628, zBack: 0.06, zRing: -0.145, depth: 0.03, bottom: false });
}

/**
 * Aisle-end armrest of the movable arena rows: a longer bar with a deep cup at the front
 * (Kotobuki case-study animations of the caster seats and the Matrix System).
 */
export function arenaEndArm() {
  return cupArm({ y: 0.628, zBack: 0.12, zRing: -0.15, depth: 0.085, bottom: true });
}

/** Light-grey cast pivot bracket between two chairs (x = 0 is the seat boundary). */
export function luxBracket(detail = 'high') {
  const b = new MeshBuilder();
  const t = LUX.bracketHalf;
  // pivot hub beside the hinge end of the cushion, arm down and back to the beam
  const A = [0.425, CF(0.425) - 0.004];
  const B = [0.425, 0.07];
  const C = [LUX.beamY[1], LUX.beamZ[1]];
  const D = [LUX.beamY[1], LUX.beamZ[0] - 0.045];
  if (detail === 'high') b.extrudeX([A, B, C, D], -t, t, { skipEdges: [1, 2] });
  else b.extrudeX([A, B, C, D], -t, t, { skipEdges: [1, 2], caps: 'none' });
  return b.build({ crease: 30 });
}

/** Black steel floor leg under the beam of a fixed / telescopic row (x = 0 = seat boundary). */
export function luxLeg() {
  const b = new MeshBuilder();
  b.box(-0.022, 0.022, 0.012, LUX.beamY[0], 0.078, 0.132, ['-y', '+y']);
  b.box(-0.05, 0.05, 0, 0.012, 0.01, 0.2, ['-y', '-x', '+x']);
  return b.build({ crease: 30 });
}

/**
 * Arena, rows nearest the stage: caster-type movable seats. A long black base with
 * chamfered ends (it hides the retractable casters) and a short post up to the beam.
 */
export function arenaCasterFoot() {
  const b = new MeshBuilder();
  const prof = [
    [0, -0.2],
    [0.055, -0.2],
    [0.095, -0.13],
    [0.095, 0.33],
    [0.055, 0.4],
    [0, 0.4],
  ];
  b.extrudeX(prof, -0.055, 0.055, { skipEdges: [5] });
  b.box(-0.03, 0.03, 0.095, LUX.beamY[0], 0.075, 0.135, ['-y', '+y']);
  return b.build({ crease: 30 });
}

/** Arena, rear rows: "Matrix System" leg frame = aluminium floor rail + black socket post. */
export function arenaMatrixPost() {
  const b = new MeshBuilder();
  b.box(-0.035, 0.035, 0.02, LUX.beamY[0], 0.07, 0.14, ['-y', '+y']);
  return b.build({ crease: 30 });
}
export function arenaMatrixRail(rowPitch = 0.8245) {
  const b = new MeshBuilder();
  // one row pitch long, so the pieces of consecutive rows chain into a continuous rail
  b.box(-0.04, 0.04, 0, 0.02, 0.3045 - rowPitch, 0.3045, ['-y', '+z']);
  return b.build({ crease: 30 });
}

// --------------------------------------------------------------------------------------
// Cadenza TS-71 (balcony: vermilion + dark walnut) and the VIP-box chair (same body)
// --------------------------------------------------------------------------------------
export const CADENZA = Object.freeze({
  width: 0.553,
  backTop: 0.985,
  armTop: 0.598,
  cushionHalf: 0.238,
  standardHalf: 0.02,
});

// rear surface of the curved wood back: [y, z]
const CB = [
  [0.27, 0.15],
  [0.45, 0.158],
  [0.62, 0.185],
  [0.8, 0.232],
  [0.945, 0.281],
  [0.985, 0.295],
];
const WOOD_T = 0.018;
const cadHalf = (y) => 0.232 + ((y - 0.27) / (0.985 - 0.27)) * 0.026;
function cadRearZ(y) {
  for (let i = 0; i < CB.length - 1; i++) {
    if (y <= CB[i + 1][0] || i === CB.length - 2) {
      const t = (y - CB[i][0]) / (CB[i + 1][0] - CB[i][0]);
      return CB[i][1] + (CB[i + 1][1] - CB[i][1]) * t;
    }
  }
  return CB[CB.length - 1][1];
}
const cadWoodFrontZ = (y) => cadRearZ(y) - WOOD_T;

/** Curved wood back panel (rounded top corners). */
function cadWoodBack(b, detail) {
  const rows = detail === 'high' ? CB : [CB[0], CB[2], CB[5]];
  const n = rows.length;
  const half = rows.map(([y], i) => cadHalf(y) - (detail === 'high' && i === n - 1 ? 0.035 : 0));
  for (let i = 0; i < n - 1; i++) {
    const [ya, za] = rows[i];
    const [yb, zb] = rows[i + 1];
    const wa = half[i];
    const wb = half[i + 1];
    b.quad([-wa, ya, za], [wa, ya, za], [wb, yb, zb], [-wb, yb, zb], [0, -0.2, 1]);
    b.quad([-wa, ya, za - WOOD_T], [wa, ya, za - WOOD_T], [wb, yb, zb - WOOD_T], [-wb, yb, zb - WOOD_T], [0, 0.2, -1]);
    const top = wb < wa - 0.01 ? 1 : 0;
    b.quad([wa, ya, za], [wa, ya, za - WOOD_T], [wb, yb, zb - WOOD_T], [wb, yb, zb], [1, top, 0]);
    b.quad([-wa, ya, za], [-wa, ya, za - WOOD_T], [-wb, yb, zb - WOOD_T], [-wb, yb, zb], [-1, top, 0]);
  }
  const [yt, zt] = rows[n - 1];
  const wt = half[n - 1];
  b.quad([-wt, yt, zt], [wt, yt, zt], [wt, yt, zt - WOOD_T], [-wt, yt, zt - WOOD_T], [0, 1, 0]);
  const [y0, z0] = rows[0];
  b.quad([-half[0], y0, z0], [half[0], y0, z0], [half[0], y0, z0 - WOOD_T], [-half[0], y0, z0 - WOOD_T], [0, -1, 0]);
}

/** Upholstered back pad, a pillow set into the wood panel. */
function cadPad(b, detail) {
  const ys = detail === 'high' ? [0.4, 0.62, 0.8, 0.915] : [0.4, 0.66, 0.915];
  const th = 0.058;
  const inset = 0.03;
  const outer = (y) => cadHalf(y) - 0.018;
  const fz = (y) => cadWoodFrontZ(y) - th;
  for (let i = 0; i < ys.length - 1; i++) {
    const ya = ys[i];
    const yb = ys[i + 1];
    const ia = outer(ya) - inset;
    const ib = outer(yb) - inset;
    b.quad([-ia, ya, fz(ya)], [ia, ya, fz(ya)], [ib, yb, fz(yb)], [-ib, yb, fz(yb)], [0, 0.2, -1]);
    for (const s of [-1, 1]) {
      b.quad(
        [s * ia, ya, fz(ya)],
        [s * outer(ya), ya, cadWoodFrontZ(ya)],
        [s * outer(yb), yb, cadWoodFrontZ(yb)],
        [s * ib, yb, fz(yb)],
        [s, 0, -0.4],
      );
    }
  }
  // rolled top
  const yf = ys[ys.length - 1];
  const yT = 0.957;
  const iw = outer(yf) - inset;
  const tw = outer(yT) - 0.02;
  b.quad([-iw, yf, fz(yf)], [iw, yf, fz(yf)], [tw, yT, cadWoodFrontZ(yT)], [-tw, yT, cadWoodFrontZ(yT)], [0, 1, -0.5]);
  for (const s of [-1, 1]) {
    b.tri([s * iw, yf, fz(yf)], [s * outer(yf), yf, cadWoodFrontZ(yf)], [s * tw, yT, cadWoodFrontZ(yT)], [s, 0.6, -0.3]);
  }
}

/**
 * Seat cushion in its empty position. The TS-71 is a counter-weighted tip-up: it rests
 * about 18° short of vertical with the rolled front edge on top, level with the armrests.
 */
function cadCushion(b, detail) {
  const outline =
    detail === 'high'
      ? [
          [0, 0],
          [0.4, 0],
          [0.445, -0.022],
          [0.46, -0.07],
          [0.43, -0.115],
          [0.22, -0.135],
          [0.03, -0.11],
          [0, -0.05],
        ]
      : [
          [0, 0],
          [0.42, 0],
          [0.46, -0.06],
          [0.4, -0.125],
          [0.02, -0.115],
        ];
  const th = (72 * Math.PI) / 180;
  const sy = Math.sin(th);
  const sz = -Math.cos(th);
  const ty = Math.cos(th);
  const tz = Math.sin(th);
  const oy = 0.215;
  const oz = 0.085;
  const prof = outline.map(([s, t]) => [oy + s * sy + t * ty, oz + s * sz + t * tz]);
  b.extrudeX(prof, -CADENZA.cushionHalf, CADENZA.cushionHalf);
}

/** Cadenza chair body: { fabric, wood } (pad + cushion, wood back). */
export function cadenzaSeat(detail = 'high') {
  const fabric = new MeshBuilder();
  cadPad(fabric, detail);
  cadCushion(fabric, detail);
  const wood = new MeshBuilder();
  cadWoodBack(wood, detail);
  return { fabric: fabric.build({ crease: 62 }), wood: wood.build({ crease: 40 }) };
}

function armCap(b, x0, x1, y0, y1, zFront, zBack) {
  // plan outline with a rounded (clipped) front end
  const r = Math.min(0.03, (x1 - x0) / 2);
  const ring = [
    [x0, zBack],
    [x1, zBack],
    [x1, zFront + r],
    [x1 - r * 0.5, zFront],
    [x0 + r * 0.5, zFront],
    [x0, zFront + r],
  ];
  b.fan(ring.map(([x, z]) => [x, y1, z]), [0, 1, 0]);
  b.fan(ring.map(([x, z]) => [x, y0, z]), [0, -1, 0]);
  const cx = (x0 + x1) / 2;
  const cz = (zFront + zBack) / 2;
  for (let i = 0; i < ring.length; i++) {
    const [xa, za] = ring[i];
    const [xb, zb] = ring[(i + 1) % ring.length];
    b.quad([xa, y0, za], [xb, y0, zb], [xb, y1, zb], [xa, y1, za], [(xa + xb) / 2 - cx, 0, (za + zb) / 2 - cz]);
  }
}

/**
 * Standard between two balcony chairs (x = 0 = seat boundary):
 *   steel  black column on a cast foot,
 *   wood   armrest cap,
 *   cup    black cup holder hung in front of the armrest (open top; walls have an inside).
 */
export function cadenzaStandard(detail = 'high') {
  const steel = new MeshBuilder();
  const wood = new MeshBuilder();
  const cup = new MeshBuilder();
  const h = CADENZA.standardHalf;
  const armY0 = CADENZA.armTop - 0.033;
  steel.box(-h, h, 0.045, armY0, 0.035, 0.145, ['-y', '+y']);
  if (detail === 'high') {
    steel.extrudeX(
      [
        [0, -0.075],
        [0.018, -0.075],
        [0.045, 0.02],
        [0.045, 0.16],
        [0.018, 0.255],
        [0, 0.255],
      ],
      -0.032,
      0.032,
      { skipEdges: [5] },
    );
    armCap(wood, -0.03, 0.03, armY0, CADENZA.armTop, -0.17, 0.17);
    // cup holder
    const cz = -0.222;
    const yb = 0.455;
    const yt = armY0 + 0.004;
    cup.tubeY(0, cz, 0.04, 0.047, yb, yt, 8);
    cup.tubeY(0, cz, 0.036, 0.043, yb + 0.006, yt, 8, { bottom: true, inward: true });
    // rim between outer and inner wall, and the lug that hangs it on the arm
    for (let i = 0; i < 8; i++) {
      const a0 = (i / 8) * Math.PI * 2;
      const a1 = ((i + 1) / 8) * Math.PI * 2;
      cup.quad(
        [0.047 * Math.cos(a0), yt, cz + 0.047 * Math.sin(a0)],
        [0.047 * Math.cos(a1), yt, cz + 0.047 * Math.sin(a1)],
        [0.043 * Math.cos(a1), yt, cz + 0.043 * Math.sin(a1)],
        [0.043 * Math.cos(a0), yt, cz + 0.043 * Math.sin(a0)],
        [0, 1, 0],
      );
    }
    cup.box(-0.014, 0.014, yt - 0.05, yt, cz + 0.04, 0.036, ['-z', '+z']);
  } else {
    wood.box(-0.03, 0.03, armY0, CADENZA.armTop, -0.17, 0.17, ['-y']);
  }
  const out = { steel: steel.build({ crease: 30 }), wood: wood.build({ crease: 30 }) };
  if (cup.triangles) out.cup = cup.build({ crease: 50 });
  return out;
}

/** Wood end panel that closes a balcony row at an aisle (x = 0 = centre of the panel). */
export function cadenzaEndPanel() {
  const b = new MeshBuilder();
  b.box(-0.014, 0.014, 0.1, CADENZA.armTop - 0.033, -0.15, 0.17);
  return b.build({ crease: 30 });
}

/**
 * VIP-box chair: the same TS-71 body as a free-standing armchair with its own wood side
 * panels and armrest caps (Kotobuki case-study photo 8). { fabric, wood, steel }.
 */
export function vipSeat(detail = 'high') {
  const fabric = new MeshBuilder();
  cadPad(fabric, detail);
  cadCushion(fabric, detail);
  const wood = new MeshBuilder();
  cadWoodBack(wood, detail);
  const steel = new MeshBuilder();
  const W2 = CADENZA.width / 2;
  const armY0 = 0.575;
  const armY1 = 0.607;
  for (const s of [-1, 1]) {
    const x0 = Math.min(s * (W2 - 0.03), s * W2);
    const x1 = Math.max(s * (W2 - 0.03), s * W2);
    wood.box(x0, x1, 0.07, armY0, -0.16, 0.17, ['+y', '-y']);
    if (detail === 'high') armCap(wood, Math.min(s * (W2 - 0.052), s * W2), Math.max(s * (W2 - 0.052), s * W2), armY0, armY1, -0.185, 0.18);
    else wood.box(x0, x1, armY0, armY1, -0.18, 0.18, ['-y']);
    steel.box(x0 + 0.004, x1 - 0.004, 0, 0.07, -0.1, 0.14, ['+y', '-y']);
  }
  return { fabric: fabric.build({ crease: 62 }), wood: wood.build({ crease: 40 }), steel: steel.build({ crease: 30 }) };
}

/** Small wood side table that bridges two VIP chairs (x = 0 = middle of the gap). */
export function vipTable(width = 0.28) {
  const b = new MeshBuilder();
  const h = width / 2;
  b.box(-h, h, 0.535, 0.565, -0.15, 0.16);
  b.box(-h, h, 0.38, 0.535, 0.135, 0.155, ['+y', '-x', '+x']);
  return b.build({ crease: 30 });
}

// --------------------------------------------------------------------------------------
// Highlight marker
// --------------------------------------------------------------------------------------
/** Box that wraps one seat (lux-sized; scaled for wider chairs). */
export function markerBox() {
  const b = new MeshBuilder();
  b.box(-0.26, 0.26, 0.02, 1.0, -0.08, 0.34);
  return b.build({ crease: 1 });
}
/** Pin floating above the seat: an octahedron pointing down. */
export function markerPin() {
  const b = new MeshBuilder();
  const yTip = 1.25;
  const yMid = 1.75;
  const yTop = 1.95;
  const r = 0.2;
  const ring = [];
  for (let i = 0; i < 8; i++) ring.push([r * Math.cos((i / 8) * Math.PI * 2), yMid, 0.12 + r * Math.sin((i / 8) * Math.PI * 2)]);
  for (let i = 0; i < 8; i++) {
    const a = ring[i];
    const c = ring[(i + 1) % 8];
    b.tri([0, yTip, 0.12], a, c, [a[0] + c[0], -0.3, a[2] + c[2] - 0.24]);
    b.tri([0, yTop, 0.12], a, c, [a[0] + c[0], 1, a[2] + c[2] - 0.24]);
  }
  return b.build({ crease: 1 });
}

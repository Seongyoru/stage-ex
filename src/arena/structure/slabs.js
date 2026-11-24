// Floor slabs of LEVEL 1-9 behind / under the stands and of the backstage block.
// Each slab = 50 mm floor finish (its own material per level) on a 300 mm structural slab
// whose underside is the exposed black soffit of the storey below.
import { frameC, frameW, xJ, RC0, RW0 } from './kit.js';
import { WING_ANGLE } from '../../core/seating.js';
import { SPEC } from '../../core/spec.js';
import { R, Y, wallIn, A_IN, A_ZONE, bandRing, rectRing, CIRC, BS } from './plan.js';

const SIN = Math.sin(WING_ANGLE);
const COS = Math.cos(WING_ANGLE);

/** Rear face of the VIP box rooms built by arena/bowl: glass front 72.3 + room depth 7.0 (model-spec tiers LEVEL 6). */
export const VIP_BACK_Z = (() => {
  const vip = SPEC.tiers.find((t) => t.level === 'LEVEL 6');
  return vip.outerRadius_m - RC0 - 0.48 + vip.rowPitch_m + 0.48 + vip.roomDepth_m; // 79.295
})();

export function slab(kit, ring, holes, yTop, level, floorMat, t = 0.35) {
  kit.prismW(ring, yTop - 0.05, yTop, floorMat, level, { holes, bottom: false });
  kit.prismW(ring, yTop - t, yTop - 0.05, 'soffit', level, { holes, top: false });
}

const both = (fn) => [fn(1), fn(-1)];

// --- openings ---------------------------------------------------------------------------------
/** Shaft interiors of the six 3-5-7 stair cores. */
export function shafts357() {
  const out = [];
  for (const s of [1, -1]) {
    for (const [a0, a1] of CIRC.s357.wing) out.push({ f: frameW(s), s, p0: a0, p1: a1, kind: 'wing' });
    out.push({ f: frameC(s), s, p0: CIRC.s357.centre[0], p1: CIRC.s357.centre[1], kind: 'centre' });
  }
  return out;
}
const hole357 = () => shafts357().map((c) => rectRing(c.f, c.p0 + 0.2, c.p1 - 0.2, R.shaft0 + 0.2, R.shaft1 - 0.2));

export function liftShafts() {
  const out = [];
  for (const s of [1, -1]) {
    out.push({ f: frameW(s), s, p0: CIRC.liftWing[0], p1: CIRC.liftWing[1], q0: R.shaft0, q1: R.shaft1, kind: 'wing' });
    out.push({ f: frameW(s), s, p0: CIRC.liftFlank.a[0], p1: CIRC.liftFlank.a[1], q0: CIRC.liftFlank.r[0], q1: CIRC.liftFlank.r[1], kind: 'flank' });
  }
  return out;
}
const holeLifts = (kinds = ['wing']) =>
  liftShafts()
    .filter((l) => kinds.includes(l.kind))
    .map((l) => rectRing(l.f, l.p0 + 0.2, l.p1 - 0.2, l.q0 + 0.2, l.q1 - 0.2));

/** Openings of the four LEVEL 1-3 stairs between apothems r0 and r1. */
const hole13 = (z0, z1) => {
  const out = [];
  for (const s of [1, -1]) for (const x of CIRC.s13.xs) out.push(rectRing(frameC(s), x - CIRC.s13.width / 2 - 0.12, x + CIRC.s13.width / 2 + 0.12, z0 + RC0, z1 + RC0));
  return out;
};

/**
 * Flank service zone between the hall side wall and the outer flank wall, as a world ring.
 * `recess` notches it around the recessed opening of the flank facade (LEVEL 6 / 7).
 */
function flankStrip(s, rEnd, recess = false, zStart = BS.z1) {
  const f = frameW(s);
  const rAt = (a) => RW0 + (zStart + a * SIN) / COS;
  const k = CIRC.flankRecess;
  const outer = recess ? [f.pt(A_IN, k.r[0]), f.pt(k.a, k.r[0]), f.pt(k.a, k.r[1]), f.pt(A_IN, k.r[1])] : [];
  return [f.pt(A_ZONE, rAt(A_ZONE)), f.pt(A_IN, rAt(A_IN)), ...outer, f.pt(A_IN, rEnd), f.pt(A_ZONE, rEnd)];
}

/** Backstage block floor plate (with the notch of the stage-end facade on the axis). */
export function backstageRing() {
  const w0 = BS.halfWidth(BS.z0);
  const w1 = BS.halfWidth(BS.z1);
  return [
    [BS.notchHalf, BS.z0],
    [w0, BS.z0],
    [w1, BS.z1],
    [-w1, BS.z1],
    [-w0, BS.z0],
    [-BS.notchHalf, BS.z0],
    [-BS.notchHalf, BS.notchZ],
    [BS.notchHalf, BS.notchZ],
  ];
}

/** LEVEL 4 mezzanine outline (world ring): arms on both diagonals joined by the stair landing. */
export function l4Ring() {
  const g = CIRC.grand;
  const r0 = R.l3Gate + 0.4;
  const aEnd = 31.2;
  const zEdge = R.l4Edge - RC0;
  const zLand = g.rTop - RC0;
  const xE = 21.36; // column line between bay D (void) and bay E (mezzanine)
  const st = CIRC.s34;
  const half = (s) => {
    const W = frameW(s);
    return [W.pt(aEnd, r0), W.pt(aEnd, R.l4Edge), [s * xJ(R.l4Edge), zEdge], [s * (st.x + st.width / 2 + 0.1), zEdge], [s * (st.x + st.width / 2 + 0.1), zEdge - 16 * st.going - 0.05], [s * (st.x - st.width / 2 - 0.1), zEdge - 16 * st.going - 0.05], [s * (st.x - st.width / 2 - 0.1), zEdge], [s * xE, zEdge], [s * xE, zLand]];
  };
  const right = half(1);
  const left = half(-1).reverse();
  return [...right, ...left, [-xJ(r0), r0 - RC0], [xJ(r0), r0 - RC0]];
}

export function buildSlabs(kit) {
  const s13 = CIRC.s13;

  // LEVEL 1: public arena concourse under the Lower Stand, back of house beyond it
  kit.prismW(bandRing({ rc0: R.arenaWall + 0.35, r1: 100.2 }), -0.2, 0.02, 'floorSealed', 1, { bottom: false });
  kit.prismW(bandRing({ rc0: 100.2, r1: wallIn(0) }), -0.2, 0.02, 'floorBoh', 1, { bottom: false });

  // LEVEL 2: back of house under the main foyer
  slab(kit, bandRing({ rc0: 93.3, r1: wallIn(0) }), [...hole13(...s13.open2), ...holeLifts()], Y[2], 2, 'floorBoh');

  // LEVEL 3: main foyer, wing concourses, the cross-aisle behind the Lower Stand, glass box
  // (the 3 m cross-aisle directly behind row 29 is part of the stand, built by arena/bowl)
  // (the 3 m cross-aisle behind row 29 and the wall behind it, 0.3 m, are built by arena/bowl)
  slab(kit, bandRing({ rc0: R.l3Back + 3.3, r1: wallIn(0), box: true }), [...hole13(...s13.open3), ...holeLifts()], Y[3], 3, 'floorFoyer');

  // LEVEL 4: mezzanine
  slab(kit, l4Ring(), [], Y[4], 4, 'floorSealed', 0.3);

  // LEVEL 5: Middle Stand concourse + centre block band + Lounge 5 floor
  {
    const s45 = CIRC.s45;
    const e = CIRC.esc;
    const holes = [
      ...hole357(),
      ...holeLifts(),
      ...both((s) => rectRing(frameC(s), e.comb0 - 0.25, e.comb0 + e.run + 0.25, e.r0, e.r1)),
      ...s45.xs.flatMap((x) => both((s) => rectRing(frameC(s), x - s45.width / 2 - 0.1, x + s45.width / 2 + 0.1, s45.r0 - 0.1, s45.r0 + 15 * s45.going))),
    ];
    slab(kit, bandRing({ rc0: R.l5BackC, rw0: R.l5BackW, r1: wallIn(0), box: true }), holes, Y[5], 5, 'floorSealed');
  }

  // LEVEL 6: VIP floor shell. The 11 box rooms themselves (floor, dividing walls, rear wall at
  // z = 79.3-79.5) are built by arena/bowl (vip.js): the slab is notched around them.
  {
    const ring = bandRing({ rc0: R.l6Front, rw0: R.l5BackW + 0.3, r1: wallIn(0), box: true });
    const z0 = R.l6Front - RC0;
    const zV = VIP_BACK_Z + 0.21;
    const i = ring.findIndex((p) => Math.abs(p[0] + xJ(R.l6Front)) < 1e-6 && Math.abs(p[1] - z0) < 1e-6);
    ring.splice(i + 1, 0, [-30.16, z0], [-30.16, zV], [30.16, zV], [30.16, z0]);
    slab(kit, ring, [...hole357(), ...holeLifts()], Y[6], 6, 'floorVipShell');
  }

  // LEVEL 7: Upper Stand concourse + Arena Bar 7 floor
  slab(kit, bandRing({ rc0: R.l7Gate, r1: wallIn(Y[7]), box: true }), [...hole357(), ...holeLifts()], Y[7], 7, 'floorDark');

  // LEVEL 8 / 9: plant
  slab(kit, bandRing({ rc0: R.shaft1 + 0.2, r1: wallIn(Y[8]), box: true }), [], Y[8], 8, 'floorBoh', 0.3);
  slab(kit, bandRing({ rc0: 120.5, r1: wallIn(Y[9]) - 0.3 }), [], Y[9], 9, 'floorBoh', 0.3);

  // flank service zones (between the hall side wall and the outer flank wall)
  for (const s of [1, -1]) {
    const lf = CIRC.liftFlank;
    const hole = [rectRing(frameW(s), lf.a[0] + 0.2, lf.a[1] - 0.2, lf.r[0] + 0.2, lf.r[1] - 0.2)];
    slab(kit, flankStrip(s, R.l3Back + 3.3), hole, Y[3], 3, 'floorBoh', 0.3);
    slab(kit, flankStrip(s, R.l5BackW), hole, Y[5], 5, 'floorBoh', 0.3);
    slab(kit, flankStrip(s, R.l5BackW + 0.3, true), hole, Y[6], 6, 'floorBoh', 0.3);
    slab(kit, flankStrip(s, R.l7Gate, true), hole, Y[7], 7, 'floorDark', 0.3);
  }

  // backstage block: ground slab + five floors
  const bs = backstageRing();
  const lb = CIRC.liftBackstage;
  const bsHoles = [
    [
      [lb.x[0] + 0.2, lb.z[0] + 0.2],
      [lb.x[1] - 0.2, lb.z[0] + 0.2],
      [lb.x[1] - 0.2, lb.z[1] - 0.2],
      [lb.x[0] + 0.2, lb.z[1] - 0.2],
    ],
    ...both((s) => rectRing(frameC(s), BS_STAIR.x[0] + 0.2, BS_STAIR.x[1] - 0.2, BS_STAIR.z[0] + 0.2 + RC0, BS_STAIR.z[1] - 0.2 + RC0)),
  ];
  kit.prismW(bs, -0.2, 0.02, 'floorBoh', 1, { bottom: false });
  for (const lv of BS.levels) slab(kit, bs, bsHoles, Y[lv], lv, lv === 9 ? 'floorBoh' : 'floorBackstage', 0.35);
}

/** Backstage stair cores (one each side): plan rectangle |x| × z. */
export const BS_STAIR = Object.freeze({ x: [10.6, 19.6], z: [-34.1, -30.5] });

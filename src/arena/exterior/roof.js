// The roof as a closed lid seen from outside: raised standing-seam roof (top = roofY), the
// steep mid-grey skirts around it, the perimeter band behind the parapets, the low strip over
// the backstage block with rooftop plant, vent hoods, and the 0.6 m thick underside.
// (The eave lip, rim and gutter of the three rear facets are built in eave.js.)
import {
  SC,
  SH,
  T_FLANK,
  DFX,
  DFZ,
  DEX,
  DEZ,
  HIP_K,
  RC,
  RR1,
  RR2,
  RR3,
  S_SKIRT,
  LIP_TOP,
  PARAPET,
  BAND_DROP,
  WALL_T,
  Z,
  roofY,
  FACETS,
  flankFrame,
  obox,
  wbox,
  bar,
  lerp,
  lerp3,
  norm,
  sub,
  cross,
} from './common.js';
import { outerHalfWidth } from '../../core/envelope.js';

const LID_T = 0.6;
const SKIRT_RUN_FLANK = 1.2; // steep faces 67–81° on the flanks and the stage end (PLATEAU LOD2)
const SKIRT_RUN_STAGE = 0.5;
const NOTCH_X = 7.05 / 2 + WALL_T;
const NOTCH_Z = Z.stageEndFacade + 7.86 + WALL_T;

/** Parapet-top model over the whole plan: rises along the axis, blends between the two flanks. */
function parapetAt(x, z) {
  const k = Math.min(Math.max((z - SC[1]) / (SH[1] - SC[1]), 0), 1);
  const hw = Math.max(outerHalfWidth(Math.min(Math.max(z, SC[1]), SH[1])), 1);
  const w = Math.min(Math.max((x / hw + 1) / 2, 0), 1);
  return lerp(lerp(PARAPET[-1][0], PARAPET[-1][1], k), lerp(PARAPET[1][0], PARAPET[1][1], k), w);
}
/** Perimeter band (gutter / walkway) behind the parapets: one gently tilted plane. */
export const bandY = (x, z) => parapetAt(x, z) - BAND_DROP;

function lineHit(p, d, q, e) {
  // p + λ d = q + μ e  (2D)
  const den = d[0] * e[1] - d[1] * e[0];
  const l = ((q[0] - p[0]) * e[1] - (q[1] - p[1]) * e[0]) / den;
  return [p[0] + d[0] * l, p[1] + d[1] * l];
}

/** Plan points of the house-right half; mirror with mx(). */
export const ROOF_PLAN = (() => {
  const dR = norm([RR2[0] - RR1[0], 0, RR2[1] - RR1[1]]);
  const dRr = [dR[0], dR[2]];
  const nR = [dRr[1], -dRr[0]];
  const A1 = [RR1[0] + nR[0] * SKIRT_RUN_FLANK, RR1[1] + nR[1] * SKIRT_RUN_FLANK];
  const NR = [DEZ, -DEX];
  const B1 = [SH[0] - NR[0] * S_SKIRT, SH[1] - NR[1] * S_SKIRT];
  const zStage = RR1[1] - SKIRT_RUN_STAGE;
  const zIn = SC[1] + WALL_T;
  const F1 = [A1[0] + (dRr[0] * (zStage - A1[1])) / dRr[1], zStage];
  const F0 = [A1[0] + (dRr[0] * (zIn - A1[1])) / dRr[1], zIn];
  const F2 = lineHit(A1, dRr, B1, [DEX, DEZ]);
  const F3 = [RC[0] - HIP_K * S_SKIRT, RC[1] - S_SKIRT];
  // parapet inner line of the flank
  const NF = [DFZ, -DFX];
  const qAt = (t) => [SC[0] + DFX * t - NF[0] * WALL_T, SC[1] + DFZ * t - NF[1] * WALL_T];
  const Q0 = [qAt(0)[0] + (DFX * (zIn - qAt(0)[1])) / DFZ, zIn];
  const Q1 = qAt(T_FLANK - S_SKIRT);
  // start of the short ramp where the flank band rises to the level of the eave rim
  const RAMP = 10;
  const F2r = [F2[0] - dRr[0] * RAMP, F2[1] - dRr[1] * RAMP];
  const Q1r = qAt(T_FLANK - S_SKIRT - RAMP);
  return { F0, F1, F2, F3, Q0, Q1, F2r, Q1r, zStage, zIn };
})();

const P = ROOF_PLAN;
const mx = (p, sg) => [sg * p[0], p[1]];
const v3 = (p, y) => [p[0], y, p[1]];

/** Lip-top elevation of the side facet of side sg at a plan point near its foot line. */
function sideLip(sg, p) {
  const fc = FACETS.find((f) => f.sg === sg);
  const a = (p[0] - fc.P0[0]) * fc.E[0] + (p[1] - fc.P0[1]) * fc.E[1];
  const f = (a - fc.a0(S_SKIRT)) / (fc.a1(S_SKIRT) - fc.a0(S_SKIRT));
  return fc.lip(Math.min(Math.max(f, 0), 1));
}

function raisedRoof(col) {
  const top = col.geo('roof.standingSeamLight', { part: 'raised roof' });
  const under = col.geo('roof.underside', { part: 'roof lid underside' });
  const stations = [];
  const N1 = 12;
  const N2 = 4;
  for (let i = 0; i <= N1; i++) stations.push(lerp(RR1[1], RR2[1], i / N1));
  for (let i = 1; i <= N2; i++) stations.push(lerp(RR2[1], RR3[1], i / N2));
  const halfW = (z) => (z <= RR2[1] ? lerp(RR1[0], RR2[0], (z - RR1[1]) / (RR2[1] - RR1[1])) : lerp(RR2[0], RR3[0], (z - RR2[1]) / (RR3[1] - RR2[1])));
  const crownHalf = (z) => 22.3 + (38.3 - 22.3) * Math.min(Math.max((z - Z.raisedRoofStart) / (Z.columnLine - Z.raisedRoofStart), 0), 1);
  const row = (z) => {
    const w = halfW(z);
    const c = Math.min(crownHalf(z), w);
    return [-w, -(w + c) / 2, -c, -c / 2, 0, c / 2, c, (w + c) / 2, w].map((x) => [x, z]);
  };
  for (let j = 0; j < stations.length - 1; j++) {
    const a = row(stations[j]);
    const b = row(stations[j + 1]);
    for (let i = 0; i < a.length - 1; i++) {
      const q = [a[i], a[i + 1], b[i + 1], b[i]];
      const pts = q.map((p) => v3(p, roofY(p[0], p[1])));
      top.quad(pts[0], pts[1], pts[2], pts[3], [0, 1, 0], { uv: q });
      const low = pts.map((p) => [p[0], p[1] - LID_T, p[2]]);
      under.quad(low[0], low[1], low[2], low[3], [0, -1, 0], { uv: q });
    }
  }
}

/** Ruled skirt face between a foot edge and a top edge, with standing-seam ribs. */
function skirt(col, f0, f1, t0, t1, detail) {
  const face = col.geo('roof.skirtSeam', { part: 'roof skirt' });
  const n = norm(cross(sub(f1, f0), sub(t0, f0)));
  const hint = n[1] < 0 ? n.map((x) => -x) : n;
  face.quad(f0, f1, t1, t0, hint);
  // inner lining: closes the roof against the hall and gives the upstand a thickness
  const inn = (p) => [p[0] - hint[0] * 0.3, p[1] - hint[1] * 0.3, p[2] - hint[2] * 0.3];
  col.geo('roof.underside', { part: 'roof lid underside' }).quad(inn(f0), inn(f1), inn(t1), inn(t0), hint.map((x) => -x));
  // flashing along the edge of the raised roof
  bar(col.geo('roof.ridgeCap', { part: 'roof edge flashing' }), [t0[0], t0[1] + 0.05, t0[2]], [t1[0], t1[1] + 0.05, t1[2]], 0.35, 0.16);
  if (!detail) return;
  const rib = col.geo('roof.seamRib', { part: 'skirt seams' });
  const L = Math.hypot(f1[0] - f0[0], f1[2] - f0[2]);
  const count = Math.max(2, Math.round(L / 0.6));
  for (let i = 0; i <= count; i++) {
    const k = i / count;
    const a = lerp3(f0, f1, k);
    const b = lerp3(t0, t1, k);
    const up = hint;
    bar(rib, [a[0] + up[0] * 0.04, a[1] + up[1] * 0.04, a[2] + up[2] * 0.04], [b[0] + up[0] * 0.04, b[1] + up[1] * 0.04, b[2] + up[2] * 0.04], 0.05, 0.09, hint);
  }
}

function skirts(col, detail) {
  const rr = (p) => v3(p, roofY(p[0], p[1]));
  const c0 = [0, P.zStage];
  const r0 = [0, RR1[1]];
  const cRear = [0, P.F3[1]];
  const rRear = [0, RR3[1]];
  for (const sg of [1, -1]) {
    const F1 = mx(P.F1, sg);
    const F2 = mx(P.F2, sg);
    const F3 = mx(P.F3, sg);
    const R1 = mx(RR1, sg);
    const R2 = mx(RR2, sg);
    const R3 = mx(RR3, sg);
    const yF1 = bandY(F1[0], F1[1]);
    const yF2 = sideLip(sg, F2);
    // stage end (half), flank, side facet, rear centre (half)
    skirt(col, v3(c0, bandY(0, c0[1])), v3(F1, yF1), rr(r0), rr(R1), detail);
    // the flank skirt follows the band, then ramps up to the eave rim over the last 10 m
    const F2r = mx(P.F2r, sg);
    const k = Math.hypot(F2r[0] - F1[0], F2r[1] - F1[1]) / Math.hypot(F2[0] - F1[0], F2[1] - F1[1]);
    const Rm = [lerp(R1[0], R2[0], k), lerp(R1[1], R2[1], k)];
    const yF2r = bandY(F2r[0], F2r[1]);
    skirt(col, v3(F1, yF1), v3(F2r, yF2r), rr(R1), rr(Rm), detail);
    skirt(col, v3(F2r, yF2r), v3(F2, yF2), rr(Rm), rr(R2), detail);
    skirt(col, v3(F2, yF2), v3(F3, LIP_TOP), rr(R2), rr(R3), detail);
    skirt(col, v3(F3, LIP_TOP), v3(cRear, LIP_TOP), rr(R3), rr(rRear), detail);
  }
}

function bands(col) {
  const band = col.geo('roof.perimeterBand', { part: 'perimeter band' });
  const under = col.geo('roof.underside', { part: 'roof lid underside' });
  const UPN = [0, 1, 0];
  const put = (pts) => {
    // fan from the first point (convex or mildly concave polygons)
    for (let i = 1; i < pts.length - 1; i++) {
      band.tri(pts[0], pts[i], pts[i + 1], UPN, [pts[0][0], pts[0][2]], [pts[i][0], pts[i][2]], [pts[i + 1][0], pts[i + 1][2]]);
      const lo = (p) => [p[0], p[1] - 0.4, p[2]];
      under.tri(lo(pts[0]), lo(pts[i]), lo(pts[i + 1]), [0, -1, 0]);
    }
  };
  const b = (p) => v3(p, bandY(p[0], p[1]));
  for (const sg of [1, -1]) {
    const Q0 = mx(P.Q0, sg);
    const F0 = mx(P.F0, sg);
    const F1 = mx(P.F1, sg);
    const F2r = mx(P.F2r, sg);
    const Q1r = mx(P.Q1r, sg);
    const F2 = mx(P.F2, sg);
    const Q1 = mx(P.Q1, sg);
    put([b(Q0), b(F0), b(F1), b(F2r), b(Q1r)]);
    const yq = sideLip(sg, Q1);
    put([b(Q1r), b(F2r), v3(F2, sideLip(sg, F2)), v3(Q1, yq)]);
  }
  // low strip over the backstage block, around the notch
  const F0 = P.F0;
  const F1 = P.F1;
  const zN = NOTCH_Z;
  put([b([NOTCH_X, zN]), b([NOTCH_X, P.zIn]), b(F0), b(F1), b([0, F1[1]]), b([0, zN])]);
  put([b([-NOTCH_X, zN]), b([0, zN]), b([0, F1[1]]), b(mx(F1, -1)), b(mx(F0, -1)), b([-NOTCH_X, P.zIn])]);
}

function plant(col, detail) {
  const unit = col.geo('roof.plant', { part: 'rooftop plant' });
  const louvre = col.geo('roof.plantLouvre', { part: 'plant screens' });
  const cap = col.geo('roof.underside', { part: 'plant caps' });
  // louvred plant enclosures on the low strip, one each side of the notch, with dark flat caps
  for (const sg of [1, -1]) {
    const x0 = sg * 6.2;
    const x1 = sg * 15.6;
    const za = Z.stageEndFacade + 1.6;
    const zb = Z.stageEndFacade + 7.4;
    const y0 = bandY((x0 + x1) / 2, (za + zb) / 2) - 0.05;
    wbox(louvre, Math.min(x0, x1), y0, za, Math.max(x0, x1), y0 + 2.5, zb, 'tu');
    wbox(cap, Math.min(x0, x1) - 0.25, y0 + 2.5, za - 0.25, Math.max(x0, x1) + 0.25, y0 + 2.72, zb + 0.25);
    // air-handling units and ducts behind
    const units = [
      [sg * 4.6, -26.2, 3.2, 2.0, 1.9],
      [sg * 9.4, -25.6, 4.2, 2.2, 2.1],
      [sg * 14.6, -25.8, 3.0, 1.8, 1.6],
      [sg * 19.0, -27.0, 2.4, 1.6, 1.4],
    ];
    for (const [cx, cz, sx, sz, h] of units) {
      const y = bandY(cx, cz) - 0.03;
      wbox(unit, cx - sx / 2, y, cz - sz / 2, cx + sx / 2, y + h, cz + sz / 2, 'u');
      if (detail) wbox(louvre, cx - sx / 2 + 0.2, y + h, cz - sz / 2 + 0.2, cx + sx / 2 - 0.2, y + h + 0.25, cz + sz / 2 - 0.2, 'u');
    }
    if (detail) {
      const y = bandY(sg * 12, -24.2);
      wbox(unit, Math.min(sg * 4, sg * 20), y + 0.5, -24.5, Math.max(sg * 4, sg * 20), y + 1.0, -23.9);
    }
    // long vent hoods on the flank perimeter band (three per side, seen above the parapet)
    const F = flankFrame(sg);
    for (const t of [10.7, 64, 97]) {
      const p = [sg * (SC[0] + DFX * t), SC[1] + DFZ * t];
      const y = bandY(p[0], p[1]) - 0.03;
      obox(unit, F, t - 4.5, t + 4.5, y, y + 1.25, -3.3, -1.5, 'u');
      obox(cap, F, t - 4.7, t + 4.7, y + 1.25, y + 1.4, -3.5, -1.3);
    }
  }
}

function ridgeCap(col) {
  // capping along the axial ridge of the raised roof
  const cap = col.geo('roof.ridgeCap', { part: 'ridge cap' });
  const N = 8;
  for (let i = 0; i < N; i++) {
    const z0 = lerp(RR1[1], RR3[1], i / N);
    const z1 = lerp(RR1[1], RR3[1], (i + 1) / N);
    bar(cap, [0, roofY(0, z0) + 0.08, z0], [0, roofY(0, z1) + 0.08, z1], 0.5, 0.16);
  }
}

/** Coarse grid of expansion joints / cappings seen on the aerial photograph (B10). */
function jointGrid(col) {
  const cap = col.geo('roof.ridgeCap', { part: 'roof joints' });
  const kF = (RR2[0] - RR1[0]) / (RR2[1] - RR1[1]);
  const kD = (RR2[0] - RR3[0]) / (RR3[1] - RR2[1]);
  const halfW = (z) => (z <= RR2[1] ? RR1[0] + kF * (z - RR1[1]) : RR2[0] - kD * (z - RR2[1]));
  const lay = (a, b) => bar(cap, [a[0], roofY(a[0], a[1]) + 0.06, a[1]], [b[0], roofY(b[0], b[1]) + 0.06, b[1]], 0.22, 0.12);
  const PITCH = 17.084; // every second truss line
  for (let k = 1; k * PITCH < RR2[0] - 3; k++)
    for (const sg of [1, -1]) {
      const x = sg * k * PITCH;
      const z0 = Math.abs(x) > RR1[0] ? RR1[1] + (Math.abs(x) - RR1[0]) / kF : RR1[1];
      const z1 = Math.abs(x) > RR3[0] ? RR2[1] + (RR2[0] - Math.abs(x)) / kD : RR3[1];
      const n = Math.max(1, Math.ceil((z1 - z0) / 12));
      for (let i = 0; i < n; i++) lay([x, lerp(z0, z1, i / n)], [x, lerp(z0, z1, (i + 1) / n)]);
    }
  for (let z = RR1[1] + 22.35; z < RR3[1] - 5; z += 22.35) {
    const w = halfW(z) - 0.3;
    const n = Math.ceil(w / 10);
    for (const sg of [1, -1]) for (let i = 0; i < n; i++) lay([(sg * w * i) / n, z], [(sg * w * (i + 1)) / n, z]);
  }
}

export function buildRoof(col, { detail = true } = {}) {
  raisedRoof(col);
  ridgeCap(col);
  if (detail) jointGrid(col);
  skirts(col, detail);
  bands(col);
  plant(col, detail);
}

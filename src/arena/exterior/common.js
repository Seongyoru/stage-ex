// Shared kit of the exterior envelope module: plan constants, wall frames, a small mesh
// accumulator with metric UVs, extruded-polygon / box / sweep helpers and the material table.
// Everything is in WORLD metres (see core/frame.js). Local helper file of arena/exterior.
import * as THREE from 'three';
import { mat, emissiveMat } from '../../core/materials.js';
import { mesh as tagMesh } from '../../core/geom.js';
import { Z, LEVEL_Y, ROOF_OUTLINE, roofY, COLUMNS, GLASS_BOX } from '../../core/envelope.js';
import { SPEC } from '../../core/spec.js';

// ---------------------------------------------------------------------------------------
// vectors (plain arrays)
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a) => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
export const lerp = (a, b, t) => a + (b - a) * t;
export const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const UP = [0, 1, 0];

// ---------------------------------------------------------------------------------------
// plan constants (house-right half; the building is mirrored about x = 0)
export const SC = ROOF_OUTLINE[0]; // stage-end corner  [21.19, −34.7]
export const SH = ROOF_OUTLINE[1]; // shoulder          [91.1, 70.6]
export const RC = ROOF_OUTLINE[2]; // rear corner (eave tip) [41.16, 103.76]
export const T_FLANK = Math.hypot(SH[0] - SC[0], SH[1] - SC[1]); // 126.39 m, flank length
export const DFX = (SH[0] - SC[0]) / T_FLANK; // flank direction (x, z), stage → rear
export const DFZ = (SH[1] - SC[1]) / T_FLANK;
export const DIAG_LEN = Math.hypot(RC[0] - SH[0], RC[1] - SH[1]); // 59.95 m, side facet at the eave tip
export const DEX = (RC[0] - SH[0]) / DIAG_LEN; // side-facet direction, shoulder → rear corner
export const DEZ = (RC[1] - SH[1]) / DIAG_LEN;
/** A point at inward distance s loses HIP_K · s of facet length at a hip (facets turn 33.6°). */
export const HIP_K = Math.tan(Math.acos(-DEX) / 2); // 0.3017

export const FACADE = SPEC.facade;
export const Y3 = LEVEL_Y[3]; // 7.27 deck
export const Y5 = LEVEL_Y[5]; // 12.67
export const Y6 = LEVEL_Y[6]; // 18.07
export const Y7 = LEVEL_Y[7]; // 23.47
export const Y8 = LEVEL_Y[8]; // 28.42
export const WALL_T = 0.4; // outer wall thickness, inward

// flank / stage-end wall
export const PLINTH_TOP = Y3; // dark ground storeys up to the deck level
export const BAND_TOP = FACADE.flankWalls.louvreBandTop_m; // 10.3: underside of the white panel volume
export const PANEL_W = 2.85; // flank panel module, see report (44 panels counted along the 126 m flank)
export const PARAPET = {
  // wall-top elevations surveyed by PLATEAU: [stage end, shoulder]; +1 = house right (south-west flank)
  1: [FACADE.flankWalls.southParapetAtStageEnd_m, FACADE.flankWalls.southParapetAtRearCorner_m],
  '-1': [FACADE.flankWalls.northEastParapetAtStageEnd_m, FACADE.flankWalls.northEastParapetAtRearCorner_m],
};
/** Parapet top of the flank wall of side sg (±1) at distance t from the stage-end corner. */
export const parapetY = (sg, t) => lerp(PARAPET[sg][0], PARAPET[sg][1], t / T_FLANK);
export const CORNER_R = 3.0; // rounded stage-end corners

// rear facets: section stations measured inward from the eave tip (s)
export const S_COL = FACADE.eave.projection_m; // 9.0 column line
export const S_WALL = FACADE.rearWall.wallLineInsideEaveEdge_m; // 18.0 LEVEL 3 wall line
export const S_BAY = 16.4; // face of the projecting LEVEL 5 glazed band
export const S_TOP = S_WALL - FACADE.rearWall.inclinedLeanOut_m + 0.2; // 10.8 top of the leaning wall
export const Y_LEAN_TOP = FACADE.rearWall.inclinedTop_m; // 31.3
export const S_JUNC = 11.6; // soffit meets the recessed band above the wall top
export const Y_JUNC = 32.5;
export const Y_BAY0 = Y5 - 0.57; // 12.1 underside of the LEVEL 5 band = dark soffit over the deck walkway
export const LIP_TOP = FACADE.eave.tipTop_m; // 41.8
export const LIP_T = FACADE.eave.tipTop_m - FACADE.eave.tipUnderside_m; // 0.9 lip thickness
export const S_NOSE = LIP_T / 2; // 0.45 radius of the rounded lip
export const S_SKIRT = FACADE.eave.skirtFootInsideTip_m; // 4.8

/** Cove of the eave soffit: drop below the tip underside at distance u inside the nose. */
const coveDrop = (u) => 0.25 * u + 0.1218 * Math.pow(Math.max(u, 0), 1.6);
const COVE_MAX = coveDrop(S_JUNC - S_NOSE);
/** Soffit elevation at inward distance s for a lip-top elevation L (the junction stays level). */
export function soffitY(s, L = LIP_TOP) {
  const k = 1 - coveDrop(s - S_NOSE) / COVE_MAX;
  return Y_JUNC + (L - LIP_T - Y_JUNC) * k;
}

// raised roof (PLATEAU LOD2 key points, symmetrised) — corners of the house-right half
export const RR1 = [22.3, Z.raisedRoofStart]; // stage-end corner
export const RR2 = [81.0, 66.8]; // widest corner
export const RR3 = [38.3, Z.columnLine]; // rear corner on the ridge
export const STRIP_Y = 32.7; // top surface of the low roof strip over the backstage block
export const BAND_DROP = 0.5; // perimeter band below the parapet top

export { Z, LEVEL_Y, roofY, COLUMNS, GLASS_BOX, SPEC };

// ---------------------------------------------------------------------------------------
// wall frames: O origin (world), U along the wall, V up the wall, N outward normal.
export function frame(O, U, N, V = UP) {
  return { O, U: norm(U), V: norm(V), N: norm(N) };
}
export const fpt = (F, u, v, d = 0) => [
  F.O[0] + F.U[0] * u + F.V[0] * v + F.N[0] * d,
  F.O[1] + F.U[1] * u + F.V[1] * v + F.N[1] * d,
  F.O[2] + F.U[2] * u + F.V[2] * v + F.N[2] * d,
];

/** Flank wall frame of side sg: u = distance from the stage-end corner, v = height. */
export function flankFrame(sg, inset = 0) {
  const N = [sg * DFZ, 0, -DFX];
  return frame([sg * SC[0] - N[0] * inset, 0, SC[1] - N[2] * inset], [sg * DFX, 0, DFZ], N);
}
/** Stage-end wall frame: u = world x, v = height, outward −Z. */
export function stageFrame(inset = 0) {
  return frame([0, 0, Z.stageEndFacade + inset], [1, 0, 0], [0, 0, -1]);
}

/**
 * The three rear facets as sweep frames. A point of a facet is
 *   P0 + E·a − N·s + up·y,  a ∈ [a0(s), a1(s)]  (mitred at the hips, square at the flank planes).
 * f ∈ [0, 1] runs along the facet; lip(f) is the top elevation of the eave lip there (it falls
 * from 41.8 at the rear corners to the flank parapet height at the shoulders, PLATEAU LOD2).
 */
export const FACETS = (() => {
  const mk = (key, sg, P0, E, N, length, hip0, hip1, lip) => ({
    key,
    sg,
    P0,
    E,
    N,
    length,
    a0: (s) => (hip0 ? HIP_K * s : 0),
    a1: (s) => length - (hip1 ? HIP_K * s : 0),
    lip,
    pt(f, s, y) {
      const a = lerp(this.a0(s), this.a1(s), f);
      return [P0[0] + E[0] * a - N[0] * s, y, P0[1] + E[1] * a - N[1] * s];
    },
    pa(a, s, y) {
      return [P0[0] + E[0] * a - N[0] * s, y, P0[1] + E[1] * a - N[1] * s];
    },
    /** vertical wall frame at inward distance s (u = a, v = height). */
    frame(s, y0 = 0) {
      return frame([P0[0] - N[0] * s, y0, P0[1] - N[1] * s], [E[0], 0, E[1]], [N[0], 0, N[1]]);
    },
  });
  const N_R = [DEZ, -DEX]; // outward normal of the house-right side facet (0.553, 0.833)
  return [
    mk('R', 1, SH, [DEX, DEZ], N_R, DIAG_LEN, false, true, (f) => lerp(PARAPET[1][1], LIP_TOP, f)),
    mk('C', 0, RC, [-1, 0], [0, 1], 2 * RC[0], true, true, () => LIP_TOP),
    mk('L', -1, [-RC[0], RC[1]], [DEX, -DEZ], [-DEZ, -DEX], DIAG_LEN, true, false, (f) => lerp(LIP_TOP, PARAPET[-1][1], f)),
  ];
})();

// ---------------------------------------------------------------------------------------
// mesh accumulator
function autoUV(p, n) {
  if (Math.abs(n[1]) > 0.9995) return [p[0], p[2]];
  const t = norm(cross(UP, n)); // horizontal tangent
  const b = cross(n, t); // up the slope
  return [dot(p, t), dot(p, b)];
}

/** Triangle soup with metric UVs. Faces are wound to face the hint normal when one is given. */
export class Geo {
  constructor() {
    this.p = [];
    this.uv = [];
    this.nrm = [];
    this.col = [];
    this.smooth = false;
    this.colored = false;
  }
  tri(a, b, c, n, ua, ub, uc, na, nb, nc, ca, cb, cc) {
    let fn = cross(sub(b, a), sub(c, a));
    if (n && dot(fn, n) < 0) {
      [b, c] = [c, b];
      [ub, uc] = [uc, ub];
      [nb, nc] = [nc, nb];
      [cb, cc] = [cc, cb];
      fn = mul(fn, -1);
    }
    const l = len(fn);
    if (l < 1e-10) return;
    fn = mul(fn, 1 / l);
    this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    if (!ua) {
      ua = autoUV(a, fn);
      ub = autoUV(b, fn);
      uc = autoUV(c, fn);
    }
    this.uv.push(ua[0], ua[1], ub[0], ub[1], uc[0], uc[1]);
    const A = na || fn;
    const B = nb || fn;
    const C = nc || fn;
    this.nrm.push(A[0], A[1], A[2], B[0], B[1], B[2], C[0], C[1], C[2]);
    if (ca) {
      this.colored = true;
      this.col.push(ca[0], ca[1], ca[2], cb[0], cb[1], cb[2], cc[0], cc[1], cc[2]);
    }
  }
  /** a-b-c-d around the perimeter. opts: { uv: [ua..ud], nrm: [na..nd], col: [ca..cd] } */
  quad(a, b, c, d, n, o = {}) {
    const u = o.uv || [];
    const m = o.nrm || [];
    const k = o.col || [];
    this.tri(a, b, c, n, u[0], u[1], u[2], m[0], m[1], m[2], k[0], k[1], k[2]);
    this.tri(a, c, d, n, u[0], u[2], u[3], m[0], m[2], m[3], k[0], k[2], k[3]);
  }
  get triangles() {
    return this.p.length / 9;
  }
  toGeometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nrm, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    if (this.colored && this.col.length === this.p.length) g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    return g;
  }
}

function area2(ring) {
  let s = 0;
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i];
    const q = ring[(i + 1) % ring.length];
    s += p[0] * q[1] - q[0] * p[1];
  }
  return s / 2;
}

/**
 * Extruded polygon in a wall frame: `poly` = [[u, v], …] on the outer face (offset `off`
 * along N), thickness t toward −N. Options switch the front / back / edge faces.
 */
export function slab(geo, F, poly, { holes = [], t = WALL_T, off = 0, front = true, back = true, edge = true, holeEdge = true } = {}) {
  const all = [...poly, ...holes.flat()];
  const P = (q, d) => fpt(F, q[0], q[1], d);
  if (front || back) {
    const tris = THREE.ShapeUtils.triangulateShape(
      poly.map(([u, v]) => new THREE.Vector2(u, v)),
      holes.map((h) => h.map(([u, v]) => new THREE.Vector2(u, v))),
    );
    const nb = mul(F.N, -1);
    for (const [i, j, k] of tris) {
      if (front) geo.tri(P(all[i], off), P(all[j], off), P(all[k], off), F.N, all[i], all[j], all[k]);
      if (back && t > 0) geo.tri(P(all[i], off - t), P(all[j], off - t), P(all[k], off - t), nb, all[i], all[j], all[k]);
    }
  }
  if (t <= 0) return;
  const rim = (ring, sign) => {
    for (let i = 0; i < ring.length; i++) {
      const p = ring[i];
      const q = ring[(i + 1) % ring.length];
      const du = q[0] - p[0];
      const dv = q[1] - p[1];
      if (Math.abs(du) < 1e-9 && Math.abs(dv) < 1e-9) continue;
      const n = add(mul(F.U, dv * sign), mul(F.V, -du * sign));
      geo.quad(P(p, off), P(q, off), P(q, off - t), P(p, off - t), n);
    }
  };
  if (edge) rim(poly, area2(poly) > 0 ? 1 : -1);
  if (holeEdge) for (const h of holes) rim(h, area2(h) > 0 ? -1 : 1);
}

/** Axis-aligned rectangle ring in wall coordinates. */
export const rect = (u0, v0, u1, v1) => [
  [u0, v0],
  [u1, v0],
  [u1, v1],
  [u0, v1],
];

/** Box in a wall frame spanning [u0,u1] × [v0,v1] × [d0,d1] (d along the outward normal). */
export function obox(geo, F, u0, u1, v0, v1, d0, d1, skip = '') {
  const c = (u, v, d) => fpt(F, u, v, d);
  const nU = F.U;
  const nV = F.V;
  const nN = F.N;
  if (!skip.includes('f')) geo.quad(c(u0, v0, d1), c(u1, v0, d1), c(u1, v1, d1), c(u0, v1, d1), nN);
  if (!skip.includes('b')) geo.quad(c(u0, v0, d0), c(u1, v0, d0), c(u1, v1, d0), c(u0, v1, d0), mul(nN, -1));
  if (!skip.includes('l')) geo.quad(c(u0, v0, d0), c(u0, v0, d1), c(u0, v1, d1), c(u0, v1, d0), mul(nU, -1));
  if (!skip.includes('r')) geo.quad(c(u1, v0, d0), c(u1, v0, d1), c(u1, v1, d1), c(u1, v1, d0), nU);
  if (!skip.includes('t')) geo.quad(c(u0, v1, d0), c(u1, v1, d0), c(u1, v1, d1), c(u0, v1, d1), nV);
  if (!skip.includes('u')) geo.quad(c(u0, v0, d0), c(u1, v0, d0), c(u1, v0, d1), c(u0, v0, d1), mul(nV, -1));
}

/** World-axis box from (x0, y0, z0) to (x1, y1, z1). */
export function wbox(geo, x0, y0, z0, x1, y1, z1, skip = '') {
  obox(geo, frame([0, 0, 0], [1, 0, 0], [0, 0, 1]), x0, x1, y0, y1, z0, z1, skip);
}

/** Thin flat strip (one face) between two points of a wall frame, `w` wide, `off` proud of the face. */
export function strip(geo, F, p, q, w, off = 0.012) {
  const du = q[0] - p[0];
  const dv = q[1] - p[1];
  const l = Math.hypot(du, dv);
  if (l < 1e-6) return;
  const hx = ((-dv / l) * w) / 2;
  const hy = ((du / l) * w) / 2;
  geo.quad(
    fpt(F, p[0] + hx, p[1] + hy, off),
    fpt(F, q[0] + hx, q[1] + hy, off),
    fpt(F, q[0] - hx, q[1] - hy, off),
    fpt(F, p[0] - hx, p[1] - hy, off),
    F.N,
  );
}

/** Prism bar between two world points with a rectangular section (w across, h along `upN`). */
export function bar(geo, a, b, w, h, upN = UP) {
  const d = norm(sub(b, a));
  let side = cross(d, upN);
  if (len(side) < 1e-6) side = cross(d, [1, 0, 0]);
  side = norm(side);
  const up = norm(cross(side, d));
  const F = frame(a, d, side, up);
  obox(geo, F, 0, len(sub(b, a)), -h / 2, h / 2, -w / 2, w / 2);
}

/**
 * Sweep a section along a rear facet. `prof` = [{ s, y }] where y is a number or a function
 * of the lip elevation L at that place; consecutive points make one ruled strip from f0 to f1.
 * The visible side is on the LEFT of the direction of travel in (s →, y ↑) coordinates.
 */
export function sweep(geo, facet, prof, { f0 = 0, f1 = 1, n = 1, smooth = false, colorOf = null, lift = 0 } = {}) {
  const yOf = (p, f) => (typeof p.y === 'function' ? p.y(facet.lip(f)) : p.y);
  const fm = (f0 + f1) / 2;
  // section normals (s, y) at mid-facet, per segment and averaged per vertex
  const segN = [];
  for (let i = 0; i < prof.length - 1; i++) {
    const ds = prof[i + 1].s - prof[i].s;
    const dy = yOf(prof[i + 1], fm) - yOf(prof[i], fm);
    const l = Math.hypot(ds, dy) || 1;
    segN.push([-dy / l, ds / l]);
  }
  const vertN = prof.map((_, i) => {
    const a = segN[Math.max(i - 1, 0)];
    const b = segN[Math.min(i, segN.length - 1)];
    const l = Math.hypot(a[0] + b[0], a[1] + b[1]) || 1;
    return [(a[0] + b[0]) / l, (a[1] + b[1]) / l];
  });
  const to3 = (m) => [-facet.N[0] * m[0], m[1], -facet.N[1] * m[0]];
  for (let j = 0; j < n; j++) {
    const fa = lerp(f0, f1, j / n);
    const fb = lerp(f0, f1, (j + 1) / n);
    for (let i = 0; i < prof.length - 1; i++) {
      const p = prof[i];
      const q = prof[i + 1];
      const hint = to3(segN[i]);
      const off = (pt, m) => (lift ? add(pt, mul(to3(m), lift)) : pt);
      const A = off(facet.pt(fa, p.s, yOf(p, fa)), vertN[i]);
      const B = off(facet.pt(fb, p.s, yOf(p, fb)), vertN[i]);
      const C = off(facet.pt(fb, q.s, yOf(q, fb)), vertN[i + 1]);
      const D = off(facet.pt(fa, q.s, yOf(q, fa)), vertN[i + 1]);
      const o = {};
      if (smooth) o.nrm = [to3(vertN[i]), to3(vertN[i]), to3(vertN[i + 1]), to3(vertN[i + 1])];
      if (colorOf) {
        const cp = colorOf(p.s);
        const cq = colorOf(q.s);
        o.col = [cp, cp, cq, cq];
      }
      geo.quad(A, B, C, D, hint, o);
    }
  }
}

// ---------------------------------------------------------------------------------------
// materials (colours: fact sheet section 9.1 / model-spec palette.exterior)
/** Thin lines and night overlays lie a few centimetres proud of a surface: bias their depth. */
const PO = { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 };
const MATS = {
  'facade.panelWhite': { color: '#E6E8EA', roughness: 0.55, metalness: 0.05, tile: 2.85 },
  'facade.panelJoint': { color: '#8B9094', roughness: 0.7, metalness: 0, tile: 1, ...PO },
  'facade.ribbedWhite': { color: '#E2E4E6', roughness: 0.5, metalness: 0.1, tile: 1.0 },
  'facade.eaveSoffit': { color: '#E4E5E3', roughness: 0.4, metalness: 0.15, tile: 2.135 },
  'facade.eaveJoint': { color: '#8E9194', roughness: 0.6, metalness: 0.1, tile: 1, ...PO },
  'facade.columnConcrete': { color: '#CFCCC4', roughness: 0.85, metalness: 0, tile: 1.8 },
  'facade.columnJoint': { color: '#A6A39B', roughness: 0.9, metalness: 0, tile: 1, ...PO },
  'facade.stripWindow': { color: '#14171A', roughness: 0.1, metalness: 0.2, tile: 2 },
  'facade.deckWallPanel': { color: '#C9CCCE', roughness: 0.5, metalness: 0.1, tile: 0.6 },
  'facade.kerbConcrete': { color: '#BDBCB7', roughness: 0.85, metalness: 0, tile: 1.5 },
  'facade.walkwaySoffit': { color: '#3A3D40', roughness: 0.6, metalness: 0.1, tile: 1.2 },
  'facade.concourseFrame': { color: '#9DA2A6', roughness: 0.35, metalness: 0.7, tile: 1 },
  'facade.concourseGlass': { color: '#8FB0B8', roughness: 0.06, metalness: 0.1, transparent: true, opacity: 0.32, depthWrite: false, tile: 2 },
  'facade.bayFloor': { color: '#8D8F92', roughness: 0.8, metalness: 0, tile: 1.2 },
  'facade.louvre': { color: '#7E8286', roughness: 0.5, metalness: 0.4, tile: 0.25 },
  'facade.louvreBacking': { color: '#3B3F44', roughness: 0.8, metalness: 0.1, tile: 1 },
  'facade.plinth': { color: '#6C727A', roughness: 0.7, metalness: 0, tile: 3 },
  'facade.baseBand': { color: '#DCDDDD', roughness: 0.6, metalness: 0, tile: 1.2 },
  'facade.recessDark': { color: '#43474C', roughness: 0.75, metalness: 0.05, tile: 2 },
  'facade.galleryRail': { color: '#E3E5E6', roughness: 0.45, metalness: 0.4, tile: 1 },
  'facade.gallerySlab': { color: '#D2D4D6', roughness: 0.6, metalness: 0.05, tile: 2 },
  'facade.shutter': { color: '#8D9297', roughness: 0.5, metalness: 0.5, tile: 0.4 },
  'facade.doorFrame': { color: '#1E2023', roughness: 0.45, metalness: 0.5, tile: 1 },
  'facade.doorGlass': { color: '#5E7780', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.3, depthWrite: false, tile: 2 },
  'facade.doorPull': { color: '#C9CCD0', roughness: 0.25, metalness: 0.9, tile: 1 },
  'facade.floodlight': { color: '#2A2C2E', roughness: 0.5, metalness: 0.5, tile: 1 },
  'glassbox.glass': { color: '#56737F', roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.4, depthWrite: false, tile: 2 },
  'glassbox.mullion': { color: '#8A8F93', roughness: 0.4, metalness: 0.6, tile: 1 },
  'glassbox.fin': { color: '#A3A8AC', roughness: 0.4, metalness: 0.55, tile: 1 },
  'glassbox.spandrel': { color: '#A7ACB0', roughness: 0.4, metalness: 0.45, tile: 1.2 },
  'glassbox.roof': { color: '#7C8185', roughness: 0.7, metalness: 0.1, tile: 2 },
  'roof.standingSeamLight': { color: '#D5D8DB', roughness: 0.45, metalness: 0.3, tile: 1.0 },
  'roof.skirtSeam': { color: '#8F959A', roughness: 0.45, metalness: 0.35, tile: 0.6 },
  'roof.seamRib': { color: '#858B90', roughness: 0.45, metalness: 0.35, tile: 1 },
  'roof.eaveRim': { color: '#DCDEDD', roughness: 0.45, metalness: 0.2, tile: 2 },
  'roof.perimeterBand': { color: '#9EA3A7', roughness: 0.75, metalness: 0.05, tile: 2 },
  'roof.parapetCap': { color: '#D9DBDD', roughness: 0.4, metalness: 0.4, tile: 2 },
  'roof.ridgeCap': { color: '#C9CDD0', roughness: 0.4, metalness: 0.4, tile: 2 },
  'roof.plant': { color: '#A3A8AC', roughness: 0.55, metalness: 0.4, tile: 1.5 },
  'roof.plantLouvre': { color: '#6F7479', roughness: 0.55, metalness: 0.4, tile: 0.3 },
  'roof.underside': { color: '#2B2D30', roughness: 0.9, metalness: 0, tile: 2 },
  'sign.letterWhite': { color: '#FFFFFF', roughness: 0.3, metalness: 0, tile: 1 },
  'sign.letterReturn': { color: '#D8DADC', roughness: 0.4, metalness: 0.3, tile: 1 },
  'sign.frameSteel': { color: '#6F7479', roughness: 0.5, metalness: 0.6, tile: 1 },
  'sign.transomDark': { color: '#26282B', roughness: 0.6, metalness: 0.2, tile: 1 },
};
/** Unlit materials: light sources that only exist at night (they sit in the night group). */
const GLOW = {
  'facade.stripWindowLit': { color: '#22A8FF', ...PO },
  'facade.eaveWashGlow': { color: '#FFF1D6', transparent: true, opacity: 0.36, blending: THREE.AdditiveBlending, depthWrite: false, vertexColors: true, ...PO },
  'facade.columnWashGlow': { color: '#FFE9C4', transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, vertexColors: true, ...PO },
  'facade.floodlightLens': { color: '#FFF4DC', ...PO },
  'facade.concourseLitRed': { color: '#FF5A2E', transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false },
  'glassbox.litInteriorBlue': { color: '#46B4FF', transparent: true, opacity: 0.62, blending: THREE.AdditiveBlending, depthWrite: false },
  'glassbox.litInteriorAmber': { color: '#FFB868', transparent: true, opacity: 0.62, blending: THREE.AdditiveBlending, depthWrite: false },
  'glassbox.litInteriorRed': { color: '#FF5A2E', transparent: true, opacity: 0.62, blending: THREE.AdditiveBlending, depthWrite: false },
  'glassbox.litEntranceWarm': { color: '#FFC79A', transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false },
  'sign.letterLit': { color: '#FFFFFF', ...PO },
};
export const isGlow = (id) => id in GLOW;
export function material(id) {
  if (GLOW[id]) return emissiveMat(id, { ...GLOW[id] });
  if (!MATS[id]) throw new Error(`exterior: unknown material ${id}`);
  return mat(id, { ...MATS[id] });
}
const NO_SHADOW = new Set(['facade.concourseGlass', 'facade.doorGlass', 'glassbox.glass']);

/** Collects triangles per (material, level) and turns them into tagged meshes (one draw call each). */
export class Collector {
  constructor() {
    this.buckets = new Map();
  }
  /** Geo for a material; opts: { level, part } (part only names the mesh after its first user). */
  geo(id, { level, part = '' } = {}) {
    const key = `${id}|${level ?? ''}`;
    let b = this.buckets.get(key);
    if (!b) {
      b = { id, level, part, geo: new Geo() };
      this.buckets.set(key, b);
    }
    return b.geo;
  }
  build(dayGroup, nightGroup) {
    let triangles = 0;
    for (const b of this.buckets.values()) {
      if (!b.geo.triangles) continue;
      triangles += b.geo.triangles;
      const m = material(b.id);
      const glow = isGlow(b.id);
      const transparent = NO_SHADOW.has(b.id);
      const obj = tagMesh(b.geo.toGeometry(), m, {
        name: `exterior ${b.part || b.id}${b.level ? ` L${b.level}` : ''}`,
        layer: 'exterior',
        level: b.level,
        cast: !glow && !transparent,
        receive: !glow,
      });
      if (transparent || m.transparent) obj.renderOrder = glow ? 3 : 2;
      (glow ? nightGroup : dayGroup).add(obj);
    }
    return triangles;
  }
}

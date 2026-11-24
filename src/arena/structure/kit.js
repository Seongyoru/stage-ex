// Building kit of the structure module: plan frames that follow the three facets of the
// fan, a geometry collector that merges everything per (material, level), and the
// primitives the level files are written with (boxes and walls in a plan frame, walls with
// door openings, stair flights, railings, sign quads).
import * as THREE from 'three';
import { box, prism, wall, merge, mesh, metricUV } from '../../core/geom.js';
import { FAN_APEX_Z, WING_ANGLE } from '../../core/seating.js';
import { M } from './materials.js';

export const LAYER = 'structure';

// --- plan frames -------------------------------------------------------------------------
// Everything behind the stands is concentric about the fan apex, so the plan is written in
// "apothem" coordinates: R = perpendicular distance from the apex to a line parallel to
// the facet (the same number on the centre facet and on both wings).
//   centre facet   world z = R − RC0, lateral coordinate = world x
//   wing facet     seat-kernel v = R − RW0, lateral coordinate a = distance along the rows,
//                  growing toward the FAR end of the wing (the flank wall) on both sides
const COS = Math.cos(WING_ANGLE);
const SIN = Math.sin(WING_ANGLE);
export const RC0 = -FAN_APEX_Z; // 32.5948
export const RW0 = RC0 * COS; // 27.149
export const A0 = RC0 * SIN; // 18.038  (lateral coordinate of the apex in a wing frame)
export const T16 = Math.tan(WING_ANGLE / 2); // junction lines are at 16.8° through the apex

/** Half width of the centre facet at apothem R (world |x| of the junction line). */
export const xJ = (R) => R * T16;
/** Lateral coordinate of the junction line in a wing frame at apothem R. */
export const aJ = (R) => A0 - R * T16;

function makeFrame(name, pt, dirP, dirQ) {
  return Object.freeze({
    name,
    pt,
    dirP,
    dirQ,
    /** rotation about +Y that turns world +X into the frame's +p direction */
    rot: Math.atan2(-dirP[1], dirP[0]),
    /** world unit vector for a local direction (dp, dq) */
    dir: (dp, dq) => [dp * dirP[0] + dq * dirQ[0], dp * dirP[1] + dq * dirQ[1]],
  });
}

/** Centre facet, mirrored copy for side s (+1 = house right, −1 = house left): p = |x|, q = R. */
export function frameC(s = 1) {
  return makeFrame(s > 0 ? 'C+' : 'C-', (p, R) => [s * p, R - RC0], [s, 0], [0, 1]);
}
/** Wing facet of side s: p = a (toward the flank), q = R. */
export function frameW(s = 1) {
  return makeFrame(
    s > 0 ? 'RW' : 'LW',
    (a, R) => {
      const v = R - RW0;
      return [s * (a * COS + v * SIN), -a * SIN + v * COS];
    },
    [s * COS, -SIN],
    [s * SIN, COS],
  );
}
/** Plain world frame: p = x, q = z. */
export const frameXZ = makeFrame('XZ', (x, z) => [x, z], [1, 0], [0, 1]);
/** World frame mirrored for side s: p = |x|, q = z. */
export function frameX(s = 1) {
  return makeFrame(s > 0 ? 'X+' : 'X-', (p, z) => [s * p, z], [s, 0], [0, 1]);
}

/** World [x, z] → wing coordinates [a, R] of side s. */
export function toWing(s, x, z) {
  const a = s * x * COS - z * SIN;
  const v = s * x * SIN + z * COS;
  return [a, v + RW0];
}

// --- low-level triangle soup ---------------------------------------------------------------
/** Collects triangles with explicit facing; finish() returns non-indexed geometry with metric UVs. */
export class Soup {
  constructor() {
    this.p = [];
  }
  /** Triangle whose front faces along (nx, ny, nz) (only the sign of the dot product matters). */
  tri(A, B, C, nx, ny, nz) {
    const ux = B[0] - A[0];
    const uy = B[1] - A[1];
    const uz = B[2] - A[2];
    const vx = C[0] - A[0];
    const vy = C[1] - A[1];
    const vz = C[2] - A[2];
    const d = (uy * vz - uz * vy) * nx + (uz * vx - ux * vz) * ny + (ux * vy - uy * vx) * nz;
    if (d >= 0) this.p.push(A[0], A[1], A[2], B[0], B[1], B[2], C[0], C[1], C[2]);
    else this.p.push(A[0], A[1], A[2], C[0], C[1], C[2], B[0], B[1], B[2]);
  }
  quad(A, B, C, D, nx, ny, nz) {
    this.tri(A, B, C, nx, ny, nz);
    this.tri(A, C, D, nx, ny, nz);
  }
  finish() {
    if (this.p.length === 0) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.computeVertexNormals();
    return metricUV(g);
  }
}

/** Box between two 3D points (a beam, a rail, a brace): `w` horizontal width, `h` depth. */
export function beam3(A, B, w, h) {
  const d = new THREE.Vector3(B[0] - A[0], B[1] - A[1], B[2] - A[2]);
  const len = d.length();
  if (len < 1e-4) return null;
  const X = d.clone().normalize();
  let Z = new THREE.Vector3().crossVectors(X, new THREE.Vector3(0, 1, 0));
  if (Z.lengthSq() < 1e-8) Z = new THREE.Vector3(0, 0, 1);
  Z.normalize();
  const Y = new THREE.Vector3().crossVectors(Z, X);
  const g = new THREE.BoxGeometry(len, h, w);
  const m = new THREE.Matrix4().makeBasis(X, Y, Z);
  m.setPosition((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2);
  g.applyMatrix4(m);
  return metricUV(g);
}

/** Cylinder between two 3D points (ducts, pipes, round posts). */
export function tube3(A, B, r, seg = 10, capped = false) {
  const d = new THREE.Vector3(B[0] - A[0], B[1] - A[1], B[2] - A[2]);
  const len = d.length();
  if (len < 1e-4) return null;
  const g = new THREE.CylinderGeometry(r, r, len, seg, 1, !capped);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  const m = new THREE.Matrix4().compose(new THREE.Vector3((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2), q, new THREE.Vector3(1, 1, 1));
  g.applyMatrix4(m);
  return metricUV(g);
}

// --- collector -------------------------------------------------------------------------------
export class Kit {
  constructor() {
    this.bins = new Map();
    this.extra = []; // ready-made objects (instanced meshes)
    this.info = {}; // descriptors for neighbouring modules (kiosk recesses, counts)
  }

  add(matId, level, geom) {
    if (!geom) return;
    const key = `${matId}|${level}`;
    let bin = this.bins.get(key);
    if (!bin) this.bins.set(key, (bin = { matId, level, list: [] }));
    bin.list.push(geom);
  }

  /** Box in a plan frame: p0..p1 × q0..q1, y0..y1. */
  box(f, p0, p1, q0, q1, y0, y1, matId, level) {
    if (Math.abs(p1 - p0) < 1e-4 || Math.abs(q1 - q0) < 1e-4 || Math.abs(y1 - y0) < 1e-4) return;
    const [cx, cz] = f.pt((p0 + p1) / 2, (q0 + q1) / 2);
    this.add(matId, level, box(cx, (y0 + y1) / 2, cz, Math.abs(p1 - p0), Math.abs(y1 - y0), Math.abs(q1 - q0), f.rot));
  }

  /** Prism from a ring given in frame coordinates. */
  prism(f, ring, y0, y1, matId, level, opts) {
    this.add(matId, level, prism(ring.map(([p, q]) => f.pt(p, q)), y0, y1, opts));
  }

  /** Prism from a world ring. */
  prismW(ring, y0, y1, matId, level, opts) {
    this.add(matId, level, prism(ring, y0, y1, opts));
  }

  /**
   * Straight wall in a plan frame from (pa, qa) to (pb, qb), with rectangular openings
   *   openings: [{ at, w, h, sill = 0 }]   `at` = distance of the opening centre from A.
   */
  wall(f, pa, qa, pb, qb, y0, y1, t, matId, level, openings = []) {
    const A = f.pt(pa, qa);
    const B = f.pt(pb, qb);
    const len = Math.hypot(B[0] - A[0], B[1] - A[1]);
    if (len < 1e-4 || y1 - y0 < 1e-4) return;
    const at = (d) => [A[0] + ((B[0] - A[0]) * d) / len, A[1] + ((B[1] - A[1]) * d) / len];
    const ops = openings
      .map((o) => ({ d0: Math.max(0, o.at - o.w / 2), d1: Math.min(len, o.at + o.w / 2), y0: y0 + (o.sill || 0), y1: Math.min(y1, y0 + (o.sill || 0) + o.h) }))
      .filter((o) => o.d1 > o.d0)
      .sort((a, b) => a.d0 - b.d0);
    let d = 0;
    for (const o of ops) {
      if (o.d0 > d + 1e-4) this.add(matId, level, wall(at(d), at(o.d0), y0, y1, t));
      if (o.y1 < y1 - 1e-4) this.add(matId, level, wall(at(o.d0), at(o.d1), o.y1, y1, t));
      if (o.y0 > y0 + 1e-4) this.add(matId, level, wall(at(o.d0), at(o.d1), y0, o.y0, t));
      d = Math.max(d, o.d1);
    }
    if (d < len - 1e-4) this.add(matId, level, wall(at(d), at(len), y0, y1, t));
  }

  /** Beam / rail between two points given as [p, q, y] in a frame. */
  beam(f, A, B, w, h, matId, level) {
    const a = f.pt(A[0], A[1]);
    const b = f.pt(B[0], B[1]);
    this.add(matId, level, beam3([a[0], A[2], a[1]], [b[0], B[2], b[1]], w, h));
  }

  tube(f, A, B, r, matId, level, seg = 10) {
    const a = f.pt(A[0], A[1]);
    const b = f.pt(B[0], B[1]);
    this.add(matId, level, tube3([a[0], A[2], a[1]], [b[0], B[2], b[1]], r, seg));
  }

  /**
   * Straight stair flight. Starts at frame point (p, q) at height y (the lower floor, at the
   * foot of the first riser, on the flight's centre line) and climbs along the local
   * direction (dp, dq). n risers of height `rise`, n − 1 treads of depth `going`; the last
   * riser lands on the upper floor. `solid` closes the sides down to the start level.
   * Returns { top: [p, q, y] } = centre of the top nosing.
   */
  flight(f, p, q, y, dp, dq, n, rise, going, width, matId, level, { waist = 0.28, solid = false, yFloor = null, nosing = null } = {}) {
    if (nosing) {
      // anti-slip nosing strip on the front edge of every tread (axis-aligned flights only)
      for (let i = 1; i < n; i++) {
        const u = (i - 1) * going;
        const a = [p + dp * (u - 0.004), q + dq * (u - 0.004)];
        const b = [p + dp * (u + 0.045), q + dq * (u + 0.045)];
        const hw2 = width / 2 - 0.03;
        this.box(f, Math.min(a[0], b[0]) - Math.abs(dq) * hw2, Math.max(a[0], b[0]) + Math.abs(dq) * hw2, Math.min(a[1], b[1]) - Math.abs(dp) * hw2, Math.max(a[1], b[1]) + Math.abs(dp) * hw2, y + i * rise - 0.02, y + i * rise + 0.004, nosing, level);
      }
    }
    const o = f.pt(p, q);
    const d = f.dir(dp, dq);
    const side = [-d[1], d[0]];
    const hw = width / 2;
    const P = (u, yy, w) => [o[0] + d[0] * u + side[0] * w, y + yy, o[1] + d[1] * u + side[1] * w];
    const slope = rise / going;
    const base = yFloor === null ? 0 : yFloor - y;
    const under = (u) => (solid ? base : Math.max(base, u * slope - waist));
    const s = new Soup();
    for (let i = 0; i < n; i++) {
      const u0 = i * going;
      const yt = (i + 1) * rise;
      // riser
      s.quad(P(u0, yt - rise, -hw), P(u0, yt - rise, hw), P(u0, yt, hw), P(u0, yt, -hw), -d[0], 0, -d[1]);
      if (i === n - 1) break;
      const u1 = u0 + going;
      // tread
      s.quad(P(u0, yt, -hw), P(u0, yt, hw), P(u1, yt, hw), P(u1, yt, -hw), 0, 1, 0);
      // sides
      for (const w of [-hw, hw]) {
        const sg = Math.sign(w);
        s.quad(P(u0, under(u0), w), P(u1, under(u1), w), P(u1, yt, w), P(u0, yt, w), side[0] * sg, 0, side[1] * sg);
      }
      // soffit
      if (!solid) s.quad(P(u0, under(u0), -hw), P(u1, under(u1), -hw), P(u1, under(u1), hw), P(u0, under(u0), hw), d[0] * slope, -1, d[1] * slope);
    }
    // back of the flight under the top riser
    const uEnd = (n - 1) * going;
    if (under(uEnd) < (n - 1) * rise) s.quad(P(uEnd, under(uEnd), -hw), P(uEnd, under(uEnd), hw), P(uEnd, (n - 1) * rise, hw), P(uEnd, (n - 1) * rise, -hw), d[0], 0, d[1]);
    this.add(matId, level, s.finish());
    return { top: [p + dp * uEnd, q + dq * uEnd, y + n * rise], run: uEnd };
  }

  /**
   * Guard rail along a polyline of frame points [p, q, y] (y = floor / nosing level under
   * the rail). Posts, top rail, and either mid rails or an infill panel.
   */
  rail(f, pts, level, { height = 1.1, spacing = 1.3, post = 0.045, infill = 'mesh', matRail = 'steelBlack', matInfill = 'meshPanel', top = 0.05 } = {}) {
    for (let i = 0; i < pts.length - 1; i++) {
      const A = pts[i];
      const B = pts[i + 1];
      const a = f.pt(A[0], A[1]);
      const b = f.pt(B[0], B[1]);
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len < 0.05) continue;
      const n = Math.max(1, Math.round(len / spacing));
      const at = (t, dy) => [a[0] + (b[0] - a[0]) * t, A[2] + (B[2] - A[2]) * t + dy, a[1] + (b[1] - a[1]) * t];
      for (let k = 0; k <= n; k++) {
        if (k === n && i < pts.length - 2) continue; // shared with the next segment
        const t = k / n;
        this.add(matRail, level, beam3(at(t, 0), at(t, height), post, post));
      }
      this.add(matRail, level, beam3(at(0, height), at(1, height), top, top));
      if (infill === 'bars') {
        for (const h of [0.35, 0.7]) this.add(matRail, level, beam3(at(0, h), at(1, h), 0.03, 0.03));
      } else if (infill) {
        // thin infill panel between 0.1 m and height − 0.1 m
        const s = new Soup();
        const nx = -(b[1] - a[1]) / len;
        const nz = (b[0] - a[0]) / len;
        for (const e of [0.012, -0.012]) {
          const off = (P) => [P[0] + nx * e, P[1], P[2] + nz * e];
          s.quad(off(at(0, 0.1)), off(at(1, 0.1)), off(at(1, height - 0.08)), off(at(0, height - 0.08)), nx * e, 0, nz * e);
        }
        this.add(matInfill, level, s.finish());
        this.add(matRail, level, beam3(at(0, 0.1), at(1, 0.1), 0.03, 0.03));
      }
    }
  }

  /** Meshes of everything collected so far, merged per material and level. */
  build(group) {
    const keys = [...this.bins.keys()].sort();
    for (const key of keys) {
      const { matId, level, list } = this.bins.get(key);
      const g = merge(list);
      const m = mesh(g, M(matId), { name: `structure L${level} ${matId}`, layer: LAYER, level, cast: !M(matId).userData.unlit, receive: true });
      group.add(m);
    }
    for (const o of this.extra) group.add(o);
  }
}

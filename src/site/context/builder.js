// Geometry kit of the context buildings: growable vertex buffers per material ("buckets")
// and the primitives the building generators are made of. Everything is in WORLD metres;
// plan rings are [[x, z], ...] with POSITIVE (x, z) signed area, for which the outward
// normal of an edge a -> b is (dz, -dx) — the same convention as core/geom.js prism().
// Buffers carry position, normal, uv (metres, or "tile metres" on facades) and a vertex
// colour used as a per-building tint.
import * as THREE from 'three';

export class Buf {
  constructor() {
    this.p = [];
    this.n = [];
    this.t = [];
    this.c = [];
  }
  /** Triangle wound so that its face normal follows n; uv per corner; col = [r, g, b] 0..1. */
  tri(a, b, c, n, ta, tb, tc, col) {
    const ux = b[0] - a[0];
    const uy = b[1] - a[1];
    const uz = b[2] - a[2];
    const vx = c[0] - a[0];
    const vy = c[1] - a[1];
    const vz = c[2] - a[2];
    const d = (uy * vz - uz * vy) * n[0] + (uz * vx - ux * vz) * n[1] + (ux * vy - uy * vx) * n[2];
    if (d < 0) {
      this.p.push(a[0], a[1], a[2], c[0], c[1], c[2], b[0], b[1], b[2]);
      this.t.push(ta[0], ta[1], tc[0], tc[1], tb[0], tb[1]);
    } else {
      this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      this.t.push(ta[0], ta[1], tb[0], tb[1], tc[0], tc[1]);
    }
    for (let i = 0; i < 3; i++) {
      this.n.push(n[0], n[1], n[2]);
      this.c.push(col[0], col[1], col[2]);
    }
  }
  quad(a, b, c, d, n, ta, tb, tc, td, col) {
    this.tri(a, b, c, n, ta, tb, tc, col);
    this.tri(a, c, d, n, ta, tc, td, col);
  }
  get triangles() {
    return this.p.length / 9;
  }
  toGeometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.t, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
}

export class Buckets {
  constructor() {
    this.map = new Map();
  }
  get(id) {
    let b = this.map.get(id);
    if (!b) {
      b = new Buf();
      this.map.set(id, b);
    }
    return b;
  }
}

export const WHITE = [1, 1, 1];
export function rgb(hexStr) {
  const c = new THREE.Color(hexStr); // sRGB hex -> linear working space, as vertex colours expect
  return [c.r, c.g, c.b];
}

// ---------------------------------------------------------------- plan helpers
export function signedArea(ring) {
  let s = 0;
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i];
    const q = ring[(i + 1) % ring.length];
    s += p[0] * q[1] - q[0] * p[1];
  }
  return s / 2;
}
export function centroid(ring) {
  let a = 0;
  let cx = 0;
  let cz = 0;
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i];
    const q = ring[(i + 1) % ring.length];
    const c = p[0] * q[1] - q[0] * p[1];
    a += c;
    cx += (p[0] + q[0]) * c;
    cz += (p[1] + q[1]) * c;
  }
  return Math.abs(a) < 1e-9 ? ring[0].slice() : [cx / (3 * a), cz / (3 * a)];
}
export function pointInRing(ring, x, z) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i];
    const [xj, zj] = ring[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}
export function distToRing(ring, x, z) {
  let best = Infinity;
  for (let i = 0; i < ring.length; i++) {
    const [ax, az] = ring[i];
    const [bx, bz] = ring[(i + 1) % ring.length];
    const dx = bx - ax;
    const dz = bz - az;
    const l2 = dx * dx + dz * dz || 1e-9;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
    const d = Math.hypot(x - ax - dx * t, z - az - dz * t);
    if (d < best) best = d;
  }
  return best;
}
/** Drop vertices that make edges shorter than `minLen` (keeps the shape, avoids inset flips). */
export function dropShortEdges(ring, minLen) {
  let out = ring.slice();
  let changed = true;
  while (changed && out.length > 4) {
    changed = false;
    for (let i = 0; i < out.length; i++) {
      const p = out[i];
      const q = out[(i + 1) % out.length];
      if (Math.hypot(q[0] - p[0], q[1] - p[1]) < minLen) {
        out.splice((i + 1) % out.length, 1);
        changed = true;
        break;
      }
    }
  }
  return out;
}
/** Mitred inward offset by d metres; null when the result would fold over. */
export function insetRing(ring, d) {
  const n = ring.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const p0 = ring[(i + n - 1) % n];
    const p1 = ring[i];
    const p2 = ring[(i + 1) % n];
    let e1x = p1[0] - p0[0];
    let e1z = p1[1] - p0[1];
    let e2x = p2[0] - p1[0];
    let e2z = p2[1] - p1[1];
    const l1 = Math.hypot(e1x, e1z) || 1;
    const l2 = Math.hypot(e2x, e2z) || 1;
    e1x /= l1;
    e1z /= l1;
    e2x /= l2;
    e2z /= l2;
    // inward normal of a positive-area ring = (-dz, dx)
    let bx = -e1z - e2z;
    let bz = e1x + e2x;
    const bl = Math.hypot(bx, bz);
    if (bl < 1e-6) {
      bx = -e1z;
      bz = e1x;
    } else {
      bx /= bl;
      bz /= bl;
    }
    const cosHalf = Math.max(0.35, -e1z * bx + e1x * bz);
    out.push([p1[0] + (bx * d) / cosHalf, p1[1] + (bz * d) / cosHalf]);
  }
  const a0 = signedArea(ring);
  const a1 = signedArea(out);
  if (!(a1 > 0) || a1 >= a0 || a1 < 0.12 * a0) return null;
  for (let i = 0; i < n; i++) {
    const p = out[i];
    const q = out[(i + 1) % n];
    const a = ring[i];
    const b = ring[(i + 1) % n];
    if ((q[0] - p[0]) * (b[0] - a[0]) + (q[1] - p[1]) * (b[1] - a[1]) <= 0) return null;
    if (!pointInRing(ring, p[0], p[1])) return null;
  }
  return out;
}
/** Oriented bounding box along the longest edge (or a given angle): centre, half sizes, angle. */
export function obb(ring, angle) {
  let ang = angle;
  if (ang === undefined) {
    let best = 0;
    for (let i = 0; i < ring.length; i++) {
      const p = ring[i];
      const q = ring[(i + 1) % ring.length];
      const l = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (l > best) {
        best = l;
        ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
      }
    }
  }
  const cx = Math.cos(ang);
  const sz = Math.sin(ang);
  let u0 = Infinity;
  let u1 = -Infinity;
  let v0 = Infinity;
  let v1 = -Infinity;
  for (const [x, z] of ring) {
    const u = x * cx + z * sz;
    const v = -x * sz + z * cx;
    if (u < u0) u0 = u;
    if (u > u1) u1 = u;
    if (v < v0) v0 = v;
    if (v > v1) v1 = v;
  }
  const uc = (u0 + u1) / 2;
  const vc = (v0 + v1) / 2;
  return { cx: uc * cx - vc * sz, cz: uc * sz + vc * cx, hu: (u1 - u0) / 2, hv: (v1 - v0) / 2, ang, ux: cx, uz: sz };
}
/** Principal axis angle of a ring (for ovals, where no edge is "the long one"). */
export function principalAngle(ring) {
  const c = centroid(ring);
  let sxx = 0;
  let szz = 0;
  let sxz = 0;
  for (const [x, z] of ring) {
    sxx += (x - c[0]) ** 2;
    szz += (z - c[1]) ** 2;
    sxz += (x - c[0]) * (z - c[1]);
  }
  return 0.5 * Math.atan2(2 * sxz, sxx - szz);
}

/**
 * Split a ring into facade runs: chains of edges that turn less than `cornerDeg` between
 * them (a curved wall approximated by short chords is ONE facade). Edges listed in `cut`
 * (diorama rim) become runs of their own with cut = true.
 * Each run: { cut, length, edges: [{ i, a, b, len, nx, nz, s }] } with s = distance along the run.
 */
export function facadeRuns(ring, cut = [], cornerDeg = 24) {
  const n = ring.length;
  const isCut = new Set(cut);
  const edges = [];
  for (let i = 0; i < n; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % n];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    edges.push({ i, a, b, len, nx: dz / (len || 1), nz: -dx / (len || 1), cut: isCut.has(i) });
  }
  const cosLim = Math.cos((cornerDeg * Math.PI) / 180);
  const breakAt = (i) => {
    // is there a corner between edge i-1 and edge i ?
    const e0 = edges[(i + n - 1) % n];
    const e1 = edges[i];
    if (e0.cut !== e1.cut) return true;
    if (e0.cut) return false;
    return e0.nx * e1.nx + e0.nz * e1.nz < cosLim;
  };
  let start = 0;
  for (let i = 0; i < n; i++) {
    if (breakAt(i)) {
      start = i;
      break;
    }
  }
  const runs = [];
  let cur = null;
  for (let k = 0; k < n; k++) {
    const i = (start + k) % n;
    const e = edges[i];
    if (!cur || (k > 0 && breakAt(i))) {
      cur = { cut: e.cut, length: 0, edges: [] };
      runs.push(cur);
    }
    e.s = cur.length;
    cur.length += e.len;
    cur.edges.push(e);
  }
  return runs;
}

// ---------------------------------------------------------------- primitives
/** Vertical quad on plan segment a -> b facing (nx, nz), from y0 to y1; uv corners (u0, v0)-(u1, v1). */
export function wallQuad(buf, a, b, y0, y1, nx, nz, u0, u1, v0, v1, col = WHITE) {
  buf.quad([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], [nx, 0, nz], [u0, v0], [u1, v0], [u1, v1], [u0, v1], col);
}
/** Plain walls of a ring (metric uv), outward or inward facing. */
export function ringWalls(buf, ring, y0, y1, col = WHITE, inward = false, skip = null) {
  let s = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    if (len < 1e-4) continue;
    if (!(skip && skip.has(i))) {
      const k = inward ? -1 : 1;
      wallQuad(buf, a, b, y0, y1, (k * dz) / len, (-k * dx) / len, s, s + len, y0, y1, col);
    }
    s += len;
  }
}
/** Horizontal polygon (cap) of a ring at height y (or y(x, z)), facing up or down; metric uv. */
export function cap(buf, ring, y, up = true, col = WHITE, holes = []) {
  const fy = typeof y === 'function' ? y : () => y;
  const c2 = ring.map(([x, z]) => new THREE.Vector2(x, z));
  const h2 = holes.map((h) => h.map(([x, z]) => new THREE.Vector2(x, z)));
  const all = [...ring, ...holes.flat()];
  const tris = THREE.ShapeUtils.triangulateShape(c2, h2);
  const n = [0, up ? 1 : -1, 0];
  for (const [i, j, k] of tris) {
    const A = all[i];
    const B = all[j];
    const C = all[k];
    buf.tri([A[0], fy(A[0], A[1]), A[1]], [B[0], fy(B[0], B[1]), B[1]], [C[0], fy(C[0], C[1]), C[1]], n, A, B, C, col);
  }
}
/** Horizontal strip between two rings with the same vertex count (parapet tops, slab rims). */
export function ringStrip(buf, outer, inner, y, up = true, col = WHITE, skip = null) {
  const n = [0, up ? 1 : -1, 0];
  for (let i = 0; i < outer.length; i++) {
    if (skip && skip.has(i)) continue;
    const j = (i + 1) % outer.length;
    const a = outer[i];
    const b = outer[j];
    const c = inner[j];
    const d = inner[i];
    buf.quad([a[0], y, a[1]], [b[0], y, b[1]], [c[0], y, c[1]], [d[0], y, d[1]], n, a, b, c, d, col);
  }
}
/**
 * Oriented box: centre (cx, cz), y0..y1, half sizes hu (along the angle) and hv (across).
 * Faces: 4 sides + top (bottom optional). Metric uv.
 */
export function boxO(buf, cx, cz, y0, y1, hu, hv, ang = 0, col = WHITE, { top = true, bottom = false, topBuf = null, topCol = null } = {}) {
  const ux = Math.cos(ang);
  const uz = Math.sin(ang);
  const vx = -uz;
  const vz = ux;
  const P = (su, sv) => [cx + ux * hu * su + vx * hv * sv, cz + uz * hu * su + vz * hv * sv];
  const c = [P(-1, -1), P(1, -1), P(1, 1), P(-1, 1)];
  const normals = [
    [-vx, -vz],
    [ux, uz],
    [vx, vz],
    [-ux, -uz],
  ];
  for (let i = 0; i < 4; i++) {
    const a = c[i];
    const b = c[(i + 1) % 4];
    const len = i % 2 === 0 ? hu * 2 : hv * 2;
    wallQuad(buf, a, b, y0, y1, normals[i][0], normals[i][1], 0, len, y0, y1, col);
  }
  if (top) {
    (topBuf || buf).quad([c[0][0], y1, c[0][1]], [c[1][0], y1, c[1][1]], [c[2][0], y1, c[2][1]], [c[3][0], y1, c[3][1]], [0, 1, 0], c[0], c[1], c[2], c[3], topCol || col);
  }
  if (bottom) {
    buf.quad([c[0][0], y0, c[0][1]], [c[1][0], y0, c[1][1]], [c[2][0], y0, c[2][1]], [c[3][0], y0, c[3][1]], [0, -1, 0], c[0], c[1], c[2], c[3], col);
  }
  return c;
}
/** Box between two 3D points (a strut): square section of side w. */
export function strut(buf, p, q, w, col = WHITE) {
  const d = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
  const len = Math.hypot(d[0], d[1], d[2]) || 1;
  const ax = [d[0] / len, d[1] / len, d[2] / len];
  // two perpendiculars
  let rx = [ax[2], 0, -ax[0]];
  let rl = Math.hypot(rx[0], rx[2]);
  if (rl < 1e-4) {
    rx = [1, 0, 0];
    rl = 1;
  }
  rx = [rx[0] / rl, 0, rx[2] / rl];
  const ry = [ax[1] * rx[2] - ax[2] * rx[1], ax[2] * rx[0] - ax[0] * rx[2], ax[0] * rx[1] - ax[1] * rx[0]];
  const h = w / 2;
  const corner = (o, sx, sy) => [o[0] + rx[0] * h * sx + ry[0] * h * sy, o[1] + rx[1] * h * sx + ry[1] * h * sy, o[2] + rx[2] * h * sx + ry[2] * h * sy];
  const sides = [
    [1, 1, 1, -1, rx],
    [1, -1, -1, -1, [-ry[0], -ry[1], -ry[2]]],
    [-1, -1, -1, 1, [-rx[0], -rx[1], -rx[2]]],
    [-1, 1, 1, 1, ry],
  ];
  for (const [sx0, sy0, sx1, sy1, n] of sides) {
    buf.quad(corner(p, sx0, sy0), corner(p, sx1, sy1), corner(q, sx1, sy1), corner(q, sx0, sy0), n, [0, 0], [w, 0], [w, len], [0, len], col);
  }
}
/** Vertical cylinder wall (optionally with a top disc); seg sides; metric uv around. */
export function cylinder(buf, x, z, y0, y1, r, seg = 16, col = WHITE, { top = true, inward = false, topBuf = null, topCol = null } = {}) {
  const pts = [];
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    pts.push([x + Math.cos(a) * r, z + Math.sin(a) * r]);
  }
  // pts run with increasing angle: positive (x, z) area
  ringWalls(buf, pts, y0, y1, col, inward);
  if (top) cap(topBuf || buf, pts, y1, true, topCol || col);
  return pts;
}
/** Regular polygon ring (positive area). */
export function circleRing(x, z, r, seg = 24, rz = r, ang = 0) {
  const pts = [];
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    const u = Math.cos(a) * r;
    const v = Math.sin(a) * rz;
    pts.push([x + u * ca - v * sa, z + u * sa + v * ca]);
  }
  return pts;
}
/** Vertical disc (sign roundel) on a wall: centre p (3D), facing (nx, nz), radius r, proud by `off`. */
export function wallDisc(buf, p, nx, nz, r, off, col, seg = 20) {
  const tx = -nz;
  const tz = nx;
  const c = [p[0] + nx * off, p[1], p[2] + nz * off];
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2;
    const a1 = ((i + 1) / seg) * Math.PI * 2;
    const q0 = [c[0] + tx * Math.cos(a0) * r, c[1] + Math.sin(a0) * r, c[2] + tz * Math.cos(a0) * r];
    const q1 = [c[0] + tx * Math.cos(a1) * r, c[1] + Math.sin(a1) * r, c[2] + tz * Math.cos(a1) * r];
    buf.tri(c, q0, q1, [nx, 0, nz], [0.5, 0.5], [0.5 + Math.cos(a0) / 2, 0.5 + Math.sin(a0) / 2], [0.5 + Math.cos(a1) / 2, 0.5 + Math.sin(a1) / 2], col);
  }
}

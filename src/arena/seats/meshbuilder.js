// Tiny polygon builder for the procedural seat models. Faces are added as triangles /
// quads / fans with an optional "outward" hint that fixes the winding, so model code can
// list corners in any order. build() returns NON-INDEXED geometry with creased vertex
// normals and metre-scaled UVs (same convention as core/geom.js).
import * as THREE from 'three';
import { metricUV } from '../../core/geom.js';

export class MeshBuilder {
  constructor() {
    this.pos = []; // 9 numbers per triangle
    this.uvs = []; // per triangle: null (metric box projection) or 6 numbers
    /** When set to [u, v], faces without explicit UVs all sample that one texel (atlas colour). */
    this.constUV = null;
    this.bulges = [];
  }

  /**
   * Shade the triangles added by `fn` as if the (flat) surface were slightly convex: their
   * vertex normals lean outward from the patch centre by up to atan(k). Costs no triangles.
   */
  bulge(k, fn) {
    const start = this.triangles;
    fn();
    this.bulges.push({ start, end: this.triangles, k });
    return this;
  }

  get triangles() {
    return this.pos.length / 9;
  }

  /** Triangle a, b, c (each [x, y, z]). `hint` = rough outward direction; `uv` = [[u, v] x 3]. */
  tri(a, b, c, hint, uv) {
    let flip = false;
    if (hint) {
      const ux = b[0] - a[0];
      const uy = b[1] - a[1];
      const uz = b[2] - a[2];
      const vx = c[0] - a[0];
      const vy = c[1] - a[1];
      const vz = c[2] - a[2];
      const d = (uy * vz - uz * vy) * hint[0] + (uz * vx - ux * vz) * hint[1] + (ux * vy - uy * vx) * hint[2];
      flip = d < 0;
    }
    if (flip) {
      this.pos.push(a[0], a[1], a[2], c[0], c[1], c[2], b[0], b[1], b[2]);
      this.uvs.push(uv ? [uv[0][0], uv[0][1], uv[2][0], uv[2][1], uv[1][0], uv[1][1]] : null);
    } else {
      this.pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      this.uvs.push(uv ? [uv[0][0], uv[0][1], uv[1][0], uv[1][1], uv[2][0], uv[2][1]] : null);
    }
    return this;
  }

  /** Quad with corners in loop order. */
  quad(a, b, c, d, hint, uv) {
    this.tri(a, b, c, hint, uv && [uv[0], uv[1], uv[2]]);
    this.tri(a, c, d, hint, uv && [uv[0], uv[2], uv[3]]);
    return this;
  }

  /** Convex polygon (loop order) as a triangle fan. */
  fan(points, hint) {
    for (let i = 1; i < points.length - 1; i++) this.tri(points[0], points[i], points[i + 1], hint);
    return this;
  }

  /**
   * Axis-aligned box. `skip` lists faces to leave out, e.g. '-y' (bottom), '+z' …
   */
  box(x0, x1, y0, y1, z0, z1, skip = []) {
    const s = new Set(skip);
    if (!s.has('-x')) this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]);
    if (!s.has('+x')) this.quad([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [1, 0, 0]);
    if (!s.has('-y')) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]);
    if (!s.has('+y')) this.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0]);
    if (!s.has('-z')) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [0, 0, -1]);
    if (!s.has('+z')) this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]);
    return this;
  }

  /**
   * Extrude a closed side profile [[y, z], ...] along x from x0 to x1.
   * `skipEdges` = indices i of profile edges (i → i + 1) to leave open; caps: 'both' | 'none'.
   */
  extrudeX(profile, x0, x1, { skipEdges = [], caps = 'both' } = {}) {
    const n = profile.length;
    let area2 = 0;
    for (let i = 0; i < n; i++) {
      const [ya, za] = profile[i];
      const [yb, zb] = profile[(i + 1) % n];
      area2 += ya * zb - yb * za;
    }
    const sign = area2 > 0 ? 1 : -1;
    const skip = new Set(skipEdges);
    for (let i = 0; i < n; i++) {
      if (skip.has(i)) continue;
      const [ya, za] = profile[i];
      const [yb, zb] = profile[(i + 1) % n];
      const dy = yb - ya;
      const dz = zb - za;
      // outward normal of the edge in (y, z) for a ring that is counter-clockwise in (y, z)
      const hint = [0, dz * sign, -dy * sign];
      this.quad([x0, ya, za], [x1, ya, za], [x1, yb, zb], [x0, yb, zb], hint);
    }
    if (caps !== 'none') {
      const contour = profile.map(([y, z]) => new THREE.Vector2(y, z));
      const tris = THREE.ShapeUtils.triangulateShape(sign > 0 ? contour : contour.slice().reverse(), []);
      const ring = sign > 0 ? profile : profile.slice().reverse();
      for (const [i, j, k] of tris) {
        const A = ring[i];
        const B = ring[j];
        const C = ring[k];
        this.tri([x0, A[0], A[1]], [x0, B[0], B[1]], [x0, C[0], C[1]], [-1, 0, 0]);
        this.tri([x1, A[0], A[1]], [x1, B[0], B[1]], [x1, C[0], C[1]], [1, 0, 0]);
      }
    }
    return this;
  }

  /**
   * Open vertical tube / cone frustum. Outer faces only, or inner faces only with
   * `inward`. `bottom` / `top` add an upward-facing disc at y0 / y1.
   */
  tubeY(cx, cz, r0, r1, y0, y1, segments = 8, { bottom = false, top = false, inward = false } = {}) {
    for (let i = 0; i < segments; i++) {
      const a0 = (i / segments) * Math.PI * 2;
      const a1 = ((i + 1) / segments) * Math.PI * 2;
      const c0 = Math.cos(a0);
      const s0 = Math.sin(a0);
      const c1 = Math.cos(a1);
      const s1 = Math.sin(a1);
      const k = inward ? -1 : 1;
      const hint = [k * (c0 + c1), 0, k * (s0 + s1)];
      this.quad(
        [cx + r0 * c0, y0, cz + r0 * s0],
        [cx + r0 * c1, y0, cz + r0 * s1],
        [cx + r1 * c1, y1, cz + r1 * s1],
        [cx + r1 * c0, y1, cz + r1 * s0],
        hint,
      );
      if (bottom) this.tri([cx, y0, cz], [cx + r0 * c0, y0, cz + r0 * s0], [cx + r0 * c1, y0, cz + r0 * s1], [0, 1, 0]);
      if (top) this.tri([cx, y1, cz], [cx + r1 * c0, y1, cz + r1 * s0], [cx + r1 * c1, y1, cz + r1 * s1], [0, 1, 0]);
    }
    return this;
  }

  /** Append another builder's triangles, optionally mirrored in x. */
  add(other) {
    for (let i = 0; i < other.pos.length; i++) this.pos.push(other.pos[i]);
    for (const u of other.uvs) this.uvs.push(u);
    return this;
  }

  /**
   * Finish: creased normals (faces meeting at less than `crease` degrees are smoothed),
   * metric box-projected UVs unless a face supplied its own.
   */
  build({ crease = 35 } = {}) {
    const position = new Float32Array(this.pos);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(position, 3));
    const normal = creasedNormals(position, crease);
    for (const bl of this.bulges) applyBulge(position, normal, bl);
    g.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
    const out = metricUV(g);
    const uv = out.attributes.uv.array;
    for (let t = 0; t < this.uvs.length; t++) {
      const e = this.uvs[t];
      if (e) for (let k = 0; k < 6; k++) uv[t * 6 + k] = e[k];
      else if (this.constUV) for (let k = 0; k < 6; k++) uv[t * 6 + k] = this.constUV[k % 2];
    }
    out.computeBoundingBox();
    out.computeBoundingSphere();
    return out;
  }
}

function creasedNormals(pos, creaseDeg) {
  const nTri = pos.length / 9;
  const unit = new Float32Array(nTri * 3);
  const weighted = new Float32Array(nTri * 3);
  const byVertex = new Map();
  const key = (i) => `${Math.round(pos[i] * 2000)},${Math.round(pos[i + 1] * 2000)},${Math.round(pos[i + 2] * 2000)}`;
  for (let t = 0; t < nTri; t++) {
    const o = t * 9;
    const ux = pos[o + 3] - pos[o];
    const uy = pos[o + 4] - pos[o + 1];
    const uz = pos[o + 5] - pos[o + 2];
    const vx = pos[o + 6] - pos[o];
    const vy = pos[o + 7] - pos[o + 1];
    const vz = pos[o + 8] - pos[o + 2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    weighted[t * 3] = nx;
    weighted[t * 3 + 1] = ny;
    weighted[t * 3 + 2] = nz;
    unit[t * 3] = nx / len;
    unit[t * 3 + 1] = ny / len;
    unit[t * 3 + 2] = nz / len;
    for (let k = 0; k < 3; k++) {
      const id = key(o + k * 3);
      let list = byVertex.get(id);
      if (!list) byVertex.set(id, (list = []));
      list.push(t);
    }
  }
  const cos = Math.cos((creaseDeg * Math.PI) / 180);
  const normal = new Float32Array(pos.length);
  for (let t = 0; t < nTri; t++) {
    for (let k = 0; k < 3; k++) {
      const o = t * 9 + k * 3;
      let sx = 0;
      let sy = 0;
      let sz = 0;
      for (const t2 of byVertex.get(key(o))) {
        const d = unit[t * 3] * unit[t2 * 3] + unit[t * 3 + 1] * unit[t2 * 3 + 1] + unit[t * 3 + 2] * unit[t2 * 3 + 2];
        if (d >= cos) {
          sx += weighted[t2 * 3];
          sy += weighted[t2 * 3 + 1];
          sz += weighted[t2 * 3 + 2];
        }
      }
      const len = Math.hypot(sx, sy, sz) || 1;
      normal[o] = sx / len;
      normal[o + 1] = sy / len;
      normal[o + 2] = sz / len;
    }
  }
  return normal;
}

function applyBulge(pos, normal, { start, end, k }) {
  const a = start * 9;
  const b = end * 9;
  if (b <= a) return;
  let cx = 0;
  let cy = 0;
  let cz = 0;
  for (let i = a; i < b; i += 3) {
    cx += pos[i];
    cy += pos[i + 1];
    cz += pos[i + 2];
  }
  const n = (b - a) / 3;
  cx /= n;
  cy /= n;
  cz /= n;
  // offsets from the centre, flattened into the surface, normalised by the largest one
  const off = new Float32Array(b - a);
  let max = 1e-9;
  for (let i = a; i < b; i += 3) {
    const nx = normal[i];
    const ny = normal[i + 1];
    const nz = normal[i + 2];
    let dx = pos[i] - cx;
    let dy = pos[i + 1] - cy;
    let dz = pos[i + 2] - cz;
    const d = dx * nx + dy * ny + dz * nz;
    dx -= d * nx;
    dy -= d * ny;
    dz -= d * nz;
    off[i - a] = dx;
    off[i - a + 1] = dy;
    off[i - a + 2] = dz;
    max = Math.max(max, Math.hypot(dx, dy, dz));
  }
  for (let i = a; i < b; i += 3) {
    const x = normal[i] + (k * off[i - a]) / max;
    const y = normal[i + 1] + (k * off[i - a + 1]) / max;
    const z = normal[i + 2] + (k * off[i - a + 2]) / max;
    const l = Math.hypot(x, y, z) || 1;
    normal[i] = x / l;
    normal[i + 1] = y / l;
    normal[i + 2] = z / l;
  }
}

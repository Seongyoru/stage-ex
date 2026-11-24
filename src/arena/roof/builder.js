// Triangle accumulator for the roof steel: thousands of straight members are written into one
// position buffer per material and turned into a single non-indexed geometry with metric UVs.
import * as THREE from 'three';
import { metricUV } from '../../core/geom.js';

const EPS = 1e-9;

export class TriBuffer {
  constructor() {
    this.p = [];
  }
  get triangles() {
    return this.p.length / 9;
  }
  tri(a, b, c) {
    this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  }
  /** Quad a-b-c-d, counter-clockwise seen from the side its normal points to. */
  quad(a, b, c, d) {
    this.tri(a, b, c);
    this.tri(a, c, d);
  }
  /** Quad wound so that its normal has a positive component along n. */
  quadFacing(a, b, c, d, n) {
    const ux = b[0] - a[0];
    const uy = b[1] - a[1];
    const uz = b[2] - a[2];
    const vx = d[0] - a[0];
    const vy = d[1] - a[1];
    const vz = d[2] - a[2];
    const dot = (uy * vz - uz * vy) * n[0] + (uz * vx - ux * vz) * n[1] + (ux * vy - uy * vx) * n[2];
    if (dot >= 0) this.quad(a, b, c, d);
    else this.quad(a, d, c, b);
  }

  /**
   * Sweep a closed 2D section along the straight line p0 → p1.
   * section: [[s, t], …] counter-clockwise in the plane (lateral, up) seen from p1 looking back to p0.
   * up: direction the section's t axis should point to as far as possible (default world +Y;
   *     for near-vertical members world +X is used instead).
   */
  sweep(p0, p1, section, up = null, caps = false) {
    let fx = p1[0] - p0[0];
    let fy = p1[1] - p0[1];
    let fz = p1[2] - p0[2];
    const len = Math.hypot(fx, fy, fz);
    if (len < 1e-4) return;
    fx /= len;
    fy /= len;
    fz /= len;
    let ux = up ? up[0] : 0;
    let uy = up ? up[1] : 1;
    let uz = up ? up[2] : 0;
    // lateral = up × forward
    let lx = uy * fz - uz * fy;
    let ly = uz * fx - ux * fz;
    let lz = ux * fy - uy * fx;
    let ll = Math.hypot(lx, ly, lz);
    if (ll < 1e-3) {
      // forward parallel to up: fall back to world +X (or +Z)
      ux = Math.abs(fx) < 0.9 ? 1 : 0;
      uy = 0;
      uz = Math.abs(fx) < 0.9 ? 0 : 1;
      lx = uy * fz - uz * fy;
      ly = uz * fx - ux * fz;
      lz = ux * fy - uy * fx;
      ll = Math.hypot(lx, ly, lz);
    }
    lx /= ll;
    ly /= ll;
    lz /= ll;
    // true up = forward × lateral
    const tx = fy * lz - fz * ly;
    const ty = fz * lx - fx * lz;
    const tz = fx * ly - fy * lx;
    const n = section.length;
    const a = new Array(n);
    const b = new Array(n);
    for (let i = 0; i < n; i++) {
      const s = section[i][0];
      const t = section[i][1];
      const ox = lx * s + tx * t;
      const oy = ly * s + ty * t;
      const oz = lz * s + tz * t;
      a[i] = [p0[0] + ox, p0[1] + oy, p0[2] + oz];
      b[i] = [p1[0] + ox, p1[1] + oy, p1[2] + oz];
    }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      this.quad(a[i], a[j], b[j], b[i]);
    }
    if (caps) {
      // fan caps: valid for convex sections only
      for (let i = 1; i < n - 1; i++) {
        this.tri(a[0], a[i + 1], a[i]);
        this.tri(b[0], b[i], b[i + 1]);
      }
    }
  }

  /** Axis-aligned box from min corner to max corner. */
  aabb(x0, y0, z0, x1, y1, z1) {
    const p = (x, y, z) => [x, y, z];
    this.quad(p(x0, y1, z0), p(x0, y1, z1), p(x1, y1, z1), p(x1, y1, z0)); // top (+y)
    this.quad(p(x0, y0, z0), p(x1, y0, z0), p(x1, y0, z1), p(x0, y0, z1)); // bottom
    this.quad(p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1)); // +z
    this.quad(p(x1, y0, z0), p(x0, y0, z0), p(x0, y1, z0), p(x1, y1, z0)); // −z
    this.quad(p(x1, y0, z1), p(x1, y0, z0), p(x1, y1, z0), p(x1, y1, z1)); // +x
    this.quad(p(x0, y0, z0), p(x0, y0, z1), p(x0, y1, z1), p(x0, y1, z0)); // −x
  }

  /**
   * Vertical-sided slab over a plan quad: corners [[x, z] × 4] in order around the quad,
   * with a bottom and a top height per corner (arrays of 4) or one number for all.
   */
  slab(corners, yb, yt, { top = true, bottom = true, sides = true } = {}) {
    const B = corners.map(([x, z], i) => [x, typeof yb === 'number' ? yb : yb[i], z]);
    const T = corners.map(([x, z], i) => [x, typeof yt === 'number' ? yt : yt[i], z]);
    if (top) this.quadFacing(T[0], T[1], T[2], T[3], [0, 1, 0]);
    if (bottom) this.quadFacing(B[0], B[1], B[2], B[3], [0, -1, 0]);
    if (sides) {
      const cx = (corners[0][0] + corners[1][0] + corners[2][0] + corners[3][0]) / 4;
      const cz = (corners[0][1] + corners[1][1] + corners[2][1] + corners[3][1]) / 4;
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4;
        const mx = (corners[i][0] + corners[j][0]) / 2 - cx;
        const mz = (corners[i][1] + corners[j][1]) / 2 - cz;
        this.quadFacing(B[i], B[j], T[j], T[i], [mx, 0, mz]);
      }
    }
  }

  /** Vertical panel between plan points a and b (thickness th centred on the line). */
  panel(a, b, y0, y1, th) {
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const l = Math.hypot(dx, dz);
    if (l < 1e-4) return;
    const nx = (-dz / l) * (th / 2);
    const nz = (dx / l) * (th / 2);
    this.slab(
      [
        [a[0] + nx, a[1] + nz],
        [b[0] + nx, b[1] + nz],
        [b[0] - nx, b[1] - nz],
        [a[0] - nx, a[1] - nz],
      ],
      y0,
      y1,
    );
  }

  toGeometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.computeVertexNormals(); // non-indexed → flat face normals
    return metricUV(g);
  }
}

// --- steel sections (lateral s, up t), counter-clockwise ------------------------------------
/** H / I section, web along t. `t0` shifts the section so that t = 0 is its bottom (t0 = 'bottom'), top or centre. */
export function hSection(b, d, tf = 0.04, tw = 0.03, anchor = 'centre') {
  const o = anchor === 'bottom' ? d / 2 : anchor === 'top' ? -d / 2 : 0;
  const hb = b / 2;
  const hd = d / 2;
  const hw = tw / 2;
  return [
    [-hb, -hd + o],
    [hb, -hd + o],
    [hb, -hd + tf + o],
    [hw, -hd + tf + o],
    [hw, hd - tf + o],
    [hb, hd - tf + o],
    [hb, hd + o],
    [-hb, hd + o],
    [-hb, hd - tf + o],
    [-hw, hd - tf + o],
    [-hw, -hd + tf + o],
    [-hb, -hd + tf + o],
  ];
}
export function rectSection(b, d, anchor = 'centre') {
  const o = anchor === 'bottom' ? d / 2 : anchor === 'top' ? -d / 2 : 0;
  return [
    [-b / 2, -d / 2 + o],
    [b / 2, -d / 2 + o],
    [b / 2, d / 2 + o],
    [-b / 2, d / 2 + o],
  ];
}
export function tubeSection(r, n = 8) {
  return Array.from({ length: n }, (_, i) => [Math.cos((i / n) * Math.PI * 2) * r, Math.sin((i / n) * Math.PI * 2) * r]);
}
/** Channel ([) section opening toward +s, web along t. */
export function channelSection(b, d, t = 0.012, anchor = 'centre') {
  const o = anchor === 'bottom' ? d / 2 : anchor === 'top' ? -d / 2 : 0;
  return [
    [0, -d / 2 + o],
    [b, -d / 2 + o],
    [b, -d / 2 + t + o],
    [t, -d / 2 + t + o],
    [t, d / 2 - t + o],
    [b, d / 2 - t + o],
    [b, d / 2 + o],
    [0, d / 2 + o],
  ];
}

// --- plan helpers -----------------------------------------------------------------------
/** Offset an open plan polyline by d (positive = to the left of the direction of travel, seen from above with +z down the page... i.e. along (−dz, dx)). Mitred joints. */
export function offsetPolyline(pts, d) {
  const n = pts.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[i];
    const c = pts[Math.min(n - 1, i + 1)];
    let n1 = null;
    let n2 = null;
    if (i > 0) {
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      n1 = [-(b[1] - a[1]) / l, (b[0] - a[0]) / l];
    }
    if (i < n - 1) {
      const l = Math.hypot(c[0] - b[0], c[1] - b[1]) || 1;
      n2 = [-(c[1] - b[1]) / l, (c[0] - b[0]) / l];
    }
    if (!n1) n1 = n2;
    if (!n2) n2 = n1;
    let mx = n1[0] + n2[0];
    let mz = n1[1] + n2[1];
    const ml = Math.hypot(mx, mz) || 1;
    mx /= ml;
    mz /= ml;
    const k = d / Math.max(0.3, mx * n1[0] + mz * n1[1]);
    out.push([b[0] + mx * k, b[1] + mz * k]);
  }
  return out;
}

/** Points along a plan polyline at (roughly) equal spacing; every vertex is included. Returns [{ x, z, seg, dir:[dx,dz] }]. */
export function alongPolyline(pts, spacing, { includeEnds = true } = {}) {
  const out = [];
  for (let s = 0; s < pts.length - 1; s++) {
    const a = pts[s];
    const b = pts[s + 1];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (l < EPS) continue;
    const n = Math.max(1, Math.round(l / spacing));
    const dir = [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
    for (let i = s === 0 ? 0 : 1; i <= n; i++) {
      if (!includeEnds && ((s === 0 && i === 0) || (s === pts.length - 2 && i === n))) continue;
      const t = i / n;
      out.push({ x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, seg: s, dir, corner: i === n && s < pts.length - 2 });
    }
  }
  return out;
}

/** Instanced mesh helper: list of 4×4 matrices → THREE.InstancedMesh. */
export function instanced(geometry, material, matrices, { name, layer = 'roof', level, cast = false, receive = false } = {}) {
  const m = new THREE.InstancedMesh(geometry, material, matrices.length);
  for (let i = 0; i < matrices.length; i++) m.setMatrixAt(i, matrices[i]);
  m.instanceMatrix.needsUpdate = true;
  m.name = name || '';
  m.castShadow = cast;
  m.receiveShadow = receive;
  m.userData.layer = layer;
  if (level !== undefined) m.userData.level = level;
  m.computeBoundingBox();
  m.computeBoundingSphere();
  return m;
}

const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
/** Matrix from position, Y rotation and scale. */
export function trs(x, y, z, rotY = 0, sx = 1, sy = 1, sz = 1) {
  _q.setFromEuler(_e.set(0, rotY, 0));
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q.clone(), new THREE.Vector3(sx, sy, sz));
}

// Triangle collector for geometry written in a local wall frame (s, y, d) — see layout.js.
// A Mesher holds local triangles; emit() transforms them into the world frame of one wall
// (mirroring the house-left wall) and appends them to a Bucket, which finally becomes one
// non-indexed BufferGeometry with metric UVs per (material, level).
import * as THREE from 'three';

function normalOf(a, b, c) {
  const ux = b[0] - a[0];
  const uy = b[1] - a[1];
  const uz = b[2] - a[2];
  const vx = c[0] - a[0];
  const vy = c[1] - a[1];
  const vz = c[2] - a[2];
  return [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
}

/** Metric UV of a local point for a face with (local) normal n: box projection in the wall frame. */
function autoUV(p, n) {
  const as = Math.abs(n[0]);
  const ay = Math.abs(n[1]);
  const ad = Math.abs(n[2]);
  if (ay >= as && ay >= ad) return [p[0], p[2]]; // floors / soffits: (s, d)
  if (ad >= as) return [p[0], p[1]]; // faces parallel to the wall: (s, y)
  return [p[2], p[1]]; // faces square to the wall: (d, y)
}

export class Mesher {
  constructor() {
    this.pos = [];
    this.uv = [];
    this.nor = null; // explicit local normals (smooth surfaces); flat normals are computed otherwise
    this.col = null; // vertex colours
  }

  get triangles() {
    return this.pos.length / 9;
  }

  /** Triangle with the winding as given (counter-clockwise seen from its front, in local coordinates). */
  tri(a, b, c, uvs) {
    const n = normalOf(a, b, c);
    if (n[0] * n[0] + n[1] * n[1] + n[2] * n[2] < 1e-14) return;
    this.pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    if (uvs) this.uv.push(uvs[0][0], uvs[0][1], uvs[1][0], uvs[1][1], uvs[2][0], uvs[2][1]);
    else {
      const ua = autoUV(a, n);
      const ub = autoUV(b, n);
      const uc = autoUV(c, n);
      this.uv.push(ua[0], ua[1], ub[0], ub[1], uc[0], uc[1]);
    }
  }

  /** Triangle wound so that its front faces along `h` (only the sign of the dot product matters). */
  triToward(a, b, c, h, uvs) {
    const n = normalOf(a, b, c);
    if (n[0] * h[0] + n[1] * h[1] + n[2] * h[2] >= 0) this.tri(a, b, c, uvs);
    else this.tri(a, c, b, uvs && [uvs[0], uvs[2], uvs[1]]);
  }

  /** Quad a-b-c-d (loop order, either direction) facing along `h`. */
  quadToward(a, b, c, d, h, uvs) {
    this.triToward(a, b, c, h, uvs && [uvs[0], uvs[1], uvs[2]]);
    this.triToward(a, c, d, h, uvs && [uvs[0], uvs[2], uvs[3]]);
  }

  /** Convex hexahedron: bottom loop b0-b3, top loop t0-t3 (ti above bi). Faces point outward. */
  hexa(b0, b1, b2, b3, t0, t1, t2, t3) {
    const all = [b0, b1, b2, b3, t0, t1, t2, t3];
    const c = [0, 0, 0];
    for (const p of all) {
      c[0] += p[0] / 8;
      c[1] += p[1] / 8;
      c[2] += p[2] / 8;
    }
    const face = (p, q, r, s) => {
      const h = [(p[0] + q[0] + r[0] + s[0]) / 4 - c[0], (p[1] + q[1] + r[1] + s[1]) / 4 - c[1], (p[2] + q[2] + r[2] + s[2]) / 4 - c[2]];
      this.quadToward(p, q, r, s, h);
    };
    face(b0, b1, b2, b3);
    face(t0, t1, t2, t3);
    face(b0, b1, t1, t0);
    face(b1, b2, t2, t1);
    face(b2, b3, t3, t2);
    face(b3, b0, t0, t3);
  }

  /** Box aligned with the wall frame. */
  box(s0, s1, y0, y1, d0, d1) {
    this.hexa([s0, y0, d0], [s1, y0, d0], [s1, y0, d1], [s0, y0, d1], [s0, y1, d0], [s1, y1, d0], [s1, y1, d1], [s0, y1, d1]);
  }

  /**
   * Box running along the wall from s0 to s1 between insets d0 and d1, whose ends are
   * mitred: the end plane at s0 is s = s0 + k0·d, at s1 it is s = s1 + k1·d.
   * yA / yB may be numbers or [y at s0, y at s1] for members that slope along the wall.
   */
  run(s0, s1, d0, d1, yA, yB, k0 = 0, k1 = 0) {
    const a = Array.isArray(yA) ? yA : [yA, yA];
    const b = Array.isArray(yB) ? yB : [yB, yB];
    this.hexa(
      [s0 + k0 * d0, a[0], d0],
      [s1 + k1 * d0, a[1], d0],
      [s1 + k1 * d1, a[1], d1],
      [s0 + k0 * d1, a[0], d1],
      [s0 + k0 * d0, b[0], d0],
      [s1 + k1 * d0, b[1], d0],
      [s1 + k1 * d1, b[1], d1],
      [s0 + k0 * d1, b[0], d1],
    );
  }

  /** Smooth-shaded triangle with explicit local normals and vertex colours (curtains). */
  triNC(a, b, c, na, nb, nc, ca, cb, cc, ua, ub, uc) {
    if (!this.nor) this.nor = [];
    if (!this.col) this.col = [];
    this.pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    this.nor.push(na[0], na[1], na[2], nb[0], nb[1], nb[2], nc[0], nc[1], nc[2]);
    this.col.push(ca, ca, ca, cb, cb, cb, cc, cc, cc);
    this.uv.push(ua[0], ua[1], ub[0], ub[1], uc[0], uc[1]);
  }

  /** Flat triangle facing along `h` with one grey vertex colour per corner. */
  triColToward(a, b, c, h, ca, cb, cc) {
    if (!this.col) this.col = [];
    const before = this.pos.length;
    const n = normalOf(a, b, c);
    const flip = n[0] * h[0] + n[1] * h[1] + n[2] * h[2] < 0;
    if (flip) this.tri(a, c, b);
    else this.tri(a, b, c);
    if (this.pos.length === before) return;
    if (flip) this.col.push(ca, ca, ca, cc, cc, cc, cb, cb, cb);
    else this.col.push(ca, ca, ca, cb, cb, cb, cc, cc, cc);
  }
}

export class Bucket {
  constructor() {
    this.pos = [];
    this.nor = [];
    this.uv = [];
    this.col = null;
  }

  get triangles() {
    return this.pos.length / 9;
  }

  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    if (this.col) g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.computeBoundingBox();
    g.computeBoundingSphere();
    return g;
  }
}

/** Transform the local triangles of `m` into the world frame `f` and append them to bucket `b`. */
export function emit(b, m, f) {
  const { ox, oz, tx, tz, nx, nz } = f;
  const sx = f.mirror ? -1 : 1;
  const P = m.pos;
  const nTri = P.length / 9;
  if (m.col && !b.col) b.col = new Array((b.pos.length / 3) * 3).fill(1);
  const order = f.mirror ? [0, 2, 1] : [0, 1, 2];
  const w = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let t = 0; t < nTri; t++) {
    for (let k = 0; k < 3; k++) {
      const i = t * 9 + order[k] * 3;
      const s = P[i];
      const d = P[i + 2];
      w[k * 3] = sx * (ox + s * tx + d * nx);
      w[k * 3 + 1] = P[i + 1];
      w[k * 3 + 2] = oz + s * tz + d * nz;
      const j = t * 6 + order[k] * 2;
      b.uv.push(m.uv[j], m.uv[j + 1]);
      if (m.col) b.col.push(m.col[i], m.col[i + 1], m.col[i + 2]);
      else if (b.col) b.col.push(1, 1, 1);
    }
    b.pos.push(w[0], w[1], w[2], w[3], w[4], w[5], w[6], w[7], w[8]);
    if (m.nor) {
      for (let k = 0; k < 3; k++) {
        const i = t * 9 + order[k] * 3;
        const ns = m.nor[i];
        const nd = m.nor[i + 2];
        b.nor.push(sx * (ns * tx + nd * nx), m.nor[i + 1], ns * tz + nd * nz);
      }
    } else {
      const ux = w[3] - w[0];
      const uy = w[4] - w[1];
      const uz = w[5] - w[2];
      const vx = w[6] - w[0];
      const vy = w[7] - w[1];
      const vz = w[8] - w[2];
      let fx = uy * vz - uz * vy;
      let fy = uz * vx - ux * vz;
      let fz = ux * vy - uy * vx;
      const l = Math.hypot(fx, fy, fz) || 1;
      fx /= l;
      fy /= l;
      fz /= l;
      b.nor.push(fx, fy, fz, fx, fy, fz, fx, fy, fz);
    }
  }
}

/** Buckets keyed by material id and building level. */
export class Buckets {
  constructor() {
    this.map = new Map();
  }

  get(matId, level, tag = '') {
    const key = `${matId}|${level ?? ''}|${tag}`;
    let b = this.map.get(key);
    if (!b) {
      b = new Bucket();
      b.matId = matId;
      b.level = level;
      b.tag = tag;
      this.map.set(key, b);
    }
    return b;
  }

  /** Emit a mesher into the bucket of (matId, level, tag) for each of the given frames. */
  add(matId, level, mesher, frames, tag = '') {
    const b = this.get(matId, level, tag);
    for (const f of frames) emit(b, mesher, f);
  }
}

/** Deterministic pseudo-random numbers in [0, 1). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

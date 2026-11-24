// Geometry batching for the stage module: thousands of small steel members (truss
// lacing, legs, rails, wires) are written straight into flat arrays and turned into ONE
// non-indexed BufferGeometry per material. UVs are metric (tri-planar, same convention
// as core/geom.js metricUV), so textures tile at real-world scale.
import * as THREE from 'three';
import { metricUV, mesh } from '../../core/geom.js';

// corner index = (x ? 1 : 0) | (y ? 2 : 0) | (z ? 4 : 0); each face as a ring of corners
const HEX_FACES = [
  [0, 4, 6, 2],
  [1, 3, 7, 5],
  [0, 1, 5, 4],
  [2, 6, 7, 3],
  [0, 2, 3, 1],
  [4, 5, 7, 6],
];

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _n = new THREE.Vector3();
const _nm = new THREE.Matrix3();

export class Batch {
  constructor() {
    this.pos = [];
    this.nor = [];
  }

  get triangles() {
    return this.pos.length / 9;
  }

  /** Flat triangle; winding decides the normal. */
  tri(a, b, c) {
    const ux = b[0] - a[0];
    const uy = b[1] - a[1];
    const uz = b[2] - a[2];
    const vx = c[0] - a[0];
    const vy = c[1] - a[1];
    const vz = c[2] - a[2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz);
    if (l < 1e-12) return this;
    nx /= l;
    ny /= l;
    nz /= l;
    this.pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    this.nor.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
    return this;
  }

  /** Flat quad a-b-c-d (counter-clockwise seen from the side the normal points to). */
  quad(a, b, c, d) {
    this.tri(a, b, c);
    this.tri(a, c, d);
    return this;
  }

  /** Triangle with explicit vertex normals; the winding is fixed to agree with them. */
  triN(a, na, b, nb, c, nc) {
    const ux = b[0] - a[0];
    const uy = b[1] - a[1];
    const uz = b[2] - a[2];
    const vx = c[0] - a[0];
    const vy = c[1] - a[1];
    const vz = c[2] - a[2];
    const gx = uy * vz - uz * vy;
    const gy = uz * vx - ux * vz;
    const gz = ux * vy - uy * vx;
    const d = gx * (na[0] + nb[0] + nc[0]) + gy * (na[1] + nb[1] + nc[1]) + gz * (na[2] + nb[2] + nc[2]);
    if (d >= 0) {
      this.pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      this.nor.push(na[0], na[1], na[2], nb[0], nb[1], nb[2], nc[0], nc[1], nc[2]);
    } else {
      this.pos.push(a[0], a[1], a[2], c[0], c[1], c[2], b[0], b[1], b[2]);
      this.nor.push(na[0], na[1], na[2], nc[0], nc[1], nc[2], nb[0], nb[1], nb[2]);
    }
    return this;
  }

  /** Quad visible from both sides. */
  quad2(a, b, c, d) {
    this.quad(a, b, c, d);
    this.quad(d, c, b, a);
    return this;
  }

  /**
   * Hexahedron from 8 corners indexed (x?1:0)|(y?2:0)|(z?4:0) in its own local sense.
   * Faces are oriented away from the centroid, so any consistent corner set works.
   */
  hexa(c) {
    let mx = 0;
    let my = 0;
    let mz = 0;
    for (let i = 0; i < 8; i++) {
      mx += c[i][0];
      my += c[i][1];
      mz += c[i][2];
    }
    mx /= 8;
    my /= 8;
    mz /= 8;
    for (const f of HEX_FACES) {
      const A = c[f[0]];
      const B = c[f[1]];
      const C = c[f[2]];
      const D = c[f[3]];
      const ux = B[0] - A[0];
      const uy = B[1] - A[1];
      const uz = B[2] - A[2];
      const vx = D[0] - A[0];
      const vy = D[1] - A[1];
      const vz = D[2] - A[2];
      const nx = uy * vz - uz * vy;
      const ny = uz * vx - ux * vz;
      const nz = ux * vy - uy * vx;
      const fx = (A[0] + B[0] + C[0] + D[0]) / 4 - mx;
      const fy = (A[1] + B[1] + C[1] + D[1]) / 4 - my;
      const fz = (A[2] + B[2] + C[2] + D[2]) / 4 - mz;
      if (nx * fx + ny * fy + nz * fz >= 0) this.quad(A, B, C, D);
      else this.quad(D, C, B, A);
    }
    return this;
  }

  /** Box given centre and size, optionally rotated about +Y around its centre. */
  box(cx, cy, cz, sx, sy, sz, rotY = 0) {
    const hx = sx / 2;
    const hy = sy / 2;
    const hz = sz / 2;
    const cs = Math.cos(rotY);
    const sn = Math.sin(rotY);
    const c = [];
    for (let i = 0; i < 8; i++) {
      const lx = i & 1 ? hx : -hx;
      const ly = i & 2 ? hy : -hy;
      const lz = i & 4 ? hz : -hz;
      c.push([cx + lx * cs + lz * sn, cy + ly, cz - lx * sn + lz * cs]);
    }
    return this.hexa(c);
  }

  /** Box spanning the given ranges. */
  span(x0, x1, y0, y1, z0, z1) {
    return this.box((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
  }

  /** Box of the given size centred on the origin of `matrix` (any rigid transform). */
  boxM(matrix, sx, sy, sz, ox = 0, oy = 0, oz = 0) {
    const c = [];
    for (let i = 0; i < 8; i++) {
      _p.set(ox + (i & 1 ? sx / 2 : -sx / 2), oy + (i & 2 ? sy / 2 : -sy / 2), oz + (i & 4 ? sz / 2 : -sz / 2)).applyMatrix4(matrix);
      c.push([_p.x, _p.y, _p.z]);
    }
    return this.hexa(c);
  }

  /**
   * Rectangular member from a to b ([x, y, z]); cross-section w (sideways) × h (the
   * "vertical" of the section, as far as the direction allows).
   */
  beam(a, b, w, h = w) {
    let dx = b[0] - a[0];
    let dy = b[1] - a[1];
    let dz = b[2] - a[2];
    const len = Math.hypot(dx, dy, dz);
    if (len < 1e-6) return this;
    dx /= len;
    dy /= len;
    dz /= len;
    // side = d × up (or world X when the member is vertical)
    let sx;
    let sy;
    let sz;
    if (Math.abs(dy) > 0.999) {
      sx = 1;
      sy = 0;
      sz = 0;
    } else {
      sx = -dz;
      sy = 0;
      sz = dx;
      const sl = Math.hypot(sx, sz);
      sx /= sl;
      sz /= sl;
    }
    // v = side × d
    const vx = sy * dz - sz * dy;
    const vy = sz * dx - sx * dz;
    const vz = sx * dy - sy * dx;
    const hw = w / 2;
    const hh = h / 2;
    const c = [];
    for (let i = 0; i < 8; i++) {
      const o = i & 4 ? b : a;
      const su = i & 1 ? hw : -hw;
      const sv = i & 2 ? hh : -hh;
      c.push([o[0] + sx * su + vx * sv, o[1] + sy * su + vy * sv, o[2] + sz * su + vz * sv]);
    }
    return this.hexa(c);
  }

  /** Round tube from a to b with smooth normals; r1 = radius at b (defaults to r). */
  tube(a, b, r, seg = 6, { caps = false, r1 = r } = {}) {
    let dx = b[0] - a[0];
    let dy = b[1] - a[1];
    let dz = b[2] - a[2];
    const len = Math.hypot(dx, dy, dz);
    if (len < 1e-6) return this;
    dx /= len;
    dy /= len;
    dz /= len;
    let sx;
    let sy;
    let sz;
    if (Math.abs(dy) > 0.999) {
      sx = 1;
      sy = 0;
      sz = 0;
    } else {
      sx = -dz;
      sy = 0;
      sz = dx;
      const sl = Math.hypot(sx, sz);
      sx /= sl;
      sz /= sl;
    }
    const vx = sy * dz - sz * dy;
    const vy = sz * dx - sx * dz;
    const vz = sx * dy - sy * dx;
    const slope = (r - r1) / len; // normal tilt for cones
    const ring = [];
    for (let i = 0; i <= seg; i++) {
      const t = (i / seg) * Math.PI * 2;
      const cs = Math.cos(t);
      const sn = Math.sin(t);
      let nx = sx * cs + vx * sn + dx * slope;
      let ny = sy * cs + vy * sn + dy * slope;
      let nz = sz * cs + vz * sn + dz * slope;
      const nl = Math.hypot(nx, ny, nz);
      nx /= nl;
      ny /= nl;
      nz /= nl;
      ring.push([sx * cs + vx * sn, sy * cs + vy * sn, sz * cs + vz * sn, nx, ny, nz]);
    }
    for (let i = 0; i < seg; i++) {
      const p = ring[i];
      const q = ring[i + 1];
      const pn = [p[3], p[4], p[5]];
      const qn = [q[3], q[4], q[5]];
      const a0 = [a[0] + p[0] * r, a[1] + p[1] * r, a[2] + p[2] * r];
      const a1 = [a[0] + q[0] * r, a[1] + q[1] * r, a[2] + q[2] * r];
      const b0 = [b[0] + p[0] * r1, b[1] + p[1] * r1, b[2] + p[2] * r1];
      const b1 = [b[0] + q[0] * r1, b[1] + q[1] * r1, b[2] + q[2] * r1];
      if (r > 1e-6) this.triN(a0, pn, a1, qn, b1, qn);
      if (r1 > 1e-6) this.triN(a0, pn, b1, qn, b0, pn);
      if (caps) {
        const dn = [-dx, -dy, -dz];
        const up = [dx, dy, dz];
        if (r > 1e-6) this.triN(a, dn, a0, dn, a1, dn);
        if (r1 > 1e-6) this.triN(b, up, b1, up, b0, up);
      }
    }
    return this;
  }

  /** Vertical cylinder. */
  cylY(x, z, y0, y1, r, seg = 12, opts = { caps: true }) {
    return this.tube([x, y0, z], [x, y1, z], r, seg, opts);
  }

  /** Polyline of tubes (cables, bent pipes). */
  path(points, r, seg = 5) {
    for (let i = 0; i < points.length - 1; i++) this.tube(points[i], points[i + 1], r, seg);
    return this;
  }

  /** Append any BufferGeometry (indexed or not), optionally transformed. */
  add(geometry, matrix) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    const p = g.attributes.position;
    const n = g.attributes.normal;
    if (matrix) _nm.getNormalMatrix(matrix);
    for (let i = 0; i < p.count; i++) {
      _p.fromBufferAttribute(p, i);
      if (matrix) _p.applyMatrix4(matrix);
      this.pos.push(_p.x, _p.y, _p.z);
      if (n) {
        _n.fromBufferAttribute(n, i);
        if (matrix) _n.applyMatrix3(_nm).normalize();
        this.nor.push(_n.x, _n.y, _n.z);
      } else this.nor.push(0, 1, 0);
    }
    if (g !== geometry) g.dispose();
    return this;
  }

  /** Append another batch transformed by a matrix (used to mirror / place sub-assemblies). */
  addBatch(other, matrix) {
    const P = other.pos;
    const N = other.nor;
    if (!matrix) {
      for (let i = 0; i < P.length; i++) this.pos.push(P[i]);
      for (let i = 0; i < N.length; i++) this.nor.push(N[i]);
      return this;
    }
    _nm.getNormalMatrix(matrix);
    const flip = matrix.determinant() < 0;
    for (let t = 0; t < P.length; t += 9) {
      const order = flip ? [0, 6, 3] : [0, 3, 6];
      for (const o of order) {
        _p.set(P[t + o], P[t + o + 1], P[t + o + 2]).applyMatrix4(matrix);
        _n.set(N[t + o], N[t + o + 1], N[t + o + 2]).applyMatrix3(_nm).normalize();
        this.pos.push(_p.x, _p.y, _p.z);
        this.nor.push(_n.x, _n.y, _n.z);
      }
    }
    return this;
  }

  /** Non-indexed BufferGeometry with position, normal and metric uv. */
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    return metricUV(g);
  }
}

/** A set of batches keyed by material id; turns into one mesh per material. */
export class Collector {
  constructor() {
    this.map = new Map();
  }

  /** Batch for a material id. */
  b(id) {
    let batch = this.map.get(id);
    if (!batch) {
      batch = new Batch();
      this.map.set(id, batch);
    }
    return batch;
  }

  /** Merge another collector in, transformed (mirror with a negative-determinant matrix is fine). */
  merge(other, matrix) {
    for (const [id, batch] of other.map) this.b(id).addBatch(batch, matrix);
    return this;
  }

  /**
   * Add one mesh per material to `group`. `mats` maps material id → THREE.Material.
   * `tags` = { layer, level, userData } applied to every mesh.
   */
  flush(group, mats, { prefix = '', layer = 'stage', level, userData, cast = true, receive = true } = {}) {
    for (const [id, batch] of this.map) {
      if (batch.triangles === 0) continue;
      const material = mats[id];
      if (!material) throw new Error(`stage: no material for batch "${id}"`);
      const m = mesh(batch.geometry(), material, { name: `${prefix}${id}`, layer, level, cast, receive });
      if (userData) Object.assign(m.userData, userData);
      group.add(m);
    }
    this.map.clear();
    return group;
  }
}

export const MIRROR_X = new THREE.Matrix4().makeScale(-1, 1, 1);

/** Matrix4 from translation + Euler angles (order YXZ: yaw, then pitch, then roll). */
export function trs(x, y, z, yaw = 0, pitch = 0, roll = 0) {
  return _m.clone().makeRotationFromEuler(new THREE.Euler(pitch, yaw, roll, 'YXZ')).setPosition(x, y, z);
}

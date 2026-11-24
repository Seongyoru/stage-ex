// Small modelling kit for the Music Terrace precinct: plan frames, geometry collectors,
// beams, railings, stairs and instancing. Everything returns non-indexed geometry with
// metre UVs (see core/geom.js), so it can be merged per material.
import * as THREE from 'three';
import { box, boxBetween, merge, mesh, metricUV } from '../../core/geom.js';

export const LAYER = 'precinct';

// --- plan frames ------------------------------------------------------------------------
/**
 * A plan frame: origin (ox, oz) and a unit direction u = (ux, uz) in world XZ. The second
 * axis is v = (−uz, ux). Local coordinates (a, y, b) map to world
 *   x = ox + a·ux + b·vx,  z = oz + a·uz + b·vz
 * which is a pure rotation about +Y (no mirroring), so geometry built axis-aligned in
 * local space (X = a, Z = b) keeps its metric UVs and normals when placed.
 */
export function frame(ox, oz, ux, uz) {
  const l = Math.hypot(ux, uz) || 1;
  const x = ux / l;
  const z = uz / l;
  return { ox, oz, ux: x, uz: z, vx: -z, vz: x, rotY: Math.atan2(-z, x) };
}
export const toW = (f, a, b) => [f.ox + a * f.ux + b * f.vx, f.oz + a * f.uz + b * f.vz];
export const toL = (f, x, z) => {
  const dx = x - f.ox;
  const dz = z - f.oz;
  return [dx * f.ux + dz * f.uz, dx * f.vx + dz * f.vz];
};
export function frameMatrix(f) {
  const m = new THREE.Matrix4().makeRotationY(f.rotY);
  m.setPosition(f.ox, 0, f.oz);
  return m;
}
/** Bake a local-space geometry into world space. */
export function place(geometry, f) {
  if (!geometry) return null;
  geometry.applyMatrix4(frameMatrix(f));
  return geometry;
}

// --- plan math --------------------------------------------------------------------------
export function signedArea(ring) {
  let s = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x0, z0] = ring[i];
    const [x1, z1] = ring[(i + 1) % ring.length];
    s += x0 * z1 - x1 * z0;
  }
  return s / 2;
}
export function pointInRing(x, z, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i];
    const [xj, zj] = ring[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}
export function distToSegment(x, z, a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const l2 = dx * dx + dz * dz || 1e-9;
  let t = ((x - a[0]) * dx + (z - a[1]) * dz) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(x - (a[0] + t * dx), z - (a[1] + t * dz));
}
export function distToRing(x, z, ring) {
  let d = Infinity;
  for (let i = 0; i < ring.length; i++) d = Math.min(d, distToSegment(x, z, ring[i], ring[(i + 1) % ring.length]));
  return d;
}
/** Intersection of line p + t·d with line q + s·e (plan). */
export function lineHit(p, d, q, e) {
  const den = d[0] * e[1] - d[1] * e[0];
  const t = ((q[0] - p[0]) * e[1] - (q[1] - p[1]) * e[0]) / den;
  return [p[0] + t * d[0], p[1] + t * d[1]];
}
export const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const dist2 = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
export const unit2 = (a, b) => {
  const l = dist2(a, b) || 1;
  return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
};
/**
 * Offset an OPEN polyline sideways by d (positive = to the right of travel seen from above
 * with +Z down the page, i.e. normal (−dz, dx)... the caller passes explicit per-segment
 * normals instead to stay unambiguous). Mitred at inner vertices, square at the ends.
 */
export function offsetPolyline(points, normals, d) {
  const out = [];
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const n0 = normals[Math.max(0, i - 1)];
    const n1 = normals[Math.min(n - 2, i)];
    const bx = n0[0] + n1[0];
    const bz = n0[1] + n1[1];
    const k = d / (1 + n0[0] * n1[0] + n0[1] * n1[1]);
    out.push([points[i][0] + bx * k, points[i][1] + bz * k]);
  }
  return out;
}
/** Cumulative length table of a polyline and a sampler (point + tangent at distance s). */
export function polylineSampler(points) {
  const acc = [0];
  for (let i = 1; i < points.length; i++) acc.push(acc[i - 1] + dist2(points[i - 1], points[i]));
  const total = acc[acc.length - 1];
  const at = (s) => {
    const ss = Math.max(0, Math.min(total, s));
    let i = 1;
    while (i < acc.length - 1 && acc[i] < ss) i++;
    const t = (ss - acc[i - 1]) / (acc[i] - acc[i - 1] || 1);
    const p = lerp2(points[i - 1], points[i], t);
    const d = unit2(points[i - 1], points[i]);
    return { p, d };
  };
  return { total, at, acc };
}

// --- geometry collectors ----------------------------------------------------------------
/** Collects geometry per material (and per level tag) and turns it into merged meshes. */
export class Bag {
  constructor() {
    this.parts = new Map();
  }
  add(material, geometry, level) {
    if (!geometry) return;
    const key = `${material.name}|${level ?? '-'}`;
    let e = this.parts.get(key);
    if (!e) this.parts.set(key, (e = { material, level, list: [] }));
    e.list.push(geometry);
  }
  /** Move everything of a local-space bag into this one through a frame. */
  absorb(local, f) {
    const m = frameMatrix(f);
    for (const e of local.parts.values()) {
      const g = merge(e.list);
      g.applyMatrix4(m);
      this.add(e.material, g, e.level);
    }
  }
  flush(group, { prefix = '', noCast = () => false, hidden = () => false } = {}) {
    const made = [];
    for (const e of this.parts.values()) {
      if (e.list.length === 0) continue;
      const g = merge(e.list);
      const id = e.material.name;
      const m = mesh(g, e.material, {
        name: `${prefix}${id}${e.level !== undefined ? ` L${e.level}` : ''}`,
        layer: LAYER,
        level: e.level,
        cast: !(e.material.userData.unlit || e.material.transparent || noCast(id)),
        receive: !e.material.userData.unlit,
      });
      if (hidden(id)) m.visible = false;
      group.add(m);
      made.push(m);
    }
    this.parts.clear();
    return made;
  }
}

/** Box in a local frame given by ranges; a = along u, b = along v. */
export function lbox(a0, a1, y0, y1, b0, b1) {
  if (Math.abs(a1 - a0) < 1e-5 || Math.abs(y1 - y0) < 1e-5 || Math.abs(b1 - b0) < 1e-5) return null;
  return boxBetween(a0, b0, a1, b1, y0, y1);
}

/** Rectangular beam between two 3D points; w = horizontal width, h = depth in the vertical plane. */
export function beam(p0, p1, w, h) {
  const d = new THREE.Vector3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
  const len = d.length();
  if (len < 1e-5) return null;
  d.multiplyScalar(1 / len);
  const g = new THREE.BoxGeometry(len, h, w);
  const up = new THREE.Vector3(0, 1, 0);
  let zAxis = new THREE.Vector3().crossVectors(d, up);
  if (zAxis.lengthSq() < 1e-8) zAxis = new THREE.Vector3(0, 0, 1);
  zAxis.normalize();
  const yAxis = new THREE.Vector3().crossVectors(zAxis, d).normalize();
  const m = new THREE.Matrix4().makeBasis(d, yAxis, zAxis);
  m.setPosition((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2);
  g.applyMatrix4(m);
  return metricUV(g);
}

/** Round tube between two 3D points. */
export function tube(p0, p1, radius, segments = 8) {
  const d = new THREE.Vector3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
  const len = d.length();
  if (len < 1e-5) return null;
  d.multiplyScalar(1 / len);
  const g = new THREE.CylinderGeometry(radius, radius, len, segments, 1, false);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
  const m = new THREE.Matrix4().makeRotationFromQuaternion(q);
  m.setPosition((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2);
  g.applyMatrix4(m);
  return metricUV(g);
}

/** Free-form triangles/quads → geometry with metric UVs. Points are [x, y, z]. */
export class Tris {
  constructor() {
    this.p = [];
  }
  tri(a, b, c) {
    this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    return this;
  }
  /** Quad a-b-c-d (in order around the perimeter), wound so its normal points along `n` when given. */
  quad(a, b, c, d, n) {
    if (n) {
      const ux = b[0] - a[0];
      const uy = b[1] - a[1];
      const uz = b[2] - a[2];
      const vx = d[0] - a[0];
      const vy = d[1] - a[1];
      const vz = d[2] - a[2];
      const dot = (uy * vz - uz * vy) * n[0] + (uz * vx - ux * vz) * n[1] + (ux * vy - uy * vx) * n[2];
      if (dot < 0) return this.tri(a, c, b).tri(a, d, c);
    }
    return this.tri(a, b, c).tri(a, c, d);
  }
  /** Triangle wound so its normal points along `n`. */
  triN(a, b, c, n) {
    const ux = b[0] - a[0];
    const uy = b[1] - a[1];
    const uz = b[2] - a[2];
    const vx = c[0] - a[0];
    const vy = c[1] - a[1];
    const vz = c[2] - a[2];
    const dot = (uy * vz - uz * vy) * n[0] + (uz * vx - ux * vz) * n[1] + (ux * vy - uy * vx) * n[2];
    return dot < 0 ? this.tri(a, c, b) : this.tri(a, b, c);
  }
  get empty() {
    return this.p.length === 0;
  }
  build() {
    if (this.p.length === 0) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.computeVertexNormals();
    return metricUV(g);
  }
}

/**
 * Sloped band between two closed or open plan polylines at different heights (mansard
 * roofs, ramps' sides, skirts). outer[i] ↔ inner[i]. `up` selects faces whose normal has
 * a positive Y component.
 */
export function band(outer, yOuter, inner, yInner, { closed = true } = {}) {
  const t = new Tris();
  const n = outer.length;
  const fy = (y, p) => (typeof y === 'function' ? y(p[0], p[1]) : y);
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const j = (i + 1) % n;
    const a = [outer[i][0], fy(yOuter, outer[i]), outer[i][1]];
    const b = [outer[j][0], fy(yOuter, outer[j]), outer[j][1]];
    const c = [inner[j][0], fy(yInner, inner[j]), inner[j][1]];
    const d = [inner[i][0], fy(yInner, inner[i]), inner[i][1]];
    // outward-and-up normal: horizontal part points from inner to outer
    const nx = (a[0] + b[0] - c[0] - d[0]) / 2;
    const nz = (a[2] + b[2] - c[2] - d[2]) / 2;
    const run = Math.hypot(nx, nz) || 1;
    const rise = Math.abs((c[1] + d[1] - a[1] - b[1]) / 2);
    t.quad(a, b, c, d, [(nx / run) * rise, run, (nz / run) * rise]);
  }
  return t.build();
}

// --- instancing -------------------------------------------------------------------------
/** InstancedMesh from a base geometry and a list of Matrix4. */
export function instanced(geometry, material, matrices, { name = '', level, cast = true, receive = true } = {}) {
  const im = new THREE.InstancedMesh(geometry, material, matrices.length);
  for (let i = 0; i < matrices.length; i++) im.setMatrixAt(i, matrices[i]);
  im.instanceMatrix.needsUpdate = true;
  im.name = name;
  im.castShadow = cast;
  im.receiveShadow = receive;
  im.userData.layer = LAYER;
  if (level !== undefined) im.userData.level = level;
  im.computeBoundingBox?.();
  im.computeBoundingSphere?.();
  return im;
}
export function trs(x, y, z, rotY = 0, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Matrix4();
  m.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY), new THREE.Vector3(sx, sy, sz));
  return m;
}

// --- railings ---------------------------------------------------------------------------
/**
 * Collector for the black flat-bar railings (1.1 m, flat top rail, bottom rail, posts and
 * vertical flat-bar balusters). Rails and posts are merged geometry; balusters are instances.
 */
export class Railings {
  constructor({ balusters = true } = {}) {
    this.withBalusters = balusters;
    this.rails = new Map(); // level → geometries
    this.bal = new Map(); // level → matrices
  }
  _list(map, level) {
    const k = level ?? '-';
    if (!map.has(k)) map.set(k, { level, list: [] });
    return map.get(k).list;
  }
  /**
   * path: [[x, y, z], ...] floor points (y = walking surface under the rail).
   * opts: h rail height, spacing baluster pitch, post pitch, kerb height under the bottom rail.
   */
  run(path, { h = 1.1, spacing = 0.13, post = 1.6, level, gap = 0.1, closed = false, handrail = false } = {}) {
    const rails = this._list(this.rails, level);
    const bal = this._list(this.bal, level);
    const n = path.length;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const a = path[i];
      const b = path[(i + 1) % n];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const dz = b[2] - a[2];
      const run = Math.hypot(dx, dz);
      if (run < 0.05) continue;
      const rotY = Math.atan2(-dz, dx);
      rails.push(beam([a[0], a[1] + h, a[2]], [b[0], b[1] + h, b[2]], 0.07, 0.035));
      if (!handrail) rails.push(beam([a[0], a[1] + gap, a[2]], [b[0], b[1] + gap, b[2]], 0.035, 0.03));
      const nPost = Math.max(1, Math.round(run / post));
      for (let k = 0; k <= nPost; k++) {
        if (k === nPost && i < n - 2 && !closed) continue; // shared with the next segment
        const t = k / nPost;
        const x = a[0] + dx * t;
        const y = a[1] + dy * t;
        const z = a[2] + dz * t;
        rails.push(box(x, y + h / 2, z, 0.05, h, 0.05, rotY));
      }
      if (this.withBalusters && !handrail) {
        const nb = Math.max(1, Math.floor(run / spacing));
        for (let k = 1; k < nb; k++) {
          const t = k / nb;
          bal.push(trs(a[0] + dx * t, a[1] + dy * t + gap, a[2] + dz * t, rotY, 1, h - gap - 0.02, 1));
        }
      }
    }
  }
  flush(group, material) {
    for (const e of this.rails.values()) {
      if (!e.list.length) continue;
      group.add(mesh(merge(e.list), material, { name: `precinct railings${e.level !== undefined ? ` L${e.level}` : ''}`, layer: LAYER, level: e.level, cast: true }));
    }
    // baluster: flat bar 12 × 45 mm, unit height, open top and bottom (8 triangles)
    const t = new Tris();
    const w = 0.006;
    const d = 0.022;
    const c = [
      [-w, -d],
      [w, -d],
      [w, d],
      [-w, d],
    ];
    for (let i = 0; i < 4; i++) {
      const p = c[i];
      const q = c[(i + 1) % 4];
      t.quad([p[0], 0, p[1]], [q[0], 0, q[1]], [q[0], 1, q[1]], [p[0], 1, p[1]], [q[1] - p[1], 0, -(q[0] - p[0])]);
    }
    const base = t.build();
    for (const e of this.bal.values()) {
      if (!e.list.length) continue;
      group.add(instanced(base, material, e.list, { name: `precinct balusters${e.level !== undefined ? ` L${e.level}` : ''}`, level: e.level, cast: false }));
    }
  }
}

// --- stairs -----------------------------------------------------------------------------
/**
 * Solid stair along an open plan polyline `top` (the top nosing line). The steps descend
 * toward `normals` (one outward unit normal per segment). Returns geometries:
 *   treads (horizontal faces incl. landings), risers (vertical faces), nosings (thin strips),
 *   plus the list of nosing lines [{ line: [[x, z], ...], y }] and the bottom line.
 * profile: n risers of height r, treads of depth t; landings = { afterRiser: depth }.
 */
export function stairBand(top, normals, { yTop, n, r, t, landings = {}, nosing = 0.05 }) {
  const treads = new Tris();
  const risers = new Tris();
  const nose = new Tris();
  const lines = [];
  let off = 0;
  let y = yTop;
  let prev = offsetPolyline(top, normals, 0);
  for (let k = 1; k <= n; k++) {
    // riser k at offset `off`, from y down to y − r
    const yLow = y - r;
    for (let i = 0; i < prev.length - 1; i++) {
      const a = prev[i];
      const b = prev[i + 1];
      risers.quad([a[0], y, a[1]], [b[0], y, b[1]], [b[0], yLow, b[1]], [a[0], yLow, a[1]], [normals[i][0], 0, normals[i][1]]);
    }
    lines.push({ line: prev, y });
    if (nosing > 0) {
      const back = offsetPolyline(top, normals, off - nosing);
      for (let i = 0; i < prev.length - 1; i++) {
        nose.quad([back[i][0], y + 0.004, back[i][1]], [back[i + 1][0], y + 0.004, back[i + 1][1]], [prev[i + 1][0], y + 0.004, prev[i + 1][1]], [prev[i][0], y + 0.004, prev[i][1]], [0, 1, 0]);
      }
    }
    y = yLow;
    if (k === n) break;
    const depth = landings[k] ?? t;
    off += depth;
    const next = offsetPolyline(top, normals, off);
    for (let i = 0; i < prev.length - 1; i++) {
      treads.quad([prev[i][0], y, prev[i][1]], [prev[i + 1][0], y, prev[i + 1][1]], [next[i + 1][0], y, next[i + 1][1]], [next[i][0], y, next[i][1]], [0, 1, 0]);
    }
    prev = next;
  }
  return { treads: treads.build(), risers: risers.build(), nosings: nose.build(), lines, bottom: prev, yBottom: y, depth: off };
}

/** Height of the walking surface of a stair profile at plan distance d from the top nosing (for rails). */
export function stairProfile({ yTop, n, r, t, landings = {} }) {
  // pitch line through the nosings: [plan distance from the top nosing, floor height]
  const pts = [[0, yTop]];
  let off = 0;
  let y = yTop;
  for (let k = 1; k < n; k++) {
    const depth = landings[k] ?? t;
    if (depth > t * 1.5) {
      pts.push([off + t, y - r]); // foot of the flight = start of the landing
      pts.push([off + depth, y - r]); // end of the landing = top nosing of the next flight
    }
    off += depth;
    y -= r;
  }
  pts.push([off + t, y - r]);
  return { pts, depth: off, yBottom: y - r };
}

export { box, boxBetween, merge, mesh, metricUV };

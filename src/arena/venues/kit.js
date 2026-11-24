// Small geometry / assembly toolkit used only by the venues module.
// (Helpers that src/core/geom.js does not provide: swept profiles, lathes, slanted rods,
// stroke lettering, per-material assembly and instancing. Nothing here touches the DOM.)
import * as THREE from 'three';
import { metricUV, merge, mesh, prism } from '../../core/geom.js';

export const TAU = Math.PI * 2;
export const LAYER = 'venues';

// ---------------------------------------------------------------------------------------
// primitives (all return non-indexed geometry with metric UVs, in the caller's local frame)
// ---------------------------------------------------------------------------------------

/** Box by size then centre, optionally rotated about +Y around its centre. */
export function bx(sx, sy, sz, cx = 0, cy = 0, cz = 0, rotY = 0) {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  if (rotY) g.rotateY(rotY);
  g.translate(cx, cy, cz);
  return metricUV(g);
}

/** Box standing on y0: size (sx, h, sz), plan centre (cx, cz). */
export function bxOn(sx, h, sz, cx, y0, cz, rotY = 0) {
  return bx(sx, h, sz, cx, y0 + h / 2, cz, rotY);
}

/** Vertical cylinder / cone frustum with its base at y0. */
export function cyl(r, h, cx = 0, y0 = 0, cz = 0, seg = 12, rTop = r, open = false) {
  const g = new THREE.CylinderGeometry(rTop, r, h, seg, 1, open);
  g.translate(cx, y0 + h / 2, cz);
  return metricUV(g);
}

/** Thin rod between two 3D points. */
export function rod(p0, p1, r = 0.01, seg = 5) {
  const a = new THREE.Vector3(...p0);
  const b = new THREE.Vector3(...p1);
  const d = b.clone().sub(a);
  const len = d.length();
  const g = new THREE.CylinderGeometry(r, r, len, seg, 1, false);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  g.applyQuaternion(q);
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return metricUV(g);
}

/** Flat bar (rectangular section w x t) between two 3D points; `w` lies in the vertical plane when possible. */
export function bar(p0, p1, w = 0.03, t = 0.01) {
  const a = new THREE.Vector3(...p0);
  const b = new THREE.Vector3(...p1);
  const d = b.clone().sub(a);
  const len = d.length();
  const g = new THREE.BoxGeometry(t, len, w);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  g.applyQuaternion(q);
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return metricUV(g);
}

/** Solid of revolution about the vertical axis through (cx, cz); profile = [[r, y], ...] bottom to top. */
export function lathe(profile, seg = 12, cx = 0, y0 = 0, cz = 0) {
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(Math.max(r, 1e-4), y)), seg);
  g.translate(cx, y0, cz);
  return metricUV(g);
}

/** Sphere / ellipsoid. */
export function ball(r, cx, cy, cz, sx = 1, sy = 1, sz = 1, wseg = 10, hseg = 6) {
  const g = new THREE.SphereGeometry(r, wseg, hseg);
  g.scale(sx, sy, sz);
  g.translate(cx, cy, cz);
  return metricUV(g);
}

/** Transform a geometry in place (scale → rotate X, Z, Y → translate) and return it. */
export function tf(g, { x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, s = 1 } = {}) {
  if (s !== 1) g.scale(s, s, s);
  if (rx) g.rotateX(rx);
  if (rz) g.rotateZ(rz);
  if (ry) g.rotateY(ry);
  if (x || y || z) g.translate(x, y, z);
  return g;
}

/** Instance / placement matrix: rotation about +Y then translation (uniform scale optional). */
export function M4(x, y, z, ry = 0, s = 1) {
  const m = new THREE.Matrix4();
  m.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(s, s, s));
  return m;
}

/** rotY that turns a piece modelled facing local +Z so that it faces plan direction (dx, dz). */
export function faceDir(dx, dz) {
  return Math.atan2(dx, dz);
}

// ---------------------------------------------------------------------------------------
// plan rings / paths ([x, z] points)
// ---------------------------------------------------------------------------------------

export function ellipseRing(a, b, n = 24, cx = 0, cz = 0) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU;
    out.push([cx + a * Math.cos(t), cz + b * Math.sin(t)]);
  }
  return out;
}

export function rectRing(x0, z0, x1, z1) {
  return [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
}

export function roundedRectRing(w, d, r, n = 4, cx = 0, cz = 0) {
  const out = [];
  const hw = w / 2 - r;
  const hd = d / 2 - r;
  const corners = [[hw, hd, 0], [-hw, hd, 1], [-hw, -hd, 2], [hw, -hd, 3]];
  for (const [x, z, k] of corners) {
    for (let i = 0; i <= n; i++) {
      const t = (k + i / n) * (Math.PI / 2);
      out.push([cx + x + r * Math.cos(t), cz + z + r * Math.sin(t)]);
    }
  }
  return out;
}

/** Points of a circular arc, angle measured from +X toward +Z. */
export function arcPath(cx, cz, R, a0, a1, n = 12) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = a0 + ((a1 - a0) * i) / n;
    out.push([cx + R * Math.cos(t), cz + R * Math.sin(t)]);
  }
  return out;
}

/** Join path pieces, dropping duplicated joints. */
export function joinPaths(...pieces) {
  const out = [];
  for (const piece of pieces) {
    for (const p of piece) {
      const last = out[out.length - 1];
      if (last && Math.hypot(last[0] - p[0], last[1] - p[1]) < 1e-4) continue;
      out.push(p);
    }
  }
  return out;
}

/** Cumulative arc length sampler of an open path: returns { length, at(s) → { p, t, left } }. */
export function pathSampler(path) {
  const acc = [0];
  for (let i = 1; i < path.length; i++) acc.push(acc[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const length = acc[acc.length - 1];
  return {
    length,
    at(s) {
      const ss = Math.min(Math.max(s, 0), length);
      let i = 1;
      while (i < path.length - 1 && acc[i] < ss) i++;
      const a = path[i - 1];
      const b = path[i];
      const seg = acc[i] - acc[i - 1] || 1;
      const k = (ss - acc[i - 1]) / seg;
      const tx = (b[0] - a[0]) / seg;
      const tz = (b[1] - a[1]) / seg;
      return { p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], t: [tx, tz], left: [tz, -tx] };
    },
  };
}

// ---------------------------------------------------------------------------------------
// swept profile
// ---------------------------------------------------------------------------------------

function pushTri(out, A, B, C, nx, ny, nz) {
  const ux = B[0] - A[0];
  const uy = B[1] - A[1];
  const uz = B[2] - A[2];
  const vx = C[0] - A[0];
  const vy = C[1] - A[1];
  const vz = C[2] - A[2];
  const d = (uy * vz - uz * vy) * nx + (uz * vx - ux * vz) * ny + (ux * vy - uy * vx) * nz;
  if (d >= 0) out.push(A[0], A[1], A[2], B[0], B[1], B[2], C[0], C[1], C[2]);
  else out.push(A[0], A[1], A[2], C[0], C[1], C[2], B[0], B[1], B[2]);
}

/**
 * Sweep a closed section along a plan path.
 *   profile  [[d, y], ...] closed polygon; d is measured along the LEFT side of the direction of
 *            travel seen from above (travelling toward +X, left is −Z), y is height.
 *   path     [[x, z], ...]
 *   closed   the path is a loop; caps are omitted
 *   skip     indices of profile edges to leave out (hidden faces)
 * Corners are mitred. Returns geometry with metric UVs.
 */
export function sweep(profile, path, { closed = false, caps = true, skip = [] } = {}) {
  const n = path.length;
  const m = profile.length;
  let area = 0;
  for (let j = 0; j < m; j++) {
    const [d0, y0] = profile[j];
    const [d1, y1] = profile[(j + 1) % m];
    area += d0 * y1 - d1 * y0;
  }
  const sgn = area > 0 ? 1 : -1;
  const dirOf = (a, b) => {
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const l = Math.hypot(dx, dz) || 1;
    return [dx / l, dz / l];
  };
  const rings = [];
  const tangents = [];
  for (let i = 0; i < n; i++) {
    const prev = i > 0 ? path[i - 1] : closed ? path[n - 1] : null;
    const next = i < n - 1 ? path[i + 1] : closed ? path[0] : null;
    const a = prev ? dirOf(prev, path[i]) : null;
    const b = next ? dirOf(path[i], next) : null;
    let tx = (a ? a[0] : 0) + (b ? b[0] : 0);
    let tz = (a ? a[1] : 0) + (b ? b[1] : 0);
    const tl = Math.hypot(tx, tz) || 1;
    tx /= tl;
    tz /= tl;
    const ref = b || a;
    // left normals: (tz, −tx)
    const cosHalf = tz * ref[1] + -tx * -ref[0];
    const k = 1 / Math.max(cosHalf, 0.35);
    const nx = tz * k;
    const nz = -tx * k;
    tangents.push([tx, tz]);
    rings.push(profile.map(([d, y]) => [path[i][0] + nx * d, y, path[i][1] + nz * d]));
  }
  const pos = [];
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const i1 = (i + 1) % n;
    const [sx, sz] = dirOf(path[i], path[i1]);
    const lx = sz;
    const lz = -sx;
    for (let j = 0; j < m; j++) {
      if (skip.includes(j)) continue;
      const j1 = (j + 1) % m;
      const dd = profile[j1][0] - profile[j][0];
      const dy = profile[j1][1] - profile[j][1];
      if (Math.abs(dd) < 1e-9 && Math.abs(dy) < 1e-9) continue;
      const md = sgn * dy;
      const my = sgn * -dd;
      const A = rings[i][j];
      const B = rings[i][j1];
      const C = rings[i1][j1];
      const D = rings[i1][j];
      pushTri(pos, A, B, C, md * lx, my, md * lz);
      pushTri(pos, A, C, D, md * lx, my, md * lz);
    }
  }
  if (!closed && caps) {
    const tris = THREE.ShapeUtils.triangulateShape(profile.map(([d, y]) => new THREE.Vector2(d, y)), []);
    for (const [a, b, c] of tris) {
      pushTri(pos, rings[0][a], rings[0][b], rings[0][c], -tangents[0][0], 0, -tangents[0][1]);
      pushTri(pos, rings[n - 1][a], rings[n - 1][b], rings[n - 1][c], tangents[n - 1][0], 0, tangents[n - 1][1]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return metricUV(g);
}

/** Vertical plate of a plan polygon: ring extruded y0..y1 (thin wrapper over prism for readability). */
export function slab(ring, y0, y1, opts) {
  return prism(ring, y0, y1, opts);
}

/**
 * Vertical flat plate from a polygon drawn in an elevation plane.
 *   pts  [[s, y], ...] polygon in the plate's own plane (s horizontal, y up)
 * The plate is modelled in the local XY plane (s → x), thickness t centred on z = 0.
 */
export function plateXY(pts, t = 0.01) {
  const ring = pts.map(([s, y]) => [s, -y]);
  const g = prism(ring, -t / 2, t / 2);
  g.rotateX(Math.PI / 2); // prism Y (thickness) → Z, plan z (= −y) → +y
  return metricUV(g);
}

// ---------------------------------------------------------------------------------------
// stroke lettering (no canvas, no font files): glyphs are polylines on a unit grid
// ---------------------------------------------------------------------------------------

const GLYPHS = {
  A: { w: 0.6, s: [[[0, 0], [0.3, 1], [0.6, 0]], [[0.12, 0.36], [0.48, 0.36]]] },
  B: { w: 0.56, s: [[[0, 0], [0, 1], [0.4, 1], [0.52, 0.88], [0.52, 0.64], [0.4, 0.52], [0, 0.52]], [[0.4, 0.52], [0.56, 0.4], [0.56, 0.12], [0.44, 0], [0, 0]]] },
  D: { w: 0.56, s: [[[0, 0], [0, 1], [0.34, 1], [0.56, 0.8], [0.56, 0.2], [0.34, 0], [0, 0]]] },
  E: { w: 0.5, s: [[[0.5, 1], [0, 1], [0, 0], [0.5, 0]], [[0, 0.52], [0.4, 0.52]]] },
  G: { w: 0.56, s: [[[0.56, 0.82], [0.42, 1], [0.14, 1], [0, 0.84], [0, 0.16], [0.14, 0], [0.42, 0], [0.56, 0.16], [0.56, 0.48], [0.3, 0.48]]] },
  I: { w: 0.08, s: [[[0.04, 0], [0.04, 1]]] },
  K: { w: 0.58, s: [[[0, 0], [0, 1]], [[0.55, 1], [0, 0.4]], [[0.2, 0.62], [0.58, 0]]] },
  L: { w: 0.48, s: [[[0, 1], [0, 0], [0.48, 0]]] },
  N: { w: 0.56, s: [[[0, 0], [0, 1], [0.56, 0], [0.56, 1]]] },
  O: { w: 0.56, s: [[[0.14, 0], [0, 0.16], [0, 0.84], [0.14, 1], [0.42, 1], [0.56, 0.84], [0.56, 0.16], [0.42, 0], [0.14, 0]]] },
  P: { w: 0.54, s: [[[0, 0], [0, 1], [0.42, 1], [0.54, 0.86], [0.54, 0.6], [0.42, 0.46], [0, 0.46]]] },
  R: { w: 0.56, s: [[[0, 0], [0, 1], [0.42, 1], [0.54, 0.86], [0.54, 0.62], [0.42, 0.48], [0, 0.48]], [[0.3, 0.48], [0.56, 0]]] },
  T: { w: 0.56, s: [[[0, 1], [0.56, 1]], [[0.28, 1], [0.28, 0]]] },
  U: { w: 0.56, s: [[[0, 1], [0, 0.16], [0.14, 0], [0.42, 0], [0.56, 0.16], [0.56, 1]]] },
  V: { w: 0.6, s: [[[0, 1], [0.3, 0], [0.6, 1]]] },
  a: { w: 0.5, s: [[[0.05, 0.52], [0.18, 0.62], [0.36, 0.62], [0.48, 0.5], [0.48, 0]], [[0.48, 0.36], [0.16, 0.36], [0.03, 0.26], [0.03, 0.1], [0.14, 0], [0.34, 0], [0.48, 0.12]]] },
  e: { w: 0.5, s: [[[0.02, 0.33], [0.5, 0.33], [0.5, 0.48], [0.38, 0.62], [0.14, 0.62], [0.02, 0.48], [0.02, 0.14], [0.14, 0], [0.4, 0], [0.5, 0.1]]] },
  g: { w: 0.5, s: [[[0.48, 0.62], [0.48, -0.16], [0.36, -0.28], [0.12, -0.28], [0.04, -0.2]], [[0.48, 0.5], [0.36, 0.62], [0.14, 0.62], [0.02, 0.5], [0.02, 0.14], [0.14, 0.02], [0.36, 0.02], [0.48, 0.14]]] },
  n: { w: 0.48, s: [[[0, 0], [0, 0.62]], [[0, 0.44], [0.16, 0.62], [0.34, 0.62], [0.48, 0.5], [0.48, 0]]] },
  o: { w: 0.5, s: [[[0.14, 0], [0.02, 0.14], [0.02, 0.48], [0.14, 0.62], [0.36, 0.62], [0.48, 0.48], [0.48, 0.14], [0.36, 0], [0.14, 0]]] },
  r: { w: 0.36, s: [[[0, 0], [0, 0.62]], [[0, 0.42], [0.14, 0.58], [0.36, 0.62]]] },
  u: { w: 0.48, s: [[[0, 0.62], [0, 0.14], [0.12, 0], [0.32, 0], [0.48, 0.16]], [[0.48, 0.62], [0.48, 0]]] },
  '-': { w: 0.36, s: [[[0.02, 0.42], [0.34, 0.42]]] },
  5: { w: 0.52, s: [[[0.5, 1], [0.06, 1], [0.03, 0.56], [0.36, 0.6], [0.52, 0.46], [0.52, 0.16], [0.38, 0], [0.12, 0], [0, 0.12]]] },
  7: { w: 0.55, s: [[[0, 1], [0.55, 1], [0.2, 0]]] },
  ' ': { w: 0.3, s: [] },
};

/**
 * Lettering as extruded strokes in the local XY plane, facing +Z, baseline at y = 0, centred on x = 0.
 *   height  cap height in metres; weight = stroke width; depth = extrusion; shear = italic slant (x per y).
 * Returns { geometry, width }.
 */
export function strokeText(str, { height = 1, weight = 0.12, depth = 0.03, shear = 0, tracking = 0.2, zOffset = 0 } = {}) {
  let total = 0;
  for (const ch of str) total += ((GLYPHS[ch] || GLYPHS[' ']).w + tracking) * height;
  total -= tracking * height;
  const parts = [];
  let pen = -total / 2;
  for (const ch of str) {
    const gl = GLYPHS[ch] || GLYPHS[' '];
    for (const line of gl.s) {
      for (let i = 0; i < line.length - 1; i++) {
        const x0 = pen + (line[i][0] + line[i][1] * shear) * height;
        const y0 = line[i][1] * height;
        const x1 = pen + (line[i + 1][0] + line[i + 1][1] * shear) * height;
        const y1 = line[i + 1][1] * height;
        const len = Math.hypot(x1 - x0, y1 - y0);
        const g = new THREE.BoxGeometry(len + weight * 0.9, weight, depth);
        g.rotateZ(Math.atan2(y1 - y0, x1 - x0));
        g.translate((x0 + x1) / 2, (y0 + y1) / 2, zOffset);
        parts.push(metricUV(g));
      }
    }
    pen += (gl.w + tracking) * height;
  }
  return { geometry: merge(parts), width: total };
}

// ---------------------------------------------------------------------------------------
// assembly
// ---------------------------------------------------------------------------------------

/** Collects the pieces of one furniture type per material; parts() → [{ geometry, material }]. */
export class Asm {
  constructor() {
    this.map = new Map();
  }
  add(material, ...geometries) {
    if (!this.map.has(material)) this.map.set(material, []);
    for (const g of geometries.flat()) if (g) this.map.get(material).push(g);
    return this;
  }
  parts() {
    return [...this.map.entries()].map(([material, list]) => ({ material, geometry: merge(list) }));
  }
}

/**
 * Collects static geometry per (level, material) and instanced furniture; flush() turns the
 * buckets into one mesh per material and level so draw calls stay low.
 */
export class Kit {
  constructor(group) {
    this.group = group;
    group.userData.propSlots = [];
    this.buckets = new Map();
  }
  /** Static geometry already in world coordinates. */
  add(level, material, ...geometries) {
    const key = `${level}|${material.name}`;
    if (!this.buckets.has(key)) this.buckets.set(key, { level, material, list: [] });
    for (const g of geometries.flat()) if (g) this.buckets.get(key).list.push(g);
  }
  /** Place the parts of a furniture type once (not instanced), baked into the static buckets. */
  addParts(level, parts, matrix) {
    for (const { geometry, material } of parts) {
      const g = geometry.clone();
      if (matrix) g.applyMatrix4(matrix);
      this.add(level, material, g);
    }
  }
  /** Instanced furniture: one InstancedMesh per part. `colors` (optional) = per-instance THREE.Color list. */
  instance(level, name, parts, matrices, { colors = null, cast = false, prop, placeholder = prop, propTransform } = {}) {
    if (!matrices.length) return;
    if (prop) {
      for (const matrix of matrices) {
        const m = propTransform ? matrix.clone().multiply(propTransform) : matrix;
        const pos = new THREE.Vector3().setFromMatrixPosition(m).toArray();
        const e = m.elements;
        this.group.userData.propSlots.push({ type: prop, pos, rotY: Math.atan2(e[8], e[10]), scale: Math.hypot(e[0], e[2]), level, layer: LAYER });
      }
    }
    parts.forEach(({ geometry, material }, k) => {
      const im = new THREE.InstancedMesh(geometry, material, matrices.length);
      matrices.forEach((m, i) => im.setMatrixAt(i, m));
      if (colors) colors.forEach((c, i) => im.setColorAt(i, c));
      im.instanceMatrix.needsUpdate = true;
      im.name = `venues/L${level}/${name}/${material.name || k}`;
      im.castShadow = cast;
      im.receiveShadow = true;
      im.userData.layer = LAYER;
      im.userData.level = level;
      im.userData.instancedProp = name;
      if (placeholder) im.userData.propPlaceholder = placeholder;
      im.computeBoundingSphere();
      this.group.add(im);
    });
  }
  /** A ready-made mesh (custom attributes such as vertex colours). */
  addMesh(level, name, geometry, material, { cast = false } = {}) {
    const m = mesh(geometry, material, { name: `venues/L${level}/${name}`, layer: LAYER, level, cast, receive: false });
    this.group.add(m);
    return m;
  }
  flush() {
    for (const { level, material, list } of this.buckets.values()) {
      if (!list.length) continue;
      const g = merge(list);
      const m = mesh(g, material, { name: `venues/L${level}/${material.name}`, layer: LAYER, level, cast: false, receive: !material.userData.unlit });
      this.group.add(m);
    }
    this.buckets.clear();
  }
}

/**
 * Soft "light pool" fans drawn on a surface: additive triangles with vertex colours (bright at the
 * source, black at the rim). Each fan: { p: [x, y, z] source, u: [x, y, z] spread half-vector,
 * v: [x, y, z] throw vector, n: [x, y, z] small offset off the surface }.
 */
export function glowFans(fans, color = '#FFD890', steps = 14) {
  const pos = [];
  const col = [];
  const c = new THREE.Color(color);
  const k = 0.5;
  for (const f of fans) {
    const P = (a, b) => [f.p[0] + f.u[0] * a + f.v[0] * b + f.n[0], f.p[1] + f.u[1] * a + f.v[1] * b + f.n[1], f.p[2] + f.u[2] * a + f.v[2] * b + f.n[2]];
    const src = P(0, 0.0);
    // teardrop: narrow at the lamp, widest above mid height, rounded head
    const rim = [];
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const h = (1 - Math.cos(t)) / 2;
      rim.push(P(Math.sin(t) * (0.3 + 0.7 * h), h));
    }
    const mid = rim.map((r) => [src[0] + (r[0] - src[0]) * 0.5, src[1] + (r[1] - src[1]) * 0.5, src[2] + (r[2] - src[2]) * 0.5]);
    for (let i = 0; i < steps; i++) {
      pos.push(...src, ...mid[i], ...mid[i + 1]);
      col.push(c.r, c.g, c.b, c.r * k, c.g * k, c.b * k, c.r * k, c.g * k, c.b * k);
      pos.push(...mid[i], ...rim[i], ...rim[i + 1], ...mid[i], ...rim[i + 1], ...mid[i + 1]);
      col.push(c.r * k, c.g * k, c.b * k, 0, 0, 0, 0, 0, 0, c.r * k, c.g * k, c.b * k, 0, 0, 0, c.r * k, c.g * k, c.b * k);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  const uv = new Float32Array((pos.length / 3) * 2);
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

export { merge, mesh, prism, metricUV };

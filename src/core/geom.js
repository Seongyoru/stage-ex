// Geometry helpers shared by all model modules. Everything is in metres in the WORLD
// frame conventions of frame.js (X = house right, Y = up, Z = away from the stage).
// All helpers return NON-INDEXED BufferGeometry with position, normal and metre-scaled
// uv, so any of them can be merged with merge() and textured at real-world scale.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Give a geometry UVs in metres by box (tri-planar) projection: each triangle is
 * projected along the dominant axis of its normal. Call it on geometry whose vertex
 * positions are already in metres (i.e. after baking transforms with applyMatrix4 /
 * translate / rotate*, not on a mesh that is scaled afterwards).
 * Returns a non-indexed geometry (position, normal, uv).
 */
export function metricUV(geometry) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  if (!g.attributes.normal) g.computeVertexNormals();
  const pos = g.attributes.position;
  const nor = g.attributes.normal;
  const uv = new Float32Array(pos.count * 2);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1);
    c.fromBufferAttribute(pos, i + 2);
    n.subVectors(b, a).cross(c.clone().sub(a));
    if (n.lengthSq() < 1e-12) n.fromBufferAttribute(nor, i);
    const ax = Math.abs(n.x);
    const ay = Math.abs(n.y);
    const az = Math.abs(n.z);
    for (let k = 0; k < 3; k++) {
      const p = k === 0 ? a : k === 1 ? b : c;
      let u;
      let v;
      if (ay >= ax && ay >= az) {
        u = p.x;
        v = p.z; // floors / ceilings
      } else if (ax >= az) {
        u = p.z;
        v = p.y; // walls facing ±X
      } else {
        u = p.x;
        v = p.y; // walls facing ±Z
      }
      uv[(i + k) * 2] = u;
      uv[(i + k) * 2 + 1] = v;
    }
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  for (const name of Object.keys(g.attributes)) {
    if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
  }
  return g;
}

/** Merge geometries produced by these helpers (or passed through metricUV) into one. */
export function merge(geometries) {
  const list = geometries.filter(Boolean).map((g) => (g.index || !g.attributes.uv ? metricUV(g) : g));
  if (list.length === 0) return new THREE.BufferGeometry();
  if (list.length === 1) return list[0];
  const merged = mergeGeometries(list, false);
  for (const g of list) g.dispose();
  return merged;
}

/** Axis-aligned box given its centre and size, optionally rotated about +Y around its centre. */
export function box(cx, cy, cz, sx, sy, sz, rotY = 0) {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  if (rotY) g.rotateY(rotY);
  g.translate(cx, cy, cz);
  return metricUV(g);
}

/** Box spanning y0..y1 whose plan is the rectangle from (x0, z0) to (x1, z1). */
export function boxBetween(x0, z0, x1, z1, y0, y1) {
  return box((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
}

function signedArea(ring) {
  let s = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x0, z0] = ring[i];
    const [x1, z1] = ring[(i + 1) % ring.length];
    s += x0 * z1 - x1 * z0;
  }
  return s / 2;
}

/**
 * Vertical prism: plan ring [[x, z], ...] (either winding, not closed) extruded from y0 to
 * y1, with optional holes (rings). Options: top / bottom / sides = false to omit faces.
 * The bottom may slope: pass y0 or y1 as a function (x, z) => y to get a sloped cap.
 */
export function prism(ring, y0, y1, { holes = [], top = true, bottom = true, sides = true } = {}) {
  const fy0 = typeof y0 === 'function' ? y0 : () => y0;
  const fy1 = typeof y1 === 'function' ? y1 : () => y1;
  // In the XZ plane seen from above (+Y toward the viewer) x × z points DOWN, so a ring
  // that is counter-clockwise in (x, z) numbers is clockwise seen from above. Normalise
  // the contour to positive signed area in (x, z); holes get the opposite winding.
  const contour = signedArea(ring) > 0 ? ring.slice() : ring.slice().reverse();
  const holeRings = holes.map((h) => (signedArea(h) < 0 ? h.slice() : h.slice().reverse()));
  const positions = [];
  // Emit a triangle wound so that its geometric normal points along (nx, ny, nz).
  const tri = (A, B, C, nx, ny, nz) => {
    const ux = B[0] - A[0];
    const uy = B[1] - A[1];
    const uz = B[2] - A[2];
    const vx = C[0] - A[0];
    const vy = C[1] - A[1];
    const vz = C[2] - A[2];
    const d = (uy * vz - uz * vy) * nx + (uz * vx - ux * vz) * ny + (ux * vy - uy * vx) * nz;
    if (d >= 0) positions.push(A[0], A[1], A[2], B[0], B[1], B[2], C[0], C[1], C[2]);
    else positions.push(A[0], A[1], A[2], C[0], C[1], C[2], B[0], B[1], B[2]);
  };
  if (top || bottom) {
    const c2 = contour.map(([x, z]) => new THREE.Vector2(x, z));
    const h2 = holeRings.map((h) => h.map(([x, z]) => new THREE.Vector2(x, z)));
    const all = [...contour, ...holeRings.flat()];
    const tris = THREE.ShapeUtils.triangulateShape(c2, h2);
    for (const [i, j, k] of tris) {
      const A = all[i];
      const B = all[j];
      const C = all[k];
      if (top) tri([A[0], fy1(A[0], A[1]), A[1]], [B[0], fy1(B[0], B[1]), B[1]], [C[0], fy1(C[0], C[1]), C[1]], 0, 1, 0);
      if (bottom) tri([A[0], fy0(A[0], A[1]), A[1]], [B[0], fy0(B[0], B[1]), B[1]], [C[0], fy0(C[0], C[1]), C[1]], 0, -1, 0);
    }
  }
  if (sides) {
    // For a ring with positive (x, z) signed area the outward normal of edge a→b is (dz, −dx);
    // hole rings have negative area, so the same formula points into the hole (away from the solid).
    const wallsOf = (r) => {
      for (let i = 0; i < r.length; i++) {
        const [xa, za] = r[i];
        const [xb, zb] = r[(i + 1) % r.length];
        const nx = zb - za;
        const nz = -(xb - xa);
        if (nx === 0 && nz === 0) continue;
        const a0 = [xa, fy0(xa, za), za];
        const a1 = [xa, fy1(xa, za), za];
        const b0 = [xb, fy0(xb, zb), zb];
        const b1 = [xb, fy1(xb, zb), zb];
        tri(a0, b0, b1, nx, 0, nz);
        tri(a0, b1, a1, nx, 0, nz);
      }
    };
    wallsOf(contour);
    for (const h of holeRings) wallsOf(h);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.computeVertexNormals();
  return metricUV(g);
}

/**
 * Straight wall between plan points a = [x, z] and b = [x, z], from y0 to y1, of the given
 * thickness centred on the line (offset shifts it sideways: positive = to the left of a→b
 * seen from above... use small values and check visually).
 */
export function wall(a, b, y0, y1, thickness = 0.3, offset = 0) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const len = Math.hypot(dx, dz);
  if (len < 1e-6) return null;
  const rotY = Math.atan2(-dz, dx);
  const nx = -dz / len;
  const nz = dx / len;
  return box((a[0] + b[0]) / 2 + nx * offset, (y0 + y1) / 2, (a[1] + b[1]) / 2 + nz * offset, len, y1 - y0, thickness, rotY);
}

/** Walls along a polyline of plan points; `closed` joins the last point to the first. */
export function wallPath(points, y0, y1, thickness = 0.3, { closed = false } = {}) {
  const parts = [];
  const n = points.length;
  for (let i = 0; i < (closed ? n : n - 1); i++) parts.push(wall(points[i], points[(i + 1) % n], y0, y1, thickness));
  return merge(parts);
}

/** Vertical cylinder (columns, poles): centre of base at (x, y0, z). */
export function cylinder(x, z, y0, y1, radius, segments = 16) {
  const g = new THREE.CylinderGeometry(radius, radius, y1 - y0, segments);
  g.translate(x, (y0 + y1) / 2, z);
  return metricUV(g);
}

/** Offset a convex or mildly concave plan ring by `d` metres (positive = outward). */
export function offsetRing(ring, d) {
  const sign = signedArea(ring) > 0 ? 1 : -1;
  const n = ring.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const p0 = ring[(i + n - 1) % n];
    const p1 = ring[i];
    const p2 = ring[(i + 1) % n];
    const e1 = [p1[0] - p0[0], p1[1] - p0[1]];
    const e2 = [p2[0] - p1[0], p2[1] - p1[1]];
    const l1 = Math.hypot(e1[0], e1[1]) || 1;
    const l2 = Math.hypot(e2[0], e2[1]) || 1;
    // outward normals for positive-area rings: (dz, −dx)
    const n1 = [(e1[1] / l1) * sign, (-e1[0] / l1) * sign];
    const n2 = [(e2[1] / l2) * sign, (-e2[0] / l2) * sign];
    const bx = n1[0] + n2[0];
    const bz = n1[1] + n2[1];
    const bl = Math.hypot(bx, bz) || 1;
    const cosHalf = (n1[0] * bx + n1[1] * bz) / bl;
    const k = d / Math.max(cosHalf, 0.2);
    out.push([p1[0] + (bx / bl) * k, p1[1] + (bz / bl) * k]);
  }
  return out;
}

/**
 * Wrap a geometry in a Mesh with the tags the app uses for visibility modes.
 *   layer  'site' | 'context' | 'precinct' | 'exterior' | 'structure' | 'hall' | 'bowl' | 'seats' | 'stage' | 'roof' | 'venues' | 'props'
 *   level  building LEVEL (1-9) the object belongs to, when it belongs to one (floor selector)
 */
export function mesh(geometry, material, { name = '', layer, level, cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geometry, material);
  m.name = name;
  m.castShadow = cast;
  m.receiveShadow = receive;
  if (layer) m.userData.layer = layer;
  if (level !== undefined) m.userData.level = level;
  return m;
}

/** Triangle count of an Object3D subtree (instances multiplied). */
export function countTriangles(root) {
  let tris = 0;
  root.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const g = o.geometry;
    const t = g.index ? g.index.count / 3 : g.attributes.position ? g.attributes.position.count / 3 : 0;
    tris += t * (o.isInstancedMesh ? o.count : 1);
  });
  return Math.round(tris);
}

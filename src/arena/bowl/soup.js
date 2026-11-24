// Triangle-soup collector for the seating bowl. Geometry is pushed as oriented triangles
// into buckets keyed by material / level / group, and turned into one merged mesh per
// bucket at the end (metric UVs through core/geom.metricUV).
//
// Most of the bowl is described in a plan FRAME: two unit vectors u (along the rows) and
// v (row to row, away from the stage) through the world origin. A frame point (u, y, v)
// maps to world [u*ux + v*vx, y, u*uz + v*vz]. The three seating facets and the two
// bisector (junction) directions are all such frames.
import * as THREE from 'three';
import { metricUV, merge, mesh } from '../../core/geom.js';

export function frame(ux, uz, vx, vz) {
  return { ux, uz, vx, vz };
}

/** Frame point → world [x, y, z]. */
export function P(F, u, y, v) {
  return [u * F.ux + v * F.vx, y, u * F.uz + v * F.vz];
}

/** World [x, z] → frame [u, v]. */
export function toFrame(F, x, z) {
  return [x * F.ux + z * F.uz, x * F.vx + z * F.vz];
}

export class Soup {
  constructor() {
    this.buckets = new Map();
  }

  /** Bucket for a material; opts: level, group (mesh name suffix), telescopic, cast, receive, name. */
  get(material, opts = {}) {
    const { level, group = '', telescopic = false } = opts;
    const key = `${material.name}|${level ?? '-'}|${telescopic ? 't' : ''}`;
    let bk = this.buckets.get(key);
    if (!bk) {
      bk = { material, level, group, telescopic, cast: opts.cast ?? true, receive: opts.receive ?? true, pos: [], extra: [], userData: opts.userData };
      this.buckets.set(key, bk);
    }
    return bk;
  }

  /** Build one mesh per bucket. */
  finish(layer) {
    const out = [];
    for (const bk of this.buckets.values()) {
      const parts = [...bk.extra];
      if (bk.pos.length) {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(bk.pos, 3));
        g.computeVertexNormals();
        parts.push(metricUV(g));
      }
      if (!parts.length) continue;
      const geometry = merge(parts);
      const id = bk.material.name.replace(/^bowl\./, '');
      const name = `bowl:L${bk.level ?? 'x'}:${bk.telescopic ? 'telescopic:' : ''}${id}`;
      const m = mesh(geometry, bk.material, { name, layer, level: bk.level, cast: bk.cast, receive: bk.receive });
      if (bk.telescopic) m.userData.telescopic = true;
      if (bk.userData) Object.assign(m.userData, bk.userData);
      out.push(m);
    }
    return out;
  }
}

// --- oriented primitives -----------------------------------------------------------------

/** Triangle wound so that its normal points along the hint (nx, ny, nz). */
export function tri(bk, a, b, c, nx, ny, nz) {
  const ux = b[0] - a[0];
  const uy = b[1] - a[1];
  const uz = b[2] - a[2];
  const vx = c[0] - a[0];
  const vy = c[1] - a[1];
  const vz = c[2] - a[2];
  const cx = uy * vz - uz * vy;
  const cy = uz * vx - ux * vz;
  const cz = ux * vy - uy * vx;
  if (cx * cx + cy * cy + cz * cz < 1e-12) return;
  const p = bk.pos;
  if (cx * nx + cy * ny + cz * nz >= 0) p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  else p.push(a[0], a[1], a[2], c[0], c[1], c[2], b[0], b[1], b[2]);
}

/** Quad a-b-c-d (perimeter order) facing the hint. */
export function quad(bk, a, b, c, d, nx, ny, nz) {
  tri(bk, a, b, c, nx, ny, nz);
  tri(bk, a, c, d, nx, ny, nz);
}

/**
 * Horizontal quad in a frame at height y. At v0 it spans ua0..ub0, at v1 it spans ua1..ub1
 * (trapezoids allowed). up = 1 faces up, -1 faces down.
 */
export function hq(bk, F, ua0, ub0, v0, ua1, ub1, v1, y, up = 1) {
  quad(bk, P(F, ua0, y, v0), P(F, ub0, y, v0), P(F, ub1, y, v1), P(F, ua1, y, v1), 0, up, 0);
}

/** Sloped quad: like hq but with heights y0 at v0 and y1 at v1. */
export function sq(bk, F, ua0, ub0, v0, y0, ua1, ub1, v1, y1, up = 1) {
  quad(bk, P(F, ua0, y0, v0), P(F, ub0, y0, v0), P(F, ub1, y1, v1), P(F, ua1, y1, v1), 0, up, 0);
}

/**
 * Vertical quad between plan points (u0, v0) and (u1, v1); heights yb/yt at each end;
 * (nu, nv) is the facing hint in frame coordinates.
 */
export function vq(bk, F, u0, v0, u1, v1, yb0, yt0, yb1, yt1, nu, nv) {
  const nx = nu * F.ux + nv * F.vx;
  const nz = nu * F.uz + nv * F.vz;
  quad(bk, P(F, u0, yb0, v0), P(F, u1, yb1, v1), P(F, u1, yt1, v1), P(F, u0, yt0, v0), nx, 0, nz);
}

/** Vertical quad on the plane v = const from ua to ub, y0..y1; dir = -1 faces the stage, +1 faces the rear. */
export function vqv(bk, F, ua, ub, v, y0, y1, dir) {
  vq(bk, F, ua, v, ub, v, y0, y1, y0, y1, 0, dir);
}

/** Vertical quad on the plane u = const from v0 to v1; dir = -1 faces -u, +1 faces +u. */
export function vqu(bk, F, u, v0, v1, y0, y1, dir) {
  vq(bk, F, u, v0, u, v1, y0, y1, y0, y1, dir, 0);
}

/** Axis-aligned box in a frame. `skip` lists faces to omit: t(op) b(ottom) f(ront, -v) r(ear, +v) l(-u) h(+u). */
export function fbox(bk, F, u0, u1, v0, v1, y0, y1, skip = '') {
  if (u1 < u0) [u0, u1] = [u1, u0];
  if (v1 < v0) [v0, v1] = [v1, v0];
  if (y1 < y0) [y0, y1] = [y1, y0];
  if (!skip.includes('t')) hq(bk, F, u0, u1, v0, u0, u1, v1, y1, 1);
  if (!skip.includes('b')) hq(bk, F, u0, u1, v0, u0, u1, v1, y0, -1);
  if (!skip.includes('f')) vqv(bk, F, u0, u1, v0, y0, y1, -1);
  if (!skip.includes('r')) vqv(bk, F, u0, u1, v1, y0, y1, 1);
  if (!skip.includes('l')) vqu(bk, F, u0, v0, v1, y0, y1, -1);
  if (!skip.includes('h')) vqu(bk, F, u1, v0, v1, y0, y1, 1);
}

/**
 * Wall slab along the plan line a → b (frame points [u, v]) with linear bottom and top
 * edges. The slab occupies `t` metres to the side given by (su, sv) (a unit vector in
 * frame coordinates, normally perpendicular to the line).
 */
export function swall(bk, F, a, b, t, su, sv, yb0, yt0, yb1, yt1, skip = '') {
  const a2 = [a[0] + su * t, a[1] + sv * t];
  const b2 = [b[0] + su * t, b[1] + sv * t];
  // two long faces
  vq(bk, F, a[0], a[1], b[0], b[1], yb0, yt0, yb1, yt1, -su, -sv);
  vq(bk, F, a2[0], a2[1], b2[0], b2[1], yb0, yt0, yb1, yt1, su, sv);
  // top and bottom
  if (!skip.includes('t')) quad(bk, P(F, a[0], yt0, a[1]), P(F, b[0], yt1, b[1]), P(F, b2[0], yt1, b2[1]), P(F, a2[0], yt0, a2[1]), 0, 1, 0);
  if (!skip.includes('b')) quad(bk, P(F, a[0], yb0, a[1]), P(F, b[0], yb1, b[1]), P(F, b2[0], yb1, b2[1]), P(F, a2[0], yb0, a2[1]), 0, -1, 0);
  // ends
  const du = b[0] - a[0];
  const dv = b[1] - a[1];
  if (!skip.includes('a')) vq(bk, F, a[0], a[1], a2[0], a2[1], yb0, yt0, yb0, yt0, -du, -dv);
  if (!skip.includes('e')) vq(bk, F, b[0], b[1], b2[0], b2[1], yb1, yt1, yb1, yt1, du, dv);
}

/** Convex plan polygon (frame points [u, v]) extruded y0..y1. */
export function fprism(bk, F, pts, y0, y1, { top = true, bottom = true, sides = true } = {}) {
  const n = pts.length;
  let cu = 0;
  let cv = 0;
  for (const p of pts) {
    cu += p[0] / n;
    cv += p[1] / n;
  }
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    if (top && i > 0 && i < n - 1) tri(bk, P(F, pts[0][0], y1, pts[0][1]), P(F, a[0], y1, a[1]), P(F, b[0], y1, b[1]), 0, 1, 0);
    if (bottom && i > 0 && i < n - 1) tri(bk, P(F, pts[0][0], y0, pts[0][1]), P(F, a[0], y0, a[1]), P(F, b[0], y0, b[1]), 0, -1, 0);
    if (sides) {
      const mu = (a[0] + b[0]) / 2 - cu;
      const mv = (a[1] + b[1]) / 2 - cv;
      // outward = perpendicular to the edge pointing away from the centroid
      let nu = b[1] - a[1];
      let nv = -(b[0] - a[0]);
      if (nu * mu + nv * mv < 0) {
        nu = -nu;
        nv = -nv;
      }
      vq(bk, F, a[0], a[1], b[0], b[1], y0, y1, y0, y1, nu, nv);
    }
  }
}

/** Round bar between two world points (no end caps unless caps = true). */
export function tube(bk, a, b, r, sides = 6, caps = false) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dz = b[2] - a[2];
  const len = Math.hypot(dx, dy, dz);
  if (len < 1e-6) return;
  const ax = [dx / len, dy / len, dz / len];
  // any vector not parallel to the axis
  const ref = Math.abs(ax[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let e1 = [ax[1] * ref[2] - ax[2] * ref[1], ax[2] * ref[0] - ax[0] * ref[2], ax[0] * ref[1] - ax[1] * ref[0]];
  const l1 = Math.hypot(e1[0], e1[1], e1[2]);
  e1 = [e1[0] / l1, e1[1] / l1, e1[2] / l1];
  const e2 = [ax[1] * e1[2] - ax[2] * e1[1], ax[2] * e1[0] - ax[0] * e1[2], ax[0] * e1[1] - ax[1] * e1[0]];
  const ring = [];
  for (let i = 0; i < sides; i++) {
    const t = (i / sides) * Math.PI * 2;
    const c = Math.cos(t) * r;
    const s = Math.sin(t) * r;
    ring.push([e1[0] * c + e2[0] * s, e1[1] * c + e2[1] * s, e1[2] * c + e2[2] * s]);
  }
  for (let i = 0; i < sides; i++) {
    const o0 = ring[i];
    const o1 = ring[(i + 1) % sides];
    const n = [o0[0] + o1[0], o0[1] + o1[1], o0[2] + o1[2]];
    quad(
      bk,
      [a[0] + o0[0], a[1] + o0[1], a[2] + o0[2]],
      [a[0] + o1[0], a[1] + o1[1], a[2] + o1[2]],
      [b[0] + o1[0], b[1] + o1[1], b[2] + o1[2]],
      [b[0] + o0[0], b[1] + o0[1], b[2] + o0[2]],
      n[0], n[1], n[2],
    );
    if (caps) {
      tri(bk, a, [a[0] + o0[0], a[1] + o0[1], a[2] + o0[2]], [a[0] + o1[0], a[1] + o1[1], a[2] + o1[2]], -ax[0], -ax[1], -ax[2]);
      tri(bk, b, [b[0] + o0[0], b[1] + o0[1], b[2] + o0[2]], [b[0] + o1[0], b[1] + o1[1], b[2] + o1[2]], ax[0], ax[1], ax[2]);
    }
  }
}

/** Polyline of round bars through world points. */
export function tubePath(bk, pts, r, sides = 6) {
  for (let i = 0; i < pts.length - 1; i++) tube(bk, pts[i], pts[i + 1], r, sides);
}

/** Flat disc (n-gon) centred at world point c, lying in the plane with normal n (unit), radius r. */
export function disc(bk, c, n, r, sides = 14) {
  const ref = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let e1 = [n[1] * ref[2] - n[2] * ref[1], n[2] * ref[0] - n[0] * ref[2], n[0] * ref[1] - n[1] * ref[0]];
  const l1 = Math.hypot(e1[0], e1[1], e1[2]);
  e1 = [e1[0] / l1, e1[1] / l1, e1[2] / l1];
  const e2 = [n[1] * e1[2] - n[2] * e1[1], n[2] * e1[0] - n[0] * e1[2], n[0] * e1[1] - n[1] * e1[0]];
  let prev = null;
  for (let i = 0; i <= sides; i++) {
    const t = (i / sides) * Math.PI * 2;
    const p = [c[0] + (e1[0] * Math.cos(t) + e2[0] * Math.sin(t)) * r, c[1] + (e1[1] * Math.cos(t) + e2[1] * Math.sin(t)) * r, c[2] + (e1[2] * Math.cos(t) + e2[2] * Math.sin(t)) * r];
    if (prev) tri(bk, c, prev, p, n[0], n[1], n[2]);
    prev = p;
  }
}

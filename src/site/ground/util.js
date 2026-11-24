// Shared helpers of the ground module: plan geometry, clipping to the diorama disc,
// ribbons along polylines, lifting onto the bridge decks. Pure functions over plain arrays;
// three.js is only used for triangulation and the final BufferGeometry.
import * as THREE from 'three';
import { metricUV } from '../../core/geom.js';
import { GROUND } from '../data/ground-data.js';

export const DISC = GROUND.disc;
/** The disc is a regular polygon with this many sides (chord sagitta 3 cm). */
export const RIM_N = 256;
export const WATER_Y = -3.0; // water surface (see ground.js header for the reasoning)
export const BED_Y = -6.5; // bottom of the quay walls / water body shown in the rim section
export const PLINTH_Y = -16; // underside of the model base

// layer heights of the flat ground surfaces (metres above y = 0)
export const Y = Object.freeze({ base: 0, lot: 0.02, park: 0.03, garden: 0.04, promenade: 0.05, path: 0.055, steps: 0.06, sidewalk: 0.065, cycle: 0.07, road: 0.08, mark: 0.1, walk: 0.2 });

export const unflat = (a) => {
  const out = [];
  for (let i = 0; i < a.length; i += 2) out.push([a[i], a[i + 1]]);
  return out;
};
export const dist2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const discR = (x, z) => Math.hypot(x - DISC.cx, z - DISC.cz);

export function signedArea(ring) {
  let s = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
}
export function pointInRing(x, z, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    if (a[1] > z !== b[1] > z && x < ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
export function distToSeg(px, pz, a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const l2 = dx * dx + dz * dz;
  let t = l2 ? ((px - a[0]) * dx + (pz - a[1]) * dz) / l2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(px - a[0] - t * dx, pz - a[1] - t * dz);
}
export function distToRing(px, pz, ring) {
  let d = Infinity;
  for (let i = 0; i < ring.length; i++) d = Math.min(d, distToSeg(px, pz, ring[i], ring[(i + 1) % ring.length]));
  return d;
}
export function lineLength(pts) {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += dist2(pts[i - 1], pts[i]);
  return l;
}

/** Deterministic pseudo-random generator (mulberry32). */
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

// --- bridge decks: lift of everything that lies on them --------------------------------
const DECKS = GROUND.decks.map((d) => {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const p of d.pts) {
    minX = Math.min(minX, p[0] - p[3]);
    maxX = Math.max(maxX, p[0] + p[3]);
    minZ = Math.min(minZ, p[1] - p[3]);
    maxZ = Math.max(maxZ, p[1] + p[3]);
  }
  return { ...d, box: [minX, maxX, minZ, maxZ] };
});
/**
 * Height of the bridge deck top under (x, z), 0 off the decks. `info` (optional object)
 * receives { deck, seg, t, lateral } of the hit.
 */
export function liftAt(x, z, pad = 0.3, info = null) {
  let best = 0;
  for (const d of DECKS) {
    const b = d.box;
    if (x < b[0] || x > b[1] || z < b[2] || z > b[3]) continue;
    let bd = Infinity;
    let by = 0;
    let bi = -1;
    let bt = 0;
    let blat = 0;
    for (let i = 0; i < d.pts.length - 1; i++) {
      const p = d.pts[i];
      const q = d.pts[i + 1];
      const dx = q[0] - p[0];
      const dz = q[1] - p[1];
      const l2 = dx * dx + dz * dz;
      const tr = ((x - p[0]) * dx + (z - p[1]) * dz) / l2;
      // off the two ends of the deck there is nothing; inside, clamp to the segment
      if ((i === 0 && tr < 0) || (i === d.pts.length - 2 && tr > 1)) continue;
      const t = tr < 0 ? 0 : tr > 1 ? 1 : tr;
      const ex = x - p[0] - t * dx;
      const ez = z - p[1] - t * dz;
      const dd = Math.hypot(ex, ez);
      const half = (p[3] + (q[3] - p[3]) * t) / 2;
      if (dd <= half + pad && dd < bd) {
        bd = dd;
        by = p[2] + (q[2] - p[2]) * t;
        bi = i;
        bt = t;
        blat = (ex * -dz + ez * dx) / Math.sqrt(l2);
      }
    }
    if (bi >= 0 && by >= best) {
      best = by;
      if (info) {
        info.deck = d;
        info.seg = bi;
        info.t = bt;
        info.lateral = blat;
      }
    }
  }
  return best;
}
export function nearDeck(x, z, margin = 12) {
  for (const d of DECKS) {
    const b = d.box;
    if (x > b[0] - margin && x < b[1] + margin && z > b[2] - margin && z < b[3] + margin) return true;
  }
  return false;
}

/** Subdivide a polyline so that no segment is longer than maxLen (only where `where` is true, if given). */
export function densify(pts, maxLen, where = null) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const l = dist2(a, b);
    const need = l > maxLen && (!where || where(a[0], a[1]) || where(b[0], b[1]) || where((a[0] + b[0]) / 2, (a[1] + b[1]) / 2));
    if (need) {
      const n = Math.ceil(l / maxLen);
      for (let k = 1; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
    }
    out.push(b);
  }
  return out;
}

/**
 * Cross-sections of a polyline: for every vertex the unit normal (to the LEFT of the
 * direction of travel seen from above with +Z down the page, i.e. n = (dz, −dx)) scaled
 * for a mitre join, plus the running station.
 */
export function sections(pts) {
  const n = pts.length;
  const out = [];
  let s = 0;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    let d0x = p[0] - a[0];
    let d0z = p[1] - a[1];
    let d1x = b[0] - p[0];
    let d1z = b[1] - p[1];
    const l0 = Math.hypot(d0x, d0z);
    const l1 = Math.hypot(d1x, d1z);
    if (l0 < 1e-9) {
      d0x = d1x;
      d0z = d1z;
    } else {
      d0x /= l0;
      d0z /= l0;
    }
    if (l1 < 1e-9) {
      d1x = d0x;
      d1z = d0z;
    } else {
      d1x /= l1;
      d1z /= l1;
    }
    if (l0 < 1e-9 && l1 >= 1e-9) {
      d0x = d1x;
      d0z = d1z;
    }
    let tx = d0x + d1x;
    let tz = d0z + d1z;
    const tl = Math.hypot(tx, tz);
    if (tl < 1e-6) {
      tx = d1x;
      tz = d1z;
    } else {
      tx /= tl;
      tz /= tl;
    }
    // mitre scale 1 / cos(half angle), limited so that hairpins do not spike
    const cosHalf = Math.max(0.5, tx * d1x + tz * d1z);
    if (i > 0) s += dist2(pts[i - 1], p);
    out.push({ x: p[0], z: p[1], nx: tz / cosHalf, nz: -tx / cosHalf, tx, tz, s });
  }
  return out;
}

/** Triangle soup builder: push triangles with a guaranteed facing. */
export class Soup {
  constructor() {
    this.p = [];
  }
  /** Triangle whose normal has a positive dot product with (nx, ny, nz). */
  tri(a, b, c, nx, ny, nz) {
    const ux = b[0] - a[0];
    const uy = b[1] - a[1];
    const uz = b[2] - a[2];
    const vx = c[0] - a[0];
    const vy = c[1] - a[1];
    const vz = c[2] - a[2];
    const d = (uy * vz - uz * vy) * nx + (uz * vx - ux * vz) * ny + (ux * vy - uy * vx) * nz;
    if (d >= 0) this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    else this.p.push(a[0], a[1], a[2], c[0], c[1], c[2], b[0], b[1], b[2]);
  }
  quad(a, b, c, d, nx, ny, nz) {
    this.tri(a, b, c, nx, ny, nz);
    this.tri(a, c, d, nx, ny, nz);
  }
  /** Upward-facing flat triangle from plan points at height y (number or (x, z) => y). */
  flat(a, b, c, y) {
    const f = typeof y === 'function' ? y : () => y;
    this.tri([a[0], f(a[0], a[1]), a[1]], [b[0], f(b[0], b[1]), b[1]], [c[0], f(c[0], c[1]), c[1]], 0, 1, 0);
  }
  /** Axis-free box from 8 corners given as bottom ring (4 plan points, y0) and top ring (y1). */
  prismQuad(q, y0, y1, { top = true, bottom = false, ends = true } = {}) {
    const lo = q.map((p) => [p[0], typeof y0 === 'function' ? y0(p[0], p[1]) : y0, p[1]]);
    const hi = q.map((p) => [p[0], typeof y1 === 'function' ? y1(p[0], p[1]) : y1, p[1]]);
    const cx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4;
    const cz = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
    if (top) this.quad(hi[0], hi[1], hi[2], hi[3], 0, 1, 0);
    if (bottom) this.quad(lo[0], lo[1], lo[2], lo[3], 0, -1, 0);
    for (let i = 0; i < 4; i++) {
      if (!ends && (i === 1 || i === 3)) continue;
      const j = (i + 1) % 4;
      const mx = (q[i][0] + q[j][0]) / 2 - cx;
      const mz = (q[i][1] + q[j][1]) / 2 - cz;
      this.quad(lo[i], lo[j], hi[j], hi[i], mx, 0, mz);
    }
  }
  get count() {
    return this.p.length / 9;
  }
}

/** Triangulate a plan ring with holes → array of [a, b, c] plan triangles. */
export function triangulate(ring, holes = []) {
  const contour = signedArea(ring) > 0 ? ring : ring.slice().reverse();
  const hs = holes.map((h) => (signedArea(h) < 0 ? h : h.slice().reverse()));
  const all = [...contour, ...hs.flat()];
  const tris = THREE.ShapeUtils.triangulateShape(
    contour.map((p) => new THREE.Vector2(p[0], p[1])),
    hs.map((h) => h.map((p) => new THREE.Vector2(p[0], p[1]))),
  );
  return tris.map(([i, j, k]) => [all[i], all[j], all[k]]);
}

// --- clipping to the disc ---------------------------------------------------------------
const PLANES = (() => {
  const out = [];
  const apothem = DISC.radius * Math.cos(Math.PI / RIM_N);
  for (let i = 0; i < RIM_N; i++) {
    const a = ((i + 0.5) / RIM_N) * Math.PI * 2;
    out.push([Math.cos(a), Math.sin(a), apothem]); // inside: nx (x − cx) + nz (z − cz) <= apothem
  }
  return out;
})();
export const RIM_APOTHEM = DISC.radius * Math.cos(Math.PI / RIM_N);
/** Rim vertex i of the disc polygon (plan). */
export function rimPoint(i) {
  const a = (i / RIM_N) * Math.PI * 2;
  return [DISC.cx + DISC.radius * Math.cos(a), DISC.cz + DISC.radius * Math.sin(a)];
}
/** Scale factor that puts a plan point exactly on the rim polygon along its ray from the centre. */
export function toRim(x, z) {
  const dx = x - DISC.cx;
  const dz = z - DISC.cz;
  const ang = Math.atan2(dz, dx);
  const sector = Math.floor((((ang / (Math.PI * 2)) % 1) + 1) % 1 * RIM_N);
  const pl = PLANES[sector];
  const k = pl[2] / (pl[0] * dx + pl[1] * dz);
  return [DISC.cx + dx * k, DISC.cz + dz * k];
}

/**
 * Clip a triangle soup (flat array of xyz triples, 9 numbers per triangle) to the disc
 * prism. Works for any orientation (vertical faces too): the clip planes are vertical.
 */
export function clipToDisc(p) {
  const out = [];
  const R = DISC.radius;
  const cx = DISC.cx;
  const cz = DISC.cz;
  const rIn = RIM_APOTHEM - 1e-6;
  let poly = [];
  let next = [];
  for (let i = 0; i < p.length; i += 9) {
    const ax = p[i] - cx;
    const az = p[i + 2] - cz;
    const bx = p[i + 3] - cx;
    const bz = p[i + 5] - cz;
    const qx = p[i + 6] - cx;
    const qz = p[i + 8] - cz;
    const ra = Math.hypot(ax, az);
    const rb = Math.hypot(bx, bz);
    const rc = Math.hypot(qx, qz);
    if (ra <= rIn && rb <= rIn && rc <= rIn) {
      for (let k = 0; k < 9; k++) out.push(p[i + k]);
      continue;
    }
    const edge = Math.max(Math.hypot(ax - bx, az - bz), Math.hypot(bx - qx, bz - qz), Math.hypot(qx - ax, qz - az));
    if (Math.min(ra, rb, rc) > R + edge) continue; // cannot reach the disc
    poly = [
      [p[i], p[i + 1], p[i + 2]],
      [p[i + 3], p[i + 4], p[i + 5]],
      [p[i + 6], p[i + 7], p[i + 8]],
    ];
    // small triangles only need the planes facing them
    let lo = 0;
    let hi = RIM_N;
    if (edge < 60 && Math.min(ra, rb, rc) > 120) {
      const ang = Math.atan2((az + bz + qz) / 3, (ax + bx + qx) / 3);
      const mid = Math.floor(((ang / (Math.PI * 2) + 1) % 1) * RIM_N);
      const span = Math.ceil(((edge / Math.min(ra, rb, rc)) * RIM_N) / (Math.PI * 2)) + 2;
      lo = mid - span;
      hi = mid + span + 1;
    }
    for (let s = lo; s < hi && poly.length >= 3; s++) {
      const pl = PLANES[((s % RIM_N) + RIM_N) % RIM_N];
      next = [];
      for (let k = 0; k < poly.length; k++) {
        const a = poly[k];
        const b = poly[(k + 1) % poly.length];
        const da = pl[0] * (a[0] - cx) + pl[1] * (a[2] - cz) - pl[2];
        const db = pl[0] * (b[0] - cx) + pl[1] * (b[2] - cz) - pl[2];
        if (da <= 0) next.push(a);
        if (da <= 0 !== db <= 0) {
          const t = da / (da - db);
          next.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
        }
      }
      poly = next;
    }
    for (let k = 1; k + 1 < poly.length; k++) {
      const a = poly[0];
      const b = poly[k];
      const c = poly[k + 1];
      out.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    }
  }
  return out;
}

/** Soup → BufferGeometry (clipped to the disc, flat normals, metric UVs). Null when empty. */
export function soupGeometry(soup, { clip = true } = {}) {
  const pos = clip ? clipToDisc(soup.p) : soup.p;
  if (pos.length === 0) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return metricUV(g);
}

/**
 * Flat ribbon along a polyline between lateral offsets o0 < o1 (metres, positive = left
 * normal of sections()). y is a number or (x, z) => y. `keep(i, mx, mz)` may drop quads.
 */
export function ribbon(soup, secs, o0, o1, y, keep = null) {
  const f = typeof y === 'function' ? y : () => y;
  for (let i = 0; i < secs.length - 1; i++) {
    const a = secs[i];
    const b = secs[i + 1];
    const a0 = [a.x + a.nx * o0, 0, a.z + a.nz * o0];
    const a1 = [a.x + a.nx * o1, 0, a.z + a.nz * o1];
    const b0 = [b.x + b.nx * o0, 0, b.z + b.nz * o0];
    const b1 = [b.x + b.nx * o1, 0, b.z + b.nz * o1];
    if (keep && !keep(i, (a0[0] + a1[0] + b0[0] + b1[0]) / 4, (a0[2] + a1[2] + b0[2] + b1[2]) / 4)) continue;
    a0[1] = f(a0[0], a0[2]);
    a1[1] = f(a1[0], a1[2]);
    b0[1] = f(b0[0], b0[2]);
    b1[1] = f(b1[0], b1[2]);
    soup.quad(a0, b0, b1, a1, 0, 1, 0);
  }
}

/** Disc fan (round cap / junction filler) at height y. */
export function capDisc(soup, x, z, r, y, n = 12) {
  const f = typeof y === 'function' ? y : () => y;
  const c = [x, f(x, z), z];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 1) / n) * Math.PI * 2;
    const p0 = [x + Math.cos(a0) * r, 0, z + Math.sin(a0) * r];
    const p1 = [x + Math.cos(a1) * r, 0, z + Math.sin(a1) * r];
    p0[1] = f(p0[0], p0[2]);
    p1[1] = f(p1[0], p1[2]);
    soup.tri(c, p0, p1, 0, 1, 0);
  }
}

/**
 * Solid strip along a polyline: rectangular profile between offsets o0 < o1 from y0 to y1
 * (numbers or functions of (x, z)). Faces: top, both sides, optional bottom; ends are closed
 * where the strip starts, stops or is interrupted by `keep`.
 */
export function strip(soup, secs, o0, o1, y0, y1, { keep = null, bottom = false, sideL = true, sideR = true } = {}) {
  const f0 = typeof y0 === 'function' ? y0 : () => y0;
  const f1 = typeof y1 === 'function' ? y1 : () => y1;
  let prevKept = false;
  let last = null;
  const endCap = (c, dirx, dirz) => soup.quad(c.l0, c.r0, c.r1, c.l1, dirx, 0, dirz);
  for (let i = 0; i < secs.length - 1; i++) {
    const a = secs[i];
    const b = secs[i + 1];
    const pa0 = [a.x + a.nx * o0, a.z + a.nz * o0];
    const pa1 = [a.x + a.nx * o1, a.z + a.nz * o1];
    const pb0 = [b.x + b.nx * o0, b.z + b.nz * o0];
    const pb1 = [b.x + b.nx * o1, b.z + b.nz * o1];
    const kept = !keep || keep(i, (pa0[0] + pa1[0] + pb0[0] + pb1[0]) / 4, (pa0[1] + pa1[1] + pb0[1] + pb1[1]) / 4);
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    if (!kept) {
      if (prevKept && last) endCap(last, dx, dz);
      prevKept = false;
      continue;
    }
    const A = { l0: [pa0[0], f0(pa0[0], pa0[1]), pa0[1]], l1: [pa0[0], f1(pa0[0], pa0[1]), pa0[1]], r0: [pa1[0], f0(pa1[0], pa1[1]), pa1[1]], r1: [pa1[0], f1(pa1[0], pa1[1]), pa1[1]] };
    const B = { l0: [pb0[0], f0(pb0[0], pb0[1]), pb0[1]], l1: [pb0[0], f1(pb0[0], pb0[1]), pb0[1]], r0: [pb1[0], f0(pb1[0], pb1[1]), pb1[1]], r1: [pb1[0], f1(pb1[0], pb1[1]), pb1[1]] };
    soup.quad(A.l1, B.l1, B.r1, A.r1, 0, 1, 0);
    // "l" is the o0 side (normal points toward −n), "r" the o1 side
    if (sideL) soup.quad(A.l0, B.l0, B.l1, A.l1, -(a.nx + b.nx), 0, -(a.nz + b.nz));
    if (sideR) soup.quad(A.r0, B.r0, B.r1, A.r1, a.nx + b.nx, 0, a.nz + b.nz);
    if (bottom) soup.quad(A.l0, B.l0, B.r0, A.r0, 0, -1, 0);
    if (!prevKept) endCap(A, -dx, -dz);
    prevKept = true;
    last = B;
  }
  if (prevKept && last && secs.length > 1) {
    const a = secs[secs.length - 2];
    const b = secs[secs.length - 1];
    endCap(last, b.x - a.x, b.z - a.z);
  }
}

/** Uniform spatial hash of line segments with a half width, for "is this point on a carriageway" tests. */
export class SegmentIndex {
  constructor(cell = 24, pad = 4) {
    this.cell = cell;
    this.pad = pad;
    this.map = new Map();
    this.segs = [];
  }
  add(a, b, half, owner) {
    const id = this.segs.length;
    this.segs.push({ a, b, half, owner });
    const c = this.cell;
    const e = half + this.pad;
    const x0 = Math.floor((Math.min(a[0], b[0]) - e) / c);
    const x1 = Math.floor((Math.max(a[0], b[0]) + e) / c);
    const z0 = Math.floor((Math.min(a[1], b[1]) - e) / c);
    const z1 = Math.floor((Math.max(a[1], b[1]) + e) / c);
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        const k = x * 100003 + z;
        let l = this.map.get(k);
        if (!l) this.map.set(k, (l = []));
        l.push(id);
      }
    }
  }
  /** Smallest (distance − half width) over all segments except those of `owner`; < 0 means inside. */
  clearance(x, z, owner = -1) {
    const c = this.cell;
    const l = this.map.get(Math.floor(x / c) * 100003 + Math.floor(z / c));
    let best = Infinity;
    if (!l) return best;
    for (const id of l) {
      const s = this.segs[id];
      if (s.owner === owner) continue;
      const d = distToSeg(x, z, s.a, s.b) - s.half;
      if (d < best) best = d;
    }
    return best;
  }
}

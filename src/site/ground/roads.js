// Roads and paths: carriageways with widths by class, raised sidewalks with granite kerbs,
// lane / edge markings, zebra crossings, footways, promenades and cycle paths.
// Source geometry: OpenStreetMap centre lines (src/site/data/ground-data.js).
import * as THREE from 'three';
import { mesh } from '../../core/geom.js';
import { GROUND } from '../data/ground-data.js';
import { DISC, Y, Soup, unflat, soupGeometry, pointInRing, liftAt, nearDeck, densify, sections, ribbon, capDisc, SegmentIndex, discR } from './util.js';

const SITE = 'site';
const KERB_W = 0.18;

function sidewalkWidth(r) {
  if (r.passage) return 0;
  if (r.cls === 'tertiary') return /みなとみらい大/.test(r.name) ? 5 : 4;
  if (r.cls === 'unclassified') return 3;
  if (r.cls === 'residential') return 2;
  return 0; // service roads and links have no raised walk
}

export function buildRoads(M) {
  const group = new THREE.Group();
  group.name = 'roads';
  const site = unflat(GROUND.site);
  const inSite = (x, z) => pointInRing(x, z, site);
  const R = DISC.radius;
  const yRoad = (x, z) => liftAt(x, z) + Y.road;
  const yMark = (x, z) => liftAt(x, z) + Y.mark;
  const yOf = { path: (x, z) => liftAt(x, z) + Y.path, sidewalk: (x, z) => liftAt(x, z) + Y.sidewalk, promenade: (x, z) => liftAt(x, z) + Y.promenade, cycle: (x, z) => liftAt(x, z) + Y.cycle, steps: (x, z) => liftAt(x, z) + Y.steps };

  const roads = GROUND.roads.map((r, i) => {
    const pts = unflat(r.pts);
    return { ...r, i, coarse: sections(densify(pts, 6, (x, z) => nearDeck(x, z))), fine: sections(densify(pts, 3)) };
  });
  const index = new SegmentIndex(24, 6);
  for (const r of roads) for (let k = 0; k < r.fine.length - 1; k++) index.add([r.fine[k].x, r.fine[k].z], [r.fine[k + 1].x, r.fine[k + 1].z], r.w / 2, r.i);

  // --- carriageways -----------------------------------------------------------------------
  const asphalt = new Soup();
  for (const r of roads) {
    ribbon(asphalt, r.coarse, -r.w / 2, r.w / 2, yRoad, (k, mx, mz) => !inSite(mx, mz));
    for (const e of [r.coarse[0], r.coarse[r.coarse.length - 1]]) {
      if (discR(e.x, e.z) < R + 20 && !inSite(e.x, e.z)) capDisc(asphalt, e.x, e.z, r.w / 2, yRoad, 10);
    }
  }

  // --- raised sidewalks with kerbs ----------------------------------------------------------
  const walk = new Soup();
  const kerb = new Soup();
  const medianTop = new Soup();
  const bandWidthAt = (r, s, side, sw) => {
    // widest band that stays off every other carriageway, sampled outward from the kerb
    const half = r.w / 2;
    if (inSite(s.x + s.nx * side * (half + 1), s.z + s.nz * side * (half + 1))) return 0;
    let w = 0;
    for (let o = 0.4; o <= sw + 1e-6; o += 0.4) {
      const x = s.x + s.nx * side * (half + o);
      const z = s.z + s.nz * side * (half + o);
      if (index.clearance(x, z, r.i) < 0.3) break;
      w = o;
    }
    // also require the kerb line itself to be clear (inside a junction there is no kerb)
    if (index.clearance(s.x + s.nx * side * half, s.z + s.nz * side * half, r.i) < 0.05) return 0;
    return w < 0.8 ? 0 : Math.min(w, sw);
  };
  for (const r of roads) {
    const sw = sidewalkWidth(r);
    if (!sw) continue;
    const half = r.w / 2;
    for (const side of [1, -1]) {
      const secs = r.fine;
      const wd = secs.map((s) => (discR(s.x, s.z) > R + 12 ? 0 : bandWidthAt(r, s, side, sw)));
      // a band that is squeezed by the opposite carriageway over a long run is a median:
      // planted, with a kerb on both sides
      const lim = wd.map((w) => w > 0 && w < sw - 0.3);
      // (on the bridges the central reserve is paved, not planted)
      const isMedian = lim.map((v, k) => v && liftAt(secs[k].x, secs[k].z) < 0.05 && [-3, -2, -1, 1, 2, 3].every((d) => lim[Math.max(0, Math.min(lim.length - 1, k + d))]));
      const pt = (s, o) => {
        const x = s.x + s.nx * side * o;
        const z = s.z + s.nz * side * o;
        return [x, z, liftAt(x, z)];
      };
      const cap = (s, w, dx, dz) => {
        const a = pt(s, half);
        const b = pt(s, half + w);
        walk.quad([a[0], a[2], a[1]], [b[0], b[2], b[1]], [b[0], b[2] + Y.walk, b[1]], [a[0], a[2] + Y.walk, a[1]], dx, 0, dz);
      };
      for (let k = 0; k < secs.length - 1; k++) {
        const s0 = secs[k];
        const s1 = secs[k + 1];
        const w0 = wd[k];
        const w1 = wd[k + 1];
        if (w0 === 0 && w1 === 0) continue;
        // a band that starts or stops inside this step: use the kept width on both ends
        const wa = w0 || w1;
        const wb = w1 || w0;
        if (w0 === 0 || w1 === 0) {
          // only keep the half step next to the kept section: split at the midpoint
          const mid = { x: (s0.x + s1.x) / 2, z: (s0.z + s1.z) / 2, nx: (s0.nx + s1.nx) / 2, nz: (s0.nz + s1.nz) / 2 };
          const a = w0 ? s0 : mid;
          const b = w0 ? mid : s1;
          emit(a, b, wa, wb, false);
          cap(w0 ? b : a, w0 ? wb : wa, (w0 ? 1 : -1) * (s1.x - s0.x), (w0 ? 1 : -1) * (s1.z - s0.z));
        } else {
          emit(s0, s1, wa, wb, isMedian[k] && isMedian[k + 1]);
          if (k === 0) cap(s0, wa, s0.x - s1.x, s0.z - s1.z);
          if (k === secs.length - 2) cap(s1, wb, s1.x - s0.x, s1.z - s0.z);
        }
      }
      function emit(a, b, wa, wb, median) {
        const a0 = pt(a, half);
        const a1 = pt(a, half + KERB_W);
        const a2 = pt(a, half + wa);
        const b0 = pt(b, half);
        const b1 = pt(b, half + KERB_W);
        const b2 = pt(b, half + wb);
        const up = Y.walk;
        const nx = (a.nx + b.nx) * side;
        const nz = (a.nz + b.nz) * side;
        // kerb stone: face toward the road and its top
        kerb.quad([a0[0], a0[2] + Y.road - 0.02, a0[1]], [b0[0], b0[2] + Y.road - 0.02, b0[1]], [b0[0], b0[2] + up, b0[1]], [a0[0], a0[2] + up, a0[1]], -nx, 0, -nz);
        kerb.quad([a0[0], a0[2] + up, a0[1]], [b0[0], b0[2] + up, b0[1]], [b1[0], b1[2] + up, b1[1]], [a1[0], a1[2] + up, a1[1]], 0, 1, 0);
        // paving and the back edge down to the ground
        (median ? medianTop : walk).quad([a1[0], a1[2] + up, a1[1]], [b1[0], b1[2] + up, b1[1]], [b2[0], b2[2] + up, b2[1]], [a2[0], a2[2] + up, a2[1]], 0, 1, 0);
        (median ? kerb : walk).quad([a2[0], a2[2], a2[1]], [b2[0], b2[2], b2[1]], [b2[0], b2[2] + up, b2[1]], [a2[0], a2[2] + up, a2[1]], nx, 0, nz);
      }
    }
  }

  // --- markings -------------------------------------------------------------------------------
  const marks = new Soup();
  const LINE = 0.15;
  for (const r of roads) {
    if (r.passage || !['tertiary', 'unclassified', 'residential'].includes(r.cls)) continue;
    const half = r.w / 2;
    const secs = r.fine;
    const clearOf = (k, mx, mz) => !inSite(mx, mz) && index.clearance(mx, mz, r.i) > 0.12;
    // solid edge lines
    if (r.cls !== 'residential') {
      for (const o of [half - 0.5, -(half - 0.5)]) ribbon(marks, secs, o - LINE / 2, o + LINE / 2, yMark, clearOf);
    }
    // dashed lane lines: centre line of two-way roads, lane dividers of multi-lane carriageways
    const offs = [];
    if (!r.oneway) offs.push(0);
    else {
      const nl = r.lanes || (r.w >= 9.5 ? 3 : r.w >= 6.9 ? 2 : 1);
      const lw = (r.w - 1) / nl;
      for (let k = 1; k < nl; k++) offs.push((k - nl / 2) * lw);
    }
    const DASH = 5;
    const GAP = 5;
    for (const o of offs) {
      ribbon(marks, secs, o - LINE / 2, o + LINE / 2, yMark, (k, mx, mz) => {
        const s = (secs[k].s + secs[k + 1].s) / 2;
        return s % (DASH + GAP) < DASH && !inSite(mx, mz) && index.clearance(mx, mz, r.i) > 1.0;
      });
    }
  }
  // zebra crossings where a mapped crossing runs over a carriageway
  for (const p of GROUND.paths) {
    if (p.cls !== 'crossing') continue;
    const pts = densify(unflat(p.pts), 0.9);
    const secs = sections(pts);
    let phase = 0;
    for (let k = 0; k < secs.length - 1; k++) {
      const a = secs[k];
      const b = secs[k + 1];
      const mx = (a.x + b.x) / 2;
      const mz = (a.z + b.z) / 2;
      phase++;
      if (index.clearance(mx, mz) > -0.5 || inSite(mx, mz)) continue;
      if (phase % 2) continue;
      // stripe: 0.45 m along the walking direction, 4 m along the road
      const tx = b.x - a.x;
      const tz = b.z - a.z;
      const tl = Math.hypot(tx, tz) || 1;
      const ux = (tx / tl) * 0.225;
      const uz = (tz / tl) * 0.225;
      const vx = (-tz / tl) * 2.0;
      const vz = (tx / tl) * 2.0;
      const c = (sx, sz) => {
        const x = mx + ux * sx + vx * sz;
        const z = mz + uz * sx + vz * sz;
        return [x, yMark(x, z), z];
      };
      marks.quad(c(-1, -1), c(1, -1), c(1, 1), c(-1, 1), 0, 1, 0);
    }
  }

  // --- paths ----------------------------------------------------------------------------------
  const soups = { path: new Soup(), sidewalk: new Soup(), promenade: new Soup(), cycle: new Soup(), steps: new Soup() };
  for (const p of GROUND.paths) {
    if (p.cls === 'crossing') continue;
    const pts = densify(unflat(p.pts), 6, (x, z) => nearDeck(x, z));
    const secs = sections(pts);
    const cls = soups[p.cls] ? p.cls : 'path';
    ribbon(soups[cls], secs, -p.w / 2, p.w / 2, yOf[cls], (k, mx, mz) => !inSite(mx, mz));
  }

  const add = (soup, material, name, cast = false) => {
    const g = soupGeometry(soup);
    if (g) group.add(mesh(g, material, { name, layer: SITE, cast, receive: true }));
  };
  add(asphalt, M.asphalt, 'carriageways');
  add(walk, M.sidewalk, 'sidewalks');
  add(kerb, M.kerb, 'kerbs');
  add(medianTop, M.median, 'median planting');
  add(marks, M.marking, 'road markings');
  add(soups.path, M.footpath, 'footpaths');
  add(soups.sidewalk, M.sidewalk, 'sidewalk ribbons');
  add(soups.promenade, M.promenade, 'promenades');
  add(soups.cycle, M.cycle, 'cycle paths');
  add(soups.steps, M.steps, 'path steps');
  return { group, roads, index };
}

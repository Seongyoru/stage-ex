// Terrain of the diorama: the ground disc with the water bodies cut out of it, the quay
// walls, the plinth, the water surfaces and the land-use fields (parks, lots, gardens).
import * as THREE from 'three';
import { mesh, box } from '../../core/geom.js';
import { ROOF_OUTLINE } from '../../core/envelope.js';
import { GROUND } from '../data/ground-data.js';
import {
  DISC, RIM_N, WATER_Y, BED_Y, PLINTH_Y, Y, Soup, unflat, triangulate, soupGeometry, signedArea, pointInRing,
  distToRing, rimPoint, liftAt, sections, strip, dist2, densify, discR,
} from './util.js';

const SITE = 'site';
export const RECESS_Y = -0.1; // ground under the arena roof outline (the arena brings its own floor at y = 0)

/** Inset a ring by d metres toward its inside (simple per-vertex offset, falls back to the spine). */
function insetRing(ring, d) {
  const sign = signedArea(ring) > 0 ? 1 : -1;
  const n = ring.length;
  // spine: the two vertices that are farthest apart
  let sa = ring[0];
  let sb = ring[1];
  let far = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (dist2(ring[i], ring[j]) > far) (far = dist2(ring[i], ring[j])), (sa = ring[i]), (sb = ring[j]);
  const out = [];
  for (let i = 0; i < n; i++) {
    const p0 = ring[(i + n - 1) % n];
    const p1 = ring[i];
    const p2 = ring[(i + 1) % n];
    const e1 = [p1[0] - p0[0], p1[1] - p0[1]];
    const e2 = [p2[0] - p1[0], p2[1] - p1[1]];
    const l1 = Math.hypot(e1[0], e1[1]) || 1;
    const l2 = Math.hypot(e2[0], e2[1]) || 1;
    // inward normal for positive-area rings: (−dz, dx)
    let nx = (-e1[1] / l1 - e2[1] / l2) * sign;
    let nz = (e1[0] / l1 + e2[0] / l2) * sign;
    const nl = Math.hypot(nx, nz) || 1;
    nx /= nl;
    nz /= nl;
    let q = [p1[0] + nx * d, p1[1] + nz * d];
    if (!pointInRing(q[0], q[1], ring) || distToRing(q[0], q[1], ring) < d * 0.55) {
      // pull toward the spine instead
      const dx = sb[0] - sa[0];
      const dz = sb[1] - sa[1];
      let t = ((p1[0] - sa[0]) * dx + (p1[1] - sa[1]) * dz) / (dx * dx + dz * dz);
      t = Math.max(0.08, Math.min(0.92, t));
      const s = [sa[0] + dx * t, sa[1] + dz * t];
      const l = dist2(p1, s) || 1;
      const k = Math.min(1, d / l);
      q = [p1[0] + (s[0] - p1[0]) * k, p1[1] + (s[1] - p1[1]) * k];
    }
    out.push(q);
  }
  return out;
}

export function buildTerrain(M, { ortho = false } = {}) {
  const group = new THREE.Group();
  group.name = 'terrain';
  const add = (soup, material, name, opts = {}) => {
    const g = soupGeometry(soup, opts);
    if (!g) return null;
    const m = mesh(g, material, { name, layer: SITE, cast: false, receive: true, ...opts.mesh });
    group.add(m);
    return m;
  };

  const basin = unflat(GROUND.water.basin);
  const pond = unflat(GROUND.water.pond);
  const beach = unflat(GROUND.water.beach);
  const site = unflat(GROUND.site);
  const R = DISC.radius;
  const far = R + 2600; // the river polygons reach about 2 km from the arena

  // The arena's own floor is at y = 0: keep the ground 10 cm lower under the roof outline
  // (inset so that the step hides inside the outer wall) to avoid coplanar faces in the hall.
  const recess = insetRing(ROOF_OUTLINE.map((p) => [p[0], p[1]]), 0.25);

  // --- base ground: everything that is neither water nor the Music Terrace site ---------
  {
    const s = new Soup();
    const square = [[DISC.cx - far, DISC.cz - far], [DISC.cx + far, DISC.cz - far], [DISC.cx + far, DISC.cz + far], [DISC.cx - far, DISC.cz + far]];
    for (const [a, b, c] of triangulate(square, [basin, pond, site])) s.flat(a, b, c, Y.base);
    const m = add(s, M.ground, 'ground');
    if (m) m.userData.groundBase = true;
  }
  // --- Music Terrace site: plain service-yard asphalt, minus the recess under the arena ---
  {
    const s = new Soup();
    for (const [a, b, c] of triangulate(site, [recess])) s.flat(a, b, c, Y.base);
    const m = add(s, M.yard, 'site yard');
    if (m) m.userData.groundBase = true;
    const r = new Soup();
    for (const [a, b, c] of triangulate(recess)) r.flat(a, b, c, RECESS_Y);
    // the 10 cm step, facing into the recess
    const cx = recess.reduce((t, p) => t + p[0], 0) / recess.length;
    const cz = recess.reduce((t, p) => t + p[1], 0) / recess.length;
    for (let i = 0; i < recess.length; i++) {
      const a = recess[i];
      const b = recess[(i + 1) % recess.length];
      r.quad([a[0], RECESS_Y, a[1]], [b[0], RECESS_Y, b[1]], [b[0], Y.base, b[1]], [a[0], Y.base, a[1]], cx - (a[0] + b[0]) / 2, 0, cz - (a[1] + b[1]) / 2);
    }
    add(r, M.subfloor, 'arena subfloor', { clip: false, mesh: { level: 1 } });
  }

  // --- land-use fields --------------------------------------------------------------------
  if (!ortho) {
    const groups = {};
    const layerOf = { block: Y.lot, vacant: Y.lot, vacantGrass: Y.lot, construction: Y.lot, parking: Y.lot + 0.005, meadow: Y.park - 0.005, park: Y.park, grass: Y.garden, garden: Y.garden + 0.005 };
    const matOf = { block: M.lot, vacant: M.vacant, vacantGrass: M.vacantGrass, construction: M.construction, parking: M.parking, meadow: M.meadow, park: M.park, grass: M.grass, garden: M.garden };
    for (const l of GROUND.land) {
      const ring = unflat(l.ring);
      const holes = l.holes.includes('pond') ? [pond] : [];
      const s = (groups[l.cls] ||= new Soup());
      let tris;
      try {
        tris = triangulate(ring, holes);
      } catch {
        continue;
      }
      for (const [a, b, c] of tris) s.flat(a, b, c, layerOf[l.cls] ?? Y.lot);
    }
    for (const [cls, s] of Object.entries(groups)) add(s, matOf[cls] || M.lot, `land ${cls}`);
    // parking bays: 2.5 x 5 m stalls in double rows with 6 m aisles, along the longest edge
    {
      const lines = new Soup();
      for (const l of GROUND.land) {
        if (l.cls !== 'parking') continue;
        const ring = unflat(l.ring);
        let dir = [1, 0];
        let best = 0;
        for (let i = 0; i < ring.length; i++) {
          const a = ring[i];
          const b = ring[(i + 1) % ring.length];
          const d = dist2(a, b);
          if (d > best) (best = d), (dir = [(b[0] - a[0]) / d, (b[1] - a[1]) / d]);
        }
        const nrm = [-dir[1], dir[0]];
        const us = ring.map((p) => p[0] * dir[0] + p[1] * dir[1]);
        const vs = ring.map((p) => p[0] * nrm[0] + p[1] * nrm[1]);
        const u0 = Math.min(...us);
        const u1 = Math.max(...us);
        const v0 = Math.min(...vs);
        const v1 = Math.max(...vs);
        const P = (u, v) => [dir[0] * u + nrm[0] * v, dir[1] * u + nrm[1] * v];
        const inside = (p) => pointInRing(p[0], p[1], ring) && distToRing(p[0], p[1], ring) > 0.8 && discR(p[0], p[1]) < R - 1;
        const y = Y.lot + 0.03;
        const seg = (a, b, w) => {
          if (!inside(a) || !inside(b)) return;
          const dx = b[0] - a[0];
          const dz = b[1] - a[1];
          const dl = Math.hypot(dx, dz) || 1;
          const ox = (-dz / dl) * (w / 2);
          const oz = (dx / dl) * (w / 2);
          lines.quad([a[0] - ox, y, a[1] - oz], [b[0] - ox, y, b[1] - oz], [b[0] + ox, y, b[1] + oz], [a[0] + ox, y, a[1] + oz], 0, 1, 0);
        };
        // rows: [stalls 5 m][stalls 5 m][aisle 6 m] repeating across the lot
        for (let v = v0 + 1.2; v + 10 < v1; v += 16) {
          for (let u = u0 + 1.2; u < u1; u += 2.5) {
            seg(P(u, v), P(u, v + 5), 0.12);
            seg(P(u, v + 5), P(u, v + 10), 0.12);
            if (u + 2.5 < u1) seg(P(u, v + 5), P(u + 2.5, v + 5), 0.12);
          }
        }
      }
      add(lines, M.parkingLine, 'parking bay lines', { clip: false });
    }
    // paved plazas mapped as areas
    const ps = new Soup();
    for (const l of GROUND.plazas) for (const [a, b, c] of triangulate(unflat(l.ring))) ps.flat(a, b, c, Y.path - 0.005);
    add(ps, M.promenade, 'plazas');
  }

  // --- water --------------------------------------------------------------------------------
  {
    const s = new Soup();
    for (const [a, b, c] of triangulate(basin)) s.flat(a, b, c, WATER_Y);
    for (const [a, b, c] of triangulate(pond)) s.flat(a, b, c, WATER_Y);
    const m = add(s, M.water, 'water');
    if (m) m.userData.water = true;
  }

  // --- quay walls with coping -----------------------------------------------------------------
  {
    const walls = new Soup();
    const coping = new Soup();
    // beach vertices on the land side: no wall there, the beach slopes down instead
    const dry = new Set();
    GROUND.water.beachWet.forEach((w, i) => {
      if (!w) dry.add(`${beach[i][0]},${beach[i][1]}`);
    });
    const isDry = (p) => dry.has(`${p[0]},${p[1]}`);
    const sign = signedArea(basin) > 0 ? 1 : -1;
    const n = basin.length;
    for (let i = 0; i < n; i++) {
      const a = basin[i];
      const b = basin[(i + 1) % n];
      // (the wall also runs behind the tidal beach, hidden under its slope, so nothing gapes)
      // normal pointing into the basin (toward the water): for positive rings the inside is (−dz, dx)
      const nx = -(b[1] - a[1]) * sign;
      const nz = (b[0] - a[0]) * sign;
      walls.quad([a[0], BED_Y, a[1]], [b[0], BED_Y, b[1]], [b[0], 0, b[1]], [a[0], 0, a[1]], nx, 0, nz);
    }
    // coping: 0.6 m wide, 0.25 m high kerb on the land side of every walled edge run
    let run = [];
    const flush = () => {
      if (run.length > 1) {
        const secs = sections(run);
        // the land side is to the outside of the basin ring
        const side = sign > 0 ? 1 : -1; // sections() normal is (tz, −tx) = outside for positive rings
        strip(coping, secs, side > 0 ? 0 : -0.6, side > 0 ? 0.6 : 0, 0, 0.25, { keep: (k, mx, mz) => liftAt(mx, mz, 1.5) === 0 });
      }
      run = [];
    };
    for (let i = 0; i < n; i++) {
      const a = basin[i % n];
      const b = basin[(i + 1) % n];
      if (isDry(a) && isDry(b)) {
        if (run.length) run.push(a);
        flush();
        continue;
      }
      // skip coping far outside the disc
      if (Math.hypot(a[0] - DISC.cx, a[1] - DISC.cz) > R + 40 && Math.hypot(b[0] - DISC.cx, b[1] - DISC.cz) > R + 40) {
        flush();
        continue;
      }
      if (!run.length) run.push(a);
      run.push(b);
    }
    flush();
    add(walls, M.quayWall, 'quay walls', { mesh: { cast: true } });
    add(coping, M.quayCoping, 'quay coping', { mesh: { cast: true } });

    // railings where a park, garden or lawn meets the quay edge: posts at 2 m, two rails
    {
      const rail = new Soup();
      const posts = [];
      const greens = GROUND.land.filter((l) => ['park', 'garden', 'grass'].includes(l.cls)).map((l) => unflat(l.ring));
      const parkish = (x, z) => greens.some((r) => pointInRing(x, z, r));
      const side = sign > 0 ? 1 : -1;
      const secs = sections(densify([...basin, basin[0]], 2));
      const o = side * 0.35;
      const ok = secs.map((s) => {
        if (discR(s.x, s.z) > R - 0.5) return false;
        const x = s.x + s.nx * side * 2.2;
        const z = s.z + s.nz * side * 2.2;
        return parkish(x, z) && liftAt(s.x, s.z, 2) === 0 && !pointInRing(s.x + s.nx * o, s.z + s.nz * o, basin);
      });
      const keep = (k) => ok[k] && ok[k + 1];
      strip(rail, secs, o - 0.03, o + 0.03, 1.32, 1.38, { keep, bottom: true });
      strip(rail, secs, o - 0.02, o + 0.02, 0.8, 0.84, { keep, bottom: true });
      secs.forEach((s, k) => {
        if (ok[k] && (ok[k + 1] || ok[k - 1])) posts.push([s.x + s.nx * o, s.z + s.nz * o]);
      });
      add(rail, M.quayRail, 'quay railings', { mesh: { cast: false } });
      if (posts.length) {
        const inst = new THREE.InstancedMesh(box(0, 0.25 + 0.565, 0, 0.07, 1.13, 0.07), M.quayRail, posts.length);
        const m4 = new THREE.Matrix4();
        posts.forEach((p, i) => inst.setMatrixAt(i, m4.makeTranslation(p[0], 0, p[1])));
        inst.instanceMatrix.needsUpdate = true;
        inst.name = 'quay railing posts';
        inst.userData.layer = SITE;
        inst.castShadow = false;
        group.add(inst);
      }
    }
  }

  // --- tidal beach (stone steps and gravel sloping into the river) -----------------------------
  {
    const s = new Soup();
    const wet = new Map();
    beach.forEach((p, i) => wet.set(`${p[0]},${p[1]}`, GROUND.water.beachWet[i]));
    const yOf = (x, z) => (wet.get(`${x},${z}`) ? WATER_Y - 0.5 : Y.park);
    for (const [a, b, c] of triangulate(beach)) s.flat(a, b, c, yOf);
    add(s, M.beach, 'tidal beach');
  }
  // --- tidal pond (潮入りの池): stepped stone banks down to the water ---------------------------
  {
    const s = new Soup();
    const inner = insetRing(pond, 2.6);
    const n = pond.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const a = [pond[i][0], Y.park, pond[i][1]];
      const b = [pond[j][0], Y.park, pond[j][1]];
      const c = [inner[j][0], WATER_Y - 0.4, inner[j][1]];
      const d = [inner[i][0], WATER_Y - 0.4, inner[i][1]];
      s.quad(a, b, c, d, 0, 1, 0);
    }
    add(s, M.stoneSteps, 'tidal pond banks');
  }

  // --- rim and plinth -------------------------------------------------------------------------
  {
    const plinth = new Soup();
    const edge = new Soup();
    const wsec = new Soup();
    const SUB = 3; // sub-steps per rim side to find the land / water boundary more precisely
    const isWater = (x, z) => pointInRing(x, z, basin);
    const EDGE_H = 0.8;
    for (let i = 0; i < RIM_N; i++) {
      const p0 = rimPoint(i);
      const p1 = rimPoint(i + 1);
      for (let k = 0; k < SUB; k++) {
        const a = [p0[0] + ((p1[0] - p0[0]) * k) / SUB, p0[1] + ((p1[1] - p0[1]) * k) / SUB];
        const b = [p0[0] + ((p1[0] - p0[0]) * (k + 1)) / SUB, p0[1] + ((p1[1] - p0[1]) * (k + 1)) / SUB];
        const mx = (a[0] + b[0]) / 2;
        const mz = (a[1] + b[1]) / 2;
        const nx = mx - DISC.cx;
        const nz = mz - DISC.cz;
        // sample just inside the rim
        const wx = mx - (nx / R) * 0.4;
        const wz = mz - (nz / R) * 0.4;
        const q = (y0, y1, soup) => soup.quad([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], nx, 0, nz);
        if (isWater(wx, wz)) {
          q(BED_Y, WATER_Y, wsec);
          q(PLINTH_Y, BED_Y, plinth);
        } else {
          // where a bridge approach reaches the rim the cut shows its fill
          const top = Math.max(liftAt(a[0] - (nx / R) * 0.4, a[1] - (nz / R) * 0.4, 0), liftAt(b[0] - (nx / R) * 0.4, b[1] - (nz / R) * 0.4, 0));
          q(-EDGE_H, top > 0.05 ? top + Y.walk : 0, edge);
          q(PLINTH_Y, -EDGE_H, plinth);
        }
      }
    }
    // underside
    const c = [DISC.cx, PLINTH_Y, DISC.cz];
    for (let i = 0; i < RIM_N; i++) {
      const a = rimPoint(i);
      const b = rimPoint(i + 1);
      plinth.tri(c, [a[0], PLINTH_Y, a[1]], [b[0], PLINTH_Y, b[1]], 0, -1, 0);
    }
    add(plinth, M.plinth, 'plinth', { clip: false });
    add(edge, M.plinthEdge, 'ground section', { clip: false });
    add(wsec, M.waterSection, 'water section', { clip: false });
  }
  return group;
}

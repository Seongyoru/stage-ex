// JR Takashima freight line (高島線): single electrified 1,067 mm track on a ballast bed,
// sleepers (instanced), rails, lineside fences, catenary portals with wires, the multi-girder
// bridge over the Katabira river and the tunnel mouth under Minato Mirai Odori.
import * as THREE from 'three';
import { box, merge, mesh } from '../../core/geom.js';
import { GROUND } from '../data/ground-data.js';
import { DISC, BED_Y, Soup, unflat, soupGeometry, pointInRing, liftAt, densify, sections, strip, discR, dist2 } from './util.js';

const SITE = 'site';
const GAUGE = 1.067;
const BALLAST_TOP = 0.3;
const SLEEPER_TOP = 0.34;
const RAIL_TOP = 0.5;
const SLEEPER_PITCH = 0.65;
const PORTAL_PITCH = 40;

export function buildRail(M) {
  const group = new THREE.Group();
  group.name = 'railway';
  const basin = unflat(GROUND.water.basin);
  const inWater = (x, z) => pointInRing(x, z, basin);
  const R = DISC.radius;

  const ballast = new Soup();
  const rails = new Soup();
  const fence = new Soup();
  const girders = new Soup();
  const piers = new Soup();
  const wires = new Soup();
  const dark = new Soup();
  const concrete = new Soup();
  const sleeperAt = [];
  const portalAt = [];

  // --- assemble the track pieces -----------------------------------------------------------
  const pieces = GROUND.rails.map((r) => ({ ...r, pts: unflat(r.pts) }));
  const tp = GROUND.tunnelPortal;
  let portal = null;
  for (const pc of pieces) {
    const end = pc.pts[pc.pts.length - 1];
    if (dist2(end, [tp.x, tp.z]) < 1) {
      // run on along the tunnel direction until the track is under the road deck
      let d = 0;
      while (d < 40 && liftAt(tp.x + tp.dx * d, tp.z + tp.dz * d, -0.4) === 0) d += 0.5;
      portal = { x: tp.x + tp.dx * d, z: tp.z + tp.dz * d, dx: tp.dx, dz: tp.dz };
      pc.pts.push([portal.x + tp.dx * 2.5, portal.z + tp.dz * 2.5]);
    }
  }

  for (const pc of pieces) {
    const pts = densify(pc.pts, 5);
    const secs = sections(pts);
    const mid = secs[Math.floor(secs.length / 2)];
    const overWater = pc.bridge && inWater(mid.x, mid.z);
    const len = secs[secs.length - 1].s;

    // rails: two steel strips
    for (const side of [1, -1]) {
      const o = (side * GAUGE) / 2;
      strip(rails, secs, o - 0.035, o + 0.035, SLEEPER_TOP, RAIL_TOP);
    }
    // sleepers and catenary portals at regular stations
    let k = 0;
    const at = (s) => {
      while (k < secs.length - 2 && secs[k + 1].s < s) k++;
      const a = secs[k];
      const b = secs[k + 1];
      const t = (s - a.s) / (b.s - a.s || 1);
      const nx = a.nx + (b.nx - a.nx) * t;
      const nz = a.nz + (b.nz - a.nz) * t;
      const nl = Math.hypot(nx, nz) || 1;
      return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, nx: nx / nl, nz: nz / nl };
    };
    for (let s = SLEEPER_PITCH / 2; s < len; s += SLEEPER_PITCH) {
      const p = at(s);
      if (discR(p.x, p.z) < R - 1.3 && !(portal && liftAt(p.x, p.z, -0.4) > 0)) sleeperAt.push(p);
    }
    k = 0;
    for (let s = PORTAL_PITCH / 2; s < len; s += PORTAL_PITCH) {
      const p = at(s);
      if (discR(p.x, p.z) < R - 4 && liftAt(p.x, p.z, 6) === 0) portalAt.push(p);
    }
    // contact and messenger wire
    const wireKeep = (i, mx, mz) => liftAt(mx, mz, 1) === 0;
    strip(wires, secs, -0.02, 0.02, 5.5, 5.54, { keep: wireKeep, bottom: true });
    strip(wires, secs, -0.02, 0.02, 6.55, 6.59, { keep: wireKeep, bottom: true });

    if (!overWater) {
      // ballast bed: 3 m crown, 1:2.7 shoulders
      const onLand = (i, mx, mz) => !inWater(mx, mz) && liftAt(mx, mz, -0.4) === 0;
      strip(ballast, secs, -1.5, 1.5, 0, BALLAST_TOP, { keep: onLand, sideL: false, sideR: false });
      for (let i = 0; i < secs.length - 1; i++) {
        const a = secs[i];
        const b = secs[i + 1];
        if (!onLand(i, (a.x + b.x) / 2, (a.z + b.z) / 2)) continue;
        for (const side of [1, -1]) {
          const p = (s, o, y) => [s.x + s.nx * side * o, y, s.z + s.nz * side * o];
          ballast.quad(p(a, 1.5, BALLAST_TOP), p(b, 1.5, BALLAST_TOP), p(b, 2.3, 0), p(a, 2.3, 0), (a.nx + b.nx) * side, 1.5, (a.nz + b.nz) * side);
        }
      }
      // lineside fences, 1.8 m, both sides
      for (const side of [1, -1]) {
        const o = side * 3.7;
        for (let i = 0; i < secs.length - 1; i++) {
          const a = secs[i];
          const b = secs[i + 1];
          const ax = a.x + a.nx * o;
          const az = a.z + a.nz * o;
          const bx = b.x + b.nx * o;
          const bz = b.z + b.nz * o;
          const mx = (ax + bx) / 2;
          const mz = (az + bz) / 2;
          if (inWater(mx, mz) || liftAt(mx, mz, 1) > 0) continue;
          fence.quad([ax, 0, az], [bx, 0, bz], [bx, 1.8, bz], [ax, 1.8, az], a.nx * side, 0, a.nz * side);
        }
      }
    } else {
      // --- deck-girder bridge: parallel girder lines, piers in the river, abutments ---------
      const rb = GROUND.railBridge;
      for (const off of rb.lines) {
        for (const side of [1, -1]) strip(girders, secs, off + side * 1.05 - 0.2, off + side * 1.05 + 0.2, -1.45, 0.14, { bottom: true });
        strip(girders, secs, off - 0.85, off + 0.85, -0.1, 0.02, { bottom: true, sideL: false, sideR: false });
      }
      const a = secs[0];
      const b = secs[secs.length - 1];
      const half = Math.max(...rb.lines.map(Math.abs)) + 1.6;
      const wall = (s, t, y0, y1, soup) => {
        // transverse wall centred on station point s, thickness t along the track
        const ux = s.tx * (t / 2);
        const uz = s.tz * (t / 2);
        const q = [
          [s.x - s.nx * half - ux, s.z - s.nz * half - uz],
          [s.x + s.nx * half - ux, s.z + s.nz * half - uz],
          [s.x + s.nx * half + ux, s.z + s.nz * half + uz],
          [s.x - s.nx * half + ux, s.z - s.nz * half + uz],
        ];
        soup.prismQuad(q, y0, y1);
      };
      for (let i = 1; i < rb.spans; i++) {
        const s = at((len * i) / rb.spans);
        const sec = { ...s, tx: (b.x - a.x) / len, tz: (b.z - a.z) / len };
        if (inWater(s.x, s.z)) wall(sec, 1.6, BED_Y, -1.45, piers);
      }
      for (const e of [a, b]) wall({ ...e, tx: (b.x - a.x) / len, tz: (b.z - a.z) / len }, 2.4, BED_Y, -0.1, piers);
    }
  }

  // --- tunnel mouth under the Minato Mirai Odori approach -------------------------------------
  // The track meets the retaining wall of the road approach at an angle, so the portal is a
  // concrete box frame that projects from the wall far enough to clear it on both sides.
  if (portal) {
    const { x, z, dx, dz } = portal;
    const nx = dz;
    const nz = -dx;
    const info = {};
    const yTop = liftAt(x + dx * 3, z + dz * 3, 0, info);
    let skew = 4;
    if (info.deck) {
      const a = info.deck.pts[info.seg];
      const b = info.deck.pts[info.seg + 1];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const cos = Math.abs(((b[0] - a[0]) * dx + (b[1] - a[1]) * dz) / l);
      const sin = Math.sqrt(Math.max(0.05, 1 - cos * cos));
      skew = Math.min(9, (3.3 * cos) / sin);
    }
    const P = (along, across) => [x + dx * along + nx * across, z + dz * along + nz * across];
    const clear = Math.max(2.4, yTop - 0.55);
    const L0 = -(skew + 3.4);
    const L1 = skew + 1;
    concrete.prismQuad([P(L0, -3.3), P(L0, -2.7), P(L1, -2.7), P(L1, -3.3)], 0, clear + 0.5);
    concrete.prismQuad([P(L0, 2.7), P(L0, 3.3), P(L1, 3.3), P(L1, 2.7)], 0, clear + 0.5);
    concrete.prismQuad([P(L0, -3.3), P(L0, 3.3), P(L1, 3.3), P(L1, -3.3)], clear, clear + 0.5, { bottom: true });
    // black lining set back 2.8 m from the portal face, in front of the skewed wall
    const d0 = P(-(skew + 0.6), -2.7);
    const d1 = P(-(skew + 0.6), 2.7);
    dark.quad([d0[0], 0, d0[1]], [d1[0], 0, d1[1]], [d1[0], clear, d1[1]], [d0[0], clear, d0[1]], -dx, 0, -dz);
  }

  // --- output -----------------------------------------------------------------------------------
  const add = (soup, material, name, cast = true, opts = {}) => {
    const g = soupGeometry(soup, opts);
    if (g) group.add(mesh(g, material, { name, layer: SITE, cast, receive: true }));
  };
  add(ballast, M.ballast, 'rail ballast', false);
  add(rails, M.rail, 'rails', false);
  add(fence, M.railFence, 'rail fences', false);
  add(girders, M.railGirder, 'rail bridge girders');
  add(piers, M.pier, 'rail bridge piers');
  add(wires, M.catenary, 'catenary wires', false);
  add(concrete, M.pier, 'rail tunnel portal');
  add(dark, M.tunnelDark, 'rail tunnel mouth', false);

  // sleepers
  if (sleeperAt.length) {
    const geo = box(0, 0, 0, 2.0, 0.2, 0.24);
    const inst = new THREE.InstancedMesh(geo, M.sleeper, sleeperAt.length);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const one = new THREE.Vector3(1, 1, 1);
    sleeperAt.forEach((p, i) => {
      q.setFromAxisAngle(up, Math.atan2(-p.nz, p.nx));
      m4.compose(new THREE.Vector3(p.x, SLEEPER_TOP - 0.1, p.z), q, one);
      inst.setMatrixAt(i, m4);
    });
    inst.instanceMatrix.needsUpdate = true;
    inst.name = 'sleepers';
    inst.userData.layer = SITE;
    inst.castShadow = false;
    inst.receiveShadow = true;
    group.add(inst);
  }
  // catenary portals: two masts 3.1 m either side of the track and a beam at 7 m
  if (portalAt.length) {
    const geo = merge([
      box(-3.1, 3.6, 0, 0.25, 7.2, 0.25),
      box(3.1, 3.6, 0, 0.25, 7.2, 0.25),
      box(0, 6.95, 0, 6.6, 0.3, 0.22),
      box(0, 6.25, 0, 0.08, 1.1, 0.08), // drop tube carrying the registration arm
      box(-0.6, 5.75, 0, 1.3, 0.06, 0.06),
      box(-3.1, 0.2, 0, 0.6, 0.4, 0.6), // footings
      box(3.1, 0.2, 0, 0.6, 0.4, 0.6),
    ]);
    const inst = new THREE.InstancedMesh(geo, M.catenary, portalAt.length);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const one = new THREE.Vector3(1, 1, 1);
    portalAt.forEach((p, i) => {
      q.setFromAxisAngle(up, Math.atan2(-p.nz, p.nx));
      m4.compose(new THREE.Vector3(p.x, inWater(p.x, p.z) ? 0 : 0, p.z), q, one);
      inst.setMatrixAt(i, m4);
    });
    inst.instanceMatrix.needsUpdate = true;
    inst.name = 'catenary portals';
    inst.userData.layer = SITE;
    inst.castShadow = true;
    group.add(inst);
  }
  return group;
}

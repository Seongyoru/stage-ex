// Lifting grids (昇降グリッド), their hoists, the six 16 m lighting trusses with the
// permanent rig, and the follow spots. Facts: research/00-consolidated.md 7.2,
// organizer-tech.md 5 and 9, model-spec.json production.liftingGrids / lightingTrusses.
import * as THREE from 'three';
import { junctionX } from '../../core/seating.js';
import { Batch, trs } from './batch.js';
import { hoistLine, facetPoint } from './pa.js';
import { LENS_OFF } from './mats.js';


/**
 * Box truss between a and b. Section `size` (outer), tube chords, zigzag lacing on the
 * four faces and a square frame at both ends and at every `joint` metres.
 */
export function boxTruss(b, a, c, { size = 0.55, chordR = 0.025, lace = 0.028, panel = 0.6, joint = 0, sizeV = size } = {}) {
  const A = new THREE.Vector3(...a);
  const C = new THREE.Vector3(...c);
  const d = C.clone().sub(A);
  const len = d.length();
  d.normalize();
  const up = Math.abs(d.y) > 0.99 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const u = new THREE.Vector3().crossVectors(d, up).normalize(); // sideways
  const v = new THREE.Vector3().crossVectors(u, d).normalize(); // "vertical" of the section
  const hu = size / 2 - chordR;
  const hv = sizeV / 2 - chordR;
  const corner = (t, su, sv) => [A.x + d.x * t + u.x * su * hu + v.x * sv * hv, A.y + d.y * t + u.y * su * hu + v.y * sv * hv, A.z + d.z * t + u.z * su * hu + v.z * sv * hv];
  const corners = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
  for (const [su, sv] of corners) b.tube(corner(0, su, sv), corner(len, su, sv), chordR, 6, { caps: true });
  const n = Math.max(2, Math.round(len / panel));
  for (let f = 0; f < 4; f++) {
    const p = corners[f];
    const q = corners[(f + 1) % 4];
    for (let i = 0; i < n; i++) {
      const t0 = (len * i) / n;
      const t1 = (len * (i + 1)) / n;
      const from = (i + f) % 2 === 0 ? p : q;
      const to = (i + f) % 2 === 0 ? q : p;
      b.beam(corner(t0, from[0], from[1]), corner(t1, to[0], to[1]), lace, lace);
    }
  }
  const frames = [0, len];
  if (joint > 0) for (let t = joint; t < len - 0.01; t += joint) frames.push(t);
  for (const t of frames) {
    for (let f = 0; f < 4; f++) {
      const p = corners[f];
      const q = corners[(f + 1) % 4];
      b.beam(corner(t, p[0], p[1]), corner(t, q[0], q[1]), 0.04, 0.04);
    }
  }
}

// ------------------------------------------------------------------------------------------
// Lifting grids
// ------------------------------------------------------------------------------------------
const GRID_BEAM_W = 0.25;
const GRID_BEAM_H = 0.45;
const NODE = [-4.5, -1.5, 1.5, 4.5];

function liftingGrid(col, cx, cz, y0, number, { baskets = [], low = false, yRope } = {}) {
  const g = col.b('rig.grid');
  const half = 4.5 + GRID_BEAM_W / 2;
  // primary frame: 4 + 4 members on the 3 m rigging pitch
  for (const o of NODE) {
    g.span(cx - half, cx + half, y0, y0 + GRID_BEAM_H, cz + o - GRID_BEAM_W / 2, cz + o + GRID_BEAM_W / 2);
    g.span(cx + o - GRID_BEAM_W / 2, cx + o + GRID_BEAM_W / 2, y0 + 0.012, y0 + GRID_BEAM_H - 0.012, cz - half + 0.004, cz + half - 0.004);
  }
  // secondary members through the middle of every cell
  for (const o of [-3, 0, 3]) {
    g.span(cx - 4.5, cx + 4.5, y0 + 0.2, y0 + 0.4, cz + o - 0.05, cz + o + 0.05);
    g.span(cx + o - 0.05, cx + o + 0.05, y0 + 0.21, y0 + 0.39, cz - 4.5, cz + 4.5);
  }
  if (!low) {
    // plan bracing in the corner cells
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        g.beam([cx + sx * 1.5, y0 + 0.3, cz + sz * 1.5], [cx + sx * 4.5, y0 + 0.3, cz + sz * 4.5], 0.07, 0.07);
        g.beam([cx + sx * 4.5, y0 + 0.3, cz + sz * 1.5], [cx + sx * 1.5, y0 + 0.3, cz + sz * 4.5], 0.07, 0.07);
      }
    }
    // rigging lugs under the 16 nodes (3 m pitch)
    const h = col.b('rig.hoist');
    for (const ox of NODE) {
      for (const oz of NODE) {
        h.box(cx + ox, y0 - 0.07, cz + oz, 0.03, 0.14, 0.14);
        h.tube([cx + ox - 0.05, y0 - 0.13, cz + oz], [cx + ox + 0.05, y0 - 0.13, cz + oz], 0.03, 6, { caps: true });
      }
    }
  }
  // yellow number plates (seen as "No.3", "No.5" in the Theatre Workshop photo)
  const p = col.b('rig.plate');
  const yp = y0 + GRID_BEAM_H / 2;
  p.box(cx, yp, cz + half + 0.015, 0.62, 0.3, 0.03);
  p.box(cx, yp, cz - half - 0.015, 0.62, 0.3, 0.03);
  const outer = Math.sign(cx) || 1;
  p.box(cx + outer * (half + 0.015), yp, cz, 0.03, 0.3, 0.62);

  // suspension: four pick-ups where the bracing of the corner cells crosses, 3 m inside the
  // frame corners. arena/roof stands the hoist machines on its 9FL rigging deck right above
  // them; the rope pairs rise to diverter blocks under that deck.
  const wr = col.b('rig.wire');
  const hs = col.b('rig.hoist');
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const x = cx + sx * 3;
      const z = cz + sz * 3;
      const yPick = y0 + GRID_BEAM_H - 0.03;
      hs.box(x, yPick - 0.02, z, 0.5, 0.04, 0.5); // gusset over the crossing members
      hs.box(x, yPick + 0.12, z, 0.34, 0.24, 0.04); // lifting lug with equaliser sheave
      hs.tube([x, yPick + 0.16, z - 0.05], [x, yPick + 0.16, z + 0.05], 0.1, 10, { caps: true });
      for (const dx of [-0.13, 0.13]) wr.beam([x + dx, yPick + 0.16, z], [x + dx, yRope, z], 0.02, 0.02);
      // diverter block under the deck (either side of the deck's secondary beam)
      hs.box(x, yRope - 0.4, z, 0.5, 0.26, 0.2);
      for (const dx of [-0.13, 0.13]) hs.tube([x + dx, yRope - 0.4, z - 0.12], [x + dx, yRope - 0.4, z + 0.12], 0.11, 10, { caps: true });
      for (const dx of [-0.22, 0.22]) hs.beam([x + dx, yRope - 0.3, z], [x + dx, yRope, z], 0.04, 0.12);
    }
  }

  // cable baskets riding on the grid (feed of the audience-side lighting trusses)
  for (const [bx, bz] of baskets) {
    const bk = col.b('rig.basket');
    const yb = y0 + GRID_BEAM_H + 0.02;
    bk.tube([bx, yb, bz], [bx, yb + 0.85, bz], 0.72, 16);
    bk.tube([bx, yb + 0.8, bz], [bx, yb + 0.85, bz], 0.75, 16);
    bk.tube([bx, yb, bz], [bx, yb + 0.04, bz], 0.75, 16, { caps: true });
    col.b('rig.cable').tube([bx, yb + 0.7, bz], [bx, yb + 0.72, bz], 0.71, 16, { caps: true });
  }
  void number;
}

export function buildLiftingGrids(col, SPEC, ctx, rig) {
  const lg = SPEC.production.liftingGrids;
  const y0 = lg.parkedBottomElevation_m;
  const rows = lg.rowCentresY_H; // world z (hall frame Y)
  const cols = lg.columnCentresX_H.map((x) => -x).sort((a, b) => a - b); // _H → world x
  let n = 1;
  const info = [];
  rows.forEach((cz, r) => {
    cols.forEach((cx) => {
      // row 1 (over the stage front) carries the cable baskets of lighting trusses 5 and 6
      // (in the cells that carry no pick-up)
      const baskets = r === 1 ? [[cx, cz - 3], [cx - 3, cz], [cx + 3, cz]] : [];
      liftingGrid(col, cx, cz, y0, n, { baskets, low: ctx.quality === 'low', yRope: rig.top(cx, cz) });
      info.push({ number: n, cx, cz, y0 });
      n++;
    });
  });
  return info;
}

// ------------------------------------------------------------------------------------------
// Lighting trusses and the permanent rig
// ------------------------------------------------------------------------------------------
export const HEADS_PER_TRUSS = [6, 5, 5, 5, 5, 6]; // 32 Claypaky HY B-EYE K25

export function buildLightingRig(col, SPEC, ctx) {
  const lt = SPEC.production.lightingTrusses;
  const low = ctx.quality === 'low';
  const size = lt.section_m;
  const trim = lt.trimElevation_m; // underside of the trusses
  const yc = trim + size / 2;
  const half = lt.width_m / 2;
  const [zA, zB] = lt.yRange_H;
  const zs = [];
  for (let i = 0; i < lt.count; i++) zs.push(zA + ((zB - zA) * i) / (lt.count - 1));
  const gridY = SPEC.production.liftingGrids.parkedBottomElevation_m;
  const tr = col.b('rig.truss');
  const body = col.b('light.body');
  const work = col.b('light.work');
  const duct = col.b('rig.flyDuct');
  const panel = low ? 1.1 : 0.55;

  const heads = []; // { x, y, z } pan pivot (underside of the base) of every moving head
  zs.forEach((z, i) => {
    boxTruss(tr, [-half, yc, z], [half, yc, z], { size, panel, joint: 4 });
    // three pipe battens under the truss, on short hangers
    const yPipe = trim - 0.13;
    for (const dz of [-0.2, 0, 0.2]) {
      tr.tube([-half + 0.15, yPipe, z + dz], [half - 0.15, yPipe, z + dz], 0.0243, 6, { caps: true });
      for (let x = -half + 0.4; x < half; x += 1.9) tr.beam([x, yPipe, z + dz], [x, trim + 0.02, z + dz], 0.02, 0.02);
    }
    // fly duct inside the truss (power and data outlets), outlet boxes every 2 m
    duct.box(0, trim + 0.13, z + 0.13, lt.width_m - 0.5, 0.1, 0.16);
    for (let x = -7; x <= 7.01; x += 2) body.box(x, trim + 0.13, z + 0.035, 0.26, 0.12, 0.04);
    for (let x = -6; x <= 6.01; x += 4) duct.box(x, trim + 0.06, z + 0.13, 0.05, 0.05, 0.5); // duct brackets on the bottom chords
    // moving heads on the centre batten
    const n = HEADS_PER_TRUSS[i];
    for (let k = 0; k < n; k++) {
      const x = -7 + (14 * k) / (n - 1);
      body.box(x - 0.1, yPipe - 0.05, z, 0.05, 0.14, 0.06);
      body.box(x + 0.1, yPipe - 0.05, z, 0.05, 0.14, 0.06);
      body.box(x, yPipe - 0.22, z, 0.42, 0.2, 0.36);
      body.box(x, yPipe - 0.22, z + 0.19, 0.3, 0.1, 0.03); // connector panel
      heads.push({ x, y: yPipe - 0.32, z, truss: i, index: heads.length });
    }
    // LED 4-lamp mini-brute work lights on the upstage batten
    for (const x of [-4.4, 4.4]) {
      body.box(x, yPipe - 0.13, z - 0.2, 0.36, 0.16, 0.36);
      for (const dx of [-0.085, 0.085]) {
        for (const dz of [-0.085, 0.085]) {
          body.tube([x + dx, yPipe - 0.21, z - 0.2 + dz], [x + dx, yPipe - 0.245, z - 0.2 + dz], 0.072, 10);
          work.tube([x + dx, yPipe - 0.236, z - 0.2 + dz], [x + dx, yPipe - 0.238, z - 0.2 + dz], 0, 10, { caps: true, r1: 0.07 });
        }
      }
    }
    // chain hoists to the lifting grids (3 m rigging pitch: x = ±1.5, ±7.5)
    for (const x of [-7.5, -1.5, 1.5, 7.5]) {
      tr.box(x, trim + size + 0.02, z, 0.12, 0.04, size); // pick bracket
      hoistLine(col, [x, trim + size + 0.04, z], { yRoof: gridY });
    }
  });

  // cable trusses running upstage-downstage at both ends of the four stage-side trusses
  const zFront = zs[3] + size / 2;
  const zBack = zs[0] - size / 2;
  for (const s of [-1, 1]) {
    const x = s * (half + size / 2);
    boxTruss(tr, [x, yc, zBack], [x, yc, zFront], { size, panel });
    const cb = col.b('rig.cable');
    // loom lying in the cable truss, then dropping to the stage-rear feed at arena level
    cb.beam([x, trim + 0.12, zBack + 0.1], [x, trim + 0.12, zFront - 0.1], 0.3, 0.1);
    cb.path(
      [
        [x, trim + 0.1, zBack + 0.15],
        [x + s * 0.05, trim - 1.2, zBack - 0.22],
        [x + s * 0.08, 5.5, zBack - 0.3],
        [x + s * 0.1, 0.5, zBack - 0.33],
        [x - s * 0.1, 0.07, zBack - 0.1],
        [s * 7.2, 0.07, -11.45],
      ],
      0.05,
      6,
    );
    // looms swagging from truss to truss
    for (let i = 0; i < 3; i++) {
      const pts = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        pts.push([s * (half - 0.35), trim + 0.1 - 2.2 * t * (1 - t), zs[i] + (zs[i + 1] - zs[i]) * t]);
      }
      cb.path(pts, 0.04, 5);
    }
  }
  // audience-side trusses 5 and 6: fed from the cable baskets on the lifting grids
  {
    const cb = col.b('rig.cable');
    const lgs = SPEC.production.liftingGrids;
    const bz = lgs.rowCentresY_H[1] - 3;
    for (const s of [-1, 1]) {
      const bx = s * Math.abs(lgs.columnCentresX_H[0]);
      cb.path(
        [
          [bx - s * 0.4, trim + size, zs[5]],
          [bx - s * 0.3, trim + size + 6, zs[5] - 0.2],
          [bx - s * 0.2, gridY + 0.5, bz],
        ],
        0.045,
        5,
      );
      cb.path(
        [
          [bx + s * 0.4, trim + size, zs[4]],
          [bx + s * 0.35, trim + size + 6, zs[4] + 0.9],
          [bx + s * 0.2, gridY + 0.5, bz],
        ],
        0.045,
        5,
      );
    }
  }
  // bridle beams spanning the gap between grid rows 0 and 1 (truss 5 hangs between them)
  {
    const g = col.b('rig.grid');
    const rows = SPEC.production.liftingGrids.rowCentresY_H;
    const z0 = rows[0] + 4.5;
    const z1 = rows[1] - 4.5;
    for (const x of [-7.5, -1.5, 1.5, 7.5]) g.span(x - 0.07, x + 0.07, gridY - 0.02, gridY + 0.2, z0 + 0.13, z1 - 0.13);
  }
  return { heads, zs, trim };
}

// ------------------------------------------------------------------------------------------
// Moving heads (instanced: yoke, head, lens cells) – animated in show mode
// ------------------------------------------------------------------------------------------
export const HEAD_PIVOT_DROP = 0.31; // tilt axis below the pan pivot
export const LENS_OFFSET = 0.212; // lens plane in front of the tilt axis

export function buildMovingHeads(heads, mats, ctx) {
  const low = ctx.quality === 'low';
  // yoke: origin at the pan pivot (underside of the base)
  const yoke = new Batch();
  yoke.box(0, -0.03, 0, 0.58, 0.06, 0.22);
  for (const s of [-1, 1]) {
    yoke.box(s * 0.265, -0.27, 0, 0.05, 0.44, 0.17);
    yoke.tube([s * 0.24, -HEAD_PIVOT_DROP, 0], [s * 0.295, -HEAD_PIVOT_DROP, 0], 0.07, 8, { caps: true });
  }
  // head: origin on the tilt axis, light leaves along −Y
  const head = new Batch();
  head.tube([0, 0.03, 0], [0, -0.2, 0], 0.212, 16);
  head.tube([0, 0.16, 0], [0, 0.03, 0], 0.15, 16, { r1: 0.212, caps: false });
  head.tube([0, 0.16, 0], [0, 0.161, 0], 0.15, 16, { caps: true });
  head.tube([0, -0.165, 0], [0, -0.166, 0], 0.212, 16, { caps: true }); // dark face recessed behind the lens cells
  head.tube([0, -0.17, 0], [0, -0.225, 0], 0.222, 16); // bezel
  // lens cells: 37 lenses in a hexagonal pack (B-EYE K25)
  const lens = new Batch();
  const rings = low ? 1 : 3;
  const pitch = low ? 0.125 : 0.057;
  const rCell = low ? 0.06 : 0.026;
  for (let q = -rings; q <= rings; q++) {
    for (let r = -rings; r <= rings; r++) {
      if (Math.abs(q + r) > rings) continue;
      const x = pitch * (q + r / 2);
      const z = pitch * r * 0.866;
      const pts = [];
      for (let k = 0; k < 6; k++) pts.push([x + rCell * Math.cos((k * Math.PI) / 3), -LENS_OFFSET, z + rCell * Math.sin((k * Math.PI) / 3)]);
      for (let k = 1; k < 5; k++) lens.tri(pts[0], pts[k], pts[k + 1]);
    }
  }
  const n = heads.length;
  const mk = (batch, material, name) => {
    const im = new THREE.InstancedMesh(batch.geometry(), material, n);
    im.name = name;
    im.userData.layer = 'stage';
    im.frustumCulled = false;
    im.castShadow = false;
    im.receiveShadow = false;
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    return im;
  };
  const yokeMesh = mk(yoke, mats['light.body'], 'moving heads: yokes');
  const headMesh = mk(head, mats['light.body'], 'moving heads: heads');
  const lensMesh = mk(lens, mats['light.lens'], 'moving heads: lenses');
  const off = new THREE.Color(LENS_OFF);
  for (let i = 0; i < n; i++) lensMesh.setColorAt(i, off);
  return { yokeMesh, headMesh, lensMesh };
}

// ------------------------------------------------------------------------------------------
// Follow spots: 8 x 3 kW units in the two pin-spot gallery rows
// ------------------------------------------------------------------------------------------
export function buildFollowSpots(col, SPEC) {
  const pg = SPEC.production.pinSpotGallery;
  const target = new THREE.Vector3(0, 3.0, -5);
  const spots = [];
  const place = (z0, yFloor, arcs) => {
    for (const sArc of arcs) {
      const f = facetPoint(z0, sArc, -0.45); // lens just over the stage-side guard (1.2 m)
      const pivot = new THREE.Vector3(f.x, yFloor + 1.75, f.z);
      const dir = target.clone().sub(pivot).normalize();
      const yaw = Math.atan2(dir.x, dir.z);
      const pitch = -Math.asin(dir.y);
      const M = trs(pivot.x, pivot.y, pivot.z, yaw, pitch);
      const b = col.b('light.body');
      // lamp house, rear fan box, tapering nose and lens tube (local +Z = beam direction)
      b.boxM(M, 0.46, 0.5, 1.0, 0, 0, -0.25);
      b.boxM(M, 0.36, 0.36, 0.22, 0, 0.02, -0.86);
      b.boxM(M, 0.5, 0.06, 0.6, 0, 0.28, -0.3);
      const p = (x, y, z) => {
        const v = new THREE.Vector3(x, y, z).applyMatrix4(M);
        return [v.x, v.y, v.z];
      };
      b.tube(p(0, 0, 0.25), p(0, 0, 0.82), 0.17, 12);
      b.tube(p(0, 0, 0.74), p(0, 0, 0.84), 0.19, 12);
      b.tube(p(0, 0, 0.25), p(0, 0, 0.251), 0.17, 12, { caps: true });
      col.b('light.spotLens').tube(p(0, 0, 0.8), p(0, 0, 0.801), 0.165, 12, { caps: true });
      // handle bar at the rear, yoke and stand
      b.beam(p(-0.2, 0.1, -1.0), p(0.2, 0.1, -1.0), 0.03, 0.03);
      const Y = trs(pivot.x, pivot.y, pivot.z, yaw);
      b.boxM(Y, 0.04, 0.5, 0.12, 0.27, -0.2, -0.2);
      b.boxM(Y, 0.04, 0.5, 0.12, -0.27, -0.2, -0.2);
      b.boxM(Y, 0.58, 0.05, 0.14, 0, -0.45, -0.2);
      const base = new THREE.Vector3(0, 0, -0.2).applyMatrix4(Y);
      b.tube([base.x, yFloor + 0.05, base.z], [base.x, pivot.y - 0.47, base.z], 0.045, 8);
      for (let k = 0; k < 3; k++) {
        const a = yaw + (k * 2 * Math.PI) / 3;
        b.beam([base.x, yFloor + 0.42, base.z], [base.x + 0.5 * Math.sin(a), yFloor + 0.03, base.z + 0.5 * Math.cos(a)], 0.035, 0.035);
      }
      const lensPos = new THREE.Vector3(0, 0, 0.82).applyMatrix4(M);
      spots.push({ pos: lensPos, dir, pivot, slot: { x: base.x, y: yFloor, z: base.z, rotY: yaw } });
    }
  };
  // arena/roof puts four enclosed follow-spot cabins on the centre facet of each row, in bays
  // of its 3.35 m frame grid; the same rule is used here so the lamps stand inside them.
  const cabinCentres = (z0) => {
    const xj = junctionX(z0);
    const n = Math.max(1, Math.round((2 * xj) / 3.35));
    const a = Math.round(n * 0.1);
    const b = Math.round(n * 0.36);
    return [a, b, n - 1 - b, n - 1 - a].map((k) => -xj + ((k + 0.5) * 2 * xj) / n);
  };
  place(pg.row1CentreY_H, pg.row1FloorElevation_m, cabinCentres(pg.row1CentreY_H));
  place(pg.row2CentreY_H, pg.row2FloorElevation_m, cabinCentres(pg.row2CentreY_H));
  return spots;
}


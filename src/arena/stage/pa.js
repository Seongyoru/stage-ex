// Permanent L-Acoustics system (research/00-consolidated.md 7.2, organizer-tech.md 8).
// Cabinet sizes are the manufacturer's published dimensions (W x H front / H rear x D):
//   K1 1.342 x 0.438 / 0.355 x 0.400     K2 1.342 x 0.354 / 0.286 x 0.400
//   K3 1.213 x 0.355 / 0.290 x 0.448     KARA II 0.730 x 0.250 / 0.200 x 0.481
//   KIVA II 0.522 x 0.151 / 0.110 x 0.357   KS28 1.344 x 0.550 x 0.700   SB15m 0.520 x 0.437 x 0.524
// Positions and trims: model-spec.json production.pa (Bestec frontal photo, JATET presets).
import * as THREE from 'three';
import { prism } from '../../core/geom.js';
import { trussBottomY, galleryFrontHalfWidth, FLANK_DIR, LEVEL_Y } from '../../core/envelope.js';
import { junctionX, WING_ANGLE } from '../../core/seating.js';
import { Collector, trs } from './batch.js';

const DEG = Math.PI / 180;

export const BOX = Object.freeze({
  K1: { w: 1.342, hf: 0.438, hr: 0.355, d: 0.4, notch: 0.07, centre: 0.2 },
  K2: { w: 1.342, hf: 0.354, hr: 0.286, d: 0.4, notch: 0.06, centre: 0.2 },
  K3: { w: 1.213, hf: 0.355, hr: 0.29, d: 0.448, notch: 0.055, centre: 0.18 },
  KARA: { w: 0.73, hf: 0.25, hr: 0.2, d: 0.481, notch: 0.03, centre: 0.11 },
  KIVA: { w: 0.522, hf: 0.151, hr: 0.11, d: 0.357, notch: 0.012, centre: 0.08 },
});
const KS28 = { w: 1.344, h: 0.55, d: 0.7 };
const SB15 = { w: 0.52, h: 0.437, d: 0.524 };

const cabinetCache = new Map();
/** Geometry of one K-series enclosure in its own frame: front-face centre at the origin, +Z = front normal. */
function cabinetGeometry(spec) {
  let g = cabinetCache.get(spec);
  if (g) return g;
  const hw = spec.w / 2;
  const { d, notch: n, centre: cw } = spec;
  const tanA = (spec.hf - spec.hr) / 2 / d;
  const ring = [
    [-hw, 0],
    [-cw, -n],
    [cw, -n],
    [hw, 0],
    [hw, -d * 0.6],
    [hw * 0.8, -d],
    [-hw * 0.8, -d],
    [-hw, -d * 0.6],
  ];
  g = prism(
    ring,
    (x, z) => -spec.hf / 2 - z * tanA,
    (x, z) => spec.hf / 2 + z * tanA,
  );
  cabinetCache.set(spec, g);
  return g;
}

/** One K-series enclosure placed by matrix M (cabinet frame → world). */
function kCabinet(col, M, spec) {
  col.b('pa.cabinet').add(cabinetGeometry(spec), M);
  const hw = spec.w / 2;
  const { notch: n, centre: cw } = spec;
  const e = 0.025; // grille stands proud of the baffle (enough to stay stable in the depth buffer from the stands)
  const hy = spec.hf / 2 - Math.min(0.016, spec.hf * 0.08);
  const g = col.b('pa.grille');
  const P = (x, y, z) => {
    const v = new THREE.Vector3(x, y, z).applyMatrix4(M);
    return [v.x, v.y, v.z];
  };
  const inset = Math.min(0.03, spec.w * 0.03);
  const panels = [
    [-hw + inset, 0, -cw, -n],
    [-cw, -n, cw, -n],
    [cw, -n, hw - inset, 0],
  ];
  for (const [x0, z0, x1, z1] of panels) g.quad(P(x0, -hy, z0 + e), P(x1, -hy, z1 + e), P(x1, hy, z1 + e), P(x0, hy, z0 + e));
  // side rigging plates (captive links run down both flanks of an array)
  const r = col.b('pa.rigging');
  for (const s of [-1, 1]) r.boxM(M, 0.022, spec.hr * 0.96, spec.d * 0.62, s * (hw + 0.011), 0, -spec.d * 0.36);
}

/**
 * Curved line array. `boxes` = [{ spec, splay }] from the top; splay (degrees) is the angle
 * to the box above (first entry: site angle of the top box, positive = tilted down).
 * Local frame: top-front edge centre at the origin, facing +Z. Returns layout info.
 */
function arrayLayout(boxes) {
  let theta = 0;
  let py = 0;
  let pz = 0;
  const out = [];
  for (const b of boxes) {
    theta += b.splay * DEG;
    const ty = -Math.cos(theta);
    const tz = -Math.sin(theta);
    out.push({ spec: b.spec, theta, cy: py + (ty * b.spec.hf) / 2, cz: pz + (tz * b.spec.hf) / 2 });
    py += ty * (b.spec.hf + 0.004);
    pz += tz * (b.spec.hf + 0.004);
  }
  return { items: out, drop: -py, back: -pz };
}

function placeArray(col, boxes, { x, z, yBottom, yTop, yaw = 0 }) {
  const lay = arrayLayout(boxes);
  const top = yTop !== undefined ? yTop : yBottom + lay.drop;
  const base = trs(x, top, z, yaw);
  for (const it of lay.items) {
    const M = base.clone().multiply(trs(0, it.cy, it.cz, 0, it.theta));
    kCabinet(col, M, it.spec);
  }
  return { top, bottom: top - lay.drop, base, lay };
}

/** Steel flying frame on top of an array, with its two pick points; returns the picks in world space. */
function bumper(col, base, w, depth = 1.05) {
  const r = col.b('pa.rigging');
  const y = 0.09;
  r.boxM(base, w * 0.96, 0.07, 0.07, 0, y, 0.0);
  r.boxM(base, w * 0.96, 0.07, 0.07, 0, y, -depth);
  for (const s of [-1, 1]) r.boxM(base, 0.07, 0.07, depth, s * (w * 0.48 - 0.035), y, -depth / 2);
  r.boxM(base, 0.09, 0.12, depth + 0.3, 0, y + 0.05, -depth / 2); // spine with the pick holes
  const picks = [];
  for (const dz of [0.05, -depth + 0.05]) {
    const v = new THREE.Vector3(0, y + 0.11, dz).applyMatrix4(base);
    picks.push([v.x, v.y, v.z]);
  }
  return picks;
}

/**
 * Chain hoist + chain from a pick point straight up. The line ends at `yRoof` when given
 * (a lifting grid), otherwise where `rig` (RoofRig) makes it fast under the roof.
 */
export function hoistLine(col, p, { rig, yRoof, motor = true, w = 0.026 } = {}) {
  const top = yRoof !== undefined ? yRoof : rig ? rig.top(p[0], p[2]) : trussBottomY(p[2]) - 0.02;
  col.b('rig.wire').beam(p, [p[0], top, p[2]], w, w);
  if (motor) {
    const m = col.b('rig.motor');
    m.box(p[0], p[1] + 0.62, p[2], 0.24, 0.46, 0.3);
    m.box(p[0] + 0.2, p[1] + 0.45, p[2], 0.16, 0.3, 0.2); // chain bag
    col.b('rig.wire').tube([p[0], p[1] + 0.02, p[2]], [p[0], p[1] + 0.2, p[2]], 0.035, 6);
  }
  return top;
}

/** Rectangular cable basket hung on its own lines above an array (the cable travels separately). */
function cableBasket(col, rig, x, y, z, { w = 1.25, d = 0.8, h = 0.75, yaw = 0, round = false } = {}) {
  const b = col.b('rig.basket');
  if (round) {
    b.tube([x, y, z], [x, y + h, z], w / 2, 16);
    b.tube([x, y + h - 0.04, z], [x, y + h, z], w / 2 + 0.025, 16);
    b.tube([x, y, z], [x, y + 0.04, z], w / 2 + 0.025, 16, { caps: true });
    col.b('rig.cable').tube([x, y + h - 0.12, z], [x, y + h - 0.1, z], w / 2 - 0.01, 16, { caps: true });
  } else {
    const M = trs(x, y, z, yaw);
    b.boxM(M, w, 0.03, d, 0, 0.015, 0);
    b.boxM(M, w, h, 0.02, 0, h / 2, d / 2 - 0.01);
    b.boxM(M, w, h, 0.02, 0, h / 2, -d / 2 + 0.01);
    b.boxM(M, 0.02, h, d, w / 2 - 0.01, h / 2, 0);
    b.boxM(M, 0.02, h, d, -w / 2 + 0.01, h / 2, 0);
    for (const s of [-1, 1]) {
      b.boxM(M, w + 0.06, 0.05, 0.05, 0, h, s * (d / 2));
      b.boxM(M, 0.05, 0.05, d + 0.06, s * (w / 2), h, 0);
    }
    col.b('rig.cable').boxM(M, w - 0.06, 0.04, d - 0.06, 0, h - 0.14, 0);
  }
  // four suspension lines to the roof and the cable tail
  const wr = col.b('rig.wire');
  const top = rig.top(x, z);
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  for (const [lx, lz] of [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [w / 2, d / 2],
    [-w / 2, d / 2],
  ]) {
    const k = round ? 0.7 : 1;
    const px = x + (lx * c + lz * s) * k;
    const pz = z + (-lx * s + lz * c) * k;
    wr.beam([px, y + h, pz], [x, y + h + 1.1, z], 0.016, 0.016);
  }
  wr.beam([x, y + h + 1.1, z], [x, top, z], 0.022, 0.022);
  col.b('rig.cable').beam([x + 0.12, y + h - 0.1, z], [x + 0.12, top, z], 0.07, 0.07);
}

const k1 = (splay) => ({ spec: BOX.K1, splay });
const k2 = (splay) => ({ spec: BOX.K2, splay });
const k3 = (splay) => ({ spec: BOX.K3, splay });
const kara = (splay) => ({ spec: BOX.KARA, splay });
const kiva = (splay) => ({ spec: BOX.KIVA, splay });

const MAIN_BOXES = [
  ...[-1, 0.25, 0.25, 0.5, 0.5, 0.75, 1, 1, 1.5, 2, 2, 3, 3, 4, 5, 5].map(k1),
  ...[5, 7.5, 10, 10].map(k2),
];
const OUTFILL_BOXES = [-2, 0.25, 0.25, 0.5, 0.5, 0.75, 1, 1, 1.5, 2, 2, 3, 3, 4, 4, 5, 5, 7.5, 7.5, 10].map(k2);
const CENTRE_BOXES = [5, 3, 4, 5, 7.5, 10].map(kara);
const DELAY1_BOXES = [2, 4, 5, 6].map(k2); // front rows of the Upper Stand, below the array
const DELAY2_BOXES = [-9, 5, 6, 8].map(k3); // rear rows, level with and above the array
const SIDEFILL_BOXES = [6, 5, 7, 9, 11].map(kiva);

/** KS28 subwoofer; `reversed` shows the rear panel (cardioid arrays turn every fourth box). */
function ks28(col, M, { grey = false, reversed = false } = {}) {
  const body = col.b(grey ? 'pa.subGrey' : 'pa.cabinet');
  const { w, h, d } = KS28;
  // carcass from the rear (−d) to 40 mm behind the front plane
  body.boxM(M, w, h - 0.012, d - 0.04, 0, 0, -(d + 0.04) / 2);
  if (reversed) {
    // rear panel turned to the audience: plain, with the connector plate
    body.boxM(M, w - 0.05, h - 0.05, 0.04, 0, 0, -0.02);
    col.b('pa.port').boxM(M, 0.3, 0.14, 0.02, 0.32, -0.08, 0.01);
  } else {
    // two grille fields either side of the central laminar vent
    const pw = (w - 0.26) / 2;
    for (const s of [-1, 1]) (grey ? body : col.b('pa.grille')).boxM(M, pw - 0.03, h - 0.05, 0.04, s * (0.13 + pw / 2), 0, -0.02);
    col.b('pa.port').boxM(M, 0.26, h - 0.06, 0.02, 0, 0, -0.03);
  }
  const r = col.b('pa.rigging');
  for (const s of [-1, 1]) r.boxM(M, 0.02, h * 0.9, 0.09, s * (w / 2 + 0.01), 0, -d / 2);
}

/** Everything flown from the roof: mains, flown subs, out-fills, centre cluster, delays, side fills. */
export function buildFlownPA(SPEC, rig) {
  const pa = SPEC.production.pa;
  const col = new Collector();
  const lvl5 = new Collector();
  const lvl9 = new Collector();

  for (const s of [-1, 1]) {
    // ---- main array: 16 K1 over 4 K2 ---------------------------------------------------
    {
      const x = s * pa.mainArrayX_H;
      const z = pa.mainArrayY_H;
      const a = placeArray(col, MAIN_BOXES, { x, z, yBottom: pa.mainArrayBottomTrim_m, yaw: s * 6 * DEG });
      const picks = bumper(col, a.base, BOX.K1.w);
      for (const p of picks) hoistLine(col, p, { rig });
      // cable basket behind the rear chain (it travels on its own lines)
      const yaw = s * 6 * DEG;
      const bx = picks[1][0] - 0.66 * Math.sin(yaw);
      const bz = picks[1][2] - 0.66 * Math.cos(yaw);
      cableBasket(col, rig, bx, a.top + 1.7, bz, { yaw });
      col.b('rig.cable').path(
        [
          [picks[1][0], a.top + 0.2, picks[1][2] - 0.12],
          [(picks[1][0] + bx) / 2, a.top + 1.05, bz + 0.25],
          [bx, a.top + 1.78, bz],
        ],
        0.05,
        5,
      );
    }
    // ---- flown subs: 12 KS28, cardioid ---------------------------------------------------
    {
      const x = s * pa.flownSubX_H;
      const z = pa.mainArrayY_H - 0.05;
      const n = pa.flownSubsPerSide;
      const mid = (pa.flownSubBottom_m + pa.flownSubTop_m) / 2;
      const top = mid + (n * (KS28.h + 0.004)) / 2;
      const base = trs(x, top, z + KS28.d / 2, 0);
      for (let i = 0; i < n; i++) {
        const M = base.clone().multiply(trs(0, -(i + 0.5) * (KS28.h + 0.004), 0));
        ks28(col, M, { grey: true, reversed: i % 4 === 3 });
      }
      const frame = trs(x, top, z + 0.31, 0);
      const picks = bumper(col, frame, KS28.w, 0.62);
      for (const p of picks) hoistLine(col, p, { rig });
      cableBasket(col, rig, x, top + 1.5, picks[1][2] - 0.6, { w: 1.1, d: 0.75, h: 0.7 });
    }
    // ---- out-fill: 20 K2 aimed at the wing stands ----------------------------------------
    {
      const x = s * pa.outfillX_H;
      const z = -0.6;
      const yaw = s * 55 * DEG;
      const a = placeArray(col, OUTFILL_BOXES, { x, z, yBottom: pa.outfillBottom_m, yaw });
      const picks = bumper(col, a.base, BOX.K2.w);
      // "delta plate": the rear pick splits into two legs that fix the azimuth
      hoistLine(col, picks[0], { rig });
      const rear = picks[1];
      const yRoof = rig.top(rear[0], rear[2]);
      const apex = [rear[0], rear[1] + 1.4, rear[2]];
      col.b('rig.wire').beam(rear, apex, 0.026, 0.026);
      col.b('pa.rigging').box(apex[0], apex[1], apex[2], 0.32, 0.26, 0.03);
      for (const k of [-1, 1]) col.b('rig.wire').beam(apex, [apex[0] + k * 1.6, yRoof, apex[2]], 0.024, 0.024);
      col.b('rig.motor').box(rear[0], rear[1] + 0.6, rear[2], 0.24, 0.46, 0.3, yaw);
      cableBasket(col, rig, x + s * 1.35, a.top + 1.6, picks[0][2], { w: 1.3, h: 0.8, round: true });
    }
  }

  // ---- centre cluster: 6 KARA II on the axis ----------------------------------------------
  {
    const lay = arrayLayout(CENTRE_BOXES);
    const top = pa.centreFillElevation_m + lay.drop / 2;
    const a = placeArray(col, CENTRE_BOXES, { x: 0, z: -0.2, yTop: top });
    const picks = bumper(col, a.base, BOX.KARA.w, 0.6);
    for (const p of picks) hoistLine(col, p, { rig, motor: false, w: 0.02 });
  }

  // ---- delay rings hung under the rear edge of the two pin-spot galleries (LEVEL 9 zone) ------
  // arena/roof: galleries 2.6 m deep on two edge girders (0.5 m deep, 1.2 m off the centre
  // line); the audience side carries masking panels, so the clusters hang below the girders.
  const pg = SPEC.production.pinSpotGallery;
  const hang = (boxes, z0, yFloor, arcs, w) => {
    for (const sArc of arcs) {
      const f = facetPoint(z0, sArc, 0.92);
      const top = yFloor - 0.78;
      const a = placeArray(lvl9, boxes, { x: f.x, z: f.z, yTop: top, yaw: f.yaw });
      const picks = bumper(lvl9, a.base, w, 0.42);
      for (const p of picks) lvl9.b('pa.rigging').beam(p, [p[0], yFloor - 0.28, p[2]], 0.05, 0.05);
      // cross beam under the gallery joists that carries both drop rods
      const c0 = new THREE.Vector3(-w / 2, 0.52, -0.16).applyMatrix4(a.base);
      const c1 = new THREE.Vector3(w / 2, 0.52, -0.16).applyMatrix4(a.base);
      lvl9.b('pa.rigging').beam([c0.x, yFloor - 0.31, c0.z], [c1.x, yFloor - 0.31, c1.z], 0.5, 0.08);
    }
  };
  hang(DELAY1_BOXES, pg.row1CentreY_H, pg.row1FloorElevation_m, [-32.5, -19.5, -6.5, 6.5, 19.5, 32.5], BOX.K2.w);
  hang(DELAY2_BOXES, pg.row2CentreY_H, pg.row2FloorElevation_m, [-47.6, -34, -20.4, -6.8, 6.8, 20.4, 34, 47.6], BOX.K3.w);

  // ---- balcony side fills at the 5F gallery level: 2 SB15m over 5 KIVA II per side --------
  // Hung from the 6F gallery edge beside the last bay of the 5F side gallery (which ends at
  // gallery-front station z = 26.8 in arena/hall), aimed along the wall at the Middle Stand wings.
  for (const s of [-1, 1]) {
    const z = 25.6;
    const xFront = galleryFrontHalfWidth(z);
    // 0.45 m in front of the gallery edge, measured square to the wall
    const x = s * (xFront - 0.45 * FLANK_DIR[1]);
    const zz = z + 0.45 * FLANK_DIR[0];
    const yaw = s * (Math.atan2(FLANK_DIR[0], FLANK_DIR[1]) - 25 * DEG);
    const top = LEVEL_Y[5] + 4.3;
    const base = trs(x, top, zz, yaw);
    for (let i = 0; i < 2; i++) {
      const M = base.clone().multiply(trs(0, -(i + 0.5) * (SB15.h + 0.004), 0));
      lvl5.b('pa.cabinet').boxM(M, SB15.w, SB15.h, SB15.d - 0.03, 0, 0, -SB15.d / 2 - 0.015);
      lvl5.b('pa.grille').boxM(M, SB15.w - 0.04, SB15.h - 0.04, 0.03, 0, 0, -0.015);
    }
    const yK = top - 2 * (SB15.h + 0.004) - 0.03;
    placeArray(lvl5, SIDEFILL_BOXES, { x, z: zz, yTop: yK, yaw });
    // bracket back to the gallery above (6F fascia) – a short arm and a drop rod
    const r = lvl5.b('pa.rigging');
    const rod0 = new THREE.Vector3(0, 0.02, -0.26).applyMatrix4(base);
    r.beam([rod0.x, rod0.y, rod0.z], [rod0.x, LEVEL_Y[6] - 0.5, rod0.z], 0.05, 0.05);
    r.boxM(base, SB15.w + 0.1, 0.06, 0.5, 0, 0.05, -0.26);
    r.beam([rod0.x, LEVEL_Y[6] - 0.5, rod0.z], [rod0.x + s * 0.8 * FLANK_DIR[1], LEVEL_Y[6] - 0.5, rod0.z - 0.8 * FLANK_DIR[0]], 0.06, 0.08);
  }

  return { col, lvl5, lvl9 };
}

/**
 * Point on a three-facet line (centre facet at world z = z0, wings turned WING_ANGLE toward
 * the stage) at arc distance sArc from the axis; `out` shifts it toward the audience.
 * Returns { x, z, yaw } with yaw = facing of an object that looks at the seats behind it.
 */
export function facetPoint(z0, sArc, out = 0) {
  const jx = junctionX(z0);
  const a = WING_ANGLE;
  const sgn = Math.sign(sArc) || 1;
  const d = Math.abs(sArc);
  if (d <= jx) return { x: sArc, z: z0 + out, yaw: 0 };
  const over = d - jx;
  return {
    x: sgn * (jx + over * Math.cos(a) + out * Math.sin(a)),
    z: z0 - over * Math.sin(a) + out * Math.cos(a),
    yaw: sgn * a,
  };
}

/** Lip fills and ground subs that live under the basic stage (part of the stage kit). */
export function addUnderStagePA(col, SPEC, KEN) {
  const pa = SPEC.production.pa;
  // 10 positions x 2 KIVA II on small stands just behind the front bracing
  const nLip = pa.lipFillPositions;
  for (let i = 0; i < nLip; i++) {
    const xm = (i - (nLip - 1) / 2) * 2 * KEN; // middle of a bay of the 2-ken leg grid
    const x = xm - Math.sign(xm) * 0.6; // beside the tied skirt bundle that hangs there
    const z = -0.16;
    const y0 = 1.16;
    for (let k = 0; k < 2; k++) {
      const M = trs(x, y0 + BOX.KIVA.hf / 2 + k * (BOX.KIVA.hf + 0.004), z, 0);
      kCabinet(col, M, BOX.KIVA);
    }
    const st = col.b('pa.rigging');
    st.box(x, y0 - 0.015, z - 0.18, 0.56, 0.03, 0.4);
    st.beam([x, 0.02, z - 0.2], [x, y0 - 0.03, z - 0.2], 0.045, 0.045);
    st.box(x, 0.01, z - 0.2, 0.45, 0.02, 0.45);
  }
  // 4 positions x 2 KS28, evenly spaced under the 50.9 m wide front
  const nSub = pa.groundSubPositions;
  const pitch = 12.9; // 50.9 m / 4, nudged 0.18 m so the stacks clear the lip-fill stands
  for (let i = 0; i < nSub; i++) {
    const x = (i - (nSub - 1) / 2) * pitch;
    const z = -0.3;
    col.b('pa.rigging').box(x, 0.06, z - KS28.d / 2, KS28.w + 0.04, 0.12, KS28.d + 0.04); // wheel board
    for (let k = 0; k < 2; k++) ks28(col, trs(x, 0.12 + KS28.h / 2 + k * (KS28.h + 0.004), z, 0));
  }
}

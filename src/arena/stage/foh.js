// Temporary show furniture (userData.showOnly): the front-of-house mix riser at the rear
// of the arena floor and the crowd barrier in front of the stage.
// research/00-consolidated.md 7.2 (FOH: on the axis at Y_H about 31, about 6 x 5 m),
// section 10 (stage barricade, about 50 x 1 m units in front of the stage).
import * as THREE from 'three';
import { ROW_TREAD, PARTS } from '../../core/seating.js';
import { Collector, trs } from './batch.js';
import { rail, stairFlight } from './kit.js';

/**
 * Plan of the riser. The standard arena layout fills the floor with seats, so the riser is
 * a platform built over the last six rows of the centre block: its edges fall between
 * seats and between rows, and its deck clears the seat backs.
 */
export function fohFootprint(SPEC) {
  const foh = SPEC.production.foh;
  const centre = PARTS.find((p) => p.tier === 1 && p.facet === 'C');
  const rows = centre.rows;
  const last = rows[rows.length - 1];
  const seg = last.segs.find((s) => s.u0 < 0 && s.u1 > 0) || last.segs[Math.floor(last.segs.length / 2)];
  const snap = (x) => seg.u0 + Math.round((x - seg.u0) / seg.pitch) * seg.pitch;
  const x0 = snap(-foh.width_m / 2);
  const x1 = snap(foh.width_m / 2);
  const z1 = last.v + 0.47; // just behind the last row
  const nRows = Math.round(foh.depth_m / ROW_TREAD);
  const z0 = last.v - (nRows - 1) * ROW_TREAD - 0.41;
  return { x0, x1, z0, z1, top: 1.1 };
}

export function buildFOH(SPEC) {
  const col = new Collector();
  const f = fohFootprint(SPEC);
  const { x0, x1, z0, z1, top } = f;
  const cx = (x0 + x1) / 2;
  const deck = col.b('foh.riser');
  const st = col.b('stage.steel');
  const rl = col.b('stage.rail');
  // deck and edge frame
  deck.span(x0 + 0.02, x1 - 0.02, top - 0.06, top, z0 + 0.02, z1 - 0.02);
  st.span(x0, x1, top - 0.16, top - 0.0, z0, z0 + 0.02);
  st.span(x0, x1, top - 0.16, top - 0.0, z1 - 0.02, z1);
  st.span(x0, x0 + 0.02, top - 0.16, top, z0 + 0.02, z1 - 0.02);
  st.span(x1 - 0.02, x1, top - 0.16, top, z0 + 0.02, z1 - 0.02);
  // skirt on all four sides (hides the scaffold and the seats under the platform)
  const sk = col.b('stage.skirt');
  const e = 0.006;
  const ring = [
    [x0 + e, z0 + e],
    [x1 - e, z0 + e],
    [x1 - e, z1 - e],
    [x0 + e, z1 - e],
  ];
  for (let i = 0; i < 4; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % 4];
    sk.quad2([a[0], 0.01, a[1]], [b[0], 0.01, b[1]], [b[0], top - 0.16, b[1]], [a[0], top - 0.16, a[1]]);
  }
  // guard rails: both sides and the rear (gap for the stair), low kick board at the front
  rail(rl, [x0 + 0.05, top, z0 + 0.05], [x0 + 0.05, top, z1 - 0.05], { h: 1.0, spacing: 1.25 });
  rail(rl, [x1 - 0.05, top, z0 + 0.05], [x1 - 0.05, top, z1 - 0.05], { h: 1.0, spacing: 1.25 });
  rail(rl, [x0 + 0.05, top, z1 - 0.05], [cx - 0.6, top, z1 - 0.05], { h: 1.0, spacing: 1.2, endPosts: [false, true] });
  rail(rl, [cx + 0.6, top, z1 - 0.05], [x1 - 0.05, top, z1 - 0.05], { h: 1.0, spacing: 1.2, endPosts: [true, false] });
  deck.span(x0 + 0.05, x1 - 0.05, top, top + 0.42, z0 + 0.03, z0 + 0.07);
  // access stair at the rear, descending toward the stands
  const stair = new Collector();
  stairFlight(stair, 0, top, -0.55, 0.55, 5, 0.22, 0.27);
  col.merge(stair, new THREE.Matrix4().makeRotationY(-Math.PI / 2).setPosition(cx, 0, z1));

  // blue anti-fatigue mat where the operators stand
  col.b('foh.mat').span(x0 + 0.5, x1 - 0.5, top, top + 0.012, z0 + 1.75, z0 + 3.05);

  const con = col.b('foh.console');
  const scr = col.b('foh.screen');
  const desk = (x, z, w, d, h) => {
    // trestle legs and a flight-case style top
    for (const s of [-1, 1]) {
      st.beam([x + s * (w / 2 - 0.12), top, z - d / 2 + 0.1], [x + s * (w / 2 - 0.12), top + h - 0.04, z - d / 2 + 0.1], 0.04, 0.04);
      st.beam([x + s * (w / 2 - 0.12), top, z + d / 2 - 0.1], [x + s * (w / 2 - 0.12), top + h - 0.04, z + d / 2 - 0.1], 0.04, 0.04);
      st.beam([x + s * (w / 2 - 0.12), top + 0.25, z - d / 2 + 0.1], [x + s * (w / 2 - 0.12), top + 0.25, z + d / 2 - 0.1], 0.03, 0.03);
    }
    con.box(x, top + h - 0.02, z, w, 0.04, d);
  };
  // audio console (house: DiGiCo Quantum338): raked control surface with three touch screens
  {
    const x = cx;
    const z = z0 + 1.15;
    desk(x, z, 2.1, 1.0, 0.82);
    const M = trs(x, top + 0.82 + 0.13, z, 0, -0.2);
    con.boxM(M, 1.75, 0.2, 0.9, 0, 0, 0);
    const B = trs(x, top + 0.82 + 0.4, z - 0.33, 0, -1.05);
    con.boxM(B, 1.75, 0.05, 0.38, 0, 0, 0);
    for (const o of [-0.56, 0, 0.56]) scr.boxM(B, 0.48, 0.006, 0.3, o, 0.03, 0);
  }
  // lighting desk with two monitors (house left)
  {
    const x = x0 + 1.05;
    const z = z0 + 1.2;
    desk(x, z, 1.5, 0.85, 0.82);
    con.boxM(trs(x, top + 0.82 + 0.09, z + 0.05, 0, -0.16), 1.2, 0.14, 0.62, 0, 0, 0);
    for (const o of [-0.34, 0.34]) {
      const S = trs(x + o, top + 0.82 + 0.5, z - 0.3, 0, -0.12);
      con.boxM(S, 0.6, 0.36, 0.03, 0, 0, -0.02);
      scr.boxM(S, 0.55, 0.31, 0.004, 0, 0, 0);
      st.beam([x + o, top + 0.82, z - 0.33], [x + o, top + 0.82 + 0.36, z - 0.33], 0.03, 0.03);
    }
  }
  // video / playback station (house right)
  {
    const x = x1 - 1.05;
    const z = z0 + 1.2;
    desk(x, z, 1.5, 0.85, 0.82);
    for (const o of [-0.4, 0.4]) {
      con.box(x + o, top + 0.83, z + 0.05, 0.36, 0.02, 0.26);
      const S = trs(x + o, top + 0.82 + 0.13, z - 0.1, 0, -0.3);
      con.boxM(S, 0.36, 0.25, 0.012, 0, 0, -0.008);
      scr.boxM(S, 0.33, 0.21, 0.004, 0, 0, 0);
    }
  }
  // outboard and amplifier racks along the rear, stools
  for (const x of [x0 + 0.7, x0 + 1.45, x1 - 0.7, x1 - 1.45]) {
    con.span(x - 0.32, x + 0.32, top + 0.1, top + 1.05, z1 - 1.15, z1 - 0.4);
    for (const dx of [-0.25, 0.25]) for (const dz of [-1.08, -0.47]) con.tube([x + dx, top, z1 + dz], [x + dx, top + 0.1, z1 + dz], 0.04, 6);
    scr.span(x - 0.26, x + 0.26, top + 0.7, top + 0.86, z1 - 1.156, z1 - 1.15);
  }
  for (const x of [cx - 0.5, cx + 0.6, x0 + 1.1, x1 - 1.1]) {
    const z = z0 + 2.35;
    con.tube([x, top + 0.62, z], [x, top + 0.68, z], 0.19, 12, { caps: true });
    st.tube([x, top + 0.02, z], [x, top + 0.62, z], 0.025, 6);
    st.tube([x, top, z], [x, top + 0.02, z], 0.2, 12, { caps: true });
  }
  return col;
}

/** Crowd barrier in front of the stage: 1 m black steel units with tread plate and brace. */
export function buildBarricade(SPEC, col) {
  const b = col.b('stage.barricade');
  const zFace = 1.3;
  const n = 50;
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 1.0;
    b.box(x, 0.6, zFace, 0.98, 1.14, 0.03); // front plate
    b.tube([x - 0.49, 1.19, zFace], [x + 0.49, 1.19, zFace], 0.03, 6); // top rail
    b.box(x, 0.012, zFace + 0.42, 0.98, 0.024, 0.86); // tread plate (audience stands on it)
    b.box(x, 0.3, zFace - 0.22, 0.98, 0.03, 0.28); // crew step
    for (const s of [-1, 1]) {
      b.beam([x + s * 0.44, 1.1, zFace - 0.02], [x + s * 0.44, 0.03, zFace - 0.45], 0.04, 0.04);
      b.beam([x + s * 0.44, 0.02, zFace], [x + s * 0.44, 0.02, zFace - 0.47], 0.05, 0.04);
    }
  }
  return col;
}

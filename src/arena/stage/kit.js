// The demountable "basic stage" (基礎ステージ): main deck 12 x 7 ken with the two
// performer passages (hanamichi, 8 ken each), the lower side stages behind them, the
// load-in ramps and stairs at stage left / right, pipe handrails and the black steel
// truss-leg substructure that stays visible while the skirt is tied up.
//
// Facts (research/00-consolidated.md 7.1, organizer-tech.md 2, CONFIRMED): 21.8 x 12.7 m,
// 1.8 m high, total width with both hanamichi 50.9 m; main deck + performer passages +
// side stages + stairs + ramps at stage left and right. Front edge at z = 0 (ESTIMATED).
//
// Plan of the wings (ESTIMATED here from the Theatre Workshop photographs k_arena_01 / 02
// and the official LEVEL 1 seat-view photo, scaled on the 1-ken module of the deck):
//   - the hanamichi is a narrow passage 1.5 ken (2.73 m) deep along the front line, with a
//     pipe rail on its upstage edge and across its outer end;
//   - behind it stands a lower "side stage" (deck at +1.2) with its own rails and a stair
//     to the floor at the outer end;
//   - upstage of that the load-in ramp runs from the side edge of the main deck straight
//     out to the floor (1.8 m over 14.55 m = 1 : 8), and a stair leaves the upstage corner.
// The fact sheet's "hanamichi depth about 5.5 m" (ESTIMATED, low confidence) is the depth
// of passage + side stage seen as one mass in oblique views.
import { prism, offsetRing } from '../../core/geom.js';
import { Collector, MIRROR_X } from './batch.js';

export const KEN = 21.8 / 12; // 1.8167 m
export const STAGE = Object.freeze({
  halfW: 10.9,
  depth: 12.7,
  h: 1.8,
  hanOuter: 25.45,
  hanDepth: 1.5 * KEN, // 2.725 m (photo measurement; the spec's 5.5 m includes the side stage)
});

/** Side stage (lower platform behind each hanamichi), house-right copy. */
export const SIDE_STAGE = Object.freeze({ x0: 11.05, x1: 11.05 + 3.5 * KEN, z0: -7.88, z1: -2.88, h: 1.2 });
/** Load-in ramp, house-right copy: from the main deck edge down to the floor. */
export const RAMP = Object.freeze({ x0: 10.9, x1: 25.45, z0: -10.9, z1: -8.63 });
/** Upstage stair, house-right copy. */
export const STAIR = Object.freeze({ x0: 10.9, z0: -12.6, z1: -11.1, risers: 12, rise: 0.15, tread: 0.3 });

const POST = 0.05;
const DECK_T = 0.06;

/** Pipe guard rail between two base points (may slope): posts, top rail, mid rail. */
export function rail(b, p0, p1, { h = 1.1, spacing = KEN, mid = true, endPosts = [true, true] } = {}) {
  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  const dz = p1[2] - p0[2];
  const len = Math.hypot(dx, dz);
  const n = Math.max(1, Math.round(len / spacing));
  for (let i = 0; i <= n; i++) {
    if (i === 0 && !endPosts[0]) continue;
    if (i === n && !endPosts[1]) continue;
    const t = i / n;
    const x = p0[0] + dx * t;
    const y = p0[1] + dy * t;
    const z = p0[2] + dz * t;
    b.beam([x, y, z], [x, y + h, z], 0.042, 0.042);
  }
  b.beam([p0[0], p0[1] + h, p0[2]], [p1[0], p1[1] + h, p1[2]], 0.045, 0.045);
  if (mid) b.beam([p0[0], p0[1] + h * 0.52, p0[2]], [p1[0], p1[1] + h * 0.52, p1[2]], 0.034, 0.034);
}

/** Truss leg: a ladder frame in the YZ plane (two posts, rungs, zigzag lacing) with base plates. */
function trussLeg(b, x, zc, top, half = 0.3) {
  for (const s of [-1, 1]) {
    const z = zc + s * half;
    b.box(x, 0.006, z, 0.15, 0.012, 0.15);
    b.tube([x, 0.012, z], [x, 0.1, z], 0.018, 6);
    b.beam([x, 0.08, z], [x, top, z], POST, POST);
  }
  const y0 = 0.2;
  const y1 = top - 0.08;
  b.beam([x, y0, zc - half], [x, y0, zc + half], 0.04, 0.04);
  b.beam([x, y1, zc - half], [x, y1, zc + half], 0.04, 0.04);
  const steps = top > 1.2 ? 3 : 2;
  for (let i = 0; i < steps; i++) {
    const ya = y0 + ((y1 - y0) * i) / steps;
    const yb = y0 + ((y1 - y0) * (i + 1)) / steps;
    const sa = i % 2 === 0 ? -half : half;
    b.beam([x, ya, zc + sa], [x, yb, zc - sa], 0.03, 0.03);
  }
}

/** Cross bracing rods between two posts. */
function xbrace(b, a, c, y0, y1, r = 0.026) {
  b.beam([a[0], y0, a[1]], [c[0], y1, c[1]], r, r);
  b.beam([a[0], y1, a[1]], [c[0], y0, c[1]], r, r);
}

export function buildStageKit(ctx) {
  const low = ctx.quality === 'low';
  const col = new Collector(); // symmetric about x = 0, built once
  const side = new Collector(); // house-right parts, mirrored afterwards
  const steel = col.b('stage.steel');
  const { halfW: W, depth: D, h: H, hanOuter: XO, hanDepth: HD } = STAGE;

  // ---- deck: main block + both hanamichi as one T-shaped slab -------------------------
  const outline = [
    [-XO, 0],
    [XO, 0],
    [XO, -HD],
    [W, -HD],
    [W, -D],
    [-W, -D],
    [-W, -HD],
    [-XO, -HD],
  ];
  const FASCIA = 0.03;
  col.b('stage.deck').add(prism(offsetRing(outline, -FASCIA), H - DECK_T, H));
  // black fascia band round the whole outline (deck edge + edge beam)
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i];
    const c = outline[(i + 1) % outline.length];
    const len = Math.hypot(c[0] - a[0], c[1] - a[1]);
    const ux = (c[0] - a[0]) / len;
    const uz = (c[1] - a[1]) / len;
    // inward normal of this ring (ring runs with the solid on its right seen from above … use centroid test)
    const mx = (a[0] + c[0]) / 2;
    const mz = (a[1] + c[1]) / 2;
    let nx = -uz;
    let nz = ux;
    const inside = (x, z) => (z <= 0 && z >= -HD && Math.abs(x) <= XO) || (z <= 0 && z >= -D && Math.abs(x) <= W);
    if (!inside(mx + nx * 0.1, mz + nz * 0.1)) {
      nx = -nx;
      nz = -nz;
    }
    const o = FASCIA / 2;
    steel.beam([a[0] + nx * o - ux * 0, H - 0.1, a[1] + nz * o], [c[0] + nx * o, H - 0.1, c[1] + nz * o], FASCIA, 0.2);
  }

  // ---- frame under the deck ------------------------------------------------------------
  const yLegTop = H - DECK_T - 0.1 - 0.15; // 1.49
  const yPrim0 = yLegTop;
  const yPrim1 = yLegTop + 0.15;
  const yJoist1 = H - DECK_T;
  const xLinesMain = [];
  for (let i = -3; i <= 3; i++) xLinesMain.push(i * 2 * KEN);
  const xLinesHan = [];
  for (let i = 4; i <= 7; i++) xLinesHan.push(i * 2 * KEN); // 14.53 … 25.43
  const rowsMain = [-0.4, -3.375, -6.35, -9.325, -12.3];
  const rowsHan = [-0.4, -HD + 0.4];
  const HALF = 0.3;

  // primary beams along z on every leg line
  for (const x of xLinesMain) {
    const xx = Math.sign(x) * Math.min(Math.abs(x), W - 0.07);
    steel.span(xx - 0.04, xx + 0.04, yPrim0, yPrim1, -D + 0.04, -0.04);
  }
  for (const s of [-1, 1]) {
    for (const x of xLinesHan) {
      const xx = Math.min(x, XO - 0.07) * s;
      steel.span(xx - 0.04, xx + 0.04, yPrim0, yPrim1, -HD + 0.04, -0.04);
    }
  }
  // joists along x every half ken
  const joistZ = [];
  for (let z = -0.07; z > -D + 0.4; z -= KEN / 2) joistZ.push(z);
  joistZ.push(-D + 0.07);
  for (const z of joistZ) {
    const xe = z >= -HD + 0.03 ? XO - 0.04 : W - 0.04;
    steel.span(-xe, xe, yPrim1, yJoist1, z - 0.025, z + 0.025);
  }
  // hanamichi rear edge joist
  for (const s of [-1, 1]) steel.span(s * (W + 0.02), s * (XO - 0.04), yPrim1, yJoist1, -HD + 0.045, -HD + 0.095);

  // ---- truss legs and bracing ---------------------------------------------------------
  const legX = (x) => Math.sign(x) * Math.min(Math.abs(x), XO - 0.07);
  const mainX = xLinesMain.map((x) => Math.sign(x) * Math.min(Math.abs(x), W - 0.07));
  for (const x of mainX) for (const zc of rowsMain) trussLeg(steel, x, zc, yLegTop, HALF);
  for (const s of [-1, 1]) for (const x of xLinesHan) for (const zc of rowsHan) trussLeg(steel, legX(x) * s, zc, yLegTop, zc === rowsHan[1] ? 0.3 : HALF);
  // X bracing in the planes of the post rows (along x)
  const allX = [...xLinesHan.map((x) => -legX(x)).reverse(), ...mainX, ...xLinesHan.map(legX)];
  for (let i = 0; i < allX.length - 1; i++) {
    const xa = allX[i];
    const xb = allX[i + 1];
    const inMain = Math.max(Math.abs(xa), Math.abs(xb)) <= W;
    // front row (audience side): every bay, like the official photographs
    xbrace(steel, [xa, rowsMain[0] + HALF], [xb, rowsMain[0] + HALF], 0.22, yLegTop - 0.1);
    if (inMain) {
      xbrace(steel, [xa, rowsMain[4] - HALF], [xb, rowsMain[4] - HALF], 0.22, yLegTop - 0.1);
      if (!low) for (const j of [1, 2, 3]) if ((i + j) % 2 === 0) xbrace(steel, [xa, rowsMain[j]], [xb, rowsMain[j]], 0.22, yLegTop - 0.1);
    } else {
      xbrace(steel, [xa, rowsHan[1] - 0.3], [xb, rowsHan[1] - 0.3], 0.22, yLegTop - 0.1);
    }
  }
  // bracing between the rows (along z)
  for (const x of mainX) {
    for (let j = 0; j < rowsMain.length - 1; j++) {
      if (!low || Math.abs(x) > W - 0.2) xbrace(steel, [x, rowsMain[j] - HALF], [x, rowsMain[j + 1] + HALF], 0.22, yLegTop - 0.1);
    }
  }
  for (const s of [-1, 1]) for (const x of xLinesHan) xbrace(steel, [legX(x) * s, rowsHan[0] - HALF], [legX(x) * s, rowsHan[1] + 0.3], 0.22, yLegTop - 0.1);

  // ======================= house-right wing parts (mirrored) ==========================
  const st = side.b('stage.steel');
  const rl = side.b('stage.rail');

  // hanamichi rails: upstage edge and outer end
  rail(rl, [W + 0.06, H, -HD + 0.05], [XO - 0.05, H, -HD + 0.05]);
  rail(rl, [XO - 0.05, H, -HD + 0.05], [XO - 0.05, H, -0.06], { spacing: 1.4, endPosts: [false, true] });

  // main deck side edge rails (openings: step to the side stage, ramp, stair)
  const stepZ0 = -5.95;
  const stepZ1 = -4.85;
  rail(rl, [W - 0.05, H, RAMP.z1 + 0.06], [W - 0.05, H, stepZ0], { spacing: 1.4 });
  rail(rl, [W - 0.05, H, stepZ1], [W - 0.05, H, -HD - 0.06], { spacing: 1.4 });

  // ---- side stage (lower platform) ----------------------------------------------------
  {
    const S = SIDE_STAGE;
    side.b('stage.deck').span(S.x0 + 0.03, S.x1 - 0.03, S.h - DECK_T, S.h, S.z0 + 0.03, S.z1 - 0.03);
    // fascia
    st.span(S.x0, S.x1, S.h - 0.18, S.h, S.z0, S.z0 + 0.03);
    st.span(S.x0, S.x1, S.h - 0.18, S.h, S.z1 - 0.03, S.z1);
    st.span(S.x0, S.x0 + 0.03, S.h - 0.18, S.h, S.z0 + 0.03, S.z1 - 0.03);
    st.span(S.x1 - 0.03, S.x1, S.h - 0.18, S.h, S.z0 + 0.03, S.z1 - 0.03);
    const xs = [S.x0 + 0.08, (S.x0 + S.x1) / 2, S.x1 - 0.08];
    const zs = [S.z0 + 0.08, (S.z0 + S.z1) / 2, S.z1 - 0.08];
    const top = S.h - DECK_T - 0.1;
    for (const x of xs) {
      st.span(x - 0.035, x + 0.035, top - 0.12, top, S.z0 + 0.04, S.z1 - 0.04);
      for (const z of zs) {
        st.box(x, 0.006, z, 0.14, 0.012, 0.14);
        st.beam([x, 0.012, z], [x, top - 0.12, z], POST, POST);
      }
    }
    for (let k = 0; k <= 6; k++) {
      const z = S.z0 + 0.06 + ((S.z1 - S.z0 - 0.12) * k) / 6;
      st.span(S.x0 + 0.04, S.x1 - 0.04, top, S.h - DECK_T, z - 0.025, z + 0.025);
    }
    for (let i = 0; i < 2; i++) {
      xbrace(st, [xs[i], zs[0]], [xs[i + 1], zs[0]], 0.15, top - 0.2);
      xbrace(st, [xs[i], zs[2]], [xs[i + 1], zs[2]], 0.15, top - 0.2);
      xbrace(st, [xs[0], zs[i]], [xs[0], zs[i + 1]], 0.15, top - 0.2);
      xbrace(st, [xs[2], zs[i]], [xs[2], zs[i + 1]], 0.15, top - 0.2);
    }
    // step unit between the main deck (1.8) and the side stage (1.2)
    side.b('stage.deck').span(W + 0.02, W + 0.47, S.h + 0.26, S.h + 0.3, stepZ0 + 0.03, stepZ1 - 0.03);
    st.span(W + 0.02, W + 0.47, S.h, S.h + 0.26, stepZ0 + 0.05, stepZ0 + 0.09);
    st.span(W + 0.02, W + 0.47, S.h, S.h + 0.26, stepZ1 - 0.09, stepZ1 - 0.05);
    st.span(W + 0.43, W + 0.47, S.h, S.h + 0.26, stepZ0 + 0.09, stepZ1 - 0.09);
    // rails: upstage side and outer end (opening for the stair next to the hanamichi)
    rail(rl, [S.x0 + 0.05, S.h, S.z0 + 0.05], [S.x1 - 0.05, S.h, S.z0 + 0.05], { spacing: 1.6 });
    rail(rl, [S.x1 - 0.05, S.h, S.z0 + 0.05], [S.x1 - 0.05, S.h, S.z1 - 1.25], { spacing: 1.3, endPosts: [false, true] });
    // stair from the outer end of the side stage down to the floor
    stairFlight(side, S.x1, S.h, S.z1 - 1.18, S.z1 - 0.06, 6, 0.2, 0.28);
  }

  // ---- load-in ramp ------------------------------------------------------------------
  {
    const R = RAMP;
    const len = R.x1 - R.x0;
    const yAt = (x) => H * (1 - (x - R.x0) / len);
    const rb = side.b('stage.ramp');
    const t = 0.045;
    // sloped running surface
    rb.hexa([
      [R.x0, H - t, R.z0 + 0.04],
      [R.x1, -t + 0.045, R.z0 + 0.04],
      [R.x0, H, R.z0 + 0.04],
      [R.x1, 0.045, R.z0 + 0.04],
      [R.x0, H - t, R.z1 - 0.04],
      [R.x1, -t + 0.045, R.z1 - 0.04],
      [R.x0, H, R.z1 - 0.04],
      [R.x1, 0.045, R.z1 - 0.04],
    ]);
    // toe plate at the foot
    rb.hexa([
      [R.x1, 0, R.z0 + 0.04],
      [R.x1 + 0.35, 0, R.z0 + 0.04],
      [R.x1, 0.045, R.z0 + 0.04],
      [R.x1 + 0.35, 0.004, R.z0 + 0.04],
      [R.x1, 0, R.z1 - 0.04],
      [R.x1 + 0.35, 0, R.z1 - 0.04],
      [R.x1, 0.045, R.z1 - 0.04],
      [R.x1 + 0.35, 0.004, R.z1 - 0.04],
    ]);
    // stringers and cross joists following the slope
    {
      const xe = R.x0 + len * (1 - 0.215 / H);
      for (const z of [R.z0 + 0.02, (R.z0 + R.z1) / 2, R.z1 - 0.02]) st.beam([R.x0, H - t - 0.08, z], [xe, yAt(xe) - t - 0.08, z], 0.045, 0.15);
    }
    const nBay = 8;
    for (let k = 0; k <= nBay; k++) {
      const x = R.x0 + (len * k) / nBay - (k === 0 ? -0.06 : 0);
      const top = yAt(x) - t - 0.16;
      if (top < 0.12) continue;
      for (const z of [R.z0 + 0.06, R.z1 - 0.06]) {
        st.box(x, 0.006, z, 0.14, 0.012, 0.14);
        st.beam([x, 0.012, z], [x, top + 0.05, z], POST, POST);
      }
      st.beam([x, top, R.z0 + 0.06], [x, top, R.z1 - 0.06], 0.045, 0.08);
      if (top > 0.7) xbrace(st, [x, R.z0 + 0.06], [x, R.z1 - 0.06], 0.12, top - 0.1);
      if (k < nBay) {
        const xn = R.x0 + (len * (k + 1)) / nBay;
        const topN = yAt(xn) - t - 0.16;
        if (topN > 0.5) {
          for (const z of [R.z0 + 0.06, R.z1 - 0.06]) {
            st.beam([x, 0.12, z], [xn, topN - 0.05, z], 0.026, 0.026);
          }
        }
      }
    }
    // rails on both sides, parallel to the slope
    for (const z of [R.z0 + 0.07, R.z1 - 0.07]) rail(rl, [R.x0 + 0.05, H, z], [R.x1 - 0.05, yAt(R.x1 - 0.05), z], { spacing: KEN });
  }

  // ---- upstage stair -----------------------------------------------------------------
  stairFlight(side, STAIR.x0, H, STAIR.z0, STAIR.z1, STAIR.risers, STAIR.rise, STAIR.tread);

  col.merge(side);
  col.merge(side, MIRROR_X);

  // ---- outlet racks on casters under the stage (JATET; Theatre Workshop k_arena_05) ----
  {
    const rack = col.b('stage.rack');
    const panel = col.b('stage.rackPanel');
    for (const s of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const x = s * (4.4 + i * 0.78);
        const z = -10.6;
        rack.span(x - 0.3, x + 0.3, 0.12, 1.42, z - 0.42, z + 0.42);
        for (const cx of [-0.24, 0.24]) for (const cz of [-0.34, 0.34]) rack.tube([x + cx, 0, z + cz], [x + cx, 0.12, z + cz], 0.045, 6, { caps: true });
        // lit patch panel facing downstage
        panel.span(x - 0.24, x + 0.24, 0.5, 1.0, z + 0.42, z + 0.425);
      }
    }
    // cable trunk on the floor from the racks to the stage rear
    const cb = col.b('rig.cable');
    for (const s of [-1, 1]) cb.span(s * 4.0, s * 7.2, 0, 0.06, -11.6, -11.25);
  }

  return col;
}

/**
 * Straight stair flight descending toward +x from (x0, yTop) between z0 and z1:
 * two stringers, steel treads and a rail on each side.
 */
export function stairFlight(col, x0, yTop, z0, z1, risers, rise, tread) {
  const st = col.b('stage.steel');
  const rl = col.b('stage.rail');
  const run = (risers - 1) * tread;
  for (let i = 1; i < risers; i++) {
    const y = yTop - i * rise;
    const x = x0 + (i - 1) * tread;
    st.span(x, x + tread + 0.02, y - 0.035, y, z0 + 0.04, z1 - 0.04);
  }
  // stringers under the nosing line, stopped just above the floor
  const slope = rise / tread;
  const yS0 = yTop - rise - 0.16; // centre line of the stringer at x0
  const xEnd = x0 + Math.min(run, (yS0 - 0.15) / slope);
  for (const z of [z0 + 0.02, z1 - 0.02]) {
    st.beam([x0, yS0, z], [xEnd, yS0 - (xEnd - x0) * slope, z], 0.04, 0.22);
    st.box(xEnd + 0.05, 0.02, z, 0.36, 0.04, 0.08);
    st.beam([xEnd, 0.04, z], [xEnd, yS0 - (xEnd - x0) * slope, z], 0.04, 0.04);
    rail(rl, [x0 + 0.04, yTop, z], [x0 + run, yTop - (risers - 1) * rise, z], { spacing: 1.2 });
  }
}

/**
 * The skirt as it hangs when no show is loaded: gathered and tied up in a bundle at every
 * second post of the front row (official LEVEL 1 seat-view photograph).
 */
export function buildTiedSkirt(col) {
  const b = col.b('stage.skirt');
  const { hanOuter: XO, h: H } = STAGE;
  for (let x = -XO + KEN; x < XO - 0.5; x += 2 * KEN) {
    // a soft lump: three stacked blocks hanging from the fascia on a tie
    b.box(x, H - 0.42, 0.045, 0.1, 0.44, 0.03);
    b.box(x, H - 0.78, 0.06, 0.34, 0.34, 0.12, 0.2);
    b.box(x + 0.02, H - 1.02, 0.07, 0.42, 0.3, 0.15, -0.15);
    b.box(x - 0.02, H - 1.24, 0.06, 0.3, 0.22, 0.12, 0.1);
  }
  return col;
}

/** Pleated black skirt along the front edge and round both hanamichi ends (show state). */
export function buildSkirt(col) {
  const b = col.b('stage.skirt');
  const { hanOuter: XO, hanDepth: HD, h: H } = STAGE;
  const top = H - 0.2;
  const pitch = 0.16;
  const depth = 0.045;
  const run = (ax, az, bx, bz) => {
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(2, Math.round(len / pitch) * 2);
    const ux = (bx - ax) / len;
    const uz = (bz - az) / len;
    const nx = uz;
    const nz = -ux; // to the right of travel
    let prev = null;
    for (let i = 0; i <= n; i++) {
      const t = (len * i) / n;
      const o = i % 2 === 0 ? 0 : depth;
      const p = [ax + ux * t + nx * o, az + uz * t + nz * o];
      if (prev) b.quad2([prev[0], 0.01, prev[1]], [p[0], 0.01, p[1]], [p[0], top, p[1]], [prev[0], top, prev[1]]);
      prev = p;
    }
  };
  const e = 0.035;
  run(XO + e, -HD, XO + e, e); // house-right end
  run(XO + e, e, -XO - e, e); // front
  run(-XO - e, e, -XO - e, -HD); // house-left end
  return col;
}

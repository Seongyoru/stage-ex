// Acoustic curtains: wine-coloured pleated velour behind the three lower galleries and at
// arena level behind / beside the stage, with the continuous cove LED at the head of every
// band. Two states are built: drawn (default, real pleat geometry) and tied back into one
// bunch per 4.5 m bay, which exposes the reflective olive wall.
//
// The light of the cove on the fabric is baked into a second, additive mesh that shares the
// pleat geometry ("glow"): brightest at the head, fading down, stronger on the ridges. Its
// colour is one material colour, so update() can change the cove colour in show mode.
import { Mesher, rng } from './builder.js';
import { FRAME_R, FRAME_L, FRAME_B, REAR_LEN, MITRE, LEVEL_Y, CURTAIN_D, BAY, soffitY, curtainBands } from './layout.js';

const SIDES = [FRAME_R, FRAME_L];

/** All valleys of the pleats lie in this plane; the ridges stand 50-100 mm in front of it. */
const DV = CURTAIN_D - 0.04;

/** Pleat columns between sA and sB: { s, d, ns, nd, ridge } (ridge 1 = toward the hall, 0 = valley). */
function pleatColumns(sA, sB, seed, period, perPleat) {
  const rand = rng(seed);
  const cols = [{ s: sA, d: DV, ns: 0, nd: 1, ridge: 0 }];
  let s = sA;
  while (s < sB - 1e-6) {
    let w = period * (0.75 + 0.5 * rand());
    if (sB - (s + w) < period * 0.6) w = sB - s;
    const amp = 0.05 + 0.05 * rand();
    for (let k = 1; k <= perPleat; k++) {
      const ph = k / perPleat;
      const ridge = (1 - Math.cos(ph * 2 * Math.PI)) / 2;
      const slope = (amp / 2) * Math.sin(ph * 2 * Math.PI) * ((2 * Math.PI) / w);
      const l = Math.hypot(slope, 1);
      cols.push({ s: s + w * ph, d: DV + amp * ridge, ns: -slope / l, nd: 1 / l, ridge });
    }
    s += w;
  }
  return cols;
}

/** Drawn curtain between y0 and y1 on the given columns: base sheet and glow sheet. */
function drawnCurtain(base, glow, cols, y0, y1) {
  const h = y1 - y0;
  // glow rows from the head down: [distance below the head, intensity]
  const rows = [
    [0, 1.0],
    [Math.min(1.1, h * 0.22), 0.5],
    [Math.min(2.7, h * 0.55), 0.22],
    [h, 0.08],
  ];
  const off = 0.014; // the glow sheet floats 14 mm in front of the fabric
  for (let i = 0; i + 1 < cols.length; i++) {
    const a = cols[i];
    const b = cols[i + 1];
    const na = [a.ns, 0, a.nd];
    const nb = [b.ns, 0, b.nd];
    const ca = 0.34 + 0.36 * a.ridge; // velour: dark in the folds
    const cb = 0.34 + 0.36 * b.ridge;
    const a0 = [a.s, y0, a.d];
    const a1 = [a.s, y1, a.d];
    const b0 = [b.s, y0, b.d];
    const b1 = [b.s, y1, b.d];
    // darker toward the hem: the cove light at the head is the only light the velour sees
    const hem = 0.55;
    base.triNC(a0, b0, b1, na, nb, nb, ca * hem, cb * hem, cb, [a.s, y0], [b.s, y0], [b.s, y1]);
    base.triNC(a0, b1, a1, na, nb, na, ca * hem, cb, ca, [a.s, y0], [b.s, y1], [a.s, y1]);
    if (!glow) continue;
    const ga = 0.35 + 0.65 * a.ridge;
    const gb = 0.35 + 0.65 * b.ridge;
    for (let r = 0; r + 1 < rows.length; r++) {
      const yt = y1 - rows[r][0];
      const yb = y1 - rows[r + 1][0];
      const it = rows[r][1];
      const ib = rows[r + 1][1];
      const pa0 = [a.s, yb, a.d + off];
      const pa1 = [a.s, yt, a.d + off];
      const pb0 = [b.s, yb, b.d + off];
      const pb1 = [b.s, yt, b.d + off];
      glow.triNC(pa0, pb0, pb1, na, nb, nb, ga * ib, gb * ib, gb * it, [a.s, yb], [b.s, yb], [b.s, yt]);
      glow.triNC(pa0, pb1, pa1, na, nb, na, ga * ib, gb * it, ga * it, [a.s, yb], [b.s, yt], [a.s, yt]);
    }
  }
}

/** One curtain tied back at a bay line: full width at the head, gathered at the tie, tail to the floor. */
function tiedBunch(m, sj, y0, y1, dir, rand) {
  const h = y1 - y0;
  const n = 8; // columns across the fabric
  const tieY = y0 + Math.min(2.0, h * 0.33);
  // rows: [y, centre offset along the wall, half width, depth of the folds]
  const rows = [
    [y1, 0, 0.62, 0.05],
    [y1 - h * 0.3, 0.1 * dir, 0.5, 0.07],
    [tieY + 0.25, 0.42 * dir, 0.2, 0.09],
    [tieY, 0.5 * dir, 0.13, 0.09],
    [tieY - 0.3, 0.46 * dir, 0.2, 0.09],
    [y0, 0.38 * dir + (rand() - 0.5) * 0.08, 0.27, 0.08],
  ];
  const pt = (r, j) => {
    const [y, c, w, f] = rows[r];
    const t = j / (n - 1);
    return [sj + c + w * (2 * t - 1), y, CURTAIN_D - 0.05 + (j % 2 ? f : -f * 0.4) + 0.05 * Math.sin(t * Math.PI)];
  };
  for (let r = 0; r + 1 < rows.length; r++) {
    for (let j = 0; j + 1 < n; j++) {
      const a = pt(r, j);
      const b = pt(r, j + 1);
      const c = pt(r + 1, j + 1);
      const d = pt(r + 1, j);
      const ca = j % 2 ? 0.9 : 0.45;
      const cb = j % 2 ? 0.45 : 0.9;
      m.triColToward(a, b, c, [0, 0, 1], ca, cb, cb);
      m.triColToward(a, c, d, [0, 0, 1], ca, cb, ca);
    }
  }
}

/** Flat additive wash of the cove on the exposed wall (tied-back state). */
function wallWash(m, sA, sB, y0, y1, k0, k1) {
  const h = y1 - y0;
  const d = 0.062;
  const rows = [
    [0, 1.0],
    [Math.min(1.1, h * 0.22), 0.5],
    [Math.min(2.7, h * 0.55), 0.2],
    [h, 0.06],
  ];
  const a = sA + k0 * d;
  const b = sB + k1 * d;
  for (let r = 0; r + 1 < rows.length; r++) {
    const yt = y1 - rows[r][0];
    const yb = y1 - rows[r + 1][0];
    const it = rows[r][1];
    const ib = rows[r + 1][1];
    m.triColToward([a, yb, d], [b, yb, d], [b, yt, d], [0, 0, 1], ib, ib, it);
    m.triColToward([a, yb, d], [b, yt, d], [a, yt, d], [0, 0, 1], ib, it, it);
  }
}

export function buildCurtains(B, { ends, low }) {
  const period = low ? 0.5 : 0.28; // real folds are 0.16-0.22 m; finer ones are left to the normal map
  const perPleat = low ? 2 : 4;
  let seed = 11;
  for (const band of curtainBands(ends)) {
    const { level, y0, y1 } = band;
    const Lg = LEVEL_Y[band.under]; // the gallery the band hangs from
    const ySoffit = soffitY(Lg);
    const runs = [
      { side: true, frames: SIDES, sA: MITRE * DV, sB: band.sideEnd, s0: 0, s1: band.sideEnd, k0: MITRE, k1: 0 },
      { side: false, frames: [FRAME_B], sA: MITRE * DV, sB: REAR_LEN - MITRE * DV, s0: 0, s1: REAR_LEN, k0: MITRE, k1: -MITRE },
    ];
    for (const run of runs) {
      // drawn state
      const base = new Mesher();
      const glow = new Mesher();
      drawnCurtain(base, glow, pleatColumns(run.sA, run.sB, seed++, period, perPleat), y0, y1);
      if (run.side) {
        // return of the last fold to the wall at the audience-side end
        const c = 0.3;
        base.triNC([run.sB, y0, DV], [run.sB, y0, 0.05], [run.sB, y1, 0.05], [1, 0, 0], [1, 0, 0], [1, 0, 0], c * 0.55, c * 0.55, c, [DV, y0], [0.05, y0], [0.05, y1]);
        base.triNC([run.sB, y0, DV], [run.sB, y1, 0.05], [run.sB, y1, DV], [1, 0, 0], [1, 0, 0], [1, 0, 0], c * 0.55, c, c, [DV, y0], [0.05, y1], [DV, y1]);
      }
      B.add('hall.curtain', level, base, run.frames, 'drawn');
      B.add('hall.curtainGlow', level, glow, run.frames, 'drawn');

      // tied-back state: one bunch per bay line, tied toward the stage side of the bay
      const tied = new Mesher();
      const rand = rng(seed * 7 + 3);
      const lines = [];
      if (run.side) for (let s = BAY / 2; s < run.sB - 0.4; s += BAY) lines.push([s, -1]);
      else {
        for (let s = REAR_LEN / 2 - BAY / 2; s > 1.2; s -= BAY) lines.push([s, 1]);
        for (let s = REAR_LEN / 2 + BAY / 2; s < REAR_LEN - 1.2; s += BAY) lines.push([s, -1]);
      }
      for (const [s, dir] of lines) tiedBunch(tied, s, y0, y1, dir, rand);
      B.add('hall.curtain', level, tied, run.frames, 'tied');
      const wash = new Mesher();
      wallWash(wash, run.s0, run.s1, y0, y1, run.k0, run.k1);
      B.add('hall.wallGlow', level, wash, run.frames, 'tied');

      // curtain track under the brackets and the cove LED in front of the curtain head
      const steel = new Mesher();
      steel.run(run.s0, run.s1, 0.3, 0.66, ySoffit - 0.02, ySoffit, run.k0, run.k1);
      B.add('hall.gallerySteel', level, steel, run.frames);
      const led = new Mesher();
      led.run(run.s0, run.s1, 0.6, 0.655, ySoffit - 0.075, ySoffit - 0.02, run.k0, run.k1);
      B.add('hall.coveLed', level, led, run.frames);
    }
  }
}

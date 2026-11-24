// The giant eave of the three rear facets (coved soffit, rounded lip, white rim with gutter,
// recessed band above the leaning wall) and the 24 fair-faced concrete columns.
import {
  FACETS,
  COLUMNS,
  Y3,
  S_COL,
  S_TOP,
  S_JUNC,
  S_NOSE,
  S_SKIRT,
  Y_JUNC,
  Y_LEAN_TOP,
  WALL_T,
  DIAG_LEN,
  FACADE,
  roofY,
  soffitY,
  sweep,
  obox,
  frame,
  lerp,
  add,
  mul,
} from './common.js';

const COVE_N = 14;
const RIM_END = 7.2; // along a side facet: the raised roof starts this far from the flank plane
const NOSE_N = 6;
const COLUMN_TOP = FACADE.columns.topElevation_m; // 37.27 (hidden above the soffit)
const HALF = FACADE.columns.section_m / 2; // 0.6

/** Section of the soffit from the junction out to the top of the rounded lip. */
function soffitProfile() {
  const prof = [];
  for (let i = 0; i <= COVE_N; i++) {
    const s = lerp(S_JUNC, S_NOSE, i / COVE_N);
    prof.push({ s, y: (L) => soffitY(s, L) });
  }
  for (let i = 1; i <= NOSE_N; i++) {
    const a = -Math.PI / 2 - (Math.PI * i) / NOSE_N;
    prof.push({ s: S_NOSE + Math.cos(a) * S_NOSE, y: (L) => L - S_NOSE + Math.sin(a) * S_NOSE });
  }
  return prof;
}

/** f-range of a facet outside the 0.4 m flank fin that closes its end. */
function fRange(fc) {
  const k = WALL_T / DIAG_LEN;
  return fc.sg === 1 ? [k, 1] : fc.sg === -1 ? [0, 1 - k] : [0, 1];
}

/** Column centres of a facet as distances a along it (sorted). */
export function columnsOf(fc) {
  const out = [];
  for (const [x, z] of COLUMNS) {
    const dx = x - fc.P0[0];
    const dz = z - fc.P0[1];
    const s = -(dx * fc.N[0] + dz * fc.N[1]);
    const a = dx * fc.E[0] + dz * fc.E[1];
    if (Math.abs(s - S_COL) < 0.7 && a > -0.5 && a < fc.length + 0.5) {
      // the two hip columns belong to the centre facet
      const onHip = Math.abs(z - 94.76) < 0.01;
      if (fc.key !== 'C' && onHip) continue;
      out.push(a);
    }
  }
  return out.sort((p, q) => p - q);
}

function eaveShell(col, detail) {
  const soffit = col.geo('facade.eaveSoffit', { part: 'eave soffit' });
  const rim = col.geo('roof.eaveRim', { part: 'eave rim' });
  const gutter = col.geo('roof.perimeterBand', { part: 'eave gutter' });
  const dark = col.geo('facade.recessDark', { part: 'recess' });
  const ledge = col.geo('facade.ribbedWhite', { part: 'wall-top ledge' });
  const joint = col.geo('facade.eaveJoint', { part: 'soffit joints' });
  const wash = col.geo('facade.eaveWashGlow', { part: 'eave wash' });
  const prof = soffitProfile();
  const washI = (s) => {
    const k = 0.2 + 0.8 * Math.pow(Math.min(Math.max((s - S_NOSE) / 7.5, 0), 1), 0.8);
    return [k, k, k];
  };
  for (const fc of FACETS) {
    const [f0, f1] = fRange(fc);
    sweep(soffit, fc, prof, { f0, f1, smooth: true });
    sweep(wash, fc, prof.slice(0, COVE_N + 1), { f0, f1, colorOf: washI, lift: 0.03 });
    sweep(
      rim,
      fc,
      [
        { s: S_NOSE, y: (L) => L },
        { s: 3.0, y: (L) => L },
      ],
      { f0, f1 },
    );
    sweep(
      gutter,
      fc,
      [
        { s: 3.0, y: (L) => L },
        { s: 3.0, y: (L) => L - 0.35 },
        { s: 4.3, y: (L) => L - 0.35 },
        { s: 4.3, y: (L) => L },
      ],
      { f0, f1 },
    );
    sweep(
      rim,
      fc,
      [
        { s: 4.3, y: (L) => L },
        { s: S_SKIRT, y: (L) => L },
      ],
      { f0, f1 },
    );
    // top of the leaning wall: white ledge, then the dark recessed band up to the soffit
    sweep(
      ledge,
      fc,
      [
        { s: S_TOP, y: Y_LEAN_TOP },
        { s: S_JUNC, y: Y_LEAN_TOP },
      ],
      { f0, f1 },
    );
    sweep(
      dark,
      fc,
      [
        { s: S_JUNC, y: Y_LEAN_TOP },
        { s: S_JUNC, y: Y_JUNC },
      ],
      { f0, f1 },
    );
    // undersides (seen from inside the building)
    sweep(
      col.geo('roof.underside', { part: 'eave cavity closure' }),
      fc,
      [
        { s: S_JUNC + 0.02, y: Y_LEAN_TOP - 0.01 },
        { s: S_TOP + 0.3, y: Y_LEAN_TOP - 0.01 },
      ],
      { f0, f1 },
    );
    // inner closure of the eave cavity: from the junction up to the underside of the roof lid
    const lining = col.geo('roof.underside', { part: 'eave cavity closure' });
    // (beside the flank the raised roof has not started yet: there the wall stops under the rim)
    const sC = S_JUNC + 0.02;
    const span = fc.a1(sC) - fc.a0(sC);
    const fStep = fc.sg === 1 ? (RIM_END - fc.a0(sC)) / span : fc.sg === -1 ? 1 - RIM_END / span : null;
    const pieces = fStep === null ? [[f0, f1, true]] : fc.sg === 1 ? [[f0, fStep, false], [fStep, f1, true]] : [[f0, fStep, true], [fStep, f1, false]];
    for (const [fs0, fs1, underRoof] of pieces) {
      const NSEG = underRoof ? 6 : 1;
      for (let j = 0; j < NSEG; j++) {
        const fa = lerp(fs0, fs1, j / NSEG);
        const fb = lerp(fs0, fs1, (j + 1) / NSEG);
        const a0 = fc.pt(fa, sC, Y_LEAN_TOP - 0.01);
        const b0 = fc.pt(fb, sC, Y_LEAN_TOP - 0.01);
        const a1 = [a0[0], underRoof ? roofY(a0[0], a0[2]) - 0.3 : fc.lip(fa) - 0.5, a0[2]];
        const b1 = [b0[0], underRoof ? roofY(b0[0], b0[2]) - 0.3 : fc.lip(fb) - 0.5, b0[2]];
        const n = [fc.N[0], 0, fc.N[1]];
        lining.quad(a0, b0, b1, a1, n);
        lining.quad(a0, b0, b1, a1, mul(n, -1));
      }
    }
    if (!detail) continue;
    // longitudinal soffit joints
    for (const s of [2.3, 4.5, 6.7, 8.9, 10.5])
      sweep(
        joint,
        fc,
        [
          { s: s + 0.018, y: (L) => soffitY(s + 0.018, L) },
          { s: s - 0.018, y: (L) => soffitY(s - 0.018, L) },
        ],
        { f0, f1, lift: 0.012 },
      );
    // radial joints: four strips per column bay
    const cols = columnsOf(fc);
    const pitch = (cols[1] - cols[0]) / 4;
    const first = cols[0] - Math.floor(cols[0] / pitch) * pitch;
    for (let a = first; a < fc.length; a += pitch) radialJoint(joint, fc, a, prof.slice(0, COVE_N + 1));
    // joints along the hips (creases between the facets)
    const cove = prof.slice(0, COVE_N + 1);
    if (fc.key !== 'L') sweep(joint, { ...fc, a0: (s) => fc.a1(s) - 0.03, a1: fc.a1, lip: () => fc.lip(1), pt: fc.pt }, cove, { lift: 0.012 });
    if (fc.key !== 'R') sweep(joint, { ...fc, a0: fc.a0, a1: (s) => fc.a0(s) + 0.03, lip: () => fc.lip(0), pt: fc.pt }, cove, { lift: 0.012 });
  }
}

/** Thin dark line across the soffit at distance a along the facet, clipped at the hips. */
function radialJoint(geo, fc, a, prof) {
  const w = 0.016;
  const E3 = [fc.E[0], 0, fc.E[1]];
  const at = (p) => {
    const a0 = fc.a0(p.s);
    const a1 = fc.a1(p.s);
    if (a < a0 + 0.05 || a > a1 - 0.05) return null;
    const L = fc.lip((a - a0) / (a1 - a0));
    return fc.pa(a, p.s, p.y(L));
  };
  for (let i = 0; i < prof.length - 1; i++) {
    const A = at(prof[i]);
    const B = at(prof[i + 1]);
    if (!A || !B) continue;
    // surface normal of the soffit segment (down and outward)
    const ds = prof[i + 1].s - prof[i].s;
    const dy = B[1] - A[1];
    const l = Math.hypot(ds, dy) || 1;
    const n = [(fc.N[0] * dy) / l, ds / l, (fc.N[1] * dy) / l];
    const o = mul(n, 0.012);
    geo.quad(add(add(A, mul(E3, -w)), o), add(add(A, mul(E3, w)), o), add(add(B, mul(E3, w)), o), add(add(B, mul(E3, -w)), o), n);
  }
}

function columns(col, detail) {
  const conc = col.geo('facade.columnConcrete', { part: 'columns' });
  const line = col.geo('facade.columnJoint', { part: 'column formwork joints' });
  const lamp = col.geo('facade.floodlight', { part: 'floodlights' });
  const lens = col.geo('facade.floodlightLens', { part: 'floodlight lenses' });
  const glow = col.geo('facade.columnWashGlow', { part: 'column wash' });
  for (const fc of FACETS) {
    const E3 = [fc.E[0], 0, fc.E[1]];
    const N3 = [fc.N[0], 0, fc.N[1]];
    for (const a of columnsOf(fc)) {
      const p = fc.pa(a, S_COL, 0);
      const F = frame(p, E3, N3);
      obox(conc, F, -HALF, HALF, 0, COLUMN_TOP, -HALF, HALF, 'u');
      // plinth with a shadow reveal at the deck
      obox(conc, F, -HALF - 0.05, HALF + 0.05, Y3, Y3 + 0.5, -HALF - 0.05, HALF + 0.05, 'u');
      obox(line, F, -HALF - 0.004, HALF + 0.004, Y3 + 0.5, Y3 + 0.53, -HALF - 0.004, HALF + 0.004, 'tu');
      if (detail) for (let y = Y3 + 0.5 + 1.8; y < 34; y += 1.8) obox(line, F, -HALF - 0.004, HALF + 0.004, y - 0.008, y + 0.008, -HALF - 0.004, HALF + 0.004, 'tu');
      // narrow up-lights at the column head (four sides) and their night wash on the shaft
      const yLamp = 30.9;
      for (const [du, dn] of [
        [0, 1],
        [0, -1],
      ]) {
        const d0 = dn > 0 ? HALF : -HALF - 0.18;
        obox(lamp, F, du - 0.16, du + 0.16, yLamp, yLamp + 0.14, d0, d0 + 0.18);
        obox(lens, F, du - 0.12, du + 0.12, yLamp + 0.14, yLamp + 0.155, d0 + 0.03, d0 + 0.15, 'u');
      }
      const c = (u, y, d) => [p[0] + E3[0] * u + N3[0] * d, y, p[2] + E3[2] * u + N3[2] * d];
      const lv = [
        [Y3 + 0.5, 0.55],
        [13.5, 0.2],
        [26, 0.3],
        [COLUMN_TOP - 2.5, 1.0],
      ];
      const e = HALF + 0.05;
      const faces = [
        [[-HALF, e], [HALF, e], N3],
        [[HALF, -e], [-HALF, -e], mul(N3, -1)],
        [[e, HALF], [e, -HALF], E3],
        [[-e, -HALF], [-e, HALF], mul(E3, -1)],
      ];
      for (const [q0, q1, n] of faces)
        for (let i = 0; i < lv.length - 1; i++) {
          const [y0, k0] = lv[i];
          const [y1, k1] = lv[i + 1];
          glow.quad(c(q0[0], y0, q0[1]), c(q1[0], y0, q1[1]), c(q1[0], y1, q1[1]), c(q0[0], y1, q0[1]), n, {
            col: [
              [k0, k0, k0],
              [k0, k0, k0],
              [k1, k1, k1],
              [k1, k1, k1],
            ],
          });
        }
    }
    // floodlights on the wall-top ledge, two per column bay
    if (!detail) continue;
    const cols = columnsOf(fc);
    const F = fc.frame(S_JUNC - 0.4);
    for (let i = 0; i < cols.length - 1; i++)
      for (const k of [0.3, 0.7]) {
        const a = lerp(cols[i], cols[i + 1], k);
        if (a < fc.a0(S_JUNC) + 1 || a > fc.a1(S_JUNC) - 1) continue;
        obox(lamp, F, a - 0.22, a + 0.22, Y_LEAN_TOP, Y_LEAN_TOP + 0.3, -0.16, 0.16);
        obox(lens, F, a - 0.17, a + 0.17, Y_LEAN_TOP + 0.3, Y_LEAN_TOP + 0.315, -0.11, 0.11, 'u');
      }
  }
}

export function buildEave(col, { detail = true } = {}) {
  eaveShell(col, detail);
  columns(col, detail);
}

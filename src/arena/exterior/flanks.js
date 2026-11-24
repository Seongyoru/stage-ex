// Flank walls, the rounded stage-end corners, the stage-end wall with its notch, the dark
// base (plinth + louvre band), the recessed opening with two service galleries, truck doors,
// and the ribbed wedge / pointed fin where the flank closes the end of the rear facet section.
import {
  T_FLANK,
  DFX,
  DFZ,
  SC,
  Z,
  Y5,
  Y6,
  Y7,
  Y8,
  WALL_T,
  PLINTH_TOP,
  BAND_TOP,
  PANEL_W,
  PARAPET,
  parapetY,
  CORNER_R,
  S_WALL,
  S_BAY,
  S_TOP,
  S_JUNC,
  S_NOSE,
  Y_JUNC,
  Y_BAY0,
  Y_LEAN_TOP,
  LIP_T,
  soffitY,
  flankFrame,
  stageFrame,
  frame,
  fpt,
  slab,
  rect,
  obox,
  strip,
  bar,
  norm,
  lerp,
} from './common.js';

const FLOOR_JOINTS = [Y5, Y6, Y7, Y8]; // horizontal panel joints sit on the floor levels
const S_DIAG = 48.7; // the panel / ribbed-siding diagonal leaves the base this far from the tip
const PLINTH_IN = 0.3; // recess of the ground storeys behind the panel face
const BAND_IN = 0.42; // recess of the louvre band
const JOINT_W = 0.035;
const BASE_BAND = [5.95, PLINTH_TOP - 0.07]; // white band under the louvres
const WEDGE_TOP = 29.2;

// rounded corner between the stage end and a flank
const PHI = Math.acos(-DFX); // interior angle at the corner (123.6°)
export const TC = CORNER_R / Math.tan(PHI / 2); // tangent length 1.61 m
const ARC0 = -Math.PI / 2;
const ARC1 = Math.atan2(-DFX, DFZ); // direction of the flank outward normal (−33.6°)
const ARC_N = 6;

// recessed opening with the two service galleries (see report: 4 panels wide, 9 panels from the corner)
const OPEN_T0 = TC + 9 * PANEL_W;
const OPEN_T1 = OPEN_T0 + 4 * PANEL_W;
const OPEN_Y0 = 14.2;
const OPEN_Y1 = 26.3;
const OPEN_DEPTH = 2.6;
const GALLERY_Y = [Y6 + 0.01, Y7 + 0.01]; // gallery floors on LEVEL 6 and LEVEL 7

const NOTCH_HALF = 7.05 / 2; // PLATEAU: 7.05 m wide at the roof edge
const NOTCH_LEAN = 0.7; // the notch edges lean: wider at the bottom
const NOTCH_DEPTH = 7.86;

/** Bottom edge of the white panel wall at distance s from the eave tip (flank elevation). */
function panelBottom(s, lipTop) {
  if (s >= S_DIAG) return BAND_TOP;
  if (s >= S_JUNC) return lerp(Y_JUNC, BAND_TOP, (s - S_JUNC) / (S_DIAG - S_JUNC));
  return soffitY(Math.max(s, S_NOSE), lipTop);
}

function flank(col, sg, detail) {
  const F = flankFrame(sg);
  const T = T_FLANK;
  const lipTop = PARAPET[sg][1];
  const white = col.geo('facade.panelWhite', { part: 'flank panels' });
  const joint = col.geo('facade.panelJoint', { part: 'panel joints' });

  // --- white panel wall, one polygon from the corner tangent to the pointed eave prow ----------
  const poly = [
    [TC, BAND_TOP],
    [T - S_DIAG, BAND_TOP],
    [T - S_JUNC, Y_JUNC],
  ];
  const COVE_N = 12;
  for (let i = 1; i <= COVE_N; i++) {
    const s = lerp(S_JUNC, S_NOSE, i / COVE_N);
    poly.push([T - s, soffitY(s, lipTop)]);
  }
  for (let i = 1; i <= 6; i++) {
    const a = -Math.PI / 2 - (Math.PI * i) / 6; // bottom → tip → top of the rounded lip
    poly.push([T - S_NOSE - Math.cos(a) * S_NOSE, lipTop - S_NOSE + Math.sin(a) * S_NOSE]);
  }
  poly.push([TC, parapetY(sg, TC)]);
  const opening = rect(OPEN_T0, OPEN_Y0, OPEN_T1, OPEN_Y1);
  slab(white, F, poly, { holes: [opening], t: WALL_T });

  // aluminium coping on the parapet
  const cap = col.geo('roof.parapetCap', { part: 'parapet cap' });
  bar(cap, fpt(F, TC, parapetY(sg, TC) + 0.03, -WALL_T / 2), fpt(F, T - 1.2, parapetY(sg, T - 1.2) + 0.03, -WALL_T / 2), WALL_T + 0.12, 0.06);

  // --- panel joints: 2.85 m module, horizontal joints on the floor levels ---------------------------
  if (detail) {
    for (let t = TC; t < T - S_NOSE - 0.3; t += PANEL_W) {
      const yb = panelBottom(T - t, lipTop) + 0.02;
      const yt = parapetY(sg, t);
      if (yt - yb < 0.3) continue;
      if (t > OPEN_T0 - 0.01 && t < OPEN_T1 + 0.01) {
        strip(joint, F, [t, yb], [t, OPEN_Y0], JOINT_W);
        strip(joint, F, [t, OPEN_Y1], [t, yt], JOINT_W);
      } else strip(joint, F, [t, yb], [t, yt], JOINT_W);
    }
    for (const y of FLOOR_JOINTS) {
      const sEnd = S_DIAG - ((y - BAND_TOP) * (S_DIAG - S_JUNC)) / (Y_JUNC - BAND_TOP);
      const uEnd = T - sEnd - 0.05;
      if (y > OPEN_Y0 && y < OPEN_Y1) {
        strip(joint, F, [TC, y], [OPEN_T0, y], JOINT_W);
        strip(joint, F, [OPEN_T1, y], [uEnd, y], JOINT_W);
      } else strip(joint, F, [TC, y], [uEnd, y], JOINT_W);
    }
  }

  // --- ribbed wedge under the diagonal + end cheek of the leaning rear wall ---------------------------
  const ribbed = col.geo('facade.ribbedWhite', { part: 'ribbed wedge' });
  // the wedge stops at +29.2; the triangle between its top and the fin above is a dark, deep
  // recess (in reality open air under the soffit, see photo B6)
  const sLean = S_BAY - ((S_BAY - S_TOP) * (WEDGE_TOP - Y6)) / (Y_LEAN_TOP - Y6);
  const sDiag = S_DIAG - ((WEDGE_TOP - BAND_TOP) * (S_DIAG - S_JUNC)) / (Y_JUNC - BAND_TOP);
  const wedge = [
    [S_DIAG, BAND_TOP],
    [S_WALL, BAND_TOP],
    [S_WALL, Y_BAY0],
    [S_BAY, Y_BAY0],
    [S_BAY, Y6],
    [sLean, WEDGE_TOP],
    [sDiag, WEDGE_TOP],
  ].map(([s, y]) => [T - s, y]);
  slab(ribbed, F, wedge, { t: WALL_T, off: -0.12 });
  const gap = [
    [sDiag, WEDGE_TOP],
    [sLean, WEDGE_TOP],
    [S_TOP, Y_LEAN_TOP],
    [S_JUNC, Y_LEAN_TOP],
    [S_JUNC, Y_JUNC],
  ].map(([s, y]) => [T - s, y]);
  slab(col.geo('facade.recessDark', { part: 'recess' }), F, gap, { t: 0.3, off: -0.5, edge: false });
  obox(ribbed, F, T - sDiag, T - sLean, WEDGE_TOP - 0.02, WEDGE_TOP, -0.55, -0.12, 'u');
  const slot = col.geo('facade.stripWindow', { part: 'wedge slots' });
  for (const [s, y, w] of [
    [21.4, 20.6, 1.3],
    [21.4, 14.9, 1.3],
    [31.0, 13.4, 1.0],
  ]) obox(slot, F, T - s - w, T - s, y, y + 0.28, -0.2, -0.105);

  // --- recessed opening with two open service galleries -------------------------------------------------
  const dark = col.geo('facade.recessDark', { part: 'recess' });
  const c = (u, v, d) => fpt(F, u, v, d);
  const D0 = -WALL_T;
  const D1 = -OPEN_DEPTH;
  const both = (a, b, d, e, n) => {
    dark.quad(a, b, d, e, n);
    dark.quad(a, b, d, e, n.map((x) => -x));
  };
  both(c(OPEN_T0, OPEN_Y0, D1), c(OPEN_T1, OPEN_Y0, D1), c(OPEN_T1, OPEN_Y1, D1), c(OPEN_T0, OPEN_Y1, D1), F.N);
  both(c(OPEN_T0, OPEN_Y0, D1), c(OPEN_T0, OPEN_Y0, D0), c(OPEN_T0, OPEN_Y1, D0), c(OPEN_T0, OPEN_Y1, D1), F.U);
  both(c(OPEN_T1, OPEN_Y0, D1), c(OPEN_T1, OPEN_Y0, D0), c(OPEN_T1, OPEN_Y1, D0), c(OPEN_T1, OPEN_Y1, D1), F.U);
  both(c(OPEN_T0, OPEN_Y0, D1), c(OPEN_T1, OPEN_Y0, D1), c(OPEN_T1, OPEN_Y0, D0), c(OPEN_T0, OPEN_Y0, D0), [0, 1, 0]);
  both(c(OPEN_T0, OPEN_Y1, D1), c(OPEN_T1, OPEN_Y1, D1), c(OPEN_T1, OPEN_Y1, D0), c(OPEN_T0, OPEN_Y1, D0), [0, 1, 0]);
  const gslab = col.geo('facade.gallerySlab', { part: 'service galleries' });
  const rail = col.geo('facade.galleryRail', { part: 'gallery rails' });
  for (const gy of GALLERY_Y) {
    obox(gslab, F, OPEN_T0, OPEN_T1, gy - 0.5, gy, D1, -0.22);
    const yb = gy + 0.12;
    const yt = gy + 1.2;
    const dR = -0.3;
    bar(rail, c(OPEN_T0, yt, dR), c(OPEN_T1, yt, dR), 0.07, 0.07);
    bar(rail, c(OPEN_T0, yb, dR), c(OPEN_T1, yb, dR), 0.05, 0.05);
    const nV = 8;
    const w = (OPEN_T1 - OPEN_T0) / nV;
    for (let i = 0; i <= nV; i++) bar(rail, c(OPEN_T0 + i * w, gy, dR), c(OPEN_T0 + i * w, yt, dR), 0.05, 0.05, F.N);
    if (detail)
      for (let i = 0; i < nV; i++) {
        const u0 = OPEN_T0 + i * w;
        bar(rail, c(u0, yt, dR), c(u0 + w / 2, yb, dR), 0.035, 0.035, F.N);
        bar(rail, c(u0 + w / 2, yb, dR), c(u0 + w, yt, dR), 0.035, 0.035, F.N);
      }
  }

  // --- base: ground storeys (blue-grey) with truck doors, louvre band under the panel volume ----------
  const t1 = T - S_WALL; // the enclosed building ends at the LEVEL 3 wall corner
  const FP = flankFrame(sg, PLINTH_IN);
  const plinth = col.geo('facade.plinth', { level: 1, part: 'plinth' });
  const doors = [
    [8.0, 13.5, 4.5],
    [46.0, 54.3, 4.5],
  ];
  slab(plinth, FP, rect(TC, 0, t1, PLINTH_TOP - 0.07), { holes: doors.map(([a, b, h]) => rect(a, 0.02, b, h)), t: WALL_T });
  obox(col.geo('facade.baseBand', { level: 1, part: 'base band' }), FP, TC, t1, BASE_BAND[0], BASE_BAND[1], 0, 0.1, 'b');
  const shutter = col.geo('facade.shutter', { level: 1, part: 'truck doors' });
  const frameG = col.geo('facade.doorFrame', { level: 1, part: 'door frames' });
  for (const [a, b, h] of doors) {
    slab(shutter, FP, rect(a, 0.02, b, h), { t: 0.05, off: -0.28, edge: false });
    obox(frameG, FP, a - 0.12, a, 0, h + 0.12, -0.3, 0.03);
    obox(frameG, FP, b, b + 0.12, 0, h + 0.12, -0.3, 0.03);
    obox(frameG, FP, a, b, h, h + 0.12, -0.3, 0.03);
  }
  for (const u of [20.5, 33.0, 62.0, 75.5, 90.0]) obox(frameG, FP, u, u + 1.0, 0.05, 2.2, 0, 0.03, 'b');

  const FB = flankFrame(sg, BAND_IN);
  const backing = col.geo('facade.louvreBacking', { level: 3, part: 'louvre band' });
  slab(backing, FB, rect(TC, PLINTH_TOP, t1, BAND_TOP), { t: 0.3, edge: false });
  const kerb = col.geo('facade.kerbConcrete', { level: 3, part: 'base ledge' });
  obox(kerb, F, TC, t1, PLINTH_TOP - 0.07, PLINTH_TOP + 0.05, -BAND_IN - 0.02, -PLINTH_IN + 0.06);
  const pier = col.geo('facade.plinth', { level: 3, part: 'band piers' });
  for (let t = TC + 3 * PANEL_W; t < t1 - 1; t += 3 * PANEL_W) obox(pier, F, t - 0.35, t + 0.35, PLINTH_TOP + 0.05, BAND_TOP, -BAND_IN, -0.08, 'b');
  obox(pier, F, t1 - 0.5, t1, PLINTH_TOP + 0.05, BAND_TOP, -BAND_IN, -0.08, 'b');
  if (detail) {
    const blade = col.geo('facade.louvre', { level: 3, part: 'louvres' });
    for (let y = PLINTH_TOP + 0.3; y < BAND_TOP - 0.1; y += 0.25) obox(blade, F, TC, t1 - 0.5, y, y + 0.045, -BAND_IN + 0.02, -0.14, 'blr');
  }
}

function corner(col, sg, detail) {
  const cx = sg * (SC[0] - TC);
  const cz = SC[1] + CORNER_R;
  const top = PARAPET[sg][0];
  const white = col.geo('facade.panelWhite', { part: 'flank panels' });
  const joint = col.geo('facade.panelJoint', { part: 'panel joints' });
  const plinth = col.geo('facade.plinth', { level: 1, part: 'plinth' });
  const backing = col.geo('facade.louvreBacking', { level: 3, part: 'louvre band' });
  const blade = col.geo('facade.louvre', { level: 3, part: 'louvres' });
  const kerb = col.geo('facade.kerbConcrete', { level: 3, part: 'base ledge' });
  const cap = col.geo('roof.parapetCap', { part: 'parapet cap' });
  const pt = (ang, r) => [cx + sg * Math.cos(ang) * r, 0, cz + Math.sin(ang) * r];
  for (let i = 0; i < ARC_N; i++) {
    const a0 = lerp(ARC0, ARC1, i / ARC_N);
    const a1 = lerp(ARC0, ARC1, (i + 1) / ARC_N);
    const am = (a0 + a1) / 2;
    const N = [sg * Math.cos(am), 0, Math.sin(am)];
    const seg = (r) => {
      const p = pt(a0, r);
      const q = pt(a1, r);
      const U = norm([q[0] - p[0], 0, q[2] - p[2]]);
      return { F: frame(p, U, N), l: Math.hypot(q[0] - p[0], q[2] - p[2]) };
    };
    const w = seg(CORNER_R);
    obox(white, w.F, 0, w.l, BAND_TOP, top, -WALL_T, 0, 'lr');
    obox(cap, w.F, -0.02, w.l + 0.02, top, top + 0.06, -WALL_T - 0.06, 0.06, 'u');
    const p = seg(CORNER_R - PLINTH_IN);
    obox(plinth, p.F, 0, p.l, 0, PLINTH_TOP - 0.07, -WALL_T, 0, 'lrtu');
    obox(col.geo('facade.baseBand', { level: 1, part: 'base band' }), p.F, 0, p.l, BASE_BAND[0], BASE_BAND[1], 0, 0.1, 'blr');
    const b = seg(CORNER_R - BAND_IN);
    obox(backing, b.F, 0, b.l, PLINTH_TOP, BAND_TOP, -0.3, 0, 'lrtu');
    obox(kerb, b.F, 0, b.l, PLINTH_TOP - 0.07, PLINTH_TOP + 0.05, -0.02, BAND_IN - PLINTH_IN + 0.06, 'lru');
    if (detail) {
      for (let y = PLINTH_TOP + 0.3; y < BAND_TOP - 0.1; y += 0.25) obox(blade, b.F, 0, b.l, y, y + 0.045, 0.02, BAND_IN - 0.14, 'blr');
      for (const y of FLOOR_JOINTS) strip(joint, w.F, [0, y], [w.l, y], JOINT_W);
    }
  }
}

function stageEnd(col, detail) {
  const F = stageFrame();
  const white = col.geo('facade.panelWhite', { part: 'stage-end panels' });
  const joint = col.geo('facade.panelJoint', { part: 'panel joints' });
  const dark = col.geo('facade.recessDark', { part: 'recess' });
  const cap = col.geo('roof.parapetCap', { part: 'parapet cap' });
  const xc = SC[0] - TC;
  const top = (x) => lerp(PARAPET[1][0], PARAPET[-1][0], (SC[0] - x) / (2 * SC[0]));
  const zf = Z.stageEndFacade;
  const zb = zf + NOTCH_DEPTH;
  for (const sg of [1, -1]) {
    const xt = sg * NOTCH_HALF;
    const xb = sg * (NOTCH_HALF + NOTCH_LEAN);
    const yt = top(xt);
    slab(
      white,
      F,
      [
        [xb, BAND_TOP],
        [sg * xc, BAND_TOP],
        [sg * xc, top(sg * xc)],
        [xt, yt],
      ],
      { t: WALL_T },
    );
    bar(cap, fpt(F, sg * xc, top(sg * xc) + 0.03, -WALL_T / 2), fpt(F, xt, yt + 0.03, -WALL_T / 2), WALL_T + 0.12, 0.06);
    if (detail) {
      for (let x = xc; x > NOTCH_HALF + NOTCH_LEAN + 0.4; x -= PANEL_W) strip(joint, F, [sg * x, BAND_TOP + 0.02], [sg * x, top(sg * x)], JOINT_W);
      for (const y of FLOOR_JOINTS) {
        const xe = NOTCH_HALF + (NOTCH_LEAN * (yt - y)) / (yt - BAND_TOP);
        strip(joint, F, [sg * xc, y], [sg * (xe + 0.03), y], JOINT_W);
      }
    }
    // leaning side wall of the notch (dark cladding), 0.4 m thick toward the block
    const h = yt - BAND_TOP;
    const V = norm([-sg * NOTCH_LEAN, h, 0]);
    const N = norm([-sg * h, -NOTCH_LEAN, 0]);
    const FN = frame([xb, BAND_TOP, zf], [0, 0, 1], N, V);
    slab(dark, FN, rect(0, 0, NOTCH_DEPTH, Math.hypot(h, NOTCH_LEAN)), { t: WALL_T });
  }
  // back wall and floor of the notch
  const ytn = top(0);
  const FBk = frame([0, 0, zb], [1, 0, 0], [0, 0, -1]);
  slab(
    dark,
    FBk,
    [
      [-(NOTCH_HALF + NOTCH_LEAN), BAND_TOP],
      [NOTCH_HALF + NOTCH_LEAN, BAND_TOP],
      [NOTCH_HALF, ytn],
      [-NOTCH_HALF, ytn],
    ],
    { t: WALL_T, edge: false },
  );
  const band = col.geo('roof.perimeterBand', { part: 'notch floor' });
  obox(band, F, -(NOTCH_HALF + NOTCH_LEAN), NOTCH_HALF + NOTCH_LEAN, BAND_TOP - 0.3, BAND_TOP, -NOTCH_DEPTH, 0);
  if (detail)
    for (const y of FLOOR_JOINTS) {
      const xe = NOTCH_HALF + (NOTCH_LEAN * (ytn - y)) / (ytn - BAND_TOP);
      strip(col.geo('facade.panelJoint', { part: 'panel joints' }), FBk, [-xe, y], [xe, y], JOINT_W);
    }

  // base: ground storeys with the stage-rear truck door, louvre band
  const FP = stageFrame(PLINTH_IN);
  const plinth = col.geo('facade.plinth', { level: 1, part: 'plinth' });
  const door = [-15.2, -9.2, 4.5];
  slab(plinth, FP, rect(-xc, 0, xc, PLINTH_TOP - 0.07), { holes: [rect(door[0], 0.02, door[1], door[2])], t: WALL_T });
  slab(col.geo('facade.shutter', { level: 1, part: 'truck doors' }), FP, rect(door[0], 0.02, door[1], door[2]), { t: 0.05, off: -0.28, edge: false });
  obox(col.geo('facade.baseBand', { level: 1, part: 'base band' }), FP, -xc, xc, BASE_BAND[0], BASE_BAND[1], 0, 0.1, 'b');
  const frameG = col.geo('facade.doorFrame', { level: 1, part: 'door frames' });
  obox(frameG, FP, door[0] - 0.12, door[0], 0, door[2] + 0.12, -0.3, 0.03);
  obox(frameG, FP, door[1], door[1] + 0.12, 0, door[2] + 0.12, -0.3, 0.03);
  obox(frameG, FP, door[0], door[1], door[2], door[2] + 0.12, -0.3, 0.03);
  for (const u of [3.0, 11.5]) obox(frameG, FP, u, u + 1.0, 0.05, 2.2, 0, 0.03, 'b');
  const FB = stageFrame(BAND_IN);
  slab(col.geo('facade.louvreBacking', { level: 3, part: 'louvre band' }), FB, rect(-xc, PLINTH_TOP, xc, BAND_TOP), { t: 0.3, edge: false });
  obox(col.geo('facade.kerbConcrete', { level: 3, part: 'base ledge' }), F, -xc, xc, PLINTH_TOP - 0.07, PLINTH_TOP + 0.05, -BAND_IN - 0.02, -PLINTH_IN + 0.06);
  const pier = col.geo('facade.plinth', { level: 3, part: 'band piers' });
  for (let x = -xc + 4.3; x < xc - 2; x += 3 * PANEL_W + 0.08) obox(pier, F, x - 0.35, x + 0.35, PLINTH_TOP + 0.05, BAND_TOP, -BAND_IN, -0.08, 'b');
  if (detail) {
    const blade = col.geo('facade.louvre', { level: 3, part: 'louvres' });
    for (let y = PLINTH_TOP + 0.3; y < BAND_TOP - 0.1; y += 0.25) obox(blade, F, -xc, xc, y, y + 0.045, -BAND_IN + 0.02, -0.14, 'blr');
  }
}

export function buildFlanks(col, { detail = true } = {}) {
  for (const sg of [1, -1]) {
    flank(col, sg, detail);
    corner(col, sg, detail);
  }
  stageEnd(col, detail);
}

export const FLANK_INFO = { TC, OPEN_T0, OPEN_T1, OPEN_Y0, OPEN_Y1, S_DIAG, NOTCH_HALF, NOTCH_DEPTH, LIP_T };

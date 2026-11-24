// Walls of the three rear facets behind the colonnade: LEVEL 3 entrance storey on the wall
// line, the projecting two-tier glazed band of the LEVEL 5 concourse with the dark walkway
// soffit under it, and the white ribbed wall leaning out to the eave with its strip windows.
import {
  FACETS,
  GLASS_BOX,
  RC,
  Y3,
  Y5,
  Y6,
  Y7,
  WALL_T,
  DIAG_LEN,
  S_WALL,
  S_BAY,
  S_TOP,
  Y_BAY0,
  Y_LEAN_TOP,
  FACADE,
  frame,
  slab,
  rect,
  obox,
  sweep,
  norm,
  lerp,
} from './common.js';
import { columnsOf } from './eave.js';
import { doorScreen } from './doors.js';

const SILL_TOP = Y5 + 0.55; // 13.22 top of the ribbed sill box of the glazed band
const HEAD = Y6 - 0.35; // 17.72 head of the glazing
const SOLID_END = 20; // the glazed band stops this far from the flank; ribbed siding beyond
const LEAN_DY = Y_LEAN_TOP - Y6; // 13.23
const LEAN_DS = S_BAY - S_TOP; // 5.6 → 22.9° from vertical
const LEAN_LEN = Math.hypot(LEAN_DY, LEAN_DS);
const WIN_Y = [24.5, 25.7]; // long strip windows of LEVEL 7 (one per column bay)
const SLOT_Y = [20.9, 21.25]; // short slots below
const ENTRANCE_A = 32.4; // North / South Entrance: distance from the shoulder along the wall line
const ENTRANCE_W = 8.8;
const ENTRANCE_H = 3.0;

/** Wall stretches: the side facets end at the flank fin, the centre facet at the glass box. */
function stretches() {
  const out = [];
  for (const fc of FACETS) {
    const mk = (a0, a1, tag) => ({ ...fc, a0, a1, tag, parent: fc, pt: fc.pt, pa: fc.pa, frame: fc.frame });
    if (fc.key === 'R') out.push(mk(() => WALL_T, fc.a1, 'R'));
    else if (fc.key === 'L') out.push(mk(fc.a0, () => DIAG_LEN - WALL_T, 'L'));
    else {
      const aBox0 = RC[0] - GLASS_BOX.halfWidth;
      const aBox1 = RC[0] + GLASS_BOX.halfWidth;
      out.push(mk(fc.a0, () => aBox0, 'C0'), mk(() => aBox1, fc.a1, 'C1'));
    }
  }
  return out;
}

/** Glazed part of the LEVEL 5 band of a stretch as [a0, a1] on the bay face. */
function glazedRange(st) {
  const lo = st.a0(S_BAY);
  const hi = st.a1(S_BAY);
  if (st.tag === 'R') return [SOLID_END, hi];
  if (st.tag === 'L') return [lo, DIAG_LEN - SOLID_END];
  return [lo, hi];
}

function wallStretch(col, st, detail, doors) {
  const lo = (s) => st.a0(s);
  const hi = (s) => st.a1(s);
  // ---- LEVEL 3 entrance storey on the wall line ------------------------------------------------
  const F3 = st.frame(S_WALL);
  const panel = col.geo('facade.deckWallPanel', { level: 3, part: 'deck-level wall' });
  const kerb = col.geo('facade.kerbConcrete', { level: 3, part: 'deck-level kerb' });
  const holes = [];
  let door = null;
  if (st.tag === 'R' || st.tag === 'L') {
    const ac = st.tag === 'R' ? ENTRANCE_A : DIAG_LEN - ENTRANCE_A;
    door = [ac - ENTRANCE_W / 2, ac + ENTRANCE_W / 2];
    holes.push(rect(door[0], Y3 + 0.001, door[1], Y3 + ENTRANCE_H));
  }
  // black-framed glazed stretches of the entrance storey
  const wins3 = [];
  if (door) wins3.push([door[0] - 8.2, door[0] - 1.4], [door[1] + 1.4, door[1] + 8.2]);
  else wins3.push([lo(S_WALL) + 3.6, hi(S_WALL) - 3.0]);
  for (const [a, b] of wins3) holes.push(rect(a, Y3 + 1.0, b, Y3 + 3.0));
  slab(panel, F3, rect(lo(S_WALL), Y3, hi(S_WALL), Y_BAY0), { holes, t: WALL_T });
  const g3 = col.geo('facade.doorGlass', { level: 3, part: 'deck-level glazing' });
  const f3 = col.geo('facade.doorFrame', { level: 3, part: 'deck-level window frames' });
  for (const [a, b] of wins3) {
    slab(g3, F3, rect(a, Y3 + 1.0, b, Y3 + 3.0), { t: 0.012, off: -0.14, edge: false });
    obox(f3, F3, a, b, Y3 + 1.0, Y3 + 1.07, -0.22, -0.06, 'lr');
    obox(f3, F3, a, b, Y3 + 2.93, Y3 + 3.0, -0.22, -0.06, 'lr');
    const n = Math.max(1, Math.round((b - a) / 1.7));
    for (let i = 0; i <= n; i++) {
      const u = lerp(a, b, i / n);
      obox(f3, F3, Math.max(a, u - 0.035), Math.min(b, u + 0.035), Y3 + 1.07, Y3 + 2.93, -0.22, -0.06, 'tu');
    }
  }
  const kerbRuns = door ? [[lo(S_WALL), door[0]], [door[1], hi(S_WALL)]] : [[lo(S_WALL), hi(S_WALL)]];
  for (const [a, b] of kerbRuns) obox(kerb, F3, a, b, Y3, Y3 + 0.6, 0, 0.05, 'b');
  if (door) doorScreen(col, F3, door[0], door[1], Y3, ENTRANCE_H, {
    doors, entrance: st.tag === 'R' ? '사우스 엔트런스' : '노스 엔트런스', bays: 4,
  });

  // under-deck storeys (LEVEL 1-2) on the same wall line: plain blue-grey base wall
  slab(col.geo('facade.plinth', { level: 1, part: 'plinth' }), F3, rect(lo(S_WALL), 0, hi(S_WALL), Y3 - 0.05), { t: WALL_T, off: -0.05 });

  // dark soffit over the deck walkway (underside of the projecting LEVEL 5 band)
  sweep(col.geo('facade.walkwaySoffit', { level: 3, part: 'walkway soffit' }), st, [
    { s: S_WALL, y: Y_BAY0 },
    { s: S_BAY, y: Y_BAY0 },
  ]);

  // ---- LEVEL 5 band: ribbed sill, two-tier glazing, head ------------------------------------------
  const F5 = st.frame(S_BAY);
  const ribbed5 = col.geo('facade.ribbedWhite', { level: 5, part: 'concourse band' });
  const a0 = lo(S_BAY);
  const a1 = hi(S_BAY);
  slab(ribbed5, F5, rect(a0, Y_BAY0, a1, SILL_TOP), { t: 0.3 });
  slab(ribbed5, F5, rect(a0, HEAD, a1, Y6), { t: 0.3 });
  const [g0, g1] = glazedRange(st);
  if (g0 > a0 + 0.01) slab(ribbed5, F5, rect(a0, SILL_TOP, g0, HEAD), { t: 0.3 });
  if (g1 < a1 - 0.01) slab(ribbed5, F5, rect(g1, SILL_TOP, a1, HEAD), { t: 0.3 });
  const glass = col.geo('facade.concourseGlass', { level: 5, part: 'concourse glazing' });
  slab(glass, F5, rect(g0, SILL_TOP, g1, HEAD), { t: 0.02, off: -0.1, edge: false });
  slab(col.geo('facade.concourseLitRed', { level: 5, part: 'concourse glow' }), F5, rect(g0, SILL_TOP, g1, HEAD), { t: 0, off: -0.7, back: false });
  const fr = col.geo('facade.concourseFrame', { level: 5, part: 'concourse frames' });
  const mid = (SILL_TOP + HEAD) / 2;
  for (const y of [SILL_TOP + 0.04, mid, HEAD - 0.04]) obox(fr, F5, g0, g1, y - 0.04, y + 0.04, -0.2, 0.03, 'b');
  const nM = Math.max(1, Math.round((g1 - g0) / 1.5));
  for (let i = 0; i <= nM; i++) {
    const a = lerp(g0, g1, i / nM);
    obox(fr, F5, a - 0.035, a + 0.035, SILL_TOP, HEAD, -0.2, detail ? 0.06 : 0.03, 'btu');
  }
  // floor and ceiling of the band, and the floor strips that close the gap to the interior slabs
  const floor5 = col.geo('facade.bayFloor', { level: 5, part: 'concourse band floor' });
  sweep(floor5, st, [
    { s: S_BAY + 0.1, y: Y5 - 0.01 },
    { s: S_WALL + 0.45, y: Y5 - 0.01 },
  ]);
  sweep(col.geo('facade.walkwaySoffit', { level: 5, part: 'concourse band ceiling' }), st, [
    { s: S_WALL + 0.45, y: HEAD },
    { s: S_BAY + 0.1, y: HEAD },
  ]);
  sweep(col.geo('facade.bayFloor', { level: 6, part: 'wall-foot floor strip' }), st, [
    { s: S_BAY + 0.35, y: Y6 - 0.01 },
    { s: S_WALL + 0.45, y: Y6 - 0.01 },
  ]);
  const sMine = S_BAY - (LEAN_DS * (Y7 - Y6)) / LEAN_DY;
  const sFact = S_WALL - (FACADE.rearWall.inclinedLeanOut_m * (Y7 - Y6)) / LEAN_DY;
  sweep(col.geo('facade.bayFloor', { level: 7, part: 'wall-foot floor strip' }), st, [
    { s: sMine + 0.4, y: Y7 - 0.01 },
    { s: sFact + 0.45, y: Y7 - 0.01 },
  ]);

  // ---- leaning ribbed wall with strip windows ----------------------------------------------------------
  const N2 = st.N;
  const base = st.frame(S_BAY, Y6);
  const V = norm([N2[0] * LEAN_DS, LEAN_DY, N2[1] * LEAN_DS]);
  const Nw = norm([N2[0] * LEAN_DY, -LEAN_DS, N2[1] * LEAN_DY]);
  const FL = frame(base.O, base.U, Nw, V);
  const vOf = (y) => ((y - Y6) / LEAN_DY) * LEAN_LEN;
  const sOf = (y) => S_BAY - (LEAN_DS * (y - Y6)) / LEAN_DY;
  const wall = [
    [lo(S_BAY), 0],
    [hi(S_BAY), 0],
    [hi(S_TOP), LEAN_LEN],
    [lo(S_TOP), LEAN_LEN],
  ];
  // bays between the columns (and the stretch ends)
  const cols = columnsOf(st.parent).filter((a) => a >= lo(S_COLLINE) - 0.05 && a <= hi(S_COLLINE) + 0.05);
  const edges = [];
  if (st.tag === 'C1' || st.tag === 'L') edges.push(lo(S_COLLINE)); // box side / hip column
  edges.push(...cols);
  if (st.tag === 'C0' || st.tag === 'R') edges.push(hi(S_COLLINE));
  const wins = [];
  const slots = [];
  for (let i = 0; i < edges.length - 1; i++) {
    const w = edges[i + 1] - edges[i];
    if (w < 4.5) continue;
    const c = (edges[i] + edges[i + 1]) / 2;
    const clip = (y, half) => {
      const s = sOf(y);
      return [Math.max(c - half, lo(s) + 0.9), Math.min(c + half, hi(s) - 0.9)];
    };
    const [wa, wb] = clip(WIN_Y[1], w * 0.4);
    if (wb - wa > 2) wins.push(rect(wa, vOf(WIN_Y[0]), wb, vOf(WIN_Y[1])));
    const [sa, sb] = clip(SLOT_Y[1], 1.75);
    if (sb - sa > 1.5 && i % 2 === (st.tag === 'L' ? 1 : 0)) slots.push(rect(sa, vOf(SLOT_Y[0]), sb, vOf(SLOT_Y[1])));
  }
  slab(col.geo('facade.ribbedWhite', { part: 'leaning wall' }), FL, wall, { holes: [...wins, ...slots], t: WALL_T });
  const pane = col.geo('facade.stripWindow', { level: 7, part: 'strip windows' });
  const lit = col.geo('facade.stripWindowLit', { level: 7, part: 'strip windows lit' });
  for (const r of [...wins, ...slots]) {
    slab(pane, FL, r, { t: 0, off: -0.16, back: false });
    slab(lit, FL, r, { t: 0, off: -0.1, back: false });
  }
  if (detail) {
    const fr7 = col.geo('facade.doorFrame', { level: 7, part: 'strip window frames' });
    for (const r of wins) {
      const n = Math.max(1, Math.round((r[1][0] - r[0][0]) / 1.6));
      for (let i = 1; i < n; i++) {
        const a = lerp(r[0][0], r[1][0], i / n);
        obox(fr7, FL, a - 0.02, a + 0.02, r[0][1], r[2][1], -0.16, -0.12, 'btu');
      }
    }
  }
}

const S_COLLINE = FACADE.eave.projection_m;

export function buildRear(col, { detail = true, doors }) {
  for (const st of stretches()) wallStretch(col, st, detail, doors);
}

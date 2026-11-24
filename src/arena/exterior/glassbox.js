// The glass box on the centre facet: curtain wall with projecting fins and spandrel bands at
// the floor levels, the Main Entrance door storey between the six columns, box roof, and the
// night glow of the lounges behind the glass.
import {
  GLASS_BOX,
  RC,
  COLUMNS,
  Y3,
  Y5,
  Y6,
  Y7,
  Y8,
  WALL_T,
  S_BAY,
  S_TOP,
  S_JUNC,
  Y_BAY0,
  Y_LEAN_TOP,
  frame,
  slab,
  rect,
  obox,
  wbox,
  lerp,
} from './common.js';
import { doorScreen } from './doors.js';

const HW = GLASS_BOX.halfWidth; // 23
const ZF = GLASS_BOX.zFront; // 95.56 glass face
const ZB = GLASS_BOX.zBack; // 85.76 LEVEL 3 wall line
// Top of the box: 31.3 (official cutaway; the Concours photo scales to 30.2-31.2). The shared
// envelope carries the earlier estimate 32.0; nothing else is built against it.
const TOP = Y_LEAN_TOP;
const BAYS_FRONT = 38; // 1.21 m module (38 bays counted on the photographs)
const BAYS_SIDE = 8;
const DOOR_Z = GLASS_BOX.doorZ;
const FIN = 0.35;

/** Curtain-wall tiers: [y0, y1, level, kind] */
// Four glazed tiers separated by slim silver-grey bands at the floor lines (photo T6).
const TIERS = [
  [Y_BAY0, Y_BAY0 + 0.35, 5, 'spandrel'],
  [Y_BAY0 + 0.35, Y6 - 0.3, 5, 'glass'],
  [Y6 - 0.3, Y6 + 0.25, 6, 'spandrel'],
  [Y6 + 0.25, Y7 - 0.3, 6, 'glass'],
  [Y7 - 0.3, Y7 + 0.25, 7, 'spandrel'],
  [Y7 + 0.25, Y8 - 0.3, 7, 'glass'],
  [Y8 - 0.3, Y8 + 0.25, 8, 'spandrel'],
  [Y8 + 0.25, TOP - 0.25, 8, 'glass'],
  [TOP - 0.25, TOP, 8, 'spandrel'],
];
const LEVEL_SPANS = [
  [Y_BAY0, Y6 - 0.3, 5],
  [Y6 - 0.3, Y7 - 0.3, 6],
  [Y7 - 0.3, Y8 - 0.3, 7],
  [Y8 - 0.3, TOP, 8],
];
/** Low transoms at guard-rail height inside the glazed tiers. */
const RAILS = [
  [Y5 + 1.1, 5],
  [Y6 + 1.1, 6],
  [Y7 + 1.1, 7],
];
const GLOW = { 5: 'glassbox.litInteriorRed', 6: 'glassbox.litInteriorAmber', 7: 'glassbox.litInteriorBlue' };

/** z of the building face beside the box at height y (bay face, leaning wall, recessed band). */
function wallZ(y) {
  let s;
  if (y <= Y6) s = S_BAY;
  else if (y < Y_LEAN_TOP) s = S_BAY - ((S_BAY - S_TOP) * (y - Y6)) / (Y_LEAN_TOP - Y6);
  else s = S_JUNC;
  return RC[1] - s;
}
/** Height at which the building face passes z (top of a side mullion standing at z). */
function topAt(z) {
  const s = RC[1] - z;
  if (s <= S_JUNC) return TOP;
  if (s <= S_TOP + 0.01) return Y_LEAN_TOP;
  if (s >= S_BAY) return Y6;
  return Y6 + ((S_BAY - s) * (Y_LEAN_TOP - Y6)) / (S_BAY - S_TOP);
}

function member(col, F, u, y0, y1, withFin) {
  for (const [a, b, lv] of LEVEL_SPANS) {
    const v0 = Math.max(a, y0);
    const v1 = Math.min(b, y1);
    if (v1 - v0 < 0.05) continue;
    obox(col.geo('glassbox.mullion', { level: lv, part: 'curtain-wall mullions' }), F, u - 0.035, u + 0.035, v0, v1, -0.24, 0.0, 'tu');
    if (withFin) obox(col.geo('glassbox.fin', { level: lv, part: 'curtain-wall fins' }), F, u - 0.028, u + 0.028, v0, v1, 0.0, FIN, 'tub');
  }
}

function curtainWall(col, detail) {
  const front = frame([0, 0, ZF], [1, 0, 0], [0, 0, 1]);
  // ---- front -----------------------------------------------------------------------------------
  for (const [y0, y1, lv, kind] of TIERS) {
    if (kind === 'glass') {
      slab(col.geo('glassbox.glass', { level: lv, part: 'glass box glazing' }), front, rect(-HW, y0, HW, y1), { t: 0.024, off: -0.07, edge: false });
      if (GLOW[lv]) slab(col.geo(GLOW[lv], { level: lv, part: 'lounge glow' }), front, rect(-HW + 0.4, y0, HW - 0.4, y1), { t: 0, off: -0.75, back: false });
    } else slab(col.geo('glassbox.spandrel', { level: lv, part: 'spandrel bands' }), front, rect(-HW, y0, HW, y1), { t: 0.06, off: -0.05, edge: false, back: false });
    const tr = col.geo('glassbox.mullion', { level: lv, part: 'curtain-wall transoms' });
    obox(tr, front, -HW, HW, y0 - 0.035, y0 + 0.035, -0.22, 0.03, 'lr');
  }
  for (const [y, lv] of RAILS) obox(col.geo('glassbox.mullion', { level: lv, part: 'curtain-wall transoms' }), front, -HW, HW, y - 0.025, y + 0.025, -0.2, 0.02, 'lr');
  for (let i = 0; i <= BAYS_FRONT; i++) member(col, front, lerp(-HW, HW, i / BAYS_FRONT), Y_BAY0, TOP, detail || i % 2 === 0);

  // ---- side returns (only the part in front of the leaning wall is outside) ---------------------------
  for (const sg of [1, -1]) {
    const side = frame([sg * HW, 0, 0], [0, 0, 1], [sg, 0, 0]);
    for (const [y0, y1, lv, kind] of TIERS) {
      const poly = [
        [wallZ(y0) - 0.25, y0],
        [ZF, y0],
        [ZF, y1],
        [wallZ(y1) - 0.25, y1],
      ];
      if (kind === 'glass') {
        slab(col.geo('glassbox.glass', { level: lv, part: 'glass box glazing' }), side, poly, { t: 0.024, off: -0.07, edge: false });
        if (GLOW[lv])
          slab(
            col.geo(GLOW[lv], { level: lv, part: 'lounge glow' }),
            side,
            [
              [wallZ(y0) + 0.3, y0],
              [ZF - 0.5, y0],
              [ZF - 0.5, y1],
              [wallZ(y1) + 0.3, y1],
            ],
            { t: 0, off: -0.75, back: false },
          );
      } else slab(col.geo('glassbox.spandrel', { level: lv, part: 'spandrel bands' }), side, poly, { t: 0.06, off: -0.05, edge: false, back: false });
      obox(col.geo('glassbox.mullion', { level: lv, part: 'curtain-wall transoms' }), side, wallZ(y0) - 0.2, ZF, y0 - 0.035, y0 + 0.035, -0.22, 0.03, 'lr');
    }
    for (const [y, lv] of RAILS) obox(col.geo('glassbox.mullion', { level: lv, part: 'curtain-wall transoms' }), side, wallZ(y) - 0.2, ZF, y - 0.025, y + 0.025, -0.2, 0.02, 'lr');
    for (let i = 1; i <= BAYS_SIDE; i++) {
      const z = ZF - (i * (ZF - ZB)) / BAYS_SIDE;
      const yt = topAt(z + 0.05);
      if (yt - Y_BAY0 > 0.4) member(col, side, z, Y_BAY0, yt, true);
    }
    // corner post
    for (const [a, b, lv] of LEVEL_SPANS) wbox(col.geo('glassbox.mullion', { level: lv, part: 'curtain-wall mullions' }), sg * HW - 0.09, a, ZF - 0.09, sg * HW + 0.09, b, ZF + 0.09, 'tu');
  }

  // ---- roof of the box (the columns rise out of it) and coping --------------------------------------------
  const roof = col.geo('glassbox.roof', { level: 8, part: 'glass box roof' });
  const zr = RC[1] - S_JUNC;
  wbox(roof, -HW + 0.05, TOP - 0.3, zr - 0.3, HW - 0.05, TOP - 0.05, ZF - 0.05, 'u');
  const cop = col.geo('glassbox.mullion', { level: 8, part: 'glass box coping' });
  wbox(cop, -HW - 0.06, TOP - 0.02, ZF - 0.3, HW + 0.06, TOP + 0.1, ZF + 0.06);
  wbox(cop, HW - 0.3, TOP - 0.02, zr - 0.3, HW + 0.06, TOP + 0.1, ZF - 0.3);
  wbox(cop, -HW - 0.06, TOP - 0.02, zr - 0.3, -HW + 0.3, TOP + 0.1, ZF - 0.3);
}

function doorStorey(col) {
  // dark soffit under the box, from the door line out to the glass face
  const soffit = col.geo('facade.walkwaySoffit', { level: 3, part: 'entrance soffit' });
  wbox(soffit, -HW, Y_BAY0 - 0.25, DOOR_Z - 0.2, HW, Y_BAY0, ZF, 't');
  // side walls of the entrance storey (deck-level panels), back to the wall line
  const panel = col.geo('facade.deckWallPanel', { level: 3, part: 'deck-level wall' });
  const kerb = col.geo('facade.kerbConcrete', { level: 3, part: 'deck-level kerb' });
  for (const sg of [1, -1]) {
    const side = frame([sg * HW, 0, 0], [0, 0, 1], [sg, 0, 0]);
    slab(panel, side, rect(ZB, Y3, DOOR_Z, Y_BAY0), { t: WALL_T });
    obox(kerb, side, ZB, DOOR_Z, Y3, Y3 + 0.6, 0, 0.05, 'b');
  }
  // door wall between the columns: five bays of three double doors, glazed above, dark transom on top
  const F = frame([0, 0, DOOR_Z], [1, 0, 0], [0, 0, 1]);
  const xs = COLUMNS.filter(([, z]) => Math.abs(z - 94.76) < 0.01)
    .map(([x]) => x)
    .filter((x) => Math.abs(x) < HW)
    .sort((a, b) => a - b);
  const DOOR_H = 3.3;
  const transom = col.geo('sign.transomDark', { level: 3, part: 'entrance transom' });
  const yD = Y3 + DOOR_H;
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i] + 0.6;
    const b = xs[i + 1] - 0.6;
    doorScreen(col, F, a, b, Y3, DOOR_H, { bays: 3, open: [0, 1, 2], level: 3, transom: 2.5, inset: 0.05 });
    slab(transom, F, rect(a, yD, b, Y_BAY0 - 0.25), { t: 0.2, off: -0.02, edge: false });
    slab(col.geo('glassbox.litEntranceWarm', { level: 3, part: 'entrance glow' }), F, rect(a + 0.1, Y3 + 0.1, b - 0.1, yD - 0.1), { t: 0, off: -0.9, back: false });
  }
  // solid end panels outside the outermost columns
  for (const sg of [1, -1]) {
    const x0 = xs[sg > 0 ? xs.length - 1 : 0] + sg * 0.6;
    slab(panel, F, rect(Math.min(x0, sg * HW), Y3, Math.max(x0, sg * HW), Y_BAY0), { t: 0.3, edge: false });
  }
  // under-deck storeys below the box (LEVEL 1-2)
  const plinth = col.geo('facade.plinth', { level: 1, part: 'plinth' });
  slab(plinth, frame([0, 0, ZF - 0.3], [1, 0, 0], [0, 0, 1]), rect(-HW + 0.3, 0, HW - 0.3, Y3 - 0.05), { t: WALL_T });
  for (const sg of [1, -1]) slab(plinth, frame([sg * (HW - 0.3), 0, 0], [0, 0, 1], [sg, 0, 0]), rect(ZB, 0, ZF - 0.3, Y3 - 0.05), { t: WALL_T });
  return { yD, yTop: Y_BAY0 - 0.25, z: DOOR_Z };
}

export function buildGlassBox(col, { detail = true } = {}) {
  curtainWall(col, detail);
  return doorStorey(col);
}

export const GLASSBOX_INFO = { DOOR_Z, BAYS_FRONT };

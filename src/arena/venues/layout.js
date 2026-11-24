// Where every venue sits. All numbers are world metres (see src/core/frame.js): +X = house
// right, +Z = toward the rear / Main Entrance, y = height above the arena floor.
//
// Placement reasoning (research/00-consolidated.md sections 4, 5.1, 8; official floor maps):
//  * The glass box on the centre facet (GLASS_BOX: |x| <= 23, z 85.76 .. 95.56) stacks the Main
//    Entrance foyer (LEVEL 3), Lounge 5 (LEVEL 5), the VIP lounge (LEVEL 6) and Arena Bar 7
//    (LEVEL 7). On the official LEVEL 5 / LEVEL 7 maps the "LOUNGE 5" and "Arena Bar 7" boxes
//    are exactly the projecting box: registering the map on gates 505-508 (world x = -18.14 ..
//    +18.14) gives box edges at x = -23.1 / +22.3.
//  * The six colonnade columns at x = +-4.27, +-12.81, +-21.36 (z = 94.76) stand inside the
//    glazing; in the photos they are the fair-faced columns of Lounge 5 and the VIP lounge and
//    the two mirror-clad columns behind the Arena Bar 7 counter (the middle pair).
//  * The hall-side edge of the venues is the row of interior columns on the threshold of the
//    glass box (z = 85.76, same x as the colonnade; built by arena/structure as charcoal
//    casings through LEVEL 3-7). In the official Lounge 5 photo that row carries the portrait
//    screens and the "LOUNGE 5" shield and bounds the table field.
//  * Kiosks: the recesses (side / back walls, canopy fascia with downlights) are built by
//    arena/structure (fittings.js kioskShell); the fit-out here is placed in the same plan
//    frames with the same numbers, so both stay registered (see KIOSKS).
//  * VIP BOX rooms: 60 m band behind the Middle Stand centre (model-spec tiers[4]): organiser
//    room 10 m on the axis, five 5 m rooms each side, behind the balcony rows; the rooms end
//    at the VIP corridor wall of arena/structure (apothem 111.3).
import { LEVEL_Y, GLASS_BOX, COLUMNS, Z } from '../../core/envelope.js';
import { FAN_APEX_Z, WING_ANGLE } from '../../core/seating.js';

/** Thickness of a floor finish laid on a structural slab. */
export const FIN = 0.02;

export const Y = Object.freeze({ L1: LEVEL_Y[1], L3: LEVEL_Y[3], L5: LEVEL_Y[5], L6: LEVEL_Y[6], L7: LEVEL_Y[7] });

/** Glass box interior limits used by the fit-out. */
export const BOX = Object.freeze({
  hw: GLASS_BOX.halfWidth, // 23
  zBack: GLASS_BOX.zBack, // 85.76 (LEVEL 3 wall line outside the box)
  zFront: GLASS_BOX.zFront, // 95.56 (glass face)
  zGlassIn: GLASS_BOX.zFront - 0.26, // inner limit of the fit-out at the glazing (mullions are 0.24 deep)
  xGlassIn: GLASS_BOX.halfWidth - 0.3,
});

/** Row of interior columns on the threshold of the glass box (arena/structure ROW_A): 1.2 m casings. */
export const ROW_Z = Z.l3RearWall; // 85.76

/** Colonnade columns standing inside the glass box: x positions (z = Z.columnLine), 1.2 m square. */
export const BOX_COLUMNS_X = Object.freeze(
  COLUMNS.filter(([x, z]) => Math.abs(z - Z.columnLine) < 0.5 && Math.abs(x) < GLASS_BOX.halfWidth)
    .map(([x]) => x)
    .sort((a, b) => a - b),
);
export const COLUMN_Z = Z.columnLine; // 94.76
export const COLUMN_HALF = 0.6;

// --- VIP BOX rooms (LEVEL 6) --------------------------------------------------------------
// Balcony rows at apothem 102.8 / 103.85 from the fan apex; the room starts behind the second
// tread (glass front owned by arena/bowl at about z = 72.0) and ends at the room face of the
// VIP corridor wall of arena/structure (apothem 111.3, 0.2 m thick, doors included there).
export const VIP_BOX = Object.freeze({
  zFront: FAN_APEX_Z + 103.85 + 0.9, // 72.15  first centimetre of room carpet behind the glass front
  zBack: FAN_APEX_Z + 111.2, // 78.6   room face of the corridor wall → rooms 6.45 m deep
  ceiling: 3.0, // finished ceiling above the room floor (structural ceiling at +23.1)
  wallGap: 0.12, // linings stand this far from the dividing-wall centre lines
  rooms: Object.freeze([
    { id: 'organiser', x0: -5, x1: 5 },
    ...[1, 2, 3, 4, 5].flatMap((k) => [
      { id: `L${k}`, x0: -5 - 5 * k, x1: -5 * k },
      { id: `R${k}`, x0: 5 * k, x1: 5 + 5 * k },
    ]),
  ]),
});

// --- VIP lounge (LEVEL 6) -----------------------------------------------------------------
export const VIP_LOUNGE = Object.freeze({
  hw: 20.3, // interior half width: "40 m wide"
  zWall: ROW_Z + 0.64, // 86.4  lounge face of the hall-side wall (the column casings stay behind it)
  zCarpet: 89.5, // marble aisle | carpet
  bar: Object.freeze({ x: 0, z: 89.95, a: 2.1, b: 1.1 }), // oval island bar
  bayHalf: 6.4, // marble bay around the bar
  zBay: 92.3,
  zCorridor: FAN_APEX_Z + 111.4 + 0.02, // corridor side of the VIP corridor wall
  ceiling: 3.3,
  tray: 3.6,
});

// --- Arena Bar 7 (LEVEL 7) ----------------------------------------------------------------
// The LEVEL 7 concourse of arena/structure passes between its gate wall (z = 84.6) and the bar:
// the line of slim black posts stands 2.4 m outside the column row, leaving that strip free.
export const BAR7 = Object.freeze({
  zEdge: ROW_Z + 2.44, // 88.2  boundary to the concourse (line of slim black posts)
  counterR: 31.7, // radius of the counter front (chord 15 m, sagitta 0.9 m)
  counterZ0: 90.4, // counter front on the axis
  counterHalf: 7.5,
  returnZ: 93.3, // end returns run back to here
  ceiling: 3.45,
  bulkhead: 3.15,
});

// --- Lounge 5 (LEVEL 5) -------------------------------------------------------------------
export const LOUNGE5 = Object.freeze({
  zEdge: ROW_Z - 0.76, // 85.0  floor finish starts just outside the first table slot
  zField0: ROW_Z - 0.66, // 85.1  table field, hall side (first slot stands between the columns)
  endWallX: 22.5, // red end walls with the porthole mirror
  endWallZ1: 90.0,
});

// --- kiosks ---------------------------------------------------------------------------------
// The eleven recesses in the plan frames of arena/structure (structure/kit.js frameC / frameW,
// structure/fittings.js kioskShell): centre frame p = |x|, q = apothem R (z = R + FAN_APEX_Z);
// wing frame p = a (along the rows toward the flank wall), q = apothem R. `axis` = direction
// of the opening line, `into` = side of the recess, w / depth / h = clear recess size.
const COS = Math.cos(WING_ANGLE);
const SIN = Math.sin(WING_ANGLE);
const RC0 = -FAN_APEX_Z;
const RW0 = RC0 * COS;
function frame(kind, s) {
  if (kind === 'C') return { pt: (p, R) => [s * p, R - RC0], dirP: [s, 0], dirQ: [0, 1] };
  return { pt: (a, R) => [s * (a * COS + (R - RW0) * SIN), -a * SIN + (R - RW0) * COS], dirP: [s * COS, -SIN], dirQ: [s * SIN, COS] };
}
function recess(id, level, kind, s, { p, q, axis = 'p', into = 1, w = 8.5, depth = 2.6, h = 2.4 }, accent) {
  const f = frame(kind, s);
  const across = axis === 'p' ? [0, into] : [into, 0];
  const [x, z] = f.pt(p, q);
  const nx = -(across[0] * f.dirP[0] + across[1] * f.dirQ[0]);
  const nz = -(across[0] * f.dirP[1] + across[1] * f.dirQ[1]);
  return Object.freeze({ id, level, x, z, rotY: Math.atan2(nx, nz), width: w, depth, opening: h, accent });
}
const GATE_506_X = 6.014;
const GATE_505_X = 18.139;
export const KIOSKS = Object.freeze([
  // LEVEL 1: outer band of the diagonal corridors under the LEVEL 2 slab, facing the arena
  recess('1A', 1, 'W', -1, { p: 5.3, q: 93.5, into: 1 }, 'red'),
  recess('1B', 1, 'W', 1, { p: 5.3, q: 93.5, into: 1 }, 'red'),
  // LEVEL 3: inner band under the mezzanine beside the 301 / 304 lobbies, facing the foyer (2.1 m recess)
  recess('3A', 3, 'W', -1, { p: -7.5, q: 106.85, into: -1, h: 2.1 }, 'red'),
  recess('3B', 3, 'W', 1, { p: -7.5, q: 106.85, into: -1, h: 2.1 }, 'red'),
  // LEVEL 5: far ends of the wing concourses (5A, 5D) and the centre block between the gate
  // lobbies 505 / 506 and 507 / 508, opening toward Lounge 5 (5B, 5C)
  recess('5A', 5, 'W', -1, { p: 33.65, q: 113.9, axis: 'q', into: 1, w: 7.6 }, 'red'),
  recess('5D', 5, 'W', 1, { p: 33.65, q: 113.9, axis: 'q', into: 1, w: 7.6 }, 'red'),
  recess('5B', 5, 'C', -1, { p: (GATE_506_X + GATE_505_X) / 2, q: 109.4, into: -1, w: 8.2, depth: 2.4 }, 'red'),
  recess('5C', 5, 'C', 1, { p: (GATE_506_X + GATE_505_X) / 2, q: 109.4, into: -1, w: 8.2, depth: 2.4 }, 'red'),
  // LEVEL 7: far ends of the wing concourses (7A, 7C) and the centre bay opposite Arena Bar 7 (7B)
  recess('7A', 7, 'W', -1, { p: 33.65, q: 116.4, axis: 'q', into: 1, w: 7.6 }, 'blue'),
  recess('7C', 7, 'W', 1, { p: 33.65, q: 116.4, axis: 'q', into: 1, w: 7.6 }, 'blue'),
  recess('7B', 7, 'C', 1, { p: 0, q: 116.9, into: -1, w: 8.5, depth: 2.4 }, 'blue'),
]);
/** Finished floor the kiosk fit-out stands on (LEVEL 1 has a 20 mm topping in arena/structure). */
export const KIOSK_FLOOR = Object.freeze({ 1: 0.02, 3: LEVEL_Y[3], 5: LEVEL_Y[5], 7: LEVEL_Y[7] });

// --- main foyer (LEVEL 3) -------------------------------------------------------------------
export const FOYER = Object.freeze({
  // "K-Arena" logotype on the wall at the head of the grand stair (the hall rear wall above the
  // LEVEL 4 landing; arena/structure: foyer face at apothem 96.73, panel 7.6 x 1.9 m centred
  // 1.08 m above LEVEL 4). The relief board hangs 2 cm off that face.
  mural: Object.freeze({ x: 0, y: LEVEL_Y[4] + 1.08, z: FAN_APEX_Z + 96.73 + 0.05, width: 7.6, height: 1.9, depth: 0.06 }),
  // ticket-check lanes inside the Main Entrance doors (door line z = 94.55 between the columns)
  lanesZ: 90.0,
  laneHalfSpan: 18.9,
  lanePitch: 1.8,
  totemZ: ROW_Z + 1.3, // portrait signage totems mid-bay, just inside the column row
});

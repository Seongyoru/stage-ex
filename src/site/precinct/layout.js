// Plan layout of the Music Terrace precinct in WORLD coordinates (metres; +X = house right
// = the Hilton side, +Z = away from the stage). Pure math, no three.js.
//
// Sources: OSM footprints (research/geo-data.md §3.2, research/model-spec.json neighbours),
// PLATEAU annex outline, the official precinct map (terrace_map_sp.png), and the photo log
// of research/exterior-site.md. Every lon/lat constant below is copied from those files.
import { lonLatToWorld, NORTH_XZ } from '../../core/frame.js';
import { COLUMNS, DECK_Y, L3_WALL_RING, LEVEL_Y, ROOF_OUTLINE, Z } from '../../core/envelope.js';
import { frame, lineHit, toL, toW } from './kit.js';

export const Y_DECK = DECK_Y.arenaDeck; // +7.27 Arena Deck = LEVEL 3
export const Y_PLAZA = DECK_Y.plaza; // +5.0 Music Terrace plaza level
export const Y_BRIDGE = LEVEL_Y[5]; // +12.67 sky-bridge floor = LEVEL 5

const ll = (p) => lonLatToWorld(p[0], p[1]);

// Compass unit vectors in world XZ.
export const NORTH = [NORTH_XZ[0], NORTH_XZ[1]];
export const SOUTH = [-NORTH[0], -NORTH[1]];
export const WEST = [NORTH[1], -NORTH[0]];
export const EAST = [-WEST[0], -WEST[1]];

// --- arena facets ------------------------------------------------------------------------
// Rear facets of the roof outline: R = house-right diagonal (the "W facet", South Entrance),
// C = centre (Main Entrance), L = house-left diagonal (the "N facet", North Entrance).
// t runs along the eave edge from the corner shared with the centre facet toward the flank;
// off is the distance outside the eave edge (negative = under the roof).
const CR = ROOF_OUTLINE[2];
const SR = ROOF_OUTLINE[1];
const CL = ROOF_OUTLINE[3];
const SL = ROOF_OUTLINE[4];
function facet(c, s) {
  const len = Math.hypot(s[0] - c[0], s[1] - c[1]);
  const d = [(s[0] - c[0]) / len, (s[1] - c[1]) / len];
  // outward normal: pointing away from the hall (larger z)
  const n = d[0] > 0 ? [-d[1], d[0]] : [d[1], -d[0]];
  return { c, s, d, n, len, at: (t, off = 0) => [c[0] + d[0] * t + n[0] * off, c[1] + d[1] * t + n[1] * off] };
}
export const FACET_R = facet(CR, SR);
export const FACET_L = facet(CL, SL);
export const SHOULDER_R = SR;
export const SHOULDER_L = SL;
export const EAVE_Z = Z.rearEave; // 103.76 centre facet eave tip
export const WALL_OFF = -18; // LEVEL 3 wall line relative to the eave edge
export const COL_OFF = -9; // column line
/** Station t of the k-th column (1..7) on a diagonal facet. */
export const facetColumnT = (k) => 10.7 + 8.0 * (k - 1);

// --- Hilton Yokohama (OSM way 934667674) ---------------------------------------------------
export const HILTON_LL = [
  [139.6291247, 35.4643673], // NW corner
  [139.6298137, 35.4643691], // NE corner
  [139.6298148, 35.4640727], // SE corner
  [139.6295211, 35.464072],
  [139.629521, 35.4641192],
  [139.6291256, 35.4641182], // SW corner
];
/** Hilton frame: origin = NE corner of the podium, a = west along the north face, b = north. */
const H_NE = ll(HILTON_LL[1]);
export const HF = frame(H_NE[0], H_NE[1], WEST[0], WEST[1]);
export const H = (a, b) => toW(HF, a, b);
export const HILTON = {
  bay: 7.8, // structural grid read from the notice-board elevations
  len: 62.4, // 8 bays (OSM 62.6 m)
  depth: 27.8, // north face to south face of the west part
  eastBlockLen: 23.4, // 3 bays; this part is 32.9 m deep
  eastBlockDepth: 32.9,
  passage: [23.4, 46.8], // pilotis / Music Terrace Plaza passage through the podium (bays 4-6)
  yCornice: 18.6, // podium wall top = annex eaves height (PLATEAU 18.65)
  yMansard: 21.4,
  top: 99.87,
  // tower slab on the podium
  tower: { a0: 7.8, a1: 62.4, b0: -27.8, b1: -4.0 },
};

// --- K Tower Yokohama (OSM way 934667673; plan size 43.4 x 32.0 m, Kajima) ----------------------
export const KTOWER_LL = [
  [139.6285828, 35.4643297],
  [139.6285853, 35.4640433],
  [139.6290421, 35.4640481],
  [139.6290412, 35.4643314],
];
export const KTOWER = (() => {
  const pts = KTOWER_LL.map((p) => toL(HF, ...ll(p)));
  const a = pts.map((p) => p[0]);
  const b = pts.map((p) => p[1]);
  const ca = (Math.min(...a) + Math.max(...a)) / 2;
  const cb = (Math.min(...b) + Math.max(...b)) / 2;
  const len = 43.2; // 6 bays of 7.2 m
  const depth = 32.0;
  return { a0: ca - len / 2, a1: ca + len / 2, b0: cb - depth / 2, b1: cb + depth / 2, bay: 7.2, top: 99.87 };
})();

// --- low-rise annex / entrance pavilion (PLATEAU 14100-bldg-1007199) --------------------------------
export const ANNEX_LL = [
  [139.6295496, 35.4646189], // A1 east corner
  [139.6292885, 35.46447], // A2 south corner
  [139.6292177, 35.4645531],
  [139.6292348, 35.4645628],
  [139.629173, 35.4646354],
  [139.6293959, 35.4647625],
  [139.6294578, 35.46469],
  [139.6294788, 35.464702],
];
const A1 = ll(ANNEX_LL[0]);
const A2 = ll(ANNEX_LL[1]);
/** Pavilion frame: origin = east corner, a along the plaza-side face (bearing 235°), b toward the street. */
export const PF = frame(A1[0], A1[1], A2[0] - A1[0], A2[1] - A1[1]);
export const P = (a, b) => toW(PF, a, b);
export const PAVILION = {
  // two stepped blocks (PLATEAU outline in the pavilion frame)
  se: { a0: 0, a1: 28.9, b0: 0, b1: 11.2 },
  nw: { a0: 2.3, a1: 27.0, b0: 11.2, b1: 21.0 },
  yEaves: 18.65,
  yTop: 21.4,
};
/** Glazed link wing between the pavilion and the Hilton north face (OSM way 1211949300), Hilton frame. */
export const LINK = { a0: 49.4, a1: 59.6, b0: 0, b1: 23.0, y0: 9.6, y1: 16.6 };

// --- tents ------------------------------------------------------------------------------------
export const BAY_TENT_LL = [
  [139.6295884, 35.4648583],
  [139.6294999, 35.4647449],
  [139.6295983, 35.464694],
  [139.6296868, 35.4648074],
];
export const BAY_TENT = (() => {
  const p = BAY_TENT_LL.map(ll);
  const cx = p.reduce((s, q) => s + q[0], 0) / 4;
  const cz = p.reduce((s, q) => s + q[1], 0) / 4;
  return { cx, cz, len: 14.9, depth: 10.6, height: 6.0 }; // long axis parallel to the main facade (world X)
})();
// Arena Tent: 42.7 m long (OSM way 1211706026), parallel to the house-left diagonal facet.
export const ARENA_TENT = { t0: 0.8, t1: 43.5, off0: 1.6, off1: 7.6, gables: 14, eaves: 3.5, ridge: 5.5 };

// --- Big Steps -----------------------------------------------------------------------------------
// Leg 1 runs parallel to the main facade; leg 2 continues the line of the Hilton east face
// northward (official precinct map). 15 risers, mid landing, total rise 2.27 m.
export const STEPS = (() => {
  const zTop = 108.0; // top nosing of leg 1 (4.2 m outside the eave tip)
  const xNorth = 1.0; // north end (red zig-zag rail), about on the building axis
  const n = 15;
  const r = (Y_DECK - Y_PLAZA) / n;
  const t = 0.42;
  const landing = 1.6;
  const bend = lineHit(H_NE, NORTH, [0, zTop], [1, 0]);
  const bendB = toL(HF, bend[0], bend[1])[1];
  const southB = 7.0; // leg 2 stops 7 m short of the hotel's north face
  const top = [[xNorth, zTop], bend, H(0, southB)];
  const normals = [
    [0, 1],
    [WEST[0], WEST[1]],
  ];
  const depth = (n - 2) * t + landing;
  return { zTop, xNorth, n, r, t, landings: { 8: landing }, top, normals, bend, bendB, southB, depth };
})();

// --- North Gate stair (pale granite), ramp and landing ---------------------------------------
export const NGATE = {
  x0: 5.0,
  x1: 21.0,
  zTop: 124.4,
  n: 32,
  t: 0.45,
  landing: 3.0, // after riser 16
  zLanding: STEPS.zTop + STEPS.depth, // foot of the Big Steps
  rampW: 2.4,
  zDeckEdge: 124.0, // Arena Deck edge north of the steps; the ramp runs outside it
};
NGATE.r = Y_PLAZA / NGATE.n;
NGATE.zFoot = NGATE.zTop + (NGATE.n - 2) * NGATE.t + NGATE.landing;

// House-left front: the Arena Deck edge follows the continuation of the house-left eave line.
export const JOG_T = -11.1; // station of the jog beside the North lift tower
export const DECK_OFF_L = 8.5; // Arena Deck edge outside the eave on the house-left diagonal
export const RAMP_KNEE = lineHit(CL, FACET_L.d, [0, NGATE.zDeckEdge], [1, 0]); // where the ramp turns

// OSM podium outline round the north tip (way 934667677), eave-side order.
const PROW_LL = [
  [139.6308358, 35.4654268],
  [139.6308872, 35.4654462],
  [139.6309429, 35.4654482],
  [139.6309998, 35.4654445],
  [139.6310549, 35.4654308],
  [139.631109, 35.4654078],
  [139.6311485, 35.4653793],
  [139.631184, 35.4653458],
  [139.6312106, 35.4653059],
  [139.6312652, 35.4652016],
];
export const PROW = PROW_LL.map(ll);

// --- sky-bridge -------------------------------------------------------------------------------------
// Between the 4th and 5th column of the house-right diagonal (photos T5 / T8), square to the hotel.
export const SKYBRIDGE = (() => {
  const mid = FACET_R.at((facetColumnT(4) + facetColumnT(5)) / 2, COL_OFF);
  const [, b] = toL(HF, mid[0], mid[1]);
  // the arena end meets the face of the projecting LEVEL 5 glazed band, 16.4 m inside the eave edge
  const wallPt = lineHit(mid, EAST, FACET_R.at(0, -16.4), FACET_R.d);
  const aWall = toL(HF, wallPt[0], wallPt[1])[0];
  return { b, a0: aWall + 0.06, a1: -0.05, width: 3.0, height: 3.5, y: Y_BRIDGE };
})();

// --- Takashima Suisaisen Deck (OSM way 934667676, centre line, east → west) -----------------------
export const TDECK_LL = [
  [139.628832, 35.4643998],
  [139.6287092, 35.4644489],
  [139.6285771, 35.4644805],
  [139.6284157, 35.4644956],
  [139.6282513, 35.464488],
  [139.6281014, 35.4644584],
  [139.6279731, 35.4644163],
  [139.6278426, 35.4643602],
  [139.627764, 35.4643182],
  [139.6273871, 35.46408],
];
// West end: the approach of みなとみらい大橋 is on an embankment, ground 8.2 m T.P. = +4.0 (GSI).
export const TDECK = { line: TDECK_LL.map(ll), width: 6.0, yEast: Y_PLAZA, yWest: 4.02, camber: 1.3 };

// --- lifts (OSM highway=elevator nodes; W estimated from the precinct map) -------------------------------
export const LIFT_N = { t: JOG_T, len: 7.0, off0: 3.5, off1: 8.5, top: 12.6 };
export const LIFT_E = ll([139.6311799, 35.4651885]);
export const LIFT_S = { a0: 45.5, a1: 49.0, b0: -39.0, b1: -35.5 };
export const LIFT_W = { a: 75.5, b: 16.5 };

// --- deck outlines -------------------------------------------------------------------------------------
const W_A = L3_WALL_RING[9]; // house-right end of the diagonal LEVEL 3 wall
const W_B = L3_WALL_RING[8];
const W_C = L3_WALL_RING[3];
const W_D = L3_WALL_RING[2];
// glass box, house-right → left; the deck runs 0.36 m under the glazing line to meet the interior slab
const GB_Z = L3_WALL_RING[6][1] - 0.36;
const GB = [L3_WALL_RING[7], [L3_WALL_RING[6][0], GB_Z], [L3_WALL_RING[5][0], GB_Z], L3_WALL_RING[4]];

/** Where the Hilton east face line meets the line through the house-right shoulder heading west. */
export const DECK_S1 = lineHit(SR, WEST, H_NE, SOUTH);
const S1b = toL(HF, DECK_S1[0], DECK_S1[1])[1];
export const RAMP_E = { a0: -2.8, a1: -0.2, bTop: -31.0, bFoot: 0, wallA: -3.0 }; // slope along the hotel's east face
// End of the deck on the house-left flank (East Gate): perpendicular from the last prow point.
const flankDirL = (() => {
  const a = ROOF_OUTLINE[5];
  const l = Math.hypot(SL[0] - a[0], SL[1] - a[1]);
  return [(SL[0] - a[0]) / l, (SL[1] - a[1]) / l];
})();
const PROW_END = PROW[PROW.length - 1];
export const DECK_FL = lineHit(PROW_END, [flankDirL[1], -flankDirL[0]], ROOF_OUTLINE[5], flankDirL);

export const ARENA_DECK_RING = [
  W_A,
  SR,
  DECK_S1,
  H(0, -HILTON.eastBlockDepth),
  H(0, RAMP_E.bTop),
  H(RAMP_E.wallA, RAMP_E.bTop),
  H(RAMP_E.wallA, STEPS.southB),
  H(0, STEPS.southB),
  STEPS.bend,
  [STEPS.xNorth, STEPS.zTop],
  [STEPS.xNorth, NGATE.zDeckEdge],
  RAMP_KNEE,
  FACET_L.at(JOG_T, 0),
  FACET_L.at(JOG_T, DECK_OFF_L),
  FACET_L.at(46.5, DECK_OFF_L),
  ...PROW.slice(1),
  DECK_FL,
  W_D,
  W_C,
  GB[3],
  GB[2],
  GB[1],
  GB[0],
  W_B,
];
export const DECK_S1_B = S1b;

/** Lower plaza (+5.0): outer ring; the Hilton west block is a hole. */
export const PLAZA_RING = [
  H(STEPS.depth, STEPS.southB), // foot of the Big Steps, south end
  H(0, STEPS.southB),
  H(RAMP_E.wallA, STEPS.southB),
  H(RAMP_E.wallA, 0),
  H(0, 0),
  H(HILTON.eastBlockLen, 0),
  H(HILTON.eastBlockLen, -HILTON.eastBlockDepth),
  H(4.2, -HILTON.eastBlockDepth),
  H(4.2, -38.7),
  H(28.5, -38.7),
  H(28.5, -35.3),
  H(52.8, -35.3),
  H(52.8, -37.5),
  H(62.7, -37.5),
  H(62.7, -39.8),
  H(102, -39.8),
  H(102, KTOWER.b0),
  H(KTOWER.a0, KTOWER.b0),
  H(KTOWER.a0, KTOWER.b1),
  H(90.3, KTOWER.b1),
  H(89.1, 3.4), // West Gate: landing of the Takashima Suisaisen Deck
  H(84.3, 12.5),
  H(68.1, 24.2),
  H(58.5, 20.5),
  P(27.0, 13.9),
  P(27.0, 11.2),
  P(28.9, 11.2),
  P(28.9, 0),
  P(0, 0),
  P(0, 11.2),
  P(2.3, 11.2),
  P(2.3, 14.35),
  ll([139.6294694, 35.46473]),
  ll([139.6294378, 35.464847]),
  ll([139.6295674, 35.4649249]),
  [NGATE.x1, 141.0],
  [NGATE.x1, NGATE.zTop],
  [NGATE.x0, NGATE.zTop],
  [NGATE.x0, 126.8],
  [STEPS.xNorth, 126.8],
  [STEPS.xNorth, STEPS.zTop + STEPS.depth],
  // foot of the Big Steps at the bend (mitre)
  (() => {
    const n0 = STEPS.normals[0];
    const n1 = STEPS.normals[1];
    const k = STEPS.depth / (1 + n0[0] * n1[0] + n0[1] * n1[1]);
    return [STEPS.bend[0] + (n0[0] + n1[0]) * k, STEPS.bend[1] + (n0[1] + n1[1]) * k];
  })(),
];
export const PLAZA_HOLES = [[H(HILTON.passage[1], 0), H(HILTON.len, 0), H(HILTON.len, -HILTON.depth), H(HILTON.passage[1], -HILTON.depth)]];

// Music Terrace site boundary (OSM way 934667672), used for the ground-level paving.
export const SITE_LL = [
  [139.6313551, 35.463991],
  [139.6315036, 35.4641413],
  [139.6315461, 35.4641941],
  [139.6315778, 35.464249],
  [139.631605, 35.464309],
  [139.6316175, 35.46437],
  [139.6316216, 35.464435],
  [139.6316155, 35.4645001],
  [139.6315992, 35.4645634],
  [139.6315708, 35.4646268],
  [139.6312157, 35.4653085],
  [139.6311886, 35.4653485],
  [139.6311526, 35.4653827],
  [139.6311104, 35.4654123],
  [139.6310577, 35.4654361],
  [139.6310007, 35.4654498],
  [139.6309428, 35.4654541],
  [139.6308854, 35.4654509],
  [139.6308297, 35.4654365],
  [139.6300064, 35.465147],
  [139.6299416, 35.4651235],
  [139.629879, 35.4650989],
  [139.6298153, 35.465072],
  [139.6297602, 35.4650471],
  [139.6297134, 35.4650254],
  [139.6296646, 35.4650018],
  [139.6296168, 35.4649761],
  [139.6295711, 35.4649521],
  [139.6287884, 35.4645181],
  [139.6286698, 35.4644433],
  [139.6285821, 35.4643535],
  [139.628522, 35.4642461],
  [139.6284959, 35.4641337],
  [139.6284957, 35.4639933],
];
export const SITE_RING = SITE_LL.map(ll);

// Surveyed trees inside the Music Terrace site (OSM natural=tree, research/geo/site-context.geojson
// kind "trees", converted with lonLatToWorld; site/ground leaves these to this module): world [x, z].
export const SITE_TREES = [
  [-89.8, 78.3], [-85.6, 83], [-79.7, 86.9], [-73.9, 90.9], [-67.8, 94.9], [-62, 98.7], [-56.3, 102.4], [-50.3, 106.2], [-44.5, 110.2], [-38.7, 114.1],
  [-32.8, 117.9], [-26.9, 121.8], [-4.2, 137.9], [-14.3, 132.3], [-11.1, 133.9], [-7.9, 135.7], [1.2, 141.2], [21.6, -29.4], [24.3, -31.3], [23.9, -40],
  [21.5, -41.2], [22, -33.8], [0.4, -40.4], [-4.1, -42.8], [-6.4, -42.2], [-9, -38.4], [-11.6, -37.1], [-19.7, -32.7], [-14.3, -31.6], [-15.4, -41.4],
  [-18.2, -41], [-22.8, -37.4], [-20.7, -39.2], [-26.4, -36.7], [-28.3, -35.3], [-31.5, -32.4], [-36.5, -28.1], [-38.1, -24.6], [-40.8, -19.9], [-42.3, -18.7],
  [-45.7, -17.4], [-46.6, -14.4], [-48.6, -11.4], [-49.9, -9.6], [-52.2, -6.8], [-52.9, -5.1], [-82.3, 39.3], [-84.6, 40.8], [-88.9, 49.3], [-91.3, 51.7],
  [-92, 55], [-93.9, 61.5],
];

export { COLUMNS, L3_WALL_RING, ROOF_OUTLINE };

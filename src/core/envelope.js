// Shared building envelope: the lines, levels and surfaces that more than one module must
// agree on (outer walls, hall walls, roof plane, truss chords, level heights, columns).
// Pure math in the WORLD frame (see frame.js). Values come from research/model-spec.json
// (research/00-consolidated.md sections 2-5); they are symmetrised about x = 0.
import { SPEC } from './spec.js';
import { G } from './frame.js';
import { PARTS, TREAD_BACK, TREAD_FRONT } from './seating.js';

/** Finished floor level of each building LEVEL above the arena floor (JATET section chain). */
export const LEVEL_Y = Object.freeze({ 1: 0, 2: 3.73, 3: 7.27, 4: 10.07, 5: 12.67, 6: 18.07, 7: 23.47, 8: 28.42, 9: 30.62 });

/**
 * The map is a local diorama, not a world map: a disc of this radius (metres) around the
 * centre of the arena roof outline. Site modules clip everything to it.
 */
export const DIORAMA = Object.freeze({ cx: 0, cz: 34.5, radius: 420 });

/** Outdoor deck levels: Arena Deck = LEVEL 3; the Music Terrace plaza on the hotel side is lower. */
export const DECK_Y = Object.freeze({ arenaDeck: 7.27, plaza: 5.0, ground: 0 });

/** Stations along the hall axis, world z (stage → rear). */
export const Z = Object.freeze({
  stageEndFacade: -34.7, // outer face of the stage-end wall
  raisedRoofStart: -22.6, // the low roof strip over the backstage block ends here
  stageRearWall: -17.2, // hall-side face of the stage rear wall (backstage block is 17.5 m deep)
  stageUpstage: -12.7,
  stageFront: 0,
  flatFloorEnd: 35.8, // front edge of the deployed telescopic stand
  l3RearWall: 85.76, // LEVEL 3 outer wall on the centre facet (18 m inside the eave edge)
  columnLine: 94.76, // centre line of the rear colonnade on the centre facet = roof ridge
  glassBoxFace: 95.56,
  rearEave: 103.76, // tip of the eave on the centre facet
});

// --- outer plan (roof edge) ------------------------------------------------------------
const STAGE_HALF = 21.19; // half width of the stage-end facade
const SHOULDER = Object.freeze([91.1, 70.6]); // widest point: flank wall meets the rear diagonal
const REAR_CORNER = Object.freeze([41.16, Z.rearEave]); // rear diagonal meets the centre facet
const FLANK_SLOPE = (SHOULDER[0] - STAGE_HALF) / (SHOULDER[1] - Z.stageEndFacade); // 0.664 m per m
const DIAG_SLOPE = (SHOULDER[0] - REAR_CORNER[0]) / (REAR_CORNER[1] - SHOULDER[1]); // 1.506 m per m

/**
 * Roof outline (PLATEAU survey, symmetrised sharp hexagon) as a world [x, z] ring, starting
 * at the house-right stage-end corner and running house-right flank → rear → house-left flank.
 * On the three rear facets this is the TIP OF THE EAVE; on the flanks and the stage end it
 * is the outer wall face.
 */
export const ROOF_OUTLINE = Object.freeze([
  [STAGE_HALF, Z.stageEndFacade],
  [SHOULDER[0], SHOULDER[1]],
  [REAR_CORNER[0], REAR_CORNER[1]],
  [-REAR_CORNER[0], REAR_CORNER[1]],
  [-SHOULDER[0], SHOULDER[1]],
  [-STAGE_HALF, Z.stageEndFacade],
]);

/** Half width of the roof outline at station z (0 outside the building). */
export function outerHalfWidth(z) {
  if (z < Z.stageEndFacade || z > Z.rearEave) return 0;
  if (z <= SHOULDER[1]) return STAGE_HALF + FLANK_SLOPE * (z - Z.stageEndFacade);
  return SHOULDER[0] - DIAG_SLOPE * (z - SHOULDER[1]);
}

/**
 * Hall side walls run parallel to the outer flank walls. Half width at station z of
 *   the hall wall face (5.2 m wall zone inside the outer face),
 *   the front edge of the 2.8 m deep technical galleries on that wall.
 */
export function hallHalfWidth(z) {
  return 14.96 + FLANK_SLOPE * (z - Z.stageEndFacade);
}
export function galleryFrontHalfWidth(z) {
  return 11.6 + FLANK_SLOPE * (z - Z.stageEndFacade);
}

/** Unit vectors in world XZ of the house-right flank: along the wall (toward the rear) and its outward normal. */
export const FLANK_DIR = Object.freeze((() => {
  const l = Math.hypot(FLANK_SLOPE, 1);
  return [FLANK_SLOPE / l, 1 / l];
})());
export const FLANK_NORMAL = Object.freeze([FLANK_DIR[1], -FLANK_DIR[0]]);

/** Rear colonnade: 24 column centres, world [x, z] (10 on the centre facet, 7 on each diagonal). */
export const COLUMNS = Object.freeze(SPEC.facade.columns.positions_G.map(([x, y]) => Object.freeze(G(x, y))));
export const COLUMN_SIZE = SPEC.facade.columns.section_m; // 1.2 m square
export const COLUMN_TOP_Y = SPEC.facade.columns.topElevation_m; // 37.27

/** LEVEL 3 outer wall line of the whole building (world ring), including the glass-box projection. */
export const L3_WALL_RING = Object.freeze(SPEC.facade.rearWall.l3WallPolygon_G.map(([x, y]) => Object.freeze(G(x, y))));

/** Glass box on the centre facet: plan rectangle and height range. */
export const GLASS_BOX = Object.freeze({
  doorZ: 94.55, // LEVEL 3 main entrance threshold between the columns
  halfWidth: SPEC.facade.glassBox.width_m / 2, // 23
  zBack: Z.l3RearWall,
  zFront: Z.glassBoxFace,
  y0: LEVEL_Y[3],
  y1: SPEC.facade.glassBox.topElevation_m, // 32
});

// --- roof ------------------------------------------------------------------------------
export const ROOF_RIDGE_Y = 45.0; // official building height; ridge above the rear column line
const ROOF_SLOPE = Math.tan((4.65 * Math.PI) / 180); // falls toward the stage

/**
 * Top surface of the main (raised) roof at world (x, z): one plane falling 4.65° from the
 * ridge toward the stage, with a shallow crown along the axis. Valid for z ≤ Z.columnLine;
 * beyond the ridge the eave skirt takes over (owned by the exterior module).
 */
export function roofY(x, z) {
  const zz = Math.min(z, Z.columnLine);
  const t = (zz - Z.raisedRoofStart) / (Z.columnLine - Z.raisedRoofStart);
  const crownHalf = 22.3 + (38.3 - 22.3) * Math.min(Math.max(t, 0), 1);
  const crown = 1.1 * Math.max(0, 1 - Math.abs(x) / crownHalf);
  return ROOF_RIDGE_Y - ROOF_SLOPE * (Z.columnLine - zz) + crown;
}

/** Low roof strip over the backstage block (stage-end facade to Z.raisedRoofStart). */
export const BACKSTAGE_ROOF_Y = 33.3;

/** Roof trusses span from the stage rear wall to the rear column line (18 of them). */
export function trussBottomY(z) {
  return 30.7 + 0.0768 * (z - Z.stageRearWall);
}
export function trussTopY(z) {
  return 35.1 + ((ROOF_RIDGE_Y - 35.1) / (Z.columnLine - Z.stageRearWall)) * (z - Z.stageRearWall);
}

// --- stands ----------------------------------------------------------------------------
/**
 * Front and back planes of every stand part in its facet coordinate v (see seating.js):
 * the front edge of the first tread and the back edge of the last tread.
 *   STAND_EXTENT['L7/C'] → { tier, facet, vFront, vBack, yFront, yBack, rowFirst, rowLast }
 */
export const STAND_EXTENT = Object.freeze(
  Object.fromEntries(
    PARTS.filter((p) => p.tier !== 1).map((p) => {
      const first = p.rows[0];
      const last = p.rows[p.rows.length - 1];
      return [
        p.key,
        Object.freeze({
          tier: p.tier,
          facet: p.facet,
          vFront: first.v - TREAD_FRONT,
          vBack: last.v + TREAD_BACK,
          yFront: first.y,
          yBack: last.y,
          rowFirst: first.row,
          rowLast: last.row,
        }),
      ];
    }),
  ),
);

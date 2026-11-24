// Layout of the hall's stage-end envelope: wall frames, stations along the side walls,
// gallery levels and ends, curtain bands, openings.
//
// Everything on a wall is modelled in a LOCAL wall frame (s, y, d):
//   s  metres along the wall face (side walls: from the rear-wall corner toward the audience;
//      stage rear wall: from the house-left corner toward house right)
//   y  height above the arena floor
//   d  distance in front of the wall face (positive = into the hall, negative = into the wall)
// (s, y, d) is right-handed, so a viewer standing in the hall sees s grow to the right.
// The house-left side wall is the mirror image of the house-right one (FRAME_L.mirror).
import { LEVEL_Y, Z, hallHalfWidth, FLANK_DIR, FLANK_NORMAL, trussBottomY, STAND_EXTENT } from '../../core/envelope.js';
import { FACETS, PARTS, TREAD_FRONT, GATES, worldToUV, rowElevation } from '../../core/seating.js';
import { SPEC } from '../../core/spec.js';

// --- frames -------------------------------------------------------------------------------------
export const HALF_REAR = hallHalfWidth(Z.stageRearWall); // 26.58: half of the 53.2 m rear wall face
export const REAR_LEN = 2 * HALF_REAR;
const T = FLANK_DIR; // along the house-right wall, toward the audience
const N = [-FLANK_NORMAL[0], -FLANK_NORMAL[1]]; // into the hall

export const FRAME_R = Object.freeze({ name: 'R', ox: HALF_REAR, oz: Z.stageRearWall, tx: T[0], tz: T[1], nx: N[0], nz: N[1], mirror: false });
export const FRAME_L = Object.freeze({ ...FRAME_R, name: 'L', mirror: true });
export const FRAME_B = Object.freeze({ name: 'B', ox: -HALF_REAR, oz: Z.stageRearWall, tx: 1, tz: 0, nx: 0, nz: 1, mirror: false });

/** Local (s, d) of a frame → world [x, z]. */
export function toWorld(f, s, d = 0) {
  const x = f.ox + s * f.tx + d * f.nx;
  return [f.mirror ? -x : x, f.oz + s * f.tz + d * f.nz];
}

/**
 * Mitre of the rear-wall / side-wall corner (interior angle 123.6°): a line at inset d starts
 * at s = MITRE·d on a side wall, and runs from MITRE·d to REAR_LEN − MITRE·d on the rear wall.
 */
export const MITRE = T[1] / (1 + N[1]); // tan(56.4° / 2) = 0.536

// Wall thicknesses agreed with arena/structure (its flank service zone and backstage block
// start at the back of these walls).
export const SIDE_T = 0.54;
export const REAR_T = 0.45;
/** The poche (flank service zone) between the hall side wall and the outer flank wall: 5.19 m. */
export const POCHE_D = -(SPEC.hall.sideWalls.wallZoneThickness_m - 0.5); // my fill stops 0.5 m short of the outer face

// --- stations along a side wall ---------------------------------------------------------------------
const VDIR = FACETS.RW.v;
const V0 = HALF_REAR * VDIR[0] + Z.stageRearWall * VDIR[1];
const TV = T[0] * VDIR[0] + T[1] * VDIR[1];
/** Seat-kernel wing coordinate v (row-to-row axis of the wing facet) → s on the side wall. */
export const sOfV = (v) => (v - V0) / TV;
/** World z of the wall-face point at s. */
export const zOfS = (s) => Z.stageRearWall + s * T[1];
/** s of the point whose GALLERY FRONT (d = GALLERY_D) lies at world z. */
export const sOfFrontZ = (z) => (z - Z.stageRearWall - GALLERY_D * N[1]) / T[1];
/** Underside of the roof trusses above the side wall at s (the wall stops 50 mm short of it). */
export const wallTop = (s) => trussBottomY(zOfS(s)) - 0.05;
export const REAR_TOP = trussBottomY(Z.stageRearWall) - 0.05;

const rowV = (key, row) => PARTS.find((p) => p.key === key).rows.find((r) => r.row === row).v;
/** Where the stands meet the side wall (their front and back planes are square to it). */
export const STAND_S = Object.freeze({
  teleFront: sOfV(STAND_EXTENT['L3/RW'].vFront), // 40.8  front of the deployed telescopic rows 1-11
  fixedFront: sOfV(rowV('L3/RW', 12) - TREAD_FRONT), // 50.5  front wall of the fixed Lower Stand
  lowerBack: sOfV(STAND_EXTENT['L3/RW'].vBack), // 65.3
  middleFront: sOfV(STAND_EXTENT['L5/RW'].vFront), // 60.1
  middleBack: sOfV(STAND_EXTENT['L5/RW'].vBack), // 81.5
  upperFront: sOfV(STAND_EXTENT['L7/RW'].vFront), // 76.2
  upperBack: sOfV(STAND_EXTENT['L7/RW'].vBack), // 97.6
  // rear wall of the hall behind the cross-aisle of the Lower Stand: 0.75 m in front of the
  // gate 304 marker (arena/structure puts the LEVEL 3 gate wall on the same line)
  lowerRearWall: sOfV(worldToUV('RW', GATES['304'][0], GATES['304'][1])[1] - 0.75), // 68.8
});
/**
 * Tread lines of the three stands where they meet the side wall: [s0, y0, s1, y1], through
 * the front edge of the first tread and the back edge of the last one.
 */
export const STAND_LINE = Object.freeze({
  lower: [STAND_S.fixedFront, rowElevation(3, 12), STAND_S.lowerBack, rowElevation(3, 30)],
  middle: [STAND_S.middleFront, rowElevation(5, 1), STAND_S.middleBack, rowElevation(5, 27)],
  upper: [STAND_S.upperFront, rowElevation(7, 3), STAND_S.upperBack, rowElevation(7, 29)],
});
export const SIDE_END = STAND_S.upperBack + 0.3; // the side wall stops with the Upper Stand

// --- galleries (演出用バルコニー) ----------------------------------------------------------------
const PG = SPEC.hall.productionGalleries;
export const GALLERY_D = PG.depth_m; // 2.8
export const RAIL_H = PG.railingHeight_m; // 1.1
export const GALLERY_LEVELS = Object.freeze([3, 5, 6, 7]);
export const BAY = PG.curtainBayWhenTied_m; // 4.5 m structural / curtain bay

/**
 * Audience-side end of each side gallery (s).
 *  'photo' (default): read off the frontal and oblique official photographs with the bowl
 *     registered: the 3F gallery stops at the front line of the deployed telescopic stand,
 *     the 5F gallery above the front wall of the fixed Lower Stand, the 6F and 7F galleries
 *     at the wing fronts of the Middle and Upper Stand. (The designers' section suggests
 *     z = 22 / 29 / 30 / 39.)
 *  'spec': research/model-spec.json sideGalleryEndY_H = 24.9 / 34.6 / 34.6 / 47.9.
 */
export function galleryEnds(variant = 'photo') {
  const clear = 0.15; // stay clear of the stand fronts (owned by arena/bowl)
  const e6 = Math.min(sOfFrontZ(PG.sideGalleryEndY_H[2]), STAND_S.middleFront - clear);
  const e7 = Math.min(sOfFrontZ(PG.sideGalleryEndY_H[3]), STAND_S.upperFront - clear);
  if (variant === 'spec') return { 3: STAND_S.fixedFront - clear, 5: e6, 6: e6, 7: e7 };
  return { 3: STAND_S.teleFront, 5: STAND_S.fixedFront + 0.55, 6: e6, 7: e7 };
}

// Gallery build-up (metres relative to the gallery floor level L)
export const G = Object.freeze({
  topping: 0.07, // pale concrete walkway
  deck: 0.08, // steel deck under it
  slabD: 2.6, // the slab runs from the wall to the back of the edge beam
  beamDepth: 0.45, // edge beam (H-section, flanges 200 mm)
  beamTop: 0.03, // … its top flange stands 30 mm proud of the walkway (kerb)
  crossDepth: 0.3, // cantilever brackets under the slab, one per bay
  crossW: 0.15,
  railD: 2.72, // centre line of the handrail
  postPitch: 1.0,
});
/** Underside of the cantilever brackets = head of the curtain of the band below. */
export const soffitY = (L) => L - G.topping - G.deck - G.crossDepth;

// --- curtain bands ------------------------------------------------------------------------------------
export const CURTAIN_D = 0.42; // centre plane of the pleats in front of the wall face
/**
 * Curtain bands: { level tag, y0, y1, sideEnd (s where the band stops on the side walls) }.
 * Three bands stand on the 3F / 5F / 6F galleries, one hangs at arena level behind and beside
 * the stage (it stops where the nozzle fascia starts).
 */
export function curtainBands(ends) {
  return [
    { level: 1, under: 3, y0: 0.02, y1: soffitY(LEVEL_Y[3]) - 0.02, sideEnd: NOZZLE_S0 - 0.2 },
    { level: 3, under: 5, y0: LEVEL_Y[3] + 0.02, y1: soffitY(LEVEL_Y[5]) - 0.02, sideEnd: ends[3] - 2.6 },
    { level: 5, under: 6, y0: LEVEL_Y[5] + 0.02, y1: soffitY(LEVEL_Y[6]) - 0.02, sideEnd: ends[5] - 0.6 },
    { level: 6, under: 7, y0: LEVEL_Y[6] + 0.02, y1: soffitY(LEVEL_Y[7]) - 0.02, sideEnd: ends[6] - 0.8 },
  ];
}

// --- arena level --------------------------------------------------------------------------------------
/**
 * The black fascia under the 3F side gallery with the round air-supply nozzles starts beside
 * the stage front and runs to the end of the gallery (official frontal photo: from the stage
 * front line to the telescopic stand).
 */
export const NOZZLE_S0 = 20.2;
export const NOZZLE = Object.freeze({
  y0: 5.45, // underside of the plenum
  d0: 1.55, // back of the plenum box
  d1: 2.78, // fascia face, just behind the outer face of the edge beam
  dia: PG.nozzlePortDiameter_m, // 0.5
});
/** 16 ports counted on three high-resolution photos (the spec's estimate is 11). */
export function nozzlePorts(variant, sEnd) {
  const n = variant === 'spec' ? PG.nozzlePortsPerSide : 16;
  const len = sEnd - NOZZLE_S0;
  const pitch = Math.min(1.2, (len - 1.6) / (n - 1));
  const s0 = NOZZLE_S0 + (len - pitch * (n - 1)) / 2;
  return Array.from({ length: n }, (_, i) => s0 + i * pitch);
}

const LOAD = SPEC.production.loading;
/**
 * Openings at arena level (per side wall, s ranges).
 *  truck: the large side entrance for 11 t trucks = GATE 101 / 104 at the side end of the arena
 *         cross-aisle, in the black wall between the end of the 3F gallery and the fixed stand
 *         (frontal photo: 6.6 m wide, top at about +4.6; the exterior door of model-spec
 *         production.loading lies straight behind it across the wall zone).
 *  service: the wide door under the nozzle fascia seen open in the Theatre Workshop photo.
 */
export const OPENINGS = Object.freeze({
  truck: Object.freeze({ s0: STAND_S.teleFront + 1.5, s1: STAND_S.fixedFront - 1.55, h: 4.6, depth: 2.6 }),
  service: Object.freeze({ s0: STAND_S.teleFront - 8.2, s1: STAND_S.teleFront - 8.2 + LOAD.doorWidth_m, h: 3.9 }),
  /** Stage-rear truck doors at both ends of the rear wall (rear-frame s of the house-left one). */
  rear: Object.freeze({ s0: 2.4, s1: 2.4 + LOAD.doorWidth_m, h: 4.4 }),
});

/** Level bands of the walls for the floor selector: [level, y0, y1]. */
export const LEVEL_BANDS = Object.freeze(
  [1, 2, 3, 4, 5, 6, 7, 8, 9].map((lv) => Object.freeze([lv, LEVEL_Y[lv], lv === 9 ? Infinity : LEVEL_Y[lv + 1]])),
);

export { LEVEL_Y };

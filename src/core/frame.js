// Coordinate frames of the K-Arena Yokohama twin. Pure math, no three.js import,
// so it runs unchanged in Node (tests, bake scripts) and in the browser.
//
// WORLD frame (three.js, metres, right-handed, Y up) — everything in the scene uses it:
//   origin  centre of the stage-front line, on the arena floor (LEVEL 1 finished floor)
//   +X      audience right when facing the stage (seat numbers grow with +X);
//           geographically the SOUTH side of the building (bearing 213.25°)
//   +Y      up; y = 0 is the arena floor = outdoor ground level (4.18 m T.P.)
//   +Z      away from the stage toward the rear / main entrance (bearing 303.25°, WNW)
//   The audience therefore looks toward −Z, like a default three.js camera.
//   The building is mirror-symmetric about the plane x = 0.
//
// SEAT frame (research/seatmap.md): plan X = audience right, Y = away from the stage,
//   Z = up.  world = (X, Z, Y).
//
// GEO-ARENA frame (research/geo/karena-arena-frame.json, PLATEAU survey outline):
//   origin S0 = centre of the stage-end outer wall, Yg along the axis toward the rear,
//   Xg toward the NORTH flank (bearing 33.25°).  world.x = −Xg, world.z = Yg − STAGE_FRONT_YG.

export const DEG = Math.PI / 180;

export const GEO = Object.freeze({
  /** lon/lat of S0, the centre of the stage-end outer wall (PLATEAU 2024 outline). */
  originLonLat: [139.6314284, 35.4641981],
  /** True bearing of the hall axis, stage → rear. */
  axisBearingDeg: 303.25,
  /**
   * Distance from the stage-end outer wall to the stage-front line, along the axis
   * (research/model-spec.json hall.stageFrontOffset_m): 17.5 m backstage block + the
   * stage front 17.2 m in front of the stage rear wall. The stage is a demountable kit,
   * so this is its standard position (±1 m).
   */
  stageFrontYg: 34.7,
  /** The arena floor is taken as the site ground level (both y = 0). */
  groundY: 0,
  /** Elevation of that datum above Tokyo Peil (PLATEAU wall base), for reference. */
  arenaFloorTP: 4.18,
});

export const GROUND_Y = GEO.groundY;

// WGS84 radii of curvature at the origin latitude (local tangent-plane approximation,
// better than 1 cm over the ~700 m this model covers).
const A = 6378137.0;
const E2 = 0.00669437999014;
const lat0 = GEO.originLonLat[1] * DEG;
const W = Math.sqrt(1 - E2 * Math.sin(lat0) ** 2);
const N_RADIUS = A / W;
const M_RADIUS = (A * (1 - E2)) / (W * W * W);
const M_PER_DEG_LON = N_RADIUS * Math.cos(lat0) * DEG;
const M_PER_DEG_LAT = M_RADIUS * DEG;

const b = GEO.axisBearingDeg * DEG;
// Unit vectors of the geo-arena axes expressed in (east, north).
const YG_E = Math.sin(b);
const YG_N = Math.cos(b);
const XG_E = Math.sin(b + Math.PI / 2);
const XG_N = Math.cos(b + Math.PI / 2);

/** lon/lat (degrees) → east/north metres from S0. */
export function lonLatToEN(lon, lat) {
  return [(lon - GEO.originLonLat[0]) * M_PER_DEG_LON, (lat - GEO.originLonLat[1]) * M_PER_DEG_LAT];
}

/** lon/lat → geo-arena frame [Xg, Yg]. */
export function lonLatToGeoArena(lon, lat) {
  const [e, n] = lonLatToEN(lon, lat);
  return [e * XG_E + n * XG_N, e * YG_E + n * YG_N];
}

/** geo-arena frame → world [x, z]. */
export function geoArenaToWorld(xg, yg) {
  return [-xg, yg - GEO.stageFrontYg];
}

/**
 * Spec helpers. Fields of src/core/spec.js that end in _G are in the geo-arena frame and
 * fields that end in _H in the hall frame (origin at the stage front, +X = house-LEFT).
 * Both return world [x, z]; note the sign flip of X (world +X = house-RIGHT).
 */
export function G(xg, yg) {
  return [-xg, yg - GEO.stageFrontYg];
}
export function H(xh, yh) {
  return [-xh, yh];
}

/** lon/lat → world [x, z] (horizontal position; add your own y). */
export function lonLatToWorld(lon, lat) {
  const [xg, yg] = lonLatToGeoArena(lon, lat);
  return geoArenaToWorld(xg, yg);
}

/** world [x, z] → [lon, lat]. */
export function worldToLonLat(x, z) {
  const xg = -x;
  const yg = z + GEO.stageFrontYg;
  const e = xg * XG_E + yg * YG_E;
  const n = xg * XG_N + yg * YG_N;
  return [GEO.originLonLat[0] + e / M_PER_DEG_LON, GEO.originLonLat[1] + n / M_PER_DEG_LAT];
}

/** Seat-frame plan point (X, Y) at height Zup → world [x, y, z]. */
export function seatToWorld(X, Y, Zup = 0) {
  return [X, Zup, Y];
}

/** World-space unit vectors (x, z) of the compass directions. */
export const NORTH_XZ = Object.freeze(geoArenaToWorldDir(XG_N, YG_N));
export const EAST_XZ = Object.freeze(geoArenaToWorldDir(XG_E, YG_E));

function geoArenaToWorldDir(xg, yg) {
  return [-xg, yg];
}

/** True compass bearing (degrees, 0 = north, clockwise) of a world-space direction (dx, dz). */
export function bearingOfWorldDir(dx, dz) {
  const n = dx * NORTH_XZ[0] + dz * NORTH_XZ[1];
  const e = dx * EAST_XZ[0] + dz * EAST_XZ[1];
  return (Math.atan2(e, n) / DEG + 360) % 360;
}

/** World-space unit direction (dx, dz) for a compass bearing in degrees. */
export function worldDirOfBearing(bearingDeg) {
  const r = bearingDeg * DEG;
  const e = Math.sin(r);
  const n = Math.cos(r);
  return [e * EAST_XZ[0] + n * NORTH_XZ[0], e * EAST_XZ[1] + n * NORTH_XZ[1]];
}

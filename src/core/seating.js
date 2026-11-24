// Seating kernel: turns the official row-by-row seat map into world-space seats.
// Pure math (no three.js), usable from Node and the browser.
//
// Every stand tier is three straight facets — a centre section (C) whose rows are
// perpendicular to the hall axis and two wings (LW = audience left, RW = audience
// right) rotated 33.6° toward the stage.  A row is the line v = const in its facet
// frame; u runs along the row and grows with the seat number.
import SEATMAP from '../data/seatmap.js';
import { DEG } from './frame.js';

export const WING_ANGLE = SEATMAP.frame.wingAngleDeg * DEG; // 33.6°

// Registration of the seat-map frame on the building (research/model-spec.json, hall.*):
// the report's metric scale is reduced by 3 % and the seat datum (front edge of the
// official LEVEL 1 seating outline) lies 1.2 m in front of the stage-front line. This
// satisfies four independent anchors at once: the 53.0 m flat-floor depth on the JATET
// section, the surveyed rear column line, the 62.5 m ribbon display on the Upper Stand
// front and the fan apex on the bisector through the surveyed rear corners.
export const SEATMAP_SCALE = 0.97;
export const SEAT_DATUM_Z = 1.2;

export const SEAT_PITCH = SEATMAP.frame.seatPitch * SEATMAP_SCALE; // 0.494 m centre to centre
export const BALCONY_SEAT_PITCH = SEATMAP.frame.balconySeatPitch * SEATMAP_SCALE; // 0.553 m
export const ROW_TREAD = SEATMAP.frame.rowTread * SEATMAP_SCALE; // 0.8245 m
/** World z of the point where the centre/wing bisector lines meet (behind the stage): −32.6. */
export const FAN_APEX_Z = SEATMAP.frame.apexY * SEATMAP_SCALE + SEAT_DATUM_Z;
/** A tread reaches this far in front of / behind its row line (the line of seat centres). */
export const TREAD_FRONT = 0.48;
export const TREAD_BACK = ROW_TREAD - TREAD_FRONT;

/**
 * Floor height (m above the arena floor) of a row, from the reconciled section
 * (research/model-spec.json, tiers[].rowElevation).
 */
export function rowElevation(tier, row) {
  if (tier === 3) return row <= 11 ? 0.25 * row : 3.1 + 0.2353 * (row - 12);
  if (tier === 5) return 10.2 + 0.316 * (row - 1);
  if (tier === 7) return 23.43 + 0.483 * (row - 1);
  return 0;
}

const COS = Math.cos(WING_ANGLE);
const SIN = Math.sin(WING_ANGLE);

/**
 * Facet frames in world XZ. `u` = unit vector along the rows (toward higher seat numbers),
 * `v` = unit vector from row to row, away from the stage. `rotY` = rotation about +Y that
 * turns an object modelled facing −Z (toward the stage) to face the way this facet's seats face.
 */
export const FACETS = Object.freeze({
  C: Object.freeze({ u: [1, 0], v: [0, 1], rotY: 0 }),
  LW: Object.freeze({ u: [COS, SIN], v: [-SIN, COS], rotY: -WING_ANGLE }),
  RW: Object.freeze({ u: [COS, -SIN], v: [SIN, COS], rotY: WING_ANGLE }),
});

/** Plan point of the raw seat-map frame (research/seatmap.md) → world [x, z]. */
export function seatPlanToWorld(X, Y) {
  return [X * SEATMAP_SCALE, Y * SEATMAP_SCALE + SEAT_DATUM_Z];
}

/** Facet coordinates (u, v) → world [x, z]. */
export function uvToWorld(facet, u, v) {
  const f = FACETS[facet];
  return [u * f.u[0] + v * f.v[0], u * f.u[1] + v * f.v[1]];
}

/** World [x, z] → facet coordinates [u, v]. */
export function worldToUV(facet, x, z) {
  const f = FACETS[facet];
  return [x * f.u[0] + z * f.u[1], x * f.v[0] + z * f.v[1]];
}

/** Human names of the tiers, keyed by LEVEL number. */
export const TIER_INFO = Object.freeze({
  1: { level: 1, name: 'ARENA', ja: 'アリーナ', ko: '아레나' },
  3: { level: 3, name: 'LOWER STAND', ja: 'ロアースタンド', ko: '로어 스탠드' },
  5: { level: 5, name: 'MIDDLE STAND', ja: 'ミドルスタンド', ko: '미들 스탠드' },
  7: { level: 7, name: 'UPPER STAND', ja: 'アッパースタンド', ko: '어퍼 스탠드' },
});

function kindOf(tier, balcony, row) {
  if (balcony) return 'balcony'; // red Cadenza TS-71 seats, LEVEL 5 centre rows 1-3
  if (tier === 1) return 'arena'; // movable Lux seats on the flat floor
  if (tier === 3 && row <= 11) return 'telescopic'; // retractable front of the Lower Stand
  return 'stand'; // fixed blue Lux seats
}

/**
 * PARTS: one entry per tier facet, in the order of the dataset.
 *   { key, tier, facet, balcony, rows: [{ row, v, y, kind, segs: [{ first, last, n, u0, u1, pitch }] }] }
 * `v` is the row line in facet coordinates, `y` the floor height of the row above the arena floor.
 * `u0`/`u1` are the ends of the seat run (seat edges, not centres); `pitch` the seat spacing used.
 */
export const PARTS = Object.freeze(
  Object.entries(SEATMAP.parts).map(([key, part]) => {
    const [tierStr, facetStr] = key.split('/');
    const tier = Number(tierStr.slice(1));
    const balcony = facetStr.includes('balcony');
    const facet = balcony ? 'C' : facetStr;
    const nominal = balcony ? BALCONY_SEAT_PITCH : SEAT_PITCH;
    // Scale about the seat datum, then shift the datum to its place in the world frame;
    // the shift (0, SEAT_DATUM_Z) is resolved into this facet's (u, v) axes.
    const du = SEAT_DATUM_Z * FACETS[facet].u[1];
    const dv = SEAT_DATUM_Z * FACETS[facet].v[1];
    const rows = part.rows.map(([row, vSeat, , segs]) => ({
      row,
      v: vSeat * SEATMAP_SCALE + dv,
      y: rowElevation(tier, row),
      kind: kindOf(tier, balcony, row),
      segs: segs.map(([first, last, uStart, uEnd]) => {
        const n = last - first + 1;
        let u0 = uStart * SEATMAP_SCALE + du;
        let u1 = uEnd * SEATMAP_SCALE + du;
        let pitch = (u1 - u0) / n;
        // A few short stubs are drawn longer than their seat count on the official map;
        // keep the real seat spacing and centre the run on the drawn bar.
        if (pitch > nominal * 1.12) {
          const mid = (u0 + u1) / 2;
          pitch = nominal;
          u0 = mid - (n * pitch) / 2;
          u1 = mid + (n * pitch) / 2;
        }
        return Object.freeze({ first, last, n, u0, u1, pitch });
      }),
    }));
    return Object.freeze({ key, tier, facet, balcony, name: part.name, rows: Object.freeze(rows) });
  }),
);

/** Parts of one tier (LEVEL 1, 3, 5 or 7). */
export function partsOfTier(tier) {
  return PARTS.filter((p) => p.tier === tier);
}

/** World position of one seat of a row segment: [x, y, z]; y is the floor the seat stands on. */
export function seatPosition(part, rowEntry, seg, index) {
  const u = seg.u0 + (index + 0.5) * seg.pitch;
  const [x, z] = uvToWorld(part.facet, u, rowEntry.v);
  return [x, rowEntry.y, z];
}

/**
 * Visit every seat. The callback receives one reused object — copy what you keep:
 *   { tier, part, facet, row, num, kind, x, y, z, rotY, index }
 * (x, y, z) is the centre of the seat at floor level, rotY the facing (see FACETS).
 */
export function forEachSeat(cb) {
  const s = { tier: 0, part: '', facet: 'C', row: 0, num: 0, kind: 'stand', x: 0, y: 0, z: 0, rotY: 0, index: 0 };
  let index = 0;
  for (const part of PARTS) {
    const f = FACETS[part.facet];
    for (const r of part.rows) {
      for (const seg of r.segs) {
        for (let i = 0; i < seg.n; i++) {
          const u = seg.u0 + (i + 0.5) * seg.pitch;
          s.tier = part.tier;
          s.part = part.key;
          s.facet = part.facet;
          s.row = r.row;
          s.num = seg.first + i;
          s.kind = r.kind;
          s.x = u * f.u[0] + r.v * f.v[0];
          s.y = r.y;
          s.z = u * f.u[1] + r.v * f.v[1];
          s.rotY = f.rotY;
          s.index = index++;
          cb(s);
        }
      }
    }
  }
  return index;
}

/** Number of seats drawn on the official map (19,893; the venue total of 20,033 adds VIP boxes and wheelchair places). */
export const MAPPED_SEAT_COUNT = forEachSeat(() => {});

/** Seat counts per tier and per kind. */
export function seatStats() {
  const byTier = {};
  const byKind = {};
  forEachSeat((s) => {
    byTier[s.tier] = (byTier[s.tier] || 0) + 1;
    byKind[s.kind] = (byKind[s.kind] || 0) + 1;
  });
  return { total: MAPPED_SEAT_COUNT, byTier, byKind };
}

/**
 * Look a seat up the way a ticket names it: LEVEL (1/3/5/7), row (列) and seat number (番).
 * Returns { tier, part, facet, row, num, kind, x, y, z, rotY } or null when that seat does not exist.
 */
export function findSeat(tier, row, num) {
  if (!Number.isInteger(num)) return null;
  for (const part of PARTS) {
    if (part.tier !== tier) continue;
    for (const r of part.rows) {
      if (r.row !== row) continue;
      for (const seg of r.segs) {
        if (num < seg.first || num > seg.last) continue;
        const [x, y, z] = seatPosition(part, r, seg, num - seg.first);
        return { tier, part: part.key, facet: part.facet, row, num, kind: r.kind, x, y, z, rotY: FACETS[part.facet].rotY };
      }
    }
  }
  return null;
}

/** Rows that exist on a tier, each with the seat numbers present: [{ row, ranges: [[first, last], ...] }]. */
export function rowsOfTier(tier) {
  const map = new Map();
  for (const part of PARTS) {
    if (part.tier !== tier) continue;
    for (const r of part.rows) {
      if (!map.has(r.row)) map.set(r.row, []);
      for (const seg of r.segs) map.get(r.row).push([seg.first, seg.last]);
    }
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([row, ranges]) => ({ row, ranges: ranges.sort((a, b) => a[0] - b[0]) }));
}

/**
 * Eye position and view direction of a seated spectator in a given seat (world space).
 * `target` defaults to the centre of the stage front at performer height.
 */
export function seatView(seat, target = [0, 1.8 + 1.6, -4]) {
  const eye = [seat.x, seat.y + 1.15, seat.z];
  return { eye, target };
}

/**
 * Gate (扉) markers of the official map in world XZ: { '301': [x, z], ... }.
 * 1xx = arena, 3xx = top of the Lower Stand, 5xx / 7xx = vomitories of the Middle / Upper Stand.
 */
export const GATES = Object.freeze(
  Object.fromEntries(Object.entries(SEATMAP.gateMarkers).map(([id, [X, Y]]) => [id, Object.freeze(seatPlanToWorld(X, Y))])),
);

/** Plan outlines from the official map, as world [x, z] rings. */
export const SEAT_OUTLINES = Object.freeze({
  arenaSeatingZone: SEATMAP.outlines.L1_arena_seating_zone.map(([X, Y]) => seatPlanToWorld(X, Y)),
  lowerStandZone: SEATMAP.outlines.L3_stand_zone.map(([X, Y]) => seatPlanToWorld(X, Y)),
  wheelchairPlatform: SEATMAP.outlines.L3_wheelchair_platform.map(([X, Y]) => seatPlanToWorld(X, Y)),
});

/** The bisector line between the centre facet and a wing: world x at a given z (sign = side). */
export function junctionX(z, side = 1) {
  return side * (z - FAN_APEX_Z) * Math.tan(WING_ANGLE / 2);
}

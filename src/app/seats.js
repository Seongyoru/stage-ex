// Seat-view logic: seat lookup and neighbours, the view from a seat, distances to the
// stage, and picking a seat by clicking the instanced seat meshes.
import * as THREE from 'three';
import { findSeat, rowsOfTier, seatView, forEachSeat, GATES, TIER_INFO, PARTS, seatPosition, FACETS } from '../core/seating.js';
import { SPEC } from '../core/spec.js';

export const TIERS = [1, 3, 5, 7];
export { TIER_INFO };

const rowsCache = new Map();
/** Rows of a tier: [{ row, ranges: [[first, last], …] }] (cached). */
export function rowsOf(tier) {
  if (!rowsCache.has(tier)) rowsCache.set(tier, rowsOfTier(tier));
  return rowsCache.get(tier);
}

export function rowEntry(tier, row) {
  return rowsOf(tier).find((r) => r.row === row) || null;
}

/** Seat numbers that exist in a row, ascending. */
export function seatNumbers(tier, row) {
  const e = rowEntry(tier, row);
  if (!e) return [];
  const out = [];
  for (const [a, b] of e.ranges) for (let n = a; n <= b; n++) out.push(n);
  return out;
}

/** Nearest existing seat number of a row to `num`. */
export function clampSeat(tier, row, num) {
  const e = rowEntry(tier, row);
  if (!e) return null;
  let best = null;
  let bestD = Infinity;
  for (const [a, b] of e.ranges) {
    const c = Math.min(b, Math.max(a, Math.round(num)));
    const d = Math.abs(c - num);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

/** A valid seat for loosely given numbers (deep links): clamps the row and the seat number. */
export function resolveSeat(tier, row, num) {
  if (!TIERS.includes(tier)) tier = 5;
  const rows = rowsOf(tier);
  let r = rows.find((x) => x.row === row);
  if (!r) r = rows.reduce((best, x) => (Math.abs(x.row - row) < Math.abs(best.row - row) ? x : best), rows[0]);
  const n = clampSeat(tier, r.row, Number.isFinite(num) ? num : Math.round((r.ranges[0][0] + r.ranges[r.ranges.length - 1][1]) / 2));
  return findSeat(tier, r.row, n);
}

/** Seats outside the official numbering: VIP box seats (LEVEL 6) and wheelchair companion chairs. */
export function isSpecial(seat) {
  return !!seat && (seat.special === true || !TIERS.includes(seat.tier) || seat.kind === 'vip' || seat.kind === 'companion');
}

/** The next existing seat to the left (-1) or right (+1) in the same row, or null at the end. */
export function adjacentSeat(seat, dir) {
  if (isSpecial(seat)) return null;
  const nums = seatNumbers(seat.tier, seat.row);
  const i = nums.indexOf(seat.num);
  const n = nums[i + dir];
  return n === undefined ? null : findSeat(seat.tier, seat.row, n);
}

/** The physically nearest seat in the row in front (-1) or behind (+1), or null. */
export function adjacentRow(seat, dir) {
  if (isSpecial(seat)) return null;
  const rows = rowsOf(seat.tier);
  const i = rows.findIndex((r) => r.row === seat.row);
  // rows of a tier can skip numbers (e.g. no rows 4-5 in the Middle Stand centre): walk
  // until a row has a seat reasonably close to this one
  for (let j = i + dir; j >= 0 && j < rows.length; j += dir) {
    const near = nearestSeatInRow(seat.tier, rows[j].row, seat.x, seat.z);
    if (near && Math.hypot(near.x - seat.x, near.z - seat.z) < 6.5) return near;
  }
  return null;
}

function nearestSeatInRow(tier, row, x, z) {
  let best = null;
  let bestD = Infinity;
  for (const part of PARTS) {
    if (part.tier !== tier) continue;
    for (const r of part.rows) {
      if (r.row !== row) continue;
      for (const seg of r.segs) {
        for (let i = 0; i < seg.n; i++) {
          const [sx, sy, sz] = seatPosition(part, r, seg, i);
          const d = (sx - x) ** 2 + (sz - z) ** 2;
          if (d < bestD) {
            bestD = d;
            best = { tier, part: part.key, facet: part.facet, row, num: seg.first + i, kind: r.kind, x: sx, y: sy, z: sz, rotY: FACETS[part.facet].rotY };
          }
        }
      }
    }
  }
  return best;
}

const STAGE_H = SPEC.stage.height_m;

/**
 * Camera pose and numbers for a seat.
 *   standing: eye at standing height (arena in standing mode)
 */
export function seatPose(seat, { standing = false } = {}) {
  const v = seatView(seat);
  const eye = v.eye.slice();
  if (standing) eye[1] = seat.y + 1.6;
  return { kind: 'look', pos: eye, target: v.target, fov: 60 };
}

/**
 * Distances from a seat to the centre of the stage front (the reference of fact sheet 5.5):
 * horizontal distance, line of sight from the eye to the stage-front edge at stage
 * height, the angle below horizontal of that line and the angle off the hall axis.
 */
export function seatMetrics(seat, eyeHeight = 1.15) {
  const eyeY = seat.y + eyeHeight;
  const horizontal = Math.hypot(seat.x, seat.z);
  const dy = eyeY - STAGE_H;
  const sight = Math.hypot(horizontal, dy);
  const down = (Math.atan2(dy, horizontal) * 180) / Math.PI;
  const offAxis = (Math.atan2(seat.x, seat.z) * 180) / Math.PI; // + = house right
  return { horizontal, sight, down, offAxis, eyeY, floorY: seat.y };
}

/** Nearest gate of the seat's level: { id, dist }. */
export function nearestGate(seat) {
  let best = null;
  for (const [id, [x, z]] of Object.entries(GATES)) {
    if (Number(id[0]) !== seat.tier) continue;
    const d = Math.hypot(x - seat.x, z - seat.z);
    if (!best || d < best.dist) best = { id, dist: d };
  }
  return best;
}

export function seatKindKo(seat) {
  switch (seat.kind) {
    case 'vip':
      return seat.box ? `VIP BOX ${seat.box}` : 'VIP BOX 좌석';
    case 'companion':
      return '휠체어석 동반자석';
    case 'arena':
      return '아레나 이동식 좌석';
    case 'telescopic':
      return '가동식 스탠드 (1–11열)';
    case 'balcony':
      return '발코니석 (Cadenza)';
    default:
      return '고정 스탠드석';
  }
}

export function seatTitle(seat) {
  if (seat.kind === 'vip' || seat.tier === 6) return 'LEVEL 6 · VIP BOX';
  const t = TIER_INFO[seat.tier];
  return `LEVEL ${seat.tier} · ${t ? t.name : ''}`;
}

export function tierKo(seat) {
  if (seat.kind === 'vip' || seat.tier === 6) return 'VIP 박스';
  return TIER_INFO[seat.tier]?.ko || '';
}

/**
 * Look a special seat up in the lookup tables of the seats module
 * (group.userData.seatBatches[].lookup, the data behind seatFromInstance).
 */
export function findSpecialSeat(seatsGroup, seatFromInstance, tier, row, num) {
  const batches = seatsGroup?.userData?.seatBatches;
  if (!Array.isArray(batches) || typeof seatFromInstance !== 'function') return null;
  for (const rec of batches) {
    const L = rec.lookup;
    if (!L || L.tier !== tier || !L.row || !L.num) continue;
    for (let i = 0; i < L.count; i++) {
      if (L.row[i] !== row || L.num[i] !== num) continue;
      const seat = seatFromInstance({ userData: { seatLookup: L } }, i);
      if (seat && isSpecial(seat)) return { ...seat, special: true };
    }
  }
  return null;
}

// --- picking -----------------------------------------------------------------------------
let fallbackTable = null;
/** Seat of an instance when the seats module does not provide seatFromInstance (dev overlay). */
function fallbackSeat(mesh, instanceId) {
  if (!fallbackTable) {
    fallbackTable = [];
    forEachSeat((s) => fallbackTable.push([s.tier, s.row, s.num]));
  }
  if (mesh.count !== fallbackTable.length) return null;
  const t = fallbackTable[instanceId];
  return t ? findSeat(t[0], t[1], t[2]) : null;
}

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

/**
 * Seat under a screen point, or null.
 *   meshes            visible instanced seat meshes
 *   seatFromInstance  function of the seats module (optional)
 */
export function pickSeat(clientX, clientY, dom, camera, meshes, seatFromInstance) {
  if (!meshes.length) return null;
  const r = dom.getBoundingClientRect();
  ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  raycaster.far = 400;
  const hits = raycaster.intersectObjects(meshes, false);
  for (const hit of hits) {
    if (hit.instanceId === undefined) continue;
    let seat = null;
    try {
      seat = seatFromInstance ? seatFromInstance(hit.object, hit.instanceId) : null;
    } catch (e) {
      console.warn('[seats] seatFromInstance failed', e);
    }
    if (!seat) seat = fallbackSeat(hit.object, hit.instanceId);
    if (seat && seat.tier !== undefined && seat.row !== undefined && seat.num !== undefined) {
      // numbered seats are normalised through the kernel so the pose is always consistent
      const special = seat.kind === 'vip' || seat.kind === 'companion' || !TIERS.includes(seat.tier);
      const known = special ? null : findSeat(seat.tier, seat.row, seat.num);
      if (known) return known;
      if ([seat.x, seat.y, seat.z].every(Number.isFinite)) return { ...seat, rotY: seat.rotY || 0, special: true };
    }
  }
  return null;
}

/** Fallback highlight marker when the seats module has no highlightSeat(). */
export function makeSeatMarker() {
  const g = new THREE.Group();
  g.name = 'app.seatMarker';
  g.userData.appOwned = true;
  const mat = new THREE.MeshBasicMaterial({ color: '#ffc04d', fog: false, transparent: true, opacity: 0.95, depthTest: true });
  mat.userData.appOwned = true;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.035, 8, 28), mat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 1.02;
  const pin = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 14), mat);
  pin.rotation.x = Math.PI;
  pin.position.y = 1.6;
  for (const m of [ring, pin]) {
    m.userData.appOwned = true;
    m.castShadow = false;
    m.receiveShadow = false;
  }
  g.add(ring, pin);
  g.visible = false;
  return g;
}

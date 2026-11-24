// Maintenance catwalks inside the truss depth, the flat rigging deck (sunoko) over the stage
// and the front arena at 9FL, its links to pin-spot gallery row 1 and the stair up to the
// catwalk level.
//
// Sources: steel-grating walkways with black pipe guards and amplifier racks "on the catwalk"
// (Yamaha Sound Systems photo 12, Bestec), a mesh walking surface for rigging above the stage
// (Azusa / JATET), 9FL = +30.62 as the level the trusses bear on. The plan of the network is
// not published: walkways are laid along the middle of every second truss bay (17 m apart)
// and across the hall 1 m behind panel stations 3, 7, 11, 15 and 17, where the truss diagonals
// meet at the top chord and leave headroom. Cable trays (confirmed visually in the reports)
// run beside them.
import { SPEC } from '../../core/spec.js';
import { hSection, rectSection, trs } from './builder.js';
import {
  TRUSSES,
  STATIONS,
  PITCH,
  PANEL,
  Z0,
  DECK,
  GALLERIES,
  GALLERY_DEPTH,
  REAR_CLOSURE_Z,
  bottomY,
  hallW,
  hallEntryZ,
} from './layout.js';
import { rearLimitZ } from './trusses.js';

export const FLOOR_OFF = 0.78; // walkway floor above the underside of the bottom chords (clears the 0.7 m chord)
export const RAIL_H = 1.1;
const WALK_W = 1.2;
const TOP_RAIL = rectSection(0.045, 0.045);
const MID_RAIL = rectSection(0.035, 0.035);
const TOE = rectSection(0.008, 0.1);
const STRINGER = rectSection(0.05, 0.18, 'top');
const TRAY = rectSection(0.3, 0.09);

/** x of the two links between the rigging deck and pin-spot gallery row 1 (middle of the first bays). */
export const LINK_X = [-PITCH, PITCH];
/** Walkways along the hall: middle of every second truss bay. */
export const LONG_X = [0, 2, 4, 6, 8].flatMap((m) => (m === 0 ? [0] : [-m * PITCH, m * PITCH])).sort((a, b) => a - b);
/** Walkways across the hall: 1 m behind an odd panel station (truss diagonals meet at the top chord there). */
export const TRANS_Z = [3, 7, 11, 15, 17].map((i) => STATIONS[i] + 1.0);
const DECK_EDGE_X = DECK.x1 - 0.4; // transverse walkways pass through the first truss and stop just inside the rigging deck edge

function subtract(intervals, a, b) {
  const out = [];
  for (const [s, e] of intervals) {
    if (b <= s || a >= e) out.push([s, e]);
    else {
      if (a > s) out.push([s, a]);
      if (b < e) out.push([b, e]);
    }
  }
  return out;
}

/**
 * Pipe guard (top rail, knee rail, toe plate, posts) along a polyline of floor points [[x, y, z], …].
 * openings: [[from, to], …] in metres of plan length along the line.
 */
export function railing(S, pts, openings = [], postSpacing = 1.55, height = RAIL_H) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][2] - pts[i - 1][2]));
  const total = cum[cum.length - 1];
  if (total < 0.2) return;
  const at = (d) => {
    let i = 1;
    while (i < pts.length - 1 && cum[i] < d) i++;
    const a = pts[i - 1];
    const b = pts[i];
    const t = Math.min(1, Math.max(0, (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1)));
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  };
  let iv = [[0, total]];
  for (const [a, b] of openings) iv = subtract(iv, a, b);
  for (const [d0, d1] of iv) {
    if (d1 - d0 < 0.25) continue;
    const ds = [d0, ...cum.filter((c) => c > d0 + 1e-6 && c < d1 - 1e-6), d1];
    for (let j = 0; j < ds.length - 1; j++) {
      const A = at(ds[j]);
      const B = at(ds[j + 1]);
      S.rail.sweep([A[0], A[1] + height, A[2]], [B[0], B[1] + height, B[2]], TOP_RAIL);
      S.rail.sweep([A[0], A[1] + height / 2, A[2]], [B[0], B[1] + height / 2, B[2]], MID_RAIL);
      S.rail.sweep([A[0], A[1] + 0.06, A[2]], [B[0], B[1] + 0.06, B[2]], TOE);
    }
    const n = Math.max(1, Math.ceil((d1 - d0) / postSpacing));
    for (let j = 0; j <= n; j++) {
      const P = at(d0 + ((d1 - d0) * j) / n);
      S.posts.push(trs(P[0], P[1], P[2], 0, 1, height / RAIL_H, 1));
    }
  }
}

/** Ladder-type cable tray with its cable bundle, 0.25 m above floor level along a line of floor points. */
function cableTray(S, pts, openings = []) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][2] - pts[i - 1][2]));
  const total = cum[cum.length - 1];
  const at = (d) => {
    let i = 1;
    while (i < pts.length - 1 && cum[i] < d) i++;
    const a = pts[i - 1];
    const b = pts[i];
    const t = Math.min(1, Math.max(0, (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1)));
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + 0.25, a[2] + (b[2] - a[2]) * t];
  };
  let iv = [[0, total]];
  for (const [a, b] of openings) iv = subtract(iv, a - 0.35, b + 0.35);
  for (const [d0, d1] of iv) {
    if (d1 - d0 < 0.6) continue;
    const ds = [d0, ...cum.filter((c) => c > d0 + 1e-6 && c < d1 - 1e-6), d1];
    for (let j = 0; j < ds.length - 1; j++) S.tray.sweep(at(ds[j]), at(ds[j + 1]), TRAY, null, true);
  }
}

/**
 * Grating walkway along floor points [[x, y, z], …] (centre line, top of floor).
 * openings: [{ from, to, side }] with side 'L' | 'R' | 'B' (L = left of the direction of travel).
 */
export function walkway(S, pts, width = WALK_W, { openings = [], rails = 'B', endRails = [false, false], tray = null } = {}) {
  const off = (side) => {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b[0] - a[0];
      const dz = b[2] - a[2];
      const l = Math.hypot(dx, dz) || 1;
      out.push([pts[i][0] + (-dz / l) * side, pts[i][1], pts[i][2] + (dx / l) * side]);
    }
    return out;
  };
  const L = off(width / 2);
  const R = off(-width / 2);
  for (let i = 0; i < pts.length - 1; i++) {
    const yb = [L[i][1] - 0.04, L[i + 1][1] - 0.04, R[i + 1][1] - 0.04, R[i][1] - 0.04];
    const yt = [L[i][1], L[i + 1][1], R[i + 1][1], R[i][1]];
    S.floor.slab(
      [
        [L[i][0], L[i][2]],
        [L[i + 1][0], L[i + 1][2]],
        [R[i + 1][0], R[i + 1][2]],
        [R[i][0], R[i][2]],
      ],
      yb,
      yt,
    );
  }
  const Ls = off(width / 2 - 0.04);
  const Rs = off(-(width / 2 - 0.04));
  for (const line of [Ls, Rs]) {
    for (let i = 0; i < line.length - 1; i++) {
      S.steel.sweep([line[i][0], line[i][1] - 0.04, line[i][2]], [line[i + 1][0], line[i + 1][1] - 0.04, line[i + 1][2]], STRINGER);
    }
  }
  const pick = (side) => openings.filter((o) => !o.side || o.side === 'B' || o.side === side).map((o) => [o.from, o.to]);
  if (rails === 'B' || rails === 'L') railing(S, Ls, pick('L'));
  if (rails === 'B' || rails === 'R') railing(S, Rs, pick('R'));
  if (tray && S.tray) cableTray(S, off((tray === 'L' ? 1 : -1) * (width / 2 + 0.22)), pick(tray));
  if (endRails[0]) railing(S, [Ls[0], Rs[0]], [], 2);
  if (endRails[1]) railing(S, [Ls[Ls.length - 1], Rs[Rs.length - 1]], [], 2);
}

/** Straight steel stair from p0 (bottom) to p1 (top), both [x, y, z] on the walking line. */
export function stair(S, p0, p1, width = 0.9) {
  const rise = p1[1] - p0[1];
  const dx = p1[0] - p0[0];
  const dz = p1[2] - p0[2];
  const run = Math.hypot(dx, dz);
  const n = Math.max(2, Math.round(rise / 0.2));
  const ux = dx / run;
  const uz = dz / run;
  const lx = -uz * (width / 2);
  const lz = ux * (width / 2);
  const going = run / n;
  for (let j = 1; j <= n; j++) {
    const cx = p0[0] + ux * going * (j - 0.5);
    const cz = p0[2] + uz * going * (j - 0.5);
    const y = p0[1] + (rise * j) / n;
    const hx = ux * going * 0.55;
    const hz = uz * going * 0.55;
    S.floor.slab(
      [
        [cx - hx + lx, cz - hz + lz],
        [cx + hx + lx, cz + hz + lz],
        [cx + hx - lx, cz + hz - lz],
        [cx - hx - lx, cz - hz - lz],
      ],
      y - 0.03,
      y,
    );
  }
  const stringer = rectSection(0.02, 0.28);
  for (const s of [-1, 1]) {
    const a = [p0[0] + lx * s, p0[1], p0[2] + lz * s];
    const b = [p1[0] + lx * s, p1[1], p1[2] + lz * s];
    S.steel.sweep([a[0], a[1] - 0.05, a[2]], [b[0], b[1] - 0.05, b[2]], stringer);
    railing(S, [a, b], [], 1.3);
  }
}

/** Vertical ladder with safety hoops left out: two stiles and rungs. Faces along dir = [dx, dz]. */
export function ladder(S, x, z, y0, y1, dir = [1, 0]) {
  const lx = -dir[1] * 0.25;
  const lz = dir[0] * 0.25;
  const stile = rectSection(0.05, 0.02);
  const rung = rectSection(0.025, 0.025);
  for (const s of [-1, 1]) S.rail.sweep([x + lx * s, y0, z + lz * s], [x + lx * s, y1 + 1.0, z + lz * s], stile, [dir[0], 0, dir[1]]);
  for (let y = y0 + 0.3; y < y1 + 0.05; y += 0.3) S.rail.sweep([x - lx, y, z - lz], [x + lx, y, z + lz], rung);
}

/**
 * Amplifier racks of the flown PA (84-86 L-Acoustics LA12X "on the catwalk near each array",
 * Bestec / Yamaha Sound Systems photo 12): four platforms above the main / sub hangs and the
 * out-fill hangs, three racks each.
 */
export const AMP_X = [-26.2, -16.6, 16.6, 26.2];
const AMP_PLATFORM = { w: 3.0, d: 1.4 };
function ampPlatform(S, xc, zc, y) {
  const z0 = zc + WALK_W / 2;
  const z1 = z0 + AMP_PLATFORM.d;
  const x0 = xc - AMP_PLATFORM.w / 2;
  const x1 = xc + AMP_PLATFORM.w / 2;
  S.floor.slab([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], y - 0.04, y);
  for (const x of [x0 + 0.05, xc, x1 - 0.05]) S.steel.sweep([x, y - 0.04, z0 - WALK_W], [x, y - 0.04, z1], STRINGER);
  S.steel.sweep([x0, y - 0.04, z1 - 0.04], [x1, y - 0.04, z1 - 0.04], STRINGER);
  railing(S, [[x0 + 0.03, y, z0], [x0 + 0.03, y, z1 - 0.03], [x1 - 0.03, y, z1 - 0.03], [x1 - 0.03, y, z0]], [], 1.5);
  if (S.rack) {
    for (const dx of [-0.75, 0, 0.75]) {
      const rx = xc + dx;
      S.rack.aabb(rx - 0.3, y, z1 - 0.95, rx + 0.3, y + 1.9, z1 - 0.15); // 19-inch rack, 600 x 800 x 1900
      S.rack.aabb(rx - 0.33, y, z1 - 0.98, rx + 0.33, y + 0.1, z1 - 0.12); // plinth
    }
  }
}

function longExtent(x) {
  const zs = x === 0 ? STATIONS[8] : Math.max(Z0 + 0.35, hallEntryZ(Math.abs(x) + 0.6) + 0.35);
  const ze = Math.min(REAR_CLOSURE_Z, rearLimitZ(Math.abs(x) + 0.7)) - 0.35;
  return [zs, ze];
}
function transExtents(z) {
  const w = Math.min(hallW(z - 0.65), hallW(z + 0.65)) - 0.4;
  return z < DECK.z1 + 1 ? [[-w, -DECK_EDGE_X], [DECK_EDGE_X, w]] : [[-w, w]];
}

/** Catwalks at bottom-chord level (sinks S). */
export function buildCatwalks(S) {
  const floorY = (x, z) => bottomY(x, z) + FLOOR_OFF;
  const longs = LONG_X.map((x) => ({ x, ext: longExtent(x) })).filter((l) => l.ext[1] - l.ext[0] > 6);
  const trans = TRANS_Z.flatMap((z) => transExtents(z).map((ext) => ({ z, ext })));

  for (const l of longs) {
    const [zs, ze] = l.ext;
    const zz = [zs, ...STATIONS.filter((s) => s > zs + 0.4 && s < ze - 0.4), ze];
    const pts = zz.map((z) => [l.x, floorY(l.x, z), z]);
    const openings = trans
      .filter((t) => t.z > zs + 0.8 && t.z < ze - 0.8 && l.x > t.ext[0] + 0.7 && l.x < t.ext[1] - 0.7)
      .map((t) => ({ from: t.z - zs - 0.62, to: t.z - zs + 0.62, side: 'B' }));
    walkway(S, pts, WALK_W, { openings, endRails: [false, false], tray: 'L' });
  }
  for (const t of trans) {
    const [x0, x1] = t.ext;
    const xs = [x0, ...TRUSSES.map((tr) => tr.x).filter((x) => x > x0 + 0.4 && x < x1 - 0.4), x1];
    const pts = xs.map((x) => [x, floorY(x, t.z), t.z]);
    const openings = longs
      .filter((l) => l.x > x0 + 0.7 && l.x < x1 - 0.7 && t.z > l.ext[0] + 0.8 && t.z < l.ext[1] - 0.8)
      .map((l) => ({ from: l.x - x0 - 0.62, to: l.x - x0 + 0.62, side: 'B' }));
    const cut = t.z < DECK.z1 + 1;
    // amplifier-rack platforms open off the audience side of the first transverse walkway
    if (t.z === TRANS_Z[0]) {
      for (const xc of AMP_X.filter((x) => x > x0 + 2 && x < x1 - 2)) {
        openings.push({ from: xc - AMP_PLATFORM.w / 2 - x0, to: xc + AMP_PLATFORM.w / 2 - x0, side: 'L' });
        ampPlatform(S, xc, t.z, floorY(xc, t.z));
      }
    }
    walkway(S, pts, WALK_W, { openings, endRails: [cut && x0 > 0, cut && x1 < 0], tray: t.z === TRANS_Z[0] ? null : 'L' });
    // ladders from the cut ends down to the rigging deck
    if (cut) {
      const xe = x0 > 0 ? x0 : x1;
      const s = Math.sign(xe);
      ladder(S, xe - s * 0.45, t.z, DECK.y, floorY(xe, t.z) - 0.02, [s, 0]);
    }
  }
}

/** Rigging deck at 9FL with hoists, links to gallery row 1 and the stair to the spine catwalk (sinks S9). */
export function buildRiggingDeck(S9) {
  const { y, x0, x1, z0, z1 } = DECK;
  S9.deck.slab(
    [
      [x0, z0],
      [x1, z0],
      [x1, z1],
      [x0, z1],
    ],
    y - 0.05,
    y,
  );
  // primary beams across the hall every half panel, hung from the four inner trusses
  const primary = hSection(0.15, 0.3, 0.014, 0.01, 'top');
  const secondary = hSection(0.125, 0.25, 0.012, 0.008, 'top');
  const rod = rectSection(0.05, 0.05);
  const inner = TRUSSES.filter((t) => Math.abs(t.x) < 1.6 * PITCH);
  for (let z = Z0 + PANEL / 2; z < z1 - 0.2; z += PANEL / 2) {
    S9.steel.sweep([-1.5 * PITCH, y - 0.05, z], [1.5 * PITCH, y - 0.05, z], primary);
    for (const t of inner) {
      const top = t.yb(z);
      if (top - y > 0.2) S9.steel.sweep([t.x, y - 0.05, z + 0.12], [t.x, top + 0.05, z + 0.12], rod, [0, 0, 1]);
    }
  }
  for (let x = -12; x <= 12.01; x += 3) S9.steel.sweep([x, y - 0.06, z0], [x, y - 0.06, z1], secondary);
  for (const x of [x0 + 0.06, x1 - 0.06]) S9.steel.sweep([x, y - 0.06, z0], [x, y - 0.06, z1], secondary);
  S9.steel.sweep([x0, y - 0.06, z1 - 0.06], [x1, y - 0.06, z1 - 0.06], secondary);

  // guards: both long sides and the audience end (openings for the two links)
  railing(S9, [[x0 + 0.05, y, z0], [x0 + 0.05, y, z1 - 0.05]], []);
  railing(S9, [[x1 - 0.05, y, z0], [x1 - 0.05, y, z1 - 0.05]], []);
  railing(
    S9,
    [[x0 + 0.05, y, z1 - 0.05], [x1 - 0.05, y, z1 - 0.05]],
    LINK_X.map((x) => [x - x0 - 0.05 - 0.6, x - x0 - 0.05 + 0.6]),
  );

  // hoist units of the eight lifting grids (four per grid, 3 m inside the frame corners)
  const LG = SPEC.production.liftingGrids;
  for (const cz of LG.rowCentresY_H) {
    for (const cxH of LG.columnCentresX_H) {
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const hx = -cxH + sx * 3;
          const hz = cz + sz * 3;
          if (hz < z0 + 0.6 || hz > z1 - 0.6) continue;
          S9.hoist.aabb(hx - 0.55, y, hz - 0.3, hx + 0.55, y + 0.5, hz + 0.3); // gearbox and drum housing
          S9.hoist.aabb(hx - 0.2, y + 0.5, hz - 0.2, hx + 0.2, y + 0.85, hz + 0.2); // motor
        }
      }
    }
  }

  // links from the audience end of the deck to pin-spot gallery row 1 (same level)
  const row1 = GALLERIES[0];
  const zEnd = row1.zc - GALLERY_DEPTH / 2;
  for (const x of LINK_X) {
    walkway(S9, [[x, y, z1], [x, row1.floorY, zEnd]], WALK_W, { endRails: [false, false] });
    for (const z of STATIONS.filter((s) => s > z1 + 0.2 && s < zEnd - 0.2)) {
      for (const s of [-1, 1]) S9.steel.sweep([x + s * 0.56, y - 0.2, z], [x + s * 0.56, bottomY(x, z) + 0.2, z], rod, [0, 0, 1]);
      S9.steel.sweep([x - 0.7, y - 0.22, z], [x + 0.7, y - 0.22, z], rectSection(0.08, 0.12));
    }
  }

  // stair from the deck up to the spine catwalk on the axis
  const zTop = STATIONS[8];
  const yTop = bottomY(0, zTop) + FLOOR_OFF;
  const run = (yTop - y) / Math.tan((38 * Math.PI) / 180);
  stair(S9, [0, y, zTop - run], [0, yTop, zTop]);
}

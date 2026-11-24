// The ceiling surface (underside of the roof build-up) and the vertical closures between the
// truss zone and the hall walls.
import { FLANK_NORMAL } from '../../core/envelope.js';
import {
  Z0,
  PANEL,
  STAGE_CLOSURE_Z,
  REAR_CLOSURE_Z,
  SHOULDER_Z,
  SIN_W,
  COS_W,
  ceilingY,
  bottomY,
  hallW,
  crownHalf,
} from './layout.js';

const SLAB = 0.12; // thin concrete panel under the double folded-plate roof
const WALL_T = 0.2;
const DROP = 0.6; // closures start this far below the bottom-chord plane
const DROP_REAR = 1.3; // behind the last rows of the Upper Stand they come down further

/** Stations of the ceiling mesh: every half panel, plus the shoulder and both ends. */
function ceilingStations() {
  const zs = [STAGE_CLOSURE_Z, REAR_CLOSURE_Z, SHOULDER_Z];
  for (let j = 0; Z0 + (j * PANEL) / 2 < REAR_CLOSURE_Z; j++) zs.push(Z0 + (j * PANEL) / 2);
  return [...new Set(zs.map((z) => +z.toFixed(4)))].sort((a, b) => a - b);
}

/** Five ribs across the hall at station z: wall, crown edge, axis, crown edge, wall. */
function ribs(z) {
  const w = hallW(z);
  const c = Math.min(crownHalf(z), w);
  return [-w, -c, 0, c, w];
}

export function buildCeiling(buf) {
  const zs = ceilingStations();
  for (let i = 0; i < zs.length - 1; i++) {
    const za = zs[i];
    const zb = zs[i + 1];
    const ra = ribs(za);
    const rb = ribs(zb);
    for (let k = 0; k < 4; k++) {
      if (ra[k + 1] - ra[k] < 1e-4 && rb[k + 1] - rb[k] < 1e-4) continue;
      const corners = [
        [ra[k], za],
        [ra[k + 1], za],
        [rb[k + 1], zb],
        [rb[k], zb],
      ];
      const yb = corners.map(([x, z]) => ceilingY(x, z));
      const yt = yb.map((y) => y + SLAB);
      buf.slab(corners, yb, yt, { sides: false });
    }
  }
}

export function buildClosures(buf) {
  const zs = ceilingStations();
  const low = (x, z, rear = false) => bottomY(x, z) - (rear ? DROP_REAR : DROP);
  const high = (x, z) => ceilingY(x, z) + SLAB;
  // side walls and rear diagonals, both sides
  for (const s of [-1, 1]) {
    for (let i = 0; i < zs.length - 1; i++) {
      const za = zs[i];
      const zb = zs[i + 1];
      const side = zb <= SHOULDER_Z + 1e-3;
      // outward normal: flank normal on the side walls, wing-facet normal on the rear diagonals
      const nx = (side ? FLANK_NORMAL[0] : SIN_W) * s;
      const nz = side ? FLANK_NORMAL[1] : COS_W;
      const a = [s * hallW(za), za];
      const b = [s * hallW(zb), zb];
      const corners = [a, b, [b[0] + nx * WALL_T, b[1] + nz * WALL_T], [a[0] + nx * WALL_T, a[1] + nz * WALL_T]];
      const ia = s * (hallW(za) - 0.3);
      const ib = s * (hallW(zb) - 0.3);
      buf.slab(corners, [low(ia, za, !side), low(ib, zb, !side), low(ib, zb, !side), low(ia, za, !side)], [high(a[0], za), high(b[0], zb), high(b[0], zb), high(a[0], za)]);
    }
  }
  // stage end and rear centre
  for (const [z, dir] of [
    [STAGE_CLOSURE_Z, -1],
    [REAR_CLOSURE_Z, 1],
  ]) {
    const r = ribs(z);
    const zi = z - dir * 0.3;
    for (let k = 0; k < 4; k++) {
      if (r[k + 1] - r[k] < 1e-4) continue;
      const x0 = r[k] - (k === 0 ? WALL_T : 0);
      const x1 = r[k + 1] + (k === 3 ? WALL_T : 0);
      const corners = [
        [x0, z],
        [x1, z],
        [x1, z + dir * WALL_T],
        [x0, z + dir * WALL_T],
      ];
      const cl = (x) => Math.max(-hallW(zi) + 0.3, Math.min(hallW(zi) - 0.3, x));
      const rr = dir > 0;
      buf.slab(corners, [low(cl(x0), zi, rr), low(cl(x1), zi, rr), low(cl(x1), zi, rr), low(cl(x0), zi, rr)], [high(r[k], z), high(r[k + 1], z), high(r[k + 1], z), high(r[k], z)]);
    }
  }
}

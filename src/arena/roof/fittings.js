// Things hung in the truss zone: the field of sound-absorber panels and the house downlights.
import { trs } from './builder.js';
import {
  STATIONS,
  N_PANELS,
  PANEL,
  PITCH,
  PURLIN_D,
  DECK,
  GALLERIES,
  GALLERY_DEPTH,
  galleryPath,
  ceilingY,
  bottomY,
  insideHall,
  overDeck,
} from './layout.js';
import { lightLines } from './trusses.js';
import { LONG_X, TRANS_Z, FLOOR_OFF } from './catwalks.js';

export const ABSORBER = Object.freeze({ w: 1.8, h: 0.9, t: 0.06 }); // 3 shaku x 6 shaku board (Bestec / JATET)

/**
 * Absorber baffles: four boards side by side in every truss bay, three rows per panel, hung
 * face-on to the stage just under the purlins. Rows that would hang into the headroom of a
 * catwalk are left out.
 */
export function absorberMatrices() {
  const out = [];
  const walkBays = new Set(LONG_X.map((x) => Math.round(x / PITCH)));
  const headroom = FLOOR_OFF + 2.15;
  for (let m = -9; m <= 9; m++) {
    for (let j = 0; j < 4; j++) {
      const x = m * PITCH + (j - 1.5) * 2.0;
      const alongWalk = walkBays.has(m) && (j === 1 || j === 2);
      for (let si = 0; si < N_PANELS; si++) {
        for (const f of [0.25, 0.5, 0.75]) {
          const z = STATIONS[si] + PANEL * f;
          if (!insideHall(x - 0.95, z, 0.45) || !insideHall(x + 0.95, z, 0.45)) continue;
          const acrossWalk = TRANS_Z.some((tz) => Math.abs(tz - z) < 1.0);
          const top = ceilingY(x, z) - PURLIN_D - 0.45;
          const clear = top - ABSORBER.h - bottomY(x, z);
          if (clear < (alongWalk || acrossWalk ? headroom : 1.1)) continue;
          out.push(trs(x, top - ABSORBER.h / 2, z));
        }
      }
    }
  }
  return out;
}

function distToPath(x, z, path) {
  let best = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, az] = path[i];
    const [bx, bz] = path[i + 1];
    const dx = bx - ax;
    const dz = bz - az;
    const t = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t));
  }
  return best;
}

export const LIGHT = Object.freeze({ lens: 0.15, body: 0.175, height: 0.3, pair: 0.5 });

/**
 * House downlights: twin round LED high-bays 1.6 m either side of every truss (two clusters
 * per 8.54 m bay) at the middle of every 6.22 m panel, flush with the underside of the
 * bottom chords. Over the rigging deck they hang under the deck beams.
 * Returns [[x, y, z], …] of the lens centres (y = lens plane).
 */
export function lightPositions() {
  const paths = GALLERIES.map((g) => galleryPath(g.zc));
  const out = [];
  for (const xq of lightLines()) {
    for (let si = 0; si < N_PANELS; si++) {
      const z = STATIONS[si] + PANEL / 2;
      if (!insideHall(xq, z, 0.9)) continue;
      if (paths.some((p) => distToPath(xq, z, p) < GALLERY_DEPTH / 2 + 0.5)) continue; // would only light a cabin roof
      const y = overDeck(xq, z, 0.2) ? DECK.y - 0.35 - LIGHT.height : bottomY(xq, z);
      out.push([xq - LIGHT.pair / 2, y, z], [xq + LIGHT.pair / 2, y, z]);
    }
  }
  return out;
}

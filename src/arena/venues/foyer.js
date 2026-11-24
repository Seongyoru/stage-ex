// Feature elements of the Main Foyer (LEVEL 3, +7.27) that are decoration, not structure:
//  * the graffiti-style "K-Arena" logotype on the red back wall of the grand-stair landing
//    (cream letters with a black outline and speed lines; official photo img_facility_details),
//  * the ticket-check lanes inside the Main Entrance doors,
//  * free-standing portrait digital signage totems facing the incoming crowd.
import { bx, M4, strokeText, tf } from './kit.js';
import { M } from './mats.js';
import { Y, FIN, FOYER } from './layout.js';
import * as F from './furniture.js';

const LEVEL = 3;

export function buildFoyer(kit) {
  const yf = Y.L3 + FIN;

  // --- "K-Arena" mural -------------------------------------------------------------------------
  // Relief board on the wall at the head of the grand stair (facing the foyer, +Z): signal-red
  // ground, cream letters with a black outline, speed lines.
  const mu = FOYER.mural;
  kit.add(LEVEL, M('venues.foyerMuralRed'), bx(mu.width, mu.height, mu.depth, mu.x, mu.y, mu.z));
  const zFace = mu.z + mu.depth / 2;
  const base = mu.y - 0.5;
  const style = { height: 1.04, shear: 0.2, tracking: 0.2 };
  kit.add(LEVEL, M('venues.foyerLogoBlack'), tf(strokeText('K-Arena', { ...style, weight: 0.28, depth: 0.02 }).geometry, { x: mu.x + 0.1, y: base, z: zFace + 0.012 }));
  kit.add(LEVEL, M('venues.foyerLogoCream'), tf(strokeText('K-Arena', { ...style, weight: 0.17, depth: 0.02 }).geometry, { x: mu.x + 0.1, y: base, z: zFace + 0.026 }));
  // speed lines through the lettering
  for (const [dx, dy, len] of [[-2.75, 0.18, 1.3], [-2.95, 0.42, 0.9], [2.55, 0.3, 1.5], [2.9, 0.56, 0.9], [0.4, -0.2, 3.6]]) {
    kit.add(LEVEL, M('venues.foyerLogoBlack'), bx(len + 0.08, 0.13, 0.016, mu.x + dx, base + dy, zFace + 0.01));
    kit.add(LEVEL, M('venues.foyerLogoCream'), bx(len, 0.055, 0.016, mu.x + dx, base + dy, zFace + 0.02));
  }

  // --- ticket-check lanes inside the Main Entrance ------------------------------------------------
  const posts = [];
  const readers = [];
  const n = Math.round((2 * FOYER.laneHalfSpan) / FOYER.lanePitch);
  for (let i = 0; i <= n; i++) {
    const x = -FOYER.laneHalfSpan + i * FOYER.lanePitch;
    for (const dz of [-1.2, 1.2]) posts.push(M4(x, yf, FOYER.lanesZ + dz));
    kit.add(LEVEL, M('venues.laneBelt'), bx(0.004, 0.05, 2.36, x, yf + 0.9, FOYER.lanesZ));
    if (i < n) readers.push(M4(x + 0.32, yf, FOYER.lanesZ - 1.05, 0));
  }
  kit.instance(LEVEL, 'foyer-lane-posts', F.lanePost(), posts, { prop: 'stanchion' });
  kit.instance(LEVEL, 'foyer-ticket-reader', F.ticketReader(), readers);

  // --- portrait digital signage totems ----------------------------------------------------------------
  const totems = [];
  for (const x of [-17.08, -8.54, 8.54, 17.08]) totems.push(M4(x, yf, FOYER.totemZ, 0));
  kit.instance(LEVEL, 'foyer-signage-totem', F.signageTotem(), totems, { prop: 'foyer_totem' });

  return { lanes: n, totems: totems.length };
}

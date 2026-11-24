// The 11 kiosks (売店): 1A 1B (LEVEL 1), 3A 3B (LEVEL 3), 5A-5D (LEVEL 5), 7A-7C (LEVEL 7).
// Official kiosk photo (blue, LEVEL 7) and a fan photo of a red kiosk: a recess under a black
// canopy with four downlights; black counter whose front glows red on LEVEL 1 / 3 / 5 and deep
// blue on LEVEL 7; four glass-door fridges (water, green tea, cola); four landscape menu
// monitors above them; gold beer towers; card terminals.
// The recess shells (walls, recess ceiling, canopy, "DRINK" graphics) belong to arena/structure;
// this file adds the fit-out at the same positions (layout.js KIOSKS).
import { M4 } from './kit.js';
import { KIOSKS, KIOSK_FLOOR } from './layout.js';
import * as F from './furniture.js';

export function buildKiosks(kit) {
  const cache = new Map();
  for (const k of KIOSKS) {
    const key = `${k.accent}|${k.width}|${k.depth}|${k.opening}`;
    if (!cache.has(key)) cache.set(key, F.kioskFitout({ accent: k.accent, width: k.width, depth: k.depth, opening: k.opening }));
    kit.addParts(k.level, cache.get(key), M4(k.x, KIOSK_FLOOR[k.level] + 0.004, k.z, k.rotY));
  }
  return { count: KIOSKS.length, ids: KIOSKS.map((k) => k.id) };
}

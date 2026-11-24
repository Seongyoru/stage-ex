// Fit-out of the named venues of K-Arena Yokohama (layer "venues"):
//   LEVEL 3  main foyer features: "K-Arena" mural, ticket-check lanes, portrait signage totems
//   LEVEL 5  Lounge 5 (about 400 seats)
//   LEVEL 6  VIP K-Arena: VIP lounge (about 100 seats) and the interiors of the 11 VIP BOX rooms
//   LEVEL 7  Arena Bar 7 (120 seats)
//   LEVEL 1 / 3 / 5 / 7  the fit-out of the 11 kiosks (counter, fridges, menu monitors, back lining)
// Floor slabs, structural walls and columns, stairs, gate doors, the kiosk recess shells and
// the VIP corridor wall (arena/structure), glazing and the colonnade columns (arena/exterior),
// box balconies and their seats (arena/bowl, arena/seats) belong to other modules; everything
// here stands inside those shells (floor finishes are laid 2 cm above the slab level).
//   venues/layout.js     where each venue sits and why (registered on core/envelope.js and on
//                        the plan stations of arena/structure)
//   venues/furniture.js  one function per furniture / fitting type → [{ geometry, material }]
//   venues/mats.js       material table (ids "venues.*", tile sizes)
//   venues/kit.js        sweep / lathe / stroke-lettering helpers, per-material merge, instancing
// group.userData.info reports the modelled seat counts per venue.
import * as THREE from 'three';
import { Kit, LAYER } from './venues/kit.js';
import { buildLounge5 } from './venues/lounge5.js';
import { buildArenaBar7 } from './venues/arenaBar7.js';
import { buildVipLounge } from './venues/vipLounge.js';
import { buildVipBoxes } from './venues/vipBoxes.js';
import { buildFoyer } from './venues/foyer.js';
import { buildKiosks } from './venues/kiosks.js';

export function build(ctx = {}) {
  const c = { quality: 'high', flags: {}, ...ctx };
  const group = new THREE.Group();
  group.name = 'venues';
  group.userData.layer = LAYER;
  const kit = new Kit(group);
  const info = {
    foyer: buildFoyer(kit, c),
    lounge5: buildLounge5(kit, c),
    vipLounge: buildVipLounge(kit, c),
    vipBoxes: buildVipBoxes(kit, c),
    arenaBar7: buildArenaBar7(kit, c),
    kiosks: buildKiosks(kit, c),
  };
  kit.flush();
  group.userData.info = info;
  return group;
}

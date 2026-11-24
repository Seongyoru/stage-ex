// K-Arena Yokohama — floors, concourses and vertical circulation behind and under the
// stands, and the backstage block interior (layer "structure").
//
// The plan is written in apothem coordinates about the fan apex (see structure/kit.js and
// structure/plan.js): every wall, slab edge and stair behind the bowl is a parallel offset of
// the stand facets, exactly like the real building, whose rear facades step by 33.6°.
//
//   structure/plan.js         radial / lateral stations, gate table, circulation positions
//   structure/slabs.js        floor slabs LEVEL 1-9 + backstage
//   structure/lower.js        LEVEL 1-4: walls, gates, rooms, graphics
//   structure/upper.js        LEVEL 5-9: walls, gates, rooms, stand soffit linings
//   structure/services.js     interior columns, exposed-services ceilings, linear LEDs
//   structure/fittings.js     gate door sets, rooms, kiosk shells, locker banks
//   structure/circulation.js  grand stair, stairs, escalators, lift cores
//   structure/backstage.js    backstage block shell
//   structure/signs.js        stencil wayfinding (canvas atlas, DOM-guarded)
import * as THREE from 'three';
import { Kit, LAYER } from './structure/kit.js';
import { buildSlabs } from './structure/slabs.js';
import buildLower from './structure/lower.js';
import buildUpper from './structure/upper.js';
import buildServices from './structure/services.js';
import buildCirculation from './structure/circulation.js';
import buildBackstage from './structure/backstage.js';
import { finishLockers } from './structure/fittings.js';
import { flushSigns, finishSigns } from './structure/signs.js';

export async function build(ctx = {}) {
  const group = new THREE.Group();
  group.name = 'structure';
  group.userData.layer = LAYER;
  const kit = new Kit();
  kit.quality = ctx.quality || 'high';

  buildSlabs(kit);
  buildLower(kit);
  buildUpper(kit);
  buildServices(kit);
  buildCirculation(kit);
  buildBackstage(kit);
  finishLockers(kit);
  flushSigns(kit);
  kit.build(group);
  finishSigns();
  group.userData.info = kit.info; // kiosk recesses etc. for neighbouring modules
  return group;
}

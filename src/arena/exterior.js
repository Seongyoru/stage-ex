// arena/exterior — the building envelope of K-Arena Yokohama as seen from outside.
//
//   flank walls, rounded stage-end corners, stage-end wall with the notch, dark base      exterior/flanks.js
//   roof lid: raised standing-seam roof, skirts, perimeter band, rooftop plant            exterior/roof.js
//   giant eave (coved soffit, lip, rim) and the 24 columns                                exterior/eave.js
//   rear facet walls: LEVEL 3 storey, LEVEL 5 glazed band, leaning ribbed wall            exterior/rear.js
//   glass box and Main Entrance                                                            exterior/glassbox.js
//   signs                                                                                 exterior/signs.js
//
// Facts: research/00-consolidated.md §2, §3, §9.1 and model-spec.json (facade, building.roofProfile),
// checked against the photographs listed in §14.2. Deviations are listed in the module report.
// All static geometry is merged per material (and per LEVEL where a part belongs to one level).
// update(group, state) switches the night lighting: light sources live in a child group that
// is only visible at night; the soffit and columns get a warm emissive wash.
import * as THREE from 'three';
import { Collector, material } from './exterior/common.js';
import { buildFlanks } from './exterior/flanks.js';
import { buildRoof } from './exterior/roof.js';
import { buildEave } from './exterior/eave.js';
import { buildRear } from './exterior/rear.js';
import { buildGlassBox } from './exterior/glassbox.js';
import { buildSigns } from './exterior/signs.js';

/** Standard materials that receive a night emissive wash: [id, colour, intensity]. */
const NIGHT_WASH = [
  ['facade.eaveSoffit', '#FFF1D6', 0.2],
  ['facade.columnConcrete', '#FFE9C4', 0.1],
  ['facade.ribbedWhite', '#FFF1D6', 0.05],
  ['sign.letterReturn', '#FFFFFF', 0.25],
];

export function build(ctx = {}) {
  const detail = ctx.quality !== 'low';
  const group = new THREE.Group();
  group.name = 'arena/exterior';
  group.userData.layer = 'exterior';
  const night = new THREE.Group();
  night.name = 'exterior night lighting';
  night.visible = false;

  const col = new Collector();
  buildFlanks(col, { detail });
  buildRoof(col, { detail });
  buildEave(col, { detail });
  buildRear(col, { detail });
  const entrance = buildGlassBox(col, { detail });
  buildSigns(col, entrance, { detail });
  const triangles = col.build(group, night);
  group.add(night);

  group.userData.exterior = {
    night: false,
    nightGroup: night,
    triangles,
    wash: NIGHT_WASH.map(([id, color, k]) => ({ mat: material(id), color: new THREE.Color(color), k })),
  };
  return group;
}

export function update(group, state) {
  const ud = group.userData.exterior;
  if (!ud) return;
  const night = !!(state && state.night);
  if (ud.night === night) return;
  ud.night = night;
  ud.nightGroup.visible = night;
  for (const w of ud.wash) {
    if (!w.mat.emissive) continue;
    w.mat.emissive.copy(night ? w.color : BLACK);
    w.mat.emissiveIntensity = night ? w.k : 1;
  }
}

const BLACK = new THREE.Color('#000000');

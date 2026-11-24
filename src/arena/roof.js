// K-Arena Yokohama — roof structure and ceiling zone of the hall, as seen from inside.
//
//   layer 'roof'
//   - 18 long-span steel trusses (stage rear wall → rear colonnade), cross frames, plan
//     bracing, purlins, bearings                        roof/layout.js, roof/trusses.js
//   - ceiling surface (underside of the roof build-up) and closures to the hall walls
//                                                        roof/ceiling.js
//   - maintenance catwalks, rigging deck (sunoko) at 9FL roof/catwalks.js
//   - two-row pin-spot gallery                           roof/galleries.js
//   - absorber field and house downlights                roof/fittings.js
//
// Facts: research/00-consolidated.md 5.4 and 7.2, research/model-spec.json
// (building.roofProfile.truss, production.pinSpotGallery, production.liftingGrids).
// The plan layout of the trusses and all member sizes are derived; see roof/layout.js.
//
// URL flags (development): roofdebug=1 paints the black steel in readable greys,
// rooflights=0 leaves out the six real spot lights.
import * as THREE from 'three';
import { mesh, metricUV } from '../core/geom.js';
import { mat, emissiveMat } from '../core/materials.js';
import { TriBuffer, instanced, trs } from './roof/builder.js';
import { TRUSSES, GALLERIES, bottomY } from './roof/layout.js';
import { buildTrusses, buildSecondary, buildPurlins, buildRearBearing } from './roof/trusses.js';
import { buildCeiling, buildClosures } from './roof/ceiling.js';
import { buildCatwalks, buildRiggingDeck, RAIL_H } from './roof/catwalks.js';
import { buildGalleries } from './roof/galleries.js';
import { absorberMatrices, lightPositions, ABSORBER, LIGHT } from './roof/fittings.js';

const LAYER = 'roof';
const HOUSE_LIGHT_COLOR = '#FFF2DC';
const SPOT_INTENSITY = 900; // candela per real light

// Ambient fill. The ceiling zone is lit almost only by light bounced off the floor and the
// seats, which the scene lighting does not model, and the paint colours of the fact sheet
// (#0E0F11 …) are so dark that the lattice would render as a flat black hole. Every roof
// material therefore carries a small emissive term in the tone the steel has in the official
// photographs with the house lights on; update() scales it with the house-light level, so
// the roof goes black during a show. Set group.userData.roof.fill = 0 to switch it off.
const FILL = {
  steel: '#2A2E36',
  steel2: '#1E2127',
  ceiling: '#040405',
  closure: '#0B0B0D',
  grating: '#1D1F25',
  sunoko: '#1A1C22',
  handrail: '#272A31',
  absorber: '#0F1012',
  gallerySteel: '#383C45',
  galleryDeck: '#1B1C20',
  galleryMesh: '#5A5F68',
  galleryPanel: '#0A0A0C',
  hoist: '#2A2C30',
  lightBody: '#0E0F11',
  rack: '#17181B',
  tray: '#15161A',
};

function materials(debug) {
  const c = (black, grey) => (debug ? grey : black);
  const metal = (v) => (debug ? 0 : v);
  const fill = (key) => (debug ? {} : { emissive: FILL[key], emissiveIntensity: 1 });
  return {
    steel: mat('roof.steel', { color: c('#0E0F11', '#7d838c'), roughness: 0.8, metalness: metal(0.3), tile: 2, ...fill('steel') }),
    steel2: mat('roof.steelSecondary', { color: c('#101114', '#5d6168'), roughness: 0.8, metalness: metal(0.3), tile: 2, ...fill('steel2') }),
    ceiling: mat('roof.ceiling', { color: c('#0A0A0B', '#2b2c30'), roughness: 0.95, metalness: 0, tile: 1.2, ...fill('ceiling') }),
    closure: mat('roof.closure', { color: c('#0E0E10', '#3a3b40'), roughness: 0.95, metalness: 0, tile: 2.4, ...fill('closure') }),
    grating: mat('roof.grating', { color: c('#15161A', '#9a8f6a'), roughness: 0.65, metalness: metal(0.55), tile: 1, transparent: true, opacity: 0.8, ...fill('grating') }),
    sunoko: mat('roof.sunoko', { color: c('#131417', '#8a7f9a'), roughness: 0.7, metalness: metal(0.5), tile: 1, transparent: true, opacity: 0.6, depthWrite: false, ...fill('sunoko') }),
    handrail: mat('roof.handrail', { color: c('#111214', '#c9b458'), roughness: 0.5, metalness: metal(0.5), tile: 1, ...fill('handrail') }),
    absorber: mat('roof.absorber', { color: c('#161618', '#4d6a55'), roughness: 1, metalness: 0, tile: 1.8, ...fill('absorber') }),
    gallerySteel: mat('roof.gallerySteel', { color: c('#121316', '#a9b0ba'), roughness: 0.7, metalness: metal(0.35), tile: 2, ...fill('gallerySteel') }),
    galleryDeck: mat('roof.galleryDeck', { color: c('#18191C', '#8d7f70'), roughness: 0.6, metalness: metal(0.5), tile: 1.2, ...fill('galleryDeck') }),
    galleryMesh: mat('roof.galleryMesh', { color: c('#2A2C30', '#d8dde4'), roughness: 0.6, metalness: metal(0.6), tile: 0.5, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide, ...fill('galleryMesh') }),
    galleryPanel: mat('roof.galleryPanel', { color: c('#0B0B0D', '#30323a'), roughness: 0.95, metalness: 0, tile: 1.2, ...fill('galleryPanel') }),
    hoist: mat('roof.hoist', { color: c('#2B2D30', '#b06a3a'), roughness: 0.6, metalness: metal(0.4), tile: 1, ...fill('hoist') }),
    lightBody: mat('roof.houseLightBody', { color: c('#0C0C0E', '#55585e'), roughness: 0.6, metalness: metal(0.4), tile: 1, ...fill('lightBody') }),
    rack: mat('roof.ampRack', { color: c('#0C0D0F', '#3f6f9a'), roughness: 0.5, metalness: metal(0.4), tile: 1.9, ...fill('rack') }),
    tray: mat('roof.cableTray', { color: c('#0D0E10', '#b05a8a'), roughness: 0.75, metalness: metal(0.3), tile: 1, ...fill('tray') }),
    light: emissiveMat('roof.houseLight', { color: HOUSE_LIGHT_COLOR, toneMapped: false }),
  };
}

function add(group, buf, material, name, { level, cast = false } = {}) {
  if (!buf || buf.triangles === 0) return null;
  const m = mesh(buf.toGeometry(), material, { name, layer: LAYER, level, cast, receive: true });
  group.add(m);
  return m;
}

export function build(ctx = {}) {
  const flags = ctx.flags || {};
  const low = ctx.quality === 'low';
  const M = materials(flags.roofdebug === '1');
  const group = new THREE.Group();
  group.name = 'roof';
  group.userData.layer = LAYER;

  // --- structure ---------------------------------------------------------------------
  const steel = new TriBuffer();
  buildTrusses(steel, { low });
  buildRearBearing(steel);
  add(group, steel, M.steel, 'roof trusses (18)');

  const secondary = new TriBuffer();
  buildSecondary(secondary, { low });
  buildPurlins(secondary, { low });

  // --- ceiling and closures ----------------------------------------------------------
  const ceiling = new TriBuffer();
  buildCeiling(ceiling);
  add(group, ceiling, M.ceiling, 'ceiling (underside of the roof build-up)', { cast: true });
  const closure = new TriBuffer();
  buildClosures(closure);
  add(group, closure, M.closure, 'truss-zone closures', { cast: true });

  // --- catwalks at truss level -------------------------------------------------------
  const post = metricUV(new THREE.BoxGeometry(0.045, RAIL_H, 0.045).translate(0, RAIL_H / 2, 0));
  const S = { floor: new TriBuffer(), rail: new TriBuffer(), steel: secondary, posts: [], rack: new TriBuffer(), tray: new TriBuffer() };
  buildCatwalks(S);
  add(group, secondary, M.steel2, 'secondary steel (cross frames, bracing, purlins, light carriers)');
  add(group, S.floor, M.grating, 'catwalk gratings');
  add(group, S.rail, M.handrail, 'catwalk guards');
  add(group, S.rack, M.rack, 'amplifier racks on the catwalk');
  add(group, S.tray, M.tray, 'cable trays along the catwalks');
  if (S.posts.length) group.add(instanced(post, M.handrail, S.posts, { name: 'catwalk guard posts' }));

  // --- 9FL: rigging deck and pin-spot galleries ---------------------------------------
  const S9 = {
    deck: new TriBuffer(),
    floor: new TriBuffer(),
    rail: new TriBuffer(),
    steel: new TriBuffer(),
    hoist: new TriBuffer(),
    mesh: new TriBuffer(),
    panel: new TriBuffer(),
    posts: [],
  };
  buildRiggingDeck(S9);
  const G = { steel: new TriBuffer(), deck: new TriBuffer(), rail: S9.rail, mesh: S9.mesh, panel: S9.panel, posts: S9.posts };
  buildGalleries(G, { low });
  const L9 = { level: 9 };
  add(group, S9.deck, M.sunoko, 'rigging deck mesh floor (sunoko)', L9);
  add(group, S9.floor, M.grating, 'rigging deck links and stair gratings', L9);
  add(group, S9.steel, M.steel2, 'rigging deck steel', L9);
  add(group, S9.hoist, M.hoist, 'lifting-grid hoist units', L9);
  add(group, G.steel, M.gallerySteel, 'pin-spot gallery steel (rows 1 and 2)', L9);
  add(group, G.deck, M.galleryDeck, 'pin-spot gallery decks', L9);
  add(group, S9.panel, M.galleryPanel, 'pin-spot gallery masking panels and follow-spot cabins', L9);
  add(group, S9.rail, M.handrail, 'gallery and rigging deck guards', L9);
  add(group, S9.mesh, M.galleryMesh, 'pin-spot gallery mesh guards', L9);
  if (S9.posts.length) group.add(instanced(post, M.handrail, S9.posts, { name: 'gallery and rigging deck guard posts', level: 9 }));

  // --- absorbers ---------------------------------------------------------------------
  if (!low) {
    const board = metricUV(new THREE.BoxGeometry(ABSORBER.w, ABSORBER.h, ABSORBER.t));
    group.add(instanced(board, M.absorber, absorberMatrices(), { name: 'sound-absorber panels' }));
  }

  // --- house lights ------------------------------------------------------------------
  const lights = lightPositions();
  const lens = metricUV(new THREE.CircleGeometry(LIGHT.lens, low ? 8 : 14).rotateX(Math.PI / 2).translate(0, -0.004, 0));
  const body = metricUV(new THREE.CylinderGeometry(LIGHT.body, LIGHT.body - 0.02, LIGHT.height, low ? 6 : 10, 1, true).translate(0, LIGHT.height / 2, 0));
  const lm = lights.map(([x, y, z]) => trs(x, y, z));
  group.add(instanced(lens, M.light, lm, { name: 'house downlights (lenses)' }));
  group.add(instanced(body, M.lightBody, lm, { name: 'house downlights (housings)' }));

  const real = [];
  if (!low && flags.rooflights !== '0') {
    const rig = new THREE.Group();
    rig.name = 'house lights (real)';
    for (const [x, z] of [
      [-27, 5],
      [27, 5],
      [-17, 38],
      [17, 38],
      [-34, 72],
      [34, 72],
    ]) {
      const l = new THREE.SpotLight(HOUSE_LIGHT_COLOR, SPOT_INTENSITY, 0, 1.05, 0.7, 2);
      l.position.set(x, bottomY(x, z) - 0.3, z);
      l.target.position.set(x, 0, z);
      l.castShadow = false;
      rig.add(l, l.target);
      real.push(l);
    }
    group.add(rig);
  }

  group.userData.roof = {
    level: 1,
    applied: 1,
    fill: 1, // ambient-fill strength of the roof materials (0 = off)
    fillMaterials: Object.values(M).filter((m) => m.isMeshStandardMaterial && m.emissiveIntensity !== undefined),
    lightMaterial: M.light,
    baseColor: new THREE.Color(HOUSE_LIGHT_COLOR),
    lights: real,
    trussX: TRUSSES.map((t) => t.x),
    galleries: GALLERIES,
  };
  return group;
}

/** House lights fade down while a show runs (state.show) and come back up afterwards. */
export function update(group, state, dt) {
  const u = group.userData.roof;
  if (!u) return;
  const target = state && state.show ? 0.05 : 1;
  u.level += (target - u.level) * Math.min(1, (dt || 0.016) * 1.5);
  if (Math.abs(u.level - u.applied) < 0.002) return;
  u.applied = u.level;
  u.lightMaterial.color.copy(u.baseColor).multiplyScalar(0.06 + 0.94 * u.level);
  for (const m of u.fillMaterials) m.emissiveIntensity = u.fill * (0.12 + 0.88 * u.level);
  for (const l of u.lights) l.intensity = SPOT_INTENSITY * u.level;
}

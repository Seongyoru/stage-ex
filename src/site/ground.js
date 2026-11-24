// site/ground — the base of the diorama map: a disc of 420 m radius around the arena
// (DIORAMA in core/envelope.js) presented like an architectural site model on a plinth.
//
//   terrain   ground disc at y = 0 with the Katabira river mouth (帷子川), the harbour basin
//             and the tidal pond cut out of it; quay walls with coping; land-use fields
//             (parks, lawns, vacant lots, car parks); plinth with a section cut at the rim
//   roads     carriageways with widths by class, raised sidewalks with granite kerbs, lane
//             and edge lines, zebra crossings, footways, promenades, cycle paths
//   railway   JR Takashima freight line: ballast, sleepers, rails, fences, catenary, the
//             girder bridge over the river and the tunnel mouth under Minato Mirai Odori
//   bridges   みなとみらい大橋 and みなとみらい橋 (plan and levels from MLIT PLATEAU), the park
//             footbridge over the railway, elevated walkways near the rim
//   trees     surveyed and procedural trees, three instanced species
//
// Geometry source: research/geo/site-context.geojson (OpenStreetMap) baked by
// tools/bake-ground.mjs into src/site/data/ground-data.js.
//
// LEVELS. y = 0 is the outdoor ground = arena floor (4.18 m T.P.). The real land around
// the arena lies between 3.0 and 5.2 m T.P.; the model keeps it flat (fact sheet 2.1).
// The water surface is drawn at −3.0 m: mean sea level is 4.18 m below the arena floor,
// but the river banks are about 1 m lower than the arena datum, so −3.0 m reproduces the
// quay height seen in the photographs (about 3 m at mean tide).
//
// OWNERSHIP. On the Music Terrace site polygon the ground is a plain service-yard asphalt
// at exactly y = 0 and nothing else is drawn there (decks, stairs, plaza: site/precinct).
// Under the arena roof outline the ground is recessed to y = −0.10 so that it can never be
// coplanar with the hall floor.
//
// ctx.flags.ortho  → aerial-photo mode: PLATEAU-Ortho 2024 tiles on the ground instead of
//                    the vector fields and roads (browser only; see ATTRIBUTION). Pass
//                    ortho: true (or 'photo'); the alias flags.aerial also works. A NUMERIC
//                    string is ignored because the dev preview uses ?ortho=<metres> for its
//                    orthographic camera — in the preview use ?aerial=1.
import * as THREE from 'three';
import { GROUND } from './data/ground-data.js';
import { lonLatToWorld } from '../core/frame.js';
import { groundMaterials } from './ground/mats.js';
import { buildTerrain } from './ground/terrain.js';
import { buildRoads } from './ground/roads.js';
import { buildRail } from './ground/rail.js';
import { buildBridges } from './ground/bridges.js';
import { buildTrees } from './ground/trees.js';
import { orthoMaterial, photoUV, ORTHO_ATTRIBUTION } from './ground/ortho.js';
import { liftAt, pointInRing, unflat, WATER_Y } from './ground/util.js';
import { merge, mesh } from '../core/geom.js';

/** Road, water, park, rail and bridge names for the app's labels: { text, en, x, y, z, kind }. */
export const LABELS = GROUND.labels.map((l) => Object.freeze({ ...l, y: Math.max(l.y, Math.round(liftAt(l.x, l.z) * 10) / 10) }));

/** Credit line that must be shown while the aerial-photo mode (flags.ortho) is on. */
export const ATTRIBUTION = ORTHO_ATTRIBUTION;
/** Credit line for the vector map data (always). */
export const DATA_ATTRIBUTION = '地図データ © OpenStreetMap contributors (ODbL) / 橋梁・建物形状: 国土交通省 Project PLATEAU (CC BY 4.0)';

// highway=street_lamp nodes inside the disc in the project's local OSM Overpass extract.
const lampLonLat = [
  [139.6274678, 35.4619134], [139.6307906, 35.4622034], [139.6307905, 35.4622943],
  [139.6305563, 35.4624972], [139.6307903, 35.4623853], [139.6306854, 35.4624614],
  [139.6287360, 35.4619491], [139.6284856, 35.4619486], [139.6282343, 35.4619252],
  [139.6279851, 35.4619460], [139.6277347, 35.4619744], [139.6273309, 35.4620667],
  [139.6274849, 35.4620045], [139.6308632, 35.4619842], [139.6308632, 35.4620665],
  [139.6305960, 35.4619847], [139.6305963, 35.4620641], [139.6303264, 35.4620617],
  [139.6303257, 35.4619851], [139.6301392, 35.4619854], [139.6301398, 35.4620601],
];
export const PROP_SLOTS = lampLonLat.map(([lon, lat]) => {
  const [x, z] = lonLatToWorld(lon, lat);
  return { type: 'street_light', x, y: liftAt(x, z), z, layer: 'ground' };
});

/** Surveyed tree positions that fall on the Music Terrace site (not drawn here): flat [x, z, …]. */
export const SITE_TREES = GROUND.siteTrees;
/** Water surface level (world y). */
export const WATER_LEVEL = WATER_Y;
/** Height of the road-bridge deck under a plan point (0 off the bridges): for props standing on them. */
export const groundLift = (x, z) => liftAt(x, z);
const BASIN = unflat(GROUND.water.basin);
const POND = unflat(GROUND.water.pond);
/** True where the ground is open water (river, harbour, tidal pond). */
export const isWater = (x, z) => pointInRing(x, z, BASIN) || pointInRing(x, z, POND);

const waterUniforms = { uWaterTime: { value: 0 } };

function animateWater(material) {
  if (material.userData.ripple) return;
  material.userData.ripple = true;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWaterTime = waterUniforms.uWaterTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWaterWorld;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWaterWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uWaterTime;\nvarying vec3 vWaterWorld;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        {
          // slow drifting patches of lighter and darker water
          vec2 wp = vWaterWorld.xz;
          float patches = sin(dot(wp, vec2(0.013, 0.021)) + uWaterTime * 0.09 + 1.7 * sin(dot(wp, vec2(-0.017, 0.011)) + uWaterTime * 0.05))
            * sin(dot(wp, vec2(-0.027, 0.009)) - uWaterTime * 0.06 + 1.3 * sin(dot(wp, vec2(0.008, 0.023))));
          diffuseColor.rgb *= 0.96 + 0.07 * patches;
        }`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        {
          // wind ripples: analytic gradient of four travelling sine waves (world space)
          vec2 wp = vWaterWorld.xz;
          float t = uWaterTime;
          vec2 g = vec2(0.0);
          g += 0.050 * cos(dot(wp, vec2(0.52, 0.31)) + t * 1.10) * vec2(0.86, 0.51);
          g += 0.040 * cos(dot(wp, vec2(-0.33, 0.71)) - t * 1.45) * vec2(-0.42, 0.91);
          g += 0.030 * cos(dot(wp, vec2(1.31, -0.92)) + t * 2.10) * vec2(0.82, -0.57);
          g += 0.022 * cos(dot(wp, vec2(2.10, 1.70)) - t * 2.90) * vec2(0.78, 0.63);
          vec3 nWorld = normalize(vec3(-g.x, 1.0, -g.y));
          normal = normalize((viewMatrix * vec4(nWorld, 0.0)).xyz);
        }`,
      );
  };
  material.customProgramCacheKey = () => 'site.water.ripple.v1';
  material.needsUpdate = true;
}

/** Merge the static meshes that share a material (and shadow flags) to keep draw calls low. */
function mergeByMaterial(root, keepSeparate) {
  const buckets = new Map();
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.userData.water) return;
    for (let p = o; p; p = p.parent) if (keepSeparate.has(p.name)) return;
    const k = [o.material.uuid, o.castShadow, o.userData.level ?? ''].join('|');
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(o);
  });
  for (const list of buckets.values()) {
    if (list.length < 2) continue;
    const first = list[0];
    const merged = mesh(merge(list.map((o) => o.geometry)), first.material, { name: list.map((o) => o.name).join(' + '), layer: 'site', level: first.userData.level, cast: first.castShadow, receive: true });
    first.parent.add(merged);
    for (const o of list) o.parent.remove(o);
  }
}

export function build(ctx = {}) {
  const quality = ctx.quality || 'high';
  const flags = ctx.flags || {};
  // The dev preview uses ?ortho=<metres> for its orthographic camera, so a NUMERIC flags.ortho
  // is not the aerial mode: use ortho=true / ortho=photo, or the alias flags.aerial (?aerial=1).
  const on = (v) => v === true || (typeof v === 'string' && ['true', 'photo', 'aerial', 'plateau', 'on', 'yes'].includes(v.toLowerCase()));
  const ortho = on(flags.ortho) || on(flags.aerial) || flags.aerial === '1' || flags.aerial === 1;
  const M = groundMaterials();
  animateWater(M.water);

  const group = new THREE.Group();
  group.name = 'site/ground';
  group.userData.layer = 'site';

  const terrain = buildTerrain(M, { ortho });
  group.add(terrain);
  let index = null;
  if (!ortho) {
    const r = buildRoads(M);
    group.add(r.group);
    index = r.index;
  }
  group.add(buildRail(M));
  const bridges = buildBridges(M, index, ortho);
  group.add(bridges);
  group.add(buildTrees(M, quality));

  if (ortho) {
    const { material, ready } = orthoMaterial(quality);
    const swap = (o) => {
      if (!o.isMesh) return;
      if (o.userData.groundBase || o.name === 'bridge decks') {
        photoUV(o.geometry);
        o.material = material;
      }
    };
    terrain.traverse(swap);
    bridges.traverse(swap);
    group.userData.orthoReady = ready;
    group.userData.attribution = ATTRIBUTION;
  }
  mergeByMaterial(group, new Set(['parkFootbridge']));
  return group;
}

export function update(group, state) {
  waterUniforms.uWaterTime.value = state && state.time ? state.time : 0;
}

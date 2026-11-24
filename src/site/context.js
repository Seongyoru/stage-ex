// Surrounding city buildings of the diorama (layer 'context').
//
// Data: src/site/data/context-data.js, baked by tools/bake-context.mjs from the PLATEAU
// 2024 footprints / heights and the OSM buildings of research/geo/site-context.geojson.
// The arena, Hilton Yokohama, K Tower Yokohama, the annex, the podium / deck and the
// tents are NOT here (site/precinct and the arena modules own them).
//
// Each building is an extruded mass per baked volume with a ground storey, a facade
// family chosen by type and height (office curtain wall, residential tower with real
// balcony slabs, hotel, low commercial, parking structure, shed, civic, utility), a
// parapet, a flat roof with plant, and — on towers — the set-back crown up to the
// surveyed top with a helipad and red obstruction lights. Named landmarks have their own
// treatment (context/landmarks.js). Volumes cut by the diorama rim show a plain section
// face. Geometry is merged per material: one mesh per material id.
//
// Flags (ctx.flags, e.g. preview URL parameters):
//   contextEdge=1   also build the "edge" buildings whose centre lies just outside the
//                   disc (Nissan Global HQ, Yokohama Bay Quarter, the wholesale market,
//                   M.M. Towers Foresis L), cut flush with the rim.
// update(): state.night fades the lit-window pattern of every facade in and out and
// pulses the obstruction lights.
import * as THREE from 'three';
import { mesh } from '../core/geom.js';
import { getMaterial } from '../core/materials.js';
import { DIORAMA } from '../core/envelope.js';
import { CONTEXT_BUILDINGS, CONTEXT_SIGNPOSTS } from './data/context-data.js';
import { Buckets } from './context/builder.js';
import { ensureMaterials, nightMaterials } from './context/styles.js';
import { volume, shed, canopy, parking, styleFor, tintFor } from './context/massing.js';
import { LANDMARKS } from './context/landmarks.js';

const LAYER = 'context';

function buildOne(env, b) {
  const lm = b.landmark && LANDMARKS[b.landmark];
  if (lm) return lm(env, b);
  for (const vol of b.vols) {
    if (b.type === 'canopy') canopy(env, b, vol);
    else if (b.type === 'parking') parking(env, b, vol);
    else if (b.type === 'industrial' && b.roofKind !== 'parkingDeck') shed(env, b, vol, styleFor(b, vol), { tint: tintFor(b, 0.05), roof: b.roofKind === 'metal' ? 'context.roof.metal' : undefined });
    else {
      const o = { tint: tintFor(b) };
      if (b.roofKind === 'metal') o.roof = 'context.roof.metal';
      if (b.roofKind === 'terracotta') {
        o.roof = 'context.roof.terracotta';
        o.crown = 'none';
        o.parapet = 0;
        o.hip = { inset: 3.4, rise: 2.4 };
      }
      volume(env, b, vol, styleFor(b, vol), o);
    }
  }
  return null;
}

export function build(ctx = {}) {
  ensureMaterials();
  const flags = ctx.flags || {};
  const withEdge = flags.contextEdge === '1' || flags.contextEdge === 1 || flags.contextEdge === true;
  const env = { B: new Buckets(), low: ctx.quality === 'low', lights: [] };
  for (const b of CONTEXT_BUILDINGS) {
    if (b.edge && !withEdge) continue;
    buildOne(env, b);
  }
  const group = new THREE.Group();
  group.name = 'context';
  group.userData.layer = LAYER;
  for (const [id, buf] of env.B.map) {
    if (!buf.triangles) continue;
    const m = mesh(buf.toGeometry(), getMaterial(id), { name: `context ${id.replace('context.', '')}`, layer: LAYER });
    group.add(m);
  }
  // red obstruction lights (buildings above 60 m): one instanced mesh
  if (env.lights.length) {
    const geo = new THREE.SphereGeometry(0.42, 8, 6);
    const lamps = new THREE.InstancedMesh(geo, getMaterial('context.light.aviation'), env.lights.length);
    const m4 = new THREE.Matrix4();
    env.lights.forEach((p, i) => lamps.setMatrixAt(i, m4.makeTranslation(p[0], p[1], p[2])));
    lamps.instanceMatrix.needsUpdate = true;
    lamps.name = 'context aviation lights';
    lamps.userData.layer = LAYER;
    lamps.castShadow = false;
    lamps.receiveShadow = false;
    group.add(lamps);
    group.userData.lamps = lamps;
  }
  group.userData.night = -1;
  return group;
}

const DAY_LAMP = new THREE.Color('#b3261a');
const NIGHT_LAMP = new THREE.Color('#ff2a18');

export function update(group, state, dt = 0) {
  const target = state && state.night ? 1 : 0;
  let k = group.userData.night;
  if (k < 0 || !Number.isFinite(k)) k = target; // first frame: no fade
  else if (k !== target) k = target > k ? Math.min(target, k + dt / 1.2) : Math.max(target, k - dt / 1.2);
  if (k !== group.userData.applied) {
    for (const n of nightMaterials()) n.material.emissiveIntensity = k * 1.35 * n.level;
    group.userData.applied = k;
  }
  group.userData.night = k;
  const lamps = group.userData.lamps;
  if (lamps) {
    // steady by day; slow pulse at night, as medium-intensity obstruction lights do
    const pulse = k > 0 ? 0.55 + 0.45 * Math.max(0, Math.sin(((state && state.time) || 0) * 2.1)) : 1;
    lamps.material.color.copy(DAY_LAMP).lerp(NIGHT_LAMP, k).multiplyScalar(k > 0 ? pulse : 1);
  }
}

// ---------------------------------------------------------------- labels
function labelOf(b) {
  const ja = b.short || b.name;
  const text = b.nameKo ? `${ja} · ${b.nameKo}` : ja;
  const l = { text, x: b.c[0], y: Math.round((b.top + 6) * 10) / 10, z: b.c[1], kind: 'building', ja, id: b.id };
  if (b.nameKo) l.ko = b.nameKo;
  if (b.nameEn) l.en = b.nameEn;
  if (b.landmark) l.landmark = b.landmark;
  if (b.edge) l.edge = true;
  return l;
}
const named = CONTEXT_BUILDINGS.filter((b) => b.name && !b.noLabel);
/** Named buildings inside the diorama, plus rim signposts toward the stations (all lie outside the disc). */
export const LABELS = [
  ...named.filter((b) => !b.edge).map(labelOf),
  ...CONTEXT_SIGNPOSTS.map((s) => ({ text: `${s.ja} · ${s.ko}${s.beyond ? ` (+${s.beyond} m)` : ''}`, x: s.x, y: 8, z: s.z, kind: 'station', ja: s.ja, ko: s.ko, en: s.en, beyond: s.beyond, trueX: s.trueX, trueZ: s.trueZ })),
];
/** Labels of the optional edge buildings (only meaningful with contextEdge=1). */
export const EDGE_LABELS = named.filter((b) => b.edge).map(labelOf);
export const CONTEXT_DIORAMA = DIORAMA;

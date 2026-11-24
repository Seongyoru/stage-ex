// Music Terrace precinct around K-Arena Yokohama: Arena Deck (+7.27, LEVEL 3), lower plaza
// (+5.0), Big Steps, gates, slopes and lift towers, the sky-bridge to the hotel, the
// Takashima Suisaisen Deck footbridge, Hilton Yokohama, K Tower Yokohama, the low-rise
// annex, the tents and the outdoor furniture.
//
// Facts: research/00-consolidated.md §2.3, §2.4, §3.2, §9.1, §10; research/exterior-site.md
// §7, §8; research/geo-data.md §3, §6; research/model-spec.json (site, neighbours, props).
// Layout constants (all in the WORLD frame) live in ./precinct/layout.js.
import * as THREE from 'three';
import { Bag, Railings, LAYER } from './precinct/kit.js';
import { M, E, EMISSIVE_IDS } from './precinct/mats.js';
import { buildDecks } from './precinct/decks.js';
import { buildStairs } from './precinct/stairs.js';
import { buildHilton } from './precinct/hilton.js';
import { buildKTower } from './precinct/ktower.js';
import { buildAnnex } from './precinct/annex.js';
import { buildBridges } from './precinct/bridges.js';
import { buildTents } from './precinct/tents.js';
import { buildFurniture, PROP_SLOTS as SLOTS } from './precinct/furniture.js';

/**
 * Positions of the simple stand-in props, so generated 3D props can replace them later:
 * [{ type, x, y, z, rotY }] in world metres (y = the surface the prop stands on).
 */
export const PROP_SLOTS = SLOTS;

// Meshes of these emissive ids only exist when the lights are on.
const NIGHT_ONLY = new Set([
  'precinct.stepLight', 'precinct.tentGlow', 'precinct.liftGlow', 'hilton.windowLit', 'hilton.windowLitDim', 'hilton.crownLight', 'hilton.pierLight',
  'hilton.podiumGlow', 'ktower.windowLit', 'ktower.windowLitDim', 'ktower.crownLight', 'ktower.cornerLight', 'ktower.baseGlow', 'annex.glow', 'tdeck.light',
]);

export function build(ctx = {}) {
  const group = new THREE.Group();
  group.name = 'precinct';
  group.userData.layer = LAYER;
  const quality = ctx.quality || 'high';
  const c = { ...ctx, quality };

  const bag = new Bag();
  const rails = new Railings({ balusters: quality !== 'low' });
  buildDecks(bag, rails, c);
  buildStairs(bag, rails, c);
  buildBridges(bag, rails, c);
  buildTents(bag, rails, c);
  buildHilton(bag, c);
  buildKTower(bag, c);
  buildAnnex(bag, c);
  const extra = buildFurniture(bag, rails, c);

  const meshes = bag.flush(group, { prefix: 'precinct ', hidden: (id) => NIGHT_ONLY.has(id) });
  rails.flush(group, M('precinct.railing'));
  for (const o of extra) group.add(o);

  const nightOnly = [];
  group.traverse((o) => {
    if (!o.isMesh) return;
    const id = o.material && o.material.name;
    if (NIGHT_ONLY.has(id)) {
      o.visible = false;
      nightOnly.push(o);
    }
  });
  group.userData.nightOnly = nightOnly;
  group.userData.night = null;
  return group;
}

const _c = new THREE.Color();
const _d = new THREE.Color();

/** Night mode: lit windows, crown outlines, lanterns, step lights; the outdoor vision cycles slowly. */
export function update(group, state = {}) {
  const night = !!state.night;
  if (group.userData.night !== night) {
    group.userData.night = night;
    for (const o of group.userData.nightOnly || []) o.visible = night;
    for (const id of EMISSIVE_IDS) {
      const m = E(id);
      m.color.set(night ? m.userData.night : m.userData.day);
    }
  }
  // 500-inch outdoor vision without a picture (Node, tests): slow colour drift so the LED reads as "on"
  const vision = E('precinct.vision');
  if (!vision.map) {
    const t = (state.time || 0) * 0.05;
    _c.setHSL((0.72 + 0.12 * Math.sin(t * 2.1)) % 1, 0.65, night ? 0.62 : 0.5);
    _d.set(night ? vision.userData.night : vision.userData.day);
    vision.color.copy(_d).lerp(_c, 0.6);
  }
}

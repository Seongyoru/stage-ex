// Model module registry of the app.
//
// The eleven model modules live in src/site/*.js and src/arena/*.js and are written by
// other people at other times, so nothing here assumes that a module exists or works:
// they are discovered with import.meta.glob, imported lazily one by one, and a module
// that is missing, fails to import or throws in build() is reported and skipped.
//
// Module contract (see src/dev/preview.js):
//   export function build(ctx)               → THREE.Group        ctx = { quality, SPEC, flags }
//   export function update(group, state, dt)   optional, every frame; state = { time, night, show, quality, … }
//   site modules may export LABELS, ATTRIBUTION, PROP_SLOTS; arena/seats exports
//   seatFromInstance, highlightSeat, setSeatModel.
// File names that start with "_" are development helpers and are never part of the app
// (arena/_debug is loaded only by the ?debug=1 flag of a dev server).
import { countTriangles } from './core/geom.js';
import { SPEC } from './core/spec.js';

const loaders = import.meta.glob(['./site/*.js', './arena/*.js', '!./**/_*.js']);
const devLoaders = import.meta.env.DEV ? import.meta.glob(['./arena/_*.js', './site/_*.js']) : {};

/** The expected modules in build order, with the Korean name shown while loading. */
export const MODULES = [
  { id: 'site/ground', ko: '지면' },
  { id: 'site/context', ko: '주변 건물' },
  { id: 'site/precinct', ko: 'Music Terrace' },
  { id: 'arena/structure', ko: '구조체' },
  { id: 'arena/exterior', ko: '외관' },
  { id: 'arena/roof', ko: '지붕' },
  { id: 'arena/hall', ko: '홀' },
  { id: 'arena/bowl', ko: '객석 스탠드' },
  { id: 'arena/seats', ko: '좌석' },
  { id: 'arena/stage', ko: '무대' },
  { id: 'arena/venues', ko: '라운지·콘코스' },
];

const idOf = (key) => key.replace(/^\.\//, '').replace(/\.js$/, '');
const keyOf = (id) => `./${id}.js`;

/** Ids of every module file that exists right now (expected or not). */
export function discoveredModuleIds() {
  return Object.keys(loaders).map(idOf);
}

/**
 * The list of module ids the app should try to build.
 *   only   optional array restricting the list (?mods=arena/bowl,arena/seats)
 *   debug  add the development registration overlay (dev server only)
 */
export function planModules({ only = null, debug = false } = {}) {
  const expected = MODULES.map((m) => m.id);
  const extra = discoveredModuleIds().filter((id) => !expected.includes(id));
  let ids = [...expected, ...extra];
  if (only && only.length) ids = only.filter((id) => !id.split('/').pop().startsWith('_') || devLoaders[keyOf(id)]);
  if (debug && devLoaders['./arena/_debug.js'] && !ids.includes('arena/_debug')) ids.push('arena/_debug');
  return ids;
}

export function moduleName(id) {
  return MODULES.find((m) => m.id === id)?.ko || id;
}

function tagGroup(group, id) {
  group.userData.moduleId = id;
  if (!group.name) group.name = id;
}

/**
 * Import and build one module. Never throws: the result says what happened.
 *   → { id, status: 'ok' | 'missing' | 'failed', group?, mod?, error?, meshes, triangles, buildMs }
 */
export async function buildModule(id, ctx) {
  const key = keyOf(id);
  const loader = loaders[key] || devLoaders[key];
  if (!loader) return { id, status: 'missing', meshes: 0, triangles: 0, buildMs: 0 };
  const t0 = performance.now();
  try {
    const mod = await loader();
    if (typeof mod.build !== 'function') throw new Error(`src/${id}.js does not export build(ctx)`);
    const group = await mod.build(ctx);
    if (!group || !group.isObject3D) throw new Error(`build() of src/${id}.js did not return a THREE.Object3D`);
    tagGroup(group, id);
    let meshes = 0;
    group.traverse((o) => {
      if (o.isMesh) meshes++;
    });
    return { id, status: 'ok', group, mod, meshes, triangles: countTriangles(group), buildMs: Math.round(performance.now() - t0) };
  } catch (error) {
    console.error(`[modules] ${id} failed:`, error);
    return { id, status: 'failed', error, meshes: 0, triangles: 0, buildMs: Math.round(performance.now() - t0) };
  }
}

/**
 * Build all planned modules progressively. `onProgress(index, total, id, phase)` is
 * called before ('start') and after ('done') each module; `onBuilt(result)` receives every
 * result so the caller can add the group to the scene while the next one loads.
 */
export async function buildAll({ ids, quality, flags, onProgress, onBuilt, yieldFrame }) {
  const ctx = { quality, SPEC, flags };
  const results = [];
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    onProgress?.(i, ids.length, id, 'start');
    if (yieldFrame) await yieldFrame();
    const result = await buildModule(id, ctx);
    results.push(result);
    onBuilt?.(result);
    onProgress?.(i + 1, ids.length, id, 'done');
  }
  return results;
}

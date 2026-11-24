#!/usr/bin/env node
// Build one or more model modules in plain Node (no browser) and report statistics.
// Catches import errors, exceptions in build(), NaN vertices, empty output and
// geometry that falls outside the expected envelope.
//
//   node tools/smoke.mjs arena/bowl arena/seats
//
// A module must therefore not touch `document` / `window` at import time or inside
// build() without a `typeof document !== 'undefined'` guard.
import { pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ids = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (ids.length === 0) {
  console.error('usage: node tools/smoke.mjs <module id> [...]   e.g. arena/bowl site/ground');
  process.exit(2);
}
const { SPEC } = await import(pathToFileURL(resolve(root, 'src/core/spec.js')).href);
const { countTriangles } = await import(pathToFileURL(resolve(root, 'src/core/geom.js')).href);

let failed = false;
for (const id of ids) {
  const file = resolve(root, 'src', `${id}.js`);
  try {
    const mod = await import(pathToFileURL(file).href);
    if (typeof mod.build !== 'function') throw new Error('module does not export build(ctx)');
    const t0 = performance.now();
    const group = await mod.build({ quality: 'high', SPEC, flags: {} });
    const ms = Math.round(performance.now() - t0);
    if (!group || !group.isObject3D) throw new Error('build() must return a THREE.Object3D');
    group.updateMatrixWorld(true);
    let meshes = 0;
    let instanced = 0;
    let nan = 0;
    let untaggedLayer = 0;
    const layers = new Set();
    const levels = new Set();
    const materials = new Set();
    group.traverse((o) => {
      if (!o.isMesh) return;
      meshes++;
      if (o.isInstancedMesh) instanced += o.count;
      const p = o.geometry?.attributes?.position;
      if (p) for (let i = 0; i < p.array.length; i++) if (!Number.isFinite(p.array[i])) { nan++; break; }
      let layer;
      let level;
      for (let q = o; q; q = q.parent) {
        if (layer === undefined && q.userData.layer !== undefined) layer = q.userData.layer;
        if (level === undefined && q.userData.level !== undefined) level = q.userData.level;
      }
      if (layer === undefined) untaggedLayer++;
      else layers.add(layer);
      if (level !== undefined) levels.add(level);
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) materials.add(m?.name || '(unnamed)');
    });
    const box = new THREE.Box3().setFromObject(group);
    const r = (v) => v.toArray().map((x) => +x.toFixed(1));
    const out = {
      module: id,
      ok: true,
      buildMs: ms,
      meshes,
      instances: instanced,
      triangles: countTriangles(group),
      bbox: box.isEmpty() ? null : { min: r(box.min), max: r(box.max) },
      layers: [...layers],
      levels: [...levels].sort((a, b) => a - b),
      materials: [...materials].sort(),
      warnings: [],
    };
    if (meshes === 0) out.warnings.push('no meshes produced');
    if (nan) out.warnings.push(`${nan} mesh(es) contain NaN/Infinity vertex positions`);
    if (untaggedLayer) out.warnings.push(`${untaggedLayer} mesh(es) have no userData.layer on themselves or an ancestor`);
    if (materials.has('(unnamed)')) out.warnings.push('some materials were not created through mat()/emissiveMat() (unnamed)');
    if (nan || meshes === 0) {
      out.ok = false;
      failed = true;
    }
    console.log(JSON.stringify(out));
  } catch (e) {
    failed = true;
    console.log(JSON.stringify({ module: id, ok: false, error: e.message }));
    console.error(e.stack);
  }
}
process.exit(failed ? 1 : 0);

// Shared material registry. Modules never construct materials directly: they ask for a
// material by a stable id and give its plain-colour fallback. Generated texture sets are
// attached later by id (see applyTextureManifest), so geometry code never changes when
// textures arrive.
//
//   const white = mat('facade.panelWhite', { color: '#EEEEEA', roughness: 0.7, tile: 2.2 });
//
// Conventions
//   id     '<area>.<thing>' — e.g. 'facade.panelWhite', 'bowl.concrete', 'seat.fabricBlue'.
//   tile   real-world size in metres of one texture repeat. Geometry UVs are in METRES
//          (see geom.js metricUV), so a texture set is applied with repeat = 1 / tile.
//   Any MeshStandardMaterial parameter may be passed. `physical: true` creates a
//   MeshPhysicalMaterial (glass: transmission, ior, thickness …).
import * as THREE from 'three';

const registry = new Map();

export function mat(id, params = {}) {
  const existing = registry.get(id);
  if (existing) return existing;
  const { tile = 2, physical = false, ...rest } = params;
  const m = physical ? new THREE.MeshPhysicalMaterial(rest) : new THREE.MeshStandardMaterial(rest);
  m.name = id;
  m.userData.tile = tile;
  m.userData.baseColor = m.color.getHexString();
  registry.set(id, m);
  return m;
}

/** Unlit material for light sources, LED screens and signs (not affected by scene lighting). */
export function emissiveMat(id, params = {}) {
  const existing = registry.get(id);
  if (existing) return existing;
  const m = new THREE.MeshBasicMaterial(params);
  m.name = id;
  m.userData.unlit = true;
  registry.set(id, m);
  return m;
}

export function getMaterial(id) {
  return registry.get(id) || null;
}

/** Map of every material created so far (id → material). */
export function allMaterials() {
  return registry;
}

/**
 * Attach generated texture sets. `manifest` maps a material id to
 *   { albedo, normal?, roughness?, tile?, normalScale?, keepColor? }
 * with file paths relative to `baseUrl`. Missing ids are ignored, so the manifest can
 * grow while the model already runs on plain colours.
 */
export function applyTextureManifest(manifest, { baseUrl = './textures/', loader = new THREE.TextureLoader(), anisotropy = 8, quality = 'high', onLoad } = {}) {
  const pending = [];
  const textures = new Map();
  for (const [id, set] of Object.entries(manifest || {})) {
    const m = registry.get(id);
    if (!m || m.userData.unlit) continue;
    const tile = set.tile || m.userData.tile || 2;
    const load = (file, colorSpace) => {
      const key = JSON.stringify([file, colorSpace, tile]);
      if (textures.has(key)) return textures.get(key);
      const texture = new Promise((resolve) => {
        loader.load(
          baseUrl + file,
          (t) => {
            if (quality === 'low' && t.image.width > 512) {
              const canvas = document.createElement('canvas');
              canvas.width = 512;
              canvas.height = Math.max(1, Math.round(512 * t.image.height / t.image.width));
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(t.image, 0, 0, canvas.width, canvas.height);
                t.image = canvas;
              }
            }
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            t.repeat.set(1 / tile, 1 / tile);
            t.anisotropy = anisotropy;
            t.colorSpace = colorSpace;
            resolve(t);
          },
          undefined,
          () => resolve(null),
        );
      });
      textures.set(key, texture);
      return texture;
    };
    pending.push(
      (async () => {
        const [albedo, normal, rough] = await Promise.all([
          set.albedo ? load(set.albedo, THREE.SRGBColorSpace) : null,
          set.normal && quality !== 'low' ? load(set.normal, THREE.NoColorSpace) : null,
          set.roughness && quality !== 'low' ? load(set.roughness, THREE.NoColorSpace) : null,
        ]);
        if (albedo) {
          m.map = albedo;
          // The albedo already carries the colour; keep a tint only when asked to.
          if (!set.keepColor) m.color.set('#ffffff');
        }
        if (normal) {
          m.normalMap = normal;
          const s = set.normalScale ?? 1;
          m.normalScale = new THREE.Vector2(s, s);
        }
        if (rough) {
          m.roughnessMap = rough;
          m.roughness = 1;
        }
        m.needsUpdate = true;
      })(),
    );
  }
  return Promise.all(pending).then(() => onLoad && onLoad());
}

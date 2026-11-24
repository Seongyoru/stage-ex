// Optional assets that arrive later. Both are loaded if present and silently skipped if not.
//
//   public/textures/manifest.json   texture sets by material id → applyTextureManifest()
//       { "<material id>": { "albedo": "file.webp", "normal"?, "roughness"?, "tile"?, "normalScale"?, "keepColor"? }, … }
//       (also accepted: { "materials": { … } } and a "baseUrl")
//
//   public/models/manifest.json     generated GLB props and where they stand
//       { "props": [ {
//           "type": "stanchion",              // = PROP_SLOTS type ("name" / "id" also accepted)
//           "file": "stanchion.glb",          // relative to public/models/ ("url" / "glb" / "path" also accepted)
//           "size": [w, d, h],                // metres; the model is scaled uniformly to height h,
//           "height": h,                      //   set on the ground (min y = 0) and centred in plan
//           "scale": 1, "rotY": 0, "y": 0,    // extra uniform scale, turn about +Y (radians), lift
//           "layer": "props", "level": 5, "castShadow": true,
//           "placements": [ [x, y, z, rotY?, scale?] | { "pos": [x, y, z], "rotY"?, "scale"? }, … ],
//           "seat": "balcony"                 // instead of placing it: use the model as the chair of this
//                                             // seat kind through arena/seats setSeatModel(kind, geometry, material)
//       }, … ] }
//       "props" (or "models") may also be an object keyed by type.
//       fit: 'bounds' registers the oriented mesh to the given width/depth/height;
//       hanging aligns its top with the slot, inverted flips a ceiling-mounted fixture.
//       highOnly keeps the lightweight procedural model at low quality.
//       Placements = the manifest's own list + every slot of that type in the PROP_SLOTS exported
//       by the model modules. Each mesh of a GLB becomes one InstancedMesh.
import * as THREE from 'three';
import { applyTextureManifest } from '../core/materials.js';

async function fetchJson(url) {
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') || '';
    if (!/json/.test(type)) return null; // a dev server answers unknown paths with index.html
    return await res.json();
  } catch {
    return null;
  }
}

/** Apply public/textures/manifest.json if it exists. Resolves to the number of texture sets. */
export async function loadTextures(renderer, onLoad, quality = 'high') {
  const manifest = await fetchJson('./textures/manifest.json');
  if (!manifest || typeof manifest !== 'object') return 0;
  const sets = manifest.materials && typeof manifest.materials === 'object' ? manifest.materials : manifest;
  const entries = Object.entries(sets).filter(([, v]) => v && typeof v === 'object' && (v.albedo || v.normal || v.roughness));
  if (!entries.length) return 0;
  const baseUrl = typeof manifest.baseUrl === 'string' ? manifest.baseUrl : './textures/';
  await applyTextureManifest(Object.fromEntries(entries), {
    baseUrl,
    quality,
    anisotropy: Math.min(8, renderer.capabilities.getMaxAnisotropy()),
    onLoad,
  });
  return entries.length;
}

/** Normalise the PROP_SLOTS exports of the modules to { type: [{ pos, rotY, scale }] }. */
export function collectSlots(exportsList) {
  const out = {};
  const push = (type, s) => {
    if (!type || !s) return;
    let pos = Array.isArray(s) ? s : s.pos || s.position || s.at || (s.x !== undefined ? [s.x, s.y ?? 0, s.z] : null);
    if (!Array.isArray(pos) || pos.length < 3) return;
    const rotY = Array.isArray(s) ? s[3] ?? 0 : s.rotY ?? s.rot ?? s.yaw ?? 0;
    const scale = Array.isArray(s) ? s[4] ?? 1 : s.scale ?? 1;
    pos = pos.slice(0, 3).map(Number);
    if (!pos.every(Number.isFinite)) return;
    (out[type] ||= []).push({ pos, rotY: Number(rotY) || 0, scale: Number(scale) || 1, level: s.level, layer: s.layer });
  };
  for (const slots of exportsList) {
    if (!slots) continue;
    if (Array.isArray(slots)) for (const s of slots) push(s?.type || s?.kind || s?.prop || s?.name, s);
    else if (typeof slots === 'object') {
      for (const [type, list] of Object.entries(slots)) {
        if (Array.isArray(list)) for (const s of list) push(type, s);
        else if (list && Array.isArray(list.slots)) for (const s of list.slots) push(type, s);
      }
    }
  }
  return out;
}

function normaliseProps(manifest) {
  const raw = manifest.props || manifest.models || manifest;
  const list = Array.isArray(raw) ? raw : Object.entries(raw).map(([type, v]) => (v && typeof v === 'object' ? { type, ...v } : { type, file: v }));
  return list
    .map((p) => ({ ...p, type: p.type || p.id || p.name, file: p.file || p.url || p.glb || p.path }))
    .filter((p) => p.type && typeof p.file === 'string' && /\.(glb|gltf)$/i.test(p.file));
}

/** Transform that scales a loaded model to its real height, grounds and centres it. */
function fitMatrix(root, p) {
  const m = new THREE.Matrix4();
  const targetH = Array.isArray(p.size) ? Number(p.size[2]) : Number(p.height);
  const extra = Number(p.scale) || 1;
  if (!targetH) return m.makeScale(extra, extra, extra);
  const box = new THREE.Box3().setFromObject(root);
  if (p.fit === 'bounds') {
    // Generated meshes have arbitrary unit-cube proportions and front axes.
    // Rotate before measuring, then fit the documented width, depth and height.
    const turn = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(
      p.inverted ? Math.PI : 0, Number(p.rotY) || 0, 0, 'YXZ',
    ));
    box.applyMatrix4(turn);
    const extent = box.getSize(new THREE.Vector3());
    if (Math.min(extent.x, extent.y, extent.z) <= 0 || !p.size?.every((n) => Number.isFinite(n) && n > 0)) return null;
    const center = box.getCenter(new THREE.Vector3());
    const [width, depth, height] = p.size;
    const sy = p.hanging ? box.max.y : box.min.y;
    return m.makeScale(width / extent.x, height / extent.y, depth / extent.z)
      .multiply(new THREE.Matrix4().makeTranslation(-center.x, -sy, -center.z)).multiply(turn);
  }
  const h = box.max.y - box.min.y;
  const s = (h > 1e-6 ? targetH / h : 1) * extra;
  const cx = (box.min.x + box.max.x) / 2;
  const cz = (box.min.z + box.max.z) / 2;
  return m.makeScale(s, s, s).multiply(new THREE.Matrix4().makeTranslation(-cx, -box.min.y, -cz));
}

/**
 * Load public/models/manifest.json and instance the listed GLB props.
 *   slotExports  PROP_SLOTS exports of the model modules
 *   seatsApi     the arena/seats module (for "seat" entries), optional
 * Returns { group, types, seatKinds } or null when there is no manifest (or nothing to use).
 */
export async function loadProps(slotExports, seatsApi, quality = 'high') {
  const manifest = await fetchJson('./models/manifest.json');
  if (!manifest || typeof manifest !== 'object') return null;
  const props = normaliseProps(manifest);
  if (!props.length) return null;
  const slots = collectSlots(slotExports);
  const wanted = props.filter((p) => !(p.highOnly && quality === 'low') && ((p.seat && seatsApi) || p.placements?.length || slots[p.type]));
  if (!wanted.length) return null;
  const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
    import('three/addons/loaders/GLTFLoader.js'),
    import('three/addons/libs/meshopt_decoder.module.js'),
  ]);
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const group = new THREE.Group();
  group.name = 'props';
  group.userData.layer = 'props';
  group.userData.moduleId = 'app/props';
  const types = [];
  const seatKinds = [];
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const p3 = new THREE.Vector3();
  const s3 = new THREE.Vector3();
  const files = new Map();
  const seatModels = [];

  await Promise.all(
    wanted.map(async (p) => {
      let gltf;
      try {
        const url = /^(\.|\/|https?:)/.test(p.file) ? p.file : `./models/${p.file}`;
        if (!files.has(url)) files.set(url, loader.loadAsync(url));
        gltf = await files.get(url);
      } catch (e) {
        console.warn(`[assets] prop "${p.type}" could not be loaded:`, e?.message || e);
        return;
      }
      const root = gltf.scene;
      root.updateMatrixWorld(true);
      const fit = fitMatrix(root, p);
      if (!fit) {
        console.warn(`[assets] skipped "${p.type}": invalid model bounds or size`);
        return;
      }
      const turn = new THREE.Matrix4().makeRotationY(p.fit === 'bounds' ? 0 : Number(p.rotY) || 0);
      const lift = new THREE.Matrix4().makeTranslation(0, Number(p.y) || 0, 0);
      const local = lift.multiply(turn).multiply(fit); // model space → prop space (metres, on the ground)

      if (p.seat) {
        // chair model for one seat kind: the first mesh, baked into prop space
        let first = null;
        root.traverse((o) => {
          if (o.isMesh && !first) first = o;
        });
        if (first && seatsApi && typeof seatsApi.setSeatModel === 'function') {
          try {
            const g = first.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(local, first.matrixWorld));
            seatModels.push({ kind: p.seat, geometry: g, material: first.material });
          } catch (e) {
            console.warn(`[assets] seat model "${p.seat}" rejected:`, e?.message || e);
          }
        }
        return;
      }

      const own = collectSlots([{ [p.type]: p.placements || [] }])[p.type] || [];
      const places = [...own, ...(slots[p.type] || [])];
      if (!places.length) return;
      const holder = new THREE.Group();
      holder.name = `prop:${p.type}`;
      holder.userData.propType = p.type;
      holder.userData.idleOnly = !!p.idleOnly;
      const batches = new Map();
      for (const place of places) {
        const layer = place.layer ?? p.layer ?? 'props';
        const level = place.level ?? p.level;
        const key = JSON.stringify([layer, level]);
        if (!batches.has(key)) batches.set(key, { layer, level, places: [] });
        batches.get(key).places.push(place);
      }
      for (const batch of batches.values()) {
        root.traverse((o) => {
          if (!o.isMesh) return;
          const inst = new THREE.InstancedMesh(o.geometry, o.material, batch.places.length);
          inst.userData.layer = batch.layer;
          inst.userData.level = batch.level;
          inst.userData.noCollide = true; // use the inexpensive original geometry for walking
          inst.name = `${p.type}/${o.name || 'mesh'}`;
          const base = new THREE.Matrix4().multiplyMatrices(local, o.matrixWorld);
          batch.places.forEach((pl, i) => {
            q.setFromAxisAngle(up, pl.rotY);
            m4.compose(p3.set(pl.pos[0], pl.pos[1], pl.pos[2]), q, s3.setScalar(pl.scale)).multiply(base);
            inst.setMatrixAt(i, m4);
          });
          inst.instanceMatrix.needsUpdate = true;
          inst.computeBoundingBox();
          inst.computeBoundingSphere();
          inst.castShadow = p.castShadow !== false;
          inst.receiveShadow = true;
          holder.add(inst);
        });
      }
      if (!holder.children.length) return;
      group.add(holder);
      types.push(p.type);
    }),
  );
  for (const { kind, geometry, material } of seatModels) {
    try {
      seatsApi.setSeatModel(kind, geometry, material);
      seatKinds.push(kind);
    } catch (error) {
      console.warn(`[assets] seat model "${kind}" rejected:`, error);
    }
  }
  return types.length || seatKinds.length ? { group, types, seatKinds } : null;
}

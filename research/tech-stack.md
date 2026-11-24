# K-Arena Yokohama digital twin — implementation technology (tech stack) research

Research date: **2026-11-23**. Scope: implementation technology only (map engine, three.js, 3D Tiles, build/deploy, geodesy, AI asset generation). Venue geometry is covered by the other research reports.

Confidence tags used throughout:

- **CONFIRMED** — stated by an official / primary source that was opened and read on 2026-11-23, or **measured locally** in a throw-away test project (see section 11 "Local verification log").
- **REPORTED** — credible secondary source, or a page summary that could not be cross-checked.
- **ESTIMATED** — derived by me; derivation is shown.

Local machine used for verification (CONFIRMED, `nvidia-smi`, `node --version`, `py -0`): Windows 11 Pro, **NVIDIA GeForce RTX 3080, 10240 MiB**, driver 621.01, **Node v24.20.0 / npm 11.19.0**, **Python 3.14.2 (default) and 3.12.10**, git 2.54.0, git-lfs 3.7.1, GitHub CLI `gh` **not installed**.

---

## 0. TL;DR — pinned recommendation

| Layer | Choice | Pinned version (npm `latest` on 2026-11-23) | Why |
|---|---|---|---|
| Map engine | **MapLibre GL JS** | `maplibre-gl@6.19.0` (released 2026-11-17) | Keyless, BSD-3, vector + raster basemaps, official three.js interop through `CustomLayerInterface`; verified working with three r187 |
| 3D engine | **three.js, `WebGLRenderer` (WebGL 2)** | `three@0.187.0` (r187, 2026-10-30) | Required for context sharing with MapLibre; every addon we need (CSM, EffectComposer, BVH, 3D Tiles plugins) targets it |
| Collision / raycast | three-mesh-bvh | `three-mesh-bvh@0.9.18` (2026-11-03) | Capsule-vs-triangle walking, fast picking |
| 3D Tiles (PLATEAU city context) | NASA-AMMOS 3DTilesRendererJS | `3d-tiles-renderer@0.5.4` (2026-11-03) | Loads PLATEAU b3dm + Draco + WebP directly; `ReorientationPlugin` gives a local ENU frame (verified) |
| Post-processing | three addons `EffectComposer` + `UnrealBloomPass` + `OutputPass` (or `postprocessing@6.39.6`, peer `three >=0.168 <0.188`) | bundled with three | Stage-light bloom in the interior view |
| Bundler | **Vite** | `vite@8.3.8` (Rolldown-based; Node `^20.19.0 || >=22.12.0`) | Verified: production build in ~0.27 s, emits Draco/Basis wasm + MapLibre worker automatically |
| Hosting | GitHub Pages via GitHub Actions | `actions/checkout@v7`, `actions/setup-node@v7`, `actions/configure-pages@v6`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5` | Static, no server, no keys |
| Basemap (keyless) | OpenFreeMap `liberty` vector style **or** GSI raster tiles (`pale`, `seamlessphoto`) | n/a | Both verified loading without any key |
| Asset optimisation | glTF-Transform CLI / gltfpack + KTX2 | `@gltf-transform/cli@4.5.1`, `gltfpack@1.3.0`, `meshoptimizer@1.3.0`, KTX-Software 4.4.2 | meshopt + KTX2/WebP keep every file far below 100 MiB |

**Architecture recommendation (one scene module, two views):**

1. **Map view** (landing): MapLibre map + a three.js custom layer that shares MapLibre's WebGL 2 context and draws the arena exterior (shell, roof, plaza, deck) in local metres. Depth is shared with MapLibre `fill-extrusion` buildings.
2. **Twin view** (enter / section cut / seat view / first-person walk): a separate full-window three.js canvas with its own `WebGLRenderer` (HDR half-float pipeline, bloom, shadows, clipping planes, BVH collisions). Same local coordinate frame, same procedural builders, plus the heavy interior (about 20,000 instanced seats, stage, concourses). City context there = PLATEAU **no-texture** LOD2 tiles (7.7 MB GPU cache, measured) or a pre-baked GLB; ground = a baked ortho/map texture.
3. Switch with a camera hand-off (`map.flyTo` → cross-fade → twin camera initialised from the same pose).

Rejected as the primary engine: deck.gl (data-viz oriented, weak for a hand-built PBR interior), CesiumJS (heavy bundle, globe engine, awkward for procedural interiors, default assets need an ion token), single shared GL context for everything (no practical post-processing/HDR inside MapLibre's framebuffer). Details in section 2.

---

## 1. Version table (all CONFIRMED with `npm view <pkg> version` on 2026-11-23)

| Package | Version | Release date / note |
|---|---|---|
| maplibre-gl | **6.19.0** | dist-tags: `latest` 6.19.0, `latest-5` 5.24.1, `next` 6.0.0-22. 6.0.0 → 6.19.0 shipped between about July and 17 Nov 2026 |
| three | **0.187.0** | r187 published 2026-10-30 (r186 2026-09-08, r185 2026-06-25, r184 2026-04-16, r183 2026-02-18) |
| @types/three | 0.187.0 | |
| 3d-tiles-renderer | **0.5.4** | 2026-11-03; peer `three >=0.167.0`; deps `pmtiles`, `pbf`, `@mapbox/vector-tile` |
| three-mesh-bvh | **0.9.18** | 2026-11-03; peer `three >= 0.159.0` |
| vite | **8.3.8** | `beta` 8.4.0-beta.1; engines `node ^20.19.0 || >=22.12.0`; depends on `rolldown ~1.2.18` |
| postprocessing (pmndrs) | 6.39.6 | peer `three >= 0.168.0 < 0.188.0` (will need an update at r188) |
| maplibre-gl-three | 3.0.2 | third-party glue lib used by the official MapLibre example; peers `three ^0.186.1` (does **not** accept 0.187.x), `maplibre-gl ^6.12.0`, `3d-tiles-renderer ^0.5.3` |
| deck.gl | 9.4.1 | `beta` tag 10.0.0-alpha.1 |
| cesium | 1.147.0 | |
| camera-controls | 3.1.2 | |
| meshoptimizer / gltfpack | 1.3.0 / 1.3.0 | GitHub release v1.3 2026-09-25 |
| @gltf-transform/cli, core, functions, extensions | 4.5.1 | engines `node >=20` |
| ktx2-encoder | 0.6.0 | "KTX2 encoder for browser applications" (WASM) |
| sharp | 0.35.5 | |
| pmtiles | 4.5.0 | |
| proj4 | 2.23.0 | |
| lil-gui | 0.21.0 | |
| three-bvh-csg | 0.0.18 | |
| @dimforge/rapier3d-compat | 0.21.0 | (not needed; BVH capsule is enough) |
| typescript | 7.0.2 | optional |
| @google/genai | 3.6.1 | Gemini SDK |
| openai | 7.62.0 | |
| @fal-ai/client | 1.11.0 | |
| replicate | 1.4.0 | |
| @gradio/client | 2.8.0 | option name is `token` (not `hf_token`) |
| onnxruntime-node / onnxruntime-web | 1.31.1 | |
| @huggingface/transformers | 4.3.2 | |
| Python: torch | 2.15.0 | requires Python >=3.11; Windows wheels cp311–cp315 |
| Python: diffusers / transformers | 0.43.0 / 5.24.0 | Python >=3.11 |
| Python: gradio_client / huggingface_hub | 2.7.2 / 2.4.0 | |
| Python: onnxruntime / rembg / trimesh | 1.32.0 / 2.0.87 / 5.2.2 | |
| ComfyUI | v0.46.0 (2026-11-18) | "Python 3.13 is very well supported and 3.14 works"; "cu130 or above is required on Nvidia 20 series and above" |
| GitHub Actions | checkout **v7.0.1**, setup-node **v7.1.0**, configure-pages **v6.0.0**, upload-pages-artifact **v5.0.0**, deploy-pages **v5.0.1** | GitHub API `releases/latest` |

The project scaffold that already exists in the repo (`package.json`: `three 0.187.0`, `three-mesh-bvh 0.9.18`, `vite 8.3.8`; `vite.config.js` with `base: './'`) is consistent with this table. `npm i three@0.187.0 maplibre-gl@6.19.0 3d-tiles-renderer@0.5.4 three-mesh-bvh@0.9.18 vite@8.3.8 postprocessing@6.39.6` installs with **no peer conflicts** (CONFIRMED locally, 50 packages, 114 MB `node_modules`).

---

## 2. Map engine and three.js integration

### 2.1 MapLibre GL JS 6 — what changed (CONFIRMED: CHANGELOG.md and v5-to-v6 migration guide)

| Topic | v6 fact |
|---|---|
| Distribution | **ESM only.** No UMD, no CSP bundle, no CommonJS. Files: `dist/maplibre-gl.mjs` (1.1 MB), `dist/maplibre-gl-worker.mjs` (0.55 MB), `dist/maplibre-gl.css` (72 kB) |
| Imports | **No default export** (verified: `maplibregl.default === undefined`, Vite warns `IMPORT_IS_UNDEFINED`). Use `import * as maplibregl from 'maplibre-gl'` or named imports |
| Worker | With any bundler a one-time `setWorkerUrl()` is mandatory. Without it the map fails with **"Worker failed to load. Check that the worker URL is correct."** (reproduced locally). Vite recipe: `import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'; setWorkerUrl(workerUrl);` |
| WebGL | **WebGL 1 removed; WebGL 2 required.** Constructor throws `GPUInitializationError` when unavailable |
| Internals | `map.transform` **removed**; `transform.getMatrixForModel` **removed** (old three.js snippets that use them no longer work) |
| CDN | Pin a major (`maplibre-gl@^6.0.0`); `@latest`/unversioned URLs render a blank grey map |
| Custom layers | 6.0.0 added `getProjectionData` to the render args and "improved ProjectionData matrix types" (matrices are **Float64Array**, verified); 6.4.1 made `projectionTransition` live for custom layers; 6.13.0 added experimental `renderToTerrainTile`, `terrainTileRevision`, `renderTerrainHeightMap` |
| Camera | `centerClampedToGround`, `setRoll`, `setVerticalFieldOfView`, `calculateCameraOptionsFromCameraLngLatAltRotation(cameraLngLat, cameraAlt, bearing, pitch, roll?)`, `calculateCameraOptionsFromTo(from, altitudeFrom, to, altitudeTo?)` exist in 6.19 typings; official "Walk around a map in first person" example uses `pitch: 90, maxPitch: 95, centerClampedToGround: false, interactive: false` and drives the camera with `map.jumpTo(map.calculateCameraOptionsFromTo(eye, 1.6, ahead, 1.6))` |
| Other | style-spec 26.9.0 bundled; `fill-extrusion` paint props: opacity, layer-opacity, color, translate, pattern, height, base, vertical-gradient; expressions `distance` (JS >= 4.2.0) and `within` are available; `sky` and `light` root properties exist |

Sources: https://raw.githubusercontent.com/maplibre/maplibre-gl-js/main/CHANGELOG.md , https://raw.githubusercontent.com/maplibre/maplibre-gl-js/main/docs/guides/v5-to-v6-migration-guide.md , https://raw.githubusercontent.com/maplibre/maplibre-gl-js/main/docs/index.md , `node_modules/maplibre-gl/dist/maplibre-gl.d.ts` (6.19.0).

### 2.2 `CustomLayerInterface` in 6.19 — exactly how the matrix is obtained now

Interface (CONFIRMED from the 6.19.0 typings): `id`, `type: 'custom'`, `renderingMode?: '2d' | '3d'`, `onAdd?(map, gl: WebGL2RenderingContext)`, `onRemove?(map, gl)`, `prerender?(gl, args)`, `render(gl, args)`, experimental `renderToTerrainTile?`, `terrainTileRevision?`.

`render(gl, args)` — `args` is a `CustomRenderMethodInput`. Keys observed at runtime (CONFIRMED locally): `farZ, nearZ, fov, modelViewProjectionMatrix, projectionMatrix, shaderData, defaultProjectionData, getProjectionData, renderTerrainHeightMap`.

`args.defaultProjectionData` keys (CONFIRMED locally): `mainMatrix, tileMercatorCoords, clippingPlane, projectionTransition, fallbackMatrix, clipAntimeridian`.

- **`args.defaultProjectionData.mainMatrix`** — a **`Float64Array(16)`** that maps Web-Mercator world coordinates (x, y in 0..1, z in mercator units) to clip space under Mercator projection. The typings say: "If you just need a projection matrix, use `defaultProjectionData.mainMatrix`. A projection matrix is sufficient for simple custom layers that only support mercator projection."
- `args.projectionMatrix` — view space → clip space (needed only if you want to recover a real camera pose).
- `args.defaultProjectionData.projectionTransition` — 0 = Mercator, 1 = globe. With `projection: globe` the layer must not draw (or must use the shader prelude) while this is > 0.

The official MapLibre examples as of today:

- "Add a 3D model with babylon.js": `const cameraMatrix = BABYLON.Matrix.FromArray(args.defaultProjectionData.mainMatrix); const wvp = worldMatrix.multiply(cameraMatrix);` with `worldMatrix` = scale(`meterInMercatorCoordinateUnits()`) × rotation × translation(`MercatorCoordinate.fromLngLat(origin, alt)`). (https://github.com/maplibre/maplibre-gl-js/blob/main/test/examples/add-a-3d-model-with-babylonjs.html)
- "Add 3D Tiles, 3D objects and models using Three.js" (created 2026-10-05) no longer shows raw matrix code; it delegates to the third-party **`maplibre-gl-three@3.0.0`** (`ThreeDManager`, `createLayer()`, `layer.load3dTiles()`, `getEcefMatrix()`), import map: three 0.186.1, 3d-tiles-renderer 0.5.3. (https://github.com/maplibre/maplibre-gl-js/blob/main/test/examples/add-3d-tiles-3d-objects-and-models-using-threejs.html)
- `maplibre-gl-three` internally does exactly this (read from its source, `src/library/helpers/mapCamera.ts` and `core/ThreeLayerImpl.ts`): `combined = mainMatrix × localToMap`; `view = inverse(args.projectionMatrix) × combined`; decompose `inverse(view)` into camera position + quaternion (dropping scale); `camera.projectionMatrix = combined × camera.matrixWorld`, normalised by `-elements[11]`; then `renderer.resetState(); renderer.render(scene, camera)`. It skips drawing while `projectionTransition > 0` and calls `map.triggerRepaint()` every frame.

**Recommendation: do not depend on `maplibre-gl-three`** for this project. Reasons: (a) peer dependency `three ^0.186.1` rejects r187; (b) it works in ECEF and fetches an EGM96 geoid GeoTIFF (< 3 MiB) from a CDN at init; (c) it repaints continuously; (d) we need about 60 lines. Use the verified layer below.

#### Verified code (MapLibre 6.19.0 + three r187 + Vite 8.3.8)

Local frame used by the whole project: **+X = east, +Y = up, +Z = south** (three.js default Y-up, right-handed; north = −Z), units = true metres, origin = a fixed lon/lat near the arena centre.

```js
// src/map/arenaLayer.js
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import * as THREE from 'three';

maplibregl.setWorkerUrl(workerUrl);          // mandatory with bundlers in v6

/** local metres (X east, Y up, Z south) -> Web-Mercator world units, anisotropy-corrected for WGS84 */
export function localToMercatorMatrix(origin /* {lng, lat, alt} */) {
  const mc = maplibregl.MercatorCoordinate.fromLngLat([origin.lng, origin.lat], origin.alt ?? 0);
  const sUp = mc.meterInMercatorCoordinateUnits();            // MapLibre's own metre (R = 6371008.8 m)
  const phi = origin.lat * Math.PI / 180, a = 6378137, e2 = 0.00669437999014;
  const w2 = 1 - e2 * Math.sin(phi) ** 2;
  const N = a / Math.sqrt(w2);                                // prime-vertical radius
  const M = a * (1 - e2) / (w2 * Math.sqrt(w2));              // meridional radius
  const sx = 1 / (2 * Math.PI * N * Math.cos(phi));           // mercator units per TRUE metre east
  const sz = 1 / (2 * Math.PI * M * Math.cos(phi));           // mercator units per TRUE metre south
  return new THREE.Matrix4().set(
    sx, 0,   0,  mc.x,
    0,  0,   sz, mc.y,
    0,  sUp, 0,  mc.z,
    0,  0,   0,  1);
}

export function createArenaLayer({ id = 'arena-3d', origin, scene }) {
  const camera = new THREE.PerspectiveCamera();
  camera.matrixAutoUpdate = false;
  const l2m = localToMercatorMatrix(origin);
  const main = new THREE.Matrix4(), combined = new THREE.Matrix4(), view = new THREE.Matrix4(), scl = new THREE.Vector3();
  let renderer, map;
  return {
    id, type: 'custom', renderingMode: '3d',
    camera,
    onAdd(m, gl) {
      map = m;
      renderer = new THREE.WebGLRenderer({ canvas: m.getCanvas(), context: gl, antialias: true });
      renderer.autoClear = false;                 // never clear MapLibre's framebuffer
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;   // PCFSoftShadowMap is deprecated since r182
    },
    onRemove() { renderer?.dispose(); renderer = null; },
    render(gl, args) {
      const pd = args.defaultProjectionData;
      if (pd.projectionTransition > 0) return;    // globe not supported by this simple path
      main.fromArray(pd.mainMatrix);              // Float64Array -> Matrix4 (JS numbers are doubles)
      combined.multiplyMatrices(main, l2m);       // local metres -> clip, computed in double precision

      // recover a rigid camera so specular, env reflections, fog, LOD, CSM and raycasting are correct
      view.fromArray(args.projectionMatrix).invert().multiply(combined);
      view.invert().decompose(camera.position, camera.quaternion, scl);
      camera.quaternion.normalize(); camera.scale.set(1, 1, 1);
      camera.updateMatrix(); camera.matrixWorld.copy(camera.matrix);
      camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
      camera.projectionMatrix.multiplyMatrices(combined, camera.matrixWorld);
      const n = -camera.projectionMatrix.elements[11];
      if (n !== 0) camera.projectionMatrix.multiplyScalar(1 / n);
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

      renderer.resetState();                      // MapLibre left arbitrary GL state
      renderer.render(scene, camera);
      // call map.triggerRepaint() here only while something animates
    },
  };
}

// usage
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://tiles.openfreemap.org/styles/liberty',
  center: [ORIGIN.lng, ORIGIN.lat], zoom: 16.5, pitch: 60, bearing: -20, maxPitch: 85,
  canvasContextAttributes: { antialias: true },   // MSAA for the shared context (custom layers are aliased otherwise)
});
map.on('load', () => {
  const firstSymbol = map.getStyle().layers.find((l) => l.type === 'symbol')?.id;
  map.addLayer(createArenaLayer({ origin: ORIGIN, scene }), firstSymbol);   // labels stay on top
});
```

What was measured with this code (CONFIRMED locally, canvas 1024×753, RTX 3080):

| Check | Result |
|---|---|
| Local origin vs `map.project([lng, lat])` | 0.00 px |
| Point 100 true m east / 100 true m north vs `map.project()` of the WGS84 lon/lat, **uniform scale** `meterInMercatorCoordinateUnits()` | 0.33 px / 0.16 px off (144 px and 77 px spans) = +0.225 % E-W, −0.22 % N-S |
| Same with the **anisotropic** `sx`, `sz` above | **0.00 px / 0.00 px** |
| Triangle winding | top face of a +Y box is CCW in NDC → default `FrontSide` materials work, no flip needed |
| Recovered camera pose | position (234 E, 396 up, 644 S) m at zoom 16.5 / pitch 60 — consistent (396 × tan 60° = 686 m ground distance vs 685 m); MapLibre's view matrix carries a uniform scale (0.687 here), which is why decomposition + re-multiplication is needed |
| Shadows | `DirectionalLight` shadow map (2048²) renders correctly inside the custom layer; shadow on the map needs a `ShadowMaterial` catcher plane in the three scene |
| Depth with `fill-extrusion` | Shared depth works both ways: an OSM extrusion hid the test box where it was taller; instanced seats above it stayed visible |
| Throughput | **170 fps** with 20,000 `InstancedMesh` boxes (241,946 triangles, 6 draw calls) + shadow pass + raster basemap, continuous repaint |
| Production build | `vite build` with `base: '/K-Arena_Yokohama/'` and with `base: './'` both work; worker emitted as `assets/maplibre-gl-worker-*.js` referenced through `new URL(..., import.meta.url)` |

A simpler variant that skips pose recovery (`camera.projectionMatrix.copy(combined)` with the camera left at identity) projects identically (verified), but then the "camera" sits at the local origin: specular highlights, environment reflections, fog and distance-based LOD are wrong. Use it only for unlit/Lambert content.

### 2.3 Limits of the shared-context approach (why the interior gets its own renderer)

| Topic | Finding | Confidence |
|---|---|---|
| Depth / occlusion | `renderingMode: '3d'` shares the depth buffer with `fill-extrusion`; correct mutual occlusion needs the exact MapLibre projection (we use it). Symbols/labels do not write depth: insert the custom layer **before the first `symbol` layer** to keep labels on top | CONFIRMED (docs + test) |
| OSM building at the arena site | OpenFreeMap `liberty` has `building` (fill, minzoom 13) and **`building-3d`** (`fill-extrusion`, source `openmaptiles`, source-layer `building`, minzoom 14). OSM-derived extrusions are drawn on the block around the test origin (next to the labels "K-ARENA SHOP" and "MINATOMIRAI 6-CHOME"), so they will fight with the detailed model. Remove them with a filter, e.g. `map.setFilter('building-3d', ['all', <old filter>, ['>', ['distance', arenaFootprintGeoJSON], 3]])`, or hide `building-3d` and add your own `fill-extrusion` from a small static GeoJSON | layer facts CONFIRMED; the `distance` filter on polygon features is **not yet tested** |
| Shadows | three.js shadows work for three.js objects only. MapLibre extrusions neither cast onto nor receive from three.js. Use a `ShadowMaterial` ground catcher. No cascaded shadows needed at map scale | CONFIRMED (test) |
| Post-processing | `EffectComposer` renders to its own targets and then to the default framebuffer, replacing/mixing MapLibre's image is impractical; MapLibre's canvas is 8-bit sRGB. **No bloom/HDR in the map view.** | ESTIMATED (architecture) |
| Tone mapping / colour | When three.js renders straight into MapLibre's framebuffer, tone mapping and sRGB conversion happen in the material shaders. Use `NoToneMapping` or `NeutralToneMapping` so the model matches the flat map colours | ESTIMATED |
| Antialiasing | Must be requested on the map: `canvasContextAttributes: { antialias: true }` (three's `antialias` flag is ignored when a context is supplied) | CONFIRMED (official examples) |
| Globe | `projection: { type: 'globe' }` switches to Mercator at high zoom; a matrix-only layer must skip frames while `projectionTransition > 0`. Keep the default Mercator projection | CONFIRMED (maplibre-gl-three source, typings) |
| Terrain | Minato Mirai is flat reclaimed land; do **not** enable `terrain` (it adds render-to-texture passes and camera clamping). Keyless DEM exists if ever needed: `https://tiles.mapterhorn.com/tilejson.json` (used by the official example) | CONFIRMED (example) |
| GL state | Always `renderer.resetState()` before rendering; set `renderer.autoClear = false` | CONFIRMED |
| Repaint | MapLibre renders on demand. Call `map.triggerRepaint()` only while animating | CONFIRMED |
| Precision | Mercator coordinate of the site is about (0.8879, 0.3945). One float32 ULP there = 5.96e-8 = **1.94 m**. Never put Mercator coordinates into vertex buffers; keep vertices in local metres and multiply the Float64 `mainMatrix` by the local matrix on the CPU (done above) | ESTIMATED (computed) |
| Near plane | `args.nearZ` / `args.farZ` are provided each frame (how MapLibre derives them was not inspected). Eye-level cameras are demonstrated by the official first-person example | CONFIRMED (typings, example) |

### 2.4 Keyless basemap sources

| Source | URL | Notes | Confidence |
|---|---|---|---|
| OpenFreeMap vector styles | `https://tiles.openfreemap.org/styles/liberty` (also `bright`, `positron`) | No key, no registration; attribution "OpenFreeMap © OpenMapTiles Data from OpenStreetMap"; 111 layers in `liberty`; OpenMapTiles schema | CONFIRMED (loaded locally; quick-start page) |
| GSI 淡色地図 (pale) | `https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png` | z 5–18, PNG, attribution 「国土地理院」/「地理院タイル」 with link to https://maps.gsi.go.jp/development/ichiran.html | CONFIRMED (loaded locally; GSI tile list) |
| GSI 標準地図 (std) | `https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png` | z 5–18 | CONFIRMED |
| GSI 全国最新写真 (seamlessphoto) | `https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg` | z 14–18 (z 2–13 other imagery), JPEG; 256-px tiles; at this latitude z18 ≈ 0.486 m/px | CONFIRMED (list) / ESTIMATED (m/px) |
| PLATEAU road MVT | `https://assets.cms.plateau.reearth.io/assets/69/36a0fb-7483-4086-9e0e-ef5fa3c3672c/14100_yokohama-shi_city_2024_citygml_2_op_tran_mvt_lod1/{z}/{x}/{y}.mvt` (layer `Road`) | From the PLATEAU data catalog API | CONFIRMED (catalog) |

MapLibre zoom ↔ ground resolution at lat 35.4645 (512-px tile convention, ESTIMATED from R = 6371008.8): z16 0.972 m/px, z17 0.486, z18 0.243, z19 0.121, z20 0.061.

### 2.5 Alternatives considered

| Option | Strengths | Weaknesses for this project | Verdict |
|---|---|---|---|
| **MapLibre 6 + three.js custom layer** | Real slippy map with labels, keyless, small API surface, official interop, shared depth | No post-processing / HDR in the shared framebuffer; map keeps drawing while indoors | **Use for the map view** |
| **Pure three.js + tiled ground** (`3d-tiles-renderer` `GeneratedSurfacePlugin` + `XYZTilesOverlay`, `EnvironmentControls`) | One renderer, full control over lighting, shadows, bloom; example `mapTiles.js` shows planar XYZ tiles | Re-implements map UX; the overlay/surface plugins are new (added 0.4.25, May 2026; options renamed in 0.5.3) and still moving; labels need `MVTAnnotationsPlugin` | **Use the idea for the twin view, with a baked ground texture instead of live tiles** |
| deck.gl 9.4.1 (`MapboxOverlay`, interleaved or overlaid) | Good for data layers; `ScenegraphLayer`, `Tile3DLayer` | Custom PBR materials, clipping, shadows, first-person collisions are all outside its model; docs page read today does not state MapLibre v6 support | Not suitable as the main engine |
| CesiumJS 1.147.0 | Native 3D Tiles, globe, time-of-day lighting | Multi-MB bundle, globe engine overhead, procedural interiors must go through its own primitive/glTF APIs, default imagery/terrain need a Cesium ion token | Not suitable |
| maplibre-gl-three 3.0.2 | Official example uses it; handles ECEF, geoid, 3D Tiles | Peer dep excludes three r187; continuous repaint; extra CDN fetch | Skip; copy the camera-sync idea |

### 2.6 Hand-off between the map view and the twin view (design notes, ESTIMATED)

- The custom layer already maintains a rigid three.js camera in the **local frame** (`layer.camera.position` / `.quaternion`). To enter the twin view: `map.flyTo({ center, zoom: ~18.5, pitch: ~70 })`, wait for `moveend`, copy position and quaternion to the twin camera, set `twinCamera.fov = THREE.MathUtils.radToDeg(args.fov)` (vertical FOV in radians is in the render args; `map.getVerticalFieldOfView()` also exists), then cross-fade the two canvases with CSS opacity.
- While the twin view is active, stop the map from rendering (hide its container, do not call `triggerRepaint`); MapLibre renders on demand, so an idle map costs nothing per frame but keeps its tile textures in GPU memory.
- The two views use **two WebGL contexts**. GPU resources are not shared between contexts: any geometry or texture used in both views is uploaded twice. Keep the map-view model light (exterior shell only, ≤ 1024² textures, no seats) and build the heavy interior only in the twin chunk. CPU-side `BufferGeometry` / `Texture` objects can be shared by both renderers.
- Going back: compute the MapLibre camera from the twin camera with `map.jumpTo(map.calculateCameraOptionsFromCameraLngLatAltRotation(lngLat, altitude, bearing, pitch))`, where `lngLat` / `altitude` come from `makeLocalFrame().toLngLat()` in section 3.

---

## 3. Geodesy helpers (local metres ↔ lon/lat, precision)

All numbers below are for latitude **35.4645° N, longitude 139.6303° E** (placeholder origin used in the tests; substitute the final origin from the geo report — the constants change only in the 5th significant digit across the site).

| Quantity | Value | Confidence |
|---|---|---|
| WGS84 metres per degree of latitude | **110,949.105 m/°** | ESTIMATED (M·π/180, a = 6378137, f = 1/298.257223563) |
| WGS84 metres per degree of longitude | **90,769.294 m/°** | ESTIMATED (N·cos φ·π/180) |
| MapLibre `meterInMercatorCoordinateUnits()` | **3.067143408869e-8** = 1 / (2π · **6371008.8** · cos φ) | CONFIRMED (value read at runtime; back-solved radius = 6371008.800 m exactly) |
| MapLibre "metres" per degree | 90,565.631 (lng), 111,195.080 (lat) | ESTIMATED |
| Consequence of using MapLibre's uniform metre for a model built in true metres | model drawn **0.225 % too wide E-W and 0.22 % too short N-S**: about **+0.45 m / −0.44 m per 200 m** | CONFIRMED (pixel test) |
| Corrected scales (Mercator units per true metre) | `sx` = **3.0602615e-8** (= 0.997756·s), `sz` = **3.0739433e-8** (= 1.002217·s), vertical keep `s` (so heights match MapLibre `fill-extrusion-height`) | CONFIRMED (0.00 px residual) |
| Mercator world coordinate of the origin | x = 0.88786194, y = 0.39451819 | ESTIMATED |
| float32 resolution at that coordinate | 5.96e-8 units = 1.94 m | ESTIMATED |
| ECEF of the origin (h = 0) | (−3,962,312.295, 3,368,580.566, 3,679,960.709) m | CONFIRMED (matches `tiles.ellipsoid.getCartographicToPosition`) |
| ENU basis in ECEF | E = (−0.647717, −0.761881, 0), N = (0.442042, −0.375804, 0.814475), U = (−0.620533, 0.527549, 0.580198) | ESTIMATED |
| Earth-curvature drop from the tangent plane | 0.001 m at 100 m (measured), 0.020 m at 500 m, 0.079 m at 1 km | CONFIRMED / ESTIMATED |
| Geoid: ground near the site in the PLATEAU tiles | building bases at **≈ 39.9–40.5 m ellipsoidal height** (bases were +1.45 to +2.0 m above a plane placed at 38.5 m). The geoid height around Yokohama is roughly 36–37 m (recalled, not looked up today), which would put the ground at about +3 to +4 m T.P. | ESTIMATED from measured vertices (percentiles of 10,887 vertices within 300 m of the test origin) |

Small-area conversion (sufficient within about 2 km, error < 1 cm horizontally):

```js
// src/geo/local.js — tangent-plane approximation in true metres (X east, Y up, Z south)
const D2R = Math.PI / 180, A = 6378137, E2 = 0.00669437999014;
export function makeLocalFrame(lng0, lat0) {
  const phi = lat0 * D2R, w2 = 1 - E2 * Math.sin(phi) ** 2;
  const N = A / Math.sqrt(w2), M = A * (1 - E2) / (w2 * Math.sqrt(w2));
  const mPerDegLng = N * Math.cos(phi) * D2R, mPerDegLat = M * D2R;
  return {
    mPerDegLng, mPerDegLat,
    toLocal: (lng, lat, h = 0) => [(lng - lng0) * mPerDegLng, h, -(lat - lat0) * mPerDegLat],
    toLngLat: (x, y, z) => [lng0 + x / mPerDegLng, lat0 - z / mPerDegLat, y],
  };
}
```

For exact ENU (needed only when mixing with ECEF data such as 3D Tiles) use the ellipsoid helpers of `3d-tiles-renderer` (section 5) rather than hand-written maths.

Japanese plane-rectangular coordinates: PLATEAU CityGML uses JGD2011 geographic coordinates (EPSG:6697); Yokohama's plane-rectangular zone is **系IX (EPSG:6677)** if drawings or survey data in metres must be imported — use `proj4@2.23.0` at build time, never at run time (REPORTED, standard knowledge; the 3D Tiles are already in ECEF).

---

## 4. three.js r187

### 4.1 `WebGLRenderer` vs `WebGPURenderer` today

**Choose `WebGLRenderer` for both views.**

| Reason | Evidence | Confidence |
|---|---|---|
| MapLibre exposes a `WebGL2RenderingContext`; only `WebGLRenderer({ canvas, context })` can share it | MapLibre typings; test | CONFIRMED |
| Required addons are WebGL-path: `three/addons/csm/CSM.js` (the node version is the separate `CSMShadowNode.js`), `EffectComposer`, pmndrs `postprocessing`, 3DTilesRendererJS plugins that patch shaders through `onBeforeCompile` (`TilesFadePlugin`, the PLATEAU highlight example) | r187 addon tree; 3DTilesRendererJS source | CONFIRMED |
| `WebGPURenderer` performance on many-mesh scenes | Forum benchmark on r183 (4,000 meshes, RTX 4090 laptop, Chrome 148): WebGLRenderer 4.5 ms CPU / 32 ms first frame; WebGPURenderer 9.7 ms / 167 ms; `forceWebGL: true` 10.3 ms / 344 ms; linked to three.js issue #30560 (per-object UBO cost). No maintainer statement that it is fixed | REPORTED (https://discourse.threejs.org/t/webgpurenderer-2x-slower-cpu-and-5-10x-slower-first-frame-than-webglrenderer-on-many-mesh-scenes-r183-same-on-both-backends/91904) |
| WebGPU browser coverage | Secondary guides in 2026 still list gaps (Firefox on Linux / Android / Intel Macs) | REPORTED |
| WebGL 2 is the floor everywhere | three: "WebGL 1 is not supported since r163"; MapLibre 6 requires WebGL 2 | CONFIRMED |

Useful `WebGLRenderer` options in r187 (CONFIRMED, https://threejs.org/docs/pages/WebGLRenderer.html): `reversedDepthBuffer` (needs `EXT_clip_control`; more accurate than `logarithmicDepthBuffer`), `outputBufferType: THREE.HalfFloatType` (HDR output buffer with built-in tone mapping; enables the new `renderer.setEffects([...])` which errors unless the buffer is HalfFloat/Float and warns that `OutputPass` is unnecessary), `stencil: false` by default (set `stencil: true` if stencil-capped section cuts are wanted), `powerPreference: 'high-performance'`.

### 4.2 Migration notes that affect code written from memory (CONFIRMED, three.js Migration Guide wiki)

| Release | Change |
|---|---|
| r187 | PMREMs are cube-render-target based (`CubeUVReflectionMapping` removed; reflections look slightly different); `setViewport()/setScissor()` no longer scale by pixel ratio when a render target is bound; `iridescenceThicknessRange` deprecated |
| r186 | `Object3D.dispose()` exists (call `super.dispose()` in subclasses); `SimplifyModifier.modify()` is async and meshoptimizer-based; `Sky`/`SkyMesh` lost the `up` uniform (always +Y up); `Source` → `TextureSource` |
| r185 | `DRACOLoader.setDecoderConfig()` deprecated (always WASM; removal announced for r194); `Object3D.updateWorldMatrix()` honours `matrixWorldNeedsUpdate` — after writing `matrix` by hand with `matrixAutoUpdate = false`, set `matrixWorldNeedsUpdate = true` |
| r184 | Background / environment rotation now matches object rotation; `FirstPersonControls` reworked; `FileLoader.load()` returns nothing |
| r183 | **`Clock` deprecated → use `THREE.Timer`** (`timer.update(); timer.getDelta()`); WebGPU `PostProcessing` renamed `RenderPipeline`; `RoomEnvironment` layout changed; `Sky` legacy gamma removed |
| r182 | **`PCFSoftShadowMap` deprecated on WebGLRenderer → `PCFShadowMap` is now soft** |
| r181 | PBR indirect specular / energy conservation changed (rough materials slightly brighter); `KTX2Loader.detectSupportAsync()` deprecated |
| r180 | `RGBELoader` → **`HDRLoader`**; `USE_LOGDEPTHBUF` define renamed |
| r179 | `Timer` moved into core; `reverseDepthBuffer` → `reversedDepthBuffer` |

Decoder paths (CONFIRMED from r187 sources): `DRACOLoader` and `KTX2Loader` now default to `new URL('../libs/draco/…', import.meta.url)` / `new URL('../libs/basis/…', import.meta.url)`. With Vite the wasm/js decoders are emitted automatically (`draco_decoder-*.wasm` 192–286 kB, `basis_transcoder-*.wasm` 527 kB) and `new DRACOLoader()` works with no `setDecoderPath()` in both dev and build (verified). `setDecoderPath()` / `setTranscoderPath()` still exist if assets must live under `public/`.

### 4.3 20,000 seats — `InstancedMesh` vs `BatchedMesh`, LOD

| Technique | Behaviour | Use here |
|---|---|---|
| `InstancedMesh(geometry, material, count)` | One geometry, one draw call, per-instance matrix + colour (`setMatrixAt`, `setColorAt`); frustum-culled **as one object** (call `computeBoundingSphere()` after filling) | **Seats: one InstancedMesh per seating block and per LOD** (about 40–100 blocks) so culling and LOD work per block |
| `BatchedMesh(maxInstanceCount, maxVertexCount, maxIndexCount, material)` | Many different geometries, one material, one multi-draw; `addGeometry`, `addInstance`, `setMatrixAt`, `setColorAt`, `setVisibleAt`; `perObjectFrustumCulled` and `sortObjects` per instance; r187 merged consecutive draws and fixed sort corruption | Repeated but varied props (speaker arrays, luminaires, railings segments, signage); three-mesh-bvh supports it via `computeBatchedBoundsTree` |
| `THREE.LOD` | Distance-switched children with hysteresis | Per block: `lod.addLevel(nearSeats, 0); lod.addLevel(farSeats, 35); lod.addLevel(impostorSlab, 140)` |

Budget (ESTIMATED): a "far" seat of 12–20 triangles × 20,000 = 240k–400k triangles is trivial (241,946 triangles + shadows ran at 170 fps in the test). A "near" seat of about 150 triangles must be limited to blocks within about 30 m (≤ 2,000 seats = 300k triangles). Per-instance colour gives seat-colour variation and "selected seat" highlighting for free. Seat-view feature: store `[x, y, z, yaw]` per seat in a `Float32Array` and reuse it for both instance matrices and camera placement.

```js
// seats for one block
const mesh = new THREE.InstancedMesh(seatGeoFar, seatMat, n);
const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
for (let i = 0; i < n; i++) {
  p.set(seats[i * 4], seats[i * 4 + 1], seats[i * 4 + 2]);
  q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, seats[i * 4 + 3]);
  mesh.setMatrixAt(i, m.compose(p, q, s));
}
mesh.instanceMatrix.needsUpdate = true;
mesh.computeBoundingBox(); mesh.computeBoundingSphere();      // required for correct culling
mesh.castShadow = false; mesh.receiveShadow = true;
```

### 4.4 Section cuts (clipping planes)

- Global: `renderer.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, -1, 0), cutHeight)]` (world space; negative side is removed).
- Per material: `renderer.localClippingEnabled = true; material.clippingPlanes = [plane]; material.clipShadows = true; material.clipIntersection = false`.
- Capped (solid) cuts: stencil technique from the official example `webgl_clipping_stencil` (requires `new WebGLRenderer({ stencil: true })`); cheaper alternative: `side: THREE.DoubleSide` + a dark back-face colour.
- A "dollhouse" view (roof hidden) is simpler: put roof / upper tiers on their own `Layers` or groups and toggle `visible`.

### 4.5 Shadows

- Interior (no sun): prefer **baked or fake lighting** (emissive fixtures + a few `SpotLight`s without shadows + vertex-colour/lightmap AO). Real-time shadow maps for hundreds of stage lights are not feasible in WebGL.
- Exterior in the twin view: one `DirectionalLight` with **CSM** (`three/addons/csm/CSM.js`, official example `webgl_shadowmap_csm`):

```js
import { CSM } from 'three/addons/csm/CSM.js';
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
const csm = new CSM({ maxFar: 1200, cascades: 4, mode: 'practical', parent: scene, shadowMapSize: 2048,
                      lightDirection: new THREE.Vector3(-0.5, -1, -0.35).normalize(), camera });
csm.setupMaterial(material);          // for every lit material that should receive cascaded shadows
// each frame, before render:  csm.update();      on resize / camera change:  csm.updateFrustums();
```

- Static scene optimisation: `renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true` when the sun moves.

### 4.6 Post-processing (bloom for stage lights)

Verified pipeline (HDR half-float target with 4× MSAA, r187):

```js
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

renderer.toneMapping = THREE.ACESFilmicToneMapping;           // or AgXToneMapping / NeutralToneMapping
const rt = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.6 /*strength*/, 0.4 /*radius*/, 1.0 /*threshold*/));
composer.addPass(new OutputPass());                           // tone mapping + sRGB
// loop: composer.render();    resize: composer.setSize(w, h)
```

Lesson from the test (CONFIRMED visually): with a sun intensity of 3 and white untextured materials, lit surfaces exceed 1.0 in linear HDR and a bloom threshold of 1.0 washes out the whole frame. Keep diffuse albedo ≤ 0.8, and either raise the threshold (1.5–3) or drive bloom only from emissive fixtures (`MeshBasicMaterial`/emissive colours well above 1, e.g. `new THREE.Color(8, 4, 1)`), as in the official `webgl_postprocessing_unreal_bloom_selective` example.

### 4.7 Environment lighting

- No-download default: `scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.6` (verified).
- Outdoor sky: `Sky` addon (`three/addons/objects/Sky.js`) → PMREM; or an `.hdr` loaded with **`HDRLoader`** (not `RGBELoader`), or `UltraHDRLoader` for small JPEG gain-map HDRIs. Keep HDRIs ≤ 2K (about 1–2 MB).

### 4.8 First-person walk with collision (three-mesh-bvh 0.9.18)

Current API (CONFIRMED from README / CHANGELOG / example): `computeBoundsTree`, `disposeBoundsTree`, `acceleratedRaycast`, `MeshBVH`, `BVHHelper` (the old `MeshBVHHelper` and `maxLeafTris`/`maxLeafSize` are deprecated and removed in the unreleased next version — use `BVHHelper` and `targetLeafSize`), `ExtendedTriangle.closestPointToSegment`, `ObjectBVH` (scene-level BVH, still marked unstable), `computeBatchedBoundsTree` for `BatchedMesh`, workers under `three-mesh-bvh/worker` (`GenerateMeshBVHWorker`, `ParallelMeshBVHWorker`), `MeshBVH.serialize/deserialize`.

Measured: BVH build for 51,200 triangles = 11–13 ms; 2,000 `firstHitOnly` rays = 1–2 ms.

Pattern (condensed from the official `characterMovement.js`):

```js
import { MeshBVH } from 'three-mesh-bvh';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

// 1. one static, simplified collider mesh: floors, stairs, ramps, walls, seat-row risers (NOT every seat)
const geo = BufferGeometryUtils.mergeGeometries(colliderGeometries /* position-only, world-space */);
geo.boundsTree = new MeshBVH(geo);

// 2. capsule = segment + radius (eye at 1.6 m)
const capsule = { radius: 0.3, segment: new THREE.Line3(new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(0, 1.5, 0)) };
const seg = new THREE.Line3(), box = new THREE.Box3(), triPoint = new THREE.Vector3(), capPoint = new THREE.Vector3();

function collide(position /* THREE.Vector3, feet */) {
  seg.copy(capsule.segment); seg.start.add(position); seg.end.add(position);
  box.makeEmpty().expandByPoint(seg.start).expandByPoint(seg.end);
  box.min.addScalar(-capsule.radius); box.max.addScalar(capsule.radius);
  geo.boundsTree.shapecast({
    intersectsBounds: (b) => b.intersectsBox(box),
    intersectsTriangle: (tri /* ExtendedTriangle */) => {
      const d = tri.closestPointToSegment(seg, triPoint, capPoint);
      if (d < capsule.radius) {
        const push = capPoint.sub(triPoint).normalize().multiplyScalar(capsule.radius - d);
        seg.start.add(push); seg.end.add(push);
      }
    },
  });
  const corrected = seg.start.clone().sub(capsule.segment.start);
  const delta = corrected.clone().sub(position);
  position.copy(corrected);
  return delta;                       // delta.y > 0 mostly => standing on ground
}
```

Controls: `PointerLockControls(camera, domElement)` from `three/addons/controls/PointerLockControls.js` (`lock()`, `unlock()`, `moveForward(d)`, `moveRight(d)`, `pointerSpeed`, `minPolarAngle`, `maxPolarAngle`); add on-screen joystick buttons for touch (pointer lock does not exist on mobile). Step the simulation in 3–5 sub-steps per frame with gravity ≈ −30 m/s² and walk speed ≈ 1.4–4 m/s. For "teleport to seat" just set the camera from the seat table.

### 4.9 Textures and models

- **KTX2 / Basis**: `new KTX2Loader().detectSupport(renderer)`; `GLTFLoader.setKTX2Loader()`. UASTC for normal maps / hero albedo, ETC1S for large low-frequency albedo. A 2048² RGBA8 texture with mips costs about 22 MB of GPU memory; BC7/ASTC 4×4 about 5.6 MB (ESTIMATED, 8 bpp × 4/3).
- **GLTFLoader** (r187): `setDRACOLoader`, `setKTX2Loader`, `setMeshoptDecoder(MeshoptDecoder)` (`three/addons/libs/meshopt_decoder.module.js`); supports `EXT_texture_webp`, `EXT_meshopt_compression`/`KHR_meshopt_compression`, `KHR_draco_mesh_compression`, `KHR_texture_basisu`, `EXT_mesh_gpu_instancing`.
- Texture settings for tiling PBR sets: `tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = renderer.capabilities.getMaxAnisotropy()` (16 on the test GPU; `maxTextureSize` 16384); albedo `colorSpace = THREE.SRGBColorSpace`, data maps `NoColorSpace`; normal maps generated in OpenGL convention (+Y) need no flip.

---

## 5. 3D Tiles and PLATEAU

### 5.1 3DTilesRendererJS 0.5.4 — current API (CONFIRMED: README, USAGE.md, CHANGELOG.md, plugins API.md, installed sources)

- Entry points: `import { TilesRenderer, GlobeControls, EnvironmentControls, DEFAULT_LRU_CACHE, DEFAULT_DOWNLOAD_QUEUE, DEFAULT_PARSE_QUEUE } from '3d-tiles-renderer'` and `import { GLTFExtensionsPlugin, ReorientationPlugin, TilesFadePlugin, TileCompressionPlugin, UnloadTilesPlugin, UpdateOnChangePlugin, LoadRegionPlugin, BatchedTilesPlugin, DebugTilesPlugin, ImageOverlayPlugin, GeneratedSurfacePlugin, XYZTilesOverlay, … } from '3d-tiles-renderer/plugins'`. Sub-paths `/core`, `/three`, `/three/plugins`, `/r3f`, `/babylonjs`, `/playcanvas` also exist.
- Loop: `tiles.setCamera(camera); tiles.setResolutionFromRenderer(camera, renderer); camera.updateMatrixWorld(); tiles.update(); renderer.render(scene, camera)`; add `tiles.group` to the scene.
- Events: `load-root-tileset`, `load-tileset`, `load-model` (`{ scene, tile }`), `dispose-model`, `load-error`, `needs-render`, `needs-update`, `tile-download-start` (`url`).
- 0.5.0 (2026-07-15) **removed deprecated APIs** and made all `TilesRenderer` instances share `lruCache`, `downloadQueue`, `parseQueue`, `processNodeQueue` by default; 0.5.2 added per-host download queues; 0.5.3 added `tiles.surface`, `stats.refused`; 0.4.25 deprecated the old `XYZTilesPlugin`-style image plugins in favour of `GeneratedSurfacePlugin` + `ImageOverlayPlugin`.
- Gotcha stated in the README: **cache limits are hard caps** — when `LRUCache` reaches `maxBytesSize` no new tiles load and refinement stops (`stats.refused` counts them). Defaults seen at runtime: `minBytesSize` ≈ 322 MB, `maxBytesSize` ≈ 429 MB, `minSize` 6000, `maxSize` 8000.
- Queues schedule work with `requestAnimationFrame`: **tiles do not download while the tab is hidden** (observed in a background tab).
- `BatchedTilesPlugin` (one `BatchedMesh` for all tiles) requires a single material and is incompatible with `TilesFadePlugin`.

### 5.2 PLATEAU datasets for the site (CONFIRMED: PLATEAU data catalog API `https://api.plateauview.mlit.go.jp/datacatalog/plateau-datasets`, 7,776 datasets, 179 for Kanagawa city codes 141xx; files fetched and parsed)

K-Arena is in Nishi-ku (西区, ward code 14103). 2024-edition Yokohama data, spec 4.1, 3D Tiles 1.0, CRS JGD2011:

| Dataset id | LOD / texture | Size | URL |
|---|---|---|---|
| `14103_bldg_lod1` | LOD1 | 10.4 MB | `https://assets.cms.plateau.reearth.io/assets/ad/5fd83a-161b-4a01-a666-a3e8c1c23759/14100_yokohama-shi_city_2024_citygml_2_op_bldg_3dtiles_14103_nishi-ku_lod1/tileset.json` |
| `14103_bldg_lod2` | LOD2, textured | 54.8 MB | `https://assets.cms.plateau.reearth.io/assets/4a/84f474-71c4-4b33-a328-0c5798b79f2f/14100_yokohama-shi_city_2024_citygml_2_op_bldg_3dtiles_14103_nishi-ku_lod2/tileset.json` |
| `14103_bldg_lod2_no_texture` | LOD2, no texture | **11.0 MB** | `https://assets.cms.plateau.reearth.io/assets/72/f0f73f-48ab-4661-a6b6-38290e2e05fb/14100_yokohama-shi_city_2024_citygml_2_op_bldg_3dtiles_14103_nishi-ku_lod2_no_texture/tileset.json` |
| `14103_bldg_lod3` / `_no_texture` | LOD3 | 55.5 / 11.5 MB | `…/assets/57/4b4e13-9239-4570-b4c3-18f695ef7035/…_nishi-ku_lod3/tileset.json` , `…/assets/dc/a3a7d5-e8ef-42f2-a2d2-d82eb77eb9e7/…_nishi-ku_lod3_no_texture/tileset.json` |
| `14100_brid_lod2`, `_lod3` | Bridges | 14.8 / 8.8 MB | `…/assets/6a/6d2bb2-910d-4e78-be9e-b4ac169610d0/…_brid_3dtiles_lod2/tileset.json` |
| `14100_tran_lod3`, `14100_squr_lod3`, `14100_frn_lod3`, `14100_veg_*` | Roads, squares, street furniture, vegetation (LOD3 areas only) | 0.8 / 0.5 / 60 / 1–2.7 MB | see catalog |

Structure of `14103_bldg_lod2` (parsed today):

| Property | Value |
|---|---|
| `asset.version` | `1.0`; root `geometricError` 307.4; `refine: REPLACE`; 72 tiles, depth 3, 53 leaves; all content `.b3dm` |
| Bounding volumes | `region` (radians); root heights 35.37–292.78 m (**ellipsoidal**) |
| Leaf tiles near the arena | about 400–440 m squares; e.g. `data/data5.b3dm` covers lon 139.62968–139.63412, lat 35.46059–35.46450 (3.9 MB, 33 buildings) |
| b3dm payload | glTF 2.0 generated by **FME 2024.1.3.0**; `extensionsRequired`: **`CESIUM_RTC`, `EXT_texture_webp`, `KHR_draco_mesh_compression`**; one mesh, 1–2 primitives; attributes `POSITION, NORMAL, TEXCOORD_0, _BATCHID`; one WebP atlas per tile; material `metallicFactor 0.5, roughnessFactor 0.3` |
| Batch table | 43 keys incl. `gml_id`, `gml:name`, `bldg:measuredHeight`, `uro:BuildingIDAttribute_uro:buildingID`, `uro:BuildingDetailAttribute_uro:surveyYear`, hazard attributes, and a JSON `attributes` blob with the full CityGML attributes |
| HTTP | `access-control-allow-origin: *`, `accept-ranges: bytes`, `cache-control: public,max-age=3600`; served from Google Cloud Storage; usable directly from a GitHub Pages origin |

Important content caveat (CONFIRMED from batch tables, interpretation ESTIMATED): every building in the tiles around the site has `surveyYear` **2020**. The tile that covers the block north of latitude 35.464 (`data/data0.b3dm`, lon 139.62968–139.63855, lat 35.46403–35.47206) contains only **6 small unnamed features** (one has `measuredHeight` 1.3 m). **K-Arena (opened 2023) and its neighbours (Hilton Yokohama, K Tower) are most likely absent from PLATEAU 2024** — good (no clash with our model) but the adjacent towers must be modelled by us. The geo researcher should confirm visually.

### 5.3 Verified loading code and local-frame georeferencing

```js
import { TilesRenderer } from '3d-tiles-renderer';
import { GLTFExtensionsPlugin, ReorientationPlugin, TilesFadePlugin } from '3d-tiles-renderer/plugins';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const tiles = new TilesRenderer(PLATEAU_LOD2_NO_TEXTURE_URL);
tiles.registerPlugin(new GLTFExtensionsPlugin({ dracoLoader: new DRACOLoader() }));   // rtc: true and metadata: true by default
tiles.registerPlugin(new ReorientationPlugin({
  lat: ORIGIN.lat * THREE.MathUtils.DEG2RAD,
  lon: ORIGIN.lng * THREE.MathUtils.DEG2RAD,
  height: GROUND_ELLIPSOIDAL_HEIGHT,      // about 40.0 m near the site (see section 3); put ground at y = 0
  azimuth: Math.PI,                       // REQUIRED to get +X east / +Z south (see table below)
}));
tiles.registerPlugin(new TilesFadePlugin());
tiles.errorTarget = 8;
tiles.addEventListener('load-model', ({ scene }) => scene.traverse((c) => {
  if (c.isMesh) { c.material.metalness = 0; c.material.roughness = 0.9; c.castShadow = c.receiveShadow = true; }
}));
scene.add(tiles.group);
// loop: camera.updateMatrixWorld(); tiles.setCamera(camera); tiles.setResolutionFromRenderer(camera, renderer); tiles.update();
```

Measured results (CONFIRMED locally):

| Check | Result |
|---|---|
| `ReorientationPlugin({lat, lon, height})`, default azimuth | origin → (0,0,0); 100 m east → (**−100.002**, −0.001, 0.001); 100 m north → (0, −0.001, **+100.000**) ⇒ frame is **+X west, +Z north, +Y up** (matches the doc sentence "X facing west and Z facing north") |
| Same with `azimuth: Math.PI` | 100 m east → (**+100.002**, −0.001, −0.001); 100 m north → (0, −0.001, **−100.000**) ⇒ **+X east, −Z north, +Y up** = the project frame |
| Geometry orientation | per-vertex local bounds of the loaded root tile: y from 38.1 to 292.8 with `height: 0` — equals the tileset's ellipsoidal height range, so up is correct |
| Decoders | Draco + WebP decode with a bare `new DRACOLoader()` under Vite (dev and build); materials arrive as `MeshStandardMaterial` (metalness 0.5 / roughness 0.3 → override), texture colour space `srgb` |
| **Textured LOD2 memory** | LRU cache reported **735 MB for 14 tiles** and **2.78 GB for 24 tiles**; with default limits refinement stopped at the root tile (`stats.refused` > 0). The official PLATEAU example raises `DEFAULT_LRU_CACHE.minBytesSize = 5e8; maxBytesSize = 1e9` and uses a Cesium-ion-hosted copy |
| **No-texture LOD2 memory** | 26 tiles loaded, 11 visible meshes, **44,781 triangles, 7.66 MB cache**, no refusals |

**Recommendation:** use `14103_bldg_lod2_no_texture` (grey "massing model" context, tinted with one material) streamed live, **or** bake the 9–12 leaf tiles within about 600 m into one meshopt-compressed GLB at build time (also removes the runtime dependency on the PLATEAU server). Do **not** stream the textured LOD2 set. If textures are wanted on a few landmark neighbours, bake only those tiles with textures resized to 1024² KTX2. PLATEAU data is open data (site policy / CC BY 4.0 — attribution "国土交通省 PLATEAU" required; exact wording to be taken from the geo report).

Note: the K-Arena site sits on the Nishi-ku / Kanagawa-ku boundary; if context north of the canal is wanted, the Kanagawa-ku (14102) building tileset must be added (same catalog API, not enumerated here).

---

## 6. Build and deploy

### 6.1 Vite 8.3.8

```js
// vite.config.js  (package.json must contain "type": "module", otherwise Vite 8 warns about ESM config in a CJS package)
import { defineConfig } from 'vite';
export default defineConfig({
  base: './',                    // relative base: works at https://<user>.github.io/<repo>/ and on any sub-path
  build: { target: 'es2022', chunkSizeWarningLimit: 1500 },
});
```

- Official rule (Vite docs, static-deploy): for `https://<USER>.github.io/<REPO>/` set `base: '/<REPO>/'`; `'/'` for user sites/custom domains. A **relative base `'./'` also works** (verified: `index.html` references `./assets/…`, the MapLibre worker and Draco/Basis wasm resolve through `new URL(..., import.meta.url)`), and keeps the build independent of the repository name. Caveat: `import.meta.env.BASE_URL` becomes `'./'`, i.e. relative to the *page* URL — fine for a single `index.html` at the root; nested HTML pages would break `public/` asset URLs.
- Files in `public/` are copied verbatim (use for GLB/KTX2/JSON loaded at run time: `fetch(import.meta.env.BASE_URL + 'models/arena.glb')`).
- Measured bundle (two test pages): `three.module` 604 kB (151 kB gzip), map page chunk incl. MapLibre 1,060 kB (297 kB gzip), `maplibre-gl-worker` 550 kB, twin page chunk incl. 3d-tiles-renderer/BVH/postprocessing 311 kB (99 kB gzip), CSS 71 kB. Build time 0.27–0.28 s.
- Dev server note: adding new dependencies triggers a re-optimisation and a few `504 (Outdated Optimize Dep)` requests followed by an automatic reload — harmless.
- Lazy-load the twin view (`const { startTwin } = await import('./twin/index.js')`) so the map view does not pay for the interior code and assets.

### 6.2 GitHub Actions workflow (action majors CONFIRMED against the Vite docs sample and GitHub releases)

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: '${{ steps.deployment.outputs.page_url }}' }
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with: { node-version: lts/*, cache: npm }
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v6
      - uses: actions/upload-pages-artifact@v5
        with: { path: ./dist }
      - id: deployment
        uses: actions/deploy-pages@v5
```

Repository setting: **Settings → Pages → Build and deployment → Source = "GitHub Actions"**. (The Vite sample pins actions by commit SHA; tags are equivalent for a personal project. GitHub's own starter workflow still shows older majors.)

### 6.3 Limits and behaviour of GitHub Pages

| Item | Value | Confidence / source |
|---|---|---|
| Published site size | **≤ 1 GB** | CONFIRMED (docs.github.com "GitHub Pages limits") |
| Source repository | recommended ≤ 1 GB (strongly < 5 GB) | CONFIRMED |
| Bandwidth | soft limit 100 GB / month | CONFIRMED |
| Deployment timeout | 10 minutes | CONFIRMED |
| Builds | soft limit 10 / hour — does **not** apply to custom Actions workflows | CONFIRMED |
| Git file size | warning above 50 MiB; **blocked above 100 MiB**; browser upload ≤ 25 MiB | CONFIRMED ("About large files on GitHub") |
| Git LFS | "Git LFS cannot be used with GitHub Pages sites." (branch deployments serve pointer files). With an Actions build one can technically `checkout` with `lfs: true`, but LFS quotas then apply — **avoid LFS; keep every asset < 50 MiB** | CONFIRMED (statement) / REPORTED (workaround) |
| Compression | Responses for `.glb` (`model/gltf-binary`), `.bin`, `.wasm`, `.js`, `.gltf` came back `Content-Encoding: gzip` from a live Pages site (`Server: GitHub.com`); no Brotli | CONFIRMED (curl against threejs.org today) |
| Range requests | `206` for `Range: bytes=0-99` (PMTiles-style access works) | CONFIRMED |
| Caching | `Cache-Control: max-age=600` on everything; headers cannot be customised | CONFIRMED |
| Prohibited use | primarily commercial sites, sensitive transactions | CONFIRMED |

Asset budget suggestion (ESTIMATED): total first-load ≤ 15 MB for the map view, ≤ 60 MB for the twin view (lazy), whole site ≤ 250 MB; individual GLB ≤ 20 MB; textures 1024² default, 2048² for hero surfaces, 4096² only for the baked ground.

---

## 7. Asset optimisation pipeline (Node, no GPU)

| Tool | Command | Notes |
|---|---|---|
| glTF-Transform CLI 4.5.1 | `npx @gltf-transform/cli optimize in.glb out.glb --compress meshopt --texture-compress webp --texture-size 1024 --simplify-error 0.001` | One-shot dedup / prune / weld / simplify / resize. KTX2 modes (`uastc`, `etc1s`) need the KTX-Software CLI (v4.4.2) on PATH |
| gltfpack 1.3 | `gltfpack -i in.glb -o out.glb -cc -kn -si 0.5` | meshopt compression (`EXT_meshopt_compression`), `-kn` keeps named nodes, `-si` simplifies. The README states native binaries are recommended over the npm build and "support texture compression" (`-tc` KTX2/BasisU, `-tw` WebP); Draco and vendor extensions are not supported/kept |
| KTX-Software 4.4.2 | `ktx create --format R8G8B8A8_SRGB --encode uastc --generate-mipmap albedo.png albedo.ktx2` | Native CLI (Windows installer available) |
| sharp 0.35.5 | resize / WebP / AVIF, raw pixel access | Used for the seamless + normal-map helpers in section 8.5 (verified) |

AI-generated meshes typically arrive as 100k–1M-triangle GLBs with 2K–4K PNG/JPEG textures; run them through `optimize` (target 5k–30k triangles, 1024² WebP/KTX2) before committing.

---

## 8. AI asset generation callable from scripts

### 8.1 Image / texture generation APIs (reference-image support, tileability, price)

| Provider | Current model ids (2026-11-23) | Reference images | Seamless / tileable | Price per image | Free tier | Confidence |
|---|---|---|---|---|---|---|
| **Google Gemini API** | `gemini-nano-banana-2.1` (recommended), `gemini-3.1-flash-lite-image`, `gemini-3.1-flash-image`, `gemini-3-pro-image`; `gemini-2.5-flash-image` deprecated (shutdown 2027-03-15); Imagen described as shut down | Up to **14** (2.1 / 3.1 Flash Image: 10 objects + 4 characters; Pro: 6 objects, 5 characters, 3 style refs); multi-turn editing | Prompt only (no tiling switch) — post-check required | 2.1: **$0.0336 (1K), $0.0504 (2K), $0.113 (4K)**, batch half; 3.1 Flash Image $0.067 (1K) / $0.101 (2K) / $0.151 (4K); Flash Lite $0.0336 (1K); Pro $0.134 (1K/2K) / $0.24 (4K); legacy 2.5 $0.039 | **None** for image models via API | CONFIRMED (https://aistudio.google.com/docs/image-generation , https://aistudio.google.com/docs/pricing — note `ai.google.dev` now redirects there) |
| **OpenAI** | `gpt-image-2.6-sunburst` / `-flare`, `gpt-image-2.5-sunburst` / `-flare`; older `gpt-image-2`, `gpt-image-1.5`, `gpt-image-1-mini` still priced | `images.edit` accepts multiple input images (example uses 4); mask / markup edits apply to the first image | Prompt only | Token based: image output **$30 / 1M tokens** (2.5 / 2.6 / 2), text in $5, image in $8; listed per-image for `gpt-image-2` at 1024²: $0.006 low / $0.053 medium / $0.211 high. Custom sizes up to 3840 px edge, 0.66–8.3 MP; `background: "transparent"`; quality `low…max` | None; organisation verification may be required | CONFIRMED (https://developers.openai.com/api/docs/guides/image-generation , …/pricing) |
| **Black Forest Labs (direct)** | FLUX 3 Image, FLUX 3 Image Klein, FLUX.2 [max]/[pro]/[flex]/[klein] 9B/4B, FLUX.1 Kontext [pro]/[max], FLUX 1.1 [pro] (Ultra), Fill | FLUX.2 / FLUX 3 accept reference images (billed per MP for FLUX.2; "included" for FLUX 3) | Prompt only | FLUX 3 Image $0.048 (1K) / $0.10 (2K); **FLUX 3 Klein $0.009 (1K)**; FLUX.2 [pro] $0.03 first MP; [klein] 4B $0.014 first MP; Kontext [pro] $0.04 | None listed | CONFIRMED prices (https://bfl.ai/pricing); API endpoint ids not captured (docs index https://docs.bfl.ml/llms.txt) |
| **fal.ai** | `fal-ai/flux-2/klein/4b` ($0.005 / MP, 4–8 steps); FLUX 3 as `fal-ai/flux-3-image` and `/edit` (aliases `blackforestlabs/flux-3/…`, 1–10 references; price reports conflict $0.024–0.048 / MP) | yes on edit endpoints | **`fal-ai/patina/material`** — see 8.5 | see left | None | CONFIRMED (klein page) / REPORTED (FLUX 3 pricing) |
| **Stability AI** | Stable Image Ultra / Core, SD 3.5 Large / Large Turbo / Medium / Flash, SDXL 1.0 (legacy) + control/edit tools | Structure / Style Guide / Style Transfer endpoints take an input image | None native | 1 credit = $0.01: Ultra 8, Core 3, SD3.5 Large 6.5, Medium 3.5, Flash 2.5 credits; Style Transfer 8; Fast upscaler 2 | **25 free credits** for new accounts | CONFIRMED (https://docs.stability.ai/pricing) |

Minimal scripts (adapted from the vendor docs read today; field names should be re-checked against the live reference before first use — REPORTED):

```js
// Gemini (Interactions API), needs GEMINI_API_KEY
import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs';
const ai = new GoogleGenAI({});
const ref = fs.readFileSync('refs/facade.jpg').toString('base64');
const it = await ai.interactions.create({
  model: 'gemini-nano-banana-2.1',
  input: [
    { type: 'text', text: 'Seamless tileable top-down albedo texture of the wall cladding in this photo, flat even lighting, no shadows, no perspective, no objects.' },
    { type: 'image', mime_type: 'image/jpeg', data: ref },
  ],
});
fs.writeFileSync('out/facade_albedo.png', Buffer.from(it.output_image.data, 'base64'));
```

```js
// OpenAI, needs OPENAI_API_KEY
import OpenAI, { toFile } from 'openai';
import fs from 'node:fs';
const client = new OpenAI();
const image = await toFile(fs.createReadStream('refs/facade.png'), null, { type: 'image/png' });
const r = await client.images.edit({ model: 'gpt-image-2.5-flare', image: [image], prompt: 'Seamless tileable albedo texture …' });
fs.writeFileSync('out/facade_albedo.png', Buffer.from(r.data[0].b64_json, 'base64'));
```

Copyright caution: official venue photos are copyrighted; use them as visual *reference* for colour / material / pattern, generate new textures, and do not ship the photos or near-copies.

### 8.2 Keyless / free options — real status today

| Option | Status on 2026-11-23 | Limits | Confidence |
|---|---|---|---|
| **Pollinations legacy** `https://image.pollinations.ai/prompt/{prompt}?width=…&height=…&seed=…&nologo=true` | **Works anonymously**: HTTP 200, `image/jpeg`, 512×512 in 8.6 s, `Access-Control-Allow-Origin: *` | Undocumented in the current docs; rate limit reported about 1 request / 15 s; model choice limited; may disappear | CONFIRMED (curl) / REPORTED (limits) |
| **Pollinations current** `https://gen.pollinations.ai/image/{prompt}?model=…` and `/v1/images/generations` | **401 without a key** ("A valid API key is required. Get one at https://enter.pollinations.ai/keys") | 1 pollen = 1 USD; secret `sk_` keys; `pk_` keys return 401 since 2026-11-01. `/image/models` lists 128 models; not `paid_only`: `tongyi-mai/z-image-turbo` (0.004 / image, 60 rpm), `black-forest-labs/flux.1-schnell` (0.002), `flux.2-klein-4b` (0.005, 10 refs), `flux.1-kontext-pro` (0.03), `flux.1.1-pro` (0.03), `microsoft/mai-image-2.6/2.7(-flash)` | CONFIRMED (curl + docs `gen.pollinations.ai/docs/llm.txt`); free daily grants not stated |
| **Hugging Face ZeroGPU Spaces** via `@gradio/client` / `gradio_client` | Free; hardware = half NVIDIA RTX Pro 6000 Blackwell (48 GB) | **Daily GPU quota: unauthenticated 2 min, free account 5 min, PRO 40 min** (extra at $1 / 10 min for PRO); default 60 s per call; low queue priority when anonymous | CONFIRMED (https://huggingface.co/docs/hub/spaces-zerogpu) |
| Stability AI trial | 25 credits once (≈ 8 Core images) | | CONFIRMED |
| Google AI Studio web UI | Free interactive use; **not** scriptable; API has no free image tier | | CONFIRMED (pricing page) |

```js
// Hugging Face Space (free account token => 5 GPU-minutes/day)
import { Client } from '@gradio/client';
const app = await Client.connect('owner/space-name', { token: process.env.HF_TOKEN });
const res = await app.predict('/generate', { prompt: 'seamless concrete wall texture', seed: 1 });   // endpoint + args differ per Space: inspect app.view_api()
```

### 8.3 Text / image-to-3D services

| Service | Current version | Access / price | Output | Polygons | Licence of outputs | Confidence |
|---|---|---|---|---|---|---|
| **Meshy** | `latest` = **meshy-7.1**; also `meshy-6`, `meshy-6-lite`, smart-topology `meshy-t2` / `meshy-t2.5`; `meshy-7` retires 2026-12-31 for geometry | API needs a paid plan (Free: 100 credits/month, **no API**). Credits: image-to-3D 20 (mesh) / **30 with 2K or 4K textures** / 35 (8K); text-to-3D preview 20 + refine 10; remesh 5; retexture 10. Plans as displayed (KRW, billed yearly): Pro ₩17,321/mo 1,000 credits; Premium ₩29,000 3,000; Ultra ₩115,200 8,000 | `glb, fbx, obj, usdz, stl` (+`3mf`); `enable_pbr` → `base_color, metallic, roughness, normal` maps | `target_polycount` 100–300,000 (default 30,000); `topology: triangle | quad` | Free plan: **CC BY 4.0**; paid: private, customer-owned | CONFIRMED (https://docs.meshy.ai/en/api/pricing , …/image-to-3d , https://www.meshy.ai/pricing) |
| **Tripo** | `model_version: v3.1-20260211` in the example; products H3.1, P2.0 (native quad) | Base `https://openapi.tripo3d.ai`, `POST /v3/generation/text-to-model`; **1 credit = $0.01**; text-to-3D 10–20, image-to-3D 20–30, multiview 20–30, texture 10–30, retopology 10–40 credits. Free web plan about 300 credits/month; "2,000 API trial credits" is reported by a third party only | GLB, FBX, OBJ, USDZ; options `texture`, `pbr`, `texture_quality: "detailed"`, face-limit control | controllable | Not stated on the page (free-plan models "public") | CONFIRMED (https://developers.tripo3d.ai/) / REPORTED (free credits) |
| **Hyper3D Rodin** (via fal) | Rodin **V2.5** (`fal-ai/hyper3d/rodin/v2.5`) | **$0.40 / generation**, HighPack +$0.80; up to 5 input images | glb, usdz, fbx, obj, stl; material PBR / Shaded / All | quad 4K–200K; triangle 2K–2M | Not stated | CONFIRMED (fal model page) |
| **Hunyuan3D** (hosted, via fal) | v3.1 Rapid (`fal-ai/hunyuan-3d/v3.1/rapid/image-to-3d`), v3 text-to-3D | $0.225 / generation (+$0.15 PBR); v3 text-to-3D $0.375 | GLB or OBJ+MTL+texture | not exposed on Rapid | Not stated | CONFIRMED (fal page) / REPORTED |
| **Hunyuan3D** (open weights) | Hunyuan3D-2.0 / 2mini / 2mv (+Turbo), **2.1** (PBR, 2025-06), Omni, Part | Free, local | GLB | — | **Tencent Hunyuan 3D Community Licence: "does not apply in the European Union, United Kingdom and South Korea"; use of the model *and its outputs* outside the Territory is unlicensed** (2.0 and 2.1 licences) | CONFIRMED (LICENSE files) |
| **TRELLIS.2** (Microsoft) | TRELLIS.2-4B, 512³–1536³, PBR | Open weights (**MIT**); hosted: `fal-ai/trellis-2` **$0.25 / $0.30 / $0.35** (512 / 1024 / 1536) | single GLB (WebP textures); `texture_size` 1024/2048/4096 | `decimation_target` 5,000–2,000,000 vertices (default 500,000; 20–50k suggested for web) | MIT | CONFIRMED (repo README, fal page) |
| **TRELLIS** (v1) | image / text | Open weights (MIT, some submodules differ) | GLB, Gaussians | — | MIT | CONFIRMED |
| **Stable Fast 3D / SPAR3D** | SF3D, SPAR3D | Stability API: SF3D 10 credits ($0.10), SPAR3D 4 credits ($0.04); open weights gated on Hugging Face | GLB with UV-unwrapped texture + material params; `--remesh_option none|triangle|quad`, target vertex count | low-poly oriented | Stability AI Community Licence (terms not re-read today) | CONFIRMED (pricing, README) / REPORTED (licence) |
| **TripoSR** | 2024 model | Open (**MIT**), reported $0.07 on fal | mesh with vertex colours or baked texture | — | MIT | CONFIRMED (README) / REPORTED (price) |

Guidance: generate props as **single isolated objects** (speaker cluster, moving-head light, truss segment, concession counter, bench, bollard, tree) from a clean generated image on a plain background; architecture itself (bowl, stands, roof) must stay procedural for dimensional accuracy. Always post-process (section 7).

Licence note for this project: the request is written in Korean and network responses during this research came from Korean edges and KRW price lists; if the site owner operates from South Korea, **Hunyuan3D open weights are not licensed for use there** — prefer TRELLIS / TRELLIS.2 (MIT), TripoSR (MIT), or a paid Meshy / Tripo / Rodin plan. The terms for Hunyuan output obtained through third-party hosted APIs were not found.

### 8.4 What runs locally on the RTX 3080 10 GB (Windows 11)

| Model | VRAM need (source) | Fits 10 GB? | Setup notes | Confidence |
|---|---|---|---|---|
| SDXL 1.0 (ComfyUI or diffusers) | about 7–8 GB fp16 at 1024² (general knowledge) | Yes | Mature; **seamless tiling via circular padding** works for UNet/VAE convs (`spinagon/ComfyUI-seamless-tiling`, GPL-3.0, updated 2026-02) | REPORTED |
| FLUX.2 [klein] 4B (Apache-2.0) | ComfyUI docs: **8.4 GB distilled (4 steps, ~1.2 s on a 5090), 9.2 GB base** with fp8 files + `qwen_3_4b` text encoder; HF card: ~13 GB in diffusers bf16 (`Flux2KleinPipeline`, `enable_model_cpu_offload()`) | Borderline — use ComfyUI fp8 / GGUF with text-encoder offload | Files: `black-forest-labs/FLUX.2-klein-4b-fp8`, `Comfy-Org/flux2-klein-4B`, VAE from `Comfy-Org/flux2-dev`; supports multi-reference editing | CONFIRMED (docs.comfy.org, HF card) |
| FLUX.2 [klein] 9B | larger; **non-commercial licence** | No / avoid | | CONFIRMED (HF card) |
| Z-Image Turbo (6B) | fp8 about 8 GB; GGUF 6 GB | Yes (quantised) | GGUF model + GGUF Qwen3-4B encoder | REPORTED (community guides) |
| Hunyuan3D-2.0 shape / 2mini | README: **6 GB shape only, 16 GB shape + texture**; 2mini is 0.6B | Shape yes; texture only with `--low_vram_mode` (slow) | Windows portable bundles exist (`YanWenKun/Hunyuan3D-2-WinPortable`); **territory licence issue above** | CONFIRMED (README) |
| Hunyuan3D-2.1 | README: 10 GB shape, 21 GB texture, 29 GB total; Python 3.10, PyTorch 2.5.1+cu124 | Shape borderline; PBR texture no | | CONFIRMED |
| TRELLIS (v1) | "at least 16 GB"; tested only on Linux | No | community low-VRAM forks unverified | CONFIRMED |
| TRELLIS.2 | "at least 24 GB"; Linux only | No → use fal ($0.25–0.35) or a ZeroGPU Space | | CONFIRMED |
| Stable Fast 3D | "about 6 GB VRAM"; Python ≥ 3.8; **Windows experimental, needs Visual Studio 2022** build tools; gated weights (HF token) | Yes | builds a native texture baker | CONFIRMED |
| TripoSR | "about 6 GB VRAM"; needs `torchmcubes` compiled against the same CUDA major | Yes | MIT; lowest quality of the list | CONFIRMED |

Python constraints on this machine: default `python` is **3.14.2**; current PyTorch 2.15.0 has wheels for cp311–cp315, but the research repos above pin older stacks (PyTorch 2.4–2.6, Python 3.8–3.12). Create per-tool virtual environments with **`py -3.12 -m venv .venv`** (3.12.10 is installed). ComfyUI v0.46.0 is the least-effort route: the Windows portable build ships its own Python; ComfyUI requires `cu130` PyTorch on RTX 20-series and newer. Realistic effort (ESTIMATED): ComfyUI + SDXL / klein 4B = 1–2 h incl. 10–20 GB of downloads; SF3D / TripoSR on Windows = 2–4 h incl. VS Build Tools; anything TRELLIS-class = not worth attempting on 10 GB.

### 8.5 Albedo → PBR maps and seamless textures without a GPU

| Tool | What it does | Runtime | Licence | Confidence |
|---|---|---|---|---|
| **fal `fal-ai/patina/material`** (PATINA, fal.ai, announced 2026-04-10; FLUX.2 klein backbone, inspired by Ubisoft CHORD) | Text (+ optional `image_url`, `strength` 0.6, `mask_url`) → **seamless tileable** base texture + `basecolor, normal, roughness, metalness, height` maps; `tiling_mode: both | horizontal | vertical`; upscale ×2/×4 up to 8K. A companion "Material Extraction" endpoint isolates a material from a photo and makes it tileable | API (key) | fal terms (not stated on page) | CONFIRMED (model page + blog). Price: $0.01 + $0.02/MP + $0.01/MP per map → **$0.08 for a 1K set with 5 maps**, $0.61 for 8K |
| **Own sharp script** (below) | Two-pass cross-fade seamless + Sobel normal + heuristic roughness | Node, CPU, < 1 s per 1K texture | ours | CONFIRMED (seam metric 34.8 / 14.6 → 0.99 / 1.07, where 1.0 = indistinguishable from interior pixels) |
| **DeepBump** (HugoTini) | ONNX model: colour → normal, normal → height (`--normals_to_height-seamless TRUE`), normal → curvature, 2× upscale. `python cli.py color.png normals.png color_to_normals --color_to_normals-overlap MEDIUM` | Python CPU (onnxruntime). The CLI doc pins `onnxruntime==1.15.1`, which predates Python 3.12 — use a current onnxruntime (untested) | GPL-3.0 (tool; outputs are yours) | CONFIRMED (repo, last push 2025-03) / ESTIMATED (version workaround) |
| **PBRify_Remix** (Kim2091) | Upscale + normal + roughness (+ height) models trained on ambientCG CC0 data; chaiNNer chain or ComfyUI | CPU possible, GPU faster | **CC0** | CONFIRMED (README, updated 2026-02) |
| **img2texture** 1.1.2 (PyPI) | CLI that blends image edges into a seamless tile | Python ≥ 3.8, CPU | MIT | CONFIRMED (PyPI) |
| Marigold (prs-eth) | Diffusion-based normals / depth / intrinsic decomposition via diffusers | GPU advisable | Apache-2.0 code (weights licence not re-checked) | REPORTED |
| Ubisoft CHORD | Image → PBR decomposition | GPU | research licence (repo `NOASSERTION`) | REPORTED |
| EmbarkStudios texture-synthesis | Example-based synthesis with tiling mode | Rust CLI, CPU | MIT/Apache; **archived** | CONFIRMED (archived flag) |

Verified helper (Node ≥ 20, `sharp@0.35.5`):

```js
// tools/tex-tools.mjs
import sharp from 'sharp';

/** two separable cross-fades with the half-offset image; output tiles in both axes */
export async function makeSeamless(input, output, band = 0.25) {
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const src = Float32Array.from(data), tmp = new Float32Array(src.length), out = Buffer.alloc(src.length);
  const w1 = (i, n) => { const t = Math.min(1, Math.max(0, Math.min(i + 0.5, n - i - 0.5) / (n * band))); return t * t * (3 - 2 * t); };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const m = w1(x, W), xs = (x + (W >> 1)) % W;
    for (let c = 0; c < C; c++) tmp[(y * W + x) * C + c] = src[(y * W + x) * C + c] * m + src[(y * W + xs) * C + c] * (1 - m);
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const m = w1(y, H), ys = (y + (H >> 1)) % H;
    for (let c = 0; c < C; c++) out[(y * W + x) * C + c] = Math.round(tmp[(y * W + x) * C + c] * m + tmp[(ys * W + x) * C + c] * (1 - m));
  }
  await sharp(out, { raw: { width: W, height: H, channels: C } }).png().toFile(output);
}

/** luminance as pseudo-height -> OpenGL-convention normal map (wrap-around Sobel) + heuristic roughness */
export async function albedoToNormalRoughness(input, normalOut, roughOut, { strength = 2, roughBase = 0.75, roughContrast = 0.35 } = {}) {
  const { data, info } = await sharp(input).removeAlpha().greyscale().blur(1.2).raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info, h = (x, y) => data[((y + H) % H) * W + ((x + W) % W)] / 255;
  const n = Buffer.alloc(W * H * 3), r = Buffer.alloc(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = (h(x + 1, y - 1) + 2 * h(x + 1, y) + h(x + 1, y + 1)) - (h(x - 1, y - 1) + 2 * h(x - 1, y) + h(x - 1, y + 1));
    const dy = (h(x - 1, y + 1) + 2 * h(x, y + 1) + h(x + 1, y + 1)) - (h(x - 1, y - 1) + 2 * h(x, y - 1) + h(x + 1, y - 1));
    let nx = -dx * strength, ny = dy * strength, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const i = y * W + x;
    n[i * 3] = Math.round((nx * 0.5 + 0.5) * 255); n[i * 3 + 1] = Math.round((ny * 0.5 + 0.5) * 255); n[i * 3 + 2] = Math.round((nz * 0.5 + 0.5) * 255);
    r[i] = Math.round(255 * Math.min(1, Math.max(0.04, roughBase + (0.5 - h(x, y)) * roughContrast)));
  }
  await sharp(n, { raw: { width: W, height: H, channels: 3 } }).png().toFile(normalOut);
  await sharp(r, { raw: { width: W, height: H, channels: 1 } }).png().toFile(roughOut);
}
```

Limits: the cross-fade ghosts structured patterns (tiles, panel joints, perforated metal, seat fabric weave with visible repeats). For those, generate the pattern procedurally (canvas / shader) at exact module sizes and use AI only for the micro-surface, or use PATINA with `tiling_mode: 'both'`. The luminance-derived normal is a rough stand-in; DeepBump / PBRify / PATINA give better normals.

### 8.6 Rough cost model (ESTIMATED from the prices above)

| Item | Quantity | Unit | Total |
|---|---|---|---|
| Tileable materials via PATINA (1K, 5 maps) | 40 | $0.08 | $3.20 |
| Reference-guided albedo via `gemini-nano-banana-2.1` (1K), 3 tries each | 40 × 3 | $0.0336 | $4.03 |
| Signage / unique decals via Nano Banana 2.1 at 2K | 20 | $0.0504 | $1.01 |
| Props via TRELLIS.2 on fal (1024³) | 25 | $0.30 | $7.50 |
| Same props via Meshy 7.1 with textures | 25 | 30 credits | 750 credits (one month of Pro, 1,000 credits) |
| Zero-cost path | — | — | Pollinations legacy endpoint + local SDXL / klein 4B for textures; SF3D / TripoSR locally or HF ZeroGPU (5 min/day) for props |

---

## 9. Recommended project structure (suggestion)

```
index.html                     map view (MapLibre + three custom layer)
src/config/site.js             ORIGIN {lng, lat}, GROUND_ELLIPSOIDAL_HEIGHT, bearings
src/geo/local.js               makeLocalFrame(), localToMercatorMatrix()
src/map/                       map setup, arenaLayer.js, OSM-building filter, hand-off to twin
src/arena/                     procedural builders shared by both views (shell, roof, bowl, tiers, seats, stage)
src/twin/                      lazy chunk: renderer, composer, CSM, controls (orbit / first-person / seat view), BVH collider, PLATEAU tiles
public/models/*.glb            optimised props (meshopt + KTX2/WebP)
public/textures/<mat>/{albedo,normal,orm}.ktx2|webp
public/data/seats.bin          Float32 [x, y, z, yaw] per seat
tools/gen/                     AI generation scripts (keys from env, never committed)
tools/bake/                    PLATEAU bake, ground-texture bake, texture post-processing
.github/workflows/deploy.yml
```

---

## 10. Gaps and open points

1. `distance`-expression filtering of OSM `building-3d` polygons was not executed in the test; fall back to hiding the layer and supplying own extrusions if it does not behave.
2. GPU frame times for the twin view could not be measured (the automation browser pane was hidden, `requestAnimationFrame` throttled, `gl.finish()` is not blocking in Chromium). Only the map-view figure (170 fps) is a real measurement.
3. `WebGLRenderer.setEffects()` (new HDR effect chain) has no official example located; `EffectComposer` was used and verified instead.
4. BFL direct-API endpoint ids, Tripo free API credits, Meshy USD prices, and output-licence terms of Tripo / Rodin / fal-hosted Hunyuan were not found on the pages read.
5. Free daily "pollen" grants of Pollinations and the long-term availability of its anonymous legacy endpoint are undocumented.
6. Local model VRAM figures for SDXL and Z-Image Turbo come from secondary sources; nothing was installed or run locally.
7. Whether PLATEAU 2024 really lacks K-Arena and neighbours was inferred from attributes (survey year 2020, 6 features in the tile), not from a rendered inspection of that block; Kanagawa-ku tiles were not enumerated.
8. Exact PLATEAU attribution wording and GSI tile terms for *baking* tiles into a static texture should be confirmed in the geo/licensing report.
9. deck.gl 9.4 compatibility with MapLibre 6 is not stated on the page read (not needed for the recommended stack).

---

## 11. Local verification log (throw-away project in the session scratch directory, not part of the repo)

| # | Test | Outcome |
|---|---|---|
| 1 | `npm i` of the pinned stack | OK, no peer conflicts |
| 2 | MapLibre 6.19 under Vite dev without `setWorkerUrl` | Fails: "Worker failed to load" → fixed with `?worker&url` import |
| 3 | Custom layer, GSI `pale` raster style | Renders; args / projection-data keys and `Float64Array` recorded; projection matches `map.project()` |
| 4 | Uniform vs anisotropic Mercator scale | 0.33 px / 0.16 px vs 0.00 px / 0.00 px at 100 m |
| 5 | Shadows + 20k instances in the map | Shadow visible on `ShadowMaterial` catcher; 170 fps |
| 6 | OpenFreeMap `liberty` vector style, production build served under `/K-Arena_Yokohama/` | Loads keylessly; `building-3d` extrusions occlude / are occluded correctly |
| 7 | `vite build` with absolute and relative base | Both OK; decoders and worker emitted |
| 8 | PLATEAU LOD2 textured via 3d-tiles-renderer | Loads; cache explodes to 2.78 GB / 24 tiles; refinement refused |
| 9 | PLATEAU LOD2 no-texture | 26 tiles, 44,781 triangles, 7.66 MB cache |
| 10 | `ReorientationPlugin` axes with azimuth 0 and π | West/north vs east/south frames as tabulated |
| 11 | three-mesh-bvh build + raycasts | 11–13 ms for 51,200 triangles; 2,000 rays in 1–2 ms |
| 12 | HDR composer (HalfFloat, 4× MSAA) + `UnrealBloomPass` + `OutputPass` | Works on r187; over-bloom with threshold 1.0 noted |
| 13 | sharp seamless + normal helpers | Seam score 34.75 / 14.64 → 0.99 / 1.07 |
| 14 | Pollinations endpoints | legacy 200 anonymous; `gen.` 401 without key |
| 15 | GitHub Pages headers (threejs.org) | gzip on `.glb/.bin/.wasm/.js`, `max-age=600`, range 206 |
| 16 | PLATEAU catalog + tileset + b3dm parsing | dataset URLs, extensions, batch-table keys, survey years |

---

## 12. Sources

Map / three / tiles
- https://raw.githubusercontent.com/maplibre/maplibre-gl-js/main/CHANGELOG.md
- https://raw.githubusercontent.com/maplibre/maplibre-gl-js/main/docs/guides/v5-to-v6-migration-guide.md
- https://raw.githubusercontent.com/maplibre/maplibre-gl-js/main/docs/index.md
- https://maplibre.org/maplibre-gl-js/docs/examples/ , https://maplibre.org/maplibre-gl-js/docs/API/interfaces/CustomLayerInterface/ , https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/CustomRenderMethodInput/
- https://github.com/maplibre/maplibre-gl-js/tree/main/test/examples (add-3d-tiles-3d-objects-and-models-using-threejs.html, add-a-3d-model-with-babylonjs.html, raycast-3d-tiles-using-threejs.html, add-a-simple-custom-layer-on-a-globe.html, walk-around-a-map-in-first-person.html)
- https://github.com/safwat-halaby/maplibre-gl-three (README, `src/library/core/ThreeLayerImpl.ts`, `src/library/helpers/mapCamera.ts`) , https://maplibre-gl-three.readthedocs.io/latest/features/
- https://github.com/mrdoob/three.js/wiki/Migration-Guide , https://github.com/mrdoob/three.js/releases/tag/r187 , https://threejs.org/docs/pages/WebGLRenderer.html , r187 sources and examples under https://github.com/mrdoob/three.js/tree/r187/examples
- https://discourse.threejs.org/t/webgpurenderer-2x-slower-cpu-and-5-10x-slower-first-frame-than-webglrenderer-on-many-mesh-scenes-r183-same-on-both-backends/91904
- https://github.com/NASA-AMMOS/3DTilesRendererJS (README.md, USAGE.md, CHANGELOG.md, src/three/plugins/API.md, example/three/plateau.js, example/three/mapTiles.js)
- https://github.com/gkjohnson/three-mesh-bvh (README.md, CHANGELOG.md, example/characterMovement.js)
- https://api.plateauview.mlit.go.jp/datacatalog/plateau-datasets and the tileset URLs listed in section 5.2
- https://openfreemap.org/quick_start/ , https://maps.gsi.go.jp/development/ichiran.html , https://deck.gl/docs/api-reference/mapbox/mapbox-overlay

Build / deploy
- https://raw.githubusercontent.com/vitejs/vite/main/docs/guide/static-deploy.md , https://raw.githubusercontent.com/vitejs/vite/main/docs/guide/static-deploy-github-pages.yaml
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage
- https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github
- GitHub API `releases/latest` for actions/checkout, setup-node, configure-pages, upload-pages-artifact, deploy-pages
- https://github.com/zeux/meshoptimizer/blob/master/gltf/README.md , https://github.com/KhronosGroup/KTX-Software/releases

AI generation
- https://aistudio.google.com/docs/image-generation , https://aistudio.google.com/docs/pricing
- https://developers.openai.com/api/docs/guides/image-generation , https://developers.openai.com/api/docs/pricing
- https://bfl.ai/pricing , https://docs.bfl.ai/quick_start/introduction
- https://fal.ai/models/fal-ai/flux-2/klein/4b/llms.txt , https://fal.ai/models/fal-ai/patina/material/llms.txt , https://blog.fal.ai/introducing-patina , https://fal.ai/models/fal-ai/trellis-2/llms.txt , https://fal.ai/models/fal-ai/hyper3d/rodin/v2.5/llms.txt , https://fal.ai/models/fal-ai/hunyuan-3d/v3.1/rapid/image-to-3d/llms.txt
- https://docs.stability.ai/pricing
- https://gen.pollinations.ai/docs/llm.txt , https://gen.pollinations.ai/image/models , https://image.pollinations.ai/
- https://huggingface.co/docs/hub/spaces-zerogpu , https://unpkg.com/@gradio/client@2.8.0/README.md
- https://docs.meshy.ai/en/api/pricing , https://docs.meshy.ai/en/api/image-to-3d , https://www.meshy.ai/pricing
- https://developers.tripo3d.ai/
- https://github.com/Tencent-Hunyuan/Hunyuan3D-2 (README, LICENSE) , https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1 (README, LICENSE)
- https://github.com/microsoft/TRELLIS.2 , https://github.com/microsoft/TRELLIS , https://github.com/Stability-AI/stable-fast-3d , https://github.com/VAST-AI-Research/TripoSR
- https://docs.comfy.org/tutorials/flux/flux-2-klein.md , https://huggingface.co/black-forest-labs/FLUX.2-klein-4B , https://github.com/Comfy-Org/ComfyUI (README, release v0.46.0)
- https://github.com/HugoTini/DeepBump (readme.md, cli.md) , https://github.com/Kim2091/PBRify_Remix , https://pypi.org/project/img2texture/ , https://github.com/spinagon/ComfyUI-seamless-tiling

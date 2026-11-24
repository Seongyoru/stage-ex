// Module preview harness (development only — not part of the shipped app).
//
//   /dev/preview.html?m=arena/bowl,arena/seats&cam=hall
//
// Query parameters
//   m        comma-separated module ids = file paths under src/ without ".js"
//            (e.g. arena/bowl, site/ground). "all" loads every module in src/site and src/arena.
//   cam      a preset name (see PRESETS), "seat:<level>-<row>-<num>" (view from that seat),
//            or six numbers "x,y,z,tx,ty,tz" (camera position and look-at target, world metres).
//   fov      vertical field of view in degrees (default 50).
//   ortho    half-height in metres → orthographic camera (plans, sections, elevations).
//   clipx / clipy / clipz   keep only geometry with x / y / z BELOW the given value (section cuts).
//            Prefix with ">" to keep what is ABOVE instead, e.g. clipx=>0.
//   hide     comma-separated userData.layer names to hide (e.g. hide=roof,exterior).
//   only     comma-separated layer names to show exclusively.
//   level    show only objects tagged with this userData.level (untagged objects are hidden).
//   light    "day" (default outside), "interior" (default for interior presets), "night".
//   q        quality passed to modules: "high" (default) or "low".
//   grid=1 / axes=1   10 m ground grid / world axes (red = +X house right, green = +Y up, blue = +Z rear).
//   wire=1   wireframe overlay.
//   bg       background colour hex without # (default sky / dark depending on light).
//
// When the scene has rendered, window.__ready = true and window.__info holds statistics
// (per-module mesh / triangle counts, bounding boxes, draw calls). On a module error
// window.__failed = true and the message is shown on screen and logged to the console.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SPEC } from '../core/spec.js';
import { allMaterials } from '../core/materials.js';
import { countTriangles } from '../core/geom.js';
import { findSeat, seatView } from '../core/seating.js';

const loaders = import.meta.glob(['../site/*.js', '../arena/*.js', '../props/*.js']);
const params = new URLSearchParams(location.search);
const hud = document.getElementById('hud');

const PRESETS = {
  // outside
  aerial: { pos: [170, 150, 250], target: [0, 12, 40] },
  aerialN: { pos: [-190, 140, 230], target: [0, 12, 40] },
  aerialStage: { pos: [120, 130, -190], target: [0, 12, 30] },
  front: { pos: [0, 28, 250], target: [0, 22, 95] },
  frontClose: { pos: [0, 12, 150], target: [0, 20, 95] },
  frontR: { pos: [150, 35, 215], target: [20, 20, 85] },
  frontL: { pos: [-150, 35, 215], target: [-20, 20, 85] },
  flankR: { pos: [240, 45, 20], target: [40, 18, 30] },
  flankL: { pos: [-240, 45, 20], target: [-40, 18, 30] },
  stageend: { pos: [0, 40, -190], target: [0, 16, -30] },
  eave: { pos: [30, 9, 125], target: [10, 32, 92] },
  site: { pos: [260, 320, 420], target: [0, 0, 60] },
  top: { pos: [0, 400, 35], target: [0, 0, 35], ortho: 120, up: [0, 0, -1] },
  // inside
  hall: { pos: [0, 31, 84], target: [0, 4, -5], interior: true },
  hallwide: { pos: [0, 20, 62], target: [0, 8, -10], fov: 75, interior: true },
  hallside: { pos: [-58, 22, 44], target: [10, 6, 10], fov: 65, interior: true },
  stage: { pos: [0, 5.2, -3], target: [0, 16, 60], fov: 80, interior: true },
  arena: { pos: [0, 1.7, 30], target: [0, 6, -6], fov: 70, interior: true },
  rig: { pos: [0, 12, 28], target: [0, 26, -8], fov: 70, interior: true },
  // cuts (combine with clipx=0 / clipz=…)
  section: { pos: [300, 22, 34], target: [0, 22, 34], ortho: 36, clipx: '0' },
  sectionPersp: { pos: [150, 45, 40], target: [0, 16, 34], clipx: '0' },
};

function fail(err) {
  window.__failed = true;
  const msg = err && err.stack ? err.stack : String(err);
  hud.className = 'err';
  hud.textContent = msg;
  console.error(msg);
}

function parseCam() {
  const cam = params.get('cam') || 'aerial';
  if (cam.startsWith('seat:')) {
    const [tier, row, num] = cam.slice(5).split('-').map(Number);
    const seat = findSeat(tier, row, num);
    if (!seat) throw new Error(`No such seat: LEVEL ${tier} row ${row} seat ${num}`);
    const v = seatView(seat);
    return { pos: v.eye, target: v.target, fov: 60, interior: true, label: `seat L${tier} row ${row} #${num}` };
  }
  if (PRESETS[cam]) return { ...PRESETS[cam], label: cam };
  const n = cam.split(',').map(Number);
  if (n.length === 6 && n.every(Number.isFinite)) return { pos: n.slice(0, 3), target: n.slice(3), label: 'custom' };
  throw new Error(`Unknown cam "${cam}". Presets: ${Object.keys(PRESETS).join(', ')}, seat:<level>-<row>-<num>, or x,y,z,tx,ty,tz`);
}

function clipPlane(axis, raw) {
  if (raw === null || raw === undefined) return null;
  const above = String(raw).startsWith('>');
  const value = Number(String(raw).replace('>', ''));
  if (!Number.isFinite(value)) return null;
  const n = new THREE.Vector3(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0);
  // THREE keeps the half-space where n·p + constant >= 0
  return above ? new THREE.Plane(n, -value) : new THREE.Plane(n.negate(), value);
}

async function main() {
  const cam = parseCam();
  const lightMode = params.get('light') || (cam.interior ? 'interior' : 'day');
  const quality = params.get('q') || 'high';

  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = lightMode === 'night' ? 0.9 : 1.0;
  renderer.shadowMap.enabled = params.get('shadows') !== '0';
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const bg = params.get('bg');
  scene.background = new THREE.Color(bg ? `#${bg}` : lightMode === 'day' ? '#a9c4e0' : lightMode === 'night' ? '#070b14' : '#16181c');

  // lights
  if (lightMode === 'day') {
    scene.add(new THREE.HemisphereLight('#dbe9ff', '#8a8578', 1.6));
    const sun = new THREE.DirectionalLight('#fff4e0', 3.0);
    sun.position.set(180, 260, 160);
    sun.target.position.set(0, 0, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    const c = sun.shadow.camera;
    c.left = -260; c.right = 260; c.top = 260; c.bottom = -260; c.near = 10; c.far = 800;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.3;
    scene.add(sun, sun.target);
  } else if (lightMode === 'night') {
    scene.add(new THREE.HemisphereLight('#3a4a70', '#1a1a1e', 0.5));
    const moon = new THREE.DirectionalLight('#9fb6ff', 0.4);
    moon.position.set(-120, 220, 100);
    scene.add(moon);
  } else {
    // interior work light: even, shadowless, so every surface is readable
    scene.add(new THREE.HemisphereLight('#ffffff', '#a9a39b', 1.5));
    for (const [x, y, z, k] of [[40, 90, 70, 1.4], [-50, 70, -40, 0.7], [0, 20, -120, 0.4]]) {
      const d = new THREE.DirectionalLight('#fff6ea', k);
      d.position.set(x, y, z);
      scene.add(d);
    }
  }

  if (params.get('grid') === '1') {
    const grid = new THREE.GridHelper(600, 60, '#55606e', '#39424e');
    grid.position.y = 0.02;
    scene.add(grid);
  }
  if (params.get('axes') === '1') scene.add(new THREE.AxesHelper(40));

  // camera
  const aspect = innerWidth / innerHeight;
  const orthoHalf = Number(params.get('ortho') || cam.ortho || 0);
  let camera;
  if (orthoHalf > 0) {
    camera = new THREE.OrthographicCamera(-orthoHalf * aspect, orthoHalf * aspect, orthoHalf, -orthoHalf, 0.1, 3000);
  } else {
    camera = new THREE.PerspectiveCamera(Number(params.get('fov') || cam.fov || 50), aspect, 0.1, 3000);
  }
  if (cam.up) camera.up.set(...cam.up);
  camera.position.set(...cam.pos);
  camera.lookAt(...cam.target);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...cam.target);
  controls.update();

  // clipping
  const planes = ['x', 'y', 'z'].map((a) => clipPlane(a, params.get(`clip${a}`) ?? cam[`clip${a}`])).filter(Boolean);
  renderer.clippingPlanes = planes;

  // modules
  const ctx = { quality, SPEC, flags: Object.fromEntries(params) };
  const wanted = (params.get('m') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const ids = wanted.includes('all')
    ? Object.keys(loaders).map((k) => k.replace('../', '').replace('.js', ''))
    : wanted;
  if (ids.length === 0) throw new Error('No modules requested. Use ?m=arena/bowl,arena/seats (or m=all).');
  const info = { cam: cam.label, light: lightMode, modules: {}, triangles: 0, materials: [] };
  const updaters = [];
  for (const id of ids) {
    const key = `../${id}.js`;
    if (!loaders[key]) throw new Error(`Module "${id}" not found (expected file src/${id}.js). Available: ${Object.keys(loaders).join(', ')}`);
    const mod = await loaders[key]();
    if (typeof mod.build !== 'function') throw new Error(`src/${id}.js does not export build(ctx)`);
    const t0 = performance.now();
    const group = await mod.build(ctx);
    if (!group || !group.isObject3D) throw new Error(`build() of src/${id}.js must return a THREE.Object3D`);
    scene.add(group);
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(group);
    let meshes = 0;
    group.traverse((o) => { if (o.isMesh) meshes++; });
    const tris = countTriangles(group);
    info.modules[id] = {
      meshes,
      triangles: tris,
      buildMs: Math.round(performance.now() - t0),
      bbox: box.isEmpty() ? null : { min: box.min.toArray().map((v) => +v.toFixed(1)), max: box.max.toArray().map((v) => +v.toFixed(1)) },
    };
    info.triangles += tris;
    if (typeof mod.update === 'function') updaters.push((state, dt) => mod.update(group, state, dt));
  }

  // visibility filters
  const hide = new Set((params.get('hide') || '').split(',').filter(Boolean));
  const only = new Set((params.get('only') || '').split(',').filter(Boolean));
  const level = params.get('level');
  scene.traverse((o) => {
    if (!o.isMesh && !o.isLine && !o.isPoints) return;
    let layer;
    let lvl;
    for (let p = o; p; p = p.parent) {
      if (layer === undefined && p.userData.layer !== undefined) layer = p.userData.layer;
      if (lvl === undefined && p.userData.level !== undefined) lvl = p.userData.level;
    }
    if (hide.has(layer)) o.visible = false;
    if (only.size && !only.has(layer)) o.visible = false;
    if (level !== null && String(lvl) !== level) o.visible = false;
    if (params.get('wire') === '1' && o.material) {
      const w = new THREE.LineSegments(new THREE.WireframeGeometry(o.geometry), new THREE.LineBasicMaterial({ color: '#000000', transparent: true, opacity: 0.25 }));
      o.add(w);
    }
  });

  info.materials = [...allMaterials().keys()].sort();

  const state = { time: 0, night: lightMode === 'night', show: params.get('show') === '1', quality };
  const clock = new THREE.Clock();
  let frames = 0;
  function frame() {
    const dt = clock.getDelta();
    state.time += dt;
    for (const u of updaters) u(state, dt);
    renderer.render(scene, camera);
    frames++;
    if (frames === 3) {
      info.drawCalls = renderer.info.render.calls;
      info.renderedTriangles = renderer.info.render.triangles;
      window.__info = info;
      window.__ready = true;
      hud.textContent = `${ids.join(' + ')}  |  cam ${cam.label}  |  ${info.triangles.toLocaleString()} tris, ${info.drawCalls} draw calls`;
    }
    requestAnimationFrame(frame);
  }
  frame();

  addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    const a = innerWidth / innerHeight;
    if (camera.isOrthographicCamera) {
      camera.left = -orthoHalf * a;
      camera.right = orthoHalf * a;
    } else camera.aspect = a;
    camera.updateProjectionMatrix();
  });
}

main().catch(fail);
addEventListener('error', (e) => fail(e.error || e.message));
addEventListener('unhandledrejection', (e) => fail(e.reason));

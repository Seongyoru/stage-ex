// Show state of the stage module: moving-head programme with additive beams, follow-spot
// beams, haze sheets, LED content, and the neutral work-light state it returns to.
import * as THREE from 'three';
import { allMaterials } from '../../core/materials.js';
import { HEAD_PIVOT_DROP, LENS_OFFSET } from './rigging.js';
import { LENS_OFF, WORK_ON, WORK_OFF } from './mats.js';
import { STAGE } from './kit.js';
import { makeIdleTexture, makeShowTexture, makeHazeTexture } from './video.js';

const DEG = Math.PI / 180;
const BEAM_TOP = 0.12; // radius at the lens as a fraction of the far radius
const LOOK_SECONDS = 9;

function beamGeometry() {
  // unit cone along −Y: three rings so the brightness can fall off toward the far end
  const seg = 14;
  const rings = [
    [0, BEAM_TOP, 1.0],
    [-0.3, BEAM_TOP + (1 - BEAM_TOP) * 0.3, 0.42],
    [-1, 1, 0.06],
  ];
  const pos = [];
  const col = [];
  for (let r = 0; r < rings.length - 1; r++) {
    const [y0, r0, c0] = rings[r];
    const [y1, r1, c1] = rings[r + 1];
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2;
      const a1 = ((i + 1) / seg) * Math.PI * 2;
      const p = (rad, y, a) => [rad * Math.cos(a), y, rad * Math.sin(a)];
      const A = p(r0, y0, a0);
      const B = p(r0, y0, a1);
      const C = p(r1, y1, a1);
      const D = p(r1, y1, a0);
      pos.push(...A, ...B, ...C, ...A, ...C, ...D);
      col.push(c0, c0, c0, c0, c0, c0, c1, c1, c1, c0, c0, c0, c1, c1, c1, c1, c1, c1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  return g;
}

function instanced(geometry, material, count, name) {
  const im = new THREE.InstancedMesh(geometry, material, count);
  im.name = name;
  im.userData.layer = 'stage';
  im.frustumCulled = false;
  im.castShadow = false;
  im.receiveShadow = false;
  im.renderOrder = 20;
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const c = new THREE.Color(0, 0, 0);
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < count; i++) {
    im.setColorAt(i, c);
    im.setMatrixAt(i, zero);
  }
  return im;
}

/**
 * parts = { heads, yokeMesh, headMesh, lensMesh, spots, showGroup, mats }.
 * Returns the runtime object kept in group.userData.stage.
 */
export function createShow(parts, ctx) {
  const { heads, spots, mats } = parts;
  const fx = new THREE.Group();
  fx.name = 'show effects';
  fx.userData.layer = 'stage';
  fx.userData.showOnly = true;
  fx.visible = false;

  const nBeams = heads.length + spots.length;
  const beams = instanced(beamGeometry(), mats['fx.beam'], nBeams, 'light beams');
  const poolGeo = new THREE.CircleGeometry(1, 20);
  poolGeo.rotateX(-Math.PI / 2);
  const pools = instanced(poolGeo, mats['fx.pool'], nBeams, 'light pools');
  pools.renderOrder = 19;
  fx.add(beams, pools);

  // haze: a few soft horizontal sheets above the stage and the front arena
  const hazeTex = makeHazeTexture();
  if (hazeTex) {
    for (const id of ['fx.haze', 'fx.pool']) {
      mats[id].map = hazeTex;
      mats[id].needsUpdate = true;
    }
  }
  const sheets = [];
  for (const [y, w, d, z] of [
    [4.5, 62, 30, -1],
    [8.5, 58, 36, 2],
    [13, 50, 40, 5],
  ]) {
    const g = new THREE.PlaneGeometry(w, d);
    g.rotateX(-Math.PI / 2);
    g.translate(0, y, z);
    sheets.push(g);
  }
  const hazePos = [];
  const hazeUv = [];
  const hazeNor = [];
  for (const g0 of sheets) {
    const g = g0.toNonIndexed();
    hazePos.push(...g.attributes.position.array);
    hazeUv.push(...g.attributes.uv.array);
    hazeNor.push(...g.attributes.normal.array);
  }
  const hazeGeo = new THREE.BufferGeometry();
  hazeGeo.setAttribute('position', new THREE.Float32BufferAttribute(hazePos, 3));
  hazeGeo.setAttribute('normal', new THREE.Float32BufferAttribute(hazeNor, 3));
  hazeGeo.setAttribute('uv', new THREE.Float32BufferAttribute(hazeUv, 2));
  const haze = new THREE.Mesh(hazeGeo, mats['fx.haze']);
  haze.name = 'haze';
  haze.userData.layer = 'stage';
  haze.frustumCulled = false;
  haze.castShadow = false;
  haze.receiveShadow = false;
  haze.renderOrder = 18;
  fx.add(haze);

  // LED content
  const idleTex = makeIdleTexture();
  const show = makeShowTexture();
  const led = ['led.side', 'led.service'].map((id) => mats[id]);
  for (const m of led) {
    if (!m.userData.idleColor) m.userData.idleColor = m.color.clone(); // survives a rebuild
    if (idleTex) {
      m.map = idleTex;
      m.color.set('#ffffff');
      m.needsUpdate = true;
    }
  }
  if (show) {
    mats['led.upstage'].map = show.texture;
    mats['led.upstage'].color.set('#ffffff');
    mats['led.upstage'].needsUpdate = true;
  }

  const rt = {
    ctx,
    parts,
    fx,
    beams,
    pools,
    haze,
    idleTex,
    show,
    led,
    lastShow: undefined,
    settled: false,
    scanAt: -1,
    ext: new Map(),
    state: heads.map(() => ({ pan: 0, tilt: 0, bright: 0 })),
  };
  applyHeadMatrices(rt);
  return rt;
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler(0, 0, 0, 'YXZ');
const _p = new THREE.Vector3();
const _s = new THREE.Vector3(1, 1, 1);
const _d = new THREE.Vector3();
const _c = new THREE.Color();
const _up = new THREE.Vector3(0, -1, 0);
const ONE = new THREE.Vector3(1, 1, 1);
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

function applyHeadMatrices(rt) {
  const { heads, yokeMesh, headMesh, lensMesh } = rt.parts;
  for (let i = 0; i < heads.length; i++) {
    const h = heads[i];
    const st = rt.state[i];
    _e.set(0, st.pan, 0);
    _q.setFromEuler(_e);
    _m.compose(_p.set(h.x, h.y, h.z), _q, ONE);
    yokeMesh.setMatrixAt(i, _m);
    _e.set(st.tilt, st.pan, 0);
    _q.setFromEuler(_e);
    _m.compose(_p.set(h.x, h.y - HEAD_PIVOT_DROP, h.z), _q, ONE);
    headMesh.setMatrixAt(i, _m);
    lensMesh.setMatrixAt(i, _m);
  }
  yokeMesh.instanceMatrix.needsUpdate = true;
  headMesh.instanceMatrix.needsUpdate = true;
  lensMesh.instanceMatrix.needsUpdate = true;
}

/** Programme: target pan / tilt (radians) and colour of head i at time t. */
function headTarget(look, t, h, i, hue, out) {
  const xn = h.x / 7;
  const k = h.truss;
  switch (look) {
    case 0: // fan out over the arena
      out.tilt = -(56 + 12 * Math.sin(t * 0.9 + k * 0.8)) * DEG;
      out.pan = (xn * 38 + 8 * Math.sin(t * 0.5)) * DEG;
      out.h = (hue + (k % 2) * 150) % 360;
      out.l = 0.6;
      break;
    case 1: // ballyhoo
      out.pan = Math.sin(t * 0.7 + i * 1.3) * 120 * DEG;
      out.tilt = (-25 + 50 * Math.sin(t * 0.9 + i * 0.7)) * DEG;
      out.h = (hue + i * 11) % 360;
      out.l = 0.58;
      break;
    case 2: {
      // everything on one point of the deck
      const px = 5 * Math.sin(0.5 * t);
      const pz = -6 + 2.5 * Math.sin(0.37 * t);
      const vx = px - h.x;
      const vy = STAGE.h - (h.y - HEAD_PIVOT_DROP);
      const vz = pz - h.z;
      const len = Math.hypot(vx, vy, vz);
      out.tilt = Math.acos(Math.min(1, -vy / len));
      out.pan = Math.atan2(-vx, -vz);
      out.h = (hue + 40) % 360;
      out.l = 0.82;
      break;
    }
    case 3: // crossing beams above the audience
      out.tilt = -(98 + 16 * Math.sin(t * 0.8 + k)) * DEG;
      out.pan = (-xn * 42 + 18 * Math.sin(t * 0.6 + k)) * DEG;
      out.h = (hue + k * 24) % 360;
      out.l = 0.6;
      break;
    default: // travelling wave
      out.tilt = -(28 + 44 * (0.5 + 0.5 * Math.sin(t * 1.6 - h.x * 0.45 + k * 0.5))) * DEG;
      out.pan = xn * 14 * DEG;
      out.h = (hue + 200 + 30 * Math.sin(h.x * 0.4)) % 360;
      out.l = 0.6;
  }
}

function approach(cur, target, maxStep) {
  const d = target - cur;
  return Math.abs(d) <= maxStep ? target : cur + Math.sign(d) * maxStep;
}

function onDeck(x, z) {
  return z <= 0 && ((Math.abs(x) <= STAGE.halfW && z >= -STAGE.depth) || (Math.abs(x) <= STAGE.hanOuter && z >= -STAGE.hanDepth));
}

/**
 * LED materials owned by other modules (the Upper Stand ribbon, the hall coves) are looked
 * up by id. Their house colour is remembered while no show runs; in show mode they join the
 * chase unless their owner animates them itself (detected: the colour written here did not
 * survive until the next frame), in which case they are left alone for good.
 */
function scanExternal(rt, show) {
  for (const [id, m] of allMaterials()) {
    if (id !== 'led.ribbon' && !/cove/i.test(id)) continue;
    let e = rt.ext.get(id);
    if (!e) {
      const prop = m.userData.unlit ? 'color' : m.emissive ? 'emissive' : null;
      if (!prop) continue;
      e = { m, prop, ribbon: id === 'led.ribbon', base: m[prop].getHex(), last: null, foreign: false };
      rt.ext.set(id, e);
    }
    if (!show && !e.foreign && e.last === null) e.base = e.m[e.prop].getHex();
  }
}

function setNeutral(rt) {
  const { mats, lensMesh, showGroup } = rt.parts;
  rt.fx.visible = false;
  if (showGroup) showGroup.visible = false;
  const off = _c.set(LENS_OFF);
  for (let i = 0; i < rt.state.length; i++) lensMesh.setColorAt(i, off);
  lensMesh.instanceColor.needsUpdate = true;
  mats['light.work'].color.set(WORK_ON);
  mats['light.spotLens'].color.set(LENS_OFF);
  for (const m of rt.led) {
    if (rt.idleTex) {
      m.map = rt.idleTex;
      m.color.set('#ffffff');
    } else m.color.copy(m.userData.idleColor);
  }
  for (const e of rt.ext.values()) {
    if (!e.foreign && e.base !== null && e.last !== null) e.m[e.prop].setHex(e.base);
    e.last = null;
  }
  if (rt.parts.neutralGroup) rt.parts.neutralGroup.visible = true;
  rt.settled = false;
}

function setShow(rt) {
  const { mats, showGroup } = rt.parts;
  rt.fx.visible = true;
  if (showGroup) showGroup.visible = true;
  if (rt.parts.neutralGroup) rt.parts.neutralGroup.visible = false;
  mats['light.work'].color.set(WORK_OFF);
  mats['light.spotLens'].color.set('#f4f7ff');
  if (rt.show) for (const m of rt.led) m.map = rt.show.texture;
}

export function updateShow(rt, state, dt) {
  const show = !!state.show;
  if (show !== rt.lastShow) {
    rt.lastShow = show;
    if (show) setShow(rt);
    else setNeutral(rt);
  }
  const step = Math.min(Math.max(dt || 0, 0), 0.1);
  const { heads, spots, lensMesh } = rt.parts;

  const now = state.time || 0;
  if (rt.scanAt < 0 || now - rt.scanAt > 2 || now < rt.scanAt) {
    rt.scanAt = now;
    scanExternal(rt, show);
  }

  if (!show) {
    if (rt.settled) return;
    // let the heads travel back to their home position, then stop touching the buffers
    let moving = false;
    for (const st of rt.state) {
      st.pan = approach(st.pan, 0, 2.4 * step);
      st.tilt = approach(st.tilt, 0, 1.8 * step);
      if (st.pan !== 0 || st.tilt !== 0) moving = true;
    }
    applyHeadMatrices(rt);
    if (!moving) rt.settled = true;
    return;
  }

  const t = state.time || 0;
  const hue = (t * 14) % 360;
  const look = Math.floor(t / LOOK_SECONDS) % 5;
  const beat = 1 - ((t * 2) % 1); // 120 bpm pulse
  const pulse = 0.72 + 0.28 * beat * beat;
  const tgt = { pan: 0, tilt: 0, h: 0, l: 0.6 };
  const { beams, pools } = rt;

  for (let i = 0; i < heads.length; i++) {
    const h = heads[i];
    const st = rt.state[i];
    headTarget(look, t, h, i, hue, tgt);
    st.pan = approach(st.pan, tgt.pan, 3.2 * step);
    st.tilt = approach(st.tilt, tgt.tilt, 2.4 * step);
    _c.setHSL(tgt.h / 360, tgt.l > 0.8 ? 0.25 : 0.95, tgt.l);
    lensMesh.setColorAt(i, _c);
    // beam
    _e.set(st.tilt, st.pan, 0);
    _q.setFromEuler(_e);
    _d.copy(_up).applyQuaternion(_q);
    const oy = h.y - HEAD_PIVOT_DROP + _d.y * LENS_OFFSET;
    const ox = h.x + _d.x * LENS_OFFSET;
    const oz = h.z + _d.z * LENS_OFFSET;
    let L = 46;
    let pool = false;
    if (_d.y < -0.05) {
      const tDeck = (oy - STAGE.h) / -_d.y;
      if (onDeck(ox + _d.x * tDeck, oz + _d.z * tDeck)) {
        L = tDeck;
        pool = true;
      } else L = Math.min(70, oy / -_d.y);
    }
    const w = 0.16 + L * 0.036;
    _m.compose(_p.set(ox, oy, oz), _q, _s.set(w, L, w));
    beams.setMatrixAt(i, _m);
    _c.multiplyScalar(pulse);
    beams.setColorAt(i, _c);
    if (pool) {
      _m.makeScale(w * 1.7, 1, w * 1.7).setPosition(ox + _d.x * L, STAGE.h + 0.025, oz + _d.z * L);
      pools.setMatrixAt(i, _m);
      pools.setColorAt(i, _c);
    } else pools.setMatrixAt(i, ZERO);
  }
  applyHeadMatrices(rt);
  lensMesh.instanceColor.needsUpdate = true;

  // follow spots: the front row tracks a point on the deck; the rear row joins on some looks
  const fx = 6.5 * Math.sin(0.31 * t);
  const fz = -5 + 3 * Math.sin(0.23 * t + 1);
  for (let j = 0; j < spots.length; j++) {
    const i = heads.length + j;
    const sp = spots[j];
    const on = j < 4 || look === 2 || look === 4;
    if (!on) {
      beams.setMatrixAt(i, ZERO);
      pools.setMatrixAt(i, ZERO);
      continue;
    }
    const tx = fx + (j % 4 < 2 ? -1 : 1) * (j < 4 ? 0 : 3.5);
    _d.set(tx - sp.pos.x, STAGE.h - sp.pos.y, fz - sp.pos.z);
    const L = _d.length();
    _d.divideScalar(L);
    _q.setFromUnitVectors(_up, _d);
    const w = 0.2 + L * 0.016;
    _m.compose(sp.pos, _q, _s.set(w, L, w));
    beams.setMatrixAt(i, _m);
    _c.setRGB(0.5, 0.52, 0.56);
    beams.setColorAt(i, _c);
    _m.makeScale(w * 1.8, 1, w * 1.8).setPosition(tx, STAGE.h + 0.03, fz);
    pools.setMatrixAt(i, _m);
    _c.setRGB(0.75, 0.75, 0.8);
    pools.setColorAt(i, _c);
  }
  beams.instanceMatrix.needsUpdate = true;
  beams.instanceColor.needsUpdate = true;
  pools.instanceMatrix.needsUpdate = true;
  pools.instanceColor.needsUpdate = true;

  // haze breathes with the programme colour
  const hz = rt.parts.mats['fx.haze'];
  hz.color.setHSL(((hue + 200) % 360) / 360, 0.55, 0.5);
  hz.opacity = 0.045 + 0.02 * Math.sin(t * 0.7);
  rt.haze.position.x = 2.5 * Math.sin(t * 0.11);
  rt.haze.position.z = 1.5 * Math.sin(t * 0.07 + 2);

  // LED surfaces
  if (rt.show) rt.show.draw(t, hue);
  else for (const m of rt.led) m.color.setHSL(((hue + 220) % 360) / 360, 0.85, 0.45 + 0.1 * beat);
  if (!rt.show) rt.parts.mats['led.upstage'].color.setHSL(((hue + 300) % 360) / 360, 0.9, 0.45);

  // ribbon and cove LEDs owned by other modules (looked up by material id)
  let n = 0;
  for (const e of rt.ext.values()) {
    if (e.foreign) continue;
    const c = e.m[e.prop];
    if (e.last !== null && c.getHex() !== e.last) {
      e.foreign = true; // its owner drives it: hands off
      continue;
    }
    if (e.ribbon) c.setHSL(((hue + 180) % 360) / 360, 0.9, 0.5 + 0.12 * beat);
    else c.setHSL(((hue + 40 + 35 * n++) % 360) / 360, 0.85, 0.5);
    e.last = c.getHex();
  }
}

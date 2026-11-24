// Projected HTML labels with decluttering.
//
// Built-in labels: the parts of the arena (tiers, stage), entrances, gates, levels and the
// neighbouring buildings and bridges. Site modules can add more through an exported LABELS
// array; several shapes are accepted (see normalise()).
//
// Decluttering: each label has a distance range and a priority. Per update the labels in
// range are projected, sorted by priority then distance, and placed greedily; a label
// whose box would overlap an already placed one is hidden.
import * as THREE from 'three';
import { LEVEL_Y, DECK_Y, GLASS_BOX, Z, outerHalfWidth, ROOF_OUTLINE } from '../core/envelope.js';
import { lonLatToWorld, G } from '../core/frame.js';
import { GATES, PARTS, uvToWorld } from '../core/seating.js';
import { SPEC } from '../core/spec.js';

const ENVELOPE_TOP = 40; // the arena as a prism under its roof outline, for label occlusion

/**
 * Length (m) of the straight line a→b that runs inside the arena envelope (the convex roof
 * outline extruded from the ground to ENVELOPE_TOP). Cyrus-Beck clipping in plan + a y slab.
 */
export function lengthInsideArena(a, b) {
  let t0 = 0;
  let t1 = 1;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  const n = ROOF_OUTLINE.length;
  for (let i = 0; i < n; i++) {
    const [x0, z0] = ROOF_OUTLINE[i];
    const [x1, z1] = ROOF_OUTLINE[(i + 1) % n];
    // inward normal of edge i (the ring runs house-right flank → rear → house-left flank)
    const nx = -(z1 - z0);
    const nz = x1 - x0;
    const num = nx * (a.x - x0) + nz * (a.z - z0);
    const den = nx * dx + nz * dz;
    if (Math.abs(den) < 1e-9) {
      if (num < 0) return 0;
      continue;
    }
    const t = -num / den;
    if (den > 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
    if (t0 >= t1) return 0;
  }
  if (Math.abs(dy) < 1e-9) {
    if (a.y < 0 || a.y > ENVELOPE_TOP) return 0;
  } else {
    const ta = (0 - a.y) / dy;
    const tb = (ENVELOPE_TOP - a.y) / dy;
    t0 = Math.max(t0, Math.min(ta, tb));
    t1 = Math.min(t1, Math.max(ta, tb));
    if (t0 >= t1) return 0;
  }
  return (t1 - t0) * Math.hypot(dx, dy, dz);
}

function centroid(ring) {
  let x = 0;
  let z = 0;
  for (const p of ring) {
    x += p[0];
    z += p[1];
  }
  return [x / ring.length, z / ring.length];
}

function tierLabelPos(key, rowFrac = 0.5) {
  const part = PARTS.find((p) => p.key === key);
  if (!part) return null;
  const r = part.rows[Math.floor((part.rows.length - 1) * rowFrac)];
  let u0 = Infinity;
  let u1 = -Infinity;
  for (const s of r.segs) {
    u0 = Math.min(u0, s.u0);
    u1 = Math.max(u1, s.u1);
  }
  const [x, z] = uvToWorld(part.facet, (u0 + u1) / 2, r.v);
  return [x, r.y + 2.6, z];
}

/** Built-in labels. scope: 'out' = shown from outside, 'in' = inside / cut open, 'both'. */
export function builtinLabels() {
  const L = [];
  const add = (o) => L.push(o);

  // the building itself and its neighbours
  add({ id: 'arena', text: 'K-Arena Yokohama', sub: 'Kアリーナ横浜', pos: [0, 50, 62], scope: 'out', min: 250, max: 2000, prio: 10, kind: 'building' });
  for (const n of SPEC.neighbours || []) {
    if (!Array.isArray(n.footprint)) continue;
    const ring = n.footprint.map(([lon, lat]) => lonLatToWorld(lon, lat));
    const [x, z] = centroid(ring);
    const h = n.height_m || 6;
    if (/^Hilton/.test(n.name)) add({ id: 'hilton', text: 'Hilton Yokohama', sub: 'ヒルトン横浜', pos: [x, h + 6, z], scope: 'out', min: 60, max: 2000, prio: 8, kind: 'building' });
    else if (/^K Tower/.test(n.name)) add({ id: 'ktower', text: 'K Tower Yokohama', sub: 'Kタワー横浜', pos: [x, h + 6, z], scope: 'out', min: 60, max: 2000, prio: 8, kind: 'building' });
    else if (/Takashima/.test(n.name)) {
      const mid = ring[Math.floor(ring.length / 2)];
      add({ id: 'suisaisen', text: '高島水際線デッキ', sub: '다카시마 수변선 덱 (보행교)', pos: [mid[0], 9.5, mid[1]], scope: 'out', min: 30, max: 520, prio: 5, kind: 'bridge' });
    } else if (/^Arena Tent/.test(n.name)) add({ id: 'arenatent', text: 'Arena Tent', sub: '굿즈 판매', pos: [x, h + 2.5, z], scope: 'out', min: 15, max: 230, prio: 3, kind: 'place' });
    else if (/^Bay Tent/.test(n.name)) add({ id: 'baytent', text: 'Bay Tent', sub: 'Music Terrace Stage', pos: [x, h + 2.5, z], scope: 'out', min: 15, max: 230, prio: 3, kind: 'place' });
  }
  const site = SPEC.site || {};
  if (site.bigStepsBottom && site.bigStepsTop) {
    const a = lonLatToWorld(...site.bigStepsBottom);
    const b = lonLatToWorld(...site.bigStepsTop);
    add({ id: 'bigsteps', text: 'Big Steps', sub: 'ビッグステップス', pos: [(a[0] + b[0]) / 2, DECK_Y.arenaDeck + 1.5, (a[1] + b[1]) / 2], scope: 'out', min: 15, max: 260, prio: 4, kind: 'place' });
  }
  const gate = (id, key, text, sub) => {
    if (!site[key]) return;
    const [x, z] = lonLatToWorld(...site[key]);
    add({ id, text, sub, pos: [x, 6, z], scope: 'out', min: 15, max: 330, prio: 4, kind: 'place' });
  };
  gate('northgate', 'northGateStairFoot', 'North Gate', '노스 게이트');
  gate('southgate', 'southGateStairFoot', 'South Gate', '사우스 게이트');
  gate('westgate', 'westGate', 'West Gate', '웨스트 게이트');
  add({ id: 'deck', text: 'Arena Deck', sub: 'LEVEL 3 · +7.27 m', pos: [-18, DECK_Y.arenaDeck + 1.2, Z.rearEave + 4], scope: 'out', min: 12, max: 170, prio: 3, kind: 'place' });
  // sky bridge to the Hilton on LEVEL 5, on the W facet (house right)
  add({ id: 'skybridge', text: 'Hilton 연결 브리지', sub: 'LEVEL 5', pos: [74, LEVEL_Y[5] + 5.5, 92], scope: 'out', min: 20, max: 260, prio: 5, kind: 'bridge' });

  // entrances
  const entKo = { Main: '메인 엔트런스', North: '노스 엔트런스', South: '사우스 엔트런스' };
  for (const e of SPEC.geo?.entrances || []) {
    const [x, z] = G(...e.xy_G);
    const name = e.name.split(' (')[0];
    const key = name.split(' ')[0];
    // put the label just outside the wall line, above the doors
    const out = key === 'Main' ? [0, 4.5] : [Math.sign(x) * 5.5, 8.5];
    add({ id: `ent-${key}`, text: name, sub: `${entKo[key] || ''} · LEVEL 3`, pos: [x + out[0], e.elevation_m + 5.2, z + out[1]], scope: 'out', min: 14, max: 300, prio: 7, kind: 'entrance' });
  }
  add({ id: 'eave', text: '대형 처마', sub: '돌출 9 m · 기둥 24개', pos: [-24, 39, Z.rearEave - 3], scope: 'out', min: 25, max: 220, prio: 2, kind: 'part' });
  add({ id: 'glassbox', text: 'Glass Box', sub: 'Lounge 5 · VIP · Arena Bar 7', pos: [14, 30, GLASS_BOX.zFront + 0.5], scope: 'out', min: 25, max: 200, prio: 2, kind: 'part' });

  // inside: stage, tiers
  add({ id: 'stage', text: '무대', sub: `기본 스테이지 ${SPEC.stage.width_m} × ${SPEC.stage.depth_m} m`, pos: [0, SPEC.stage.height_m + 3.2, -SPEC.stage.depth_m / 2], scope: 'in', min: 8, max: 420, prio: 9, kind: 'part' });
  const tiers = [
    ['L1/C', 'ARENA', 'LEVEL 1 · 3,964석', 1, 0.45],
    ['L3/C', 'LOWER STAND', 'LEVEL 3 · 4,978석', 3, 0.5],
    ['L5/C', 'MIDDLE STAND', 'LEVEL 5 · 4,372석', 5, 0.75],
    ['L7/C', 'UPPER STAND', 'LEVEL 7 · 6,579석', 7, 0.5],
  ];
  for (const [key, text, sub, level, frac] of tiers) {
    const pos = tierLabelPos(key, frac);
    if (pos) add({ id: `tier-${level}`, text, sub, pos, scope: 'in', min: 10, max: 420, prio: 8, kind: 'part', level });
  }
  add({ id: 'balcony', text: 'BALCONY 발코니석', sub: '235석', pos: tierLabelPos('L5/balcony', 0.5) || [0, 13, 56], scope: 'in', min: 6, max: 70, prio: 3, kind: 'part', level: 5 });
  add({ id: 'vip', text: 'VIP BOX', sub: 'LEVEL 6 · 11실', pos: [0, LEVEL_Y[6] + 3.2, 70.5], scope: 'in', min: 8, max: 110, prio: 4, kind: 'part', level: 6 });
  add({ id: 'lounge5', text: 'Lounge 5', sub: 'LEVEL 5 · 약 400석', pos: [0, LEVEL_Y[5] + 3.4, (GLASS_BOX.zBack + GLASS_BOX.zFront) / 2], scope: 'in', min: 4, max: 90, prio: 5, kind: 'place', level: 5 });
  add({ id: 'bar7', text: 'Arena Bar 7', sub: 'LEVEL 7 · 120석', pos: [0, LEVEL_Y[7] + 3.2, (GLASS_BOX.zBack + GLASS_BOX.zFront) / 2], scope: 'in', min: 4, max: 90, prio: 5, kind: 'place', level: 7 });
  add({ id: 'foyer', text: 'Main Foyer', sub: 'LEVEL 3 · 메인 홀', pos: [0, LEVEL_Y[3] + 3.6, 82], scope: 'in', min: 4, max: 90, prio: 5, kind: 'place', level: 3 });

  // gates (扉) of the official seat map
  for (const [id, [x, z]] of Object.entries(GATES)) {
    const level = Number(id[0]);
    const y = (SPEC.gates || []).find((g) => String(g.gate) === id)?.elevation_m ?? LEVEL_Y[level];
    add({ id: `gate-${id}`, text: id, pos: [x, y + 2.9, z], scope: 'in', min: 3, max: level === 1 ? 75 : 62, prio: 1, kind: 'gate', level });
  }

  // level lines along the house-right flank (shown with cuts and the floor selector)
  for (let lv = 1; lv <= 9; lv++) {
    const zz = 22;
    add({ id: `level-${lv}`, text: `LEVEL ${lv}`, sub: `+${LEVEL_Y[lv].toFixed(2)} m`, pos: [outerHalfWidth(zz) + 2.5, LEVEL_Y[lv] + 0.9, zz], scope: 'cut', min: 20, max: 900, prio: 6, kind: 'level', level: lv });
  }
  return L;
}

/** Accept the label shapes site modules may export. */
export function normalise(raw, moduleId) {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : Object.entries(raw).map(([k, v]) => (typeof v === 'object' && !Array.isArray(v) ? { id: k, ...v } : { id: k, pos: v }));
  const out = [];
  list.forEach((l, i) => {
    if (!l) return;
    let pos = l.pos || l.position || l.at || l.xyz;
    if (!pos && l.x !== undefined && l.z !== undefined) pos = [l.x, l.y ?? 0, l.z];
    if (!pos && Array.isArray(l.lonLat)) {
      const [x, z] = lonLatToWorld(l.lonLat[0], l.lonLat[1]);
      pos = [x, l.y ?? l.height ?? 0, z];
    }
    if (pos && pos.isVector3) pos = pos.toArray();
    if (!Array.isArray(pos)) return;
    if (pos.length === 2) pos = [pos[0], l.y ?? l.height ?? 0, pos[1]];
    if (!pos.every(Number.isFinite)) return;
    // proper names stay in Japanese / English, the Korean reading goes on the second line
    let text = l.text || l.label || l.name || l.title;
    let sub = l.sub || l.subtitle || '';
    const proper = l.ja || l.en;
    if (proper && l.ko && proper !== l.ko) {
      text = proper;
      if (!sub) sub = l.ko;
    } else if (!text) text = proper || l.ko;
    if (!text) return;
    if (!sub && l.en && l.en !== text && !l.ko) sub = l.en;
    if (l.beyond) sub = `${sub ? `${sub} · ` : ''}${l.beyond} m 더 →`;
    const kind = l.kind || l.type || 'place';
    out.push({
      module: moduleId,
      id: `${moduleId}-${l.id ?? i}`,
      text: String(text),
      sub: String(sub || ''),
      pos,
      scope: l.scope || (l.inside ? 'in' : 'out'),
      min: l.minDist ?? l.min ?? 12,
      max: l.maxDist ?? l.max ?? (kind === 'building' ? 260 + Math.min(pos[1], 120) * 6 : kind === 'station' || kind === 'road' || kind === 'water' || kind === 'area' || kind === 'park' || kind === 'rail' || kind === 'bridge' ? 900 : 380),
      prio: l.priority ?? l.prio ?? (kind === 'building' ? (pos[1] > 60 ? 5 : 3) : kind === 'station' ? 6 : 3),
      kind,
      level: l.level,
    });
  });
  return out;
}

export class Labels {
  /**
   * @param {HTMLElement} root
   * @param {THREE.Camera} camera
   */
  constructor(root, camera) {
    this.root = root;
    this.camera = camera;
    this.items = [];
    this.enabled = true;
    this.maxVisible = 46;
    this.dirty = true;
    this._v = new THREE.Vector3();
    this._ids = new Set();
    /** Optional (from: Vector3, to: Vector3) => boolean: true when the model hides `to`. */
    this.occluder = null;
    /** Section plane (THREE.Plane) while a cut is active: labels on the removed side are hidden. */
    this.clipPlane = null;
    this.context = { inside: 0, cut: false, level: null, mode: 'explore', layers: {} };
  }

  add(list) {
    for (const l of list) {
      if (this._ids.has(l.id)) continue;
      // a module label that duplicates a built-in one (same text, nearby) is dropped
      const dup = this.items.find((it) => it.def.text === l.text && Math.hypot(it.def.pos[0] - l.pos[0], it.def.pos[2] - l.pos[2]) < 60);
      if (dup) continue;
      this._ids.add(l.id);
      const el = document.createElement('div');
      el.className = `lbl lbl-${l.kind || 'place'}`;
      const t = document.createElement('b');
      t.textContent = l.text;
      el.append(t);
      if (l.sub) {
        const s = document.createElement('span');
        s.textContent = l.sub;
        el.append(s);
      }
      el.style.display = 'none';
      this.root.append(el);
      this.items.push({ def: l, el, shown: false, w: 0, h: 0, pos: new THREE.Vector3(...l.pos) });
    }
    this.dirty = true;
  }

  removeByPrefix(prefix) {
    this.items = this.items.filter((it) => {
      if (!it.def.id.startsWith(prefix)) return true;
      it.el.remove();
      this._ids.delete(it.def.id);
      return false;
    });
    this.dirty = true;
  }

  setEnabled(on) {
    this.enabled = !!on;
    this.root.style.display = on ? '' : 'none';
    this.dirty = true;
  }

  setContext(ctx) {
    Object.assign(this.context, ctx);
    this.dirty = true;
  }

  /**
   * Stand the LEVEL markers beside what is being looked at: at the stage end of a
   * longitudinal cut, at the house-right wall of a cross cut, beside the flank otherwise.
   */
  anchorLevels(axis = null, pos = 0) {
    this.hideLevels = axis === 'y'; // a plan cut needs no storey markers
    for (const it of this.items) {
      if (it.def.kind !== 'level') continue;
      const y = LEVEL_Y[it.def.level] + 0.9;
      if (axis === 'x') it.pos.set(pos, y, Z.stageEndFacade - 5);
      else if (axis === 'z') it.pos.set(Math.max(outerHalfWidth(pos), 20) + 4, y, pos);
      else it.pos.set(outerHalfWidth(22) + 2.5, y, 22);
    }
    this.dirty = true;
  }

  /** Re-project and declutter. Call when the camera moved or the context changed. */
  update(width, height) {
    if (!this.enabled) return;
    this.dirty = false;
    const cam = this.camera;
    const c = this.context;
    const inside = c.inside > 0.5;
    const opened = c.cut || c.level !== null || c.roofOpen;
    const cand = [];
    for (const it of this.items) {
      const d = it.def;
      let ok = true;
      if (d.scope === 'in') ok = inside || opened;
      else if (d.scope === 'out') ok = !inside;
      else if (d.scope === 'cut') ok = (c.cut || c.level !== null) && !inside && !(c.cut && this.hideLevels);
      if (ok && c.level !== null && d.level !== undefined && d.level !== c.level) ok = false;
      if (ok && c.level !== null && d.scope === 'in' && d.level === undefined) ok = false;
      if (ok && d.kind === 'gate' && c.layers.bowl === false) ok = false;
      if (ok && d.id === 'stage' && (c.stageKit === false || c.layers.stage === false)) ok = false;
      if (ok && c.cut && this.clipPlane && d.kind !== 'level' && this.clipPlane.distanceToPoint(it.pos) < -1.5) ok = false;
      if (ok) {
        const dist = cam.position.distanceTo(it.pos);
        // seen from outside through a cut, interior labels use a wider range
        const max = d.scope === 'in' && !inside ? Math.max(d.max, d.kind === 'gate' ? 190 : 600) : d.max;
        const min = d.scope === 'in' && !inside ? 0 : d.min;
        if (dist < min || dist > max) ok = false;
        else {
          this._v.copy(it.pos).project(cam);
          if (this._v.z > 1 || this._v.z < -1 || Math.abs(this._v.x) > 1.05 || Math.abs(this._v.y) > 1.05) ok = false;
          else cand.push({ it, dist, x: (this._v.x * 0.5 + 0.5) * width, y: (-this._v.y * 0.5 + 0.5) * height });
        }
      }
      if (!ok && it.shown) {
        it.shown = false;
        it.el.style.display = 'none';
      }
    }
    cand.sort((a, b) => b.it.def.prio - a.it.def.prio || a.dist - b.dist);
    const placed = [];
    let count = 0;
    // labels of things inside the building are hidden when walls or floors are in the way
    const occluder = !opened ? this.occluder : null;
    // near the ground only a few of the surrounding city's names are shown
    const low = cam.position.y < 50;
    const narrow = width < 620; // phones: fewer still
    const caps = { building: narrow ? (low ? 1 : 5) : low ? 4 : 14, road: narrow ? 2 : low ? 3 : 8, station: narrow ? 1 : low ? 2 : 6 };
    const used = { building: 0, road: 0, station: 0 };
    for (const cnd of cand) {
      const it = cnd.it;
      const d = it.def;
      let hidden = false;
      if (d.module && used[d.kind] !== undefined && used[d.kind] >= caps[d.kind]) hidden = true;
      // whatever lies behind the arena is not labelled through it
      if (!hidden && !inside && (!opened || d.module) && d.scope !== 'in' && d.id !== 'arena' && lengthInsideArena(cam.position, it.pos) > 16) hidden = true;
      if (!hidden && occluder && count < this.maxVisible && (d.scope === 'in' || d.kind === 'entrance') && occluder(cam.position, it.pos)) hidden = true;
      if (hidden) {
        if (it.shown) {
          it.shown = false;
          it.el.style.display = 'none';
        }
        continue;
      }
      if (!it.w) {
        // measure once (needs to be displayed)
        it.el.style.display = '';
        it.el.style.visibility = 'hidden';
        it.w = it.el.offsetWidth || 60;
        it.h = it.el.offsetHeight || 18;
        it.el.style.visibility = '';
        if (!it.shown) it.el.style.display = 'none';
      }
      const x0 = cnd.x - it.w / 2 - 7;
      const y0 = cnd.y - it.h - 9;
      const x1 = x0 + it.w + 14;
      const y1 = y0 + it.h + 12;
      let hit = count >= this.maxVisible;
      if (!hit) {
        for (const p of placed) {
          if (x0 < p[2] && x1 > p[0] && y0 < p[3] && y1 > p[1]) {
            hit = true;
            break;
          }
        }
      }
      if (hit) {
        if (it.shown) {
          it.shown = false;
          it.el.style.display = 'none';
        }
        continue;
      }
      placed.push([x0, y0, x1, y1]);
      count++;
      if (d.module && used[d.kind] !== undefined) used[d.kind]++;
      if (!it.shown) {
        it.shown = true;
        it.el.style.display = '';
      }
      it.el.style.transform = `translate3d(${Math.round(cnd.x - it.w / 2)}px, ${Math.round(cnd.y - it.h - 4)}px, 0)`;
    }
  }
}

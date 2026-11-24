// Visibility of model objects from their tags:
//   userData.layer       layer toggle (exterior, roof, structure, hall, bowl, seats, stage, venues, precinct, context, ground, …)
//   userData.level       building LEVEL 1..9 (floor selector)
//   userData.telescopic  retractable stand and its seats   (true = shown when deployed, 'stored' = shown when stored)
//   userData.arenaSeats  movable floor seats               (hidden in standing mode)
//   userData.stageKit    demountable stage kit             (hidden when the kit is off)
//   userData.showOnly    visible only while the show lighting is on
// Tags may sit on the object itself or on any ancestor inside its module group.
//
// The app never writes Object3D.visible: several modules switch their own meshes with it
// (night-only lights, curtain states, the show set). Instead an object is hidden by taking
// it off three.js layer 0, which the camera, the shadow pass and the raycaster all respect.
import * as THREE from 'three';

/** Layers in panel order, with Korean names. Unknown layers found in modules are appended. */
export const LAYERS = [
  { id: 'exterior', ko: '외관' },
  { id: 'roof', ko: '지붕' },
  { id: 'structure', ko: '구조체' },
  { id: 'hall', ko: '홀 벽·갤러리' },
  { id: 'bowl', ko: '객석 스탠드' },
  { id: 'seats', ko: '좌석' },
  { id: 'stage', ko: '무대·연출 설비' },
  { id: 'venues', ko: '라운지·콘코스' },
  { id: 'precinct', ko: 'Music Terrace' },
  { id: 'context', ko: '주변 건물' },
  { id: 'ground', ko: '지면' },
];

const LAYER_ALIAS = { site: 'ground' };
/** Layers that make up the arena building (affected by the floor selector). */
const BUILDING_LAYERS = new Set(['exterior', 'roof', 'structure', 'hall', 'bowl', 'seats', 'stage', 'venues', 'props']);
/** Untagged building parts that would cover a floor plan are hidden outright in level mode. */
const COVER_LAYERS = new Set(['roof', 'exterior']);

const TAGS = ['layer', 'level', 'telescopic', 'arenaSeats', 'stageKit', 'showOnly', 'idleOnly', 'animatedStandIn'];

function resolveTags(obj) {
  const out = {};
  for (let p = obj; p; p = p.parent) {
    const u = p.userData;
    for (const t of TAGS) if (out[t] === undefined && u[t] !== undefined) out[t] = u[t];
    if (u.moduleId) {
      out.moduleId = u.moduleId;
      break;
    }
  }
  if (out.layer !== undefined) out.layer = LAYER_ALIAS[out.layer] || String(out.layer);
  return out;
}

/** Object3D.visible of the object and all its ancestors (what the module itself wants shown). */
export function moduleVisible(obj) {
  for (let p = obj; p; p = p.parent) if (!p.visible) return false;
  return true;
}

export class Visibility {
  constructor() {
    this.records = [];
    this.layersSeen = new Set();
    this.ghostMaterial = new THREE.MeshBasicMaterial({
      name: 'app.ghost',
      color: '#9fb4d6',
      transparent: true,
      opacity: 0.07,
      depthWrite: false,
      fog: false,
    });
    this.ghostMaterial.userData.appOwned = true;
    this.onChange = null;
  }

  /** Register every drawable of a module group (call after the group is in the scene). */
  add(group, known = null) {
    group.traverse((o) => {
      if (known?.has(o)) return;
      if (!(o.isMesh || o.isLine || o.isPoints || o.isSprite)) return;
      const tags = resolveTags(o);
      this.records.push({ obj: o, tags, shown: true, ghosted: false });
      if (tags.layer) this.layersSeen.add(tags.layer);
    });
  }

  /** A seat replacement detaches some meshes while others keep their layer and ghost state. */
  refresh(group) {
    const live = new Set();
    group.traverse((o) => live.add(o));
    this.records = this.records.filter((r) => r.tags.moduleId !== group.userData.moduleId || live.has(r.obj));
    this.add(group, new Set(this.records.map((r) => r.obj)));
  }

  remove(group) {
    const inGroup = new Set();
    group.traverse((o) => inGroup.add(o));
    this.records = this.records.filter((r) => !inGroup.has(r.obj));
  }

  /** Layer ids for the panel: the known ones that occur, then any others found. */
  layerList() {
    const known = LAYERS.filter((l) => this.layersSeen.has(l.id));
    const extra = [...this.layersSeen].filter((id) => !LAYERS.some((l) => l.id === id)).map((id) => ({ id, ko: id === 'props' ? '소품' : id }));
    return [...known, ...extra];
  }

  /**
   * Apply the application state.
   *   s = { layers: {id: bool}, telescopic, arenaSeats, stageKit, show, roofOpen, level: number|null, levelGhost: bool }
   */
  apply(s) {
    const level = s.level ?? null;
    for (const r of this.records) {
      const t = r.tags;
      let vis = !r.suppressed || !!(t.animatedStandIn && s.show);
      let ghost = false;
      if (t.layer && s.layers[t.layer] === false) vis = false;
      if (vis && t.telescopic !== undefined && t.telescopic !== false) {
        const wantsDeployed = t.telescopic !== 'stored';
        if (wantsDeployed !== !!s.telescopic) vis = false;
      }
      if (vis && t.arenaSeats && !s.arenaSeats) vis = false;
      if (vis && t.stageKit && !s.stageKit) vis = false;
      if (vis && t.showOnly && !s.show) vis = false;
      if (vis && t.idleOnly && s.show) vis = false;
      if (vis && s.roofOpen && t.layer === 'roof') vis = false;
      if (vis && level !== null && BUILDING_LAYERS.has(t.layer)) {
        if (t.level === undefined) {
          if (COVER_LAYERS.has(t.layer)) vis = false;
          else ghost = true;
        } else if (Number(t.level) !== level) {
          if (s.levelGhost) ghost = true;
          else vis = false;
        }
      }
      if (ghost && !r.obj.isMesh) vis = false;
      if (vis !== r.shown) {
        r.shown = vis;
        if (vis) r.obj.layers.enable(0);
        else r.obj.layers.disable(0);
      }
      if (r.obj.isMesh && ghost !== r.ghosted) {
        if (ghost) {
          // remember what the module had on the mesh; ghosts must not darken the isolated floor
          r.material = r.obj.material;
          r.castShadow = r.obj.castShadow;
          r.obj.material = this.ghostMaterial;
          r.obj.castShadow = false;
        } else {
          r.obj.material = r.material;
          r.obj.castShadow = r.castShadow;
        }
        r.ghosted = ghost;
      }
    }
    this.onChange?.();
  }

  /** Instanced seat meshes that are on screen right now (for picking). */
  seatMeshes() {
    return this.records.filter((r) => r.tags.layer === 'seats' && r.obj.isInstancedMesh && r.shown && !r.ghosted && moduleVisible(r.obj)).map((r) => r.obj);
  }
}

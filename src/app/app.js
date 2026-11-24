import { language, preference, tr } from './i18n.js';
import { openGuide } from './guide.js';
// The application: scene assembly, render loop, modes and state.
import * as THREE from 'three';
import { MODULES, planModules, buildAll, buildModule, moduleName } from '../modules.js';
import { SPEC } from '../core/spec.js';
import { findSeat, PARTS, seatPosition } from '../core/seating.js';
import { createStore } from './store.js';
import { Gfx } from './gfx.js';
import { Environment } from './environment.js';
import { CameraRig } from './rig.js';
import { Visibility, moduleVisible } from './visibility.js';
import { Section } from './section.js';
import { Labels, builtinLabels, normalise as normaliseLabels } from './labels.js';
import { Walker, buildCollider, COLLIDER_LAYERS, WALK_RADIUS } from './walk.js';
import { resolveSeat, adjacentSeat, adjacentRow, seatPose, pickSeat, makeSeatMarker, findSpecialSeat, isSpecial } from './seats.js';
import { VIEWS, HOME_VIEW, viewById, WALK_STARTS, FLIGHT_STARTS, levelView, sectionView, SECTION_RANGE } from './views.js';
import { parseUrl, buildUrl, makeUrlWriter } from './urlstate.js';
import { collectSlots, loadTextures, loadProps } from './assets.js';
import { installStreetLighting } from './streetLighting.js';
import { UI } from './ui.js';

const clamp = THREE.MathUtils.clamp;

function autoQuality() {
  const coarse = matchMedia('(pointer: coarse)').matches;
  const small = Math.min(screen.width, screen.height) < 820;
  const mem = navigator.deviceMemory || 8;
  return (coarse && small) || mem <= 4 ? 'low' : 'high';
}

export class App {
  constructor({ canvas, uiRoot, labelRoot, loading }) {
    this.canvas = canvas;
    this.uiRoot = uiRoot;
    this.labelRoot = labelRoot;
    this.loading = loading;
    this.init = parseUrl();
    const init = this.init;
    const quality = init.quality || autoQuality();
    const layers = {};
    for (const id of init.hide || []) layers[id] = false;

    this.store = createStore({
      mode: init.mode || 'explore',
      view: null,
      night: init.night ?? false,
      show: init.show ?? false,
      labels: init.labels ?? true,
      roofOpen: init.roofOpen ?? false,
      telescopic: init.telescopic ?? true,
      arenaSeats: init.arenaSeats ?? true,
      stageKit: init.stageKit ?? true,
      curtains: init.curtains ?? true, // acoustic curtains drawn (closed)
      // off by default: the aerial photo is fetched from the PLATEAU tile server by site/ground
      aerial: init.aerial ?? false,
      layers,
      seat: null,
      picked: null,
      walkStart: !init.fly && init.walkStart || 'deck',
      flightStart: init.flightStart || 'plaza',
      fly: !!init.fly,
      locked: false,
      sectionAxis: init.sectionAxis || 'x',
      sectionPos: init.sectionPos ?? SECTION_RANGE[init.sectionAxis || 'x'].def,
      sectionFlip: init.sectionFlip ?? false,
      level: init.mode === 'levels' ? clamp(init.level || 3, 1, 9) : null,
      levelGhost: init.levelGhost ?? true,
      quality,
      ui: init.ui,
    });

    this.modules = new Map(); // id → build result
    this.updaters = [];
    this.attribution = [];
    this.propSlots = [];
    this.seatsApi = null;
    this.seatsGroup = null;
    this.collider = null;
    this.colliderDirty = true;
    this.time = 0;
    this.frameCount = 0;
    this.lastActivity = performance.now();
    this.lastRender = 0;
    this.running = false;
    this.ready = false;
    this.writeUrl = makeUrlWriter();
  }

  get s() {
    return this.store.state;
  }

  // =========================================================================================
  // start-up
  // =========================================================================================
  async start() {
    const s = this.s;
    this.gfx = new Gfx(this.canvas, { quality: s.quality, fixedDpr: this.init.dpr });
    this.renderer = this.gfx.renderer;
    this.scene = new THREE.Scene();
    this.rig = new CameraRig(this.canvas);
    this.camera = this.rig.camera;
    this.env = new Environment(this.scene, this.renderer, { quality: s.quality });
    this.env.setState({ night: s.night, show: s.show, open: s.roofOpen });
    this.visibility = new Visibility();
    this.section = new Section(this.scene);
    this.labels = new Labels(this.labelRoot, this.camera);
    this.walker = new Walker(this.rig);
    this.labels.occluder = (from, to) => this.walker.blocked(from, to);
    this.labels.clipPlane = this.section.plane;
    this.marker = makeSeatMarker();
    this.scene.add(this.marker);
    this.model = new THREE.Group();
    this.model.name = 'model';
    this.scene.add(this.model);

    this.ui = new UI(this.uiRoot, this);
    this.store.subscribe((changed, state, meta) => this.onState(changed, meta));
    this.bindInput();
    this.resize();
    this.layoutChanged();

    // --- model modules, one by one ---------------------------------------------------------
    const ids = planModules({ only: this.init.mods, debug: this.init.debug });
    const bar = this.loading.querySelector('#loading-bar');
    const step = this.loading.querySelector('#loading-step');
    const warn = this.loading.querySelector('#loading-warn');
    const yieldFrame = () => Promise.race([new Promise((r) => requestAnimationFrame(() => r())), new Promise((r) => setTimeout(r, 80))]);
    await buildAll({
      ids,
      quality: s.quality,
      flags: this.moduleFlags(),
      yieldFrame,
      onProgress: (i, total, id, phase) => {
        bar.style.width = `${Math.round((i / (total + 1)) * 100)}%`;
        if (phase === 'start') step.textContent = tr("{0} 구성 중… ({1}/{2})", moduleName(id), i + 1, total);
      },
      onBuilt: (result) => {
        this.adoptModule(result);
        if (result.status === 'failed') warn.textContent = tr("불러오지 못한 부분: {0}", this.failedModules().join(', '));
      },
    });
    step.textContent = tr("장면 준비 중…");
    bar.style.width = '96%';
    await yieldFrame();
    if (s.quality === 'high' && s.mode !== 'walk') {
      // collision mesh up front on desktop: walking starts at once and labels can be occlusion-tested
      this.ensureCollider();
      await yieldFrame();
    }

    this.labels.add(builtinLabels());
    this.ui.buildLayerList();
    this.ui.setStatus(this.failedModules(), this.missingModules());
    this.applyVisibility();
    this.labels.setEnabled(s.labels);
    if (!s.curtains) this.applyCurtains();
    this.ui.setAvailable({ curtains: typeof this.modules.get('arena/hall')?.mod?.setCurtains === 'function' });
    this.applyInitialView();
    this.gfx.setBloom(s.night || s.show, this.scene, this.camera);

    // compile shaders before the first frame so it does not stall
    try {
      await this.renderer.compileAsync(this.scene, this.camera);
    } catch (e) {
      console.warn('[app] compileAsync failed', e);
    }
    this.renderer.shadowMap.needsUpdate = true;
    this.running = true;
    this.timer = new THREE.Timer();
    this._raf = requestAnimationFrame((t) => this.frame(t));
    document.addEventListener('visibilitychange', () => this.onVisibility());

    // optional assets that may arrive later
    loadTextures(this.renderer, () => this.invalidate(true), s.quality)
      .then((n) => n && this.invalidate(true))
      .catch((e) => console.warn('[app] textures skipped:', e));
    loadProps(this.propSlots, this.seatsApi, s.quality)
      .then((res) => {
        if (!res) return;
        if (res.types.length) {
          this.model.add(res.group);
          this.lampPower = installStreetLighting(res.group, collectSlots(this.propSlots), this.s.night);
          this.visibility.add(res.group);
          // procedural stand-ins of the same prop type make way for the generated model
          const loaded = new Set(res.types);
          for (const r of this.visibility.records) {
            for (let o = r.obj; o && !o.userData.moduleId; o = o.parent) {
              const t = o.userData.propPlaceholder ?? o.userData.placeholderFor;
              if (t !== undefined && loaded.has(t)) r.suppressed = true;
            }
          }
        }
        if (res.seatKinds.length && this.seatsGroup) {
          // setSeatModel swapped meshes inside the seats group: register them again
          this.visibility.refresh(this.seatsGroup);
        }
        this.ui.buildLayerList();
        this.applyVisibility();
        if (this.section.active) this.section.enable(true);
      })
      .catch((e) => console.warn('[app] props skipped:', e));
  }

  moduleFlags() {
    const s = this.s;
    return { ...this.init.flags, aerial: s.aerial, night: s.night, debug: this.init.debug };
  }

  /** Take a build result into the scene and collect what the module exports. */
  adoptModule(result) {
    const old = this.modules.get(result.id);
    if (old?.group) {
      this.model.remove(old.group);
      this.visibility.remove(old.group);
      // geometry of a rebuilt module is no longer needed (materials are shared by id: keep them)
      old.group.traverse((o) => o.geometry?.dispose?.());
      this.updaters = this.updaters.filter((u) => u.id !== result.id);
      this.labels.removeByPrefix(`${result.id}-`);
    }
    this.modules.set(result.id, result);
    if (result.id === 'arena/structure') this.walker.doors = result.group?.userData.gates;
    if (result.status !== 'ok') return;
    const { group, mod, id } = result;
    this.model.add(group);
    group.updateMatrixWorld(true);
    this.visibility.add(group);
    if (typeof mod.update === 'function') this.updaters.push({ id, group, fn: mod.update, errors: 0 });
    if (mod.LABELS) {
      try {
        this.labels.add(normaliseLabels(mod.LABELS, id));
      } catch (e) {
        console.warn(`[app] LABELS of ${id} ignored`, e);
      }
    }
    if (!old) {
      // DATA_ATTRIBUTION: credit of a module's baked data; ATTRIBUTION: its general / optional credit
      const list = [mod.DATA_ATTRIBUTION, mod.ATTRIBUTION].flat().filter(Boolean);
      for (const a of list) {
        const key = typeof a === 'string' ? a : JSON.stringify(a);
        if (!this.attribution.some((b) => (typeof b === 'string' ? b : JSON.stringify(b)) === key)) this.attribution.push(a);
      }
    }
    if (mod.PROP_SLOTS && !old) this.propSlots.push(mod.PROP_SLOTS);
    if (group.userData.propSlots && !old) this.propSlots.push(group.userData.propSlots);
    if (id === 'arena/seats') {
      this.seatsApi = mod;
      this.seatsGroup = group;
    }
    this.colliderDirty = true;
  }

  failedModules() {
    return [...this.modules.values()].filter((m) => m.status === 'failed').map((m) => moduleName(m.id));
  }

  missingModules() {
    return [...this.modules.values()].filter((m) => m.status === 'missing').map((m) => moduleName(m.id));
  }

  applyInitialView() {
    const s = this.s;
    const init = this.init;
    if (s.mode === 'seat') {
      const { level, row, num } = init.seat;
      // The seats module owns VIP box seats and the LEVEL 3 companion row.
      const special = level === 6 || (level === 3 && row === 0);
      const seat = (special && findSpecialSeat(this.seatsGroup, this.seatsApi?.seatFromInstance, level, row, num)) ||
        resolveSeat(level === 6 ? 5 : level, row, num);
      this.store.set({ seat }, { silent: true });
      this.rig.jump(seatPose(seat, { standing: seat.tier === 1 && !s.arenaSeats }));
      this.env.inside = 1;
    } else if (s.mode === 'walk') {
      if (s.fly) this.startFlight(s.flightStart, init.cam);
      else this.enterWalk(s.walkStart, true);
    } else if (s.mode === 'section') {
      this.section.set(s.sectionAxis, s.sectionPos, s.sectionFlip);
      this.section.enable(true);
      this.rig.jump(init.cam || sectionView(s.sectionAxis, s.sectionPos, s.sectionFlip));
    } else if (s.mode === 'levels') {
      this.rig.jump(init.cam || levelView(s.level));
    } else if (init.cam) {
      this.rig.jump(init.cam);
    } else {
      const v = viewById(init.view) || viewById(HOME_VIEW);
      this.store.set({ view: v.id }, { silent: true });
      this.rig.jump(v);
      if (v.inside) this.env.inside = 1;
    }
    this.env.setState({ night: s.night, show: s.show, open: this.daylightInside() });
    this.env.apply(1, true);
    this.syncLabelContext();
    this.syncModeControls();
    this.ui.setCredit(s.aerial);
    this.ui.syncAll();
    this.updateUrl();
  }

  // =========================================================================================
  // state
  // =========================================================================================
  set(patch, meta) {
    this.store.set(patch, meta);
  }

  onState(changed, meta) {
    const s = this.s;
    const has = (k) => changed.includes(k);
    this.touch();
    if (has('night') && this.lampPower) this.lampPower.value = Number(s.night);
    if (has('night') || has('show') || has('roofOpen') || has('mode') || has('layers')) {
      this.env.setState({ night: s.night, show: s.show, open: this.daylightInside() });
      this.gfx.setBloom(s.night || s.show, this.scene, this.camera);
    }
    if (['layers', 'telescopic', 'arenaSeats', 'stageKit', 'show', 'roofOpen', 'level', 'levelGhost'].some(has)) this.applyVisibility();
    if (has('telescopic') || has('stageKit')) this.colliderDirty = true;
    if ((has('telescopic') || has('stageKit')) && s.mode === 'walk') this.ensureCollider();
    if (has('labels')) this.labels.setEnabled(s.labels);
    if (has('curtains')) this.applyCurtains();
    if (has('ui') || has('mode')) requestAnimationFrame(() => this.layoutChanged());
    if (has('aerial')) this.applyAerial();
    // the marker shows a seat picked from outside; never the one the viewer sits in
    if (has('seat') || has('picked') || has('mode')) this.highlight(s.mode === 'seat' ? null : s.picked);
    if (has('arenaSeats') && s.mode === 'seat' && s.seat?.tier === 1) this.rig.flyTo(seatPose(s.seat, { standing: !s.arenaSeats }));
    this.syncLabelContext();
    if (!meta?.silent) {
      this.ui.sync(changed);
      this.updateUrl();
    }
  }

  /** True when daylight reaches the hall: roof open or hidden, a section cut, an isolated level. */
  daylightInside() {
    const s = this.s;
    return s.roofOpen || s.layers.roof === false || s.mode === 'section' || s.mode === 'levels';
  }

  syncLabelContext() {
    const s = this.s;
    this.labels.anchorLevels(s.mode === 'section' ? s.sectionAxis : null, s.sectionPos);
    this.labels.setContext({ cut: s.mode === 'section', level: s.level, roofOpen: s.roofOpen || s.layers.roof === false, layers: s.layers, mode: s.mode, stageKit: s.stageKit });
  }

  applyVisibility() {
    this.visibility.apply(this.s);
    if (this.walker.doors) this.walker.doors.enabled = this.s.layers.structure !== false;
    this.renderer.shadowMap.needsUpdate = true;
    this.invalidate();
  }

  setLayer(id, on) {
    this.set({ layers: { ...this.s.layers, [id]: on } });
  }

  /** Acoustic curtains of the hall: drawn (absorbing) or tied back, through arena/hall setCurtains(). */
  applyCurtains() {
    const hall = this.modules.get('arena/hall');
    if (hall?.status !== 'ok' || typeof hall.mod.setCurtains !== 'function') return;
    try {
      hall.mod.setCurtains(hall.group, this.s.curtains ? 'drawn' : 'tied');
    } catch (e) {
      console.warn('[app] setCurtains failed', e);
    }
    this.colliderDirty = true;
    this.invalidate(true);
  }

  /**
   * The aerial-photo ground. site/ground reads ctx.flags.aerial (alias of flags.ortho) at
   * build time and then draws PLATEAU-Ortho tiles instead of the vector ground, so the
   * module is rebuilt when the switch changes (unless it offers a live setter).
   */
  async applyAerial() {
    const s = this.s;
    this.ui.setCredit(s.aerial);
    const ground = this.modules.get('site/ground');
    if (!ground || ground.status !== 'ok') return;
    const mod = ground.mod;
    try {
      if (typeof mod.setAerial === 'function') {
        mod.setAerial(ground.group, s.aerial);
      } else if (typeof mod.setFlag === 'function') {
        mod.setFlag(ground.group, 'aerial', s.aerial);
      } else if (!mod.update || mod.update.length < 2 || !/aerial/.test(String(mod.update))) {
        // the flag is read at build time: rebuild only this module
        const result = await buildModule('site/ground', { quality: s.quality, SPEC, flags: this.moduleFlags() });
        if (result.status === 'ok') {
          this.adoptModule(result);
          if (this.section.active) this.section.enable(true);
          this.applyVisibility();
        }
      }
    } catch (e) {
      console.warn('[app] aerial toggle failed', e);
    }
    this.renderer.shadowMap.needsUpdate = true;
    this.invalidate();
  }

  updateUrl() {
    if (!this.ready && !this.running) return;
    const keep = {};
    const f = this.init.flags;
    for (const k of ['q', 'debug', 'mods', 'dpr']) if (f[k]) keep[k] = f[k];
    if (!this.s.ui) keep.ui = '0';
    // a pose in mid-flight is not worth sharing; the URL is written again on arrival
    this.writeUrl(buildUrl(this.s, this.rig.flying ? null : this.rig.pose(), keep));
  }

  share() {
    const keep = {};
    if (this.init.flags.q) keep.q = this.init.flags.q;
    const url = location.origin + location.pathname + buildUrl(this.s, this.rig.pose(), keep);
    const done = () => this.ui.toast(tr("현재 화면의 링크를 복사했습니다"));
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(done, () => this.ui.toast(url, 6000));
    else this.ui.toast(url, 6000);
  }

  setQuality(q) {
    if (q === this.s.quality) return;
    const query = new URLSearchParams(buildUrl(this.s, this.rig.pose(), {}).slice(1));
    query.set('q', q);
    location.search = query.toString();
  }

  toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }

  // =========================================================================================
  // modes
  // =========================================================================================
  syncModeControls() {
    const s = this.s;
    this.rig.look.allowLock = s.mode === 'walk';
    this.uiRoot.classList.toggle('walking', s.mode === 'walk');
  }

  setMode(mode) {
    const s = this.s;
    if (mode === 'fly') return this.startFlight(s.flightStart);
    if (mode === 'walk' && s.mode === 'walk' && s.fly) return this.startWalk(s.walkStart);
    if (mode === s.mode) {
      if (mode === 'explore') this.goHome();
      return;
    }
    const prev = s.mode;
    // leave
    if (prev === 'walk') {
      this.walker.stop();
      this.rig.look.exitLock();
    }
    if (prev === 'section') this.section.enable(false);
    this.env.forceInside = null;
    const patch = { mode, picked: null, fly: false };
    if (prev === 'levels') patch.level = null;

    // enter
    if (mode === 'explore') {
      patch.view = null;
      this.set(patch);
      if (prev === 'seat' || prev === 'walk') {
        // stay where we are, but orbit around a point ahead
        const p = this.rig.pose();
        this.rig.flyTo({ kind: 'orbit', pos: p.pos, target: p.target, fov: 50 }, { duration: 0.35 });
      }
    } else if (mode === 'seat') {
      const seat = s.seat || resolveSeat(5, 8, 120);
      this.set({ ...patch, seat, view: null });
      this.flySeat(seat);
    } else if (mode === 'walk') {
      this.set({ ...patch, view: null });
      this.enterWalk(s.walkStart);
    } else if (mode === 'section') {
      this.set({ ...patch, view: null });
      this.section.set(s.sectionAxis, s.sectionPos, s.sectionFlip);
      this.section.enable(true);
      this.renderer.shadowMap.needsUpdate = true;
      this.faceSection();
    } else if (mode === 'levels') {
      const level = s.level ?? 3;
      this.set({ ...patch, level, view: null });
      this.rig.flyTo(levelView(level));
    }
    this.syncModeControls();
  }

  goHome() {
    this.goView(HOME_VIEW);
  }

  /** Fly to a preset viewpoint (switches to the explore mode). */
  goView(id, opts) {
    const v = viewById(id);
    if (!v) return Promise.resolve(false);
    if (this.s.mode !== 'explore') {
      const prev = this.s.mode;
      if (prev === 'walk') {
        this.walker.stop();
        this.rig.look.exitLock();
      }
      if (prev === 'section') this.section.enable(false);
      this.set({ mode: 'explore', picked: null, fly: false, level: null, view: id });
      this.syncModeControls();
    } else this.set({ view: id, picked: null });
    this.env.forceInside = v.inside ? 1 : 0;
    return this.rig.flyTo(v, opts).then((ok) => {
      this.env.forceInside = null;
      this.updateUrl();
      return ok;
    });
  }

  // --- seat view ------------------------------------------------------------------------------
  flySeat(seat, opts) {
    this.env.forceInside = 1;
    return this.rig.flyTo(seatPose(seat, { standing: seat.tier === 1 && !this.s.arenaSeats }), opts).then((ok) => {
      this.env.forceInside = null;
      return ok;
    });
  }

  /** Sit in a seat (from any mode). */
  sit(seat, opts) {
    if (!seat) return Promise.resolve(false);
    const s = this.s;
    if (s.mode !== 'seat') {
      if (s.mode === 'walk') {
        this.walker.stop();
        this.rig.look.exitLock();
      }
      if (s.mode === 'section') this.section.enable(false);
      this.set({ mode: 'seat', seat, picked: null, view: null, level: null, fly: false });
      this.syncModeControls();
    } else this.set({ seat, picked: null });
    return this.flySeat(seat, opts);
  }

  sitCurrent() {
    if (this.s.seat) this.sit(this.s.seat);
  }

  /** Choose a seat from loosely given numbers (panel inputs): clamps to what exists. */
  pickSeatLoose(tier, row, num) {
    const cur = this.s.seat;
    if (row === null || row === undefined || !Number.isFinite(row)) {
      // new tier: a central seat about a third of the way up
      const defaults = { 1: [12, 70], 3: [16, 108], 5: [8, 120], 7: [10, 142] };
      [row, num] = defaults[tier] || [1, 1];
    }
    if (!Number.isFinite(num)) num = cur?.num ?? 1;
    const seat = resolveSeat(tier, row, num);
    if (seat) this.sit(seat);
    else this.ui.syncSeat();
  }

  /** Seat of a tier nearest to a plan point (seat-map click). */
  pickSeatNear(x, z, tier) {
    let best = null;
    let bestD = Infinity;
    for (const r of this.rowsNear(tier)) {
      const d = (r.x - x) ** 2 + (r.z - z) ** 2;
      if (d < bestD) {
        bestD = d;
        best = r;
      }
    }
    if (best && bestD < 64) this.sit(findSeat(best.tier, best.row, best.num));
  }

  rowsNear(tier) {
    this._seatIndex ||= new Map();
    if (!this._seatIndex.has(tier)) {
      const list = [];
      // every second seat is plenty for a click on a 280 px map
      let i = 0;
      for (const part of PARTS) {
        if (part.tier !== tier) continue;
        for (const row of part.rows) {
          for (const seg of row.segs) {
            for (let k = 0; k < seg.n; k++) {
              if (i++ % 2) continue;
              const [x, , z] = seatPosition(part, row, seg, k);
              list.push({ tier, row: row.row, num: seg.first + k, x, z });
            }
          }
        }
      }
      this._seatIndex.set(tier, list);
    }
    return this._seatIndex.get(tier);
  }

  stepSeat(dir) {
    const seat = this.s.seat;
    if (!seat) return;
    if (isSpecial(seat)) return void this.ui.toast(tr("이 좌석은 3D 화면에서 직접 선택해 주세요"), 1600);
    const next = adjacentSeat(seat, dir);
    if (next) this.sit(next, { duration: 0.28 });
    else this.ui.toast(dir < 0 ? tr("이 열의 첫 좌석입니다") : tr("이 열의 마지막 좌석입니다"), 1400);
  }

  stepRow(dir) {
    const seat = this.s.seat;
    if (!seat) return;
    if (isSpecial(seat)) return void this.ui.toast(tr("이 좌석은 3D 화면에서 직접 선택해 주세요"), 1600);
    const next = adjacentRow(seat, dir);
    if (next) this.sit(next, { duration: 0.32 });
    else this.ui.toast(dir < 0 ? tr("맨 앞 열입니다") : tr("맨 뒷 열입니다"), 1400);
  }

  lookAtStage() {
    const seat = this.s.seat;
    if (!seat) return;
    const pose = seatPose(seat, { standing: seat.tier === 1 && !this.s.arenaSeats });
    this.rig.flyTo({ ...pose, pos: this.camera.position.toArray() }, { duration: 0.4 });
  }

  /**
   * Is the straight line from the seated eye to the stage front free of the modelled
   * building (parapets, gallery fronts, stand edges)? null when no collision mesh exists.
   * Reference point: stage-front centre, 1 m above the stage deck.
   */
  sightline(seat) {
    if (!this.collider || !seat) return null;
    const standing = seat.tier === 1 && !this.s.arenaSeats;
    const eye = (this._eye ||= new THREE.Vector3()).set(seat.x, seat.y + (standing ? 1.6 : 1.15), seat.z);
    const target = (this._tgt ||= new THREE.Vector3()).set(0, SPEC.stage.height_m + 1.0, 0.3);
    return !this.walker.blocked(eye, target, 0.6);
  }

  clearPick() {
    this.set({ picked: null });
  }

  highlight(seat) {
    const api = this.seatsApi;
    let done = false;
    if (api && typeof api.highlightSeat === 'function' && this.seatsGroup) {
      try {
        api.highlightSeat(this.seatsGroup, seat || null);
        done = true;
      } catch (e) {
        console.warn('[app] highlightSeat failed', e);
      }
    }
    // own marker when the seats module has none
    const showMarker = !!seat && !done;
    this.marker.visible = showMarker;
    if (seat) {
      this.marker.position.set(seat.x, seat.y, seat.z);
      this.marker.rotation.y = seat.rotY;
    }
    this.invalidate();
  }

  // --- walk -----------------------------------------------------------------------------------
  ensureCollider() {
    if (this.collider && !this.colliderDirty) return this.collider;
    const t0 = performance.now();
    const records = this.visibility.records.filter((r) => {
      if (!r.obj.isMesh) return false;
      // static building layers, plus the stage kit (its deck is a walk start point)
      const stageDeck = r.tags.layer === 'stage' && r.tags.stageKit && this.s.stageKit;
      if (!COLLIDER_LAYERS.has(r.tags.layer) && !stageDeck) return false;
      // independent of what is currently shown, except the telescopic state
      if (r.tags.telescopic !== undefined && r.tags.telescopic !== false) {
        const wantsDeployed = r.tags.telescopic !== 'stored';
        if (wantsDeployed !== !!this.s.telescopic) return false;
      }
      if (r.tags.showOnly) return false;
      // what the module itself keeps hidden (night-only lights, the other curtain state) does not collide
      return moduleVisible(r.obj);
    });
    if (this.collider) this.collider.geometry.dispose();
    this.collider = buildCollider(records);
    this.colliderDirty = false;
    this.walker.setCollider(this.collider);
    const ms = Math.round(performance.now() - t0);
    this.colliderInfo = this.collider ? { triangles: this.collider.triangles, ms } : null;
    this.ui.setWalkInfo(this.collider ? tr("충돌 메시 {0} 삼각형", this.collider.triangles.toLocaleString(language)) : tr("충돌 메시가 없어 비행 모드로 이동합니다."));
    return this.collider;
  }

  enterWalk(startId, instant = false) {
    this.outdoorFlight = false;
    this.walker.stop();
    const token = (this._walkToken = Symbol('walk'));
    if (!instant && (!this.collider || this.colliderDirty)) {
      // building the collision mesh takes a moment: say so, then build on the next frame
      this.ui.toast(tr("걷기 준비 중…"), 4000);
      setTimeout(() => {
        if (this._walkToken !== token || this.s.mode !== 'walk') return;
        this.ensureCollider();
        this.ui.toast(tr("WASD로 이동 · 화면을 클릭하면 마우스로 시선 이동"), 3200);
        this.enterWalk(startId);
      }, 60);
      return;
    }
    const start = WALK_STARTS.find((w) => w.id === startId) || WALK_STARTS[0];
    this.ensureCollider();
    const eye = this.walker.start(start.pos, start.face);
    if (!this.collider || !this.walker.grounded) {
      // no floor under the start point (that part of the model is missing): do not fall forever
      this.walker.toggleFly(true);
      this.ui.toast(tr("이 지점의 바닥 모델이 없어 비행 모드로 시작합니다"), 3200);
    }
    const target = [eye.x + start.face[0] * 20, eye.y, eye.z + start.face[1] * 20];
    this.walker.active = false; // hold still during the flight
    this.env.forceInside = start.inside ? 1 : 0;
    const pose = { kind: 'look', pos: eye.toArray(), target, fov: 72 };
    const arrive = () => {
      if (this._walkToken !== token || this.s.mode !== 'walk') return;
      this.env.forceInside = null;
      this.walker.active = true;
      this.walker._face = null;
    };
    if (instant) {
      this.rig.jump(pose);
      arrive();
    } else this.rig.flyTo(pose).then(arrive);
  }

  startWalk(id) {
    if (this.s.mode !== 'walk') {
      this.set({ walkStart: id });
      this.setMode('walk');
    } else {
      this.set({ walkStart: id, fly: false });
      this.enterWalk(id);
    }
  }

  startFlight(id, camera) {
    const start = FLIGHT_STARTS.find(p => p.id === id) || FLIGHT_STARTS[0];
    const pose = { pos: start.pos, target: start.target, fov: 68, ...camera, kind: 'look' };
    this._walkToken = null;
    this.rig.cancelFlight();
    if (this.section.active) this.section.enable(false);
    this.env.forceInside = null;
    this.outdoorFlight = true;
    this.set({ mode: 'walk', fly: true, flightStart: start.id, picked: null, level: null, view: null });
    this.rig.jump(pose);
    this.walker.startFlight(pose.pos);
    this.syncModeControls();
    this.updateUrl();
  }

  setFly(on) {
    this.walker.toggleFly(on);
  }

  setJoystick(x, y) {
    this.walker.joy.set(x, y);
    this.touch();
  }

  // --- section --------------------------------------------------------------------------------
  setSection({ axis, pos, flip }, { live = false } = {}) {
    const s = this.s;
    const patch = {};
    if (axis !== undefined && axis !== s.sectionAxis) {
      patch.sectionAxis = axis;
      patch.sectionPos = SECTION_RANGE[axis].def;
    }
    if (pos !== undefined) patch.sectionPos = clamp(pos, SECTION_RANGE[patch.sectionAxis || s.sectionAxis].min, SECTION_RANGE[patch.sectionAxis || s.sectionAxis].max);
    if (flip !== undefined) patch.sectionFlip = flip;
    this.set(patch);
    this.section.set(this.s.sectionAxis, this.s.sectionPos, this.s.sectionFlip);
    this.labels.anchorLevels(this.s.sectionAxis, this.s.sectionPos);
    this.renderer.shadowMap.needsUpdate = true;
    this.invalidate();
    if (!live && (axis !== undefined || flip !== undefined)) this.faceSection();
  }

  faceSection() {
    const s = this.s;
    this.rig.flyTo(sectionView(s.sectionAxis, s.sectionPos, s.sectionFlip));
  }

  // --- levels ---------------------------------------------------------------------------------
  setLevel(level) {
    if (this.s.mode !== 'levels') {
      this.set({ level });
      this.setMode('levels');
      return;
    }
    this.set({ level });
    this.rig.flyTo(levelView(level));
  }

  // =========================================================================================
  // input
  // =========================================================================================
  touch() {
    this.lastActivity = performance.now();
  }

  invalidate(shadows = false) {
    this.touch();
    this._dirty = true;
    if (shadows) this.renderer.shadowMap.needsUpdate = true;
  }

  bindInput() {
    const dom = this.canvas;
    const wake = () => this.touch();
    for (const ev of ['pointerdown', 'pointermove', 'wheel', 'keydown', 'touchstart']) addEventListener(ev, wake, { passive: true, capture: true });
    addEventListener('resize', () => this.resize());
    if (window.ResizeObserver) {
      new ResizeObserver(() => this.resize()).observe(dom);
      new ResizeObserver(() => this.layoutChanged()).observe(this.ui.refs.panel);
    }

    this.rig.onUserMove = (phase) => {
      if (this.s.view && this.s.mode === 'explore') this.set({ view: null });
      if (phase === 'end') this.updateUrl();
    };
    this.rig.onArrive = () => this.updateUrl();
    this.rig.look.onLockChange = (locked) => this.set({ locked });
    this.walker.onFlyChange = fly => {
      if (!fly && this.outdoorFlight) this.startWalk(this.s.walkStart);
      else this.set({ fly });
    };

    // click (not drag) on the canvas: pick a seat / lock the pointer in walk mode
    let down = null;
    dom.addEventListener('pointerdown', (e) => {
      down = { x: e.clientX, y: e.clientY, t: performance.now(), type: e.pointerType, button: e.button };
      if (this.rig.flying && e.isPrimary) this.rig.cancelFlight();
    });
    dom.addEventListener('pointerup', (e) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      const quick = performance.now() - down.t < 450;
      const d = down;
      down = null;
      if (moved > 5 || !quick || d.button !== 0) return;
      this.onCanvasClick(e, d.type);
    });
    addEventListener('keydown', (e) => this.onKey(e));
  }

  onCanvasClick(e, pointerType) {
    const s = this.s;
    if (s.mode === 'walk') {
      if (pointerType === 'mouse') this.rig.look.requestLock();
      return;
    }
    if (s.mode !== 'explore' && s.mode !== 'seat') return;
    // seats are only pickable when they can plausibly be seen
    const open = this.env.inside > 0.5 || s.roofOpen || s.layers.roof === false;
    if (!open) return;
    const seat = pickSeat(e.clientX, e.clientY, this.canvas, this.camera, this.visibility.seatMeshes(), this.seatsApi?.seatFromInstance);
    if (!seat) {
      if (s.picked) this.set({ picked: null });
      return;
    }
    if (s.mode === 'seat') this.sit(seat);
    else this.set({ picked: seat });
  }

  walkDoorTarget() {
    if (this.s.mode !== 'walk' || !this.walker.active || this.walker.fly || !this.s.ui || this.ui.dialogOpen) return null;
    const direction = (this._interactionDirection ||= new THREE.Vector3());
    return this.walker.doors?.target(this.camera.position, this.rig.look.getDirection(direction)) ?? null;
  }

  interact() {
    const door = this.walkDoorTarget();
    if (!door) return;
    this.walker.doors.toggle(door);
    this.touch();
  }

  onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName || '')) return;
    const s = this.s;
    const key = e.key;
    if (key === 'Escape') {
      if (this.ui.dialogOpen) this.ui.closeDialog();
      else if (!s.ui) this.set({ ui: true });
      else if (s.picked) this.clearPick();
      else if (s.mode !== 'explore' && !s.locked) this.setMode('explore');
      return;
    }
    if (this.ui.dialogOpen) return;
    if (s.mode === 'walk') {
      if (e.code === 'KeyE' && !this.walker.fly) {
        if (!e.repeat && !e.isComposing && !e.target?.isContentEditable) this.interact();
        return;
      }
      // movement keys belong to the walker; only a few global toggles stay
      if (/^(Key[WASDQEFC]|Arrow.*|Space|Shift.*)$/.test(e.code)) return;
    }
    if (s.mode === 'seat') {
      if (key === 'ArrowLeft') return void (e.preventDefault(), this.stepSeat(-1));
      if (key === 'ArrowRight') return void (e.preventDefault(), this.stepSeat(1));
      if (key === 'ArrowUp') return void (e.preventDefault(), this.stepRow(-1));
      if (key === 'ArrowDown') return void (e.preventDefault(), this.stepRow(1));
    }
    const k = key.toLowerCase();
    const preset = VIEWS.find((v) => v.key === key);
    if (preset && s.mode !== 'walk') return void this.goView(preset.id);
    switch (k) {
      case 'h':
        this.goHome();
        break;
      case 'n':
        this.set({ night: !s.night });
        break;
      case 'b':
        this.set({ show: !s.show });
        break;
      case 'l':
        this.set({ labels: !s.labels });
        break;
      case 'r':
        this.set({ roofOpen: !s.roofOpen });
        break;
      case 't':
        this.set({ telescopic: !s.telescopic });
        break;
      case 'g':
        this.setMode(s.mode === 'walk' ? 'explore' : 'walk');
        break;
      case 'c':
        if (s.mode !== 'walk') this.setMode(s.mode === 'section' ? 'explore' : 'section');
        break;
      case 'v':
        this.setMode(s.mode === 'seat' ? 'explore' : 'seat');
        break;
      case 'u':
        this.set({ ui: !s.ui });
        break;
      case 'k':
        this.set({ curtains: !s.curtains });
        break;
      case '?':
        this.ui.openDialog('help');
        break;
      default:
    }
  }

  resize() {
    if (!this.gfx) return;
    if (this.gfx.resize()) {
      this.rig.setAspect(this.gfx.width / this.gfx.height);
      this.layoutChanged();
    }
  }

  /**
   * Keep the picture centred in the part of the window that the panel leaves free: the
   * panel covers the left side (desktop) or the bottom (phone), so the camera's principal
   * point is shifted by half of that.
   */
  layoutChanged() {
    if (!this.gfx || !this.ui) return;
    const w = this.gfx.width;
    const h = this.gfx.height;
    let ox = 0;
    let oy = 0;
    const panel = this.ui.refs.panel;
    const open = this.s.ui && !this.uiRoot.classList.contains('panel-closed');
    if (open && panel) {
      const r = panel.getBoundingClientRect();
      if (r.width > w * 0.9) oy = Math.max(0, h - r.top) / 2;
      else ox = r.right / 2;
    }
    const key = `${w}|${h}|${Math.round(ox)}|${Math.round(oy)}`;
    if (key !== this._layoutKey) {
      this._layoutKey = key;
      if (ox || oy) this.camera.setViewOffset(w, h, -Math.round(ox), Math.round(oy), w, h);
      else this.camera.clearViewOffset();
    }
    this.labels.dirty = true;
    this.invalidate();
  }

  onVisibility() {
    if (document.hidden) {
      this.running = false;
      cancelAnimationFrame(this._raf);
    } else if (!this.running) {
      this.running = true;
      this.timer.reset?.();
      this.touch();
      this._raf = requestAnimationFrame((t) => this.frame(t));
    }
  }

  // =========================================================================================
  // frame
  // =========================================================================================
  frame(t) {
    if (!this.running) return;
    this._raf = requestAnimationFrame((tt) => this.frame(tt));
    const s = this.s;
    const now = performance.now();
    // idle throttle: full rate while something happens, otherwise about 15 fps
    const busy = this.rig.flying || s.show || (s.mode === 'walk' && this.walker.active) || now - this.lastActivity < 3500 || !this.ready || this._dirty;
    if (!busy && now - this.lastRender < 62) return;
    this.timer.update(t);
    const dt = Math.min(this.timer.getDelta(), 0.1);
    this.lastRender = now;
    this._dirty = false;
    this.time += dt;

    this.resize();
    if (s.mode === 'walk') {
      const wasMoving = this.walker.moving;
      const moved = this.walker.update(dt);
      if (s.fly && wasMoving && !moved) this.updateUrl();
    }
    const camMoved = this.rig.update(dt);
    const feet = this.walker.active && !this.walker.fly ? this.walker.pos : null;
    if (this.walker.doors?.update(dt, feet, WALK_RADIUS)) this.renderer.shadowMap.needsUpdate = true;
    this.ui.setDoorPrompt(this.walkDoorTarget());
    if (camMoved) this.touch();
    const blending = this.env.update(dt, this.camera);
    if (blending) this.touch();
    if (this.env.shadowDirty) {
      this.env.shadowDirty = false;
      this.renderer.shadowMap.needsUpdate = true;
    }

    // module animation hooks
    if (this.updaters.length) {
      const state = (this._modState ||= {});
      state.time = this.time;
      state.night = s.night;
      state.show = s.show;
      state.quality = s.quality;
      state.telescopic = s.telescopic;
      state.arenaSeats = s.arenaSeats;
      state.stageKit = s.stageKit;
      state.aerial = s.aerial;
      state.camera = this.camera;
      for (const u of this.updaters) {
        if (u.errors > 2) continue;
        try {
          u.fn(u.group, state, dt);
        } catch (e) {
          if (++u.errors > 2) console.error(`[app] update() of ${u.id} disabled after repeated errors`, e);
        }
      }
    }

    if (camMoved || this.labels.dirty || this._insidePrev !== this.env.inside > 0.5) {
      this._insidePrev = this.env.inside > 0.5;
      this.labels.setContext({ inside: this.env.inside });
      this.camera.updateMatrixWorld(); // projection below must use this frame's pose
      this.labels.update(this.gfx.width, this.gfx.height);
      const f = this.camera.getWorldDirection((this._fwd ||= new THREE.Vector3()));
      // looking straight down, use the camera's up direction instead
      if (Math.hypot(f.x, f.z) < 0.05) f.set(0, 1, 0).applyQuaternion(this.camera.quaternion);
      this.ui.setCompass(f.x, f.z);
    }

    this.gfx.render(this.scene, this.camera);
    this.gfx.adapt(dt);
    this.frameMs = this.frameMs ? this.frameMs * 0.9 + dt * 100 : dt * 1000;

    this.frameCount++;
    if (!this.ready) this.checkFirstFrames(now);
  }

  /**
   * "Ready" means the first frames are really on screen: after the third rendered frame a
   * GPU fence is set and polled, so shader compilation and the first shadow pass have
   * finished on the GPU before the loading screen fades (with a time limit as a fallback).
   */
  checkFirstFrames(now) {
    if (this.frameCount < 3) return;
    const gl = this.renderer.getContext();
    if (this._fence === undefined) {
      this._fenceT = now;
      this._fence = null;
      try {
        this._fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
      } catch {}
      if (this._fence) return;
    }
    let done = !this._fence || now - this._fenceT > 8000;
    if (!done) {
      const r = gl.clientWaitSync(this._fence, 0, 0);
      done = r === gl.ALREADY_SIGNALED || r === gl.CONDITION_SATISFIED || r === gl.WAIT_FAILED;
    }
    if (!done) return;
    if (this._fence) gl.deleteSync(this._fence);
    this._fence = null;
    this.onFirstFrames();
  }

  /** Rendering statistics (for tests and the console). */
  perf() {
    const r = this.renderer.info;
    return {
      frameMs: +(this.frameMs || 0).toFixed(1),
      fps: this.frameMs ? Math.round(1000 / this.frameMs) : 0,
      pixelRatio: +this.gfx.pixelRatio.toFixed(2),
      drawCalls: r.render.calls,
      triangles: r.render.triangles,
      geometries: r.memory.geometries,
      textures: r.memory.textures,
      collider: this.colliderInfo || null,
    };
  }

  onFirstFrames() {
    const info = { modules: {}, triangles: 0, drawCalls: this.renderer.info.render.calls, renderedTriangles: this.renderer.info.render.triangles, failed: [], missing: [] };
    for (const m of this.modules.values()) {
      info.modules[m.id] = { status: m.status, meshes: m.meshes, triangles: m.triangles, buildMs: m.buildMs, error: m.error ? String(m.error.message || m.error) : undefined };
      info.triangles += m.triangles;
      if (m.status === 'failed') info.failed.push(m.id);
      if (m.status === 'missing') info.missing.push(m.id);
    }
    info.expected = MODULES.map((m) => m.id);
    info.quality = this.s.quality;
    info.pixelRatio = this.gfx.pixelRatio;
    window.__info = info;
    window.__ready = true;
    this.ready = true;
    this.loading.querySelector('#loading-bar').style.width = '100%';
    this.loading.classList.add('done');
    if (this.s.ui && !preference('guide-seen')) openGuide(false, this.ui.root.dataset.mode);
    setTimeout(() => this.loading.remove(), 900);
    this.updateUrl();
  }
}

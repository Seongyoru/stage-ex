import { language, languageSelect, tr } from './i18n.js';
import { openGuide } from './guide.js';
import { buildUrl } from './urlstate.js';
import { scheduleBanner } from './schedule.js';
// The Korean user interface: top bar with mode tabs, the control panel, the bottom
// readout (HUD), dialogs, toast, compass and the touch joystick. Plain DOM, no framework.
import { NORTH_XZ } from '../core/frame.js';
import { PARTS, uvToWorld } from '../core/seating.js';
import { h, append, clear, icon, fmt } from './dom.js';
import { factsContent, aboutContent, helpContent } from './info.js';
import { TIERS, TIER_INFO, rowsOf, seatNumbers, seatMetrics, nearestGate, seatKindKo, seatTitle, tierKo, isSpecial } from './seats.js';
import { VIEWS, WALK_STARTS, FLIGHT_STARTS, LEVEL_INFO, SECTION_RANGE } from './views.js';

const MODES = [
  { id: 'explore', ko: tr("둘러보기") },
  { id: 'seat', ko: tr("좌석 시야") },
  { id: 'walk', ko: tr("걷기") },
  { id: 'fly', ko: tr('날기') },
  { id: 'section', ko: tr("단면") },
  { id: 'levels', ko: tr("층별") },
];

const TIER_COLOR = { 1: '#8794a8', 3: '#5b8fd6', 5: '#4fb39a', 7: '#b48ad8' };

function switchRow(label, checked, onChange, hint) {
  const input = h('input', { type: 'checkbox', role: 'switch' });
  input.checked = !!checked;
  input.addEventListener('change', () => onChange(input.checked));
  const row = h('label', { class: 'sw' }, h('span', { class: 'sw-text' }, label, hint ? h('small', null, hint) : null), input, h('i', { 'aria-hidden': 'true' }));
  row.input = input;
  return row;
}

function segmented(options, value, onChange, cls = '') {
  const el = h('div', { class: `seg ${cls}`, role: 'group' });
  const buttons = options.map((o) => {
    const b = h('button', { type: 'button', title: o.title || null }, o.label);
    b.addEventListener('click', () => onChange(o.value));
    el.append(b);
    return [o.value, b];
  });
  el.setValue = (v) => {
    for (const [val, b] of buttons) {
      b.classList.toggle('on', val === v);
      b.setAttribute('aria-pressed', String(val === v));
    }
  };
  el.setValue(value);
  return el;
}

function stepper(label, onStep, onSet) {
  const input = h('input', { type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-label': label });
  input.addEventListener('change', () => onSet(Number(input.value)));
  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') input.blur();
  });
  const el = h(
    'div',
    { class: 'stepper' },
    h('span', { class: 'stepper-label' }, label),
    h('button', { type: 'button', 'aria-label': tr("{0} 이전", label), onClick: () => onStep(-1) }, icon('chevLeft', 16)),
    input,
    h('button', { type: 'button', 'aria-label': tr("{0} 다음", label), onClick: () => onStep(1) }, icon('chevRight', 16)),
  );
  el.input = input;
  return el;
}

export class UI {
  /**
   * @param {HTMLElement} root
   * @param {object} app  the App (state store + actions)
   */
  constructor(root, app) {
    this.root = root;
    this.app = app;
    this.refs = {};
    this.build();
  }

  get s() {
    return this.app.store.state;
  }

  build() {
    const app = this.app;
    const r = this.refs;
    const narrow = matchMedia('(max-width: 760px)').matches;

    // --- top bar ------------------------------------------------------------------------
    r.tabs = h(
      'nav',
      { class: 'tabs', 'aria-label': tr("모드") },
      MODES.map((m) => {
        const b = h('button', { type: 'button', dataset: { mode: m.id } }, icon(m.id, 16), h('span', null, m.ko));
        b.addEventListener('click', () => app.setMode(m.id));
        return b;
      }),
    );
    const tool = (name, label, fn) => h('button', { type: 'button', class: 'tool', title: label, 'aria-label': label, onClick: fn }, icon(name));
    r.panelToggle = h('button', {
      type: 'button', class: 'tool menu-btn', title: tr("패널 열기 / 닫기"), 'aria-label': tr("패널 열기 / 닫기"),
      'aria-controls': 'viewer-controls', 'aria-expanded': String(!narrow), onClick: () => this.togglePanel(),
    }, icon('panel'));
    r.topbar = h(
      'header',
      { class: 'topbar' },
      r.panelToggle,
      h('a', { class: 'venues-home', href: '?lang=' + language, title: tr('공연장 목록'), 'aria-label': tr('공연장 목록') }, 'Stage ', h('i', null, 'EX')),
      h('button', { type: 'button', class: 'brand', onClick: () => app.goHome(), title: tr("전경으로") }, h('b', null, 'K-Arena Yokohama')),
      r.tabs,
      h(
        'div',
        { class: 'tools' },
        tool('info', tr("시설 개요"), () => this.openDialog('facts')),
        tool('book', tr("출처 · 안내"), () => this.openDialog('about')),
        tool('share', tr("현재 화면 링크 복사"), () => app.share()),
        tool('help', tr("조작법 · 단축키"), () => this.openDialog('help')),
        tool('full', tr("전체 화면"), () => app.toggleFullscreen()),
        languageSelect(code => {
          const params = new URLSearchParams(buildUrl(app.s, app.rig.pose(), { q: app.s.quality, lang: code }));
          location.search = params.toString();
        }),
      ),
    );

    // --- panes --------------------------------------------------------------------------
    r.panes = {
      explore: this.buildExplore(),
      seat: this.buildSeat(),
      walk: this.buildWalk(),
      fly: this.buildFlight(),
      section: this.buildSection(),
      levels: this.buildLevels(),
    };
    r.scene = this.buildScene();
    r.layers = h('div', { class: 'layer-list' });
    r.status = h('div', { class: 'status' });
    r.panel = h(
      'aside',
      { class: 'panel', id: 'viewer-controls', 'aria-label': tr("조작 패널") },
      h('div', { class: 'panel-scroll' }, Object.values(r.panes), r.scene,
        h('details', { class: 'group' }, h('summary', null, icon('levels', 16), tr("표시 레이어")), r.layers), r.status),
    );
    r.panel.inert = narrow;
    if (narrow) this.root.classList.add('panel-closed');

    // --- HUD, toast, compass, joystick ----------------------------------------------------
    r.hud = h('div', { class: 'hud', 'aria-live': 'polite' });
    r.toast = h('div', { class: 'toast', role: 'status' });
    r.needle = h('div', { class: 'needle' }, h('b', null, 'N'));
    r.compass = h('button', { type: 'button', class: 'compass', title: tr("북쪽 방향 · 눌러서 전경으로"), onClick: () => app.goHome() }, r.needle);
    r.joy = this.buildJoystick();
    r.restore = h('button', { type: 'button', class: 'restore', title: tr("UI 표시 (U)"), onClick: () => app.set({ ui: true }) }, icon('eye'));
    r.credit = h('button', { type: 'button', class: 'credit', title: tr("출처 · 안내"), onClick: () => this.openDialog('about') });
    r.dialog = this.buildDialog();

    this.root.append(r.topbar, r.panel, r.hud, r.credit, r.compass, r.joy, this.buildLiftControls(), r.toast, r.restore, r.dialog);
    const schedule = scheduleBanner(true);
    const mobile = matchMedia('(max-width: 760px)');
    const placeSchedule = () => {
      schedule.open = false;
      if (mobile.matches) r.panel.querySelector('.panel-scroll').prepend(schedule);
      else this.root.append(schedule);
    };
    placeSchedule();
    mobile.addEventListener('change', placeSchedule);
    this.setCredit(false);
    this.syncAll();
  }

  // --- explore pane -----------------------------------------------------------------------
  buildExplore() {
    const r = this.refs;
    r.viewButtons = new Map();
    r.viewGroups = {};
    const cards = h('div', { class: 'view-cards', role: 'group', 'aria-label': tr('시점 선택') });
    const pane = h('section', { class: 'pane', dataset: { pane: 'explore' } },
      h('h2', null, tr('시점 선택')), cards);
    for (const [id, label, image, featured] of [
      ['out', '외부 시점', 'control-exterior', ['overview', 'front', 'aerial']],
      ['in', '내부 시점', 'control-interior', ['upper', 'stage', 'arena']],
    ]) {
      const views = VIEWS.filter(view => view.group === id);
      const card = h('button', { type: 'button', class: 'view-card', 'aria-controls': 'views-' + id,
        onClick: () => this.showViewGroup(id) },
        h('img', { src: './venues/' + image + '.webp', alt: '', width: 300, height: 160 }),
        h('span', null, tr(label)), icon('check', 14));
      const makeRow = view => {
        const b = h('button', { type: 'button', class: 'view-row', onClick: () => this.app.goView(view.id) },
          h('span', { class: 'view-dot', 'aria-hidden': 'true' }), h('span', null, view.ko),
          view.key ? h('kbd', null, view.key) : null);
        r.viewButtons.set(view.id, b);
        return b;
      };
      const extra = h('details', { class: 'more-views' },
        h('summary', null, tr('다른 시점'), h('span', { class: 'view-count' }, String(views.length - featured.length)), icon('chevDown', 14)),
        views.filter(v => !featured.includes(v.id)).map(makeRow));
      const list = h('div', { id: 'views-' + id, class: 'view-list' },
        views.filter(v => featured.includes(v.id)).map(makeRow), extra);
      cards.append(card);
      pane.append(list);
      r.viewGroups[id] = { card, list, extra };
    }
    this.showViewGroup('out');
    return pane;
  }

  showViewGroup(group) {
    for (const [id, { card, list }] of Object.entries(this.refs.viewGroups)) {
      card.setAttribute('aria-pressed', String(id === group));
      list.hidden = id !== group;
    }
  }

  // --- seat pane --------------------------------------------------------------------------
  buildSeat() {
    const app = this.app;
    const r = this.refs;
    r.tierSeg = segmented(
      TIERS.map((t) => ({ value: t, label: h('span', null, h('b', null, `LEVEL ${t}`), h('small', null, TIER_INFO[t].name)) })),
      5,
      (t) => app.pickSeatLoose(t, null, null),
      'tiers',
    );
    r.rowStep = stepper(tr("열"), (d) => app.stepRow(d), (v) => app.pickSeatLoose(this.seatDraft().tier, v, this.seatDraft().num));
    r.numStep = stepper(tr("번"), (d) => app.stepSeat(d), (v) => app.pickSeatLoose(this.seatDraft().tier, this.seatDraft().row, v));
    r.seatRange = h('p', { class: 'hint tight' });
    r.map = h('canvas', { class: 'seatmap', width: 560, height: 400, title: tr("좌석 배치도 — 눌러서 좌석 선택") });
    r.map.addEventListener('click', (e) => this.onMapClick(e));
    r.sitBtn = h('button', { type: 'button', class: 'primary', onClick: () => app.sitCurrent() }, tr("이 좌석에서 보기"));
    return h(
      'section',
      { class: 'pane', dataset: { pane: 'seat' } },
      h('h2', null, tr("좌석 선택")),
      r.tierSeg,
      h('div', { class: 'row2' }, r.rowStep, r.numStep),
      r.seatRange,
      h('div', { class: 'seatmap-wrap' }, r.map, h('span', { class: 'seatmap-stage' }, tr("무대"))),
      h('p', { class: 'hint' }, tr("배치도나 3D 화면의 좌석을 눌러도 선택됩니다. 좌석 번호는 공식 좌석도(LEVEL / 列 / 番)와 같습니다.")),
    );
  }

  /** The numbered seat the panel edits (a VIP / companion seat falls back to a default). */
  seatDraft() {
    const seat = this.s.seat;
    return seat && !isSpecial(seat) ? seat : { tier: seat ? 0 : 5, row: 8, num: 120 };
  }

  /** Plan of all seat rows on a 2D canvas; the selected tier is bright, the seat is marked. */
  drawSeatMap() {
    const cv = this.refs.map;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const seat = this.s.seat;
    const tier = seat ? (seat.tier === 6 ? 5 : seat.tier) : 5;
    const W = cv.width;
    const H = cv.height;
    // world window: x −74..74, z −16..96  (stage at the top)
    const sx = W / 150;
    const sz = H / 112;
    const k = Math.min(sx, sz);
    const ox = W / 2;
    const oz = 18 * k + (H - 112 * k) / 2;
    this._map = { k, ox, oz };
    const X = (x) => ox + x * k;
    const Y = (z) => oz + z * k;
    ctx.clearRect(0, 0, W, H);
    // stage
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(X(-10.9), Y(-12.7), 21.8 * k, 12.7 * k);
    ctx.fillRect(X(-25.45), Y(-5.5), 50.9 * k, 5.5 * k);
    ctx.lineCap = 'butt';
    for (const pass of [0, 1]) {
      for (const part of PARTS) {
        const sel = part.tier === tier;
        if ((pass === 1) !== sel) continue;
        ctx.strokeStyle = TIER_COLOR[part.tier];
        ctx.globalAlpha = sel ? 0.95 : 0.2;
        ctx.lineWidth = sel ? 1.5 : 1.1;
        ctx.beginPath();
        for (const row of part.rows) {
          for (const seg of row.segs) {
            const a = uvToWorld(part.facet, seg.u0, row.v);
            const b = uvToWorld(part.facet, seg.u1, row.v);
            ctx.moveTo(X(a[0]), Y(a[1]));
            ctx.lineTo(X(b[0]), Y(b[1]));
          }
        }
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    if (seat) {
      ctx.fillStyle = '#ffc04d';
      ctx.strokeStyle = '#0b0d11';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(X(seat.x), Y(seat.z), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  onMapClick(e) {
    const cv = this.refs.map;
    const rect = cv.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * cv.width;
    const py = ((e.clientY - rect.top) / rect.height) * cv.height;
    const { k, ox, oz } = this._map;
    this.app.pickSeatNear((px - ox) / k, (py - oz) / k, this.seatDraft().tier || 5);
  }

  // --- walk pane --------------------------------------------------------------------------
  buildWalk() {
    const app = this.app;
    const r = this.refs;
    r.walkButtons = new Map();
    r.flySwitch = switchRow(tr("비행 모드"), false, (on) => app.setFly(on), tr("벽을 통과해 자유롭게 이동 (F)"));
    r.walkInfo = h('p', { class: 'hint tight' });
    return h(
      'section',
      { class: 'pane', dataset: { pane: 'walk' } },
      h('h2', null, tr("출발 지점")),
      h(
        'div',
        { class: 'list' },
        WALK_STARTS.map((w) => {
          const b = h('button', { type: 'button', class: 'list-item', onClick: () => app.startWalk(w.id) }, w.ko);
          r.walkButtons.set(w.id, b);
          return b;
        }),
      ),
      r.flySwitch,
      h('p', { class: 'hint' }, tr('3층 입구 문을 바라보고 E를 누르세요. 터치 화면에서는 문 열기 안내를 누르세요.')),
      h('p', { class: 'hint' }, h('b', null, 'W A S D'), tr(" 이동 · "), h('b', null, 'Shift'), tr(" 달리기 · "), h('b', null, 'Space'), tr(" 점프. 화면을 클릭하면 마우스로 시선을 움직입니다. 터치 기기에서는 왼쪽 아래 조이스틱을 사용하세요.")),
      r.walkInfo,
    );
  }

  // --- section pane -----------------------------------------------------------------------
  buildFlight() {
    this.refs.flightButtons = new Map();
    return h('section', { class: 'pane', dataset: { pane: 'fly' } },
      h('h2', null, tr('비행 출발점')),
      h('div', { class: 'list' }, FLIGHT_STARTS.map(start => {
        const button = h('button', { type: 'button', class: 'list-item', onClick: () => this.app.startFlight(start.id) }, tr(start.label));
        this.refs.flightButtons.set(start.id, button);
        return button;
      })),
      h('p', { class: 'hint' }, tr('하늘에서 공연장과 광장을 자유롭게 둘러보세요.')));
  }

  buildLiftControls() {
    const make = (dir, label) => {
      const b = h('button', { type: 'button', 'aria-label': tr(label), title: tr(label) }, icon(dir > 0 ? 'chevUp' : 'chevDown'));
      b.addEventListener('pointerdown', e => {
        b.setPointerCapture(e.pointerId);
        this.app.walker.lift = dir;
      });
      const release = () => { if (this.app.walker.lift === dir) this.app.walker.lift = 0; };
      b.addEventListener('lostpointercapture', release);
      b.addEventListener('click', e => { if (e.detail === 0) this.app.walker.pos.y += dir; });
      return b;
    };
    return h('div', { class: 'flight-lift' }, make(1, '상승'), make(-1, '하강'));
  }

  buildSection() {
    const app = this.app;
    const r = this.refs;
    r.axisSeg = segmented(
      [
        { value: 'x', label: tr("종단면"), title: tr("홀 축 방향으로 자르기") },
        { value: 'z', label: tr("횡단면"), title: tr("홀 축에 직각으로 자르기") },
        { value: 'y', label: tr("평면"), title: tr("수평으로 자르기") },
      ],
      'x',
      (axis) => app.setSection({ axis }),
    );
    r.secRange = h('input', { type: 'range', class: 'range', 'aria-label': tr("절단 위치") });
    r.secRange.addEventListener('input', () => app.setSection({ pos: Number(r.secRange.value) }, { live: true }));
    r.secValue = h('output', { class: 'range-value' });
    r.flipSwitch = switchRow(tr("반대쪽 보기"), false, (on) => app.setSection({ flip: on }));
    return h(
      'section',
      { class: 'pane', dataset: { pane: 'section' } },
      h('h2', null, tr("절단면")),
      r.axisSeg,
      h('div', { class: 'range-row' }, r.secRange, r.secValue),
      r.flipSwitch,
      h('button', { type: 'button', class: 'ghost-btn', onClick: () => app.faceSection() }, tr("절단면 정면에서 보기")),
      h('p', { class: 'hint' }, tr("절단면을 움직이며 스탠드 단면, 층 구성, 지붕 트러스를 확인할 수 있습니다. 햇빛은 잘린 면 안으로 들어옵니다.")),
    );
  }

  // --- levels pane ------------------------------------------------------------------------
  buildLevels() {
    const app = this.app;
    const r = this.refs;
    r.levelButtons = new Map();
    r.ghostSwitch = switchRow(tr("다른 층을 반투명으로"), true, (on) => app.set({ levelGhost: on }), tr("끄면 완전히 숨깁니다"));
    return h(
      'section',
      { class: 'pane', dataset: { pane: 'levels' } },
      h('h2', null, tr("층 선택")),
      h(
        'div',
        { class: 'list levels' },
        [...LEVEL_INFO].reverse().map((l) => {
          const b = h('button', { type: 'button', class: `list-item${l.pub ? '' : ' dim'}`, onClick: () => app.setLevel(l.level) }, h('b', null, `LEVEL ${l.level}`), h('span', { class: 'elev' }, `+${fmt(l.y, 2)} m`), h('small', null, l.ko));
          r.levelButtons.set(l.level, b);
          return b;
        }),
      ),
      r.ghostSwitch,
    );
  }

  // --- scene toggles ----------------------------------------------------------------------
  buildScene() {
    const app = this.app;
    const r = this.refs;
    r.daySeg = segmented(
      [
        { value: false, label: h('span', null, icon('sun', 15), tr(" 낮")) },
        { value: true, label: h('span', null, icon('moon', 15), tr(" 밤")) },
      ],
      false,
      (night) => app.set({ night }),
    );
    r.sw = {
      show: switchRow(tr("공연 조명"), false, (on) => app.set({ show: on }), tr("객석등을 내리고 쇼 조명을 켭니다")),
      telescopic: switchRow(tr("가동식 스탠드 펼침"), true, (on) => app.set({ telescopic: on }), tr("LOWER STAND 1–11열 (끄면 수납)")),
      arenaSeats: switchRow(tr("아레나 좌석"), true, (on) => app.set({ arenaSeats: on }), tr("끄면 스탠딩 구성")),
      stageKit: switchRow(tr("무대 · 연출 기재"), true, (on) => app.set({ stageKit: on })),
      curtains: switchRow(tr("음향 커튼 닫기"), true, (on) => app.set({ curtains: on }), tr("끄면 커튼을 묶어 반사벽을 드러냅니다")),
      roofOpen: switchRow(tr("지붕 열기"), false, (on) => app.set({ roofOpen: on })),
      labels: switchRow(tr("라벨"), true, (on) => app.set({ labels: on })),
      aerial: switchRow(tr("항공사진 지면"), false, (on) => app.set({ aerial: on }), tr("PLATEAU-Ortho 타일을 MLIT 서버에서 불러옵니다")),
    };
    r.qualitySeg = segmented(
      [
        { value: 'high', label: tr("높음") },
        { value: 'low', label: tr("낮음") },
      ],
      'high',
      (q) => app.setQuality(q),
    );
    const sw = r.sw;
    return h('div', { class: 'scene' },
      h('div', { class: 'time-row' }, h('span', null, tr('시간대')), r.daySeg),
      h('details', { class: 'group' }, h('summary', null, icon('settings', 16), tr('장면 설정')),
        sw.show, sw.telescopic, sw.arenaSeats, sw.stageKit, sw.curtains, sw.roofOpen, sw.labels, sw.aerial,
        h('div', { class: 'inline' }, h('span', null, tr("품질")), r.qualitySeg)));
  }

  buildLayerList() {
    const app = this.app;
    const list = this.refs.layers;
    clear(list);
    this.refs.layerInputs = new Map();
    for (const l of app.visibility.layerList()) {
      const input = h('input', { type: 'checkbox' });
      input.checked = this.s.layers[l.id] !== false;
      input.addEventListener('change', () => app.setLayer(l.id, input.checked));
      this.refs.layerInputs.set(l.id, input);
      list.append(h('label', { class: 'check' }, input, h('i', { 'aria-hidden': 'true' }), h('span', null, l.ko)));
    }
    if (!list.firstChild) list.append(h('p', { class: 'hint' }, tr("불러온 모델이 없습니다.")));
  }

  // --- joystick (touch) -------------------------------------------------------------------
  buildJoystick() {
    const knob = h('i');
    const el = h('div', { class: 'joystick', 'aria-hidden': 'true' }, knob);
    let id = null;
    const set = (e) => {
      const rect = el.getBoundingClientRect();
      const R = rect.width / 2;
      let x = (e.clientX - rect.left - R) / R;
      let y = (e.clientY - rect.top - R) / R;
      const l = Math.hypot(x, y);
      if (l > 1) {
        x /= l;
        y /= l;
      }
      knob.style.transform = `translate(${x * R * 0.55}px, ${y * R * 0.55}px)`;
      this.app.setJoystick(x, -y);
    };
    const end = () => {
      id = null;
      knob.style.transform = '';
      this.app.setJoystick(0, 0);
    };
    el.addEventListener('pointerdown', (e) => {
      id = e.pointerId;
      el.setPointerCapture(id);
      set(e);
      e.preventDefault();
    });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerId === id) set(e);
    });
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    return el;
  }

  // --- dialog -----------------------------------------------------------------------------
  buildDialog() {
    const r = this.refs;
    r.dialogTitle = h('h2', null, '');
    r.dialogBody = h('div', { class: 'dialog-body' });
    const close = () => this.closeDialog();
    const box = h('div', { class: 'dialog-box', role: 'dialog', 'aria-modal': 'true' }, h('header', null, r.dialogTitle, h('button', { type: 'button', class: 'tool', 'aria-label': tr("닫기"), onClick: close }, icon('close'))), r.dialogBody);
    const el = h('div', { class: 'dialog', hidden: true }, box);
    el.addEventListener('pointerdown', (e) => {
      if (e.target === el) close();
    });
    return el;
  }

  openDialog(name) {
    const r = this.refs;
    const app = this.app;
    const map = {
      facts: [tr("시설 개요"), () => factsContent()],
      about: [tr("출처 · 안내"), () => aboutContent(app.attribution, app.failedModules())],
      help: [tr("조작법 · 단축키"), () => helpContent()],
    };
    const [title, make] = map[name] || map.facts;
    r.dialogTitle.textContent = title;
    clear(r.dialogBody).append(make());
    if (name === 'help') r.dialogBody.prepend(h('button', {
      type: 'button', class: 'ghost-btn', onClick: () => { this.closeDialog(); openGuide(false, this.root.dataset.mode); },
    }, tr('조작 안내 다시 보기')));
    r.dialog.hidden = false;
    r.dialogBody.scrollTop = 0;
    this.dialogOpen = name;
  }

  closeDialog() {
    this.refs.dialog.hidden = true;
    this.dialogOpen = null;
  }

  togglePanel(open) {
    const closed = open === undefined ? !this.root.classList.contains('panel-closed') : !open;
    this.root.classList.toggle('panel-closed', closed);
    this.refs.panel.inert = closed;
    this.refs.panelToggle.setAttribute('aria-expanded', String(!closed));
    // the bottom sheet slides for 250 ms on phones
    this.app.layoutChanged();
    setTimeout(() => this.app.layoutChanged(), 280);
  }

  toast(text, ms = 2600) {
    const t = this.refs.toast;
    t.textContent = text;
    t.classList.add('on');
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => t.classList.remove('on'), ms);
  }

  // --- sync -------------------------------------------------------------------------------
  syncAll() {
    this.sync(null);
  }

  /** Reflect the state in the controls. `changed` = array of changed keys, or null for all. */
  sync(changed) {
    const s = this.s;
    const r = this.refs;
    const has = (k) => !changed || changed.includes(k);

    if (has('ui')) this.root.classList.toggle('ui-hidden', !s.ui);
    if (has('mode') || has('fly')) {
      const active = s.mode === 'walk' && s.fly ? 'fly' : s.mode;
      for (const b of r.tabs.children) {
        b.classList.toggle('on', b.dataset.mode === active);
        b.setAttribute('aria-pressed', String(b.dataset.mode === active));
      }
      for (const [id, pane] of Object.entries(r.panes)) pane.hidden = id !== active;
      this.root.dataset.mode = active;
    }
    if (has('flightStart') || has('fly')) for (const [id, b] of r.flightButtons) b.classList.toggle('on', id === s.flightStart);
    if (has('view') || has('mode')) {
      const selected = s.mode === 'explore' && VIEWS.find(v => v.id === s.view);
      if (selected) {
        this.showViewGroup(selected.group);
        const { extra } = r.viewGroups[selected.group];
        if (extra.contains(r.viewButtons.get(selected.id))) extra.open = true;
      }
      for (const [id, b] of r.viewButtons) b.setAttribute('aria-pressed', String(!!selected && selected.id === id));
    }
    if (has('night')) r.daySeg.setValue(s.night);
    for (const k of Object.keys(r.sw)) if (has(k)) r.sw[k].input.checked = !!s[k];
    if (has('quality')) r.qualitySeg.setValue(s.quality);
    if (has('layers') && r.layerInputs) for (const [id, input] of r.layerInputs) input.checked = s.layers[id] !== false;
    if (has('seat') || has('mode')) this.syncSeat();
    if (has('walkStart') || has('mode')) for (const [id, b] of r.walkButtons) b.classList.toggle('on', s.mode === 'walk' && s.walkStart === id);
    if (has('fly')) r.flySwitch.input.checked = !!s.fly;
    if (has('sectionAxis') || has('sectionPos') || has('sectionFlip') || has('mode')) this.syncSection();
    if (has('level') || has('mode')) for (const [lv, b] of r.levelButtons) b.classList.toggle('on', s.level === lv);
    if (has('levelGhost')) r.ghostSwitch.input.checked = !!s.levelGhost;
    if (has('mode') || has('seat') || has('fly') || has('locked') || has('sectionAxis') || has('sectionPos') || has('level') || has('picked') || has('standing') || has('arenaSeats')) this.syncHud();
  }

  syncSeat() {
    const r = this.refs;
    const seat = this.s.seat;
    const d = this.seatDraft();
    r.tierSeg.setValue(d.tier);
    const special = isSpecial(seat);
    r.rowStep.hidden = r.numStep.hidden = special;
    if (special) {
      r.seatRange.textContent = tr("{0} — 번호 체계 밖의 좌석입니다. LEVEL을 고르면 일반 좌석으로 돌아갑니다.", seatTitle(seat));
      this.drawSeatMap();
      return;
    }
    r.rowStep.input.value = d.row;
    r.numStep.input.value = d.num;
    const rows = rowsOf(d.tier);
    const nums = seatNumbers(d.tier, d.row);
    const ranges = (rows.find((x) => x.row === d.row)?.ranges || []).map(([a, b]) => `${a}–${b}`);
    r.seatRange.textContent = tr("열 {0}–{1} · 이 열의 좌석 {2} ({3}석)", rows[0].row, rows[rows.length - 1].row, compact(ranges), nums.length);
    if (!this.refs.panes.seat.hidden || seat) this.drawSeatMap();
  }

  syncSection() {
    const r = this.refs;
    const s = this.s;
    const range = SECTION_RANGE[s.sectionAxis];
    r.axisSeg.setValue(s.sectionAxis);
    r.secRange.min = range.min;
    r.secRange.max = range.max;
    r.secRange.step = range.step;
    r.secRange.value = s.sectionPos;
    const unit = s.sectionAxis === 'x' ? tr("중심축에서") : s.sectionAxis === 'z' ? tr("무대 앞에서") : tr("아레나 바닥 +");
    r.secValue.textContent = `${unit} ${fmt(s.sectionPos, 1)} m`;
    r.flipSwitch.input.checked = !!s.sectionFlip;
    r.flipSwitch.hidden = s.sectionAxis === 'y';
  }

  setDoorPrompt(door) {
    if (this.promptEntrance === door?.entrance && this.promptOpen === door?.open) return;
    this.promptEntrance = door?.entrance;
    this.promptOpen = door?.open;
    this.doorPrompt = door ? tr(door.open ? '{0} · 문 닫기' : '{0} · 문 열기', tr(door.entrance)) : '';
    this.syncHud();
  }

  /** Bottom readout for the current mode. */
  syncHud() {
    const s = this.s;
    const app = this.app;
    const hud = clear(this.refs.hud);
    hud.className = 'hud';
    if (s.mode === 'seat' && s.seat) {
      const seat = s.seat;
      const standing = seat.tier === 1 && !s.arenaSeats;
      const m = seatMetrics(seat, standing ? 1.6 : 1.15);
      const gate = nearestGate(seat);
      const clear = app.sightline(seat);
      const side = Math.abs(m.offAxis) < 1.5 ? tr("무대 정면") : tr("정면에서 {0} {1}°", m.offAxis > 0 ? tr("오른쪽") : tr("왼쪽"), fmt(Math.abs(m.offAxis), 0));
      const nav = (name, label, fn, disabled) => h('button', { type: 'button', class: 'nav', title: label, 'aria-label': label, disabled: disabled || null, onClick: fn }, icon(name, 18));
      hud.classList.add('hud-seat');
      hud.append(
        h(
          'div',
          { class: 'hud-main' },
          h('div', { class: 'hud-title' }, h('span', { class: 'tier-dot', style: { background: TIER_COLOR[seat.tier] } }), seatTitle(seat), language === 'en' ? null : h('small', null, tierKo(seat))),
          h('div', { class: 'hud-seatno' }, h('b', null, seat.kind === 'companion'
            ? tr('{0}번', seat.num) : tr('{0}열 {1}번', seat.row, seat.num)),
            h('small', null, standing ? tr("스탠딩 시야") : seatKindKo(seat))),
          h(
            'dl',
            { class: 'hud-facts' },
            h('div', null, h('dt', null, tr("무대까지")), h('dd', null, `${fmt(m.horizontal, 1)} m`)),
            h('div', null, h('dt', null, tr("시선 거리")), h('dd', null, `${fmt(m.sight, 1)} m`)),
            h('div', null, h('dt', null, tr("눈높이")), h('dd', null, `+${fmt(m.eyeY, 1)} m`)),
            h('div', null, h('dt', null, tr("내려다보는 각")), h('dd', null, `${fmt(Math.max(m.down, 0), 0)}°`)),
            h('div', null, h('dt', null, tr("방향")), h('dd', null, side)),
            gate ? h('div', null, h('dt', null, tr("가까운 게이트")), h('dd', null, `GATE ${gate.id}`)) : null,
            clear === null ? null : h('div', { title: tr("모델의 난간 · 스탠드 · 갤러리 기준. 관객과 공연 기재는 포함하지 않습니다.") }, h('dt', null, tr("무대 앞 시야선")), h('dd', { class: clear ? '' : 'warn-text' }, clear ? tr("트임") : tr("구조물에 걸림"))),
          ),
        ),
        h(
          'div',
          { class: 'hud-nav' },
          nav('chevUp', tr("앞 열 (↑)"), () => app.stepRow(-1)),
          h('div', null, nav('chevLeft', tr("왼쪽 좌석 (←)"), () => app.stepSeat(-1)), h('button', { type: 'button', class: 'nav centre', title: tr("무대 쪽 보기"), onClick: () => app.lookAtStage() }, tr("무대")), nav('chevRight', tr("오른쪽 좌석 (→)"), () => app.stepSeat(1))),
          nav('chevDown', tr("뒷 열 (↓)"), () => app.stepRow(1)),
        ),
      );
    } else if (s.mode === 'walk' && !s.fly && this.doorPrompt) {
      hud.classList.add('hud-door');
      hud.append(h('button', { type: 'button', onClick: () => app.interact() },
        h('kbd', null, 'E'), h('span', null, this.doorPrompt)));
    } else if (s.mode === 'walk') {
      hud.classList.add('hud-hint');
      append(hud, [
        s.fly ? tr(matchMedia('(pointer: coarse)').matches ? '스틱으로 이동 · 드래그로 시선 · 화살표로 높이 조절' : 'WASD 이동 · E 상승 · Q 하강 · Shift 가속') :
          s.locked ? tr("WASD 이동 · Shift 달리기 · Space 점프 · F 비행 · Esc 마우스 해제") : tr("화면을 클릭하면 마우스로 시선을 움직입니다 · WASD 이동 · F 비행"),
      ]);
    } else if (s.mode === 'explore' && s.picked) {
      const seat = s.picked;
      hud.classList.add('hud-pick');
      hud.append(
        h('span', null, h('span', { class: 'tier-dot', style: { background: TIER_COLOR[seat.tier] } }), tr("{0} · {1}열 {2}번", seatTitle(seat), seat.row, seat.num)),
        h('button', { type: 'button', class: 'primary small', onClick: () => app.sit(seat) }, tr("이 좌석에서 보기")),
        h('button', { type: 'button', class: 'tool', 'aria-label': tr("선택 해제"), onClick: () => app.clearPick() }, icon('close', 16)),
      );
    } else if (s.mode === 'levels' && s.level) {
      const info = LEVEL_INFO.find((l) => l.level === s.level);
      hud.classList.add('hud-hint');
      hud.append(h('b', null, `LEVEL ${s.level} · +${fmt(info.y, 2)} m`), ` — ${info.ko}`);
    } else hud.hidden = true;
    if (hud.firstChild) hud.hidden = false;
  }

  setStatus(failed, missing) {
    const el = clear(this.refs.status);
    if (failed.length) el.append(h('p', { class: 'warn' }, icon('warn', 15), tr(" 불러오지 못한 부분: {0}", failed.join(', '))));
    if (missing.length) el.append(h('p', { class: 'hint tight' }, tr("아직 없는 부분: {0}", missing.join(', '))));
  }

  /** Map-data credit line (always), plus the aerial-photo credit while that mode is on. */
  setCredit(aerial) {
    this.refs.credit.textContent = `© OpenStreetMap contributors · 国土交通省 PLATEAU${aerial ? ' · 航空写真: PLATEAU-Ortho 2024 (CC BY 4.0)' : ''}`;
  }

  /** Hide switches whose feature the loaded modules do not offer. */
  setAvailable(map) {
    for (const [k, ok] of Object.entries(map)) if (this.refs.sw[k]) this.refs.sw[k].hidden = !ok;
  }

  setWalkInfo(text) {
    this.refs.walkInfo.textContent = text || '';
  }

  /** Rotate the compass needle: azimuth of the camera's forward direction in world XZ. */
  setCompass(fx, fz) {
    // angle between "screen up" (camera forward) and north, clockwise
    const a = Math.atan2(fx * NORTH_XZ[1] - fz * NORTH_XZ[0], fx * NORTH_XZ[0] + fz * NORTH_XZ[1]);
    const deg = (a * 180) / Math.PI;
    if (Math.abs(deg - (this._needle ?? 999)) < 0.5) return;
    this._needle = deg;
    this.refs.needle.style.transform = `rotate(${deg.toFixed(1)}deg)`;
  }
}

function compact(ranges) {
  if (ranges.length <= 4) return ranges.join(', ');
  return `${ranges[0]} … ${ranges[ranges.length - 1]}`;
}


import { h, icon } from './dom.js';
import { language, languageSelect, tr } from './i18n.js';
import { scheduleBanner } from './schedule.js';

const MODES = [
  { id: 'explore', ko: tr("둘러보기") },
  { id: 'seat', ko: tr("좌석 시야") },
  { id: 'walk', ko: tr("걷기") },
  { id: 'fly', ko: tr('날기') },
  { id: 'section', ko: tr("단면") },
  { id: 'levels', ko: tr("층별") },
];

export function viewerHeader(name, actions) {
  const narrow = matchMedia('(max-width: 760px)').matches;
  const tabs = h(
    'nav',
    { class: 'tabs', 'aria-label': tr("모드") },
    MODES.map((m) => {
      const b = h('button', { type: 'button', dataset: { mode: m.id } }, icon(m.id, 16), h('span', null, m.ko));
      b.addEventListener('click', () => actions.mode(m.id));
      return b;
    }),
  );
  const tool = (name, label, fn) => h('button', { type: 'button', class: 'tool', title: label, 'aria-label': label, onClick: fn }, icon(name));
  const panelToggle = h('button', {
    type: 'button', class: 'tool menu-btn', title: tr("패널 열기 / 닫기"), 'aria-label': tr("패널 열기 / 닫기"),
    'aria-controls': 'viewer-controls', 'aria-expanded': String(!narrow), onClick: actions.panel,
  }, icon('panel'));
  const topbar = h(
    'header',
    { class: 'topbar' },
    panelToggle,
    h('a', { class: 'venues-home', href: '?lang=' + language, title: tr('공연장 목록'), 'aria-label': tr('공연장 목록') }, 'Stage ', h('i', null, 'EX')),
    h('button', { type: 'button', class: 'brand', onClick: actions.home, title: tr("전경으로") }, h('b', null, name)),
    tabs,
    h(
      'div',
      { class: 'tools' },
      tool('info', tr("시설 개요"), actions.facts),
      tool('book', tr("출처 · 안내"), actions.about),
      tool('share', tr("현재 화면 링크 복사"), actions.share),
      tool('help', tr("조작법 · 단축키"), actions.help),
      tool('full', tr("전체 화면"), actions.full),
      languageSelect(actions.language),
    ),
  );
  return { topbar, tabs, panelToggle };
}

export function mountSchedule(root, panelScroll) {
  const schedule = scheduleBanner(true);
  const mobile = matchMedia('(max-width: 760px)');
  const placeSchedule = () => {
    schedule.open = false;
    if (mobile.matches) panelScroll.prepend(schedule);
    else root.append(schedule);
  };
  placeSchedule();
  mobile.addEventListener('change', placeSchedule);
}

export function switchRow(label, checked, onChange, hint) {
  const input = h('input', { type: 'checkbox', role: 'switch' });
  input.checked = !!checked;
  input.addEventListener('change', () => onChange(input.checked));
  const row = h('label', { class: 'sw' }, h('span', { class: 'sw-text' }, label, hint ? h('small', null, hint) : null), input, h('i', { 'aria-hidden': 'true' }));
  row.input = input;
  return row;
}

export function segmented(options, value, onChange, cls = '') {
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

export function joystick(onChange) {
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
    onChange(x, -y);
  };
  const end = () => {
    id = null;
    knob.style.transform = '';
    onChange(0, 0);
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

export function seatNavigation(stepRow,stepSeat,lookAtStage) {
  const arrow=(iconName,label,action)=>h('button',{type:'button',class:'nav',title:tr(label),
    'aria-label':tr(label),onClick:action},icon(iconName,18));
  return h('div',{class:'hud-nav'},arrow('chevUp','앞 열 (↑)',()=>stepRow(-1)),
    h('div',null,arrow('chevLeft','왼쪽 좌석 (←)',()=>stepSeat(-1)),
      h('button',{type:'button',class:'nav centre',title:tr('무대 쪽 보기'),onClick:lookAtStage},tr('무대')),
      arrow('chevRight','오른쪽 좌석 (→)',()=>stepSeat(1))),
    arrow('chevDown','뒷 열 (↓)',()=>stepRow(1)));
}

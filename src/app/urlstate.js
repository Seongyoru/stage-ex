import { language } from './i18n.js';
import { kArena } from '../venues.js';
// Shareable state in the URL query.
//
//   ?view=<viewpoint id>                       overview, front, eave, flankR, flankL, stageend, aerial, plan,
//                                              upper, stage, arena, side, lounge5, bar7, foyer
//   ?view=seat&level=7&row=20&seat=142         sit in a seat (LEVEL 1 / 3 / 5 / 7)
//   ?view=walk&start=deck|l5|arena|stage|upper|steps
//   ?view=section&axis=long|cross|plan&pos=0&flip=1
//   ?view=level&level=5[&ghost=0]
//   ?cam=x,y,z,tx,ty,tz[,fov]                  free camera pose (written while orbiting freely)
// Options that combine with any view:
//   night=1  show=1  labels=0  roof=open  stand=stored  arena=standing  kit=0  curtains=tied  aerial=1
//   hide=roof,seats   q=high|low   ui=0   dpr=1   debug=1 (dev)   mods=arena/bowl,… (dev)
const AXIS_IN = { long: 'x', cross: 'z', plan: 'y', x: 'x', z: 'z', y: 'y' };
const AXIS_OUT = { x: 'long', z: 'cross', y: 'plan' };

const num = (v) => {
  if (v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** Parse location.search into a partial app state. */
export function parseUrl(search = location.search) {
  const q = new URLSearchParams(search);
  const out = { flags: Object.fromEntries(q) };
  const view = q.get('view');
  if (view === 'seat') {
    out.mode = 'seat';
    out.seat = { level: num(q.get('level')) ?? 5, row: num(q.get('row')) ?? 1, num: num(q.get('seat')) ?? NaN };
  } else if (view === 'walk' || view === 'fly') {
    out.mode = 'walk';
    out.fly = view === 'fly';
    if (out.fly) out.flightStart = q.get('start') || 'plaza';
    out.walkStart = q.get('start') || 'deck';
  } else if (view === 'section') {
    out.mode = 'section';
    out.sectionAxis = AXIS_IN[q.get('axis')] || 'x';
    out.sectionPos = num(q.get('pos'));
    out.sectionFlip = q.get('flip') === '1';
  } else if (view === 'level') {
    out.mode = 'levels';
    out.level = num(q.get('level')) ?? 3;
    out.levelGhost = q.get('ghost') !== '0';
  } else if (view) {
    out.mode = 'explore';
    out.view = view;
  }
  const cam = (q.get('cam') || '').split(',').map(Number);
  if ((cam.length === 6 || cam.length === 7) && cam.every(Number.isFinite)) {
    out.cam = { pos: cam.slice(0, 3), target: cam.slice(3, 6), fov: cam[6] || 50, kind: 'orbit' };
  }
  if (q.has('night')) out.night = q.get('night') === '1';
  if (q.has('show')) out.show = q.get('show') === '1';
  if (q.has('labels')) out.labels = q.get('labels') !== '0';
  if (q.has('roof')) out.roofOpen = q.get('roof') === 'open';
  if (q.has('stand')) out.telescopic = q.get('stand') !== 'stored';
  if (q.has('arena')) out.arenaSeats = q.get('arena') !== 'standing';
  if (q.has('kit')) out.stageKit = q.get('kit') !== '0';
  if (q.has('curtains')) out.curtains = q.get('curtains') !== 'tied';
  if (q.has('aerial')) out.aerial = q.get('aerial') === '1';
  if (q.has('hide')) out.hide = q.get('hide').split(',').filter(Boolean);
  if (q.get('q') === 'low' || q.get('q') === 'high') out.quality = q.get('q');
  out.ui = q.get('ui') !== '0';
  out.debug = q.get('debug') === '1';
  out.dpr = num(q.get('dpr'));
  out.mods = q.get('mods') ? q.get('mods').split(',').filter(Boolean) : null;
  return out;
}

const r1 = (v) => Math.round(v * 10) / 10;

/** Serialise the app state to a query string (only what differs from the defaults). */
export function buildUrl(s, pose, keep = {}) {
  const q = new URLSearchParams();
  q.set('venue', kArena.id);
  q.set('lang', language);
  if (s.mode === 'seat' && s.seat) {
    q.set('view', 'seat');
    q.set('level', s.seat.tier);
    q.set('row', s.seat.row);
    q.set('seat', s.seat.num);
  } else if (s.mode === 'walk') {
    q.set('view', s.fly ? 'fly' : 'walk');
    q.set('start', s.fly ? s.flightStart || 'plaza' : s.walkStart || 'deck');
    if (s.fly && pose?.kind === 'look') q.set('cam', [...pose.pos, ...pose.target, pose.fov].map(r1).join(','));
  } else if (s.mode === 'section') {
    q.set('view', 'section');
    q.set('axis', AXIS_OUT[s.sectionAxis]);
    q.set('pos', r1(s.sectionPos));
    if (s.sectionFlip) q.set('flip', '1');
  } else if (s.mode === 'levels' && s.level !== null) {
    q.set('view', 'level');
    q.set('level', s.level);
    if (!s.levelGhost) q.set('ghost', '0');
  } else if (s.view) {
    q.set('view', s.view);
  }
  // a free orbit pose (not for seat / walk, where the mode defines the position)
  if (pose && !s.view && s.mode !== 'seat' && s.mode !== 'walk' && pose.kind === 'orbit') {
    q.set('cam', [...pose.pos, ...pose.target].map(r1).join(',') + (Math.abs(pose.fov - 50) > 0.5 ? `,${r1(pose.fov)}` : ''));
  }
  if (s.night) q.set('night', '1');
  if (s.show) q.set('show', '1');
  if (!s.labels) q.set('labels', '0');
  if (s.roofOpen) q.set('roof', 'open');
  if (!s.telescopic) q.set('stand', 'stored');
  if (!s.arenaSeats) q.set('arena', 'standing');
  if (!s.stageKit) q.set('kit', '0');
  if (s.curtains === false) q.set('curtains', 'tied');
  if (s.aerial) q.set('aerial', '1');
  const hidden = Object.entries(s.layers)
    .filter(([, on]) => on === false)
    .map(([id]) => id);
  if (hidden.length) q.set('hide', hidden.join(','));
  for (const [k, v] of Object.entries(keep)) if (v !== null && v !== undefined && v !== false) q.set(k, v === true ? '1' : v);
  const str = q.toString().replace(/%2C/g, ',').replace(/%2F/g, '/');
  return str ? `?${str}` : '';
}

/** Debounced history.replaceState. */
export function makeUrlWriter(delay = 350) {
  let t = 0;
  let last = null;
  return (query) => {
    if (query === last) return;
    last = query;
    clearTimeout(t);
    t = setTimeout(() => {
      try {
        history.replaceState(null, '', location.pathname + query + location.hash);
      } catch {}
    }, delay);
  };
}

import { language } from './i18n.js';
// Tiny DOM helpers (no framework).

/** h('button', { class: 'x', onClick: fn }, 'text', child) */
export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, String(v));
    }
  }
  append(el, children);
  return el;
}

export function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

// Inline icons (24 px grid, stroke = currentColor). Static strings only.
const ICONS = {
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 10h18m-14 4h3m3 0h3"/>',
  panel: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/>',
  check: '<path d="m5 12 4.5 4.5L19 7"/>',
  settings: '<path d="M3 7h4m4 0h10M3 17h10m4 0h4"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="17" r="2"/>',
  explore: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.7 5.3L8 16l2.7-5.3z"/>',
  fly: '<path d="m3 11 18-7-7 17-2.6-7.4L3 11Z"/><path d="m11.4 13.6 5-5"/>',
  seat: '<path d="M5 4h3l2 9h8a2 2 0 0 1 2 2v1H8L5 4Zm4 12-1 4m9-4 1 4"/>',
  walk: '<circle cx="14" cy="4" r="1.7"/><path d="m7 12 3-5 4 1 2 4 3 1m-6-5-2 6 4 3v4m-4-7-3 6"/>',
  section: '<path d="M4 19V8l8-4 8 4v11H4ZM3 13h18" stroke-dasharray="0"/><path d="m7 18 4-4m2 4 4-4"/>',
  levels: '<path d="m3 8 9-5 9 5-9 5-9-5Zm0 5 9 5 9-5M3 17l9 5 9-5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  book: '<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/>',
  share: '<path d="M10 14 20 4M20 4h-6M20 4v6"/><path d="M19 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.8M12 17v.5"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  eyeOff: '<path d="M4 4l16 16M9.9 6A9 9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.9 3.6M14.5 14.6A2.8 2.8 0 0 1 9.4 9.5M6.3 7.6A16 16 0 0 0 2.5 12S6 18.5 12 18.5a9 9 0 0 0 3.2-.6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  chevLeft: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
  chevRight: '<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
  chevUp: '<path d="M5.5 14.5 12 8l6.5 6.5"/>',
  chevDown: '<path d="M5.5 9.5 12 16l6.5-6.5"/>',
  home: '<path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
  warn: '<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17v.5"/>',
};

export function icon(name, size = 18) {
  const span = document.createElement('span');
  span.className = 'ico';
  span.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  return span;
}

export function fmt(n, digits = 1) {
  return Number(n).toLocaleString(language, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

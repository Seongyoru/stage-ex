import { h } from './app/dom.js';
import { language, languageSelect, tr } from './app/i18n.js';

import { venues } from './venues.js';

export function directory() {
  const header = h('header', { class: 'directory-header' },
    h('div', { class: 'wordmark', lang: 'en' }, 'Stage ', h('i', null, 'EX')),
    languageSelect(code => { location.search = '?lang=' + code; }));
  const list = h('main', { class: 'venue-list' }, h('h1', null, tr('공연장 둘러보기')),
    h('p', { class: 'directory-intro' }, tr('좌석에서 보이는 무대와 공연장 안팎을 3D로 둘러보세요.')));
  for (const venue of venues) {
    const url = (extra = {}) => '?' + new URLSearchParams({ venue: venue.id, lang: language, ...extra });
    const link = h('a', { class: 'venue-feature', href: url(), 'aria-label': venue.title + ' · ' + tr('공연장 입장') },
      h('img', { src: venue.image, alt: '', fetchpriority: 'high' }),
      h('div', { class: 'venue-copy' },
        h('span', { class: 'venue-city' }, tr(venue.city)),
        h('h2', { lang: 'en' }, venue.title),
        h('div', { class: 'venue-meta' }, tr('{0}석', venue.seats.toLocaleString(language))),
        h('span', { class: 'venue-enter' }, tr('공연장 입장'), h('b', { 'aria-hidden': 'true' }, '↗'))));
    const shortcuts = h('div', { class: 'venue-shortcuts' }, h('span', null, tr('원하는 장면으로 바로가기')),
      venue.shortcuts.map(([label, params]) => h('a', { href: url(params) }, tr(label), h('i', { 'aria-hidden': 'true' }, '↗'))));
    list.append(h('article', null, link, shortcuts));
  }
  const root = h('div', { class: 'directory' }, header, list);
  document.body.append(root);
  document.title = 'Stage EX · ' + tr('공연장 선택');
}

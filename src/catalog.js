import { h, icon } from './app/dom.js';
import { openGuide } from './app/guide.js';
import { language, languageSelect, tr } from './app/i18n.js';

import { venues, kArena } from './venues.js';
import { scheduleBanner } from './app/schedule.js';

export function directory() {
  const header = h('header', { class: 'directory-header' },
    h('div', { class: 'wordmark', lang: 'en' }, 'Stage ', h('i', null, 'EX')),
    h('nav', { class: 'directory-tools' },
      h('button', { type: 'button', 'aria-label': tr('조작 안내'), title: tr('조작 안내'), onClick: () => openGuide(true) },
        icon('help', 18), h('span', null, tr('조작 안내'))),
      languageSelect(code => { location.search = '?lang=' + code; })));
  const list = h('main', { class: 'venue-list' }, h('header', { class: 'directory-title' },
    h('h1', null, tr('공연장 둘러보기')),
    h('p', { class: 'directory-intro' }, tr('좌석에서 보이는 무대와 공연장 안팎을 3D로 둘러보세요.'))));
  list.append(h('nav', { class: 'venue-jumps', 'aria-label': tr('공연장 선택') },
    venues.map(v => h('a', { href: '#' + v.id }, v.title))));
  for (const venue of venues) {
    const url = (extra = {}) => '?' + new URLSearchParams({ venue: venue.id, lang: language, ...extra });
    const link = h('a', { class: 'venue-feature', href: url(), 'aria-label': venue.title + ' · ' + tr('공연장 입장') },
      h('img', { src: venue.image, alt: '', fetchpriority: venue === kArena ? 'high' : 'auto' }),
      h('div', { class: 'venue-copy' },
        h('span', { class: 'venue-city' }, tr(venue.city), h('span', { class: 'seat-count' },
          venue.capacity ? tr('최대 {0}명', venue.capacity.toLocaleString(language)) : tr('{0}석', venue.seats.toLocaleString(language)))),
        h('h2', { lang: 'en' }, venue.title),
        h('span', { class: 'venue-enter' }, tr('공연장 입장'), h('b', { 'aria-hidden': 'true' }, '↗'))));
    const shortcuts = venue.shortcuts && h('section', { class: 'venue-shortcuts' }, h('h3', null, tr('원하는 장면으로 바로가기')),
      h('div', { class: 'scene-cards' }, venue.shortcuts.map(({ label, params, image }) =>
        h('a', { href: url(params) }, h('img', { src: image, alt: '', loading: 'lazy' }),
          h('span', null, tr(label)), icon('chevRight', 17)))));
    const feature = venue.id === kArena.id ? h('div', { class: 'venue-layout' }, link, scheduleBanner()) : link;
    list.append(h('article', { id: venue.id }, feature, shortcuts));
  }
  const root = h('div', { class: 'directory' }, header, list);
  document.body.append(root);
  document.title = 'Stage EX · ' + tr('공연장 선택');
}

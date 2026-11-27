import snapshot from '../data/k-arena-schedule.json';
import { h, icon } from './dom.js';
import { language, tr } from './i18n.js';

const month = new Intl.DateTimeFormat(language, { timeZone: 'Asia/Tokyo', month: 'long', year: 'numeric' });
const weekday = new Intl.DateTimeFormat(language, { timeZone: 'Asia/Tokyo', weekday: 'short' });
const japanDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo', dateStyle: 'short' });
const heading = () => tr('공연 일정');

export function scheduleBanner(compact = false) {
  const list = h('div', { class: 'schedule-list', tabindex: '0', role: 'region', 'aria-label': heading() });
  const render = () => {
    const today = japanDate.format(new Date());
    const events = snapshot.events.filter(event => event.date >= today);
    const sections = [];
    let lastMonth, rows;
    for (const event of events) {
      const date = new Date(event.date + 'T12:00:00+09:00');
      const key = event.date.slice(0, 7);
      if (key !== lastMonth) {
        rows = h('ul');
        sections.push(h('section', null, h('h3', null, month.format(date)), rows));
        lastMonth = key;
      }
      const when = event.starts.join(' / ') || tr('시간 미정');
      const artist = event.artist && !event.title.includes(event.artist) ? event.artist : '';
      rows.append(h('li', null, h('a', {
        href: event.url, target: '_blank', rel: 'noopener noreferrer', title: event.title,
      },
      h('time', { datetime: event.date, class: 'schedule-date' },
        h('b', null, event.date.slice(-2)), weekday.format(date)),
      h('span', { class: 'schedule-event' },
        h('strong', null, event.title), artist && h('span', { class: 'schedule-artist' }, artist),
        h('small', null, event.date === today && h('b', null, tr('오늘')), when)),
      icon('share', 13))));
    }
    list.replaceChildren(...(sections.length ? sections : [h('p', null, tr('아직 발표된 공연이 없습니다.'))]));
    const midnight = Date.parse(today + 'T00:00:00+09:00') + 86400000;
    setTimeout(render, Math.max(1000, midnight - Date.now()));
  };
  render();
  const body = h('div', { class: 'schedule-body' },
    h('p', { class: 'schedule-zone' }, tr('일본 현지 시간')),
    list, h('footer', null, h('span', null, tr('{0} 확인', snapshot.checkedOn)),
      h('a', { href: 'https://k-arena.com/schedule/', target: '_blank', rel: 'noopener noreferrer' },
        tr('공식 일정'), icon('share', 13))));
  const title = [icon('calendar', 19), h('span', null, heading())];
  if (compact) return h('details', { class: 'schedule-card schedule-drawer', onKeydown: e => e.stopPropagation() },
    h('summary', null, ...title, icon('chevDown', 14)), body);
  return h('aside', { class: 'schedule-card', 'aria-label': heading() }, h('h2', null, ...title), body);
}

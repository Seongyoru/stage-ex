import { directory } from './catalog.js';
import { kArena, venues } from './venues.js';
import { language, tr } from './app/i18n.js';
import './styles/experience.css';

document.documentElement.lang = language;
const params = new URLSearchParams(location.search);
const id = params.get('venue');
const legacy = ['view','cam','q','mods','night','show','ui','roof','hide','stand','labels','arena','kit','curtains','aerial','debug','dpr'];
const venue = id ? venues.find(v => v.id === id) : legacy.some(key => params.has(key)) ? kArena : null;
if (venue) {
  document.body.classList.add('viewer');
  document.title = 'Stage EX · ' + venue.title;
  document.querySelector('#view').setAttribute('aria-label', venue.title + ' · 3D');
  document.querySelector('#loading .sub').textContent = tr('비공식 3D 디지털 트윈');
  document.querySelector('#loading-step').textContent = tr('불러오는 중…');
  venue.load().catch(error => {
    document.querySelector('#loading-warn').textContent = tr('모델을 표시할 수 없습니다.') + ' ' + error.message;
  });
} else {
  document.body.classList.add('directory-page');
  directory();
}

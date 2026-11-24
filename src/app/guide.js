import { h } from './dom.js';
import { tr, remember } from './i18n.js';

export function openGuide() {
  if (document.querySelector('.quick-guide')) return;
  const touch = matchMedia('(pointer: coarse)').matches;
  const steps = [
    ['↻', '회전', '왼쪽 버튼을 누른 채 드래그하세요.', '한 손가락으로 화면을 드래그하세요.'],
    ['±', '확대와 축소', '마우스 휠을 위아래로 굴리세요.', '두 손가락을 벌리거나 모으세요.'],
    ['↔', '화면 이동', '오른쪽 버튼을 누른 채 드래그하세요.', '두 손가락을 함께 움직이세요.'],
  ];
  const dialog = h('dialog', { class: 'quick-guide', 'aria-labelledby': 'guide-title' },
    h('h2', { id: 'guide-title' }, tr('조작 안내')),
    h('p', null, tr('둘러보기 모드에서 아래 조작을 사용하세요. 도움말에서 언제든 다시 볼 수 있습니다.')),
    h('ul', null, steps.map(([symbol, title, mouse, finger]) => h('li', null,
      h('span', { 'aria-hidden': 'true' }, symbol),
      h('div', null, h('strong', null, tr(title)), h('small', null, tr(touch ? finger : mouse)))))),
    h('button', { type: 'button', class: 'guide-start', onClick: () => dialog.close() }, tr('둘러보기 시작')));
  dialog.addEventListener('close', () => { remember('guide-seen', '1'); dialog.remove(); });
  dialog.addEventListener('keydown', e => e.stopPropagation());
  document.body.append(dialog);
  dialog.showModal();
}

// Facts panel, sources dialog and shortcut help (Korean; Japanese / English proper names kept).
// Every number comes from research/00-consolidated.md via src/core/spec.js.
import { LEVEL_Y } from '../core/envelope.js';
import { MAPPED_SEAT_COUNT } from '../core/seating.js';
import { SPEC } from '../core/spec.js';
import { h, append, fmt } from './dom.js';

const n0 = (v) => Number(v).toLocaleString('ko-KR');

function table(rows, cls = '') {
  return h(
    'table',
    { class: `facts ${cls}` },
    h(
      'tbody',
      null,
      rows.map(([k, v, note]) => h('tr', null, h('th', { scope: 'row' }, k), h('td', null, v, note ? h('small', null, note) : null))),
    ),
  );
}

export function factsContent() {
  const b = SPEC.building;
  const t = SPEC.seatTotals;
  const vd = SPEC.hall.viewingDistances;
  const st = SPEC.stage;
  const root = h('div', { class: 'doc' });
  root.append(
    h('p', { class: 'lead' }, '音楽のために造られた世界最大級の音楽アリーナ — 음악 공연 전용으로 지어진 세계 최대급 아레나. 모든 좌석이 무대를 정면으로 바라보는 부채꼴(3면 분절) 객석입니다.'),
    h('h3', null, '개요'),
    table([
      ['명칭', 'K-Arena Yokohama · Kアリーナ横浜'],
      ['위치', '神奈川県横浜市西区みなとみらい6-2-14', 'Minato Mirai 21 · Music Terrace (ミュージックテラス)'],
      ['개관', '2023-09-29', '착공 2020-08-01 · 준공 2023-07-31'],
      ['좌석 수', `${n0(b.seats)}석`, `스탠딩 아레나 시 약 ${n0(b.standingModeCapacity)}명`],
      ['규모', `지상 ${b.floors}층 · 높이 약 ${b.height_m} m`, `연면적 ${n0(b.grossFloorArea_m2)} m²`],
      ['지붕 윤곽', `${fmt(b.length_m, 1)} × ${fmt(b.width_m, 1)} m`, 'PLATEAU 측량 윤곽 기준 (축 방향 × 최대 폭)'],
      ['구조', 'S조 (일부 RC · SRC)', '지붕 트러스 18기 · 스팬 약 112 m · 무주(無柱) 객석'],
      ['개발 · 운영', 'ケン・コーポレーション · Kアリーナマネジメント'],
      ['설계 · 시공', '梓設計 (Azusa Sekkei) · 鹿島建設 (Kajima)'],
    ]),
    h('h3', null, '레벨별 좌석'),
    table(
      [
        ['LEVEL 1 · ARENA', `${n0(t.level1)}석`, '공식 표준 배치 34열 · 이동식 좌석'],
        ['LEVEL 3 · LOWER STAND', `${n0(t.level3)}석`, `1–11열 가동식 1,518석 · 휠체어석 ${t.wheelchairPositions} 별도`],
        ['LEVEL 5 · MIDDLE STAND', `${n0(t.level5)}석`, '발코니석 235석 포함'],
        ['LEVEL 6 · VIP BOX', `${n0(t.vipBoxSeats)}석`, '11실 (계약자 전용)'],
        ['LEVEL 7 · UPPER STAND', `${n0(t.level7)}석`, '최대 28열'],
        ['합계', `${n0(t.officialTotal)}석`, `공식 좌석도에 그려진 좌석 ${n0(MAPPED_SEAT_COUNT)}석 + VIP · 휠체어석`],
      ],
      'num',
    ),
    h('h3', null, '무대까지의 거리'),
    h('p', { class: 'note' }, '무대 앞 가장자리 중앙 기준 수평 거리. 공식 수치는 없으며 좌석도와 단면을 맞춰 얻은 추정값입니다.'),
    table(
      [
        ['ARENA 1열 / 34열', '3.4 m / 33.4 m'],
        ['LOWER STAND 1열 / 29열', '36.3 m / 60.0 m'],
        ['MIDDLE STAND 발코니 1열 / 17열', '55.6 m / 68.7 m'],
        ['UPPER STAND 1열 / 28열', `69.9 m / ${fmt(vd.stageFrontToLastRowCentre_m, 1)} m`],
        ['가장 먼 좌석', `${fmt(vd.stageFrontToFarthestSeat_m, 1)} m`, `시선 거리 약 ${fmt(vd.lineOfSightFarthestSeat_m, 0)} m (UPPER STAND 날개 끝 28열)`],
      ],
      'num',
    ),
    h('h3', null, '층 높이'),
    h('p', { class: 'note' }, '아레나 바닥(LEVEL 1) 기준. 설계자 단면도(JATET)에서 읽은 값입니다.'),
    table(
      Object.entries(LEVEL_Y).map(([lv, y]) => [`LEVEL ${lv}`, `+${fmt(y, 2)} m`]).concat([['지붕 용마루', `+${fmt(b.height_m, 1)} m`]]),
      'num cols',
    ),
    h('h3', null, '무대 · 연출 설비'),
    table([
      ['기본 스테이지 (基礎ステージ)', `${st.width_m} × ${st.depth_m} m · 높이 ${st.height_m} m`, `하나미치 포함 전체 폭 약 ${st.totalWidthWithHanamichi_m} m · 조립식`],
      ['아레나 바닥', `약 ${n0(SPEC.hall.arenaFloor.area_m2)} m²`, `평탄 깊이 ${SPEC.hall.arenaFloor.flatDepthOnAxis_m} m · 하중 ${SPEC.hall.arenaFloor.loadCapacity_t_per_m2} t/m² · 11 t 트럭 진입`],
      ['리깅', `${SPEC.production.rigging.points} 포인트 · 총 ${SPEC.production.rigging.totalLoad_t} t`, `승강 그리드 ${SPEC.production.liftingGrids.count}기`],
      ['음향', 'L-Acoustics K 시리즈', '상설 스피커 200대 이상'],
      ['영상', `리본 비전 약 ${SPEC.production.video.ribbonWidth_m} × ${SPEC.production.video.ribbonHeight_m} m`, `사이드 스크린 ${SPEC.production.video.sideScreenWidth_m} × ${SPEC.production.video.sideScreenHeight_m} m × 2`],
    ]),
    h('h3', null, '편의 시설'),
    table([
      ['Lounge 5', 'LEVEL 5 · 약 400석'],
      ['Arena Bar 7', 'LEVEL 7 · 120석'],
      ['매점 (KIOSK)', '11곳', 'LEVEL 1 · 3 · 5 · 7'],
      ['코인 로커', '최대 6,240개'],
      ['에스컬레이터', '4대', 'LEVEL 3 ↔ LEVEL 5 · 양정 5.4 m'],
    ]),
  );
  return root;
}

/** attribution: strings (or { text, url }) collected from the modules' ATTRIBUTION exports. */
export function aboutContent(attribution = [], failed = []) {
  const root = h('div', { class: 'doc' });
  const link = (text, href) => h('a', { href, target: '_blank', rel: 'noopener noreferrer' }, text);
  append(root, [
    h('p', { class: 'lead' }, '이 사이트는 공개된 자료만으로 만든 ', h('b', null, '비공식 3D 모델'), '입니다. K-Arena Yokohama의 운영사 · 소유사 · 설계사와는 관계가 없습니다.'),
    h(
      'ul',
      null,
      h('li', null, '건물 윤곽 · 지붕 높이는 측량 데이터(PLATEAU)에, 좌석 배치는 공식 좌석도에 맞췄습니다.'),
      h('li', null, h('b', null, '일부 치수는 추정값'), '입니다. 층 높이 · 스탠드 경사 · 내부 벽 위치 · 마감 색상 등은 도면과 사진에서 읽어낸 값이라 실제와 다를 수 있습니다.'),
      h('li', null, '좌석 시야는 참고용입니다. 실제 공연의 무대 구성 · 기재 · 난간에 따라 달라집니다.'),
    ),
    h('h3', null, '데이터 출처'),
    h(
      'ul',
      { class: 'credits' },
      h('li', null, link('K-Arena Yokohama 공식 사이트', 'https://k-arena.com/'), ' — 좌석도 · 플로어 맵 · 시설 정보'),
      h('li', null, '© ', link('OpenStreetMap', 'https://www.openstreetmap.org/copyright'), ' contributors — 도로 · 건물 · 주변 지물 (ODbL)'),
      h('li', null, link('国土交通省 PLATEAU', 'https://www.mlit.go.jp/plateau/'), ' (MLIT Project PLATEAU) — 3D 도시 모델 요코하마시 2024 (건물 윤곽 · 높이)'),
      h('li', null, link('国土地理院', 'https://maps.gsi.go.jp/development/ichiran.html'), ' (GSI, 地理院タイル) — 항공사진 · 표고'),
      attribution.map((a) => {
        if (a && typeof a === 'object') return h('li', null, a.url ? link(a.text || a.name || a.url, a.url) : a.text || a.name || '', a.note ? ` — ${a.note}` : '');
        return h('li', null, String(a));
      }),
    ),
    h('h3', null, '참고 문헌'),
    h('p', { class: 'note' }, '梓設計 · 鹿島建設 · ケン・コーポレーション 보도자료, 新建築 2023:10, 商店建築 2024-01, JATET 저널(설계자 단면 · 평면), コトブキシーティング · L-Acoustics · Fujitec 납품 사례.'),
    failed.length
      ? h('p', { class: 'note warn' }, `현재 불러오지 못한 모델 부분: ${failed.join(', ')}`)
      : null,
    h('p', { class: 'note' }, 'three.js · three-mesh-bvh · Vite로 제작. 외부 서버로 전송되는 데이터는 없습니다.'),
  ]);
  return root;
}

export function helpContent() {
  const key = (...ks) => h('span', { class: 'keys' }, ks.map((k) => h('kbd', null, k)));
  const rows = (list) => h('table', { class: 'facts keys-table' }, h('tbody', null, list.map(([k, v]) => h('tr', null, h('th', null, k), h('td', null, v)))));
  const root = h('div', { class: 'doc' });
  root.append(
    h('h3', null, '둘러보기'),
    rows([
      ['드래그 / 우클릭 드래그 / 휠', '회전 / 이동 / 확대'],
      ['터치', '한 손가락 회전 · 두 손가락 확대 · 이동'],
      [key('1', '…', '9', '0'), '시점 프리셋'],
      [key('H'), '전경으로 돌아가기'],
      ['좌석 클릭', '좌석 선택 → 그 자리에 앉기 (건물 안이나 지붕을 연 상태에서)'],
    ]),
    h('h3', null, '좌석 시야'),
    rows([
      [key('←', '→'), '옆 좌석'],
      [key('↑', '↓'), '앞 열 / 뒷 열'],
      ['드래그 / 휠', '둘러보기 / 줌'],
    ]),
    h('h3', null, '걷기'),
    rows([
      [key('W', 'A', 'S', 'D'), '이동 (화살표 키도 가능)'],
      ['마우스', '화면 클릭 후 시선 이동 (Esc로 해제)'],
      [key('Shift'), '달리기'],
      [key('Space'), '점프'],
      [key('F'), '비행 모드 (벽 통과) — E / Q 로 상승 · 하강'],
      ['터치', '왼쪽 아래 조이스틱으로 이동, 화면 드래그로 시선'],
    ]),
    h('h3', null, '공통'),
    rows([
      [key('N'), '낮 / 밤'],
      [key('B'), '공연 조명'],
      [key('L'), '라벨'],
      [key('R'), '지붕 열기'],
      [key('T'), '가동식 스탠드 펼침 / 수납'],
      [key('K'), '음향 커튼 닫기 / 묶기'],
      [key('G'), '걷기 모드'],
      [key('C'), '단면'],
      [key('V'), '좌석 시야'],
      [key('U'), '화면 UI 숨기기'],
      [key('Esc'), '모드 나가기 / 창 닫기'],
    ]),
  );
  return root;
}

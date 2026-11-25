// The catalog and share links use the same stable venue ID.
export const kArena = {
  id: 'k-arena-yokohama',
  title: 'K-Arena Yokohama',
  city: '일본 · 요코하마',
  seats: 20033,
  image: './venues/k-arena-poster.webp',
  load: () => import('./main.js'),
  shortcuts: [
    { label: '7층 객석에서 보기', image: './venues/upper-stand.webp', params: { view: 'seat', level: 7, row: 20, seat: 142 } },
    { label: '상공에서 둘러보기', image: './venues/plaza-flight.webp', params: { view: 'fly', start: 'plaza' } },
    { label: '무대 조명 켜고 보기', image: './venues/k-arena-yokohama.webp', params: { view: 'upper', show: 1, night: 1 } },
  ],
};

export const osakaHall = {
  id: 'osaka-jo-hall',
  title: 'Osaka-jo Hall',
  city: '일본 · 오사카',
  capacity: 16000,
  image: './venues/osaka-jo-hall.webp',
  load: () => import('./osaka/viewer.js').then(viewer => viewer.start()),
  shortcuts: [
    { label: '외관', image: './venues/os-facade.webp', params: { view: 'exterior' } },
    { label: '분수 광장에서 걷기', image: './venues/os-plaza.webp', params: { view: 'walk', start: 'plaza' } },
    { label: '좌석 시야', image: './venues/osaka-jo-hall.webp', params: { view: 'seat', block: 'B', row: 18, seat: 9, show: 1 } },
  ],
};

export const venues = [kArena, osakaHall];

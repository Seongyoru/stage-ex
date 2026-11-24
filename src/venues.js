// The catalog and share links use the same stable venue ID.
export const kArena = {
  id: 'k-arena-yokohama',
  title: 'K-Arena Yokohama',
  city: '일본 · 요코하마',
  seats: 20033,
  image: './venues/k-arena-yokohama.webp',
  load: () => import('./main.js'),
  shortcuts: [
    ['7층 객석에서 보기', { view: 'seat', level: 7, row: 20, seat: 142 }],
    ['무대 조명 켜고 보기', { view: 'upper', show: 1, night: 1 }],
  ],
};

export const venues = [kArena];

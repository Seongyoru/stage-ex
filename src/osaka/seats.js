import rows from './stand-rows.json';

// Numbering follows osaka-johall.com/seat/search.html. Runs store the first and
// last seat numbers and their approximate distances along the front row (cm).
export const blocks = [...'ABCDEFGHIJKLMN', 'BOX'];
export const layouts = {
  A: { capacity: 6200, x: 0, z: -18, yaw: 0, width: 23, depth: 9 },
  B: { capacity: 11200, x: -33, z: 0, yaw: Math.PI / 2, width: 26, depth: 9 },
  C: { capacity: 16000, x: 0, z: 0, yaw: 0, width: 12, depth: 12 },
};
export const straight = 17.6;
export const radius = 24.7;
export const perimeter = 4 * straight + 2 * Math.PI * radius;
export const rowDepth = row => (row - 1) * .93 + (row > 12 ? 2.4 : 0);
export const rowHeight = row => 1.65 + (row - 1) * .43 + (row > 12 ? .18 : 0);

export function rim(distance, depth = 0) {
  const s = straight, arc = Math.PI * radius;
  let u = ((distance + s) % perimeter + perimeter) % perimeter;
  let cx, nx, nz;
  if (u < 2 * s) { cx = u - s; nx = 0; nz = 1; }
  else if ((u -= 2 * s) < arc) { cx = s; nx = Math.sin(u / radius); nz = Math.cos(u / radius); }
  else if ((u -= arc) < 2 * s) { cx = s - u; nx = 0; nz = -1; }
  else { u -= 2 * s; cx = -s; nx = -Math.sin(u / radius); nz = -Math.cos(u / radius); }
  return { x: cx + (radius + depth) * nx, z: (radius + depth) * nz, nx, nz };
}

export const seats = new Map();
export const byBlock = new Map();
for (const block of blocks) {
  const blockRows = new Map();
  byBlock.set(block, blockRows);
  for (const [rowKey, runs] of Object.entries(rows[block])) {
    const row = Number(rowKey), list = [];
    blockRows.set(row, list);
    for (const [first, last, start, end] of runs) {
      for (let number = first; number <= last; number++) {
        const u = (start + (end - start) * (number - first) / Math.max(1, last - first)) / 100;
        const tier = block === 'BOX' ? row + 8 : row;
        const seat = { block, row, number, y: rowHeight(tier), ...rim(u, rowDepth(tier)) };
        seats.set([block, row, number].join('-'), seat);
        list.push(seat);
      }
    }
  }
}

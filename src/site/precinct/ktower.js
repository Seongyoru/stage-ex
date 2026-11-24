// K Tower Yokohama: 21-storey office tower (99.87 m), 43.2 x 32.0 m. Dark blue-black
// curtain wall with paired white fins on a 7.2 m grid, white corner frames and cornice,
// solid white core panels on the short faces, and a base of brick-red piers under a white
// pilaster storey. Built in the Hilton frame (a = west, b = north).
import { M, E } from './mats.js';
import { Bag, lbox } from './kit.js';
import { rectFaces, rnd } from './facade.js';
import { HF, KTOWER, Y_PLAZA } from './layout.js';

const Y0 = Y_PLAZA;
const Y_BRICK = 12.0; // top of the double-height brick piers (2F entrance hall)
const Y_BAND = 12.8;
const Y_PIL = 17.3; // top of the white pilaster storey (3F)
const Y_SHAFT = 18.4;
const FLOORS = 18; // 4F … 21F
const Y_CROWN = 95.6;
const FLOOR_H = (Y_CROWN - Y_SHAFT) / FLOORS; // 4.29 m

export function buildKTower(bag) {
  const K = KTOWER;
  const L = new Bag();
  const len = K.a1 - K.a0; // 43.2
  const depth = K.b1 - K.b0; // 32.0
  const F = rectFaces(K.a0, K.a1, K.b0, K.b1);
  const white = M('ktower.fin');
  const panel = M('ktower.panel');
  const mull = M('ktower.mullion');
  const sp = M('ktower.spandrel');
  const brick = M('precinct.brick');
  const stone = M('precinct.stoneBase');
  const lit = E('ktower.windowLit');
  const dim = E('ktower.windowLitDim');

  // glass body of the shaft and the recessed core of the base
  L.add(M('ktower.glass'), lbox(K.a0 + 0.06, K.a1 - 0.06, Y_SHAFT, Y_CROWN + 0.6, K.b0 + 0.06, K.b1 - 0.06));
  L.add(M('hilton.stoneBand'), lbox(K.a0 + 0.9, K.a1 - 0.9, 0, Y_SHAFT, K.b0 + 0.9, K.b1 - 0.9));
  L.add(M('hilton.stoneBand'), lbox(K.a0, K.a1, 0, Y0, K.b0, K.b1));

  // --- base: brick piers, double-height glazing, white band, white pilaster storey, cornice ---
  const base = (f, n, id) => {
    const l = f.length;
    const bay = l / n;
    for (let i = 0; i <= n; i++) {
      const w = 1.4;
      const x = i === 0 ? w / 2 : i === n ? l - w / 2 : i * bay;
      L.add(stone, f.box(x - w / 2 - 0.1, x + w / 2 + 0.1, Y0, Y0 + 0.9, -0.9, 0.3));
      L.add(brick, f.box(x - w / 2, x + w / 2, Y0 + 0.9, Y_BRICK, -0.9, 0.2));
      L.add(white, f.box(x - 0.8, x + 0.8, Y_BAND, Y_PIL, -0.9, 0.2));
    }
    for (let i = 0; i < n; i++) {
      const a = (i === 0 ? 1.4 : i * bay + 0.7);
      const b = (i === n - 1 ? l - 1.4 : (i + 1) * bay - 0.7);
      L.add(M('ktower.baseGlass'), f.box(a, b, Y0 + 0.1, Y_BRICK, -0.85, -0.8));
      L.add(E('ktower.baseGlow'), f.box(a + 0.1, b - 0.1, Y0 + 0.3, Y_BRICK - 0.6, -0.78, -0.765));
      for (let k = 0; k <= 3; k++) {
        const x = a + ((b - a) * k) / 3;
        L.add(mull, f.box(x - 0.04, x + 0.04, Y0, Y_BRICK, -0.82, -0.7));
      }
      L.add(mull, f.box(a, b, 8.6, 8.68, -0.82, -0.7));
      L.add(M('ktower.baseGlass'), f.box(a + 0.1, b - 0.1, Y_BAND, Y_PIL, -0.45, -0.4));
      for (let k = 1; k < 4; k++) {
        const x = a + ((b - a) * k) / 4;
        L.add(mull, f.box(x - 0.035, x + 0.035, Y_BAND, Y_PIL, -0.42, -0.32));
      }
      if (rnd(id, i, 77) < 0.6) L.add(dim, f.box(a + 0.2, b - 0.2, Y_BAND + 0.2, Y_PIL - 0.2, -0.38, -0.365));
    }
    L.add(white, f.box(-0.25, l + 0.25, Y_BRICK, Y_BAND, -0.9, 0.3));
    L.add(white, f.box(-0.4, l + 0.4, Y_PIL, Y_SHAFT, -0.9, 0.45));
  };
  base(F.north, 6, 11);
  base(F.south, 6, 12);
  base(F.east, 4, 13);
  base(F.west, 4, 14);

  // --- shaft ---------------------------------------------------------------------------------------
  const floorLines = (f, x0, x1) => {
    for (let k = 0; k < FLOORS; k++) {
      const y = Y_SHAFT + k * FLOOR_H;
      L.add(sp, f.box(x0, x1, y, y + 1.05, 0, 0.06));
      L.add(mull, f.box(x0, x1, y + 1.05, y + 1.11, 0, 0.1));
      L.add(mull, f.box(x0, x1, y + 2.75, y + 2.8, 0, 0.09)); // transom: two panes per storey
    }
  };
  const corner = 1.9;
  const longFace = (f, id) => {
    L.add(panel, f.box(0, corner, Y_SHAFT, Y_CROWN, 0, 0.45));
    L.add(panel, f.box(len - corner, len, Y_SHAFT, Y_CROWN, 0, 0.45));
    floorLines(f, corner, len - corner);
    for (let i = 1; i < 6; i++) {
      const x = i * K.bay;
      // paired slim white fins with a shadow gap between (photos: double white lines)
      L.add(white, f.box(x - 0.42, x - 0.1, Y_SHAFT, Y_CROWN, 0, 0.6));
      L.add(white, f.box(x + 0.1, x + 0.42, Y_SHAFT, Y_CROWN, 0, 0.6));
      L.add(mull, f.box(x - 0.1, x + 0.1, Y_SHAFT, Y_CROWN, 0, 0.12));
    }
    for (let i = 0; i < 6; i++) {
      const a = i === 0 ? corner : i * K.bay + 0.42;
      const b = i === 5 ? len - corner : (i + 1) * K.bay - 0.42;
      const n = 4;
      for (let k = 1; k < n; k++) {
        const x = a + ((b - a) * k) / n;
        L.add(mull, f.box(x - 0.035, x + 0.035, Y_SHAFT, Y_CROWN, 0, 0.11));
      }
      // lit office floors at night: whole floors tend to be on or off
      for (let k = 0; k < FLOORS; k++) {
        const floorOn = rnd(id, k, 5);
        const p = floorOn < 0.22 ? 0.85 : floorOn < 0.5 ? 0.3 : 0.05;
        const y = Y_SHAFT + k * FLOOR_H;
        for (let h = 0; h < n; h++) {
          const r = rnd(id, i, k, h);
          if (r > p) continue;
          const p0 = a + ((b - a) * h) / n + 0.06;
          const p1 = a + ((b - a) * (h + 1)) / n - 0.06;
          L.add(r < p * 0.6 ? lit : dim, f.box(p0, p1, y + 1.14, y + FLOOR_H - 0.04, 0.015, 0.04));
        }
      }
    }
  };
  longFace(F.north, 21);
  longFace(F.south, 22);
  const shortFace = (f, id) => {
    // white corner | glass strip | solid white core wall | glass strip | white corner
    const g = 5.4;
    L.add(panel, f.box(0, corner, Y_SHAFT, Y_CROWN, 0, 0.45));
    L.add(panel, f.box(depth - corner, depth, Y_SHAFT, Y_CROWN, 0, 0.45));
    L.add(panel, f.box(corner + g, depth - corner - g, Y_SHAFT, Y_CROWN, 0, 0.3));
    for (const [a, b] of [[corner, corner + g], [depth - corner - g, depth - corner]]) {
      floorLines(f, a, b);
      for (let k = 1; k < 3; k++) {
        const x = a + ((b - a) * k) / 3;
        L.add(mull, f.box(x - 0.035, x + 0.035, Y_SHAFT, Y_CROWN, 0, 0.11));
      }
      L.add(white, f.box(a - 0.02, a + 0.16, Y_SHAFT, Y_CROWN, 0, 0.5));
      L.add(white, f.box(b - 0.16, b + 0.02, Y_SHAFT, Y_CROWN, 0, 0.5));
      for (let k = 0; k < FLOORS; k++) {
        if (rnd(id, a | 0, k) > 0.22) continue;
        const y = Y_SHAFT + k * FLOOR_H;
        L.add(dim, f.box(a + 0.2, b - 0.2, y + 1.14, y + FLOOR_H - 0.04, 0.015, 0.04));
      }
    }
    // joints of the core panels: vertical every 3.5 m, horizontal every storey
    const c0 = corner + g;
    const c1 = depth - corner - g;
    for (let x = c0 + 3.5; x < c1 - 1; x += 3.5) L.add(white, f.box(x - 0.04, x + 0.04, Y_SHAFT, Y_CROWN, 0.3, 0.38));
    for (let k = 1; k < FLOORS; k++) L.add(M('ktower.fin'), f.box(c0, c1, Y_SHAFT + k * FLOOR_H - 0.02, Y_SHAFT + k * FLOOR_H + 0.02, 0.3, 0.33));
  };
  shortFace(F.east, 23);
  shortFace(F.west, 24);

  // --- crown: white frame band and thin projecting cap; outline light at night -----------------
  for (const f of [F.north, F.south, F.east, F.west]) {
    const l = f.length;
    L.add(panel, f.box(-0.45, l + 0.45, Y_CROWN, K.top - 0.45, 0, 0.45));
    L.add(white, f.box(-0.8, l + 0.8, K.top - 0.45, K.top, 0, 0.8));
    L.add(E('ktower.crownLight'), f.box(-0.78, l + 0.78, K.top - 0.55, K.top - 0.45, 0.45, 0.8));
    L.add(E('ktower.crownLight'), f.box(-0.02, 0.1, Y_SHAFT + 2, Y_CROWN, 0.45, 0.5));
  }
  L.add(M('ktower.roof'), lbox(K.a0 + 0.5, K.a1 - 0.5, K.top - 1.3, K.top - 1.2, K.b0 + 0.5, K.b1 - 0.5));
  L.add(panel, lbox(K.a0 + 7, K.a1 - 7, K.top - 1.3, K.top + 3.8, K.b0 + 6, K.b1 - 6));
  // red obstruction lights on the roof corners
  for (const a of [K.a0 + 0.3, K.a1 - 0.6]) for (const b of [K.b0 + 0.3, K.b1 - 0.6]) L.add(E('ktower.cornerLight'), lbox(a, a + 0.3, K.top, K.top + 0.35, b, b + 0.3));

  bag.absorb(L, HF);
}

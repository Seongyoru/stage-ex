// Arena Tent (merchandise, sawtooth white membrane on galvanised H-columns, on the Arena
// Deck along the house-left diagonal) and Bay Tent (white angular canopy on six black
// posts over the Music Terrace Stage).
import { M, E } from './mats.js';
import { Bag, Tris, beam, frame, lbox, tube } from './kit.js';
import { ARENA_TENT, BAY_TENT, FACET_L, Y_DECK, Y_PLAZA } from './layout.js';

export function buildTents(bag) {
  arenaTent(bag);
  bayTent(bag);
}

function arenaTent(bag) {
  const T = ARENA_TENT;
  // frame along the facet: a = station t, b = −offset (b grows toward the arena)
  const f = frame(FACET_L.c[0], FACET_L.c[1], FACET_L.d[0], FACET_L.d[1]);
  const L = new Bag();
  const steel = M('precinct.tentFrame');
  const skin = M('precinct.tentMembrane');
  const y0 = Y_DECK;
  const ye = y0 + T.eaves;
  const yr = y0 + T.ridge;
  const bOut = -T.off1; // toward the deck edge
  const bIn = -T.off0; // toward the arena
  const bay = (T.t1 - T.t0) / T.gables;
  const LV = 3;
  const m = new Tris();
  for (let i = 0; i <= T.gables; i++) {
    const a = T.t0 + i * bay;
    for (const b of [bOut, bIn]) L.add(steel, lbox(a - 0.1, a + 0.1, y0, ye, b - 0.1, b + 0.1), LV);
    L.add(steel, lbox(a - 0.06, a + 0.06, ye - 0.2, ye, bOut, bIn), LV); // valley beam / gutter
  }
  for (const b of [bOut, bIn]) L.add(steel, lbox(T.t0, T.t1, ye - 0.22, ye, b - 0.07, b + 0.07), LV);
  for (let i = 0; i < T.gables; i++) {
    const a0 = T.t0 + i * bay;
    const a1 = a0 + bay;
    const am = (a0 + a1) / 2;
    // two roof slopes per gable, gable triangles at both ends, ridge tube
    m.quad([a0, ye, bOut - 0.35], [am, yr, bOut - 0.35], [am, yr, bIn + 0.35], [a0, ye, bIn + 0.35], [-1, 1, 0]);
    m.quad([am, yr, bOut - 0.35], [a1, ye, bOut - 0.35], [a1, ye, bIn + 0.35], [am, yr, bIn + 0.35], [1, 1, 0]);
    m.tri([a0, ye, bOut], [a1, ye, bOut], [am, yr, bOut]);
    m.tri([a0, ye, bIn], [am, yr, bIn], [a1, ye, bIn]);
    L.add(steel, tube([am, yr - 0.04, bOut - 0.3], [am, yr - 0.04, bIn + 0.3], 0.045, 6), LV);
    // warm glow of the lit gables at night
    // warm glow of the lit gables at night (a lit panel just outside each membrane gable)
    for (const [b, s] of [[bOut, -1], [bIn, 1]]) {
      const g = new Tris();
      g.tri([a0 + 0.12, ye + 0.05, b + s * 0.03], [a1 - 0.12, ye + 0.05, b + s * 0.03], [am, yr - 0.12, b + s * 0.03]);
      g.tri([a0 + 0.12, ye + 0.05, b + s * 0.03], [am, yr - 0.12, b + s * 0.03], [a1 - 0.12, ye + 0.05, b + s * 0.03]);
      L.add(E('precinct.tentGlow'), g.build(), LV);
    }
    L.add(E('precinct.tentGlow'), lbox(a0 + 0.25, a1 - 0.25, ye - 0.26, ye - 0.22, bOut + 0.3, bIn - 0.3), LV);
  }
  // curtain wall toward the deck edge (closed), end curtains, open sales side toward the arena
  m.quad([T.t0, y0 + 0.05, bOut], [T.t1, y0 + 0.05, bOut], [T.t1, ye - 0.22, bOut], [T.t0, ye - 0.22, bOut], [0, 0, -1]);
  for (const a of [T.t0, T.t1]) m.quad([a, y0 + 0.05, bOut], [a, y0 + 0.05, bIn], [a, ye - 0.22, bIn], [a, ye - 0.22, bOut]);
  L.add(skin, m.build(), LV);
  // sales counters and the two tube rails along the open front
  L.add(M('precinct.deckFascia'), lbox(T.t0 + 0.3, T.t1 - 0.3, y0, y0 + 1.0, bIn - 1.3, bIn - 0.6), LV);
  for (const h of [0.55, 1.05]) L.add(steel, tube([T.t0, y0 + h, bIn + 0.9], [T.t1, y0 + h, bIn + 0.9], 0.03, 6), LV);
  for (let i = 0; i <= T.gables; i += 2) {
    const a = T.t0 + i * bay;
    L.add(steel, tube([a, y0, bIn + 0.9], [a, y0 + 1.05, bIn + 0.9], 0.03, 6), LV);
  }
  bag.absorb(L, f);
}

function bayTent(bag) {
  const B = BAY_TENT;
  // local frame: a along the long axis (world X), b across; origin at the centre
  const f = frame(B.cx, B.cz, 1, 0);
  const L = new Bag();
  const post = M('precinct.railing');
  const white = M('precinct.bayTentFrame');
  const skin = M('precinct.tentMembrane');
  const y0 = Y_PLAZA;
  const hx = B.len / 2;
  const hz = B.depth / 2;
  // roof plane: mono-pitch, high toward the plaza (−b side faces the Big Steps)
  const yRoof = (b) => y0 + B.height - 0.55 + ((-b + hz + 1.6) / (2 * hz + 3.2)) * 0.9 - 0.35;
  // six black posts
  for (const a of [-hx + 0.6, 0, hx - 0.6]) for (const b of [-hz + 0.6, hz - 0.6]) L.add(post, tube([a, y0, b], [a, yRoof(b) - 0.5, b], 0.11, 10));
  // angular roof outline (chamfered hexagon with a pointed prow toward the arena side)
  const o = 1.6;
  const ring = [
    [-hx - o, -hz + 0.6],
    [-hx + 2.0, -hz - o],
    [hx - 2.0, -hz - o],
    [hx + o, -hz + 0.6],
    [hx + o * 0.6, hz + o * 0.5],
    [-hx - o * 0.6, hz + o * 0.5],
  ];
  const t = new Tris();
  const th = 0.42;
  for (let i = 1; i < ring.length - 1; i++) {
    const A = ring[0];
    const Bp = ring[i];
    const C = ring[i + 1];
    t.triN([A[0], yRoof(A[1]), A[1]], [Bp[0], yRoof(Bp[1]), Bp[1]], [C[0], yRoof(C[1]), C[1]], [0, 1, 0]);
    t.triN([A[0], yRoof(A[1]) - th, A[1]], [Bp[0], yRoof(Bp[1]) - th, Bp[1]], [C[0], yRoof(C[1]) - th, C[1]], [0, -1, 0]);
  }
  for (let i = 0; i < ring.length; i++) {
    const A = ring[i];
    const Bp = ring[(i + 1) % ring.length];
    t.quad([A[0], yRoof(A[1]) - th, A[1]], [Bp[0], yRoof(Bp[1]) - th, Bp[1]], [Bp[0], yRoof(Bp[1]), Bp[1]], [A[0], yRoof(A[1]), A[1]], [Bp[1] - A[1], 0, -(Bp[0] - A[0])]);
  }
  L.add(skin, t.build());
  // white steel frame under the membrane: edge trusses and cross beams with diagonals
  const yb = (b) => yRoof(b) - th - 0.3;
  for (const b of [-hz + 0.6, hz - 0.6]) L.add(white, beam([-hx, yb(b), b], [hx, yb(b), b], 0.18, 0.4));
  for (let k = 0; k <= 6; k++) {
    const a = -hx + 0.6 + ((2 * hx - 1.2) * k) / 6;
    L.add(white, beam([a, yb(-hz + 0.6), -hz + 0.6], [a, yb(hz - 0.6), hz - 0.6], 0.12, 0.3));
    if (k < 6) {
      const a2 = -hx + 0.6 + ((2 * hx - 1.2) * (k + 1)) / 6;
      L.add(white, tube(k % 2 ? [a, yb(-hz + 0.6), -hz + 0.6] : [a, yb(hz - 0.6), hz - 0.6], k % 2 ? [a2, yb(hz - 0.6), hz - 0.6] : [a2, yb(-hz + 0.6), -hz + 0.6], 0.04, 6));
    }
  }
  // two hanging loudspeakers (photo B4)
  for (const a of [-2.6, 2.6]) L.add(M('precinct.totem'), lbox(a - 0.25, a + 0.25, yb(0) - 0.75, yb(0) - 0.1, -0.2, 0.2));
  bag.absorb(L, f);
}

// Low-rise annex north of the hotel (PLATEAU 14100-bldg-1007199): 3 tall storeys of
// granite-clad square piers with dark glazing and a dark hipped roof (walls +18.65,
// roof +21.4), and the 2-storey glazed link wing with a planted roof terrace between the
// pavilion and the hotel's north face.
import { cylinder, prism } from '../../core/geom.js';
import { M, E } from './mats.js';
import { Bag, band, beam, lbox } from './kit.js';
import { rectFaces } from './facade.js';
import { HF, LINK, PAVILION, PF, Y_PLAZA } from './layout.js';

export function buildAnnex(bag, ctx) {
  pavilion(bag, ctx);
  link(bag, ctx);
}

function pavilion(bag) {
  const L = new Bag();
  const P = PAVILION;
  const granite = M('annex.granite');
  const bandM = M('annex.band');
  const glass = M('annex.glass');
  const fr = M('annex.frame');
  const yE = P.yEaves;
  const floors = [Y_PLAZA, 9.6, 14.2]; // storey lines above the plaza; ground storey below
  // cores
  L.add(M('hilton.stoneBand'), lbox(P.se.a0 + 0.8, P.se.a1 - 0.8, 0, yE, P.se.b0 + 0.8, P.se.b1 + 0.5));
  L.add(M('hilton.stoneBand'), lbox(P.nw.a0 + 0.8, P.nw.a1 - 0.8, 0, yE, P.nw.b0 - 0.5, P.nw.b1 - 0.8));

  // one elevation: piers, spandrel bands, glazing with black mullions
  const elevation = (f, n, { y0 = Y_PLAZA, skipFirst = false, skipLast = false } = {}) => {
    const l = f.length;
    const bay = (l - 1.3) / n;
    for (let i = 0; i <= n; i++) {
      if ((i === 0 && skipFirst) || (i === n && skipLast)) continue;
      const x = 0.65 + i * bay;
      L.add(granite, f.box(x - 0.65, x + 0.65, y0, yE - 0.65, -0.8, 0.12));
      L.add(granite, f.box(x - 0.75, x + 0.75, y0, y0 + 0.6, -0.8, 0.22));
      L.add(bandM, f.box(x - 0.72, x + 0.72, yE - 1.0, yE - 0.65, -0.8, 0.19));
    }
    for (let i = 0; i < n; i++) {
      const a = 0.65 + i * bay + 0.65;
      const b = 0.65 + (i + 1) * bay - 0.65;
      L.add(glass, f.box(a, b, y0, yE - 0.65, -0.55, -0.5));
      L.add(E('annex.glow'), f.box(a + 0.1, b - 0.1, Math.max(y0, Y_PLAZA) + 0.3, yE - 1.0, -0.48, -0.465));
      for (const y of [...floors.slice(1), 0].filter((v) => v > y0 + 0.5)) {
        L.add(bandM, f.box(a, b, y - 0.55, y + 0.1, -0.6, -0.25));
        L.add(fr, f.box(a, b, y + 0.1, y + 0.18, -0.52, -0.38));
      }
      for (let k = 0; k <= 4; k++) {
        const x = a + ((b - a) * k) / 4;
        L.add(fr, f.box(x - 0.04, x + 0.04, y0, yE - 0.65, -0.52, -0.38));
      }
      // small black balconies at the first upper storey (photo B1)
      if (y0 >= Y_PLAZA) L.add(fr, f.box(a + 0.3, b - 0.3, 9.7, 10.75, -0.3, -0.24));
    }
    // white entablature and cornice
    L.add(bandM, f.box(-0.1, l + 0.1, yE - 0.65, yE - 0.2, -0.8, 0.2));
    L.add(bandM, f.box(-0.4, l + 0.4, yE - 0.2, yE, -0.8, 0.5));
  };
  const se = rectFaces(P.se.a0, P.se.a1, P.se.b0, P.se.b1);
  const nw = rectFaces(P.nw.a0, P.nw.a1, P.nw.b0, P.nw.b1);
  // plaza side (b = 0 face is "south" in rectFaces terms) and the two ends stand on the plaza level
  elevation(se.south, 4);
  elevation(se.east, 2);
  elevation(se.west, 2);
  // street side: full height from the ground (hotel porte cochère at ground level)
  elevation(nw.north, 4, { y0: 0 });
  elevation(nw.east, 2, { y0: 0 });
  elevation(nw.west, 2, { y0: 0 });
  // short returns where the two blocks step
  L.add(granite, lbox(P.se.a0, P.nw.a0 + 0.1, Y_PLAZA, yE, P.se.b1 - 0.9, P.se.b1 + 0.12));
  L.add(granite, lbox(P.nw.a1 - 0.1, P.se.a1, Y_PLAZA, yE, P.se.b1 - 0.9, P.se.b1 + 0.12));

  // hipped roof with flat top: dark metal, white hips and ribs
  const ring = [
    [P.se.a0, P.se.b0],
    [P.se.a1, P.se.b0],
    [P.se.a1, P.se.b1],
    [P.nw.a1, P.nw.b1],
    [P.nw.a0, P.nw.b1],
    [P.se.a0, P.se.b1],
  ];
  const grow = (d) => {
    // ring is counter-clockwise in (a, b); outward normal of edge p→q is (db, −da)
    const n = ring.length;
    return ring.map((p, i) => {
      const a = ring[(i + n - 1) % n];
      const c = ring[(i + 1) % n];
      const n0 = unitN(a, p);
      const n1 = unitN(p, c);
      const k = d / (1 + n0[0] * n1[0] + n0[1] * n1[1]);
      return [p[0] + (n0[0] + n1[0]) * k, p[1] + (n0[1] + n1[1]) * k];
    });
  };
  const outer = grow(0.45);
  const inner = grow(-3.0);
  L.add(M('annex.roof'), band(outer, yE, inner, P.yTop));
  // flat top
  L.add(M('annex.roof'), prism(inner, P.yTop - 0.05, P.yTop, { bottom: false, sides: false }));
  const trim = M('annex.roofTrim');
  for (let i = 0; i < outer.length; i++) {
    L.add(trim, beam([outer[i][0], yE + 0.03, outer[i][1]], [inner[i][0], P.yTop + 0.03, inner[i][1]], 0.22, 0.12));
    const j = (i + 1) % outer.length;
    L.add(trim, beam([inner[i][0], P.yTop + 0.03, inner[i][1]], [inner[j][0], P.yTop + 0.03, inner[j][1]], 0.2, 0.1));
    // ribs along the slope at about 7 m
    const len = Math.hypot(outer[j][0] - outer[i][0], outer[j][1] - outer[i][1]);
    const nr = Math.round(len / 7);
    for (let k = 1; k < nr; k++) {
      const t = k / nr;
      L.add(trim, beam(
        [outer[i][0] + (outer[j][0] - outer[i][0]) * t, yE + 0.03, outer[i][1] + (outer[j][1] - outer[i][1]) * t],
        [inner[i][0] + (inner[j][0] - inner[i][0]) * t, P.yTop + 0.03, inner[i][1] + (inner[j][1] - inner[i][1]) * t],
        0.14, 0.08,
      ));
    }
  }
  bag.absorb(L, PF);
}
function unitN(p, q) {
  const dx = q[0] - p[0];
  const dz = q[1] - p[1];
  const l = Math.hypot(dx, dz) || 1;
  return [dz / l, -dx / l];
}
// Glazed link wing on white columns; roof terrace with planters (Hilton frame).
function link(bag) {
  const L = new Bag();
  const K = LINK;
  const glass = M('annex.linkGlass');
  const fr = M('annex.frame');
  const white = M('precinct.deckFascia');
  L.add(glass, lbox(K.a0 + 0.08, K.a1 - 0.08, K.y0 + 0.4, K.y1, K.b0 + 0.3, K.b1 - 0.08));
  L.add(white, lbox(K.a0 - 0.2, K.a1 + 0.2, K.y0, K.y0 + 0.4, K.b0 + 0.3, K.b1 + 0.2));
  L.add(white, lbox(K.a0 - 0.45, K.a1 + 0.45, K.y1, K.y1 + 0.32, K.b0 + 0.3, K.b1 + 0.45));
  const F = rectFaces(K.a0, K.a1, K.b0, K.b1);
  for (const f of [F.north, F.east, F.west]) {
    const n = Math.round(f.length / 1.25);
    for (let i = 0; i <= n; i++) {
      const x = (f.length * i) / n;
      L.add(fr, f.box(x - 0.035, x + 0.035, K.y0 + 0.4, K.y1, -0.08, 0.06));
    }
    L.add(fr, f.box(0, f.length, (K.y0 + K.y1) / 2 + 0.1, (K.y0 + K.y1) / 2 + 0.3, -0.08, 0.05));
    L.add(E('annex.glow'), f.box(0.3, f.length - 0.3, K.y0 + 0.7, (K.y0 + K.y1) / 2, -0.06, -0.045));
  }
  // roof terrace: timber deck, planter boxes with shrubs along the edges, black railing posts
  L.add(M('annex.terrace'), lbox(K.a0, K.a1, K.y1 + 0.32, K.y1 + 0.36, K.b0 + 0.5, K.b1));
  const planter = M('precinct.planter');
  const green = M('precinct.planting');
  for (const [a0, a1, b0, b1] of [
    [K.a0 + 0.1, K.a0 + 1.0, K.b0 + 2, K.b1 - 0.1],
    [K.a1 - 1.0, K.a1 - 0.1, K.b0 + 2, K.b1 - 0.1],
    [K.a0 + 1.0, K.a1 - 1.0, K.b1 - 1.0, K.b1 - 0.1],
  ]) {
    L.add(planter, lbox(a0, a1, K.y1 + 0.36, K.y1 + 1.0, b0, b1));
    L.add(green, lbox(a0 + 0.08, a1 - 0.08, K.y1 + 1.0, K.y1 + 1.7, b0 + 0.08, b1 - 0.08));
  }
  bag.absorb(L, HF);
  // columns carrying the wing (the hotel entrance passes below)
  const col = M('precinct.deckFascia');
  for (const a of [K.a0 + 0.6, K.a1 - 0.6]) {
    for (let b = K.b0 + 5.5; b <= K.b1 - 0.5; b += 5.6) {
      const x = HF.ox + a * HF.ux + b * HF.vx;
      const z = HF.oz + a * HF.uz + b * HF.vz;
      bag.add(col, cylinder(x, z, Y_PLAZA, K.y0, 0.32, 14));
    }
  }
}

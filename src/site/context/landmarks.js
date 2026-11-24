// Individual treatments of the named neighbours. Each function receives the baked
// building record and builds all of its volumes; anything not listed here goes through
// the generic families in massing.js.
//
// What the treatments are based on (photos and data are cited in research/exterior-site.md
// section 12 and research/geo-data.md):
//   anpanman     Yokohama Anpanman Children's Museum & Mall (2019): white 3-storey box, 17.9 m
//                (PLATEAU). South front toward Tochinoki-dori: two open terraces with glass
//                balustrades under a deep flat roof on white V-struts, glazed walls behind,
//                a rainbow stair up to level 2, a round column at the corner; plain white
//                east wall with the round sign, grey panel walls west and north.
//                (Commons: Yokohama_Anpanman_Children's_Museum_2019_-_01.jpg, _07.jpg.)
//                The character artwork itself is NOT reproduced: plain coloured discs stand in.
//   fujifilm     FUJIFILM Business Innovation: oval 21-storey teal glass tower, 99 m roof /
//                105 m top, with two round louvred drums and a helipad on the roof (aerial
//                photo B10, satellite), on white curved low wings of 10 and 15 m.
//   grangate     Yokohama Grangate: 99.5 m dark glass slab with a white frame.
//   okbuilding   OK Minatomirai building: grey metal-panel block, 37 m roof, plant to 52.4 m.
//   keihinport   Keihin Port Office: white 4-storey office, 16.5 m, roof pergola (satellite).
//   kahala       The Kahala: blue glass tower with white slab edges on a 11 m podium.
import { WHITE, signedArea, centroid, pointInRing, insetRing, obb, principalAngle, wallQuad, ringWalls, cap, ringStrip, boxO, strut, cylinder, circleRing, wallDisc, rgb } from './builder.js';
import { STYLES } from './styles.js';
import { volume, shade, styleFor, tintFor, roofUnits, helipadBlock, aviationLights } from './massing.js';
import { worldDirOfBearing } from '../../core/frame.js';

const RAINBOW = ['#e8442e', '#f39a1e', '#f6d32b', '#3fae49', '#2f7fd0', '#7d4fb3'].map(rgb);

function anpanman(env, b) {
  const B = env.B;
  const vol = b.vols[b.vols.length - 1];
  const ring = vol.ring;
  const n = ring.length;
  const yTop = vol.y1; // 17.9
  const fascia = 1.6;
  const ySoffit = yTop - fascia;
  const L2 = 5.6;
  const L3 = 11.2;
  const south = worldDirOfBearing(180);
  const west = worldDirOfBearing(270);
  // front = the edge that faces south (Tochinoki-dori)
  let f = 0;
  let best = -2;
  const edges = [];
  for (let i = 0; i < n; i++) {
    const a = ring[i];
    const c = ring[(i + 1) % n];
    const len = Math.hypot(c[0] - a[0], c[1] - a[1]);
    const e = { i, a, b: c, len, nx: (c[1] - a[1]) / len, nz: -(c[0] - a[0]) / len };
    edges.push(e);
    const d = e.nx * south[0] + e.nz * south[1];
    if (d > best) {
      best = d;
      f = i;
    }
  }
  const F = edges[f];
  const T = 11; // depth of the open terrace zone behind the roof edge
  const wall = B.get('context.anpanman.wall');
  const side = B.get('context.anpanman.sideWall');
  const glass = B.get('context.anpanman.glass');
  const trim = B.get('context.trim');
  const accent = B.get('context.anpanman.accent');
  const rail = B.get('context.residential.balconyGlass');
  const white = rgb('#f1f1ee');
  // unit vectors: t along the front (a -> b), inward = -normal
  const tx = (F.b[0] - F.a[0]) / F.len;
  const tz = (F.b[1] - F.a[1]) / F.len;
  const inx = -F.nx;
  const inz = -F.nz;
  const P = (s, d) => [F.a[0] + tx * s + inx * d, F.a[1] + tz * s + inz * d]; // s along the front, d behind it
  const westAtA = tx * west[0] + tz * west[1] < 0; // is end "a" the west end?
  const sW = (s) => (westAtA ? s : F.len - s); // distance measured from the WEST end -> s along a->b

  // --- core box behind the terraces (walls per side) ---
  for (const e of edges) {
    if (e.i === f) continue;
    const facesWest = e.nx * west[0] + e.nz * west[1] > 0.5;
    const facesNorth = e.nx * south[0] + e.nz * south[1] < -0.5;
    const grey = facesWest || facesNorth;
    // side walls stop T short of the front, where the terraces are open
    let a = e.a;
    let c = e.b;
    const nearA = Math.hypot(a[0] - F.a[0], a[1] - F.a[1]) < 0.01 || Math.hypot(a[0] - F.b[0], a[1] - F.b[1]) < 0.01;
    const nearB = Math.hypot(c[0] - F.a[0], c[1] - F.a[1]) < 0.01 || Math.hypot(c[0] - F.b[0], c[1] - F.b[1]) < 0.01;
    const k = Math.min(0.45, T / e.len);
    if (nearA) a = [a[0] + (c[0] - a[0]) * k, a[1] + (c[1] - a[1]) * k];
    if (nearB) c = [c[0] + (a[0] - c[0]) * k, c[1] + (a[1] - c[1]) * k];
    const len = Math.hypot(c[0] - a[0], c[1] - a[1]);
    if (grey) {
      wallQuad(side, a, c, 0, ySoffit - 2.2, e.nx, e.nz, 0, len, 0, ySoffit - 2.2);
      wallQuad(wall, a, c, ySoffit - 2.2, ySoffit, e.nx, e.nz, 0, len, ySoffit - 2.2, ySoffit, white);
    } else {
      wallQuad(wall, a, c, 0, ySoffit, e.nx, e.nz, 0, len, 0, ySoffit, white);
      // round sign and a row of coloured letter tiles on the white east wall, near the front
      const sx = nearA ? 9 : len - 9;
      const dirx = (c[0] - a[0]) / len;
      const dirz = (c[1] - a[1]) / len;
      const sp = [a[0] + dirx * sx, 12.6, a[1] + dirz * sx];
      wallDisc(accent, sp, e.nx, e.nz, 2.1, 0.12, rgb('#e8552e'));
      wallDisc(accent, sp, e.nx, e.nz, 1.75, 0.16, rgb('#f6a03c'));
      for (let i = 0; i < 7; i++) {
        const s0 = sx + (nearA ? 1 : -1) * (3.2 + i * 1.15);
        const q0 = [a[0] + dirx * (s0 - 0.45) + e.nx * 0.1, a[1] + dirz * (s0 - 0.45) + e.nz * 0.1];
        const q1 = [a[0] + dirx * (s0 + 0.45) + e.nx * 0.1, a[1] + dirz * (s0 + 0.45) + e.nz * 0.1];
        wallQuad(accent, q0, q1, 12.15, 13.05, e.nx, e.nz, 0, 0.9, 0, 0.9, RAINBOW[i % 6]);
      }
      // three plain discs low on the far part of the wall (where the mural is)
      const far = nearA ? len - 10 : 10;
      ['#e8442e', '#5a3f9a', '#f39a1e'].forEach((h, i) => {
        const s0 = far + (nearA ? -1 : 1) * i * 6.4;
        wallDisc(accent, [a[0] + dirx * s0, 4.4, a[1] + dirz * s0], e.nx, e.nz, 2.3, 0.1, rgb(h));
      });
    }
  }
  // --- glazed front of the core, set back T ---
  const g0 = P(0, T);
  const g1 = P(F.len, T);
  const nbGlass = Math.max(1, Math.round(F.len / 6));
  for (const [ya, yb] of [[0, L2 - 0.5], [L2, L3 - 0.5], [L3, ySoffit]]) {
    wallQuad(glass, g0, g1, ya, yb, F.nx, F.nz, 0, nbGlass * 6, 0, 6);
  }
  // --- roof slab: thick white fascia all round, soffit over the terraces ---
  ringWalls(wall, ring, ySoffit, yTop, white);
  cap(B.get('context.roof.light'), ring, yTop, true);
  const terr = [P(0, 0), P(F.len, 0), P(F.len, T), P(0, T)];
  if (signedArea(terr) < 0) terr.reverse();
  cap(trim, terr, ySoffit, false, shade(white, 0.86));
  // --- terrace slabs with glass balustrades (level 2 reaches the roof line, level 3 is 2.5 m back) ---
  const slab = (y, front, s0, s1) => {
    const q = [P(s0, front), P(s1, front), P(s1, T), P(s0, T)];
    if (signedArea(q) < 0) q.reverse();
    cap(trim, q, y, true, shade(white, 0.8));
    cap(trim, q, y - 0.55, false, shade(white, 0.7));
    const a = P(s0, front);
    const c = P(s1, front);
    wallQuad(wall, a, c, y - 0.55, y + 0.12, F.nx, F.nz, 0, s1 - s0, 0, 0.67, white);
    wallQuad(rail, a, c, y + 0.12, y + 1.2, F.nx, F.nz, 0, s1 - s0, 0, 1.08);
    // returns at both ends
    for (const [s, sgn] of [[s0, -1], [s1, 1]]) {
      const p0 = P(s, front);
      const p1 = P(s, T);
      wallQuad(wall, p0, p1, y - 0.55, y + 0.12, tx * sgn, tz * sgn, 0, T - front, 0, 0.67, white);
      wallQuad(rail, p0, p1, y + 0.12, y + 1.2, tx * sgn, tz * sgn, 0, T - front, 0, 1.08);
    }
  };
  slab(L2, 0.8, 1.2, F.len - 1.2);
  slab(L3, 3.2, 1.2, F.len - 1.2);
  // --- V-struts from the level-3 terrace to the roof ---
  const nV = Math.max(3, Math.round((F.len - 14) / 9));
  for (let i = 0; i < nV; i++) {
    const s = 7 + ((i + 0.5) / nV) * (F.len - 14);
    const foot = P(s, 4.6);
    for (const k of [-1, 1]) {
      const head = P(s + k * 2.3, 4.6);
      strut(trim, [foot[0], L3, foot[1]], [head[0], ySoffit, head[1]], 0.5, white);
    }
  }
  // posts under the terraces and the tall round corner column
  for (let i = 0; i <= nV; i++) {
    const s = 7 + (i / nV) * (F.len - 14);
    const p = P(s, 2.2);
    cylinder(trim, p[0], p[1], 0, L2 - 0.55, 0.3, 10, white, { top: false });
    const p2 = P(s, 4.6);
    cylinder(trim, p2[0], p2[1], L2, L3 - 0.55, 0.26, 10, white, { top: false });
  }
  const colW = P(sW(3.2), 2.6);
  cylinder(trim, colW[0], colW[1], 0, ySoffit, 0.55, 14, white, { top: false });
  // --- rainbow stair up to level 2, rising along the front from the west end ---
  const steps = 14;
  const rise = L2 / steps;
  const going = 0.95;
  const stairW = 5.2;
  const dir = westAtA ? 1 : -1;
  const sStart = sW(6);
  for (let i = 0; i < steps; i++) {
    const s = sStart + dir * (i + 0.5) * going;
    const c = P(s, -stairW / 2 + 0.4);
    boxO(accent, c[0], c[1], 0, (i + 1) * rise, going / 2, stairW / 2 - 0.3, Math.atan2(tz, tx), RAINBOW[Math.floor(i / 2.34) % 6], { top: true });
    for (const k of [-1, 1]) {
      const w = P(s, -stairW / 2 + 0.4 + k * (stairW / 2 - 0.15));
      boxO(trim, w[0], w[1], 0, (i + 1) * rise + 1.0, going / 2 + 0.01, 0.15, Math.atan2(tz, tx), white);
    }
  }
  // landing bridging the stair top to the level-2 terrace
  {
    const s = sStart + dir * (steps + 1.2) * going;
    const c = P(s, -stairW / 2 + 0.4);
    boxO(trim, c[0], c[1], 0, L2, going * 1.3, stairW / 2, Math.atan2(tz, tx), shade(white, 0.9));
    // round sign on the grey wall end by the stair
    const sp = P(sW(4.5), T - 0.15);
    wallDisc(accent, [sp[0], 8.6, sp[1]], F.nx, F.nz, 1.5, 0.05, rgb('#e8552e'));
  }
  // --- roof plant ---
  const inner = insetRing(ring, 4) || ring;
  if (!env.low) roofUnits(env, b, inner, yTop, { maxH: 1.6, density: 330, margin: 3 });
}

function fujifilm(env, b) {
  const B = env.B;
  for (const vol of b.vols) {
    if (vol.y1 < 50) {
      volume(env, b, vol, STYLES.fujifilmLow, { parapet: 0.9 });
      continue;
    }
    const top = vol.top || vol.y1 + 6;
    const r = volume(env, b, { ...vol, top: undefined }, STYLES.fujifilmTower, { parapet: 1.4, noRoofStuff: true });
    // two round louvred drums on the long axis of the oval; the larger one carries the helipad
    const ang = principalAngle(r.ring);
    const ob = obb(r.ring, ang);
    const drum = B.get('context.fujifilm.drum');
    const trim = B.get('context.trim');
    const lip = rgb('#d6d9d9');
    const mk = (k, rad, h, pad) => {
      const cx = ob.cx + ob.ux * ob.hu * k;
      const cz = ob.cz + ob.uz * ob.hu * k;
      const o1 = circleRing(cx, cz, rad, 28);
      const o2 = circleRing(cx, cz, rad - 0.4, 28);
      ringWalls(drum, o1, r.yr, r.yr + h, WHITE);
      ringWalls(drum, o2, r.yr, r.yr + h, shade(WHITE, 0.78), true);
      ringStrip(trim, o1, o2, r.yr + h, true, lip);
      if (pad) helipadBlock(env, [cx, cz], rad * 0.52, ang, r.yr, r.yr + h + 0.4, 'H');
      else boxO(B.get('context.plant.penthouse'), cx, cz, r.yr, r.yr + h - 0.8, rad * 0.5, rad * 0.36, ang, WHITE, { topBuf: B.get('context.roof.membrane') });
    };
    mk(-0.3, ob.hv * 0.56, top - r.yr, true);
    mk(0.42, ob.hv * 0.44, (top - r.yr) * 0.8, false);
    aviationLights(env, r.ring, r.yt + 0.45);
  }
}

function grangate(env, b) {
  for (const vol of b.vols) {
    if (vol.y1 > 40) volume(env, b, { ...vol, top: Math.max(vol.top || 0, vol.y1 + 5) }, STYLES.officeDark, {});
    else volume(env, b, vol, styleFor(b, vol), {});
  }
}

function okbuilding(env, b) {
  for (const vol of b.vols) {
    const H = vol.y1 - vol.y0;
    const big = signedArea(vol.ring) > 600;
    if (H >= 20 && big) volume(env, b, vol, STYLES.okPanel, { levels: null });
    else if (H >= 20) volume(env, b, vol, STYLES.okBlind, {}); // stair / lift cores: blank panels
    else if (vol.material === 'glass') volume(env, b, vol, STYLES.shop, { noRoofStuff: true });
    else volume(env, b, vol, H < 6.5 ? STYLES.shop : STYLES.commercial, {});
  }
}

function keihinport(env, b) {
  const B = env.B;
  for (const vol of b.vols) {
    const r = volume(env, b, vol, STYLES.civic, { noRoofStuff: true });
    // white steel pergola over the roof terrace (visible as a grid in the satellite image)
    const trim = B.get('context.trim');
    const white = rgb('#e9e9e5');
    const ring = r.inner || r.ring;
    const ob = obb(ring);
    const y = r.yr + 2.7;
    const hu = ob.hu * 0.7;
    const hv = ob.hv * 0.62;
    for (let i = 0; i <= 5; i++) {
      const u = -hu + (i / 5) * 2 * hu;
      boxO(trim, ob.cx + ob.ux * u, ob.cz + ob.uz * u, y - 0.25, y, 0.1, hv, ob.ang, white);
    }
    for (let j = 0; j <= 3; j++) {
      const v = -hv + (j / 3) * 2 * hv;
      boxO(trim, ob.cx - ob.uz * v, ob.cz + ob.ux * v, y - 0.3, y - 0.05, hu, 0.1, ob.ang, white);
      for (const u of [-hu, 0, hu]) {
        const x = ob.cx + ob.ux * u - ob.uz * v;
        const z = ob.cz + ob.uz * u + ob.ux * v;
        if (pointInRing(ring, x, z)) boxO(trim, x, z, r.yr, y - 0.3, 0.09, 0.09, ob.ang, white, { top: false });
      }
    }
    if (!env.low) roofUnits(env, b, ring, r.yr, { maxH: 1.5, density: 260 });
  }
}

function kahala(env, b) {
  for (const vol of b.vols) {
    if (vol.y0 > 1 || vol.y1 > 30) volume(env, b, vol, STYLES.kahala, { parapet: 1.2 });
    else volume(env, b, vol, STYLES.kahala, { parapet: 0.9, noLedges: true, wall: 'context.kahala.glass' });
  }
}

/** Residential towers that differ only by colour scheme. */
const RES = {
  blueharbor: { st: 'resLight', tint: rgb('#dfe6ea'), cap: rgb('#dfe3e6'), bal: { depth: 1.5, rail: 'glass', col: rgb('#e3e6e8') } },
  prc: { st: 'resBeige', tint: rgb('#d9d2c8'), cap: rgb('#b9ab98'), bal: { depth: 1.4, rail: 'panel', col: rgb('#c4b6a2') } },
  brillia: { st: 'resLight', tint: rgb('#f2f1ee'), cap: rgb('#ecebe7'), bal: { depth: 1.5, rail: 'glass', col: rgb('#efeeea') } },
  mmtowers: { st: 'resBeige', tint: rgb('#f0e9de'), cap: rgb('#dcd0bd'), bal: { depth: 1.4, rail: 'panel', col: rgb('#e0d6c5') } },
  nabure: { st: 'resLight', tint: rgb('#ecebe8'), cap: rgb('#e6e5e1'), bal: { depth: 1.4, rail: 'glass', col: rgb('#e9e8e4') } },
};
function residentialLandmark(key) {
  return (env, b) => {
    const k = RES[key];
    for (const vol of b.vols) {
      const tall = (vol.top || vol.y1) > 0.55 * b.top;
      if (tall) volume(env, b, vol, STYLES[k.st], { tint: k.tint, cap: k.cap, balcony: k.bal });
      else volume(env, b, vol, styleFor(b, vol), { tint: tintFor(b) });
    }
  };
}

function market(env, b) {
  // fish hall of the central wholesale market: a two-storey shed whose roof is a car park
  for (const vol of b.vols) {
    const r = volume(env, b, vol, STYLES.industrial, { roof: 'context.parking.deck', parapet: 1.1, noRoofStuff: true });
    const ring = r.inner || r.ring;
    const ob = obb(ring);
    const c = centroid(ring);
    if (pointInRing(ring, c[0], c[1])) boxO(env.B.get('context.industrial.coldstore'), c[0], c[1], r.yr, r.yr + 7, ob.hu * 0.45, ob.hv * 0.16, ob.ang, WHITE, { topBuf: env.B.get('context.roof.light') });
  }
}

function nissan(env, b) {
  for (const vol of b.vols) {
    if (vol.y1 > 40) volume(env, b, vol, { ...STYLES.officeBlue, ledges: { depth: 0.6, thick: 0.2, col: rgb('#c9d0d2') } }, {});
    else volume(env, b, vol, STYLES.fujifilmLow, {});
  }
}

export const LANDMARKS = {
  anpanman,
  fujifilm,
  grangate,
  okbuilding,
  keihinport,
  kahala,
  market,
  nissan,
  blueharbor: residentialLandmark('blueharbor'),
  prc: residentialLandmark('prc'),
  brillia: residentialLandmark('brillia'),
  mmtowers: residentialLandmark('mmtowers'),
  nabure: residentialLandmark('nabure'),
};

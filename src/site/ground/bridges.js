// Bridges of the diorama:
//   - the two road bridges (みなとみらい大橋, みなとみらい橋): deck bodies with approaches,
//     parapets, fascia girders, soffits, abutments and wall piers (plan and levels from the
//     MLIT PLATEAU 2024 bridge model, see tools/bake-ground.mjs),
//   - the white steel footbridge from the north road over the freight line into
//     高島水際線公園 (deck, lift towers, dog-leg stairs),
//   - the other elevated walkways near the rim as simple decks on round piers.
import * as THREE from 'three';
import { prism, cylinder, box, merge, mesh } from '../../core/geom.js';
import { GROUND } from '../data/ground-data.js';
import { DISC, BED_Y, Y, Soup, unflat, soupGeometry, triangulate, pointInRing, liftAt, densify, sections, strip, discR, dist2, distToSeg } from './util.js';

const SITE = 'site';
const lerp = (a, b, t) => a + (b - a) * t;

/** Thin two-sided panel between two 3D edges (bottom a→b, height h). */
function panel(soup, a, b, h, t = 0.06) {
  const dx = b[0] - a[0];
  const dz = b[2] - a[2];
  const l = Math.hypot(dx, dz) || 1;
  const nx = (dz / l) * (t / 2);
  const nz = (-dx / l) * (t / 2);
  for (const s of [1, -1]) {
    const A = [a[0] + nx * s, a[1], a[2] + nz * s];
    const B = [b[0] + nx * s, b[1], b[2] + nz * s];
    soup.quad(A, B, [B[0], B[1] + h, B[2]], [A[0], A[1] + h, A[2]], nx * s, 0, nz * s);
  }
  // top edge
  soup.quad([a[0] + nx, a[1] + h, a[2] + nz], [b[0] + nx, b[1] + h, b[2] + nz], [b[0] - nx, b[1] + h, b[2] - nz], [a[0] - nx, a[1] + h, a[2] - nz], 0, 1, 0);
}

function buildRoadDecks(M, group, ortho) {
  const top = new Soup();
  const parapet = new Soup();
  const girder = new Soup();
  const wallS = new Soup();
  const pier = new Soup();
  const rail = new Soup();
  const median = new Soup();
  const kerb = new Soup();
  const basin = unflat(GROUND.water.basin);

  for (const d of GROUND.decks) {
    // densified stations with interpolated level, width and kind
    const st = [];
    for (let i = 0; i < d.pts.length - 1; i++) {
      const a = d.pts[i];
      const b = d.pts[i + 1];
      const n = Math.max(1, Math.ceil(dist2(a, b) / 8));
      for (let k = i === 0 ? 0 : 1; k <= n; k++) {
        const t = k / n;
        st.push({ x: lerp(a[0], b[0], t), z: lerp(a[1], b[1], t), y: lerp(a[2], b[2], t), half: lerp(a[3], b[3], t) / 2, kind: d.kinds[i], node: k === n ? i + 1 : k === 0 ? i : -1 });
      }
    }
    const secs = sections(st.map((s) => [s.x, s.z]));
    secs.forEach((s, i) => Object.assign(s, { y: st[i].y, half: st[i].half, kind: st[i].kind, node: st[i].node }));
    const P = (s, o, y) => [s.x + s.nx * o, y, s.z + s.nz * o];

    for (let i = 0; i < secs.length - 1; i++) {
      const a = secs[i];
      const b = secs[i + 1];
      const kind = b.kind;
      // top
      top.quad(P(a, -a.half, a.y), P(b, -b.half, b.y), P(b, b.half, b.y), P(a, a.half, a.y), 0, 1, 0);
      for (const side of [1, -1]) {
        const nx = (a.nx + b.nx) * side;
        const nz = (a.nz + b.nz) * side;
        const ea = side * a.half;
        const eb = side * b.half;
        const raised = Math.max(a.y, b.y) > 0.25 || kind === 'span';
        if (kind === 'span') {
          // fascia girder and soffit
          girder.quad(P(a, ea, a.y - d.slab), P(b, eb, b.y - d.slab), P(b, eb, b.y), P(a, ea, a.y), nx, 0, nz);
        } else if (Math.max(a.y, b.y) > 0.03) {
          wallS.quad(P(a, ea, 0), P(b, eb, 0), P(b, eb, b.y), P(a, ea, a.y), nx, 0, nz);
        }
        if (raised) {
          // concrete parapet 0.4 x 0.85 m with a steel top rail at 1.15 m
          const ia = side * (a.half - 0.4);
          const ib = side * (b.half - 0.4);
          parapet.quad(P(a, ea, a.y), P(b, eb, b.y), P(b, eb, b.y + 0.85), P(a, ea, a.y + 0.85), nx, 0, nz);
          parapet.quad(P(a, ia, a.y), P(b, ib, b.y), P(b, ib, b.y + 0.85), P(a, ia, a.y + 0.85), -nx, 0, -nz);
          parapet.quad(P(a, ia, a.y + 0.85), P(b, ib, b.y + 0.85), P(b, eb, b.y + 0.85), P(a, ea, a.y + 0.85), 0, 1, 0);
          const ra = side * (a.half - 0.2);
          const rb = side * (b.half - 0.2);
          rail.quad(P(a, ra - 0.04, a.y + 1.15), P(b, rb - 0.04, b.y + 1.15), P(b, rb + 0.04, b.y + 1.15), P(a, ra + 0.04, a.y + 1.15), 0, 1, 0);
          rail.quad(P(a, ra + side * 0.04, a.y + 1.07), P(b, rb + side * 0.04, b.y + 1.07), P(b, rb + side * 0.04, b.y + 1.15), P(a, ra + side * 0.04, a.y + 1.15), nx, 0, nz);
          rail.quad(P(a, ra - side * 0.04, a.y + 1.07), P(b, rb - side * 0.04, b.y + 1.07), P(b, rb - side * 0.04, b.y + 1.15), P(a, ra - side * 0.04, a.y + 1.15), -nx, 0, -nz);
        }
      }
      if (kind === 'span') girder.quad(P(a, -a.half, a.y - d.slab), P(b, -b.half, b.y - d.slab), P(b, b.half, b.y - d.slab), P(a, a.half, a.y - d.slab), 0, -1, 0);
      // planted median with kerbs
      if (d.median && !ortho && Math.min(a.y, b.y) > 0.6) {
        const h = d.median / 2;
        median.quad(P(a, -h, a.y + 0.3), P(b, -h, b.y + 0.3), P(b, h, b.y + 0.3), P(a, h, a.y + 0.3), 0, 1, 0);
        for (const side of [1, -1]) kerb.quad(P(a, side * h, a.y), P(b, side * h, b.y), P(b, side * h, b.y + 0.3), P(a, side * h, a.y + 0.3), (a.nx + b.nx) * side, 0, (a.nz + b.nz) * side);
      }
    }
    // abutment faces where a solid approach meets an open span
    for (let i = 1; i < secs.length - 1; i++) {
      const s = secs[i];
      if (secs[i].kind === secs[i + 1].kind) continue;
      const toSpan = secs[i + 1].kind === 'span' ? 1 : -1;
      const yb = s.y - d.slab;
      if (yb > 0.02) pier.quad(P(s, -s.half, -0.3), P(s, s.half, -0.3), P(s, s.half, yb), P(s, -s.half, yb), s.tx * toSpan, 0, s.tz * toSpan);
      // the fill is closed toward the span above the slab line as well
      wallS.quad(P(s, -s.half, Math.max(0, yb)), P(s, s.half, Math.max(0, yb)), P(s, s.half, s.y), P(s, -s.half, s.y), s.tx * toSpan, 0, s.tz * toSpan);
    }
    // wall piers standing in the water
    for (const p of d.piers) {
      const dx = p.b[0] - p.a[0];
      const dz = p.b[1] - p.a[1];
      const l = Math.hypot(dx, dz);
      const ux = (-dz / l) * (p.t / 2);
      const uz = (dx / l) * (p.t / 2);
      const mx = (p.a[0] + p.b[0]) / 2;
      const mz = (p.a[1] + p.b[1]) / 2;
      const yTop = liftAt(mx, mz, 0) - d.slab;
      pier.prismQuad([[p.a[0] - ux, p.a[1] - uz], [p.b[0] - ux, p.b[1] - uz], [p.b[0] + ux, p.b[1] + uz], [p.a[0] + ux, p.a[1] + uz]], pointInRing(mx, mz, basin) ? BED_Y : 0, yTop, { top: false });
    }
  }
  const add = (soup, material, name, cast = true) => {
    const g = soupGeometry(soup);
    if (g) group.add(mesh(g, material, { name, layer: SITE, cast, receive: true }));
  };
  add(top, M.bridgeDeck, 'bridge decks', true);
  add(parapet, M.bridgeParapet, 'bridge parapets');
  add(rail, M.bridgeRail, 'bridge railings', false);
  add(girder, M.bridgeGirder, 'bridge girders');
  add(wallS, M.quayWall, 'bridge approach walls');
  add(pier, M.pier, 'bridge piers and abutments');
  add(median, M.median, 'bridge median planting', false);
  add(kerb, M.kerb, 'bridge median kerbs', false);
}

function buildParkFootbridge(M, group) {
  const fb = GROUND.parkFootbridge;
  const g = new THREE.Group();
  g.name = 'parkFootbridge';
  const steel = [];
  const deckTop = new Soup();
  const rails = new Soup();
  const stairs = new Soup();
  const glass = [];
  const concrete = [];

  // box girder deck
  steel.push(prism(fb.deck, fb.soffitY, fb.deckY - 0.03));
  for (const [a, b, c] of triangulate(fb.deck)) deckTop.flat(a, b, c, fb.deckY);
  // railing panels along the deck edge, open where stairs and lifts connect
  const openings = [
    ...fb.flights.filter((f) => Math.abs(f.y1 - fb.deckY) < 0.2).map((f) => [f.quad[2], f.quad[3]]),
    ...fb.towers.flatMap((t) => t.ring.map((p, i) => [p, t.ring[(i + 1) % t.ring.length]])),
  ];
  const n = fb.deck.length;
  for (let i = 0; i < n; i++) {
    const a = fb.deck[i];
    const b = fb.deck[(i + 1) % n];
    const mx = (a[0] + b[0]) / 2;
    const mz = (a[1] + b[1]) / 2;
    if (openings.some(([p, q]) => distToSeg(mx, mz, p, q) < 0.9)) continue;
    panel(rails, [a[0], fb.deckY, a[1]], [b[0], fb.deckY, b[1]], 1.15);
  }
  // lift towers: glazed shafts in a white steel frame
  for (const t of fb.towers) {
    glass.push(prism(t.ring, 0.3, t.top - 0.3, { top: false, bottom: false }));
    steel.push(prism(t.ring, t.top - 0.3, t.top));
    concrete.push(prism(t.ring, 0, 0.3));
    for (const p of t.ring) steel.push(box(p[0], t.top / 2, p[1], 0.22, t.top, 0.22));
    // transoms every 2.6 m
    for (let y = 2.9; y < t.top - 1; y += 2.6) {
      for (let i = 0; i < 4; i++) {
        const a = t.ring[i];
        const b = t.ring[(i + 1) % 4];
        panel(rails, [a[0], y, a[1]], [b[0], y, b[1]], 0.12, 0.14);
      }
    }
  }
  // stair flights with real steps (riser about 0.165 m), landings and side panels
  for (const f of fb.flights) {
    const q = f.quad;
    const rise = f.y1 - f.y0;
    const steps = Math.max(1, Math.round(rise / 0.165));
    const r = rise / steps;
    for (let k = 0; k < steps; k++) {
      const t0 = k / steps;
      const t1 = (k + 1) / steps;
      const A = [lerp(q[0][0], q[3][0], t0), lerp(q[0][1], q[3][1], t0)];
      const B = [lerp(q[1][0], q[2][0], t0), lerp(q[1][1], q[2][1], t0)];
      const C = [lerp(q[1][0], q[2][0], t1), lerp(q[1][1], q[2][1], t1)];
      const D = [lerp(q[0][0], q[3][0], t1), lerp(q[0][1], q[3][1], t1)];
      stairs.prismQuad([A, B, C, D], Math.max(0, f.y0 + k * r - 0.28), f.y0 + (k + 1) * r, { bottom: true });
    }
    for (const [lo, hi] of [[q[0], q[3]], [q[1], q[2]]]) {
      // sloped side panel: split in two so that the top edge follows the pitch
      const a = [lo[0], f.y0 + r, lo[1]];
      const b = [hi[0], f.y1, hi[1]];
      const dx = b[0] - a[0];
      const dz = b[2] - a[2];
      const l = Math.hypot(dx, dz) || 1;
      const nx = (dz / l) * 0.03;
      const nz = (-dx / l) * 0.03;
      for (const s of [1, -1]) {
        const A = [a[0] + nx * s, a[1], a[2] + nz * s];
        const B = [b[0] + nx * s, b[1], b[2] + nz * s];
        rails.quad(A, B, [B[0], B[1] + 1.1, B[2]], [A[0], A[1] + 1.1, A[2]], nx * s, 0, nz * s);
      }
    }
  }
  for (const l of fb.landings) {
    concrete.push(prism(l.ring, Math.max(0, l.y - 0.28), l.y));
    const c = [l.ring.reduce((s, p) => s + p[0], 0) / 4, l.ring.reduce((s, p) => s + p[1], 0) / 4];
    if (l.y > 1) steel.push(box(c[0], (l.y - 0.28) / 2, c[1], 0.25, l.y - 0.28, 0.25));
  }
  // two round piers clear of the track
  for (const [x, z] of [[-33.5, 149.2], [-36.6, 168.6]]) concrete.push(cylinder(x, z, 0, fb.soffitY, 0.5, 14));

  const add = (geo, material, name, cast = true) => {
    if (geo) g.add(mesh(geo, material, { name, layer: SITE, cast, receive: true }));
  };
  add(merge(steel), M.fbSteel, 'park footbridge steelwork');
  add(soupGeometry(deckTop, { clip: false }), M.fbDeck, 'park footbridge deck', false);
  add(soupGeometry(rails, { clip: false }), M.fbSteel, 'park footbridge railings');
  add(soupGeometry(stairs, { clip: false }), M.fbDeck, 'park footbridge stairs');
  add(merge(glass), M.fbGlass, 'park footbridge lift glazing', false);
  add(merge(concrete), M.pier, 'park footbridge piers');
  group.add(g);
}

function buildSkywalks(M, group, index) {
  const DECK_Y = 6.0;
  const SLAB = 0.5;
  const deck = new Soup();
  const rails = new Soup();
  const piers = [];
  const basin = unflat(GROUND.water.basin);
  const lines = GROUND.skywalks.map((s) => ({ ...s, pts: unflat(s.pts) }));
  const levelNodes = lines.filter((s) => !s.steps).flatMap((s) => s.pts);
  const isHigh = (p) => levelNodes.some((q) => dist2(p, q) < 1.5);
  for (const s of lines) {
    const pts = densify(s.pts, 6);
    const secs = sections(pts);
    const a = s.pts[0];
    const b = s.pts[s.pts.length - 1];
    let yTop = () => DECK_Y;
    if (s.steps) {
      const endY = (p) => (isHigh(p) ? DECK_Y : liftAt(p[0], p[1], 1.5) > 0.4 ? liftAt(p[0], p[1], 1.5) + Y.walk : 0);
      const ha = endY(a);
      const hb = endY(b);
      if (Math.abs(ha - hb) < 0.3) continue; // a stair that does not connect two modelled levels
      // level by distance along the stair, quantised into 0.17 m risers
      const total = secs[secs.length - 1].s || 1;
      const frac = (x, z) => {
        let best = Infinity;
        let f = 0;
        for (let i = 0; i < secs.length - 1; i++) {
          const p = secs[i];
          const q = secs[i + 1];
          const ex = q.x - p.x;
          const ez = q.z - p.z;
          const l2 = ex * ex + ez * ez || 1;
          const t = Math.max(0, Math.min(1, ((x - p.x) * ex + (z - p.z) * ez) / l2));
          const d = Math.hypot(x - p.x - ex * t, z - p.z - ez * t);
          if (d < best) {
            best = d;
            f = (p.s + (q.s - p.s) * t) / total;
          }
        }
        return f;
      };
      yTop = (x, z) => lerp(ha, hb, frac(x, z));
      // stair flight as a solid ramp to the ground with closed sides and panels
      const hs = s.w / 2;
      strip(deck, sections(densify(s.pts, 1.2)), -hs, hs, 0, yTop, {});
      for (const side of [1, -1]) {
        const o = side * (hs - 0.05);
        strip(rails, secs, o - 0.04, o + 0.04, yTop, (x, z) => yTop(x, z) + 1.1);
      }
      continue;
    }
    const h = s.w / 2;
    strip(deck, secs, -h, h, (x, z) => Math.max(0, yTop(x, z) - SLAB), yTop, { bottom: true });
    for (const side of [1, -1]) {
      const o = side * (h - 0.05);
      strip(rails, secs, o - 0.04, o + 0.04, yTop, (x, z) => yTop(x, z) + 1.15);
    }
    if (!s.steps) {
      const len = secs[secs.length - 1].s;
      const nP = Math.max(1, Math.round(len / 18));
      let k = 0;
      for (let i = 0; i < nP; i++) {
        const st = (len * (i + 0.5)) / nP;
        while (k < secs.length - 2 && secs[k + 1].s < st) k++;
        const p = secs[k];
        const q = secs[k + 1];
        const t = (st - p.s) / (q.s - p.s || 1);
        const x = lerp(p.x, q.x, t);
        const z = lerp(p.z, q.z, t);
        if (discR(x, z) > DISC.radius - 1.5 || pointInRing(x, z, basin) || liftAt(x, z, 1) > 0) continue;
        if (index && index.clearance(x, z) < 0.6) continue; // not in a carriageway
        piers.push(cylinder(x, z, 0, DECK_Y - SLAB, 0.45, 12));
      }
    }
  }
  const add = (geo, material, name) => {
    if (geo) group.add(mesh(geo, material, { name, layer: SITE, cast: true, receive: true }));
  };
  add(soupGeometry(deck), M.skyDeck, 'elevated walkways');
  add(soupGeometry(rails), M.skyRail, 'elevated walkway railings');
  if (piers.length) add(merge(piers), M.pier, 'elevated walkway piers');
}

export function buildBridges(M, index, ortho = false) {
  const group = new THREE.Group();
  group.name = 'bridges';
  buildRoadDecks(M, group, ortho);
  buildParkFootbridge(M, group);
  buildSkywalks(M, group, index);
  return group;
}

// Seating bowl of K-Arena Yokohama as built structure (no seats): arena floor, the three
// stands row by row, aisle stairs, vomitories, parapets and fascias, VIP box shells,
// soffits and rear walls. Everything is derived from the official seat rows in
// core/seating.js (PARTS) and the reconciled levels in core/envelope.js.
//
// Layer 'bowl'. Meshes are merged per material and building LEVEL; the telescopic rows
// 1-11 of the Lower Stand carry userData.telescopic = true.
import * as THREE from 'three';
import { GATES, junctionX } from '../core/seating.js';
import { LEVEL_Y, roofY } from '../core/envelope.js';
import { emissiveMat } from '../core/materials.js';
import { Soup, P, toFrame, hq, vqv, fbox, swall, tube, disc } from './bowl/soup.js';
import { buildLayout, FR, BIS, bisStation, vOfApo, COS_H, VOM_HW, VOM_WALL, subtractHoles } from './bowl/layout.js';
import { bowlMaterials } from './bowl/mats.js';
import { buildTerraces, buildSoffit, buildCheek, wallWithOpenings } from './bowl/stands.js';
import { regularSpec, junctionSpec, buildVomitory } from './bowl/vomitory.js';
import { buildFrontL5, buildFrontL7, ribbonGeometry } from './bowl/fronts.js';
import { buildLowerFront, buildTelescopic, buildTelescopicStowed, buildPlatform } from './bowl/lower.js';
import { vipLayout, buildVip } from './bowl/vip.js';
import { buildArenaFloor } from './bowl/floor.js';
import { buildAisleRails } from './bowl/rails.js';

/** Underside of the LEVEL 7 floor slab (arena/structure uses the same value for its LEVEL 6 ceilings). */
const L7_SLAB_UNDERSIDE = LEVEL_Y[7] - 0.35;

/**
 * Upper Stand wings: the LEVEL 7 slab runs forward under the front rows to the fascia. Its
 * flat underside is the ceiling over the top rows of the Middle Stand wings; the raking
 * stand and the vomitory stairs are above it. Built from the fascia back to the line where
 * the LEVEL 7 slab of arena/structure starts (back edge of the cover row of the vomitories).
 */
function buildUpperWingSlab(soup, M, T7) {
  const C = T7.byFacet.C;
  const J = C.jv.lo || C.jv.hi;
  const aEnd = J ? C.apo(C.rows[J.rb].vB) : C.apo(C.rows[9].vB);
  const bk = soup.get(M.soffit, { level: 7, group: 'soffit', cast: false });
  for (const S of T7.stands) {
    if (S.facet === 'C') continue;
    const { F } = S;
    const v0 = S.vFront;
    const v1 = vOfApo(F, aEnd);
    const a = (v) => (S.ends.lo.type === 'O' ? S.ends.lo.u - 0.2 : S.ends.lo.line(v));
    const b = (v) => (S.ends.hi.type === 'O' ? S.ends.hi.u + 0.2 : S.ends.hi.line(v));
    hq(bk, F, a(v0), b(v0), v0, a(v1), b(v1), v1, L7_SLAB_UNDERSIDE, -1);
  }
}

/** Extent of a rear wall of a stand facet at station v: [a, b] in u. */
function wallRange(S, v, i = S.rows.length - 1) {
  const end = (k) => {
    const e = S.ends[k];
    if (e.type === 'O') return e.u + (k === 'lo' ? -0.2 : 0.2);
    return S.endRaw(k, i, v) + (k === 'lo' ? -0.12 : 0.12);
  };
  return [end('lo'), end('hi')];
}

function buildRearWalls(soup, M, T, V, specs) {
  const bkE = soup.get(M.exitSign, { level: 3, group: 'exitSigns', cast: false });
  // LEVEL 3: wall behind the rear cross-aisle, up to the soffit of the Middle Stand, with the gates 301-304
  for (const S of T[3].stands) {
    const { F } = S;
    const bk = soup.get(M.rearWall, { level: 3, group: 'rearWall' });
    const bkT = soup.get(M.terrace, { level: 3, group: 'terraces' });
    const v = S.vBack;
    const [a, b] = wallRange(S, v);
    const y0 = LEVEL_Y[3];
    const y1 = T[5].soffit.at(S.apo(v + 0.15)) + 0.06;
    const openings = [];
    for (const id of ['301', '302', '303', '304']) {
      const [ug, vg] = toFrame(F, ...GATES[id]);
      if (ug < a - 1 || ug > b + 1 || Math.abs(vg - v) > 4) continue;
      // door opening framing the gate door of arena/structure (2.4 x 2.3 m, 0.1 m behind this wall)
      openings.push({ a: ug - 1.3, b: ug + 1.3, y0, y1: y0 + 2.35 });
      hq(bkT, F, ug - 1.3, ug + 1.3, v, ug - 1.3, ug + 1.3, v + 0.3, y0, 1);
      fbox(bkE, F, ug - 0.3, ug + 0.3, v - 0.03, v, y0 + 2.45, y0 + 2.63, 'r');
    }
    wallWithOpenings(bk, F, a, b, v, 0.3, y0 - 0.3, y1, openings);
  }

  // LEVEL 5 centre: wall behind row 17, under the VIP balconies, pierced by the vomitories
  {
    const S = T[5].byFacet.C;
    const { F } = S;
    const bk = soup.get(M.rearWall, { level: 5, group: 'rearWall' });
    const v = S.vBack + 0.06;
    const c = VOM_HW / COS_H;
    const a = S.ends.lo.line(v) - 0.1;
    const b = S.ends.hi.line(v) + 0.1;
    const openings = specs.filter((sp) => sp.S === S && sp.regular).map((sp) => ({ a: sp.uc - sp.hw + VOM_WALL, b: sp.uc + sp.hw - VOM_WALL, y0: sp.yBack - 0.5, y1: sp.ceilBox }));
    // the junction vomitories pass through the ends of this wall; it closes the gap above their roofs
    const yCover = S.rows[S.rows.length - 1].y - 0.03;
    if (S.jv.lo) openings.push({ a: a - 1, b: S.ends.lo.line(v) + c - 0.02, y0: LEVEL_Y[5] - 1, y1: yCover });
    if (S.jv.hi) openings.push({ a: S.ends.hi.line(v) - c + 0.02, b: b + 1, y0: LEVEL_Y[5] - 1, y1: yCover });
    wallWithOpenings(bk, F, a, b, v, 0.28, LEVEL_Y[5] - 0.25, V.slabBottom, openings);
  }

  // LEVEL 5 wings: wall behind row 26 up to the soffit of the Upper Stand, and the wall on
  // the junction line that closes rows 18-26 toward the VIP boxes
  for (const S of T[5].stands) {
    if (S.facet === 'C') continue;
    const { F } = S;
    const bk = soup.get(M.rearWall, { level: 5, group: 'rearWall' });
    const v = S.vBack;
    const [a, b] = wallRange(S, v);
    const y0 = S.soffit.at(S.apo(v)) - 0.12;
    const y1 = L7_SLAB_UNDERSIDE + 0.02;
    swall(bk, F, [a, v], [b, v], 0.25, 0, 1, y0, y1, y0, y1);
    const side = S.facet === 'LW' ? 'L' : 'R';
    const B = BIS[side];
    const C = T[5].byFacet.C;
    const aC = C.apo(C.vBack);
    const aW = S.apo(S.vBack);
    const yRoof = C.rows[C.rows.length - 1].y;
    const bot = (A) => Math.max(S.soffit.at(A) - 0.12, yRoof);
    const top = () => L7_SLAB_UNDERSIDE + 0.02;
    const su = side === 'L' ? 1 : -1; // thickness toward the centre
    const aK = S.soffit.a0 + (yRoof + 0.12 - S.soffit.y0) / S.soffit.slope; // where the soffit rises above the cover row level
    const stops = [aC, Math.min(Math.max(aK, aC), aW), aW];
    for (let i = 0; i + 1 < stops.length; i++) {
      const A0 = stops[i];
      const A1 = stops[i + 1];
      if (A1 - A0 < 0.05) continue;
      swall(bk, B.F, [B.u, bisStation(A0)], [B.u, bisStation(A1)], 0.2, su, 0, bot(A0), top(A0), bot(A1), top(A1));
    }
  }

  // LEVEL 7: wall behind row 28 up to the roof
  for (const S of T[7].stands) {
    const { F } = S;
    const bk = soup.get(M.rearWall, { level: 7, group: 'rearWall' });
    const v = S.vBack;
    const [a, b] = wallRange(S, v);
    const y0 = S.soffit.at(S.apo(v)) - 0.12;
    const n = Math.max(2, Math.ceil((b - a) / 6));
    const top = (u) => {
      const [x, , z] = P(F, u, 0, v + 0.12);
      return roofY(x, z) - 0.25;
    };
    for (let i = 0; i < n; i++) {
      const u0 = a + ((b - a) * i) / n;
      const u1 = a + ((b - a) * (i + 1)) / n;
      swall(bk, F, [u0, v], [u1, v], 0.25, 0, 1, y0, top(u0), y0, top(u1), i === 0 ? 'e' : i === n - 1 ? 'a' : 'ae');
    }
  }
}

/** Guard rail on the upstand in front of row 6 of the Middle Stand centre (behind the balcony rows). */
function buildBalconyRearGuard(soup, M, S) {
  const { F, rows } = S;
  const i = rows.findIndex((r, k) => k > 0 && r.rise !== undefined && r.y - rows[k - 1].y > 0.6);
  if (i < 0) return;
  const r = rows[i];
  const bk = soup.get(M.handrail, { level: 5, group: 'guards' });
  const bkL = soup.get(M.crossAisleLight, { level: 5, group: 'crossAisleLight', cast: false });
  const yAisle = rows[i - 1].y;
  const v = r.vF + 0.07;
  const lanes = r.lanes.map((l) => ({ a: () => l.lo(v) - 0.05, b: () => l.hi(v) + 0.05 }));
  for (const iv of subtractHoles((q) => S.endRaw('lo', i, q), (q) => S.endRaw('hi', i, q), lanes, v)) {
    const a = iv.a(v) + 0.05;
    const b = iv.b(v) - 0.05;
    if (b - a < 0.6) continue;
    // violet LED line on the kerb of the cross-aisle
    vqv(bkL, F, a, b, r.vF - 0.006, yAisle + 0.03, yAisle + 0.075, -1);
    tube(bk, P(F, a, r.y + 0.8, v), P(F, b, r.y + 0.8, v), 0.022, 6);
    tube(bk, P(F, a, r.y + 0.42, v), P(F, b, r.y + 0.42, v), 0.015, 5);
    const n = Math.max(1, Math.round((b - a) / 1.25));
    for (let k = 0; k <= n; k++) {
      const u = a + ((b - a) * k) / n;
      tube(bk, P(F, u, r.y, v), P(F, u, r.y + 0.8, v), 0.018, 5);
    }
  }
}

/** Small downlights in the soffits above the rear rows of the tier below. */
function buildDownlights(soup, M, S, level, offsets, yFlat) {
  const { F, rows } = S;
  const bk = soup.get(M.downlight, { level, group: 'soffitLights', cast: false });
  const v0 = rows[0].vF;
  for (const dv of offsets) {
    const v = v0 + dv;
    let i = rows.findIndex((r) => v >= r.vF && v < r.vB);
    if (i < 0) i = 0;
    const a = S.endRaw('lo', i, v) + 1.2;
    const b = S.endRaw('hi', i, v) - 1.2;
    const n = Math.max(1, Math.round((b - a) / 3.0));
    const y = yFlat !== undefined ? yFlat - 0.015 : S.soffit.at(S.apo(v)) - 0.05;
    for (let k = 0; k <= n; k++) {
      const u = a + ((b - a) * k) / n;
      disc(bk, P(F, u, y, v), [0, -1, 0], 0.085, 10);
    }
  }
}

function ribbonTexture() {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 4096;
  c.height = 64;
  const g = c.getContext('2d');
  if (!g) return null;
  const grad = g.createLinearGradient(0, 0, c.width, 0);
  grad.addColorStop(0, '#3b46d8');
  grad.addColorStop(0.5, '#6f63f2');
  grad.addColorStop(1, '#3b46d8');
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
  // twelve white roundels, as on the opening-day photographs
  g.strokeStyle = '#ffffff';
  g.fillStyle = '#ffffff';
  g.lineWidth = 4;
  g.font = 'bold 26px Arial, Helvetica, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (let i = 0; i < 12; i++) {
    const x = ((i + 0.5) * c.width) / 12;
    g.beginPath();
    g.ellipse(x, 32, 46, 22, 0, 0, Math.PI * 2);
    g.stroke();
    g.fillText('KEN', x, 34);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function build(ctx = {}) {
  const group = new THREE.Group();
  group.name = 'bowl';
  group.userData.layer = 'bowl';
  const M = bowlMaterials();
  const soup = new Soup();
  const T = buildLayout();
  const rails = [];

  buildArenaFloor(soup, M);

  // vomitories first: they define the openings in the soffits
  const specs = [];
  const holes = new Map();
  for (const tier of [5, 7]) {
    const { stands, byFacet } = T[tier];
    for (const S of stands) {
      for (const V of S.vomitories) {
        const sp = regularSpec(S, V);
        sp.S = S;
        sp.regular = true;
        specs.push(sp);
      }
    }
    for (const side of ['L', 'R']) {
      const sp = junctionSpec(byFacet.C, side === 'L' ? byFacet.LW : byFacet.RW, side);
      if (sp) specs.push(sp);
    }
  }
  for (const sp of specs) {
    buildVomitory(soup, M, sp);
    for (const h of sp.holes) {
      if (!holes.has(h.S)) holes.set(h.S, []);
      holes.get(h.S).push(h);
    }
  }

  // terraces, soffits and wing cheek walls
  const frontOffset = { 3: 0, 5: 0.13, 7: 0 };
  const frontT = { 3: 0.25, 5: 0.25, 7: 0.2 };
  for (const tier of [3, 5, 7]) {
    for (const S of T[tier].stands) {
      buildTerraces(soup, M, S, tier, rails);
      buildSoffit(soup, M, S, tier, holes.get(S) || [], frontOffset[tier]);
      buildCheek(soup, M, S, tier, frontT[tier]);
    }
  }

  // Lower Stand: front wall, telescopic units, wheelchair platform
  buildLowerFront(soup, M, T[3]);
  const units = buildTelescopic(soup, M, T[3]);
  buildPlatform(soup, M, T[3].byFacet.C);

  // Middle and Upper Stand fronts
  for (const S of T[5].stands) buildFrontL5(soup, M, S);
  buildBalconyRearGuard(soup, M, T[5].byFacet.C);
  const rb = buildFrontL7(soup, M, T[7]);

  // VIP boxes
  const V = vipLayout(T[5].byFacet.C);
  buildVip(soup, M, V, FR.C, (z) => Math.min(T[7].byFacet.C.projHalf + 0.2, junctionX(z) - 0.1));

  buildUpperWingSlab(soup, M, T[7]);
  buildRearWalls(soup, M, T, V, specs);

  // downlights in the soffits over the rear rows of the tier below
  for (const S of T[5].stands) buildDownlights(soup, M, S, 5, [1.3, 3.6]);
  for (const S of T[7].stands) if (S.facet !== 'C') buildDownlights(soup, M, S, 7, [1.6, 3.8], L7_SLAB_UNDERSIDE);

  // low quality: drop the small painted / emissive details
  const low = ctx.quality === 'low';
  const skip = low ? new Set([M.nosing, M.aisleLight, M.downlight, M.teleStepLight]) : new Set();
  for (const m of soup.finish('bowl')) if (!skip.has(m.material)) group.add(m);
  for (const m of buildAisleRails(rails, M.handrail)) group.add(m);

  // stowed telescopic units (rows 1-11 pushed back against the front wall): hidden by default,
  // for a "stands retracted" mode that hides userData.telescopic and shows userData.telescopicStowed
  {
    const stow = new Soup();
    buildTelescopicStowed(stow, M, T[3]);
    for (const m of stow.finish('bowl')) {
      m.name = m.name.replace('bowl:', 'bowl:stowed:');
      m.userData.telescopicStowed = true;
      m.visible = false;
      group.add(m);
    }
  }

  // ribbon display on the front of the Upper Stand centre (62.5 x 1 m)
  const ledMat = emissiveMat('led.ribbon', { color: '#8fa0ff' });
  const tex = ledMat.map ? null : ribbonTexture();
  if (tex) {
    tex.wrapS = THREE.RepeatWrapping;
    ledMat.map = tex;
    ledMat.color.set('#ffffff');
    ledMat.needsUpdate = true;
  }
  const ribbon = new THREE.Mesh(ribbonGeometry(rb), ledMat);
  ribbon.name = 'ribbonLED';
  ribbon.userData.layer = 'bowl';
  ribbon.userData.level = 7;
  ribbon.userData.size_m = [rb.u1 - rb.u0, rb.y1 - rb.y0];
  ribbon.castShadow = false;
  ribbon.receiveShadow = false;
  group.add(ribbon);

  // dev option ?telescopic=stowed: start with the telescopic rows retracted
  if (ctx.flags && ctx.flags.telescopic === 'stowed') setTelescopic(group, false);

  group.userData.info = { telescopicUnits: units, vomitories: specs.map((sp) => sp.gate), quality: ctx.quality };
  group.userData.ribbon = ribbon;
  return group;
}

/** Show the telescopic rows 1-11 deployed (true) or stowed against the front wall (false). */
export function setTelescopic(group, deployed) {
  group.traverse((o) => {
    if (o.userData.telescopic) o.visible = deployed;
    if (o.userData.telescopicStowed) o.visible = !deployed;
  });
}

/** The ribbon display scrolls slowly (one roundel pitch in about 20 s). */
export function update(group, state, dt) {
  const map = group.userData.ribbon?.material?.map;
  if (map) map.offset.x = (map.offset.x + (dt || 0) / 240) % 1;
}

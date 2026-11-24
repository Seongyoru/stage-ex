// Layout of the three stands derived from the official seat rows (core/seating PARTS):
// row strips with their ends, radial aisle lanes, vomitory cuts and soffit lines.
// Pure math, no three.js.
import { PARTS, FACETS, TREAD_FRONT, TREAD_BACK, FAN_APEX_Z, WING_ANGLE, GATES } from '../../core/seating.js';
import { LEVEL_Y } from '../../core/envelope.js';
import { frame, toFrame } from './soup.js';

export const H_ANG = WING_ANGLE / 2; // 16.8°: half angle between a wing and the centre facet
export const COS_H = Math.cos(H_ANG);
export const SIN_H = Math.sin(H_ANG);
export const TAN_H = Math.tan(H_ANG);
const A0 = FAN_APEX_Z; // world z of the fan apex (−32.59)

const f = (k) => frame(FACETS[k].u[0], FACETS[k].u[1], FACETS[k].v[0], FACETS[k].v[1]);
/** Plan frames: the three facets and the two junction (bisector) frames. */
export const FR = {
  C: f('C'),
  LW: f('LW'),
  RW: f('RW'),
  BL: frame(COS_H, SIN_H, -SIN_H, COS_H), // house-left junction (x < 0)
  BR: frame(COS_H, -SIN_H, SIN_H, COS_H), // house-right junction (x > 0)
};
for (const k of Object.keys(FR)) FR[k].name = k;

/** Apothem (perpendicular distance from the fan apex) of the row line v of a facet frame. */
export const apoOf = (F, v) => v - A0 * F.vz;
/** Row line v of a facet frame at a given apothem. */
export const vOfApo = (F, a) => a + A0 * F.vz;

/** Bisector frames: the bisector is the line u = BIS.x.u of the frame BIS.x.F. */
export const BIS = {
  L: { F: FR.BL, u: A0 * FR.BL.uz },
  R: { F: FR.BR, u: A0 * FR.BR.uz },
};
/** Bisector-frame v of the point where a line at distance hw from the bisector meets the row line of apothem a. */
export const bisStation = (a, hw = 0) => A0 * COS_H + (a - hw * SIN_H) / COS_H;
/** Apothem of the facet row through a bisector-frame point at station v, at distance hw from the bisector. */
export const apoAtBis = (v, hw = 0) => (v - A0 * COS_H) * COS_H + hw * SIN_H;

/** Bisector line in a facet frame: returns v → u. side 'L' (x < 0) or 'R'. */
export function junctionLine(F, side) {
  const dx = side === 'L' ? -SIN_H : SIN_H;
  const dz = COS_H;
  const du = dx * F.ux + dz * F.uz;
  const dv = dx * F.vx + dz * F.vz;
  const ua = A0 * F.uz;
  const va = A0 * F.vz;
  const k = du / dv;
  return (v) => ua + (v - va) * k;
}

/** Vomitory box: outer half width (m) and wall thickness. */
export const VOM_HW = 1.35;
export const VOM_WALL = 0.18;
/**
 * Vomitories per tier (official seat map: rows 11-17 / 6-10 are interrupted).
 *   first  first interrupted row = cross landing in front of the mouth (at its own row level)
 *   last   last interrupted row = cover row: the tunnel roof is flush with this row
 *   box    first roofed row; between `first` and `box` the vomitory is an open trench
 */
export const VOM = {
  5: { first: 11, last: 17, box: 15 },
  7: { first: 6, last: 10, box: 9 },
};

/** Target riser height of the aisle steps per tier. */
const RISER = { 3: 0.118, 5: 0.158, 7: 0.161 };
export const risersFor = (tier, rise) => Math.max(1, Math.round(rise / RISER[tier] - 0.05));

const constFn = (c) => () => c;

function collectRows(keys, rowMin, rowMax) {
  const rows = [];
  for (const key of keys) {
    const part = PARTS.find((p) => p.key === key);
    for (const r of part.rows) {
      if (r.row < rowMin || r.row > rowMax) continue;
      const segs = r.segs.map((s) => ({ u0: s.u0, u1: s.u1, first: s.first, last: s.last })).sort((a, b) => a.u0 - b.u0);
      rows.push({ row: r.row, v: r.v, y: r.y, segs, balcony: part.balcony });
    }
  }
  rows.sort((a, b) => a.v - b.v);
  return rows;
}

/**
 * One stand facet.
 *   rows[i]: { row, v, y, segs, vF, vB, rise, n, holes: [{a, b}], lanes: [{lo, hi, steps, rail}], cut }
 *   endLo(i, v) / endHi(i, v): ends of the row strip (u) at station v
 */
function makeStand(tier, facet, keys, rowMin, rowMax, extraRows = []) {
  const F = FR[facet];
  const rows = collectRows(keys, rowMin, rowMax);
  for (const e of extraRows) rows.push({ ...e, segs: [], extra: true });
  rows.forEach((r, i) => {
    r.i = i;
    r.vF = r.v - TREAD_FRONT;
  });
  rows.forEach((r, i) => {
    r.vB = r.depth ? r.vF + r.depth : i + 1 < rows.length ? rows[i + 1].vF : r.v + TREAD_BACK;
    r.holes = [];
    r.lanes = [];
    r.cut = { lo: 0, hi: 0 };
  });
  rows.forEach((r, i) => {
    const next = rows[i + 1];
    const prev = rows[i - 1];
    r.rise = next ? next.y - r.y : prev ? Math.min(r.y - prev.y, 0.5) : 0;
    r.n = risersFor(tier, r.rise);
  });

  const ends = {
    lo: facet === 'C' ? { type: 'J', side: 'L' } : facet === 'RW' ? { type: 'J', side: 'R' } : { type: 'O' },
    hi: facet === 'C' ? { type: 'J', side: 'R' } : facet === 'LW' ? { type: 'J', side: 'L' } : { type: 'O' },
  };
  const allSegs = rows.flatMap((r) => r.segs);
  for (const k of ['lo', 'hi']) {
    const e = ends[k];
    if (e.type === 'J') e.line = junctionLine(F, e.side);
    else e.u = k === 'lo' ? Math.min(...allSegs.map((s) => s.u0)) - 0.35 : Math.max(...allSegs.map((s) => s.u1)) + 0.35;
  }

  const S = {
    tier,
    facet,
    F,
    rows,
    ends,
    vomitories: [], // regular vomitories inside this facet
    jv: { lo: null, hi: null }, // junction vomitory touching this facet
    rowIndex: (rowNo) => rows.findIndex((r) => r.row === rowNo),
    apo: (v) => apoOf(F, v),
    get vFront() {
      return rows[0].vF;
    },
    get vBack() {
      return rows[rows.length - 1].vB;
    },
  };
  /** End of the row strip of row i at station v. */
  S.end = (k, i, v) => {
    const e = ends[k];
    const r = rows[i];
    if (r.endOverride && r.endOverride[k] !== undefined) return r.endOverride[k];
    if (e.type === 'O') return e.u;
    const sgn = k === 'lo' ? 1 : -1;
    return e.line(v) + sgn * r.cut[k];
  };
  S.endLo = (i, v) => S.end('lo', i, v);
  S.endHi = (i, v) => S.end('hi', i, v);
  /** End of the stand body (ignores vomitory cut-backs). */
  S.endRaw = (k, i, v) => {
    const e = ends[k];
    const r = rows[i];
    if (r.endOverride && r.endOverride[k] !== undefined) return r.endOverride[k];
    return e.type === 'O' ? e.u : e.line(v);
  };
  return S;
}

/** Gaps between the seat runs of a row (and toward a junction end), wide enough for an aisle. */
export function gapsOfRow(S, r) {
  const out = [];
  if (!r.segs.length) return out;
  const { lo, hi } = S.ends;
  if (lo.type === 'J' && !(r.endOverride && r.endOverride.lo !== undefined)) out.push({ a: lo.line(r.v), b: r.segs[0].u0, aJ: true });
  for (let k = 0; k + 1 < r.segs.length; k++) out.push({ a: r.segs[k].u1, b: r.segs[k + 1].u0 });
  if (hi.type === 'J' && !(r.endOverride && r.endOverride.hi !== undefined)) out.push({ a: r.segs[r.segs.length - 1].u1, b: hi.line(r.v), bJ: true });
  return out.filter((g) => g.b - g.a >= 0.9);
}

/** Find the vomitories of a stand from the gate markers of the official map. */
function findVomitories(S) {
  const spec = VOM[S.tier];
  if (!spec) return;
  const ra = S.rowIndex(spec.first);
  const rb = S.rowIndex(spec.last);
  const rx = S.rowIndex(spec.box);
  if (ra < 0 || rb < 0) return;
  const { rows, F } = S;
  for (const [id, [gx, gz]] of Object.entries(GATES)) {
    if (Math.floor(Number(id) / 100) !== S.tier) continue;
    const [ug, vg] = toFrame(F, gx, gz);
    if (vg < rows[ra].vF - 1.5 || vg > rows[rb].vB + 1.5) continue;
    // junction gate?
    let junction = null;
    for (const k of ['lo', 'hi']) {
      const e = S.ends[k];
      if (e.type === 'J' && Math.abs(ug - e.line(vg)) < 1.6) junction = k;
    }
    if (junction) {
      const k = junction;
      const e = S.ends[k];
      const gap = (r) => (k === 'hi' ? e.line(r.v) - r.segs[r.segs.length - 1].u1 : r.segs[0].u0 - e.line(r.v));
      const cutList = rows.slice(ra, rb); // landing row .. row before the cover row
      const gs = cutList.slice(1).map(gap);
      const follows = Math.max(...gs) - Math.min(...gs) < 0.45;
      const c = VOM_HW / COS_H;
      let outer;
      if (follows) {
        const g = Math.min(...cutList.map(gap));
        outer = k === 'hi' ? (v) => e.line(v) - g : (v) => e.line(v) + g;
      } else {
        const E = k === 'hi' ? Math.max(...cutList.map((r) => r.segs[r.segs.length - 1].u1)) : Math.min(...cutList.map((r) => r.segs[0].u0));
        outer = constFn(E);
      }
      const inner = k === 'hi' ? (v) => e.line(v) - c : (v) => e.line(v) + c;
      S.jv[k] = { gate: id, ra, rb, rx, outer, inner, cut: c, side: e.side };
      for (let i = ra + 1; i < rb; i++) rows[i].cut[k] = c;
      const lane = k === 'hi' ? { lo: outer, hi: inner } : { lo: inner, hi: outer };
      for (let i = ra; i < rb; i++) rows[i].lanes.push({ ...lane, steps: true, rail: false, vom: true, wallSide: k, wallFrom: ra + 1 });
      continue;
    }
    if (ug < S.endLo(ra, vg) - 0.5 || ug > S.endHi(ra, vg) + 0.5) continue;
    // regular vomitory: the gap of every interrupted row that contains the gate
    let GL = -Infinity;
    let GR = Infinity;
    let ok = true;
    for (let i = ra; i < rb; i++) {
      const g = gapsOfRow(S, rows[i]).find((q) => q.a < ug + 0.8 && q.b > ug - 0.8);
      if (!g) {
        ok = false;
        break;
      }
      if (!g.aJ) GL = Math.max(GL, g.a);
      if (!g.bJ) GR = Math.min(GR, g.b);
    }
    if (!ok || !Number.isFinite(GL) || !Number.isFinite(GR)) continue;
    const uc = (GL + GR) / 2;
    const V = { gate: id, ra, rb, rx, GL, GR, uc, hw: VOM_HW };
    S.vomitories.push(V);
    for (let i = ra + 1; i < rb; i++) rows[i].holes.push({ a: constFn(uc - VOM_HW), b: constFn(uc + VOM_HW), vom: V });
    for (let i = ra; i < rb; i++) {
      rows[i].lanes.push({ lo: constFn(GL), hi: constFn(uc - VOM_HW), steps: true, rail: false, vom: true, wallSide: 'hi', wallFrom: ra + 1 });
      rows[i].lanes.push({ lo: constFn(uc + VOM_HW), hi: constFn(GR), steps: true, rail: false, vom: true, wallSide: 'lo', wallFrom: ra + 1 });
    }
  }
}

/** Radial aisles: chains of matching gaps from row to row, each with a straight lane. */
function findAisles(S) {
  const { rows } = S;
  const chains = [];
  const inVom = (r, g) => {
    for (const V of S.vomitories) if (r.i >= V.ra && r.i < V.rb && g.a < V.uc && g.b > V.uc) return true;
    for (const k of ['lo', 'hi']) {
      const J = S.jv[k];
      if (J && r.i >= J.ra && r.i < J.rb && ((k === 'lo' && g.aJ) || (k === 'hi' && g.bJ))) return true;
    }
    return false;
  };
  for (const r of rows) {
    const gaps = gapsOfRow(S, r).filter((g) => !inVom(r, g));
    const used = new Set();
    // every chain that reached the previous row continues with its best-matching gap
    for (const c of chains) {
      if (c.lastI !== r.i - 1) continue;
      const la = c.aReal > -Infinity ? c.aReal : c.last.a;
      const lb = c.bReal < Infinity ? c.bReal : c.last.b;
      let best = null;
      let bestScore = 0.5;
      for (const g of gaps) {
        const ov = Math.min(lb, g.b) - Math.max(la, g.a);
        const score = ov + (g.aJ || g.bJ ? 0 : 0.3);
        if (ov >= 0.5 && score > bestScore) {
          best = g;
          bestScore = score;
        }
      }
      if (!best) continue;
      used.add(best);
      c.gaps.push({ ...best, i: r.i });
      c.lastI = r.i;
      c.last = best;
      if (!best.aJ) c.aReal = Math.max(c.aReal, best.a);
      if (!best.bJ) c.bReal = Math.min(c.bReal, best.b);
    }
    for (const g of gaps) {
      if (used.has(g)) continue;
      chains.push({ gaps: [{ ...g, i: r.i }], lastI: r.i, last: g, aReal: g.aJ ? -Infinity : g.a, bReal: g.bJ ? Infinity : g.b });
    }
  }
  for (const c of chains) {
    let lane;
    if (c.gaps.length < 3) continue; // aisle heads and leftovers of one or two rows are not aisles
    const widths = c.gaps.map((g) => g.b - g.a);
    const wMin = Math.min(...widths);
    if (c.aReal > -Infinity && c.bReal < Infinity) {
      if (c.bReal - c.aReal < 0.7) continue;
      lane = { lo: constFn(c.aReal), hi: constFn(c.bReal), kind: 'const' };
    } else if (Math.max(...widths) - wMin < 0.45) {
      // follows the bisector: half of a junction aisle (a slot under 1.2 m is not walked)
      if (wMin < 1.2) continue;
      const k = c.gaps[0].bJ ? 'hi' : 'lo';
      const line = S.ends[k].line;
      lane = k === 'hi' ? { lo: (v) => line(v) - wMin, hi: line, kind: 'bis', side: k } : { lo: line, hi: (v) => line(v) + wMin, kind: 'bis', side: k };
    } else {
      const w = Math.min(1.5, wMin - 0.15);
      if (w < 0.7) continue;
      lane = c.gaps[0].bJ ? { lo: constFn(c.aReal), hi: constFn(c.aReal + w), kind: 'const' } : { lo: constFn(c.bReal - w), hi: constFn(c.bReal), kind: 'const' };
    }
    c.lane = lane;
    for (const g of c.gaps) {
      const r = rows[g.i];
      const next = rows[g.i + 1];
      // steps only where the lane continues upward (not blocked by seats of the next row)
      let steps = !!next;
      if (next) {
        const vm = (next.vF + next.vB) / 2;
        const a = lane.lo(vm);
        const b = lane.hi(vm);
        for (const s of next.segs) if (Math.min(b, s.u1) - Math.max(a, s.u0) > 0.35) steps = false;
      }
      const vm = (r.vF + r.vB) / 2;
      const width = lane.hi(vm) - lane.lo(vm);
      r.lanes.push({ lo: lane.lo, hi: lane.hi, steps, rail: width >= 1.25, kind: lane.kind, side: lane.side, chain: c });
    }
  }
  S.chains = chains.filter((c) => c.lane);
}

/**
 * Soffit line of a tier: height of the closed raking underside as a function of the
 * apothem. Parallel to the rake, at least `t` below every inner step corner.
 */
function soffitLine(stands, t) {
  let a0 = Infinity;
  let off = Infinity;
  const wing = stands.find((s) => s.facet !== 'C') || stands[0];
  const rr = wing.rows.filter((r) => !r.extra);
  const slope = (rr[rr.length - 1].y - rr[0].y) / (rr[rr.length - 1].vF - rr[0].vF);
  for (const S of stands) a0 = Math.min(a0, S.apo(S.rows[0].vF));
  // inner corners: (vF_i, y_{i-1}); first row: one rise below
  for (const S of stands) {
    S.rows.forEach((r, i) => {
      if (r.extra) return;
      const yc = i === 0 ? r.y - Math.min(r.rise, 0.5) : S.rows[i - 1].y;
      off = Math.min(off, yc - slope * (S.apo(r.vF) - a0));
    });
  }
  const y0 = off - t;
  return { slope, a0, y0, at: (a) => y0 + slope * (a - a0) };
}

export function buildLayout() {
  const T = {};
  // LEVEL 3 fixed stand: rows 12-29 plus the rear cross-aisle at the LEVEL 3 floor (3 m deep)
  const l3 = ['LW', 'C', 'RW'].map((fc) => {
    const base = collectRows([`L3/${fc}`], 12, 29);
    const last = base[base.length - 1];
    const cross = { row: 30, v: last.v + TREAD_BACK + TREAD_FRONT, y: LEVEL_Y[3], depth: 3.0 };
    return makeStand(3, fc, [`L3/${fc}`], 12, 29, [cross]);
  });
  const l5 = [makeStand(5, 'LW', ['L5/LW'], 1, 99), makeStand(5, 'C', ['L5/C-balcony', 'L5/C'], 1, 99), makeStand(5, 'RW', ['L5/RW'], 1, 99)];
  const l7 = [makeStand(7, 'LW', ['L7/LW'], 1, 99), makeStand(7, 'C', ['L7/C'], 1, 99), makeStand(7, 'RW', ['L7/RW'], 1, 99)];

  // Upper Stand centre: rows 1-2 project in front of the wings; they end at their own seats
  {
    const C = l7[1];
    const firstWingRow = l7[0].rows[0].row;
    const proj = C.rows.filter((r) => r.row < firstWingRow);
    const half = Math.max(...proj.flatMap((r) => r.segs.map((s) => Math.max(Math.abs(s.u0), Math.abs(s.u1))))) + 0.3;
    for (const r of proj) r.endOverride = { lo: -half, hi: half };
    C.projHalf = half;
    C.projRows = proj.length;
  }

  for (const S of [...l3, ...l5, ...l7]) findVomitories(S);
  for (const S of [...l3, ...l5, ...l7]) findAisles(S);

  // Lower Stand centre: the wheelchair platform at the LEVEL 3 floor replaces rows 26-29
  // between the outer blocks; the two central aisles run into notches of the platform.
  {
    const C = l3[1];
    const i25 = C.rowIndex(25);
    const i26 = C.rowIndex(26);
    const i29 = C.rowIndex(29);
    const vm = C.rows[i25].v;
    const central = C.rows[i25].lanes.filter((l) => Math.abs((l.lo(vm) + l.hi(vm)) / 2) < 9).sort((p, q) => p.lo(vm) - q.lo(vm));
    const v0 = C.rows[i26].vF;
    const v1 = C.rows[i29].vB;
    // outer edges from the official outline: 11.0 m at the front, 11.7 m at the back (symmetrised)
    const pe = (v) => 11.0 + (0.7 * (v - v0)) / (v1 - v0);
    const ne = (v) => -pe(v);
    const [la, lb] = central;
    C.platform = { v0, v1, pe, lanes: [la, lb], y: LEVEL_Y[3], iFirst: i26, iLast: i29, vNotch: C.rows[i29].vF };
    for (let i = i26; i <= i29; i++) {
      const r = C.rows[i];
      if (i < i29) r.holes.push({ a: ne, b: la.lo, platform: true }, { a: la.hi, b: lb.lo, platform: true }, { a: lb.hi, b: pe, platform: true });
      else r.holes.push({ a: ne, b: pe, platform: true });
    }
  }

  T[3] = { stands: l3, soffit: soffitLine(l3, 0.3) };
  T[5] = { stands: l5, soffit: soffitLine(l5, 0.35) };
  T[7] = { stands: l7, soffit: soffitLine(l7, 0.3) };
  for (const tier of [3, 5, 7]) {
    T[tier].byFacet = Object.fromEntries(T[tier].stands.map((s) => [s.facet, s]));
    for (const S of T[tier].stands) S.soffit = T[tier].soffit;
  }
  return T;
}

/** Sub-intervals of [A, B] (functions of v) left after removing holes; evaluated at vm for ordering. */
export function subtractHoles(A, B, holes, vm) {
  const hs = holes.slice().sort((p, q) => p.a(vm) - q.a(vm));
  const out = [];
  let cur = A;
  for (const h of hs) {
    if (h.b(vm) <= cur(vm) || h.a(vm) >= B(vm)) continue;
    if (h.a(vm) - cur(vm) > 0.02) out.push({ a: cur, b: h.a });
    cur = h.b;
  }
  if (B(vm) - cur(vm) > 0.02) out.push({ a: cur, b: B });
  return out;
}

/** True when u (at station v) lies inside a hole of row r. */
export function inHole(r, u, v) {
  for (const h of r.holes) if (u > h.a(v) && u < h.b(v)) return true;
  return false;
}

// Stepped terraces of one stand facet: a tread and a riser per row, intermediate steps
// and nosing lines in the radial aisles, the raking soffit and the cheek wall at the
// outer end of a wing.
import { P, hq, sq, vq, vqv, swall, tube } from './soup.js';
import { subtractHoles, inHole, BIS, COS_H } from './layout.js';

/**
 * Treads, risers and aisle steps of a stand facet. `rails` collects the positions of the
 * central aisle handrails (built as instances afterwards).
 */
export function buildTerraces(soup, M, S, level, rails) {
  const { F, rows } = S;
  const bkT = soup.get(M.terrace, { level, group: 'terraces' });
  const bkR = soup.get(M.riser, { level, group: 'terraces' });
  const bkN = soup.get(M.nosing, { level, group: 'nosings', cast: false });
  const bkA = soup.get(M.aisleLight, { level, group: 'aisleLights', cast: false });
  rows.forEach((r, i) => {
    const vm = (r.vF + r.vB) / 2;
    const A = (v) => S.endLo(i, v);
    const B = (v) => S.endHi(i, v);
    for (const iv of subtractHoles(A, B, r.holes, vm)) hq(bkT, F, iv.a(r.vF), iv.b(r.vF), r.vF, iv.a(r.vB), iv.b(r.vB), r.vB, r.y, 1);
    if (i > 0) {
      const p = rows[i - 1];
      const A2 = (v) => Math.max(S.endLo(i, v), S.endLo(i - 1, v));
      const B2 = (v) => Math.min(S.endHi(i, v), S.endHi(i - 1, v));
      for (const iv of subtractHoles(A2, B2, [...r.holes, ...p.holes], r.vF)) vqv(bkR, F, iv.a(r.vF), iv.b(r.vF), r.vF, p.y, r.y, -1);
    }
    for (const lane of r.lanes) laneSteps(S, r, lane, bkT, bkR, bkN, bkA, rails);
  });
}

function laneSteps(S, r, lane, bkT, bkR, bkN, bkA, rails) {
  const { F } = S;
  const vm = (r.vF + r.vB) / 2;
  const um = (lane.lo(vm) + lane.hi(vm)) / 2;
  if (inHole(r, um, vm)) return;
  const d = r.vB - r.vF;
  const n = lane.steps ? r.n : 1;
  const dy = r.rise / r.n;
  const walled = lane.wallSide && r.i >= lane.wallFrom;
  for (let k = 0; k < n; k++) {
    const v0 = r.vF + (k * d) / n;
    const v1 = r.vF + ((k + 1) * d) / n;
    const yk = r.y + k * dy;
    if (k > 0) {
      hq(bkT, F, lane.lo(v0), lane.hi(v0), v0, lane.lo(v1), lane.hi(v1), v1, yk, 1);
      vqv(bkR, F, lane.lo(v0), lane.hi(v0), v0, yk - dy, yk, -1);
      if (!(walled && lane.wallSide === 'lo')) vq(bkR, F, lane.lo(v0), v0, lane.lo(v1), v1, r.y, yk, r.y, yk, -1, 0);
      if (!(walled && lane.wallSide === 'hi')) vq(bkR, F, lane.hi(v0), v0, lane.hi(v1), v1, r.y, yk, r.y, yk, 1, 0);
    }
    // two photoluminescent lines on every nosing
    for (const [o0, o1] of [[0.035, 0.065], [0.1, 0.13]]) {
      const a = v0 + o0;
      const b = v0 + o1;
      hq(bkN, F, lane.lo(a) + 0.04, lane.hi(a) - 0.04, a, lane.lo(b) + 0.04, lane.hi(b) - 0.04, b, yk + 0.004, 1);
    }
  }
  // small amber aisle lights at the row ends, on the riser of the next row
  if (lane.steps && S.rows[r.i + 1] && !S.rows[r.i + 1].extra) {
    const v = r.vB - 0.006;
    const y1 = r.y + r.rise - 0.06;
    const y0 = y1 - 0.06;
    const next = S.rows[r.i + 1];
    const sides = [];
    if (!(lane.kind === 'bis' && lane.side === 'lo') && !(walled && lane.wallSide === 'lo')) sides.push([lane.lo(v) - 0.17, lane.lo(v) - 0.07]);
    if (!(lane.kind === 'bis' && lane.side === 'hi') && !(walled && lane.wallSide === 'hi')) sides.push([lane.hi(v) + 0.07, lane.hi(v) + 0.17]);
    for (const [a, b] of sides) {
      const um2 = (a + b) / 2;
      if (inHole(next, um2, v) || inHole(r, um2, v)) continue;
      if (um2 < S.endLo(next.i, v) + 0.05 || um2 > S.endHi(next.i, v) - 0.05) continue;
      vqv(bkA, F, a, b, v, y0, y1, -1);
    }
  }
  // central handrail
  if (lane.rail && lane.steps && r.n > 1) {
    if (S.tier === 3 && r.row % 2 === 1) return;
    if (lane.kind === 'bis') {
      if (S.facet !== 'C') return; // one rail on the junction line, emitted by the centre facet
      const side = S.ends[lane.side].side;
      const u = S.ends[lane.side].line(r.vF);
      const [x, , z] = P(F, u, 0, r.vF);
      rails.push({ F: BIS[side].F, x, z, y: r.y, d: d / COS_H, rise: r.rise, n: r.n, tier: S.tier });
    } else {
      const [x, , z] = P(F, um, 0, r.vF);
      rails.push({ F, x, z, y: r.y, d, rise: r.rise, n: r.n, tier: S.tier });
    }
  }
}

/**
 * Closed raking soffit of a stand facet. `holes`: [{ a, b, v0, v1 }] plan openings (u
 * bounds as functions of v) where a vomitory tunnel passes through the soffit plane.
 * `frontOffset`: how far the soffit starts in front of the first tread.
 */
export function buildSoffit(soup, M, S, level, holes = [], frontOffset = 0) {
  const { F, rows } = S;
  const bk = soup.get(M.soffit, { level, group: 'soffit', cast: false });
  const ys = (i, v) => Math.min(S.soffit.at(S.apo(v)), rows[i].y - 0.28);
  rows.forEach((r, i) => {
    const s0 = i === 0 ? r.vF - frontOffset : r.vF;
    const s1 = r.vB;
    const cuts = [s0, s1];
    for (const h of holes) for (const v of [h.v0, h.v1]) if (v > s0 + 1e-3 && v < s1 - 1e-3) cuts.push(v);
    cuts.sort((p, q) => p - q);
    for (let k = 0; k + 1 < cuts.length; k++) {
      const a = cuts[k];
      const b = cuts[k + 1];
      const m = (a + b) / 2;
      const act = holes.filter((h) => h.v0 <= m && h.v1 >= m);
      const A = (v) => S.endRaw('lo', i, v);
      const B = (v) => S.endRaw('hi', i, v);
      for (const iv of subtractHoles(A, B, act, m)) sq(bk, F, iv.a(a), iv.b(a), a, ys(i, a), iv.a(b), iv.b(b), b, ys(i, b), -1);
    }
  });
}

/** Height of the soffit under row i of a stand at station v. */
export function soffitY(S, v) {
  return S.soffit.at(S.apo(v));
}

/**
 * Cheek wall at the outer end of a wing: closes the side of the stand from the soffit up
 * to 1.1 m above the nosing line, with a black handrail on top.
 */
export function buildCheek(soup, M, S, level, frontT = 0.25) {
  const k = S.ends.lo.type === 'O' ? 'lo' : S.ends.hi.type === 'O' ? 'hi' : null;
  if (!k) return;
  const { F, rows } = S;
  const bk = soup.get(M.parapet, { level, group: 'cheek' });
  const bkH = soup.get(M.handrail, { level, group: 'guards' });
  const u = S.ends[k].u;
  const su = k === 'lo' ? -1 : 1;
  const reg = rows.filter((r) => !r.extra);
  const first = reg[0];
  const last = reg[reg.length - 1];
  const slope = (last.y - first.y) / (last.vF - first.vF);
  const top = (v) => first.y + slope * (v - first.vF) + 1.1;
  const bot = (v) => soffitY(S, v) - 0.12;
  const v0 = first.vF - frontT;
  const v1 = last.vB;
  swall(bk, F, [u, v0], [u, v1], 0.2, su, 0, bot(v0), top(v0), bot(v1), top(v1));
  const um = u + su * 0.1;
  tube(bkH, P(F, um, top(v0) + 0.07, v0 + 0.05), P(F, um, top(v1) + 0.07, v1), 0.022, 6);
  for (let v = v0 + 0.3; v < v1; v += 1.6) tube(bkH, P(F, um, top(v) - 0.02, v), P(F, um, top(v) + 0.07, v), 0.016, 5);
  for (const r of rows.filter((q) => q.extra)) {
    swall(bk, F, [u, r.vF], [u, r.vB], 0.2, su, 0, r.y - 0.4, r.y + 1.1, r.y - 0.4, r.y + 1.1, 'a');
    tube(bkH, P(F, um, r.y + 1.17, r.vF), P(F, um, r.y + 1.17, r.vB), 0.022, 6);
  }
}

/** Vertical wall on the plane v = const, from ua to ub, with rectangular openings [{a, b, y0, y1}] (sorted or not). */
export function wallWithOpenings(bk, F, ua, ub, v, t, y0, y1, openings = []) {
  const ops = openings
    .map((o) => ({ ...o, a: Math.max(o.a, ua), b: Math.min(o.b, ub) }))
    .filter((o) => o.b > o.a)
    .sort((p, q) => p.a - q.a);
  let cur = ua;
  const solid = (a, b, ya, yb) => {
    if (b - a < 1e-3 || yb - ya < 1e-3) return;
    swall(bk, F, [a, v], [b, v], t, 0, 1, ya, yb, ya, yb);
  };
  for (const o of ops) {
    solid(cur, o.a, y0, y1);
    solid(o.a, o.b, y0, Math.max(y0, o.y0)); // sill (if the opening starts above the wall base)
    solid(o.a, o.b, Math.min(y1, o.y1), y1); // lintel
    cur = o.b;
  }
  solid(cur, ub, y0, y1);
}

export { hq, vqv };

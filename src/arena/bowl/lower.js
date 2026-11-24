// Lower Stand specifics: the 3 m front wall of the fixed stand with its parapet, the
// arena portals of gates 102 / 103 at the facet junctions, the seven telescopic units
// (rows 1-11) on the arena floor and the wheelchair platform at the rear centre.
import { PARTS, TREAD_FRONT, GATES } from '../../core/seating.js';
import { SPEC } from '../../core/spec.js';
import { H } from '../../core/frame.js';
import { P, hq, vq, vqv, fbox, fprism, tube, toFrame } from './soup.js';
import { wallWithOpenings } from './stands.js';

const WALL_T = 0.25; // front wall thickness
const Y_BAND = 2.85; // above this the wall is the cream band of the fixed stand front
const PARAPET_H = 1.1;
const PORTAL_H = 2.5;
const PORTAL_W = 3.6;
const PIER = 0.45; // half width of the corner pier between the two portal halves

/** Posts and a rail along v = const. */
function railRun(bk, F, ua, ub, v, yBase, yRail, r = 0.02, postR = 0.014, pitch = 1.5) {
  if (ub - ua < 0.3) return;
  tube(bk, P(F, ua, yRail, v), P(F, ub, yRail, v), r, 6);
  const n = Math.max(1, Math.round((ub - ua) / pitch));
  for (let i = 0; i <= n; i++) {
    const u = ua + 0.06 + ((ub - ua - 0.12) * i) / n;
    tube(bk, P(F, u, yBase, v), P(F, u, yRail, v), postR, 5);
  }
}

/** Range of the front wall of a Lower Stand facet (it runs on to the hall side wall on the wings). */
function frontRange(S, vF) {
  const { F } = S;
  const corners = SPEC.hall.arenaFloor.polygonStandsRetracted_H.map(([x, y]) => toFrame(F, ...H(x, y)));
  const end = (k) => {
    const e = S.ends[k];
    if (e.type === 'J') return e.line(vF) + (k === 'lo' ? -0.1 : 0.1);
    // corner of the flat floor polygon lying on this wall line
    const onLine = corners.filter(([, v]) => Math.abs(v - vF) < 0.4).map(([u]) => u);
    const u = k === 'lo' ? Math.min(...onLine) : Math.max(...onLine);
    return Number.isFinite(u) ? u + (k === 'lo' ? 0.02 : -0.02) : e.u;
  };
  return [end('lo'), end('hi')];
}

/**
 * Arena portals in the front wall of a Lower Stand facet.
 *  - gates 102 / 103: at the centre / wing junction, under the wedge blocks, one half on each
 *    facet with a pier on the corner (official photographs);
 *  - gates 101 / 104: at the outer end of the wing diagonal, under the outer block (official
 *    LEVEL 1 map).
 * On the wings the openings run on behind the adjoining telescopic aisle stair as far as the
 * gate marker of the official map: that part is hidden while the telescopic rows are deployed
 * and uncovers the gate tunnel of arena/structure when they are retracted.
 */
function portalsOf(S, vF) {
  const out = [];
  const lanes = S.rows[0].lanes
    .filter((l) => !l.vom)
    .map((l) => [l.lo(vF), l.hi(vF)])
    .sort((p, q) => p[0] - q[0]);
  const first = lanes[0];
  const last = lanes[lanes.length - 1];
  for (const k of ['lo', 'hi']) {
    const e = S.ends[k];
    if (e.type === 'J') {
      const j = e.line(vF);
      if (S.facet === 'C') {
        out.push(k === 'lo' ? { k, a: j + PIER, b: j + PIER + PORTAL_W, line: e.line } : { k, a: j - PIER - PORTAL_W, b: j - PIER, line: e.line });
      } else if (k === 'hi') {
        out.push({ k, a: last[0] + 0.1, b: j - PIER, line: e.line, sign: (last[1] + j - PIER) / 2 });
      } else {
        out.push({ k, a: j + PIER, b: first[1] - 0.1, line: e.line, sign: (j + PIER + first[0]) / 2 });
      }
    } else {
      const id = S.facet === 'LW' ? '101' : '104';
      const [ug] = toFrame(S.F, ...GATES[id]);
      if (k === 'lo') out.push({ k: 'outer', a: e.u + 0.9, b: ug + 1.5, sign: (e.u + 0.9 + first[0]) / 2 });
      else out.push({ k: 'outer', a: ug - 1.5, b: e.u - 0.9, sign: (last[1] + e.u - 0.9) / 2 });
    }
  }
  return out;
}

export function buildLowerFront(soup, M, T3) {
  const bkDark = soup.get(M.frontWallDark, { level: 1, group: 'lowerFrontWall' });
  const bkCeil = soup.get(M.tunnelCeiling, { level: 1, group: 'lowerFrontWall', cast: false });
  const bkE = soup.get(M.exitSign, { level: 1, group: 'exitSigns', cast: false });
  const bkP = soup.get(M.parapet, { level: 3, group: 'front' });
  const bkS = soup.get(M.railSteel, { level: 3, group: 'frontRail' });
  for (const S of T3.stands) {
    const { F, rows } = S;
    const r12 = rows[0];
    const vF = r12.vF;
    const y12 = r12.y;
    const top = y12 + PARAPET_H;
    const [a, b] = frontRange(S, vF);
    const v0 = vF - WALL_T;
    const portals = portalsOf(S, vF);
    // dark lower wall (the telescopic units park against it), with the arena portals
    wallWithOpenings(bkDark, F, a, b, v0, WALL_T, 0, Y_BAND, portals.map((p) => ({ a: p.a, b: p.b, y0: 0, y1: PORTAL_H })));
    for (const p of portals) {
      // soffit of the opening (the ceiling of the LEVEL 1 concourse of arena/structure follows behind)
      const depth = 1.0;
      const la = (v) => (p.k === 'lo' ? p.line(v) : p.a);
      const lb = (v) => (p.k === 'hi' ? p.line(v) : p.b);
      hq(bkCeil, F, la(v0), lb(v0), v0, la(vF + depth), lb(vF + depth), vF + depth, PORTAL_H, -1);
      // reveals of the opening
      for (const [u, sgn] of [[p.a, 1], [p.b, -1]]) vq(bkDark, F, u, v0, u, vF, 0, PORTAL_H, 0, PORTAL_H, sgn, 0);
      const m = p.sign ?? (p.a + p.b) / 2;
      fbox(bkE, F, m - 0.3, m + 0.3, v0 - 0.03, v0, PORTAL_H + 0.06, PORTAL_H + 0.24, 'r');
    }
    // cream band = edge of the fixed stand, and the parapet in front of row 12
    fbox(bkP, F, a, b, v0, vF, Y_BAND, y12, 'b');
    const gaps = r12.lanes.filter((l) => !l.vom).map((l) => ({ a: l.lo(vF), b: l.hi(vF), y0: y12, y1: top + 1 }));
    wallWithOpenings(bkP, F, a, b, v0, WALL_T, y12, top, gaps);
    // steel rail on the parapet pieces
    const sorted = gaps.slice().sort((p, q) => p.a - q.a);
    let cur = a;
    for (const g of [...sorted, { a: b, b }]) {
      railRun(bkS, F, cur + 0.08, g.a - 0.08, vF - WALL_T / 2, top - 0.02, top + 0.18);
      cur = g.b;
    }
  }
}

/**
 * Telescopic stand: seven retractable units (rows 1-11) on the arena floor, with the aisle
 * stairs between them. Everything is tagged telescopic so the app can hide it.
 */
export function buildTelescopic(soup, M, T3) {
  const opt = { level: 3, group: 'telescopic', telescopic: true };
  const bkD = soup.get(M.teleDeck, opt);
  const bkR = soup.get(M.teleRiser, opt);
  const bkC = soup.get(M.teleCheek, opt);
  const bkN = soup.get(M.nosing, { ...opt, group: 'telescopicNosings', cast: false });
  const bkH = soup.get(M.handrail, { ...opt, group: 'telescopicRails' });
  const bkL = soup.get(M.teleStepLight, { ...opt, group: 'telescopicLights', cast: false });
  const bkS = soup.get(M.railSteel, { ...opt, group: 'telescopicRails' });
  const units = [];
  for (const S of T3.stands) {
    const { F } = S;
    const part = PARTS.find((p) => p.key === `L3/${S.facet}`);
    const src = part.rows.filter((r) => r.kind === 'telescopic').sort((p, q) => p.v - q.v);
    if (!src.length) continue;
    const vF12 = S.rows[0].vF;
    const wo = vF12 - WALL_T; // outer face of the front wall
    const tr = src.map((r, i) => ({ y: r.y, vF: r.v - TREAD_FRONT, vB: i + 1 < src.length ? src[i + 1].v - TREAD_FRONT : wo - 0.02, yPrev: i ? src[i - 1].y : 0 }));
    // decks: one per seat block
    const groups = new Map();
    for (const r of src) {
      for (const s of r.segs) {
        const g = groups.get(s.first) || { u0: Infinity, u1: -Infinity, first: s.first, last: s.last };
        g.u0 = Math.min(g.u0, s.u0);
        g.u1 = Math.max(g.u1, s.u1);
        groups.set(s.first, g);
      }
    }
    const decks = [...groups.values()].sort((p, q) => p.u0 - q.u0).map((g) => ({ ...g, u0: g.u0 - 0.03, u1: g.u1 + 0.03 }));
    for (const d of decks) {
      units.push({ facet: S.facet, seats: [d.first, d.last] });
      for (const t of tr) {
        hq(bkD, F, d.u0, d.u1, t.vF, d.u0, d.u1, t.vB, t.y, 1);
        vqv(bkR, F, d.u0, d.u1, t.vF, t.yPrev, t.y, -1);
        // black side cheeks
        vq(bkC, F, d.u0, t.vF, d.u0, t.vB, 0, t.y, 0, t.y, -1, 0);
        vq(bkC, F, d.u1, t.vF, d.u1, t.vB, 0, t.y, 0, t.y, 1, 0);
      }
    }
    // aisle stairs beside and between the decks, in line with the aisles of the fixed stand
    for (const lane of S.rows[0].lanes) {
      if (lane.vom) continue;
      let la = lane.lo(vF12);
      let lb = lane.hi(vF12);
      const c = (la + lb) / 2;
      const left = decks.filter((d) => d.u1 <= c).sort((p, q) => q.u1 - p.u1)[0];
      const right = decks.filter((d) => d.u0 >= c).sort((p, q) => p.u0 - q.u0)[0];
      const nearL = left && la - left.u1 < 0.8;
      const nearR = right && right.u0 - lb < 0.8;
      if (!nearL && !nearR) continue;
      if (nearL) la = left.u1;
      if (nearR) lb = right.u0;
      const step = (va, vb, y, yFrom) => {
        hq(bkD, F, la, lb, va, la, lb, vb, y, 1);
        vqv(bkR, F, la, lb, va, yFrom, y, -1);
        vq(bkC, F, la, va, la, vb, 0, y, 0, y, -1, 0);
        vq(bkC, F, lb, va, lb, vb, 0, y, 0, y, 1, 0);
        for (const [o0, o1] of [[0.035, 0.065], [0.1, 0.13]]) hq(bkN, F, la + 0.04, lb - 0.04, va + o0, la + 0.04, lb - 0.04, va + o1, y + 0.004, 1);
        // blue LED strip under the nosing of every step
        if (y - yFrom > 0.06) vqv(bkL, F, la + 0.05, lb - 0.05, va - 0.006, y - 0.04, y - 0.012, -1);
      };
      // starting step on the arena floor
      step(tr[0].vF - 0.4, tr[0].vF, 0.125, 0);
      let prevTop = 0.125;
      tr.forEach((t, i) => {
        if (i < tr.length - 1) {
          const mid = (t.vF + t.vB) / 2;
          step(t.vF, mid, t.y, prevTop);
          step(mid, t.vB, t.y + 0.125, t.y);
          prevTop = t.y + 0.125;
        } else {
          // top row: up to the level of row 12 through the gap in the parapet
          const y12 = S.rows[0].y;
          const dy = (y12 - t.y) / 3;
          step(t.vF, wo - 0.8, t.y, prevTop);
          step(wo - 0.8, wo - 0.4, t.y + dy, t.y);
          step(wo - 0.4, wo, t.y + 2 * dy, t.y + dy);
        }
      });
      // guard rail on a stair side that has no deck beside it (toward a portal or the hall wall)
      const y12g = S.rows[0].y;
      for (const [open, u] of [[!nearL, la + 0.03], [!nearR, lb - 0.03]]) {
        if (!open) continue;
        const vA = tr[0].vF - 0.38;
        const vB = wo - 0.04;
        const yA = 0.125;
        const yB = y12g;
        const at = (v) => yA + ((yB - yA) * (v - vA)) / (vB - vA);
        tube(bkS, P(F, u, yA + 1.0, vA), P(F, u, yB + 1.0, vB), 0.021, 6);
        tube(bkS, P(F, u, yA + 0.52, vA), P(F, u, yB + 0.52, vB), 0.015, 5);
        const n = 6;
        for (let q = 0; q <= n; q++) {
          const v = vA + ((vB - vA) * q) / n;
          tube(bkS, P(F, u, at(v) - 0.1, v), P(F, u, at(v) + 1.0, v), 0.017, 5);
        }
      }
      // central handrail in loops of two rows
      if (lb - la > 1.3) {
        for (let i = 0; i + 1 < tr.length; i += 2) {
          const t0 = tr[i];
          const t1 = tr[i + 1];
          const va = t0.vF + 0.62;
          const vb = t1.vF + 0.62;
          const ya = t0.y + 0.125;
          const yb = t1.y + 0.125;
          const pa = P(F, c, ya, va);
          const pb = P(F, c, yb, vb);
          const qa = P(F, c, ya + 0.9, va);
          const qb = P(F, c, yb + 0.9, vb);
          tube(bkH, pa, qa, 0.02, 6);
          tube(bkH, pb, qb, 0.02, 6);
          tube(bkH, qa, qb, 0.02, 6);
          tube(bkH, P(F, c, ya + 0.45, va), P(F, c, yb + 0.45, vb), 0.015, 5);
        }
      }
    }
  }
  return units;
}

/**
 * The same units in their stowed position: the eleven decks nest under each other into a
 * stack one tread deep against the front wall of the fixed stand (wall-stored type).
 */
export function buildTelescopicStowed(soup, M, T3) {
  const opt = { level: 3, group: 'telescopicStowed' };
  const bkC = soup.get(M.teleCheek, opt);
  const bkD = soup.get(M.teleDeck, opt);
  const bkR = soup.get(M.teleRiser, opt);
  const bkH = soup.get(M.handrail, opt);
  for (const S of T3.stands) {
    const { F } = S;
    // removable gates across the aisle openings of the parapet while the stairs below are away
    const vg = S.rows[0].vF - WALL_T / 2;
    const y12 = S.rows[0].y;
    for (const lane of S.rows[0].lanes) {
      if (lane.vom) continue;
      const a = lane.lo(vg);
      const b = lane.hi(vg);
      for (const h of [0.55, 1.08]) tube(bkH, P(F, a, y12 + h, vg), P(F, b, y12 + h, vg), 0.02, 6);
      tube(bkH, P(F, (a + b) / 2, y12 + 0.02, vg), P(F, (a + b) / 2, y12 + 1.08, vg), 0.016, 5);
    }
    const part = PARTS.find((p) => p.key === `L3/${S.facet}`);
    const src = part.rows.filter((r) => r.kind === 'telescopic');
    if (!src.length) continue;
    const top = Math.max(...src.map((r) => r.y));
    const wo = S.rows[0].vF - WALL_T;
    const groups = new Map();
    for (const r of src) {
      for (const sg of r.segs) {
        const g = groups.get(sg.first) || { u0: Infinity, u1: -Infinity };
        g.u0 = Math.min(g.u0, sg.u0);
        g.u1 = Math.max(g.u1, sg.u1);
        groups.set(sg.first, g);
      }
    }
    for (const g of groups.values()) {
      const v0 = wo - 0.95;
      const v1 = wo - 0.02;
      hq(bkD, F, g.u0, g.u1, v0, g.u0, g.u1, v1, top, 1);
      vq(bkC, F, g.u0, v0, g.u0, v1, 0, top, 0, top, -1, 0);
      vq(bkC, F, g.u1, v0, g.u1, v1, 0, top, 0, top, 1, 0);
      // front of the stack: the nosing beams of the nested decks, one above the other
      const n = src.length;
      for (let i = 0; i < n; i++) vqv(i % 2 ? bkC : bkR, F, g.u0, g.u1, v0 - (i % 2 ? 0 : 0.02), (top * i) / n, (top * (i + 1)) / n, -1);
    }
  }
}

/** Wheelchair platform at the LEVEL 3 floor, rear centre of the Lower Stand. */
export function buildPlatform(soup, M, C) {
  const pf = C.platform;
  if (!pf) return;
  const { F } = C;
  const level = 3;
  const bkT = soup.get(M.terrace, { level, group: 'wheelchairPlatform' });
  const bkP = soup.get(M.parapet, { level, group: 'wheelchairPlatform' });
  const bkH = soup.get(M.handrail, { level, group: 'guards' });
  const [la, lb] = pf.lanes;
  const { v0, v1, vNotch, pe, y } = pf;
  const yb = C.rows[pf.iFirst - 1].y - 0.3;
  const pieces = [
    [-pe(v0), la.lo(v0), la.lo(vNotch), -pe(vNotch)],
    [la.hi(v0), lb.lo(v0), lb.lo(vNotch), la.hi(vNotch)],
    [lb.hi(v0), pe(v0), pe(vNotch), lb.hi(vNotch)],
  ];
  for (const [a0, b0, b1, a1] of pieces) {
    const pts = [
      [a0, v0],
      [b0, v0],
      [b1, vNotch],
      [a1, vNotch],
    ];
    fprism(bkT, F, pts, yb, y, { bottom: false, sides: false });
    fprism(bkP, F, pts, yb, y, { top: false, bottom: false });
    // guard at the front edge
    for (const yr of [y + 0.9, y + 0.45]) tube(bkH, P(F, a0 + 0.06, yr, v0 + 0.06), P(F, b0 - 0.06, yr, v0 + 0.06), yr > y + 0.5 ? 0.022 : 0.015, 6);
    const n = Math.max(1, Math.round((b0 - a0) / 1.4));
    for (let i = 0; i <= n; i++) {
      const u = a0 + 0.06 + ((b0 - a0 - 0.12) * i) / n;
      tube(bkH, P(F, u, y, v0 + 0.06), P(F, u, y + 0.9, v0 + 0.06), 0.016, 5);
    }
  }
  const back = [
    [-pe(vNotch), vNotch],
    [pe(vNotch), vNotch],
    [pe(v1), v1],
    [-pe(v1), v1],
  ];
  fprism(bkT, F, back, yb, y, { bottom: false, sides: false });
  fprism(bkP, F, back, yb, y, { top: false, bottom: false });
  // guards along the two aisle notches
  for (const l of [la, lb]) {
    for (const u of [l.lo(v0) - 0.06, l.hi(v0) + 0.06]) {
      for (const yr of [y + 0.9, y + 0.45]) tube(bkH, P(F, u, yr, v0 + 0.06), P(F, u, yr, vNotch), yr > y + 0.5 ? 0.022 : 0.015, 6);
      tube(bkH, P(F, u, y, vNotch - 0.05), P(F, u, y + 0.9, vNotch - 0.05), 0.016, 5);
      tube(bkH, P(F, u, y, (v0 + vNotch) / 2), P(F, u, y + 0.9, (v0 + vNotch) / 2), 0.016, 5);
    }
  }
}

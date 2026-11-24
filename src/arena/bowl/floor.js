// Flat arena floor (LEVEL 1): sealed concrete slab on the "stands retracted" polygon, the
// removable cover strips of the cable trenches and the painted outlines of the seat blocks.
import { PARTS } from '../../core/seating.js';
import { SPEC } from '../../core/spec.js';
import { H } from '../../core/frame.js';
import { prism } from '../../core/geom.js';
import { P, hq, quad } from './soup.js';
import { FR } from './layout.js';

export function buildArenaFloor(soup, M) {
  const level = 1;
  const ring = SPEC.hall.arenaFloor.polygonStandsRetracted_H.map(([x, y]) => H(x, y));
  const bkF = soup.get(M.arenaFloor, { level, group: 'arenaFloor', cast: false });
  bkF.extra.push(prism(ring, -0.3, 0));
  const F = FR.C;
  const zEnd = Math.max(...ring.map((p) => p[1]));

  // cover strips: on the axis (0.6 m) and along the two aisles beside the centre block
  const bkS = soup.get(M.floorCover, { level, group: 'arenaFloorMarks', cast: false });
  const arena = PARTS.find((p) => p.tier === 1);
  const row1 = arena.rows[0];
  const lastRow = arena.rows[arena.rows.length - 1];
  const mid = row1.segs.findIndex((s) => s.u0 < 0 && s.u1 > 0);
  const strips = [{ u: 0, w: 0.6, v0: 0.05, v1: zEnd - 0.05 }];
  if (mid > 0) {
    const left = (row1.segs[mid - 1].u1 + row1.segs[mid].u0) / 2;
    const right = (row1.segs[mid].u1 + row1.segs[mid + 1].u0) / 2;
    strips.push({ u: left, w: 0.6, v0: 0.05, v1: lastRow.v + 1.6 }, { u: right, w: 0.6, v0: 0.05, v1: lastRow.v + 1.6 });
  }
  for (const s of strips) hq(bkS, F, s.u - s.w / 2, s.u + s.w / 2, s.v0, s.u - s.w / 2, s.u + s.w / 2, s.v1, 0.006, 1);

  // painted outlines of the 7 x 2 seat blocks of the official standard layout
  const bkL = soup.get(M.floorLine, { level, group: 'arenaFloorMarks', cast: false });
  const W = 0.06;
  const line = (u0, v0, u1, v1) => {
    const du = u1 - u0;
    const dv = v1 - v0;
    const l = Math.hypot(du, dv);
    if (l < 1e-3) return;
    const nu = (-dv / l) * (W / 2);
    const nv = (du / l) * (W / 2);
    const y = 0.009;
    quad(bkL, P(F, u0 - nu, y, v0 - nv), P(F, u1 - nu, y, v1 - nv), P(F, u1 + nu, y, v1 + nv), P(F, u0 + nu, y, v0 + nv), 0, 1, 0);
  };
  // the cross-aisle splits the rows into a front and a rear group
  let split = 0;
  let gapMax = 0;
  for (let i = 0; i + 1 < arena.rows.length; i++) {
    const g = arena.rows[i + 1].v - arena.rows[i].v;
    if (g > gapMax) {
      gapMax = g;
      split = i + 1;
    }
  }
  const groups = [arena.rows.slice(0, split), arena.rows.slice(split)];
  const blockOf = (s) => Math.floor((s.first - 1) / 20);
  for (const rows of groups) {
    for (let bIdx = 0; bIdx < 7; bIdx++) {
      const pts = rows.map((r) => ({ v: r.v, s: r.segs.find((q) => blockOf(q) === bIdx) })).filter((p) => p.s);
      if (pts.length < 2) continue;
      const m = 0.12;
      const first = pts[0];
      const last = pts[pts.length - 1];
      const vf = first.v - 0.5;
      const vb = last.v + 0.4;
      line(first.s.u0 - m, vf, first.s.u1 + m, vf);
      line(last.s.u0 - m, vb, last.s.u1 + m, vb);
      // sides follow the trimmed row ends
      for (const side of ['u0', 'u1']) {
        const sg = side === 'u0' ? -m : m;
        let pu = first.s[side] + sg;
        let pv = vf;
        for (let i = 1; i < pts.length; i++) {
          const u = pts[i].s[side] + sg;
          if (Math.abs(u - pu) > 0.02 || i === pts.length - 1) {
            const v = i === pts.length - 1 ? vb : pts[i].v - 0.41;
            if (Math.abs(u - pu) > 0.02 && i !== pts.length - 1) {
              line(pu, pv, pu, v);
              line(pu, v, u, v);
            } else {
              line(pu, pv, pu, v);
              if (Math.abs(u - pu) > 0.02) line(pu, v, u, v);
            }
            pu = u;
            pv = v;
          }
        }
      }
    }
  }
}

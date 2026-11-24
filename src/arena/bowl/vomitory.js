// Vomitories of the Middle and Upper Stands.
//
// Reading of the official seat map: the rows 11-17 (Middle) / 6-10 (Upper) are
// interrupted at every gate. The first interrupted row is the cross landing in front of
// the mouth (at its own row level), the last one is the cover row (the tunnel roof is
// flush with it and can carry seats, e.g. seats 87-90 in row 17 at gate 505). In between
// the vomitory is an open trench and then a roofed concrete box with a solid parapet.
// Narrow stairs run along both sides of the box. Inside, steps lead from the landing down to
// the concourse level (LEVEL_Y): four risers on the Middle Stand (landing +13.36, LEVEL 5
// +12.67), about seventeen on the Upper Stand (landing +25.84 next to the row-5 level +25.4,
// LEVEL 7 +23.47). The Middle Stand tunnels run on to the back plane of the stand
// (STAND_EXTENT vBack); the Upper Stand tunnels end at the back edge of the cover row, where
// the LEVEL 7 slab and the gate lobbies of arena/structure begin.
//
// A vomitory is built in a plan frame F with its axis on u = uc: a facet frame for the
// regular gates, a bisector frame for the gates on the centre / wing junctions.
import { LEVEL_Y } from '../../core/envelope.js';
import { P, tri, hq, sq, vq, vqv, fbox, swall, tube } from './soup.js';
import { VOM_HW, VOM_WALL, BIS, bisStation, apoAtBis, vOfApo, TAN_H, COS_H } from './layout.js';

const constFn = (c) => () => c;

function finishSpec(sp) {
  const { tier, vL0, notch, vBox0, vCov1, vEnd, yL, yRoof, soffit, apoMid } = sp;
  sp.level = tier;
  sp.yBack = LEVEL_Y[tier] + 0.012;
  sp.yMouth = tier === 5 ? sp.yBack : sp.yBelow; // Upper Stand: level of the row in front of the landing (+25.4)
  const flights = [];
  if (sp.yMouth - sp.yBack > 0.05) {
    // Upper Stand: one flight from the landing down to the concourse level, inside the cut
    // (the concourse of arena/structure starts right behind the cover row)
    const n = Math.max(2, Math.round((yL - sp.yBack) / 0.16));
    const v0 = vL0 + notch;
    flights.push({ v0, n, dy: (yL - sp.yBack) / n, going: Math.min(0.28, (vCov1 - 0.06 - v0) / (n - 1)), yTop: yL });
  } else {
    const n = Math.max(1, Math.round((yL - sp.yMouth) / 0.165));
    flights.push({ v0: vL0 + notch, n, dy: (yL - sp.yMouth) / n, going: 0.3, yTop: yL });
  }
  for (const f of flights) f.v1 = f.v0 + (f.n - 1) * f.going; // last riser
  sp.flights = flights;
  sp.end = vEnd;
  sp.roofT = tier === 5 ? 0.3 : 0.45;
  sp.ceilBox = yRoof - sp.roofT;
  sp.ceilBehind = yRoof - 0.5;
  sp.floorTop = (v) => {
    let y = yL;
    for (const f of flights) {
      if (v < f.v0) break;
      const k = Math.min(f.n, Math.floor((v - f.v0) / f.going + 1e-9) + 1);
      y = f.yTop - k * f.dy;
    }
    return y;
  };
  // underside of the floor: polyline of [v, y]
  const under = [[vL0, yL - 0.4], [flights[0].v1, sp.yBack - (tier === 5 ? 0.4 : 0.25)]];
  under.push([Math.max(sp.end, flights[0].v1 + 0.01), under[under.length - 1][1]]);
  sp.under = under;
  sp.floorBottom = (v) => {
    for (let i = 0; i + 1 < under.length; i++) {
      const [va, ya] = under[i];
      const [vb, yb] = under[i + 1];
      if (v <= vb) return vb - va < 1e-6 ? yb : ya + ((yb - ya) * Math.max(0, v - va)) / (vb - va);
    }
    return under[under.length - 1][1];
  };
  const ceil = (v) => (v < vBox0 ? Infinity : v < vCov1 ? sp.ceilBox : sp.ceilBehind);
  // where the raking soffit of the stand passes through the tunnel volume
  let va = null;
  let vb = null;
  for (let v = vL0; v <= sp.end + 1e-6; v += 0.005) {
    const ys = soffit.at(apoMid(v));
    if (va === null) {
      if (ys >= sp.floorTop(v) - 0.12) va = v - 0.006;
    } else if (ys >= ceil(v) + 0.12) {
      vb = v;
      break;
    }
  }
  if (va !== null && vb === null) vb = sp.end; // the soffit is inside the roof slab at the tunnel end, or ends there too
  sp.va = va;
  sp.vb = vb;
  return sp;
}

/** Spec of a regular vomitory V of stand S. */
export function regularSpec(S, V) {
  const { rows, F } = S;
  const land = rows[V.ra];
  const cover = rows[V.rb];
  const vL0 = rows[V.ra + 1].vF;
  const slope = land.rise / (land.vB - land.vF);
  const sp = finishSpec({
    tier: S.tier,
    gate: V.gate,
    F,
    uc: V.uc,
    hw: V.hw,
    notch: 0,
    vL0,
    vBox0: rows[V.rx].vF,
    vCov0: cover.vF,
    vCov1: cover.vB,
    vEnd: S.tier === 7 ? cover.vB : S.vBack,
    yL: land.y,
    yBelow: rows[V.ra - 1].y,
    yRoof: cover.y,
    yLane: (v) => land.y + land.rise + (v - vL0) * slope,
    apoMid: (v) => S.apo(v),
    apoWall: (v) => S.apo(v),
    soffit: S.soffit,
  });
  if (sp.va !== null) sp.holes = [{ S, a: constFn(V.uc - V.hw + VOM_WALL / 2), b: constFn(V.uc + V.hw - VOM_WALL / 2), v0: sp.va, v1: sp.vb }];
  else sp.holes = [];
  return sp;
}

/** Spec of the junction vomitory on side 'L' or 'R' of a tier (C = centre stand, W = the wing stand on that side). */
export function junctionSpec(C, W, side) {
  const k = side === 'L' ? 'lo' : 'hi';
  const J = C.jv[k];
  if (!J) return null;
  const { rows } = C;
  const hw = VOM_HW;
  const land = rows[J.ra];
  const cover = rows[J.rb];
  const st = (v) => bisStation(C.apo(v), hw);
  const vL0 = st(rows[J.ra + 1].vF);
  const slope = land.rise / (land.vB - land.vF);
  const apoL = C.apo(rows[J.ra + 1].vF);
  const vCov1 = st(cover.vB);
  const sp = finishSpec({
    tier: C.tier,
    gate: J.gate,
    F: BIS[side].F,
    uc: BIS[side].u,
    hw,
    notch: hw * TAN_H,
    vL0,
    vBox0: st(rows[J.rx].vF),
    vCov0: st(cover.vF),
    vCov1,
    vEnd: vCov1,
    yL: land.y,
    yBelow: rows[J.ra - 1].y,
    yRoof: cover.y,
    yLane: (v) => land.y + land.rise + (apoAtBis(v, hw) - apoL) * slope,
    apoMid: (v) => apoAtBis(v, hw / 2),
    apoWall: (v) => apoAtBis(v, hw),
    soffit: C.soffit,
  });
  sp.holes = [];
  if (sp.va !== null) {
    const a0 = apoAtBis(sp.va, hw / 2);
    const a1 = apoAtBis(sp.vb, hw / 2);
    const cc = (hw - VOM_WALL / 2) / COS_H;
    for (const S of [C, W]) {
      for (const kk of ['lo', 'hi']) {
        const e = S.ends[kk];
        if (e.type !== 'J' || e.side !== side) continue;
        const line = e.line;
        const hole = kk === 'lo' ? { a: (v) => line(v) - 6, b: (v) => line(v) + cc } : { a: (v) => line(v) - cc, b: (v) => line(v) + 6 };
        sp.holes.push({ S, ...hole, v0: vOfApo(S.F, a0), v1: vOfApo(S.F, a1) });
      }
    }
  }
  return sp;
}

/** Geometry of one vomitory. */
export function buildVomitory(soup, M, sp) {
  const { F, uc, hw, level, vL0, notch, vBox0, vCov0, vCov1, yL, yRoof, flights, ceilBox, ceilBehind, end } = sp;
  const w = VOM_WALL;
  const uL = uc - hw;
  const uR = uc + hw;
  const iL = uL + w;
  const iR = uR - w;
  const g = 'vomitory';
  const bkP = soup.get(M.portal, { level, group: g });
  const bkF = soup.get(M.tunnelFloor, { level, group: g });
  const bkW = soup.get(M.tunnelWall, { level, group: g });
  const bkC = soup.get(M.tunnelCeiling, { level, group: g, cast: false });
  const bkT = soup.get(M.terrace, { level, group: g });
  const bkSkin = soup.get(M.soffit, { level, group: 'soffit', cast: false });
  const bkH = soup.get(M.handrail, { level, group: 'guards' });
  const bkE = soup.get(M.exitSign, { level, group: 'exitSigns', cast: false });
  const fv0 = flights[0].v0;

  // landing remainder behind the V-shaped rear edge of the cross landing (junction gates)
  if (notch > 0) {
    tri(bkT, P(F, uL, yL, vL0), P(F, uc, yL, fv0), P(F, uL, yL, fv0), 0, 1, 0);
    tri(bkT, P(F, uR, yL, vL0), P(F, uc, yL, fv0), P(F, uR, yL, fv0), 0, 1, 0);
  }
  // flights and level floors
  const risers = [];
  for (const f of flights) for (let k = 0; k < f.n; k++) risers.push({ v: f.v0 + k * f.going, y1: f.yTop - k * f.dy, y0: f.yTop - (k + 1) * f.dy });
  risers.forEach((r, i) => {
    const next = i + 1 < risers.length ? risers[i + 1].v : end;
    vqv(bkF, F, iL, iR, r.v, r.y0, r.y1, 1);
    hq(bkF, F, iL, iR, r.v, iL, iR, next, r.y0, 1);
  });
  // dark outside of the tunnel where it hangs below the raking soffit of the stand
  const tTop = yRoof - 0.03;
  const soffitAt = (v) => sp.soffit.at(sp.apoWall(v)) + 0.03;
  const cuts = new Set(sp.under.map((p) => p[0]));
  cuts.add(vCov0);
  cuts.add(vCov1);
  {
    // station where the soffit rises above the tunnel roof
    let lo = vCov0;
    let hi = end;
    if (soffitAt(lo) < tTop && soffitAt(hi) > tTop) {
      for (let i = 0; i < 40; i++) {
        const m = (lo + hi) / 2;
        if (soffitAt(m) < tTop) lo = m;
        else hi = m;
      }
      cuts.add(lo);
    }
  }
  const vs = [...cuts].filter((v) => v >= vL0 - 1e-6 && v <= end + 1e-6).sort((p, q) => p - q);
  const skinTop = (v, bottom) => Math.max(bottom, Math.min(soffitAt(v), v < vCov0 ? Infinity : tTop));
  for (let i = 0; i + 1 < vs.length; i++) {
    const a = vs[i];
    const b = vs[i + 1];
    if (b - a < 1e-4) continue;
    const ba = sp.floorBottom(a);
    const bb = sp.floorBottom(b);
    sq(bkSkin, F, uL, uR, a, ba, uL, uR, b, bb, -1);
    const ta = skinTop(a + 1e-5, ba);
    const tb = skinTop(b - 1e-5, bb);
    if (ta - ba > 0.01 || tb - bb > 0.01) {
      vq(bkSkin, F, uL - 0.02, a, uL - 0.02, b, ba, ta, bb, tb, -1, 0);
      vq(bkSkin, F, uR + 0.02, a, uR + 0.02, b, ba, ta, bb, tb, 1, 0);
    }
  }
  vqv(bkSkin, F, uL, uR, end, sp.floorBottom(end), sp.floorTop(end), 1);
  if (end > vCov1 + 0.02) hq(bkSkin, F, uL - 0.02, uR + 0.02, vCov1, uL - 0.02, uR + 0.02, end, tTop, 1);

  // base of the visible walls: just below the floor, following the flight
  const f1 = flights[0];
  const yFoot = f1.yTop - f1.n * f1.dy; // floor level behind the flight
  const baseAt = (v) => {
    const b0 = yL - f1.dy - 0.02;
    const b1 = yFoot - 0.03;
    if (v <= f1.v0) return b0;
    if (v >= f1.v1) return b1;
    return b0 + ((b1 - b0) * (v - f1.v0)) / (f1.v1 - f1.v0);
  };
  const wallRun = (bk, u, s, va, vb, topA, topB) => {
    // split where the base line bends
    const marks = [va, ...[f1.v0, f1.v1].filter((v) => v > va + 0.01 && v < vb - 0.01), vb];
    for (let i = 0; i + 1 < marks.length; i++) {
      const p = marks[i];
      const q = marks[i + 1];
      const tp = topA + ((topB - topA) * (p - va)) / (vb - va);
      const tq = topA + ((topB - topA) * (q - va)) / (vb - va);
      swall(bk, F, [u, p], [u, q], w, s, 0, baseAt(p), tp, baseAt(q), tq, 'b' + (i > 0 ? 'a' : '') + (i + 2 < marks.length ? 'e' : ''));
    }
  };
  // cheek walls of the open trench, between the tunnel floor and the side stairs
  if (vBox0 - vL0 > 0.05) {
    const tA = sp.yLane(vL0) + 0.95;
    const tB = sp.yLane(vBox0) + 0.95;
    wallRun(bkP, uL, 1, vL0, vBox0, tA, tB);
    wallRun(bkP, uR, -1, vL0, vBox0, tA, tB);
    for (const um of [uL + w / 2, uR - w / 2]) {
      tube(bkH, P(F, um, tA + 0.08, vL0 + 0.03), P(F, um, tB + 0.08, vBox0), 0.022, 6);
      const steps = Math.max(1, Math.round((vBox0 - vL0) / 1.2));
      for (let q = 0; q <= steps; q++) {
        const v = vL0 + 0.06 + ((vBox0 - vL0 - 0.12) * q) / steps;
        const t = (v - vL0) / (vBox0 - vL0);
        const yt = tA + (tB - tA) * t;
        tube(bkH, P(F, um, yt - 0.02, v), P(F, um, yt + 0.08, v), 0.016, 5);
      }
    }
  }
  // roofed box: side walls with a solid parapet around the roof
  const pTop = yRoof + 1.0;
  wallRun(bkP, uL, 1, vBox0, vCov0, pTop, pTop);
  wallRun(bkP, uR, -1, vBox0, vCov0, pTop, pTop);
  // head wall above the mouth
  fbox(bkP, F, iL, iR, vBox0, vBox0 + w, ceilBox, pTop, 'blh');
  // roof slab top (walkable, flush with the cover row)
  const r0 = vBox0 + w;
  if (notch > 0) {
    const e = vCov0 + w * TAN_H;
    const pts = [
      [iL, r0],
      [iR, r0],
      [iR, e],
      [uc, vCov0 + notch],
      [iL, e],
    ];
    for (let q = 1; q + 1 < pts.length; q++) tri(bkT, P(F, pts[0][0], yRoof, pts[0][1]), P(F, pts[q][0], yRoof, pts[q][1]), P(F, pts[q + 1][0], yRoof, pts[q + 1][1]), 0, 1, 0);
  } else {
    hq(bkT, F, iL, iR, r0, iL, iR, vCov0, yRoof, 1);
  }
  // ceilings
  hq(bkC, F, iL, iR, vBox0, iL, iR, vCov1, ceilBox, -1);
  // dark lining of the box walls
  vq(bkW, F, iL + 0.015, vBox0 + w, iL + 0.015, vCov0, sp.floorBottom(vBox0), ceilBox, sp.floorBottom(vCov0), ceilBox, 1, 0);
  vq(bkW, F, iR - 0.015, vBox0 + w, iR - 0.015, vCov0, sp.floorBottom(vBox0), ceilBox, sp.floorBottom(vCov0), ceilBox, -1, 0);
  // tunnel under the cover row and on to the back plane of the stand (inner faces only:
  // the outside is inside the stand body or covered by the dark skin above)
  if (end > vCov0 + 0.02) {
    const marks = [vCov0, ...vs.filter((v) => v > vCov0 + 1e-3 && v < end - 1e-3), end];
    for (let i = 0; i + 1 < marks.length; i++) {
      const a = marks[i];
      const b = marks[i + 1];
      const ba = sp.floorBottom(a);
      const bb = sp.floorBottom(b);
      vq(bkW, F, iL, a, iL, b, ba, tTop, bb, tTop, 1, 0);
      vq(bkW, F, iR, a, iR, b, ba, tTop, bb, tTop, -1, 0);
    }
    const cEnd = end > vCov1 + 0.02 ? ceilBehind : ceilBox;
    if (end > vCov1 + 0.02) {
      hq(bkC, F, iL, iR, vCov1, iL, iR, end, ceilBehind, -1);
      vqv(bkC, F, iL, iR, vCov1, ceilBehind, ceilBox, -1);
    }
    // end faces of the walls and of the roof slab around the opening
    vqv(bkW, F, uL, uR, end, cEnd, tTop, 1);
    vqv(bkW, F, uL, iL, end, sp.floorBottom(end), cEnd, 1);
    vqv(bkW, F, iR, uR, end, sp.floorBottom(end), cEnd, 1);
  }
  // black rail on the parapet
  const yr = pTop + 0.07;
  const mL = uL + w / 2;
  const mR = uR - w / 2;
  const mF = vBox0 + w / 2;
  tube(bkH, P(F, mL, yr, vCov0), P(F, mL, yr, mF), 0.022, 6);
  tube(bkH, P(F, mL, yr, mF), P(F, mR, yr, mF), 0.022, 6);
  tube(bkH, P(F, mR, yr, mF), P(F, mR, yr, vCov0), 0.022, 6);
  for (const [u, v] of [[mL, vCov0 - 0.05], [mL, mF], [mR, mF], [mR, vCov0 - 0.05], [uc, mF]]) tube(bkH, P(F, u, pTop - 0.02, v), P(F, u, yr, v), 0.016, 5);
  // exit sign on the head wall
  fbox(bkE, F, uc - 0.3, uc + 0.3, vBox0 - 0.03, vBox0, ceilBox + 0.1, ceilBox + 0.28, 'r');
}

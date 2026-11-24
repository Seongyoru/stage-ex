// The glazed sky-bridge with its red exposed truss (arena LEVEL 5 → hotel podium), and the
// city footbridge 高島水際線デッキ (130.4 m, 6.0 m wide, 3-span steel box girder) that lands
// at the West Gate.
import * as THREE from 'three';
import { M, E } from './mats.js';
import { Bag, Tris, beam, dist2, lbox, polylineSampler, tube } from './kit.js';
import { HF, SKYBRIDGE, TDECK } from './layout.js';

export function buildBridges(bag, rails, ctx) {
  skyBridge(bag);
  takashimaDeck(bag, ctx);
}

function skyBridge(bag) {
  const S = SKYBRIDGE;
  const L = new Bag();
  const frame = M('skybridge.frame');
  const glass = M('skybridge.glass');
  const red = M('precinct.redSteel');
  const a0 = S.a0;
  const a1 = S.a1;
  const len = a1 - a0;
  const b0 = S.b - S.width / 2;
  const b1 = S.b + S.width / 2;
  const y = S.y;
  const yTop = y + S.height;
  const LV = 5;
  // floor girder (dark box 0.75 m deep), floor finish, roof slab
  L.add(frame, lbox(a0, a1, y - 0.75, y, b0 - 0.08, b1 + 0.08), LV);
  L.add(M('skybridge.floor'), lbox(a0, a1, y, y + 0.03, b0 + 0.1, b1 - 0.1), LV);
  L.add(frame, lbox(a0, a1, yTop - 0.38, yTop, b0 - 0.15, b1 + 0.15), LV);
  L.add(E('skybridge.light'), lbox(a0 + 0.4, a1 - 0.4, yTop - 0.4, yTop - 0.38, S.b - 0.08, S.b + 0.08), LV);
  // glazing on both sides with slim dark mullions and a rail-height transom
  const n = Math.round(len / 1.3);
  for (const [b, s] of [[b0, -1], [b1, 1]]) {
    L.add(glass, lbox(a0, a1, y + 0.03, yTop - 0.38, b - 0.012, b + 0.012), LV);
    for (let i = 0; i <= n; i++) {
      const a = a0 + (len * i) / n;
      L.add(frame, lbox(a - 0.03, a + 0.03, y, yTop - 0.38, b - 0.05, b + 0.05), LV);
    }
    L.add(frame, lbox(a0, a1, y + 1.0, y + 1.06, b - 0.04, b + 0.04), LV);
    // red Warren truss just inside the glass: chords and zig-zag diagonals
    const bt = b - s * 0.28;
    const yb = y + 0.2;
    const yt = yTop - 0.62;
    const panels = 8;
    const add = (g) => L.add(red, g, LV);
    add(tube([a0 + 0.2, yb, bt], [a1 - 0.2, yb, bt], 0.09));
    add(tube([a0 + 0.2, yt, bt], [a1 - 0.2, yt, bt], 0.09));
    for (let i = 0; i < panels; i++) {
      const p = a0 + 0.2 + ((len - 0.4) * i) / panels;
      const q = a0 + 0.2 + ((len - 0.4) * (i + 1)) / panels;
      add(i % 2 === 0 ? tube([p, yb, bt], [q, yt, bt], 0.1) : tube([p, yt, bt], [q, yb, bt], 0.1));
    }
  }
  // end portals and haunch brackets under both ends (photo T8)
  for (const a of [a0, a1 - 0.25]) L.add(frame, lbox(a, a + 0.25, y, yTop - 0.38, b0 - 0.05, b1 + 0.05), LV);
  const t = new Tris();
  for (const [aw, dir] of [[a1, -1], [a0, 1]]) {
    for (const b of [b0 + 0.1, b1 - 0.1]) {
      const A = [aw, y - 0.75, b];
      const B = [aw + dir * 2.4, y - 0.75, b];
      const C = [aw, y - 2.0, b];
      t.tri(A, B, C).tri(A, C, B);
    }
  }
  L.add(frame, t.build(), LV);
  bag.absorb(L, HF);
}

// --- Takashima Suisaisen Deck ----------------------------------------------------------------------
function catmull(points, step) {
  const pts = points.map((p) => new THREE.Vector3(p[0], 0, p[1]));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const n = Math.max(8, Math.round(curve.getLength() / step));
  return curve.getSpacedPoints(n).map((v) => [v.x, v.z]);
}

function takashimaDeck(bag, ctx) {
  const T = TDECK;
  const path = catmull(T.line, ctx.quality === 'low' ? 6 : 3);
  const smp = polylineSampler(path);
  const total = smp.total;
  const yAt = (s) => {
    const u = s / total;
    return T.yEast + (T.yWest - T.yEast) * u + T.camber * 4 * u * (1 - u);
  };
  // stations along the path: point, left normal, height
  const st = [];
  let acc = 0;
  for (let i = 0; i < path.length; i++) {
    if (i > 0) acc += dist2(path[i - 1], path[i]);
    const a = path[Math.max(0, i - 1)];
    const b = path[Math.min(path.length - 1, i + 1)];
    const l = dist2(a, b) || 1;
    const d = [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
    st.push({ p: path[i], n: [-d[1], d[0]], d, s: acc, y: yAt(acc) });
  }
  const P = (k, off, dy) => [st[k].p[0] + st[k].n[0] * off, st[k].y + dy, st[k].p[1] + st[k].n[1] * off];
  const half = T.width / 2 + 0.3; // 6.0 m clear + kerbs
  const deck = new Tris();
  const girder = new Tris();
  for (let k = 0; k < st.length - 1; k++) {
    // walking surface
    deck.quad(P(k, -T.width / 2, 0), P(k + 1, -T.width / 2, 0), P(k + 1, T.width / 2, 0), P(k, T.width / 2, 0), [0, 1, 0]);
    // steel box girder: cantilevered flanges, sloped webs, bottom flange 1.7 m below the deck
    const sec = [
      [-half, 0.22],
      [-half, -0.25],
      [-1.9, -1.7],
      [1.9, -1.7],
      [half, -0.25],
      [half, 0.22],
    ];
    for (let i = 0; i < sec.length - 1; i++) {
      const [o0, y0] = sec[i];
      const [o1, y1] = sec[i + 1];
      const a = P(k, o0, y0);
      const b = P(k + 1, o0, y0);
      const c = P(k + 1, o1, y1);
      const d = P(k, o1, y1);
      const nx = (y1 - y0) * st[k].n[0];
      const nz = (y1 - y0) * st[k].n[1];
      girder.quad(a, b, c, d, [-nx, -(o1 - o0), -nz]);
    }
    // kerb tops and inner faces
    for (const s of [-1, 1]) {
      girder.quad(P(k, s * half, 0.22), P(k + 1, s * half, 0.22), P(k + 1, s * T.width / 2, 0.22), P(k, s * T.width / 2, 0.22), [0, 1, 0]);
      girder.quad(P(k, s * T.width / 2, 0), P(k + 1, s * T.width / 2, 0), P(k + 1, s * T.width / 2, 0.22), P(k, s * T.width / 2, 0.22), [-s * st[k].n[0], 0, -s * st[k].n[1]]);
    }
  }
  bag.add(M('tdeck.paving'), deck.build());
  bag.add(M('tdeck.girder'), girder.build());

  // white railing: posts every ~2 m, top rail and three horizontal rails; tall clear screens
  // in white frames over the road and the railway (main span)
  const rail = M('tdeck.railing');
  const screenFrom = 22;
  const screenTo = total - 30;
  const scr = new Tris();
  for (const s of [-1, 1]) {
    const off = s * (T.width / 2 + 0.15);
    for (let k = 0; k < st.length - 1; k++) {
      const screened = st[k].s >= screenFrom && st[k + 1].s <= screenTo;
      const top = screened ? 2.3 : 1.25;
      for (const h of screened ? [top, 1.25, 0.35] : [top, 0.95, 0.65, 0.35]) bag.add(rail, beam(P(k, off, 0.22 + h - 0.22), P(k + 1, off, 0.22 + h - 0.22), h === top ? 0.07 : 0.04, h === top ? 0.06 : 0.035));
      bag.add(rail, beam(P(k, off, 0.2), P(k, off, top), 0.07, 0.07));
      if (screened) {
        scr.quad(P(k, off, 0.38), P(k + 1, off, 0.38), P(k + 1, off, top - 0.04), P(k, off, top - 0.04));
        // LED handrail line (night)
        bag.add(E('tdeck.light'), beam(P(k, off - s * 0.05, 1.19), P(k + 1, off - s * 0.05, 1.19), 0.03, 0.02));
      } else {
        bag.add(E('tdeck.light'), beam(P(k, off - s * 0.05, 1.19), P(k + 1, off - s * 0.05, 1.19), 0.03, 0.02));
      }
    }
    const e = st.length - 1;
    bag.add(rail, beam(P(e, off, 0.2), P(e, off, 1.25), 0.07, 0.07));
  }
  bag.add(M('tdeck.screen'), scr.build());

  // provisional asphalt ramp beyond the west abutment (the permanent slope is still to be built)
  {
    const e = st[st.length - 1];
    const ramp = new Tris();
    const q = (off, along, y) => [e.p[0] + e.n[0] * off + e.d[0] * along, y, e.p[1] + e.n[1] * off + e.d[1] * along];
    ramp.quad(q(-T.width / 2, 0, e.y), q(-T.width / 2, 9, e.y - 1.05), q(T.width / 2, 9, e.y - 1.05), q(T.width / 2, 0, e.y), [0, 1, 0]);
    for (const s of [-1, 1]) ramp.quad(q((s * T.width) / 2, 0, 0), q((s * T.width) / 2, 9, 0), q((s * T.width) / 2, 9, e.y - 1.05), q((s * T.width) / 2, 0, e.y), [s * e.n[0], 0, s * e.n[1]]);
    bag.add(M('precinct.yardAsphalt'), ramp.build());
  }

  // piers of the 3-span girder (max span 69.4 m) and the abutments
  const pier = M('tdeck.pier');
  const spanEnds = [8, 38.5, 107.9, total - 8];
  for (const [i, s] of spanEnds.entries()) {
    const { p, d } = smp.at(s);
    const y = yAt(s) - 1.7;
    const rot = Math.atan2(-d[1], d[0]);
    if (i === 1 || i === 2) {
      // wall pier with a hammerhead
      const g1 = new THREE.BoxGeometry(1.2, y - 1.0, 2.6);
      g1.rotateY(rot);
      g1.translate(p[0], (y - 1.0) / 2, p[1]);
      bag.add(pier, g1);
      const g2 = new THREE.BoxGeometry(1.5, 1.0, 4.2);
      g2.rotateY(rot);
      g2.translate(p[0], y - 0.5, p[1]);
      bag.add(pier, g2);
    } else {
      const g = new THREE.BoxGeometry(3.0, Math.max(0.5, y), 6.8);
      g.rotateY(rot);
      g.translate(p[0], Math.max(0.5, y) / 2, p[1]);
      bag.add(pier, g);
    }
  }
}

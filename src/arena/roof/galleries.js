// The two-row pin-spot gallery (ピンスポットギャラリー): black steel bridges hung under the roof
// trusses that follow the three facets of the stands. Row 1 crosses the hall above the rear
// of the arena floor, row 2 is the bridge right in front of the Upper Stand.
//
// What the photos show (Oricon 20230922_111817 / 111820, L-Acoustics la-k-arena-2,
// Travel Watch 021): a walkway about 2.6 m deep on two edge girders, round hangers up to
// the trusses every 6-7 m, a box frame about 3.5 m tall; on the stage side a guard with
// wire-mesh infill, on the audience side a pipe guard with black masking panels above it,
// and four fully enclosed follow-spot cabins per row.
import { hSection, rectSection, tubeSection, trs } from './builder.js';
import { GALLERIES, GALLERY_DEPTH, galleryPath, bottomY } from './layout.js';
import { LINK_X, RAIL_H, railing } from './catwalks.js';

const EDGE = GALLERY_DEPTH / 2 - 0.1; // girder / guard lines, from the centre line
const GUARD_H = 1.2;
const VALANCE_FROM = 2.0; // the black masking panels hang above head height; below them the bay is open down to the pipe guard

/** Stations along the bent centre line with a mitred lateral at the two bends. */
function stations(path, spacing) {
  const out = [];
  for (let s = 0; s < path.length - 1; s++) {
    const a = path[s];
    const b = path[s + 1];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const d = [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
    const n = Math.max(1, Math.round(l / spacing));
    for (let i = s === 0 ? 0 : 1; i <= n; i++) {
      const t = i / n;
      let nx = -d[1];
      let nz = d[0];
      let k = 1;
      const corner = i === n && s < path.length - 2;
      if (corner) {
        const c = path[s + 2];
        const l2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
        const mx = nx + -(c[1] - b[1]) / l2;
        const mz = nz + (c[0] - b[0]) / l2;
        const ml = Math.hypot(mx, mz);
        k = 1 / ((mx / ml) * nx + (mz / ml) * nz);
        nx = mx / ml;
        nz = mz / ml;
      }
      out.push({ x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, nx, nz, k, seg: s, corner, dist: 0 });
    }
  }
  return out;
}
const rear = (p, off = EDGE) => [p.x + p.nx * p.k * off, p.z + p.nz * p.k * off];
const front = (p, off = EDGE) => [p.x - p.nx * p.k * off, p.z - p.nz * p.k * off];

/** Cabin bays on the centre facet, symmetric about the axis (indices of the 3.35 m frame bays). */
function cabinBays(nBays) {
  const a = Math.round(nBays * 0.1);
  const b = Math.round(nBays * 0.36);
  return new Set([a, b, nBays - 1 - b, nBays - 1 - a]);
}

export function buildGallery(S, g, { low = false } = {}) {
  const path = galleryPath(g.zc);
  const y = g.floorY;
  const topAt = (x, z) => Math.min(y + g.height, bottomY(x, z) - 0.3);
  const girder = low ? rectSection(0.2, 0.5, 'top') : hSection(0.2, 0.5, 0.02, 0.012, 'top');
  const joist = rectSection(0.1, 0.2, 'top');
  const post = rectSection(0.12, 0.12);
  const beam = rectSection(0.15, 0.2, 'top');
  const header = low ? rectSection(0.25, 0.3) : hSection(0.25, 0.3, 0.02, 0.014);
  const hanger = tubeSection(0.11, 8);
  const rail = rectSection(0.045, 0.045);
  const UP_X = [1, 0, 0];

  // deck, edge girders, joists
  const corners = stations(path, 1e9); // just the four path points with mitred laterals
  for (let i = 0; i < corners.length - 1; i++) {
    const a = corners[i];
    const b = corners[i + 1];
    S.deck.slab([front(a, GALLERY_DEPTH / 2), front(b, GALLERY_DEPTH / 2), rear(b, GALLERY_DEPTH / 2), rear(a, GALLERY_DEPTH / 2)], y - 0.06, y);
    for (const side of [front, rear]) {
      const p = side(a);
      const q = side(b);
      S.steel.sweep([p[0], y - 0.06, p[1]], [q[0], y - 0.06, q[1]], girder);
    }
  }
  for (const p of stations(path, 2.2)) {
    const a = front(p);
    const b = rear(p);
    S.steel.sweep([a[0], y - 0.07, a[1]], [b[0], y - 0.07, b[1]], joist);
  }

  // hangers up to the trusses with header beams, top frame of the box
  const hs = stations(path, 6.7);
  for (const side of [front, rear]) {
    let prev = null;
    for (const p of hs) {
      const [x, z] = side(p);
      const top = bottomY(x, z) + 0.35;
      S.steel.sweep([x, y - 0.56, z], [x, top, z], hanger, UP_X);
      const frameTop = topAt(x, z);
      const tall = frameTop - y >= 2.0;
      if (prev) {
        S.steel.sweep([prev.x, prev.top, prev.z], [x, top, z], header);
        if (side === front && prev.tall && tall) S.steel.sweep([prev.x, prev.frameTop, prev.z], [x, frameTop, z], beam);
      }
      prev = { x, z, top, frameTop, tall };
    }
  }
  for (const p of hs) {
    const a = front(p);
    const b = rear(p);
    const ta = topAt(a[0], a[1]);
    const tb = topAt(b[0], b[1]);
    if (ta - y >= 2.0 && tb - y >= 2.0) S.steel.sweep([a[0], ta, a[1]], [b[0], tb, b[1]], beam);
  }

  // audience side: frame posts every 3.35 m, pipe guard, black masking panels, follow-spot cabins
  const ps = stations(path, 3.35);
  const nCentreBays = ps.filter((p) => p.seg === 1).length; // bays of the centre facet
  const firstCentre = ps.findIndex((p) => p.seg === 1) - 1; // index of the junction station that starts the centre facet
  const cabins = cabinBays(nCentreBays);
  const wingLen = Math.hypot(path[1][0] - path[0][0], path[1][1] - path[0][1]);
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];
    const [x, z] = rear(p);
    const top = topAt(x, z);
    const tall = top - y >= 2.0;
    S.steel.sweep([x, y, z], [x, tall ? top : y + GUARD_H, z], post, UP_X);
    if (i === ps.length - 1) break;
    const q = ps[i + 1];
    const [x2, z2] = rear(q);
    const top2 = topAt(x2, z2);
    const tall2 = top2 - y >= 2.0;
    const bayIsCentre = q.seg === 1;
    const isCabin = bayIsCentre && cabins.has(i - firstCentre) && tall && tall2;
    const mid = [(x + x2) / 2, (z + z2) / 2];
    const dJ = Math.min(Math.hypot(mid[0] - path[1][0], mid[1] - path[1][1]), Math.hypot(mid[0] - path[2][0], mid[1] - path[2][1]));
    const full = Math.min(top, top2) - y >= 2.6;
    const panelBay = full && (bayIsCentre || dJ < wingLen * 0.45);
    if (tall && tall2) S.steel.sweep([x, top, z], [x2, top2, z2], beam);
    if (isCabin) {
      const h = Math.min(top, top2) - 0.2;
      S.panel.panel([x, z], [x2, z2], y + 0.02, h, 0.04);
      // side walls and roof of the cabin; the stage side stays open for the follow spot
      const depth = GALLERY_DEPTH - 0.55;
      for (const [sx, sz, sp] of [
        [x, z, p],
        [x2, z2, q],
      ]) {
        S.panel.panel([sx, sz], [sx - sp.nx * depth, sz - sp.nz * depth], y + 0.02, h, 0.04);
      }
      S.panel.slab([[x, z], [x2, z2], [x2 - q.nx * depth, z2 - q.nz * depth], [x - p.nx * depth, z - p.nz * depth]], h, h + 0.06);
    } else {
      for (const hgt of [GUARD_H / 2, GUARD_H]) S.rail.sweep([x, y + hgt, z], [x2, y + hgt, z2], rail);
      S.rail.sweep([x, y + 0.06, z], [x2, y + 0.06, z2], rectSection(0.008, 0.1));
      if (panelBay) S.panel.panel([x, z], [x2, z2], y + VALANCE_FROM, Math.min(top, top2) - 0.2, 0.03);
    }
  }

  // stage side: guard with wire-mesh infill, posts every 1.675 m
  const gs = stations(path, 3.35 / 2);
  for (let i = 0; i < gs.length; i++) {
    const [x, z] = front(gs[i]);
    S.posts.push(trs(x, y, z, 0, 1, GUARD_H / RAIL_H, 1));
    if (i === gs.length - 1) break;
    const [x2, z2] = front(gs[i + 1]);
    const linked = g === GALLERIES[0] && gs[i + 1].seg === 1 && LINK_X.some((lx) => lx > Math.min(x, x2) - 0.05 && lx < Math.max(x, x2) + 0.05);
    if (linked) continue; // opening where a link from the rigging deck lands
    for (const hgt of [GUARD_H / 2, GUARD_H]) S.rail.sweep([x, y + hgt, z], [x2, y + hgt, z2], rail);
    S.rail.sweep([x, y + 0.06, z], [x2, y + 0.06, z2], rectSection(0.008, 0.1));
    S.mesh.panel([x, z], [x2, z2], y + 0.12, y + GUARD_H - 0.04, 0.012);
  }

  // guards across both wing ends
  for (const p of [ps[0], ps[ps.length - 1]]) {
    const a = front(p);
    const b = rear(p);
    railing(S, [[a[0], y, a[1]], [b[0], y, b[1]]], [], 2, GUARD_H);
  }
}

export function buildGalleries(S, opts) {
  for (const g of GALLERIES) buildGallery(S, g, opts);
}

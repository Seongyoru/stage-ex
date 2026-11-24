// Generic building generators of the context: one extruded volume with a ground storey,
// a facade family, a parapet, a roof and rooftop plant; plus the special types (parking
// structure, shed with a gable roof, canopy). Landmark treatments (landmarks.js) are
// composed from the same pieces.
import { WHITE, signedArea, centroid, pointInRing, distToRing, dropShortEdges, insetRing, obb, facadeRuns, wallQuad, ringWalls, cap, ringStrip, boxO, cylinder } from './builder.js';
import { STYLES } from './styles.js';
import { rng } from './textures.js';

export const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
export function hashId(id) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Balcony on one facade edge at floor level ys: slab, kerb, balustrade (glass or panel), end panels. */
export function balcony(env, e, ys, bal, col, endInset = 0.3) {
  const B = env.B;
  const trim = B.get('context.trim');
  const glass = bal.rail === 'glass';
  const rail = glass ? B.get('context.residential.balconyGlass') : trim;
  const railCol = glass ? WHITE : col;
  const dx = (e.b[0] - e.a[0]) / e.len;
  const dz = (e.b[1] - e.a[1]) / e.len;
  const a = [e.a[0] + dx * endInset, e.a[1] + dz * endInset];
  const b = [e.b[0] - dx * endInset, e.b[1] - dz * endInset];
  const d = bal.depth;
  const ao = [a[0] + e.nx * d, a[1] + e.nz * d];
  const bo = [b[0] + e.nx * d, b[1] + e.nz * d];
  const rt = 0.1;
  const ai = [ao[0] - e.nx * rt, ao[1] - e.nz * rt];
  const bi = [bo[0] - e.nx * rt, bo[1] - e.nz * rt];
  const t = 0.24;
  const rh = 1.15;
  const kerb = glass ? 0.14 : 0;
  const len = e.len - 2 * endInset;
  wallQuad(trim, ao, bo, ys - t, ys + kerb, e.nx, e.nz, 0, len, 0, t + kerb, col); // slab edge
  wallQuad(rail, ao, bo, ys + kerb, ys + rh, e.nx, e.nz, 0, len, 0, rh - kerb, railCol); // balustrade, outside
  wallQuad(rail, bi, ai, ys, ys + rh, -e.nx, -e.nz, 0, len, 0, rh, shade(railCol, 0.8)); // inside
  trim.quad([ao[0], ys + rh, ao[1]], [bo[0], ys + rh, bo[1]], [bi[0], ys + rh, bi[1]], [ai[0], ys + rh, ai[1]], [0, 1, 0], [0, 0], [len, 0], [len, rt], [0, rt], col); // handrail
  trim.quad([a[0], ys - t, a[1]], [b[0], ys - t, b[1]], [bo[0], ys - t, bo[1]], [ao[0], ys - t, ao[1]], [0, -1, 0], [0, 0], [len, 0], [len, d], [0, d], shade(col, 0.72)); // soffit
  trim.quad([a[0], ys, a[1]], [b[0], ys, b[1]], [bi[0], ys, bi[1]], [ai[0], ys, ai[1]], [0, 1, 0], [0, 0], [len, 0], [len, d], [0, d], shade(col, 0.85)); // floor
  wallQuad(trim, ao, a, ys - t, ys + rh, -dx, -dz, 0, d, 0, rh + t, shade(col, 0.92)); // end panels
  wallQuad(trim, b, bo, ys - t, ys + rh, dx, dz, 0, d, 0, rh + t, shade(col, 0.92));
}

/** Horizontal sunshade / slab-edge ledge on one facade edge (top, front, underside). */
export function ledge(buf, e, y, depth, thick, col) {
  const ao = [e.a[0] + e.nx * depth, e.a[1] + e.nz * depth];
  const bo = [e.b[0] + e.nx * depth, e.b[1] + e.nz * depth];
  wallQuad(buf, ao, bo, y - thick, y, e.nx, e.nz, 0, e.len, 0, thick, col);
  buf.quad([e.a[0], y, e.a[1]], [e.b[0], y, e.b[1]], [bo[0], y, bo[1]], [ao[0], y, ao[1]], [0, 1, 0], [0, 0], [e.len, 0], [e.len, depth], [0, depth], col);
  buf.quad([e.a[0], y - thick, e.a[1]], [e.b[0], y - thick, e.b[1]], [bo[0], y - thick, bo[1]], [ao[0], y - thick, ao[1]], [0, -1, 0], [0, 0], [e.len, 0], [e.len, depth], [0, depth], shade(col, 0.7));
}

/** Point at distance s along a run: { p, e }. */
export function alongRun(run, s) {
  const ss = Math.max(0, Math.min(run.length - 1e-4, s));
  for (const e of run.edges) {
    if (ss <= e.s + e.len) {
      const t = (ss - e.s) / e.len;
      return { p: [e.a[0] + (e.b[0] - e.a[0]) * t, e.a[1] + (e.b[1] - e.a[1]) * t], e };
    }
  }
  const e = run.edges[run.edges.length - 1];
  return { p: e.b.slice(), e };
}

/** Rooftop plant: a stair penthouse, condenser rows, air-handling units and tanks on a grid. */
export function roofUnits(env, b, ring, y, { maxH = 2.6, seed, avoid, margin = 2.4, density = 130 } = {}) {
  const B = env.B;
  const ob = obb(ring);
  const rand = rng(seed ?? hashId(b.id) + 17);
  const area = signedArea(ring);
  const want = Math.max(2, Math.min(18, Math.round(area / density)));
  const step = Math.max(4.6, Math.sqrt(area / (want * 2.3)));
  const cand = [];
  for (let u = -ob.hu + step / 2; u < ob.hu; u += step) {
    for (let v = -ob.hv + step / 2; v < ob.hv; v += step) {
      const x = ob.cx + ob.ux * u - ob.uz * v;
      const z = ob.cz + ob.uz * u + ob.ux * v;
      if (!pointInRing(ring, x, z) || distToRing(ring, x, z) < margin) continue;
      if (avoid && Math.hypot(x - avoid[0], z - avoid[1]) < avoid[2]) continue;
      cand.push([x, z, rand()]);
    }
  }
  cand.sort((p, q) => p[2] - q[2]);
  const unit = B.get('context.plant.unit');
  const pent = B.get('context.plant.penthouse');
  const memb = B.get('context.roof.membrane');
  let placed = 0;
  for (const [x, z] of cand) {
    if (placed >= want) break;
    const k = rand();
    const sMax = Math.min(step * 0.42, distToRing(ring, x, z) - 0.5);
    if (sMax < 0.5) continue;
    if (placed === 0 && maxH >= 2.5) {
      boxO(pent, x, z, y, y + Math.min(maxH, 3.0), Math.min(sMax, 2.9), Math.min(sMax, 1.9), ob.ang, WHITE, { topBuf: memb });
    } else if (k < 0.5) {
      boxO(unit, x, z, y + 0.25, y + Math.min(maxH, 1.7), Math.min(sMax, 2.1), Math.min(sMax, 0.55), ob.ang + (rand() < 0.5 ? 0 : Math.PI / 2), WHITE);
    } else if (k < 0.85) {
      boxO(unit, x, z, y + 0.2, y + Math.min(maxH, 2.3), Math.min(sMax, 1.7), Math.min(sMax, 1.2), ob.ang, WHITE);
    } else {
      cylinder(unit, x, z, y + 0.2, y + Math.min(maxH, 2.4), Math.min(sMax, 1.3), 12, shade(WHITE, 0.95));
    }
    placed++;
  }
}

/** Square rooftop helipad deck on a block: centre c, half size s, angle, from y0 up to y1. */
export function helipadBlock(env, c, s, ang, y0, y1, letter) {
  const B = env.B;
  const corners = boxO(B.get('context.plant.penthouse'), c[0], c[1], y0, y1, s, s, ang, WHITE, { top: false });
  const pad = B.get(letter === 'H' ? 'context.roof.helipadH' : 'context.roof.helipadR');
  pad.quad([corners[0][0], y1, corners[0][1]], [corners[1][0], y1, corners[1][1]], [corners[2][0], y1, corners[2][1]], [corners[3][0], y1, corners[3][1]], [0, 1, 0], [0, 0], [1, 0], [1, 1], [0, 1], WHITE);
}

/** Red obstruction lights on the four extreme corners of a ring. */
export function aviationLights(env, ring, y) {
  const ob = obb(ring);
  for (const [su, sv] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    let best = null;
    let bs = -Infinity;
    for (const p of ring) {
      const s = su * (p[0] * ob.ux + p[1] * ob.uz) + sv * (-p[0] * ob.uz + p[1] * ob.ux);
      if (s > bs) {
        bs = s;
        best = p;
      }
    }
    env.lights.push([best[0], y, best[1]]);
  }
}

/** Crown above the roof up to the surveyed top: set-back screen (or solid parapet walls), plant, helipad. */
export function crown(env, b, r, top, st, o = {}) {
  const B = env.B;
  const kind = o.crown || st.crown;
  if (kind === 'none') return null;
  const trim = B.get('context.trim');
  const capCol = o.cap || st.cap;
  const base = dropShortEdges(r.ring, 2.2);
  const d = kind === 'solid' ? 1.3 : Math.max(2.2, Math.min(4.5, Math.sqrt(r.area) * 0.085));
  const r1 = kind === 'penthouse' ? null : insetRing(base, d);
  const r2 = r1 && insetRing(r1, 0.35);
  let inside = null;
  if (r1 && r2) {
    // residential crowns: louvred screen in the colour of the building on a solid upstand
    const buf = B.get('context.plant.screen');
    const col = kind === 'solid' ? [Math.min(1, capCol[0] * 1.25), Math.min(1, capCol[1] * 1.25), Math.min(1, capCol[2] * 1.25)] : WHITE;
    const yu = kind === 'solid' ? Math.min(top - 0.6, r.yr + 1.4) : r.yr;
    if (kind === 'solid') ringWalls(trim, r1, r.yr, yu, capCol);
    ringWalls(buf, r1, yu, top, col);
    ringWalls(buf, r2, r.yr, top, shade(col, 0.8), true);
    ringStrip(trim, r1, r2, top, true, capCol);
    inside = r2;
  } else {
    const ob = obb(r.ring);
    const c = centroid(r.ring);
    const k = pointInRing(r.ring, c[0], c[1]) ? Math.min(0.46, (distToRing(r.ring, c[0], c[1]) / Math.max(ob.hu, ob.hv)) * 0.8) : 0;
    if (k > 0.05) boxO(B.get('context.plant.penthouse'), c[0], c[1], r.yr, top, ob.hu * k, ob.hv * k, ob.ang, WHITE, { topBuf: B.get('context.roof.membrane') });
  }
  let avoid;
  if (inside && top >= 78 && signedArea(inside) > 420) {
    const c = centroid(inside);
    const ob = obb(inside);
    const s = Math.min(8.5, Math.min(ob.hu, ob.hv) * 0.5);
    if (pointInRing(inside, c[0], c[1]) && distToRing(inside, c[0], c[1]) > s * 1.3 && s > 4) {
      helipadBlock(env, c, s, ob.ang, r.yr, top - 0.3, top >= 100 ? 'H' : 'R');
      avoid = [c[0], c[1], s * 1.7];
    }
  }
  if (inside && !env.low) roofUnits(env, b, inside, r.yr, { maxH: Math.min(3.6, top - r.yr - 0.6), avoid, margin: 1.4, density: 110 });
  if (top >= 60) aviationLights(env, r1 || r.ring, top + 0.45);
  return inside;
}

/**
 * One extruded volume in a facade family.
 *   vol  { ring, y0, y1, top?, cut? }   st = STYLES.x
 *   o    { tint, cap, solid, roof, parapet, noBase, blind, crown, noRoofStuff, wall, baseTint, balcony }
 * Returns { ring, inner, yr, yt, area, nf, fh, yb, runs }.
 */
export function volume(env, b, vol, st, o = {}) {
  const B = env.B;
  const cut = vol.cut || [];
  let ring = cut.length ? vol.ring : dropShortEdges(vol.ring, 0.6);
  const y0 = vol.y0;
  const yr = vol.y1;
  const H = yr - y0;
  // a volume standing on a lower one is drawn 5 cm inside its outline, so its wall is never
  // coplanar with the parapet of the volume below where the two share an edge
  if (y0 > 0.5) ring = insetRing(ring, 0.05) || ring;
  const area = signedArea(ring);
  const tint = o.tint || WHITE;
  const capCol = o.cap || st.cap;
  const solidCol = o.solid || st.solid;
  const hasBase = !!st.base && !o.noBase && y0 < 0.5 && H >= (st.baseMinH ?? 12);
  const yb = hasBase ? y0 + (st.baseFrac ? Math.round(H * st.baseFrac) : st.baseH) : y0;
  let nf = st.oneStorey ? 1 : Math.max(1, Math.round((yr - yb) / st.floorReal));
  // storey count from the data (OSM building:levels), when it gives a believable storey height
  const lv = o.levels ?? vol.levels ?? ((vol.top || yr) >= 0.9 * b.top ? b.levels : null);
  if (lv && !st.oneStorey && !st.metric) {
    const inVol = y0 > 0.5 ? Math.max(1, Math.round((lv * (yr - y0)) / yr)) : lv;
    const n2 = inVol - (hasBase ? Math.max(1, Math.round(st.baseH / (H / inVol))) : 0);
    if (n2 >= 1 && (yr - yb) / n2 > 2.7 && (yr - yb) / n2 < 6.2) nf = n2;
  }
  const fh = (yr - yb) / nf;
  const pH = o.parapet ?? (H < 6 ? 0.3 : H < 30 ? 0.9 : 1.3);
  const yt = yr + pH;
  const wallBuf = B.get(o.wall || st.wall);
  const trim = B.get('context.trim');
  const runs = facadeRuns(ring, cut);
  const minRun = st.minRun ?? Math.min(2.4, st.bay * 0.8);
  const bal = o.balcony === false ? null : o.balcony || st.balcony;
  for (const run of runs) {
    if (run.cut) {
      const cb = B.get('context.cut');
      for (const e of run.edges) wallQuad(cb, e.a, e.b, y0, yt, e.nx, e.nz, e.s, e.s + e.len, y0, yt);
      continue;
    }
    if (run.length < minRun || o.blind) {
      for (const e of run.edges) wallQuad(trim, e.a, e.b, y0, yt, e.nx, e.nz, e.s, e.s + e.len, y0, yt, solidCol);
      continue;
    }
    const nb = Math.max(1, Math.round(run.length / st.bay));
    const us = st.metric ? 1 : (nb * st.bay) / run.length;
    const vTop = st.metric ? yr - yb : nf * st.floor;
    const nbb = hasBase ? Math.max(1, Math.round(run.length / st.baseBay)) : 0;
    const ubs = hasBase ? (nbb * st.baseBay) / run.length : 0;
    for (const e of run.edges) {
      if (hasBase && st.baseMetric) wallQuad(B.get(st.base), e.a, e.b, y0, yb, e.nx, e.nz, e.s, e.s + e.len, 0, yb - y0, o.baseTint || WHITE);
      else if (hasBase) wallQuad(B.get(st.base), e.a, e.b, y0, yb, e.nx, e.nz, e.s * ubs, (e.s + e.len) * ubs, 0, st.baseTile, o.baseTint || WHITE);
      wallQuad(wallBuf, e.a, e.b, yb, yr, e.nx, e.nz, e.s * us, (e.s + e.len) * us, 0, vTop, tint);
      wallQuad(trim, e.a, e.b, yr, yt, e.nx, e.nz, e.s, e.s + e.len, yr, yt, capCol);
    }
    if (env.low) continue;
    if (bal) {
      const k0 = hasBase ? 0 : 1;
      for (const e of run.edges) {
        if (e.len < 3.2) continue;
        for (let k = k0; k < nf; k++) balcony(env, e, yb + k * fh, bal, bal.col);
      }
    }
    if (st.ledges && !o.noLedges) {
      for (const e of run.edges) for (let k = hasBase ? 0 : 1; k <= nf; k++) ledge(trim, e, yb + k * fh + 0.1, st.ledges.depth, st.ledges.thick, st.ledges.col);
    }
    if (st.fins) {
      const step = (run.length / nb) * st.fins.every;
      const count = Math.round(run.length / step);
      for (let k = 0; k <= count; k++) {
        const { p, e } = alongRun(run, Math.min(run.length - st.fins.width / 2, Math.max(st.fins.width / 2, k * step)));
        boxO(trim, p[0] + (e.nx * st.fins.depth) / 2, p[1] + (e.nz * st.fins.depth) / 2, yb, yt, st.fins.width / 2, st.fins.depth / 2, Math.atan2(e.b[1] - e.a[1], e.b[0] - e.a[0]), st.fins.col);
      }
    }
    if (st.doors && run.length > 9 && y0 < 0.5) {
      const dh = Math.min(4.6, H - 1.2);
      const n = Math.max(1, Math.floor(run.length / 13));
      const door = B.get('context.industrial.door');
      for (let k = 0; k < n; k++) {
        const s = ((k + 0.5) / n) * run.length;
        const p0 = alongRun(run, s - 2.3);
        const p1 = alongRun(run, s + 2.3);
        if (p0.e !== p1.e) continue;
        const e = p0.e;
        const q0 = [p0.p[0] + e.nx * 0.06, p0.p[1] + e.nz * 0.06];
        const q1 = [p1.p[0] + e.nx * 0.06, p1.p[1] + e.nz * 0.06];
        wallQuad(door, q0, q1, y0, y0 + dh, e.nx, e.nz, 0, 4.6, 0, dh, WHITE);
      }
    }
  }
  // roof and parapet
  const cutSet = new Set(cut);
  const roofBuf = B.get(o.roof || st.roof);
  const inner = pH > 0.25 ? insetRing(ring, 0.3) : null;
  const hip = o.hip ? insetRing(dropShortEdges(ring, 3.2), o.hip.inset) : null;
  if (hip) {
    // hipped roof: slopes from the eave up to a flat top (tiled roofs of low buildings)
    const base = dropShortEdges(ring, 3.2);
    const yh = yr + o.hip.rise;
    for (let i = 0; i < base.length; i++) {
      const j = (i + 1) % base.length;
      const a = base[i];
      const c = base[j];
      const d = hip[j];
      const e2 = hip[i];
      const len = Math.hypot(c[0] - a[0], c[1] - a[1]) || 1;
      const nx = (c[1] - a[1]) / len;
      const nz = -(c[0] - a[0]) / len;
      const sl = Math.hypot(o.hip.inset, o.hip.rise);
      roofBuf.quad([a[0], yr + 0.05, a[1]], [c[0], yr + 0.05, c[1]], [d[0], yh, d[1]], [e2[0], yh, e2[1]], [(nx * o.hip.rise) / sl, o.hip.inset / sl, (nz * o.hip.rise) / sl], [0, 0], [len, 0], [len, sl], [0, sl], o.roofTint || WHITE);
    }
    cap(roofBuf, hip, yh, true, o.roofTint || WHITE);
  } else if (inner) {
    cap(roofBuf, inner, yr, true, o.roofTint || WHITE);
    ringStrip(trim, ring, inner, yt, true, capCol);
    ringWalls(trim, inner, yr, yt, shade(capCol, 0.82), true, cutSet);
  } else {
    cap(roofBuf, ring, yt, true, o.roofTint || WHITE);
  }
  const res = { ring, inner, yr, yt, area, nf, fh, yb, runs, hasBase };
  if (o.noRoofStuff) return res;
  if (vol.top && vol.top > yr + 1.5) res.crownInside = crown(env, b, res, vol.top, st, o);
  else {
    if (!env.low && area > 220 && H >= 6.5 && (o.crown || st.crown) !== 'none') roofUnits(env, b, inner || ring, yr, { maxH: H < 9 ? 1.8 : 2.8 });
    if (yt >= 60) aviationLights(env, ring, yt + 0.45);
  }
  return res;
}

/** Shed with a low gable roof over a (near) rectangular plan; falls back to volume() otherwise. */
export function shed(env, b, vol, st, o = {}) {
  const ring = vol.ring;
  const ob = obb(ring);
  const rect = ring.length === 4 && signedArea(ring) / (4 * ob.hu * ob.hv) > 0.9 && !(vol.cut && vol.cut.length);
  if (!rect || vol.y1 - vol.y0 > 18) return volume(env, b, vol, st, o);
  const B = env.B;
  const span = Math.min(ob.hu, ob.hv);
  const rise = Math.min(3.2, span * 0.22);
  const eave = Math.max(vol.y0 + 2.4, vol.y1 - rise);
  const r = volume(env, b, { ...vol, y1: eave, top: undefined }, st, { ...o, parapet: 0, noRoofStuff: true });
  // volume() capped the box at the eave with a hidden lid; now the gable on top of it
  const p = r.ring;
  const l01 = Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1]);
  const l12 = Math.hypot(p[2][0] - p[1][0], p[2][1] - p[1][1]);
  const q = l01 >= l12 ? p : [p[1], p[2], p[3], p[0]]; // q0-q1 and q2-q3 are the long (eave) sides
  const mA = [(q[1][0] + q[2][0]) / 2, (q[1][1] + q[2][1]) / 2];
  const mB = [(q[3][0] + q[0][0]) / 2, (q[3][1] + q[0][1]) / 2];
  const ridge = eave + rise;
  const roof = B.get(o.roof || st.roof);
  const face = (a, bb, c, d) => {
    const A = [a[0], a[2], a[1]];
    const Bv = [bb[0], bb[2], bb[1]];
    const C = [c[0], c[2], c[1]];
    const D = [d[0], d[2], d[1]];
    const ux = Bv[0] - A[0];
    const uy = Bv[1] - A[1];
    const uz = Bv[2] - A[2];
    const vx = D[0] - A[0];
    const vy = D[1] - A[1];
    const vz = D[2] - A[2];
    let n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
    const l = Math.hypot(n[0], n[1], n[2]) || 1;
    n = n.map((v) => v / l);
    if (n[1] < 0) n = n.map((v) => -v);
    const len = Math.hypot(ux, uz);
    const w = Math.hypot(vx, vy, vz);
    roof.quad(A, Bv, C, D, n, [0, 0], [len, 0], [len, w], [0, w], WHITE);
  };
  // overhang 0.4 m at the eaves
  const out = (pt, m) => {
    const dx = pt[0] - m[0];
    const dz = pt[1] - m[1];
    const l = Math.hypot(dx, dz) || 1;
    return [pt[0] + (dx / l) * 0.4, pt[1] + (dz / l) * 0.4];
  };
  const e0 = out(q[0], mB);
  const e1 = out(q[1], mA);
  const e2 = out(q[2], mA);
  const e3 = out(q[3], mB);
  face([e0[0], e0[1], eave - 0.08], [e1[0], e1[1], eave - 0.08], [mA[0], mA[1], ridge], [mB[0], mB[1], ridge]);
  face([e2[0], e2[1], eave - 0.08], [e3[0], e3[1], eave - 0.08], [mB[0], mB[1], ridge], [mA[0], mA[1], ridge]);
  // gable ends
  const trim = B.get('context.trim');
  const gab = (a, c, m) => {
    const dx = c[0] - a[0];
    const dz = c[1] - a[1];
    const l = Math.hypot(dx, dz) || 1;
    trim.tri([a[0], eave, a[1]], [c[0], eave, c[1]], [m[0], ridge, m[1]], [dz / l, 0, -dx / l], [0, 0], [l, 0], [l / 2, rise], o.solid || st.solid);
  };
  gab(q[1], q[2], mA);
  gab(q[3], q[0], mB);
  return r;
}

/** Free-standing roof on posts (bus shelters, canopies mapped as building=roof). */
export function canopy(env, b, vol) {
  const B = env.B;
  const trim = B.get('context.trim');
  const ring = vol.ring;
  const y = vol.y1;
  const col = [0.62, 0.64, 0.65];
  cap(B.get('context.roof.light'), ring, y, true);
  cap(trim, ring, y - 0.22, false, shade(col, 0.8));
  ringWalls(trim, ring, y - 0.22, y, col);
  const inner = insetRing(ring, 0.35) || ring;
  const step = Math.max(1, Math.round(inner.length / 4));
  for (let i = 0; i < inner.length; i += step) boxO(trim, inner[i][0], inner[i][1], vol.y0, y - 0.22, 0.07, 0.07, 0, shade(col, 0.7), { top: false });
}

/** Open-deck parking structure: spandrel bands, dark recessed decks, columns, louvre screens, roof deck. */
export function parking(env, b, vol, o = {}) {
  const B = env.B;
  const cut = vol.cut || [];
  const ring = cut.length ? vol.ring : dropShortEdges(vol.ring, 1.6);
  const y0 = vol.y0;
  const yr = vol.y1;
  const H = yr - y0;
  const nl = Math.max(1, Math.round(H / 3.1));
  const lh = H / nl;
  const sp = B.get('context.parking.spandrel');
  const voidB = B.get('context.parking.void');
  const screen = B.get('context.parking.screen');
  const trim = B.get('context.trim');
  const conc = [0.57, 0.58, 0.56];
  const inner = insetRing(ring, 0.55);
  const spH = 1.1;
  const runs = facadeRuns(ring, cut);
  const rand = rng(hashId(b.id) + 5);
  for (const run of runs) {
    if (run.cut) {
      for (const e of run.edges) wallQuad(B.get('context.cut'), e.a, e.b, y0, yr + spH, e.nx, e.nz, e.s, e.s + e.len, y0, yr + spH);
      continue;
    }
    for (const e of run.edges) {
      const ia = inner ? inner[e.i] : e.a;
      const ib = inner ? inner[(e.i + 1) % ring.length] : e.b;
      for (let k = 0; k <= nl; k++) {
        const ya = y0 + k * lh;
        const h = k === 0 ? 0.45 : spH;
        wallQuad(sp, e.a, e.b, ya, ya + h, e.nx, e.nz, e.s, e.s + e.len, ya, ya + h); // spandrel / kerb / roof parapet
        if (k < nl) {
          wallQuad(voidB, ia, ib, ya + h, ya + lh, e.nx, e.nz, 0, e.len, 0, lh - h); // open deck, in shadow
          if (inner) {
            trim.quad([e.a[0], ya + h, e.a[1]], [e.b[0], ya + h, e.b[1]], [ib[0], ya + h, ib[1]], [ia[0], ya + h, ia[1]], [0, 1, 0], [0, 0], [e.len, 0], [e.len, 0.55], [0, 0.55], conc);
            trim.quad([e.a[0], ya + lh, e.a[1]], [e.b[0], ya + lh, e.b[1]], [ib[0], ya + lh, ib[1]], [ia[0], ya + lh, ia[1]], [0, -1, 0], [0, 0], [e.len, 0], [e.len, 0.55], [0, 0.55], shade(conc, 0.6));
          }
        }
      }
    }
    if (env.low || run.length < 5) continue;
    // columns every ~7.8 m, louvre screens on alternate bays of some facades
    const nb = Math.max(1, Math.round(run.length / 7.8));
    const bay = run.length / nb;
    const screened = rand() < 0.6;
    for (let k = 0; k <= nb; k++) {
      const { p, e } = alongRun(run, Math.min(run.length - 0.36, Math.max(0.36, k * bay)));
      boxO(sp, p[0] - e.nx * 0.2, p[1] - e.nz * 0.2, y0, yr + spH, 0.35, 0.28, Math.atan2(e.b[1] - e.a[1], e.b[0] - e.a[0]), shade(WHITE, 0.93), { top: false });
      if (screened && k < nb && k % 2 === 0 && nl > 1) {
        const p0 = alongRun(run, k * bay + 0.5);
        const p1 = alongRun(run, (k + 1) * bay - 0.5);
        if (p0.e === p1.e) {
          const q0 = [p0.p[0] + e.nx * 0.16, p0.p[1] + e.nz * 0.16];
          const q1 = [p1.p[0] + e.nx * 0.16, p1.p[1] + e.nz * 0.16];
          wallQuad(screen, q0, q1, y0 + lh, yr + spH, p0.e.nx, p0.e.nz, 0, bay - 1, 0, yr + spH - y0 - lh);
        }
      }
    }
  }
  // roof deck with stall lines, parapet inside faces, ramp and stair cores
  const yt = yr + spH;
  if (inner) {
    cap(B.get('context.parking.deck'), inner, yr, true);
    ringStrip(trim, ring, inner, yt, true, conc);
    ringWalls(sp, inner, yr, yt, shade(WHITE, 0.85), true, new Set(cut));
    if (!env.low && !o.noRoofStuff) {
      const c = centroid(inner);
      const ob = obb(inner);
      if (pointInRing(inner, c[0], c[1]) && distToRing(inner, c[0], c[1]) > 5) {
        boxO(B.get('context.plant.penthouse'), c[0] + ob.ux * (ob.hu * 0.5), c[1] + ob.uz * (ob.hu * 0.5), yr, yr + 2.9, 2.6, 1.8, ob.ang, WHITE, { topBuf: B.get('context.roof.membrane') });
      }
    }
  } else cap(B.get('context.parking.deck'), ring, yt, true);
  return { ring, inner, yr, yt };
}

export function tintFor(b, range = 0.07) {
  const h = hashId(b.id);
  const k = 1 - range + ((h % 1000) / 1000) * range * 1.4;
  const w = (((h >> 10) % 100) / 100 - 0.5) * 0.04; // slight warm / cool shift
  return [k * (1 + w), k, k * (1 - w)];
}

/** Facade family of a volume from the building type, its height and the OSM material tag. */
export function styleFor(b, vol) {
  const H = vol.y1 - vol.y0;
  const tall = (vol.top || vol.y1) > 0.55 * b.top;
  const podium = !tall && H < 22 && ['residential', 'office', 'hotel'].includes(b.type);
  if (podium) return H < 6.5 ? STYLES.shop : STYLES.commercial;
  switch (b.type) {
    case 'residential':
      return hashId(b.id) % 3 === 0 ? STYLES.resBeige : STYLES.resLight;
    case 'hotel':
      return STYLES.hotel;
    case 'office':
      return vol.material === 'mirror' || vol.material === 'glass' || H > 45 ? STYLES.officeBlue : STYLES.officePrecast;
    case 'civic':
      return STYLES.civic;
    case 'commercial':
      return H < 6.5 ? STYLES.shop : STYLES.commercial;
    case 'industrial':
      return H > 18 ? STYLES.coldstore : STYLES.industrial;
    default:
      return STYLES.utility;
  }
}

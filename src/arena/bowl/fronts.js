// Front edges of the Middle and Upper Stands: parapets, fascia beams, rails, the air
// nozzle band and the geometry of the ribbon display.
import * as THREE from 'three';
import { LEVEL_Y } from '../../core/envelope.js';
import { P, fbox, tube, disc } from './soup.js';

/** Row of posts with a top rail along the line v = const of a frame. */
function railRun(bk, F, ua, ub, v, yBase, yRail, r, postR, pitch = 1.5) {
  if (ub - ua < 0.2) return;
  tube(bk, P(F, ua, yRail, v), P(F, ub, yRail, v), r, 6);
  const n = Math.max(1, Math.round((ub - ua) / pitch));
  for (let i = 0; i <= n; i++) {
    const u = ua + 0.08 + ((ub - ua - 0.16) * i) / n;
    tube(bk, P(F, u, yBase, v), P(F, u, yRail, v), postR, 5);
  }
}

/**
 * Middle Stand front of one facet: cream concrete upstand and fascia, a recessed dark band
 * with a light slot below it, steel rail on top. On the centre facet (balcony seating)
 * the upstand is lower and carries the fat grey rail and a translucent lining.
 */
export function buildFrontL5(soup, M, S) {
  const level = 5;
  const { F, rows } = S;
  const first = rows[0];
  const vF = first.vF;
  const y1 = first.y;
  const balcony = S.facet === 'C';
  const ext = (k) => (S.ends[k].type === 'J' ? 0.14 : 0.2);
  const a = S.endRaw('lo', 0, vF) - ext('lo');
  const b = S.endRaw('hi', 0, vF) + ext('hi');
  const T = 0.25;
  const h = balcony ? 0.75 : 0.85;
  const bkP = soup.get(M.parapet, { level, group: 'front' });
  const bkRec = soup.get(M.fasciaRecess, { level, group: 'front' });
  const bkCove = soup.get(M.coveLight, { level, group: 'frontLight', cast: false });
  const bkS = soup.get(M.railSteel, { level, group: 'frontRail' });
  // upstand + fascia in one body
  fbox(bkP, F, a, b, vF - T, vF, y1 - 0.45, y1 + h);
  // recessed band down to the soffit edge
  const ysF = S.soffit.at(S.apo(vF - 0.13));
  fbox(bkRec, F, a, b, vF - 0.13, vF, ysF - 0.14, y1 - 0.45, 't');
  fbox(bkCove, F, a, b, vF - 0.136, vF - 0.13, y1 - 0.57, y1 - 0.5, 'r');
  if (balcony) {
    // fat round rail on short brackets, translucent lining on the inside of the upstand
    const yr = y1 + h + 0.11;
    const vr = vF - 0.07;
    tube(bkS, P(F, a, yr, vr), P(F, b, yr, vr), 0.07, 10);
    const n = Math.round((b - a) / 1.25);
    for (let i = 0; i <= n; i++) {
      const u = a + 0.2 + ((b - a - 0.4) * i) / n;
      tube(bkS, P(F, u, y1 + h - 0.02, vr), P(F, u, yr, vr), 0.022, 5);
    }
    const bkPanel = soup.get(M.balconyPanel, { level, group: 'front', cast: false });
    fbox(bkPanel, F, a + 0.2, b - 0.2, vF, vF + 0.02, y1 + 0.04, y1 + h - 0.02, 'bf');
  } else {
    railRun(bkS, F, a + 0.1, b - 0.1, vF - T / 2, y1 + h - 0.02, y1 + 1.1, 0.024, 0.016);
  }
}

/**
 * Upper Stand fronts. Wings: cream parapet behind a dark fascia with a row of round air
 * nozzles. Centre: the two front rows project in front of the wings; their fascia carries
 * the ribbon display (returned as { u0, u1, v, y0, y1 } in the centre facet frame).
 */
export function buildFrontL7(soup, M, T7) {
  const level = 7;
  const C = T7.byFacet.C;
  const bkP = soup.get(M.parapet, { level, group: 'front' });
  const bkD = soup.get(M.fasciaDark, { level, group: 'front' });
  const bkN = soup.get(M.nozzle, { level, group: 'front', cast: false });
  const bkS = soup.get(M.railSteel, { level, group: 'frontRail' });
  const bkH = soup.get(M.handrail, { level, group: 'guards' });
  const T = 0.2;
  const CL = 0.08; // cladding thickness
  const half = C.projHalf;

  const nozzles = (F, ua, ub, v, y) => {
    const n = Math.max(1, Math.floor((ub - ua) / 3.3));
    const pitch = (ub - ua) / n;
    for (let i = 0; i < n; i++) {
      const u = ua + pitch * (i + 0.5);
      disc(bkN, P(F, u, y, v - 0.012), [-F.vx, 0, -F.vz], 0.21, 14);
    }
  };
  const aisleGuards = (S, F, vF, yTop) => {
    // black guard frames on the parapet at the foot of every aisle
    for (const lane of S.rows[0].lanes) {
      if (lane.vom) continue;
      const a = lane.lo(vF) - 0.1;
      const b = lane.hi(vF) + 0.1;
      const v = vF - T / 2;
      tube(bkH, P(F, a, yTop + 0.38, v), P(F, b, yTop + 0.38, v), 0.022, 6);
      tube(bkH, P(F, a, yTop + 0.19, v), P(F, b, yTop + 0.19, v), 0.016, 5);
      for (const u of [a, (a + b) / 2, b]) tube(bkH, P(F, u, yTop - 0.02, v), P(F, u, yTop + 0.38, v), 0.018, 5);
    }
  };

  // wings
  let wingTop = 0;
  let zReturn = 0; // where the wing front meets the side of the projecting centre rows
  for (const S of T7.stands) {
    if (S.facet === 'C') continue;
    const { F, rows } = S;
    const first = rows[0];
    const vF = first.vF;
    const y = first.y;
    const top = y + 1.1;
    wingTop = top;
    const outerK = S.ends.lo.type === 'O' ? 'lo' : 'hi';
    const uOuter = S.ends[outerK].u + (outerK === 'lo' ? -0.2 : 0.2);
    // inner end: where the wing front meets the side of the projecting centre rows
    const xr = (outerK === 'lo' ? -1 : 1) * (half + T);
    const uInner = (xr - vF * F.vx) / F.ux;
    zReturn = uInner * F.uz + vF * F.vz;
    const a = Math.min(uOuter, uInner);
    const b = Math.max(uOuter, uInner);
    const yfb = LEVEL_Y[7] - 0.35 - 0.07; // just below the flat underside of the LEVEL 7 slab
    fbox(bkP, F, a, b, vF - T, vF, y - 0.1, top);
    fbox(bkD, F, a, b, vF - T, vF, yfb, y - 0.1, 't');
    fbox(bkD, F, a, b, vF - T - CL, vF - T, yfb, top - 0.12, 'r');
    nozzles(F, a, b, vF - T - CL, yfb + 0.62);
    railRun(bkS, F, a + 0.1, b - 0.1, vF - T / 2, top - 0.02, top + 0.1, 0.02, 0.014);
    aisleGuards(S, F, vF, top);
  }

  // centre projection
  const { F, rows } = C;
  const first = rows[0];
  const vF = first.vF;
  const y = first.y;
  const top = y + 1.1;
  const a = -(half + T);
  const b = half + T;
  const yfb = C.soffit.at(C.apo(vF)) - 0.35;
  fbox(bkP, F, a, b, vF - T, vF, y - 0.1, top);
  fbox(bkD, F, a, b, vF - T, vF, yfb, y - 0.1, 't');
  fbox(bkD, F, a - CL, b + CL, vF - T - CL, vF - T, yfb, top - 0.12, 'r');
  const ribbonY1 = top - 0.12;
  const ribbonY0 = ribbonY1 - 1.0;
  nozzles(F, a, b, vF - T - CL, yfb + (ribbonY0 - yfb) * 0.48);
  railRun(bkS, F, a + 0.1, b - 0.1, vF - T / 2, top - 0.02, top + 0.1, 0.02, 0.014);
  aisleGuards(C, F, vF, top);
  // side returns of the projection, up to the height of the wing parapets
  const vEnd = zReturn + 0.02;
  for (const s of [-1, 1]) {
    const u0 = s * half;
    const u1 = s * (half + T);
    fbox(bkP, F, u0, u1, vF - T, vEnd, y - 0.1, wingTop);
    fbox(bkD, F, u0, u1, vF - T, vEnd, yfb, y - 0.1, 't');
    fbox(bkD, F, u1, u1 + s * CL, vF - T - CL, vEnd, yfb, wingTop - 0.12);
  }
  return { F, u0: -31.25, u1: 31.25, v: vF - T - CL - 0.03, y0: ribbonY0, y1: ribbonY1 };
}

/** The ribbon display as its own mesh (normalised UVs: u = 0 at the audience-right end as seen from the stage side). */
export function ribbonGeometry(rb) {
  const { F, u0, u1, v, y0, y1 } = rb;
  const p00 = P(F, u0, y0, v);
  const p10 = P(F, u1, y0, v);
  const p11 = P(F, u1, y1, v);
  const p01 = P(F, u0, y1, v);
  const g = new THREE.BufferGeometry();
  // facing the stage (−v): seen from the stage, +u (house right) is on the viewer's left
  const pos = [...p10, ...p00, ...p01, ...p10, ...p01, ...p11];
  const uv = [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1];
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

// Primary and secondary roof steel: the 18 long-span trusses, the cross frames, the bracing of
// the bottom-chord plane, purlins, light-carrier beams and the bearings.
//
// Member sizes are ESTIMATED (no structural drawings are public); they are sized for a 112 m
// span carrying about 3,400 t of roof steel and 120 t of rigging, and checked against the
// flange widths visible in the L-Acoustics photo taken under the trusses:
//   chords                built-up H 600 x 700
//   truss verticals       H 400 x 400      truss diagonals   H 450 x 450
//   cross-frame struts    H 300 x 350      cross diagonals   H 250 x 250
//   plan bracing          2L 200 x 120     purlins           H 125 x 250
//   light-carrier beams   150 x 200
import { COLUMNS } from '../../core/envelope.js';
import { hSection, rectSection } from './builder.js';
import {
  TRUSSES,
  STATIONS,
  PANEL,
  Z0,
  Z1,
  CHORD_D,
  PURLIN_D,
  CENTRE_HALF,
  SHOULDER_COL,
  COLUMN_TOP_Y,
  BEARING_Y,
  ceilingY,
  bottomY,
  hallW,
  hallEntryZ,
  crossBreaks,
  STAGE_CLOSURE_Z,
  REAR_CLOSURE_Z,
  SHOULDER_Z,
  SIN_W,
  COS_W,
} from './layout.js';

const UP_X = [1, 0, 0];

/** Index of the panel station at z, or −1 when z is not a station (truss ends on the flank or the diagonals). */
function stationIndex(z) {
  const f = (z - Z0) / PANEL;
  const r = Math.round(f);
  return Math.abs(f - r) < 1e-4 ? r : -1;
}

export function buildTrusses(buf, { low = false } = {}) {
  const chordB = low ? rectSection(0.6, CHORD_D, 'bottom') : hSection(0.6, CHORD_D, 0.045, 0.03, 'bottom');
  const chordT = low ? rectSection(0.6, CHORD_D, 'top') : hSection(0.6, CHORD_D, 0.045, 0.03, 'top');
  const vert = low ? rectSection(0.4, 0.4) : hSection(0.4, 0.4, 0.03, 0.02);
  const diag = low ? rectSection(0.45, 0.45) : hSection(0.45, 0.45, 0.035, 0.025);
  const half = CHORD_D / 2;

  for (const t of TRUSSES) {
    const pts = t.points;
    const n = pts.length;
    // bottom chord: one straight member; top chord: one piece per panel (it follows the roof)
    buf.sweep([t.x, t.yb(t.zs), t.zs], [t.x, t.yb(t.ze), t.ze], chordB);
    for (let i = 0; i < n - 1; i++) buf.sweep([t.x, t.yt(pts[i]), pts[i]], [t.x, t.yt(pts[i + 1]), pts[i + 1]], chordT);
    for (let i = 0; i < n; i++) {
      const z = pts[i];
      const yb = t.yb(z) + half;
      const yt = t.yt(z) - half;
      // verticals at every panel point (end posts are heavier)
      const end = i === 0 || i === n - 1;
      buf.sweep([t.x, yb, z], [t.x, yt, z], end ? diag : vert, UP_X);
      if (i === n - 1) break;
      // Warren diagonal. The pattern follows the global panel grid so that neighbouring trusses
      // match: diagonals meet at the TOP chord on odd stations and at the bottom chord on even ones.
      const zn = pts[i + 1];
      const mn = stationIndex(zn);
      const m0 = stationIndex(z);
      const rising = mn >= 0 ? mn % 2 === 1 : m0 >= 0 ? m0 % 2 === 0 : true;
      const ybn = t.yb(zn) + half;
      const ytn = t.yt(zn) - half;
      if (rising) buf.sweep([t.x, yb, z], [t.x, ytn, zn], diag, UP_X);
      else buf.sweep([t.x, yt, z], [t.x, ybn, zn], diag, UP_X);
      if (!low) {
        // gusset plates on both faces of the web members, at the top and bottom node
        for (const s of [-1, 1]) {
          const gx = t.x + s * 0.238;
          buf.aabb(gx - 0.012, t.yb(z) + 0.05, z - 0.55, gx + 0.012, t.yb(z) + 1.0, z + 0.55);
          buf.aabb(gx - 0.012, t.yt(z) - 1.0, z - 0.55, gx + 0.012, t.yt(z) - 0.05, z + 0.55);
        }
      }
    }
    // bearing shoes under both ends of the bottom chord
    buf.aabb(t.x - 0.45, t.yb(t.zs) - 0.22, t.zs - 0.1, t.x + 0.45, t.yb(t.zs), t.zs + 0.6);
    buf.aabb(t.x - 0.45, t.yb(t.ze) - 0.22, t.ze - 0.6, t.x + 0.45, t.yb(t.ze), t.ze + 0.0);
  }
}

/** Cross frames at the panel stations, plan bracing of the bottom-chord plane, light carriers. */
export function buildSecondary(buf, { low = false } = {}) {
  const strut = low ? rectSection(0.3, 0.35) : hSection(0.3, 0.35, 0.025, 0.018);
  const topStrut = low ? rectSection(0.3, 0.3) : hSection(0.3, 0.3, 0.025, 0.018);
  const xdiag = low ? rectSection(0.25, 0.25) : hSection(0.25, 0.25, 0.02, 0.015);
  const brace = rectSection(0.2, 0.12);
  const carrier = rectSection(0.15, 0.2);
  const half = CHORD_D / 2;
  const n = TRUSSES.length;

  for (let si = 0; si < STATIONS.length; si++) {
    const z = STATIONS[si];
    const crossTruss = si % 2 === 1 || si === 0;
    for (let k = 0; k < n - 1; k++) {
      const a = TRUSSES[k];
      const b = TRUSSES[k + 1];
      if (!a.spans(z) || !b.spans(z)) continue;
      const ya = a.yb(z) + half;
      const yb = b.yb(z) + half;
      buf.sweep([a.x + 0.3, ya, z], [b.x - 0.3, yb, z], strut);
      if (crossTruss) {
        const ta = a.yt(z) - half;
        const tb = b.yt(z) - half;
        const xm = (a.x + b.x) / 2;
        const tm = (ta + tb) / 2;
        buf.sweep([a.x + 0.3, ta, z], [b.x - 0.3, tb, z], topStrut);
        // inverted V: both diagonals rise from the bottom chords to the middle of the top strut,
        // which keeps the middle of every bay free for the catwalks
        buf.sweep([a.x + 0.25, ya + 0.1, z], [xm, tm - 0.1, z], xdiag, [0, 0, 1]);
        buf.sweep([b.x - 0.25, yb + 0.1, z], [xm, tm - 0.1, z], xdiag, [0, 0, 1]);
      }
    }
    // edge struts from the outermost truss that exists at this station to the side walls
    if (z > STAGE_CLOSURE_Z && z < REAR_CLOSURE_Z) {
      const w = hallW(z);
      const span = TRUSSES.filter((t) => t.spans(z));
      if (span.length) {
        const l = span[0];
        const r = span[span.length - 1];
        if (w - r.x > 0.8) buf.sweep([r.x + 0.3, r.yb(z) + half, z], [w, bottomY(w - 0.3, z) + half, z], strut);
        if (l.x + w > 0.8) buf.sweep([-w, bottomY(-w + 0.3, z) + half, z], [l.x - 0.3, l.yb(z) + half, z], strut);
      }
    }
  }

  // plan X-bracing in the bottom-chord plane, one X per bay and panel
  if (!low) {
    for (let k = 0; k < n - 1; k++) {
      const a = TRUSSES[k];
      const b = TRUSSES[k + 1];
      for (let si = 0; si < STATIONS.length - 1; si++) {
        const z0 = STATIONS[si];
        const z1 = STATIONS[si + 1];
        if (!a.spans(z0) || !b.spans(z0) || !a.spans(z1) || !b.spans(z1)) continue;
        const h = 0.3;
        buf.sweep([a.x + 0.3, a.yb(z0) + h, z0 + 0.2], [b.x - 0.3, b.yb(z1) + h, z1 - 0.2], brace);
        buf.sweep([a.x + 0.3, a.yb(z1) + h + 0.13, z1 - 0.2], [b.x - 0.3, b.yb(z0) + h + 0.13, z0 + 0.2], brace);
      }
    }
  }

  // light-carrier beams 1.6 m either side of every truss, panel by panel
  for (const x of lightLines()) {
    const zs = Math.max(Z0 + 0.05, hallEntryZ(x) + 0.2);
    const ze = Math.min(REAR_CLOSURE_Z, rearLimitZ(x)) - 0.05;
    if (ze - zs < 2) continue;
    const zz = [zs, ...STATIONS.filter((s) => s > zs + 0.5 && s < ze - 0.5), ze];
    for (let i = 0; i < zz.length - 1; i++) {
      buf.sweep([x, bottomY(x, zz[i]) + 0.45, zz[i]], [x, bottomY(x, zz[i + 1]) + 0.45, zz[i + 1]], carrier);
    }
  }
}

/** z of the rear closure (centre wall or diagonal) at lateral position x. */
export function rearLimitZ(x) {
  // wing rear closure: x·sin + z·cos = V  →  z = (V − |x|·sin) / cos, V taken from hallW's definition
  let lo = SHOULDER_Z; // the hall is widest here; it narrows toward the rear
  let hi = REAR_CLOSURE_Z;
  if (hallW(hi) >= Math.abs(x)) return hi;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (hallW(m) >= Math.abs(x)) lo = m;
    else hi = m;
  }
  return lo;
}

/**
 * Lines of the house lights: 1.6 m either side of every truss. In the official photo taken from
 * the stage two twin fixtures sit in every truss bay, at about 18 % and 82 % of the bay width.
 */
export const LIGHT_OFFSET = 1.6;
export function lightLines() {
  return TRUSSES.flatMap((t) => [t.x - LIGHT_OFFSET, t.x + LIGHT_OFFSET]).sort((a, b) => a - b);
}

/** Roof purlins under the ceiling surface and the packing posts that carry them over the crown. */
export function buildPurlins(buf, { low = false } = {}) {
  const purlin = low ? rectSection(0.125, PURLIN_D, 'top') : hSection(0.125, PURLIN_D, 0.012, 0.008, 'top');
  const step = PANEL / 3; // 2.07 m: three purlin fields per truss panel, as in the photo from the upper house-left side
  for (let j = 0; ; j++) {
    const z = Z0 + j * step;
    if (z > REAR_CLOSURE_Z) break;
    const w = hallW(z) - 0.02;
    if (w < 1) continue;
    const xs = crossBreaks(z, w, TRUSSES.map((t) => t.x));
    for (let i = 0; i < xs.length - 1; i++) {
      buf.sweep([xs[i], ceilingY(xs[i], z) - 0.005, z], [xs[i + 1], ceilingY(xs[i + 1], z) - 0.005, z], purlin);
    }
    // packing posts on the top chords where the crown lifts the roof above the chord
    for (const t of TRUSSES) {
      if (!t.spans(z) || Math.abs(t.x) > w) continue;
      const top = ceilingY(t.x, z) - PURLIN_D;
      const gap = top - t.yt(z);
      if (gap > 0.06) buf.aabb(t.x - 0.1, t.yt(z), z - 0.1, t.x + 0.1, top, z + 0.1);
    }
  }
}

/** Ring girder on the rear column line with a stub on every column head (hidden behind the rear closure). */
export function buildRearBearing(buf) {
  const inset = 0.32;
  const girder = rectSection(0.5, 0.8, 'top');
  const y = BEARING_Y - 0.22;
  const line = [
    [-SHOULDER_COL[0], SHOULDER_COL[1]],
    [-CENTRE_HALF, Z1],
    [CENTRE_HALF, Z1],
    [SHOULDER_COL[0], SHOULDER_COL[1]],
  ];
  // shift the line toward the hall: centre facet along −z, diagonals along their inward normal
  const shifted = [
    [line[0][0] + SIN_W * inset, line[0][1] - COS_W * inset],
    [line[1][0] + SIN_W * inset * 0.3, line[1][1] - inset],
    [line[2][0] - SIN_W * inset * 0.3, line[2][1] - inset],
    [line[3][0] - SIN_W * inset, line[3][1] - COS_W * inset],
  ];
  for (let i = 0; i < 3; i++) buf.sweep([shifted[i][0], y, shifted[i][1]], [shifted[i + 1][0], y, shifted[i + 1][1]], girder);
  for (const [cx, cz] of COLUMNS) {
    const onCentre = Math.abs(cz - Z1) < 0.01;
    const sx = onCentre ? 0 : -Math.sign(cx) * SIN_W * inset;
    const sz = onCentre ? -inset : -COS_W * inset;
    buf.aabb(cx + sx - 0.3, COLUMN_TOP_Y + 0.35, cz + sz - 0.3, cx + sx + 0.3, y - 0.8, cz + sz + 0.3);
  }
}

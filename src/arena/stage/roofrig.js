// Where the flown equipment meets the roof.
//
// arena/roof owns the 18 trusses and a flat rigging deck ("sunoko") at 9FL over the stage
// and the front arena; it puts the hoist machines of the lifting grids on that deck. This
// file reproduces the two plan rules both modules share (derived from core/envelope.js only):
//   - truss lines parallel to the axis at x = ±(k + 0.5) · pitch of the rear colonnade,
//   - rigging deck: |x| ≤ 1.5 pitch − 0.35, from 0.7 m in front of the stage rear wall to
//     1.3 m beyond the last lifting grid, walking surface at LEVEL 9.
// A suspension line that rises under the deck stops at its underside; any other line stops
// on a rigging beam of this module that spans between the two neighbouring roof trusses,
// just under their bottom chords (trussBottomY).
import { COLUMNS, Z, LEVEL_Y, trussBottomY } from '../../core/envelope.js';

const centre = COLUMNS.filter(([, z]) => Math.abs(z - Z.columnLine) < 0.01)
  .map(([x]) => x)
  .sort((a, b) => a - b);
/** Lateral pitch of the roof trusses = pitch of the rear colonnade (8.54 m). */
export const TRUSS_PITCH = (centre[centre.length - 1] - centre[0]) / (centre.length - 1);

export function rigDeck(SPEC) {
  const lg = SPEC.production.liftingGrids;
  return {
    y: LEVEL_Y[9],
    under: LEVEL_Y[9] - 0.055, // slab underside
    halfW: 1.5 * TRUSS_PITCH - 0.35,
    z0: Z.stageRearWall + 0.7,
    z1: Math.max(...lg.rowCentresY_H) + lg.frameDepth_m / 2 + 1.3,
  };
}

export class RoofRig {
  /** `batch` receives the rigging beams (black steel). */
  constructor(SPEC, batch) {
    this.deck = rigDeck(SPEC);
    this.batch = batch;
    this.beams = new Map();
  }

  underDeck(x, z) {
    const d = this.deck;
    return Math.abs(x) <= d.halfW && z >= d.z0 && z <= d.z1;
  }

  /** Height at which a vertical line rising at (x, z) is made fast. */
  top(x, z) {
    if (this.underDeck(x, z)) return this.deck.under - 0.005;
    const P = TRUSS_PITCH;
    const ax = Math.abs(x);
    const s = Math.sign(x) || 1;
    let xa;
    let xb;
    if (ax < 0.5 * P) {
      xa = -0.5 * P;
      xb = 0.5 * P;
    } else {
      const k = Math.floor(ax / P - 0.5);
      xa = s * (k + 0.5) * P;
      xb = s * (k + 1.5) * P;
    }
    const zk = Math.round(z * 50) / 50;
    const key = `${xa.toFixed(2)}:${zk.toFixed(2)}`;
    const yTop = trussBottomY(zk) - 0.02;
    const depth = 0.3;
    if (!this.beams.has(key)) {
      this.beams.set(key, true);
      const x0 = Math.min(xa, xb);
      const x1 = Math.max(xa, xb);
      // H section: two flanges and a web, with a hanger clamp at each truss
      this.batch.span(x0, x1, yTop - 0.02, yTop, zk - 0.1, zk + 0.1);
      this.batch.span(x0, x1, yTop - depth + 0.02, yTop - 0.02, zk - 0.006, zk + 0.006);
      this.batch.span(x0, x1, yTop - depth, yTop - depth + 0.02, zk - 0.1, zk + 0.1);
      for (const xe of [x0, x1]) this.batch.box(xe, yTop - depth / 2 - 0.01, zk, 0.3, depth + 0.02, 0.26);
    }
    return yTop - depth;
  }
}

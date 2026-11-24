// Scalloped wall-wash on the plain charcoal wall above the top gallery (house lighting state):
// soft parabolic pools of light from the downlights that stand close to the walls, baked as
// an additive sheet 12 mm in front of the wall face. update() switches it off in show mode.
import { Mesher } from './builder.js';
import { FRAME_R, FRAME_L, FRAME_B, REAR_LEN, LEVEL_Y, STAND_S, STAND_LINE, wallTop, REAR_TOP } from './layout.js';

const SIDES = [FRAME_R, FRAME_L];

function scallop(m, sc, yTop, height, halfW, low) {
  const nu = low ? 4 : 8;
  const nv = low ? 3 : 6;
  const d = 0.012;
  const at = (iu, iv) => {
    const u = (iu / nu) * 2 - 1;
    const v = iv / nv;
    const r = 0.14 + 0.86 * Math.sqrt(v); // beam edge widens downwards
    const e = Math.max(0, 1 - (u / r) * (u / r));
    const k = Math.pow(e, 1.3) * Math.pow(1 - v, 1.25) * Math.min(1, 0.25 + v * 5);
    return { p: [sc + u * halfW, yTop - v * height, d], k };
  };
  for (let iv = 0; iv < nv; iv++) {
    for (let iu = 0; iu < nu; iu++) {
      const a = at(iu, iv + 1);
      const b = at(iu + 1, iv + 1);
      const c = at(iu + 1, iv);
      const e = at(iu, iv);
      if (a.k + b.k + c.k + e.k < 1e-4) continue;
      m.triColToward(a.p, b.p, c.p, [0, 0, 1], a.k, b.k, c.k);
      m.triColToward(a.p, c.p, e.p, [0, 0, 1], a.k, c.k, e.k);
    }
  }
}

export function buildWash(B, { ends, low }) {
  const S = STAND_S;
  const side = new Mesher();
  const sLast = Math.min(ends[7] + 7, S.upperBack - 12);
  for (let s = 5.5; s <= sLast; s += 6.2) {
    const top = wallTop(s) - 0.35;
    // stay above the gallery handrail and above the Upper Stand where it climbs along the wall
    const [u0, y0, u1, y1] = STAND_LINE.upper;
    const upper = s > S.upperFront ? y0 + ((s - u0) / (u1 - u0)) * (y1 - y0) + 1.4 : 0;
    const bottom = Math.max(LEVEL_Y[7] + 0.4, upper);
    scallop(side, s, top, Math.min(7.6, top - bottom), 3.0, low);
  }
  B.add('hall.wallWash', 8, side, SIDES);
  const rear = new Mesher();
  const n = 8;
  for (let i = 0; i < n; i++) scallop(rear, ((i + 0.5) / n) * REAR_LEN, REAR_TOP - 0.35, 6.6, 3.0, low);
  B.add('hall.wallWash', 8, rear, [FRAME_B]);
}

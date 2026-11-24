// Black-framed glazed door screens of the LEVEL 3 entrances. The wall behind has a real
// opening; some double doors stand open so the opening can be walked through.
import { frame, fpt, slab, rect, obox, mul } from './common.js';

/** One door leaf in the plane d = 0 of frame F, hinged at u0 (pull bar near u1). */
function leaf(col, F, u0, u1, y0, y1, level) {
  const fr = col.geo('facade.doorFrame', { level, part: 'entrance door frames' });
  const glass = col.geo('facade.doorGlass', { level, part: 'entrance door glass' });
  const pull = col.geo('facade.doorPull', { level, part: 'door pulls' });
  const a = Math.min(u0, u1);
  const b = Math.max(u0, u1);
  const st = 0.06;
  obox(fr, F, a, a + st, y0, y1, -0.025, 0.025);
  obox(fr, F, b - st, b, y0, y1, -0.025, 0.025);
  obox(fr, F, a + st, b - st, y1 - 0.08, y1, -0.025, 0.025, 'lr');
  obox(fr, F, a + st, b - st, y0 + 0.02, y0 + 0.14, -0.025, 0.025, 'lr');
  slab(glass, F, rect(a + st, y0 + 0.14, b - st, y1 - 0.08), { t: 0.012, off: 0.006, edge: false });
  const up = u1 > u0 ? u1 - 0.11 : u1 + 0.11;
  for (const d of [0.05, -0.08]) obox(pull, F, up - 0.015, up + 0.015, y0 + 0.35, y0 + 2.0, d, d + 0.03);
}

/**
 * Door screen filling the opening [u0, u1] × [y0, y0 + h] of wall frame F.
 *   bays     number of double doors side by side
 *   open     indices of the bays whose leaves stand open (swung 90° inward)
 *   transom  door height; the strip above is fixed glazing
 *   inset    distance of the screen behind the outer wall face
 */
export function doorScreen(col, F, u0, u1, y0, h, { bays = 3, open = [], level = 3, transom = 2.45, inset = 0.12 } = {}) {
  const fr = col.geo('facade.doorFrame', { level, part: 'entrance door frames' });
  const glass = col.geo('facade.doorGlass', { level, part: 'entrance door glass' });
  const w = (u1 - u0) / bays;
  const yT = y0 + transom;
  const y1 = y0 + h;
  const D0 = -inset - 0.1;
  const D1 = -inset + 0.04;
  for (let i = 0; i <= bays; i++) {
    const u = u0 + i * w;
    const a = i === 0 ? u : i === bays ? u - 0.08 : u - 0.05;
    const b = i === 0 ? u + 0.08 : i === bays ? u : u + 0.05;
    obox(fr, F, a, b, y0, y1, D0, D1);
  }
  obox(fr, F, u0, u1, y1 - 0.08, y1, D0, D1, 'lr');
  if (y1 - yT > 0.2) {
    obox(fr, F, u0, u1, yT - 0.04, yT + 0.04, D0, D1, 'lr');
    slab(glass, F, rect(u0 + 0.08, yT + 0.04, u1 - 0.08, y1 - 0.08), { t: 0.012, off: -inset - 0.02, edge: false });
  }
  const FP = frame(fpt(F, 0, 0, -inset - 0.03), F.U, F.N);
  for (let i = 0; i < bays; i++) {
    const a = u0 + i * w + 0.06;
    const b = u0 + (i + 1) * w - 0.06;
    const m = (a + b) / 2;
    if (open.includes(i)) {
      // leaves swung inward about their hinges at a and b
      const inward = mul(F.N, -1);
      leaf(col, frame(fpt(FP, a, 0, 0), inward, F.U), 0, m - a - 0.01, y0, yT - 0.04, level);
      leaf(col, frame(fpt(FP, b, 0, 0), inward, mul(F.U, -1)), 0, b - m - 0.01, y0, yT - 0.04, level);
    } else {
      leaf(col, FP, a, m - 0.005, y0, yT - 0.04, level);
      leaf(col, FP, b, m + 0.005, y0, yT - 0.04, level);
    }
  }
}

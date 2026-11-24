// Vertical circulation: the red grand stair (LEVEL 3 → 4), the "3-4-5" flights, the four
// LEVEL 1-3 stairs, the six "3-5-7" stair cores, the four escalators LEVEL 3 ↔ 5 and the
// five lift cores. Fact sheet §4.2.
import { LEVEL_Y } from '../../core/envelope.js';
import { frameC, frameW, frameX, RC0 } from './kit.js';
import { R, Y, CIRC, BS } from './plan.js';
import { shafts357, liftShafts, BS_STAIR } from './slabs.js';
import { signF } from './signs.js';
import { levelAt } from './fittings.js';

const y3 = Y[3];
const y4 = Y[4];
const y5 = Y[5];
const wallMat = (lv) => (lv === 3 ? 'mortarL3' : lv >= 7 ? 'mortarL7' : lv === 5 || lv === 4 ? 'mortar' : lv === 6 ? 'vipPanel' : 'concreteCore');

function grandStair(kit) {
  const g = CIRC.grand;
  // one flight 16.9 m wide (three bays): the foyer columns stand in it
  kit.flight(frameC(1), 0, g.rFoot, y3, 0, -1, g.n, g.rise, g.going, 2 * g.inner[1], 'redStair', 3, { solid: true });
  const s45 = CIRC.s45;
  const s34 = CIRC.s34;
  for (const s of [1, -1]) {
    const C = frameC(s);
    // LEVEL 4 → 5: above the outer lane of the grand stair, and in bay E
    for (const x of s45.xs) kit.flight(C, x, s45.r0, y4, 0, 1, s45.n, s45.rise, s45.going, s45.width, 'redStair', 4, { solid: true });
    for (const x of s45.xs) {
      for (const e of [-1, 1]) {
        const xr = x + e * (s45.width / 2 - 0.07);
        kit.beam(C, [xr, s45.r0, y4 + 0.92], [xr, s45.r0 + 15 * s45.going, y5 + 0.92], 0.045, 0.045, 'steelBlack', 4);
      }
    }
    // LEVEL 3 → 4 into the mezzanine arm
    kit.flight(C, s34.x, s34.r0, y3, 0, -1, s34.n, s34.rise, s34.going, s34.width, 'redStair', 3, { solid: true });
    for (const e of [-1, 1]) {
      const xr = s34.x + e * (s34.width / 2 - 0.07);
      kit.beam(C, [xr, s34.r0, y3 + 0.92], [xr, s34.r0 - 16 * s34.going, y4 + 0.92], 0.045, 0.045, 'steelBlack', 3);
    }
  }
}

function stairs13(kit) {
  const st = CIRC.s13;
  const c1 = Y[2] - 0.35;
  const c2 = y3 - 0.35;
  for (const s of [1, -1]) {
    const C = frameC(s);
    for (const x of st.xs) {
      let r = st.rFoot;
      let y = 0.02;
      st.flights.forEach(({ n, rise }, i) => {
        const lv = i === 0 ? 1 : 3;
        const res = kit.flight(C, x, r, y, 0, 1, n, rise, st.going, st.width, 'stairConcrete', lv, { waist: 0.25, yFloor: i === 0 ? 0.02 : null, nosing: 'stairNosing' });
        for (const e of [-1, 1]) {
          const xr = x + e * (st.width / 2 - 0.07);
          kit.beam(C, [xr, r, y + 0.92], [xr, r + res.run, y + n * rise + 0.92], 0.045, 0.045, 'steelBlack', lv);
        }
        r += res.run;
        y += n * rise;
        if (i < st.flights.length - 1) {
          kit.box(C, x - st.width / 2, x + st.width / 2, r, r + st.landing, y - 0.22, y, 'stairConcrete', 2);
          r += st.landing;
        }
      });
      // enclosing walls of the stair: red toward the public LEVEL 1 concourse, plain above
      const hw = st.width / 2 + 0.12 + 0.1;
      for (const e of [-1, 1]) {
        kit.wall(C, x + e * hw, 93.5, x + e * hw, st.rTop + 0.3, 0.02, c1, 0.2, 'red', 1);
        kit.wall(C, x + e * hw, 93.5, x + e * hw, st.rTop + 0.3, c1, c2, 0.2, 'boh', 2);
      }
      kit.wall(C, x - hw, st.rTop + 0.2, x + hw, st.rTop + 0.2, 0.02, c2, 0.2, 'boh', 2);
    }
  }
}

function cores357(kit) {
  const c = CIRC.s357;
  const run = (c.n - 1) * c.going; // 4.32
  const topY = Y[8] - 0.3;
  for (const sh of shafts357()) {
    const { f, p0, p1 } = sh;
    const q0 = R.shaft0;
    const q1 = R.shaft1;
    const qm = (q0 + q1) / 2;
    const land = (p1 - p0 - 0.4 - run) / 2; // landing length at both ends
    const pa = p0 + 0.2 + land; // start of the flights
    const pb = pa + run;
    // shaft walls storey by storey, with a door on each served level
    const storeys = [3, 5, 6, 7];
    storeys.forEach((lv, i) => {
      const yb = LEVEL_Y[lv];
      const yt = i < storeys.length - 1 ? LEVEL_Y[storeys[i + 1]] : topY;
      const m = wallMat(lv);
      const door = { at: 0.2 + land / 2 + 0.05, w: 1.5, h: 2.2 };
      const outside = lv === 7; // on LEVEL 7 the concourse is on the outer side of the block band
      kit.wall(f, p0, q0 + 0.1, p1, q0 + 0.1, yb, yt, 0.2, m, lv, outside ? [] : [door]);
      kit.wall(f, p0, q1 - 0.1, p1, q1 - 0.1, yb, yt, 0.2, m, lv, outside ? [door] : []);
      kit.wall(f, p0 + 0.1, q0 + 0.2, p0 + 0.1, q1 - 0.2, yb, yt, 0.2, m, lv);
      kit.wall(f, p1 - 0.1, q0 + 0.2, p1 - 0.1, q1 - 0.2, yb, yt, 0.2, m, lv);
      // door leaves (steel fire doors, closed) and the stair pictogram
      const qd = outside ? q1 - 0.1 : q0 + 0.1;
      const dq = outside ? 1 : -1;
      const pd = p0 + door.at;
      for (const e of [-1, 1]) kit.box(f, pd + (e < 0 ? -0.75 : 0.005), pd + (e < 0 ? -0.005 : 0.75), qd - 0.03, qd + 0.03, yb, yb + 2.2, lv === 6 ? 'vipDoor' : 'door', lv);
      for (const e of [-1, 1]) kit.box(f, pd + e * 0.1 - 0.015, pd + e * 0.1 + 0.015, qd + dq * 0.03, qd + dq * 0.08, yb + 0.9, yb + 1.3, 'stainless', lv);
      if (lv !== 6) signF(kit, f, lv, pd + 1.35, qd + dq * 0.1, yb + 1.65, 0, dq, 0.62, 0.86, { kind: 'picto', icon: 'stairs', caption: 'LEVEL\n3·5·7' });
      kit.box(f, pd - 0.25, pd + 0.25, qd + dq * 0.1, qd + dq * 0.14, yb + 2.3, yb + 2.46, 'exitSign', lv);
      // floor landing of this level (the slab is cut out over the whole shaft)
      if (lv === 3) kit.box(f, p0 + 0.2, p1 - 0.2, q0 + 0.2, q1 - 0.2, yb - 0.3, yb, 'stairConcrete', lv);
      else kit.box(f, p0 + 0.2, pa, q0 + 0.2, q1 - 0.2, yb - 0.25, yb, 'stairConcrete', lv);
      if (lv === 7) {
        kit.rail(f, [[pa, qm - 0.05, yb], [pa, q1 - 0.2, yb]], lv, { infill: 'bars', spacing: 0.9 });
        return;
      }
      // two flights per 5.4 m storey, half landing at the far end
      const fl1 = kit.flight(f, pa, (qm + q1 - 0.2) / 2 + 0.05, yb, 1, 0, c.n, c.rise, c.going, c.flightW, 'stairConcrete', lv, { waist: 0.22, yFloor: lv === 3 ? yb : null, nosing: 'stairNosing' });
      kit.box(f, pb, p1 - 0.2, q0 + 0.2, q1 - 0.2, yb + 2.7 - 0.22, yb + 2.7, 'stairConcrete', lv);
      kit.flight(f, pb, (qm + q0 + 0.2) / 2 - 0.05, yb + 2.7, -1, 0, c.n, c.rise, c.going, c.flightW, 'stairConcrete', lv, { waist: 0.22, nosing: 'stairNosing' });
      // handrails on the shaft walls and the balustrade between the flights
      kit.beam(f, [pa, q1 - 0.27, yb + 0.92], [pb, q1 - 0.27, yb + 2.7 + 0.92], 0.045, 0.045, 'steelBlack', lv);
      kit.beam(f, [pb, q0 + 0.27, yb + 2.7 + 0.92], [pa, q0 + 0.27, yb + 5.4 + 0.92], 0.045, 0.045, 'steelBlack', lv);
      kit.rail(f, [[pa, qm, yb], [pb, qm, yb + 2.7]], lv, { infill: 'bars', spacing: 1.1, height: 1.0 });
      kit.rail(f, [[pb, qm, yb + 2.7], [pa, qm, yb + 5.4]], lv, { infill: 'bars', spacing: 1.1, height: 1.0 });
      void fl1;
    });
  }
}

function escalators(kit) {
  const e = CIRC.esc;
  const tan = Math.tan((30 * Math.PI) / 180);
  for (const s of [1, -1]) {
    const C = frameC(s);
    const xa = e.comb0; // foot of the incline
    const xb = e.comb0 + e.run; // head of the incline
    const x0 = e.x0;
    const x1 = xb + e.x1plate;
    for (const [i, rc] of [e.r0 + 0.85, e.r1 - 0.85].entries()) {
      const q0 = rc - 0.78;
      const q1 = rc + 0.78;
      // cladding of the truss: sloped body + the horizontal head
      kit.beam(C, [xa - 0.8, rc, y3 - 0.55 - 0.8 * tan], [xb, rc, y5 - 0.55], 1.56, 0.9, 'escTruss', 3);
      kit.box(C, xb - 0.2, x1, q0, q1, y5 - 1.0, y5 - 0.04, 'escTruss', 5);
      // floor plates
      kit.box(C, x0, xa + 0.1, q0 + 0.26, q1 - 0.26, y3 + 0.001, y3 + 0.012, 'escSteel', 3);
      kit.box(C, xb - 0.1, x1, q0 + 0.26, q1 - 0.26, y5 - 0.04, y5 + 0.004, 'escSteel', 5);
      // yellow comb plates
      kit.box(C, xa - 0.08, xa + 0.1, rc - 0.5, rc + 0.5, y3 + 0.012, y3 + 0.016, 'laneYellow', 3);
      kit.box(C, xb - 0.1, xb + 0.08, rc - 0.5, rc + 0.5, y5 + 0.004, y5 + 0.008, 'laneYellow', 5);
      // steps on the incline (1.0 m wide, 0.4 m deep) and two flat steps at each end
      const nSteps = Math.round(e.run / 0.4);
      for (let k = 0; k < nSteps; k++) {
        const u0 = xa + (k * e.run) / nSteps;
        const u1 = xa + ((k + 1) * e.run) / nSteps;
        const yt = y3 + ((k + 1) * e.rise) / nSteps;
        kit.box(C, u0, u1, rc - 0.5, rc + 0.5, yt - e.rise / nSteps - 0.02, yt, 'escStep', 3);
      }
      // skirt / inner decking and outer decking either side of the steps
      for (const sd of [-1, 1]) {
        const qd = rc + sd * 0.64;
        kit.beam(C, [xa, qd, y3 + 0.18], [xb, qd, y5 + 0.18], 0.27, 0.42, 'escSteel', 3);
        kit.box(C, x0, xa, qd - 0.135, qd + 0.135, y3, y3 + 0.4, 'escSteel', 3);
        kit.box(C, xb, x1, qd - 0.135, qd + 0.135, y5 - 0.02, y5 + 0.4, 'escSteel', 5);
        // glass balustrade
        kit.beam(C, [xa, qd, y3 + 0.72], [xb, qd, y5 + 0.72], 0.014, 0.66, 'escGlass', 3);
        kit.box(C, x0 + 0.25, xa, qd - 0.007, qd + 0.007, y3 + 0.4, y3 + 1.0, 'escGlass', 3);
        kit.box(C, xb, x1 - 0.25, qd - 0.007, qd + 0.007, y5 + 0.4, y5 + 1.0, 'escGlass', 5);
        // moving handrail with its newel ends
        kit.beam(C, [xa, qd, y3 + 1.04], [xb, qd, y5 + 1.04], 0.09, 0.06, 'escRubber', 3);
        kit.box(C, x0 + 0.18, xa, qd - 0.045, qd + 0.045, y3 + 1.0, y3 + 1.06, 'escRubber', 3);
        kit.box(C, x0 + 0.1, x0 + 0.24, qd - 0.045, qd + 0.045, y3 + 0.4, y3 + 1.06, 'escRubber', 3);
        kit.box(C, xb, x1 - 0.18, qd - 0.045, qd + 0.045, y5 + 1.0, y5 + 1.06, 'escRubber', 5);
        kit.box(C, x1 - 0.24, x1 - 0.1, qd - 0.045, qd + 0.045, y5 + 0.4, y5 + 1.06, 'escRubber', 5);
        // blue light strip under the handrail (Fujitec: under-handrail lighting)
        kit.beam(C, [xa, qd, y3 + 0.985], [xb, qd, y5 + 0.985], 0.05, 0.02, 'escLight', 3);
        kit.box(C, x0 + 0.28, xa, qd - 0.025, qd + 0.025, y3 + 0.975, y3 + 0.995, 'escLight', 3);
        kit.box(C, xb, x1 - 0.28, qd - 0.025, qd + 0.025, y5 + 0.975, y5 + 0.995, 'escLight', 5);
      }
      void i;
    }
  }
}

function lifts(kit) {
  const top = { wing: Y[8] - 0.3, flank: Y[8] + 2.0 };
  const served = { wing: [1, 2, 3, 5, 6, 7], flank: [1, 3, 5, 6, 7] };
  for (const l of liftShafts()) liftCore(kit, l.f, l.p0, l.p1, l.q0, l.q1, top[l.kind], served[l.kind], l.kind);
  // backstage lift (goods / artists), doors toward the corridor (+z)
  const lb = CIRC.liftBackstage;
  liftCore(kit, frameX(1), lb.x[0], lb.x[1], lb.z[0], lb.z[1], Y[9] + 2.2, [1, ...BS.levels], 'backstage');
}

function liftCore(kit, f, p0, p1, q0, q1, yTop, levels, kind) {
  const ys = levels.map((lv) => (lv === 1 ? 0.02 : LEVEL_Y[lv]));
  levels.forEach((lv, i) => {
    const yb = ys[i];
    const yt = i < levels.length - 1 ? ys[i + 1] : yTop;
    const m = kind === 'wing' ? wallMat(lv <= 2 ? 1 : lv) : 'concreteCore';
    // on LEVEL 7 the wing lifts open toward the concourse outside the block band
    const front = (kind === 'wing' && lv === 7) || kind !== 'wing' ? 'q1' : 'q0';
    const door = { at: (p1 - p0) / 2, w: 1.2, h: 2.15 };
    kit.wall(f, p0, q0 + 0.1, p1, q0 + 0.1, yb, yt, 0.2, m, lv, front === 'q0' ? [door] : []);
    kit.wall(f, p0, q1 - 0.1, p1, q1 - 0.1, yb, yt, 0.2, m, lv, front === 'q1' ? [door] : []);
    kit.wall(f, p0 + 0.1, q0 + 0.2, p0 + 0.1, q1 - 0.2, yb, yt, 0.2, m, lv);
    kit.wall(f, p1 - 0.1, q0 + 0.2, p1 - 0.1, q1 - 0.2, yb, yt, 0.2, m, lv);
    const qd = front === 'q0' ? q0 + 0.1 : q1 - 0.1;
    const dq = front === 'q0' ? -1 : 1;
    const pc = (p0 + p1) / 2;
    // stainless frame, two door panels, call button and indicator
    kit.box(f, pc - 0.68, pc - 0.6, qd - 0.12, qd + 0.12, yb, yb + 2.23, 'liftDoor', lv);
    kit.box(f, pc + 0.6, pc + 0.68, qd - 0.12, qd + 0.12, yb, yb + 2.23, 'liftDoor', lv);
    kit.box(f, pc - 0.68, pc + 0.68, qd - 0.12, qd + 0.12, yb + 2.15, yb + 2.23, 'liftDoor', lv);
    kit.box(f, pc - 0.6, pc - 0.004, qd - 0.02, qd + 0.02, yb, yb + 2.15, 'liftDoor', lv);
    kit.box(f, pc + 0.004, pc + 0.6, qd - 0.02, qd + 0.02, yb, yb + 2.15, 'liftDoor', lv);
    kit.box(f, pc + 0.86, pc + 0.94, qd + dq * 0.1, qd + dq * 0.115, yb + 1.0, yb + 1.25, 'liftDoor', lv);
    kit.box(f, pc + 0.88, pc + 0.92, qd + dq * 0.115, qd + dq * 0.12, yb + 1.14, yb + 1.18, 'liftCall', lv);
    kit.box(f, pc - 0.15, pc + 0.15, qd + dq * 0.1, qd + dq * 0.115, yb + 2.3, yb + 2.4, 'liftCall', lv);
    if (kind === 'wing' && lv !== 2) signF(kit, f, lv, pc - 1.05, qd + dq * 0.1, yb + 1.7, 0, dq, 0.5, 0.5, { kind: 'picto', icon: 'lift' });
  });
  void levelAt;
}

function backstageStairs(kit) {
  // dog-leg stairs at both ends of the backstage block, serving the ground and all five floors
  const ys = [0.02, ...BS.levels.map((lv) => LEVEL_Y[lv])];
  const lvs = [1, ...BS.levels];
  for (const s of [1, -1]) {
    const f = frameX(s);
    const [p0, p1] = BS_STAIR.x;
    const [q0, q1] = BS_STAIR.z;
    const qm = (q0 + q1) / 2;
    const going = 0.26;
    for (let i = 0; i < lvs.length; i++) {
      const lv = lvs[i];
      const yb = ys[i];
      const yt = i < lvs.length - 1 ? ys[i + 1] : ys[i] + 2.2;
      const door = { at: 0.2 + 0.7, w: 1.0, h: 2.1 };
      kit.wall(f, p0, q1 - 0.1, p1, q1 - 0.1, yb, yt, 0.2, 'backstageWall', lv, [door]);
      kit.wall(f, p0, q0 + 0.1, p1, q0 + 0.1, yb, yt, 0.2, 'backstageWall', lv);
      kit.wall(f, p0 + 0.1, q0 + 0.2, p0 + 0.1, q1 - 0.2, yb, yt, 0.2, 'backstageWall', lv);
      kit.wall(f, p1 - 0.1, q0 + 0.2, p1 - 0.1, q1 - 0.2, yb, yt, 0.2, 'backstageWall', lv);
      kit.box(f, p0 + door.at - 0.5, p0 + door.at + 0.5, q1 - 0.13, q1 - 0.07, yb, yb + 2.1, 'doorLight', lv);
      kit.box(f, p0 + 0.2, p0 + 1.6, q0 + 0.2, q1 - 0.2, yb - 0.22, yb, 'stairConcrete', lv);
      if (i === lvs.length - 1) break;
      const rise = yt - yb;
      const n = Math.round(rise / 2 / 0.17);
      const h = rise / (2 * n);
      const run = (n - 1) * going;
      const pa = p0 + 1.6;
      const pb = Math.min(pa + run, p1 - 1.5);
      const g = (pb - pa) / (n - 1);
      kit.flight(f, pa, (qm + q1 - 0.2) / 2, yb, 1, 0, n, h, g, 1.4, 'stairConcrete', lv, { waist: 0.2, yFloor: i === 0 ? yb : null });
      kit.box(f, pb, p1 - 0.2, q0 + 0.2, q1 - 0.2, yb + n * h - 0.2, yb + n * h, 'stairConcrete', lv);
      kit.flight(f, pb, (qm + q0 + 0.2) / 2, yb + n * h, -1, 0, n, h, g, 1.4, 'stairConcrete', lv, { waist: 0.2 });
      kit.rail(f, [[pa, qm, yb], [pb, qm, yb + n * h]], lv, { infill: 'bars', spacing: 1.2, height: 1.0 });
      kit.rail(f, [[pb, qm, yb + n * h], [pa, qm, yt]], lv, { infill: 'bars', spacing: 1.2, height: 1.0 });
    }
  }
}

export default function buildCirculation(kit) {
  grandStair(kit);
  stairs13(kit);
  cores357(kit);
  escalators(kit);
  lifts(kit);
  backstageStairs(kit);
  void frameW;
  void RC0;
}

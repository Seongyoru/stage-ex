// Arena Bar 7 (LEVEL 7, +23.47): 120 seats in the glass box, skyline view.
// Official photos (shop guide main / 01 / 03) and the Oricon dusk photo: a long island counter
// bowed toward the concourse, front of champagne-gold fan mosaic in panels of about 0.95 m each
// up-lit from the floor, black polished stone top on a black plinth with LED dots, gold
// "Arena Bar 7" letters and a ribbed-glass block lamp on its house-right end; behind it a
// back bar with under-lit bottle steps, the two middle colonnade columns clad in bevelled
// art-deco mirror with brass open shelving on both sides, two brass chandeliers with ribbed-
// glass lanterns; a dropped oval ceiling with a cool cove along its edge; round standing
// tables with gold ribbed edges, dark shell stools, low brown leather chairs along the glass;
// dark polished concrete floor; slim black posts on the line to the concourse.
// The LEVEL 7 concourse of arena/structure passes between its gate wall and that post line;
// kiosk 7B faces the bar across it.
import * as THREE from 'three';
import { bx, bxOn, cyl, rod, M4, prism, rectRing, strokeText, tf, sweep, arcPath, joinPaths, pathSampler, glowFans, faceDir, TAU } from './kit.js';
import { M, glowMaterial } from './mats.js';
import { Y, FIN, BOX, BOX_COLUMNS_X, COLUMN_Z, COLUMN_HALF, BAR7 } from './layout.js';
import * as F from './furniture.js';

const LEVEL = 7;
const BOTTLE_TINTS = ['#7A4A1C', '#5C3312', '#2F5A36', '#C8D4D0', '#8A1F1A', '#1E2E4A', '#B98A2E', '#3A2A1E'];

/** Front line of the counter: house-left return → fillet → bowed front → fillet → house-right return. */
function counterPath() {
  const R = BAR7.counterR;
  const zc = BAR7.counterZ0 + R;
  const phi = Math.asin(BAR7.counterHalf / R);
  const r = 0.8;
  const half = arcPath(0, zc, R, 1.5 * Math.PI, 1.5 * Math.PI + phi, 10);
  const end = half[half.length - 1];
  const cx = end[0] - r * Math.sin(phi);
  const cz = end[1] + r * Math.cos(phi);
  const fillet = [];
  for (let i = 1; i <= 6; i++) {
    const th = phi + ((Math.PI / 2 - phi) * i) / 6;
    fillet.push([cx + r * Math.sin(th), cz - r * Math.cos(th)]);
  }
  const right = joinPaths(half, fillet, [[cx + r, BAR7.returnZ]]);
  const left = right.slice(1).map(([x, z]) => [-x, z]).reverse();
  return joinPaths(left, right);
}

export function buildArenaBar7(kit, ctx) {
  const y0 = Y.L7;
  const yf = y0 + FIN;
  const hi = ctx.quality !== 'low';
  const zWin = BOX.zGlassIn;
  const xIn = BOX.xGlassIn;

  // --- floor finish: dark polished concrete ---------------------------------------------------
  kit.add(LEVEL, M('venues.bar7Floor'), prism(rectRing(-xIn, BAR7.zEdge - 0.1, xIn, zWin), y0 + 0.004, yf, { bottom: false }));

  // --- island counter ----------------------------------------------------------------------------
  const path = counterPath();
  const up = (pts) => pts.map(([d, y]) => [d, yf + y]);
  kit.add(LEVEL, M('venues.bar7Mosaic'), sweep(up([[0, 0.12], [0, 1.02], [-0.04, 1.02], [-0.04, 0.12]]), path, { skip: [1, 2, 3] }));
  kit.add(LEVEL, M('venues.bar7WorkCounter'), sweep(up([[-0.04, 0.12], [-0.04, 1.02], [-0.72, 1.02], [-0.72, 0.12]]), path, { skip: [0, 1, 3] }));
  kit.add(LEVEL, M('venues.bar7Plinth'), sweep(up([[-0.06, 0], [-0.06, 0.12], [-0.68, 0.12], [-0.68, 0]]), path, { skip: [1, 3] }));
  kit.add(LEVEL, M('venues.blackStone'), sweep(up([[0.05, 1.02], [0.05, 1.07], [-0.74, 1.07], [-0.74, 1.02]]), path));
  // inner work counter (sinks / ice wells level) along the bowed part only
  const R = BAR7.counterR;
  const zc = BAR7.counterZ0 + R;
  const phi2 = Math.asin((BAR7.counterHalf - 0.9) / R);
  const inner = arcPath(0, zc, R, 1.5 * Math.PI - phi2, 1.5 * Math.PI + phi2, 16);
  kit.add(LEVEL, M('venues.bar7WorkCounter'), sweep(up([[-0.74, 0], [-0.74, 0.86], [-1.26, 0.86], [-1.26, 0]]), inner, { skip: [3] }));

  // gold beer towers on the work counter, three at each end
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const a = 1.5 * Math.PI + s * (phi2 - 0.012 - i * 0.012);
      const px = (R - 1.0) * Math.cos(a);
      const pz = zc + (R - 1.0) * Math.sin(a);
      kit.add(LEVEL, M('venues.goldPolished'), cyl(0.035, 0.42, px, yf + 0.86, pz, 8), bx(0.07, 0.06, 0.16, px, yf + 1.3, pz - 0.05));
    }
  }

  // panel joints (brass), floor uplights, LED dots in the plinth, light pools on the mosaic
  const sm = pathSampler(path);
  const nPanels = Math.round(sm.length / 0.95);
  const fans = [];
  for (let i = 0; i <= nPanels; i++) {
    const { p, left } = sm.at((i / nPanels) * sm.length);
    kit.add(LEVEL, M('venues.brass'), bxOn(0.014, 0.9, 0.014, p[0] + left[0] * 0.004, yf + 0.12, p[1] + left[1] * 0.004));
    kit.add(LEVEL, M('venues.bar7LedDot'), bx(0.02, 0.02, 0.02, p[0] - left[0] * 0.055, yf + 0.06, p[1] - left[1] * 0.055));
    if (i < nPanels) {
      const c = sm.at(((i + 0.5) / nPanels) * sm.length);
      kit.add(LEVEL, M('venues.bar7LedDot'), cyl(0.035, 0.012, c.p[0] + c.left[0] * 0.14, yf, c.p[1] + c.left[1] * 0.14, 8));
      kit.add(LEVEL, M('venues.blackSteel'), cyl(0.05, 0.008, c.p[0] + c.left[0] * 0.14, yf, c.p[1] + c.left[1] * 0.14, 8));
      fans.push({ p: [c.p[0], yf + 0.12, c.p[1]], u: [c.t[0] * 0.4, 0, c.t[1] * 0.4], v: [0, 0.86, 0], n: [c.left[0] * 0.006, 0, c.left[1] * 0.006] });
    }
  }
  kit.addMesh(LEVEL, 'bar7-uplight-pools', glowFans(fans, '#FFCF86'), glowMaterial());

  // lettering and block lamp on the house-right end
  const endX = path[path.length - 1][0];
  const zEndMid = (BAR7.returnZ + path[path.length - 2][1]) / 2;
  kit.add(LEVEL, M('venues.goldPolished'), tf(strokeText('Arena Bar 7', { height: 0.15, weight: 0.027, depth: 0.03 }).geometry, { ry: Math.PI / 2, x: endX - 0.02, y: yf + 1.075, z: zEndMid + 0.08 }));
  const lamp = [endX - 0.45, path[path.length - 2][1] - 0.32];
  kit.add(LEVEL, M('venues.chandelierGlass'), bxOn(0.42, 0.78, 0.42, lamp[0], yf + 1.11, lamp[1]));
  kit.add(LEVEL, M('venues.brass'), bxOn(0.46, 0.04, 0.46, lamp[0], yf + 1.07, lamp[1]), bxOn(0.46, 0.04, 0.46, lamp[0], yf + 1.89, lamp[1]));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) kit.add(LEVEL, M('venues.brass'), bxOn(0.025, 0.78, 0.025, lamp[0] + sx * 0.215, yf + 1.11, lamp[1] + sz * 0.215));

  // --- back bar ------------------------------------------------------------------------------------
  const zBack = 93.35;
  kit.add(LEVEL, M('venues.bar7WorkCounter'), bxOn(6.4, 0.9, 0.6, 0, yf, zBack));
  kit.add(LEVEL, M('venues.blackStone'), bx(6.5, 0.04, 0.68, 0, yf + 0.92, zBack));
  const bottles = [];
  const tints = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 3; k++) {
    const ys = yf + 0.94 + 0.11 * k;
    const zs = zBack - 0.2 + 0.2 * k;
    kit.add(LEVEL, M('venues.bar7BottleRiser'), bx(3.6, 0.11 * (k + 1), 0.2, 0, yf + 0.94 + (0.11 * (k + 1)) / 2, zs));
    for (let i = 0; i < 18 && hi; i++) {
      bottles.push(M4(-1.7 + i * 0.2, ys + 0.11, zs, rnd() * TAU, 0.9 + rnd() * 0.25));
      tints.push(new THREE.Color(BOTTLE_TINTS[Math.floor(rnd() * BOTTLE_TINTS.length)]));
    }
  }

  // mirror-clad art-deco columns (the two middle colonnade columns) and brass open shelving
  const yCeil = yf + BAR7.bulkhead;
  const cladHalf = COLUMN_HALF + 0.06;
  for (const cx of BOX_COLUMNS_X.filter((x) => Math.abs(x) < 6)) {
    const t = 0.028;
    const h = BAR7.bulkhead - 0.002;
    const mir = M('venues.bar7MirrorDeco');
    kit.add(LEVEL, mir, bxOn(2 * cladHalf, h, t, cx, yf, COLUMN_Z - cladHalf + t / 2), bxOn(2 * cladHalf, h, t, cx, yf, COLUMN_Z + cladHalf - t / 2));
    kit.add(LEVEL, mir, bxOn(t, h, 2 * cladHalf - 2 * t, cx - cladHalf + t / 2, yf, COLUMN_Z), bxOn(t, h, 2 * cladHalf - 2 * t, cx + cladHalf - t / 2, yf, COLUMN_Z));
    const br = M('venues.brass');
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) kit.add(LEVEL, br, bxOn(0.03, h, 0.03, cx + sx * (cladHalf + 0.004), yf, COLUMN_Z + sz * (cladHalf + 0.004)));
    for (const yy of [0.0, 0.9, h - 0.06]) {
      kit.add(LEVEL, br, bx(2 * cladHalf + 0.02, 0.06, 0.012, cx, yf + yy + 0.03, COLUMN_Z - cladHalf - 0.006), bx(0.012, 0.06, 2 * cladHalf + 0.02, cx - cladHalf - 0.006, yf + yy + 0.03, COLUMN_Z), bx(0.012, 0.06, 2 * cladHalf + 0.02, cx + cladHalf + 0.006, yf + yy + 0.03, COLUMN_Z));
    }
    // shelving units on both sides of the column
    for (const sx of [-1, 1]) {
      const ux = cx + sx * (cladHalf + 0.95);
      const uz = COLUMN_Z - 0.38;
      const w = 1.6;
      const d = 0.42;
      const hh = 2.25;
      for (const px of [-1, 1]) for (const pz of [-1, 1]) kit.add(LEVEL, br, bxOn(0.03, hh, 0.03, ux + px * (w / 2 - 0.015), yf, uz + pz * (d / 2 - 0.015)));
      kit.add(LEVEL, br, bx(w, 0.03, 0.03, ux, yf + hh - 0.015, uz - d / 2 + 0.015), bx(w, 0.03, 0.03, ux, yf + hh - 0.015, uz + d / 2 - 0.015));
      for (const sy of [0.45, 0.95, 1.45, 1.95]) {
        kit.add(LEVEL, M('venues.blackStone'), bx(w - 0.06, 0.016, d - 0.06, ux, yf + sy, uz));
        kit.add(LEVEL, br, bx(w, 0.022, 0.022, ux, yf + sy - 0.012, uz - d / 2 + 0.015), bx(w, 0.022, 0.022, ux, yf + sy - 0.012, uz + d / 2 - 0.015));
        if (sy > 0.5 && hi) {
          for (let i = 0; i < 7; i++) {
            bottles.push(M4(ux - 0.6 + i * 0.2, yf + sy + 0.008, uz + (rnd() - 0.5) * 0.12, rnd() * TAU, 0.85 + rnd() * 0.25));
            tints.push(new THREE.Color(BOTTLE_TINTS[Math.floor(rnd() * BOTTLE_TINTS.length)]));
          }
        }
      }
    }
  }
  kit.instance(LEVEL, 'bar7-bottle', F.bottle(), bottles, { colors: tints });

  // chandeliers over the bar (official frontal photo: two, between the mirror columns)
  kit.instance(LEVEL, 'bar7-chandelier', F.chandelierBar7(), [M4(-2.6, yCeil, 92.2, 0.2), M4(2.6, yCeil, 92.2, -0.5)], { prop: 'chandelier_lantern' });

  // --- ceiling: flat dark ceiling, dropped oval bulkhead with a cool cove, pin downlights -----------
  const ceil = M('venues.bar7Ceiling');
  kit.add(LEVEL, ceil, bx(2 * xIn, 0.06, zWin - BAR7.zEdge + 0.1, 0, yf + BAR7.ceiling + 0.03, (zWin + BAR7.zEdge - 0.1) / 2));
  // fascias that close the ceiling void toward the concourse and at the window head
  kit.add(LEVEL, ceil, bx(2 * xIn, 0.5, 0.06, 0, yf + BAR7.ceiling + 0.31, BAR7.zEdge - 0.07));
  kit.add(LEVEL, ceil, bx(2 * xIn, 1.05, 0.06, 0, yf + BAR7.ceiling + 0.585, zWin - 0.03));
  const oc = { x: 0, z: BAR7.zEdge + 4.3, a: 15.5, b: 4.4 };
  const oval = [];
  for (let i = 0; i < 56; i++) {
    const t = (i / 56) * TAU;
    const z = Math.min(oc.z + oc.b * Math.sin(t), zWin);
    const p = [oc.x + oc.a * Math.cos(t), z];
    const last = oval[oval.length - 1];
    if (!last || Math.hypot(last[0] - p[0], last[1] - p[1]) > 0.05) oval.push(p);
  }
  kit.add(LEVEL, ceil, prism(oval, yf + BAR7.bulkhead, yf + BAR7.ceiling, { top: false }));
  const tLim = Math.asin((zWin - 0.1 - oc.z) / oc.b);
  const covePath = [];
  for (let i = 0; i <= 48; i++) {
    const t = Math.PI - tLim + ((Math.PI + 2 * tLim) * i) / 48;
    covePath.push([oc.x + oc.a * Math.cos(t), oc.z + oc.b * Math.sin(t)]);
  }
  kit.add(LEVEL, M('venues.ledCool'), sweep([[0.004, yf + BAR7.bulkhead + 0.05], [0.03, yf + BAR7.bulkhead + 0.05], [0.03, yf + BAR7.ceiling - 0.04], [0.004, yf + BAR7.ceiling - 0.04]], covePath));
  kit.add(LEVEL, M('venues.ledCool'), sweep([[-0.02, yf + BAR7.bulkhead - 0.03], [0.1, yf + BAR7.bulkhead - 0.03], [0.1, yf + BAR7.bulkhead], [-0.02, yf + BAR7.bulkhead]], covePath));
  const lens = M('venues.spotLens');
  for (let i = 0; i < 16; i++) {
    const t = (i / 16) * TAU + 0.2;
    const x = oc.x + (oc.a - 1.6) * Math.cos(t) * (i % 2 ? 1 : 0.55);
    const z = oc.z + (oc.b - 1.3) * Math.sin(t) * (i % 2 ? 1 : 0.55);
    if (z < zWin - 0.6) kit.add(LEVEL, lens, cyl(0.045, 0.006, x, yf + BAR7.bulkhead - 0.006, z, 8));
  }
  for (const s of [-1, 1]) for (const x of [17.5, 19.5, 21.5]) for (const z of [BAR7.zEdge + 0.9, 93.6]) kit.add(LEVEL, lens, cyl(0.045, 0.006, s * x, yf + BAR7.ceiling - 0.006, z, 8));
  // slot diffusers in the flat ceiling over the seating zones
  for (const s of [-1, 1]) for (const z of [BAR7.zEdge + 1.6, BAR7.zEdge + 3.6]) kit.add(LEVEL, M('venues.trackBlack'), bx(1.4, 0.008, 0.5, s * 19.6, yf + BAR7.ceiling - 0.004, z));

  // --- line of slim black posts toward the concourse ------------------------------------------------
  for (let x = -19.5; x <= 19.51; x += 3) kit.add(LEVEL, M('venues.blackSteel'), cyl(0.07, BAR7.ceiling, x, yf, BAR7.zEdge, 10));
  kit.add(LEVEL, M('venues.blackSteel'), bx(2 * xIn, 0.1, 0.16, 0, yf + BAR7.ceiling - 0.05, BAR7.zEdge - 0.11));

  // --- furniture: 120 seats ----------------------------------------------------------------------------
  const tables = [];
  const stools = [];
  const lows = [];
  const chairs = [];
  for (const s of [-1, 1]) {
    const rows = [
      [BAR7.zEdge + 0.95, [10.3, 13.1, 15.9, 18.7, 21.3]],
      [BAR7.zEdge + 2.6, [11.7, 14.5, 17.3, 20.1]],
      [BAR7.zEdge + 4.25, [10.3, 13.1, 15.9, 18.7]],
    ];
    rows.forEach(([z, xs], r) => {
      xs.forEach((x, i) => {
        tables.push(M4(s * x, yf, z, 0));
        const n = r === 1 && i === 0 ? 4 : 3;
        for (let k = 0; k < n; k++) {
          const t = (k / n) * TAU + 0.5 + r * 0.7 + i;
          stools.push(M4(s * x + 0.62 * Math.cos(t), yf, z + 0.62 * Math.sin(t), faceDir(-Math.cos(t), -Math.sin(t))));
        }
      });
    });
    for (const x of [9.0, 11.0, 14.5, 16.7, 18.9]) {
      const z = COLUMN_Z - 0.9;
      lows.push(M4(s * x, yf, z, 0));
      for (let k = 0; k < 4; k++) {
        const t = [0.42, Math.PI - 0.42, Math.PI + 0.42, -0.42][k];
        chairs.push(M4(s * x + 0.72 * Math.cos(t), yf, z + 0.72 * Math.sin(t), faceDir(-Math.cos(t), -Math.sin(t))));
      }
    }
  }
  kit.instance(LEVEL, 'bar7-table', F.roundBarTable(), tables, { prop: 'bar_table' });
  kit.instance(LEVEL, 'bar7-stool', F.shellChair({ seatH: 0.76, shell: 'venues.shellLeatherGrey' }), stools, { prop: 'bar_stool' });
  kit.instance(LEVEL, 'bar7-lowtable', F.lowRoundTable(), lows);
  kit.instance(LEVEL, 'bar7-lowchair', F.shellChair({ seatH: 0.42, shell: 'venues.lowChairLeather', r: 0.27, backH: 0.34, footrest: false }), chairs);

  return { seats: stools.length + chairs.length };
}

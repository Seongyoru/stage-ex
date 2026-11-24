// VIP K-Arena lounge (LEVEL 6, +18.07) — art deco by ILYA, "40 m wide", about 100 seats.
// Official photo (img_facility_vip02), Oricon bar photo, Travel Watch 026 / 027:
//   * full-height windows with the fair-faced colonnade columns on the facade side;
//   * red carpet with gold starbursts under groups of burgundy leather barrel chairs on gold
//     frames round black granite tables, tan wing chairs, a grand piano at the window;
//   * an aisle of black marble with white stripe inlays along the hall side, with a red
//     channel-tufted velvet banquette on a macassar wall (ribbed-glass sconces, gold cage tables);
//   * a faceted zig-zag gold-leaf valance hanging along the aisle under a mirrored ceiling,
//     white stepped tray ceilings with lantern pendants over the carpet;
//   * on the axis an oval island bar with a gold mosaic front and black stone top under a
//     five-tier glass-ring chandelier, four gold fretwork screens in black frames;
//   * behind the bar the entrance feature: back-lit gold-leaf panel, navy "VIP K-Arena Lounge"
//     sign, black granite plinths with a gold sculpture, dark marble portal piers.
// The hall-side wall of the lounge stands just outside the threshold column row (z = 85.76,
// built by arena/structure), so those casings read as pilasters from the VIP corridor; the two
// middle ones are swallowed by the portal piers.
import * as THREE from 'three';
import { bx, bxOn, cyl, rod, M4, prism, rectRing, strokeText, tf, sweep, arcPath, joinPaths, pathSampler, ellipseRing, faceDir, metricUV, TAU } from './kit.js';
import { M } from './mats.js';
import { Y, FIN, BOX, ROW_Z, VIP_LOUNGE } from './layout.js';
import * as F from './furniture.js';

const LEVEL = 6;

/** Thin strokes of a polyline in the local XY plane (logo outlines). */
function polyline2D(pts, weight, depth, closed = true) {
  const out = [];
  const n = pts.length;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % n];
    const g = new THREE.BoxGeometry(Math.hypot(x1 - x0, y1 - y0) + weight, weight, depth);
    g.rotateZ(Math.atan2(y1 - y0, x1 - x0));
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, 0);
    out.push(metricUV(g));
  }
  return out;
}

/** Folded-plate valance along a plan polyline: accordion in plan, zig-zag lower edge. */
function valance(points, yTop, pitch = 0.62) {
  const sm = pathSampler(points);
  const n = Math.max(2, Math.round(sm.length / pitch));
  const nodes = [];
  for (let i = 0; i <= n; i++) {
    const { p, left } = sm.at((i / n) * sm.length);
    const k = i % 2 ? 0.2 : -0.2;
    nodes.push({ x: p[0] + left[0] * k, z: p[1] + left[1] * k, yb: yTop - (i % 2 ? 1.25 : 0.8) });
  }
  const pos = [];
  for (let i = 0; i < n; i++) {
    const a = nodes[i];
    const b = nodes[i + 1];
    pos.push(a.x, yTop, a.z, a.x, a.yb, a.z, b.x, b.yb, b.z, a.x, yTop, a.z, b.x, b.yb, b.z, b.x, yTop, b.z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return metricUV(g);
}

export function buildVipLounge(kit, ctx) {
  const y0 = Y.L6;
  const yf = y0 + FIN;
  const hi = ctx.quality !== 'low';
  const { hw, zWall, zCarpet, bar, bayHalf, zBay } = VIP_LOUNGE;
  const zWin = BOX.zGlassIn;
  const yCeil = yf + VIP_LOUNGE.ceiling;
  const yTray = yf + VIP_LOUNGE.tray;
  const zBack = zWall - 0.1; // marble runs under the hall-side wall
  const zEnd = zWall + 1.5; // where the curved wall meets the end walls / the portal

  // --- floors ------------------------------------------------------------------------------------
  kit.add(LEVEL, M('venues.vipCarpetRed'), prism([[-hw, zCarpet], [-bayHalf, zCarpet], [-bayHalf, zBay], [bayHalf, zBay], [bayHalf, zCarpet], [hw, zCarpet], [hw, zWin], [-hw, zWin]], y0 + 0.004, yf, { bottom: false }));
  // marble aisle with white stripe inlays running across it (no overlapping faces: the aisle is
  // cut into black and white strips)
  const bands = [];
  for (let k = -9; k <= 9; k++) {
    bands.push([k * 2.4 - 0.15, k * 2.4 + 0.15]);
    if (k < 9) bands.push([k * 2.4 + 1.2 - 0.04, k * 2.4 + 1.2 + 0.04]);
  }
  const cuts = new Set([-hw, hw, -bayHalf, bayHalf]);
  for (const [a, b] of bands) for (const v of [a, b]) if (Math.abs(v) < hw) cuts.add(+v.toFixed(3));
  const xs = [...cuts].sort((a, b) => a - b);
  for (let i = 0; i < xs.length - 1; i++) {
    const xa = xs[i];
    const xb = xs[i + 1];
    const mid = (xa + xb) / 2;
    const white = bands.some(([a, b]) => mid > a && mid < b);
    const z1 = Math.abs(mid) < bayHalf ? zBay : zCarpet;
    kit.add(LEVEL, M(white ? 'venues.vipMarbleWhite' : 'venues.vipMarbleBlack'), prism(rectRing(xa, zBack, xb, z1), y0 + 0.004, yf, { bottom: false }));
  }
  // entrance lobby (black marble) and the corridor to the VIP BOX rooms (navy carpet)
  // (the carpet stops short of the stair cores of arena/structure: |x| > 22.6, z > 81)
  const zC = VIP_LOUNGE.zCorridor;
  const zLobby0 = zBack - 3.7;
  kit.add(LEVEL, M('venues.vipMarbleBlack'), prism(rectRing(-6.8, zLobby0, 6.8, zBack), y0 + 0.004, yf, { bottom: false }));
  kit.add(
    LEVEL,
    M('venues.vipCorridorCarpet'),
    prism([[-30.2, zC], [30.2, zC], [30.2, 80.9], [22.4, 80.9], [22.4, zBack], [6.8, zBack], [6.8, zLobby0], [-6.8, zLobby0], [-6.8, zBack], [-22.4, zBack], [-22.4, 80.9], [-30.2, 80.9]], y0 + 0.004, yf, { bottom: false }),
  );

  // --- hall-side wall (macassar, both faces) with the banquette ---------------------------------------
  const wallPathR = joinPaths(arcPath(6.9, zEnd, 1.5, Math.PI, 1.5 * Math.PI, 6), arcPath(18.8, zEnd, 1.5, 1.5 * Math.PI, 2 * Math.PI, 6));
  const wallPathL = wallPathR.map(([x, z]) => [-x, z]).reverse();
  const H = Y.L7 - 0.38 - yf; // walls run up to the structural soffit (the ceilings hang lower)
  const mac = M('venues.vipMacassar');
  const velvet = M('venues.vipVelvetRed');
  const cageTables = [];
  for (const path of [wallPathL, wallPathR]) {
    kit.add(LEVEL, mac, sweep([[0, yf], [0.24, yf], [0.24, yf + H], [0, yf + H]], path));
    // banquette: seat + high back, on a dark recessed base
    kit.add(LEVEL, velvet, sweep([[0, 0.05], [0, 1.36], [-0.1, 1.4], [-0.18, 1.32], [-0.2, 0.5], [-0.68, 0.46], [-0.74, 0.4], [-0.74, 0.05]].map(([d, y]) => [d - 0.005, yf + y]), path));
    kit.add(LEVEL, M('venues.vipWoodDark'), sweep([[-0.06, 0], [-0.06, 0.05], [-0.68, 0.05], [-0.68, 0]].map(([d, y]) => [d, yf + y]), path, { skip: [1, 3] }));
    const sm = pathSampler(path);
    // channel tufting: vertical ribs on the back
    if (hi) {
      const nRib = Math.round(sm.length / 0.3);
      for (let i = 0; i < nRib; i++) {
        const { p, left } = sm.at(((i + 0.5) / nRib) * sm.length);
        kit.add(LEVEL, velvet, cyl(0.07, 0.8, p[0] - left[0] * 0.2, yf + 0.5, p[1] - left[1] * 0.2, 6));
      }
    }
    // ribbed-glass sconces on the wall above the banquette
    const nSc = Math.round(sm.length / 3.4);
    for (let i = 0; i < nSc; i++) {
      const { p, left, t } = sm.at(((i + 0.5) / nSc) * sm.length);
      const ry = faceDir(-left[0], -left[1]);
      kit.add(LEVEL, M('venues.brass'), tf(bx(0.2, 0.5, 0.02), { ry, x: p[0] - left[0] * 0.012, y: yf + 2.0, z: p[1] - left[1] * 0.012 }));
      kit.add(LEVEL, M('venues.vipSconce'), tf(bx(0.14, 0.4, 0.08), { ry, x: p[0] - left[0] * 0.06, y: yf + 2.0, z: p[1] - left[1] * 0.06 }));
      void t;
    }
    // gold cage tables in front of the banquette
    const nT = Math.round(sm.length / 2.7);
    for (let i = 0; i < nT; i++) {
      const { p, left } = sm.at(((i + 0.5) / nT) * sm.length);
      cageTables.push(M4(p[0] - left[0] * 1.18, yf, p[1] - left[1] * 1.18, i));
    }
  }
  // end walls
  for (const s of [-1, 1]) {
    kit.add(LEVEL, mac, bxOn(0.2, H, zWin + 0.06 - zEnd, s * (hw + 0.1), yf, (zWin + 0.06 + zEnd) / 2));
    // gold-leaf chevron panel and sconces on the end wall
    kit.add(LEVEL, M('venues.vipGoldLeaf'), bx(0.02, 1.9, 4.4, s * (hw - 0.012), yf + 2.2, (zEnd + zWin) / 2 + 0.3));
    for (const z of [zEnd + 0.9, zWin - 0.5]) kit.add(LEVEL, M('venues.vipSconce'), bx(0.08, 0.4, 0.14, s * (hw - 0.05), yf + 2.0, z));
  }

  // --- entrance: portal piers, feature wall, plinths, sculpture ------------------------------------------
  const pier = M('venues.vipMarblePortal');
  // (deep enough to swallow the threshold columns at x = +-4.27)
  const zp0 = ROW_Z - 0.66;
  const zp1 = zEnd + 0.1;
  for (const s of [-1, 1]) kit.add(LEVEL, pier, bxOn(1.65, H, zp1 - zp0, s * 4.375, yf, (zp0 + zp1) / 2));
  const zF = zWall + 0.75; // centre plane of the feature wall
  kit.add(LEVEL, M('venues.vipBronzeMirror'), bxOn(3.6, VIP_LOUNGE.ceiling, 0.36, 0, yf, zF));
  const zLobby = zF - 0.18; // lobby face (looks toward −Z)
  kit.add(LEVEL, M('venues.vipGoldBacklit'), bx(1.6, 1.2, 0.02, 0, yf + 2.65, zLobby - 0.012));
  kit.add(LEVEL, M('venues.vipNavySign'), bx(1.6, 0.8, 0.03, 0, yf + 1.65, zLobby - 0.017));
  kit.add(LEVEL, M('venues.vipGoldLeaf'), bx(1.6, 0.83, 0.02, 0, yf + 0.835, zLobby - 0.012));
  const gold = M('venues.goldPolished');
  const diamond = [[-0.36, 0.14], [-0.2, 0.3], [0.2, 0.3], [0.36, 0.14], [0, -0.2]];
  for (const g of polyline2D(diamond, 0.014, 0.008)) kit.add(LEVEL, gold, tf(g, { ry: Math.PI, x: 0, y: yf + 1.72, z: zLobby - 0.036 }));
  for (const g of polyline2D(diamond.map(([a, b]) => [a * 0.86, b * 0.86 + 0.008]), 0.007, 0.008)) kit.add(LEVEL, gold, tf(g, { ry: Math.PI, x: 0, y: yf + 1.72, z: zLobby - 0.036 }));
  kit.add(LEVEL, gold, tf(strokeText('VIP', { height: 0.15, weight: 0.026, depth: 0.008 }).geometry, { ry: Math.PI, x: 0, y: yf + 1.74, z: zLobby - 0.036 }));
  kit.add(LEVEL, gold, tf(strokeText('Lounge', { height: 0.085, weight: 0.014, depth: 0.008 }).geometry, { ry: Math.PI, x: 0, y: yf + 1.33, z: zLobby - 0.036 }));
  // black granite plinths and the gold sculpture
  const gr = M('venues.vipGranite');
  for (const s of [-1, 1]) kit.add(LEVEL, gr, bxOn(0.95, 1.55, 0.6, s * 1.325, yf, zLobby - 0.36));
  kit.add(LEVEL, gr, bxOn(1.5, 0.42, 1.1, 0, yf, zLobby - 0.62), bxOn(0.7, 0.05, 0.5, 0, yf + 0.42, zLobby - 0.62));
  const ico = new THREE.IcosahedronGeometry(0.4, 0);
  ico.scale(0.85, 1.25, 0.55);
  ico.rotateZ(0.25);
  ico.translate(0, yf + 1.05, zLobby - 0.62);
  kit.add(LEVEL, gold, ico);
  // wire "sail" wrapped round the faceted body
  const fret = M('venues.vipFretwork');
  const sc = [0, yf + 0.47, zLobby - 0.62];
  const ribA = (u) => [sc[0] - 0.45 + 0.55 * u, sc[1] + 0.04 + 0.12 * u, sc[2] - 0.3 + 0.5 * u];
  const ribB = (u) => [sc[0] - 0.12 + 0.72 * u, sc[1] + 1.32 - 0.55 * u * u, sc[2] + 0.28 - 0.45 * u];
  for (let i = 0; i <= 10; i++) kit.add(LEVEL, fret, rod(ribA(i / 10), ribB(i / 10), 0.006, 4));
  for (let j = 1; j <= 5; j++) {
    const k = j / 6;
    const lerp = (p, q) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k];
    for (let i = 0; i < 10; i++) kit.add(LEVEL, fret, rod(lerp(ribA(i / 10), ribB(i / 10)), lerp(ribA((i + 1) / 10), ribB((i + 1) / 10)), 0.005, 3));
  }
  // bar face of the feature wall: dark pier with a gold-leaf head and two sconces
  const zBarFace = zF + 0.18;
  kit.add(LEVEL, gr, bx(1.5, 2.3, 0.03, 0, yf + 1.15, zBarFace + 0.016));
  kit.add(LEVEL, M('venues.vipGoldLeaf'), bx(1.5, VIP_LOUNGE.ceiling - 2.3, 0.02, 0, yf + 2.3 + (VIP_LOUNGE.ceiling - 2.3) / 2, zBarFace + 0.011));
  for (const s of [-1, 1]) kit.add(LEVEL, M('venues.vipSconce'), bx(0.1, 0.16, 0.06, s * 0.36, yf + 1.62, zBarFace + 0.06));

  // --- oval island bar --------------------------------------------------------------------------------------
  const oval = ellipseRing(bar.a, bar.b, 40, bar.x, bar.z);
  const lift = (pts) => pts.map(([d, y]) => [d, yf + y]);
  // concave gold mosaic front (flares at the foot and under the top)
  kit.add(LEVEL, M('venues.vipMosaicGold'), sweep(lift([[0.1, 0.06], [0.03, 0.16], [-0.03, 0.38], [-0.05, 0.58], [-0.03, 0.8], [0.03, 0.97], [0.1, 1.05], [-0.12, 1.05], [-0.12, 0.06]]), oval, { closed: true, skip: [6, 7, 8] }));
  kit.add(LEVEL, M('venues.bar7Plinth'), sweep(lift([[0.07, 0], [0.07, 0.06], [-0.5, 0.06], [-0.5, 0]]), oval, { closed: true, skip: [1, 3] }));
  kit.add(LEVEL, M('venues.bar7WorkCounter'), sweep(lift([[-0.12, 0.06], [-0.12, 1.05], [-0.52, 1.05], [-0.52, 0.06]]), oval, { closed: true, skip: [0, 1, 3] }));
  kit.add(LEVEL, M('venues.blackStone'), sweep(lift([[0.15, 1.05], [0.15, 1.1], [-0.55, 1.1], [-0.55, 1.05]]), oval, { closed: true }));
  // central back-bar tower with the bottle shoulders
  kit.add(LEVEL, gr, bxOn(1.9, 1.15, 0.7, bar.x, yf, bar.z), bxOn(1.0, 0.75, 0.46, bar.x, yf + 1.15, bar.z));
  kit.add(LEVEL, M('venues.vipGoldLeaf'), bx(0.7, 0.5, 0.012, bar.x, yf + 1.55, bar.z + 0.237));
  const bottles = [];
  const tints = [];
  const palette = ['#7A4A1C', '#5C3312', '#B98A2E', '#C8D4D0', '#3A2A1E', '#8A5A22'];
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4 && hi; i++) {
      for (const dz of [-0.22, 0, 0.22]) {
        bottles.push(M4(bar.x + s * (0.56 + i * 0.11), yf + 1.15, bar.z + dz, i + dz * 9, 0.95));
        tints.push(new THREE.Color(palette[(i * 3 + Math.round(dz * 10) + 6 + (s > 0 ? 1 : 0)) % palette.length]));
      }
    }
  }
  kit.instance(LEVEL, 'vip-bottle', F.bottle(), bottles, { colors: tints });
  // ring chandelier in the centre tray, four fretwork screens
  kit.instance(LEVEL, 'vip-ring-chandelier', F.ringChandelier(), [M4(bar.x, yTray, bar.z)], { prop: 'chandelier_ring' });
  const screen = F.fretScreen(1.25, VIP_LOUNGE.ceiling - 0.02);
  kit.instance(LEVEL, 'vip-fretscreen', screen, [M4(-4.25, yf, zEnd + 0.55), M4(4.25, yf, zEnd + 0.55), M4(-5.75, yf, bar.z + 1.3), M4(5.75, yf, bar.z + 1.3)]);

  // --- ceilings -------------------------------------------------------------------------------------------------
  const zBayC = zWall + 1.0;
  const trays = [
    { x0: -5.2, x1: 5.2, z0: zBayC + 0.4, z1: zBay + 1.1 },
    ...[-16.4, -9.9, 9.9, 16.4].map((cx) => ({ x0: cx - 2.8, x1: cx + 2.8, z0: zCarpet + 0.9, z1: zWin - 0.8 })),
  ];
  const white = M('venues.vipCeilingWhite');
  kit.add(
    LEVEL,
    white,
    prism([[-hw, zCarpet], [-bayHalf, zCarpet], [-bayHalf, zBayC], [bayHalf, zBayC], [bayHalf, zCarpet], [hw, zCarpet], [hw, zWin + 0.06], [-hw, zWin + 0.06]], yCeil, yCeil + 0.06, {
      holes: trays.map((t) => rectRing(t.x0, t.z0, t.x1, t.z1)),
    }),
  );
  const pendants = [];
  trays.forEach((t, i) => {
    const cx = (t.x0 + t.x1) / 2;
    const cz = (t.z0 + t.z1) / 2;
    const w = t.x1 - t.x0;
    const d = t.z1 - t.z0;
    kit.add(LEVEL, white, bx(w + 0.08, 0.05, d + 0.08, cx, yTray + 0.025, cz));
    kit.add(LEVEL, white, bx(w + 0.08, yTray - yCeil - 0.06, 0.04, cx, (yTray + yCeil + 0.06) / 2, t.z0 - 0.02), bx(w + 0.08, yTray - yCeil - 0.06, 0.04, cx, (yTray + yCeil + 0.06) / 2, t.z1 + 0.02));
    kit.add(LEVEL, white, bx(0.04, yTray - yCeil - 0.06, d, t.x0 - 0.02, (yTray + yCeil + 0.06) / 2, cz), bx(0.04, yTray - yCeil - 0.06, d, t.x1 + 0.02, (yTray + yCeil + 0.06) / 2, cz));
    // art-deco line: thin dark rectangle with stepped corners on the tray soffit
    const dk = M('venues.trackBlack');
    const ix = w / 2 - 0.5;
    const iz = d / 2 - 0.5;
    kit.add(LEVEL, dk, bx(2 * ix, 0.006, 0.025, cx, yTray - 0.003, cz - iz), bx(2 * ix, 0.006, 0.025, cx, yTray - 0.003, cz + iz), bx(0.025, 0.006, 2 * iz, cx - ix, yTray - 0.003, cz), bx(0.025, 0.006, 2 * iz, cx + ix, yTray - 0.003, cz));
    if (i > 0) pendants.push(M4(cx - 1.35, yTray, cz), M4(cx + 1.35, yTray, cz));
  });
  kit.instance(LEVEL, 'vip-lantern', F.lanternPendant(), pendants);
  // bulkhead at the window head: closes the ceiling void toward the glazing
  kit.add(LEVEL, white, bx(2 * hw, H - VIP_LOUNGE.ceiling - 0.06, 0.08, 0, yCeil + 0.06 + (H - VIP_LOUNGE.ceiling - 0.06) / 2, zWin - 0.04));
  // mirrored ceiling over the marble aisle and the portal
  const mirror = M('venues.vipMirrorCeiling');
  for (const s of [-1, 1]) kit.add(LEVEL, mirror, bx(hw - bayHalf, 0.05, zCarpet - zWall, s * (hw + bayHalf) / 2, yCeil + 0.025, (zCarpet + zWall) / 2));
  kit.add(LEVEL, mirror, bx(2 * bayHalf, 0.05, zBayC - zWall, 0, yCeil + 0.025, (zBayC + zWall) / 2));
  // zig-zag gold-leaf valance along the aisle edge, returning toward the portal
  for (const s of [-1, 1]) {
    kit.add(LEVEL, M('venues.vipValance'), valance([[s * (hw - 0.15), zCarpet], [s * (bayHalf + 0.25), zCarpet], [s * (bayHalf + 0.25), zBayC + 0.3]], yCeil));
  }

  // --- furniture: about 100 seats ----------------------------------------------------------------------------------
  const barrels = [];
  const sqTables = [];
  const wings = [];
  const group4 = (x, z) => {
    sqTables.push(M4(x, yf, z, 0));
    for (const [dx, dz] of [[0.86, 0], [-0.86, 0], [0, 0.86], [0, -0.86]]) barrels.push(M4(x + dx, yf, z + dz, faceDir(-dx, -dz)));
  };
  const wingPair = (x, z) => {
    cageTables.push(M4(x, yf, z, 0));
    wings.push(M4(x - 0.78, yf, z + 0.12, faceDir(1, -0.25)), M4(x + 0.78, yf, z + 0.12, faceDir(-1, -0.25)));
  };
  const zRow1 = zCarpet + 1.35;
  const zRow2 = zWin - 2.1;
  for (const s of [-1, 1]) {
    for (const x of [8.2, 11.0, 13.8, 16.6]) group4(s * x, zRow1);
    for (const x of [9.6, 15.2]) group4(s * x, zRow2);
    for (const x of [12.4, 18.2]) wingPair(s * x, zRow2 + 0.15);
  }
  kit.instance(LEVEL, 'vip-barrelchair', F.barrelChair(), barrels, { prop: 'vip_barrel_chair' });
  kit.instance(LEVEL, 'vip-squaretable', F.vipSquareTable(), sqTables);
  kit.instance(LEVEL, 'vip-wingchair', F.wingChair(), wings);
  kit.instance(LEVEL, 'vip-cagetable', F.cageTable(), cageTables);

  // grand piano at the window with a round table and tan dining chairs
  kit.addParts(LEVEL, F.grandPiano(), M4(2.6, yf, zWin - 1.9, -Math.PI / 2));
  const rt = [-2.5, zWin - 1.85];
  kit.add(LEVEL, gr, cyl(0.68, 0.035, rt[0], yf + 0.715, rt[1], 24));
  for (let i = 0; i < 4; i++) {
    const t = (i / 4) * TAU + 0.4;
    kit.add(LEVEL, M('venues.blackSteel'), rod([rt[0] + 0.45 * Math.cos(t), yf + 0.72, rt[1] + 0.45 * Math.sin(t)], [rt[0] - 0.45 * Math.cos(t), yf, rt[1] - 0.45 * Math.sin(t)], 0.012, 4));
  }
  const dch = [];
  for (let i = 0; i < 5; i++) {
    const t = (i / 5) * TAU + 0.9;
    dch.push(M4(rt[0] + 0.98 * Math.cos(t), yf, rt[1] + 0.98 * Math.sin(t), faceDir(-Math.cos(t), -Math.sin(t))));
  }
  kit.instance(LEVEL, 'vip-pianochair', F.diningChair('venues.vipLeatherTan'), dch);

  // high macassar tables with a waterfall end at the aisle edge, marble-topped consoles between the groups
  for (const s of [-1, 1]) {
    const x = s * 13.0;
    const z = zCarpet - 0.35;
    kit.add(LEVEL, mac, bx(3.4, 0.06, 0.5, x, yf + 1.05, z), bxOn(0.06, 1.02, 0.5, x + s * 1.67, yf, z));
    kit.add(LEVEL, M('venues.blackSteel'), bxOn(0.03, 1.02, 0.03, x - s * 1.5, yf, z - 0.2), bxOn(0.03, 1.02, 0.03, x - s * 1.5, yf, z + 0.2), bxOn(0.03, 1.02, 0.03, x, yf, z));
    // console against the end wall
    const cxm = s * (hw - 0.27);
    const czm = zCarpet + 1.6;
    kit.add(LEVEL, M('venues.vipMarbleWhite'), bx(0.45, 0.04, 2.3, cxm, yf + 0.86, czm));
    kit.add(LEVEL, M('venues.vipWoodDark'), bx(0.4, 0.1, 2.2, cxm, yf + 0.79, czm), bx(0.36, 0.04, 2.1, cxm, yf + 0.3, czm));
    for (const dz of [-1.0, 1.0]) kit.add(LEVEL, M('venues.vipWoodDark'), cyl(0.045, 0.74, cxm, yf, czm + dz, 8, 0.03));
    kit.add(LEVEL, gold, cyl(0.07, 0.34, cxm, yf + 0.88, czm + 0.6, 10, 0.11));
  }

  const banquetteSeats = 36;
  return { seats: barrels.length + wings.length + dch.length + banquetteSeats };
}

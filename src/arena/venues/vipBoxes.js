// Interiors of the 11 VIP BOX rooms (LEVEL 6, room floor +18.07) behind the box balconies.
// Official photo (img_facility_vip01) and Travel Watch 028 (organiser room): navy carpet with
// gold starbursts, glossy macassar-ebony wall panels, a bevelled antique-mirror wall with a
// brass chevron grid, brass candelabra pendants with frosted glass tubes over a black marble
// dining table with cream damask chairs (brass shell pulls), an oval gold-leaf ceiling coffer
// in an off-white textured ceiling over a mustard boucle serpentine sofa with drum ottomans,
// a black marble cloud table and a gold-rimmed side table, a kitchenette counter with a
// private beer server, a monitor hung above the glass front.
// Not built here: the balconies, their seats, the glass fronts and the dividing walls
// (arena/bowl, arena/seats) and the VIP corridor wall with the room doors (arena/structure);
// the rooms are lined on their side walls and stop at the room face of that corridor wall.
import { bx, bxOn, cyl, M4, prism, rectRing, tf, sweep, ellipseRing, faceDir, TAU } from './kit.js';
import { M } from './mats.js';
import { Y, FIN, VIP_BOX } from './layout.js';
import * as F from './furniture.js';

const LEVEL = 6;
const D2R = Math.PI / 180;

/** Antique-mirror wall panel with its brass chevron grid, modelled in the local XY plane facing +Z (w along X). */
function mirrorPanel(w, h) {
  const mirror = [bx(w, h, 0.012, 0, h / 2, 0)];
  const brass = [];
  const z = 0.012;
  brass.push(bx(w + 0.04, 0.03, 0.02, 0, 0.015, z), bx(w + 0.04, 0.03, 0.02, 0, h - 0.015, z), bx(0.03, h, 0.02, -w / 2, h / 2, z), bx(0.03, h, 0.02, w / 2, h / 2, z));
  const cols = Math.round(w / 0.4);
  const pw = w / cols;
  for (let i = 1; i < cols; i++) brass.push(bx(0.012, h, 0.012, -w / 2 + i * pw, h / 2, z));
  // chevrons: each pane column carries rising / falling bars, alternating → zig-zag bands
  const rows = [0.28, 0.52, 0.76];
  for (let i = 0; i < cols; i++) {
    const xc = -w / 2 + (i + 0.5) * pw;
    const slope = i % 2 ? 1 : -1;
    for (const r of rows) {
      brass.push(tf(bx(Math.hypot(pw, pw * 0.6), 0.012, 0.012), { rz: slope * Math.atan(0.6), x: xc, y: h * r, z }));
    }
  }
  return { mirror, brass };
}

function buildRoom(kit, room, lists, hi) {
  const y0 = Y.L6;
  const yf = y0 + FIN;
  const g = VIP_BOX.wallGap;
  const xa = room.x0 + g;
  const xb = room.x1 - g;
  const z0 = VIP_BOX.zFront;
  const z1 = VIP_BOX.zBack;
  const w = xb - xa;
  const organiser = room.id === 'organiser';
  // house-right rooms mirror the house-left ones; the organiser room has its sofa on the house-right
  // side (official photo: looking from the sofa to the dining table the hall glass is on the right)
  const flip = organiser || room.x0 >= 0;
  const X = (dx) => (flip ? xb - dx : xa + dx); // distance from the "sofa side" wall
  const sgn = flip ? -1 : 1;
  const yC = yf + VIP_BOX.ceiling;
  const mac = M('venues.vipMacassar');

  // carpet
  kit.add(LEVEL, M('venues.vipBoxCarpet'), prism(rectRing(xa, z0, xb, z1), y0 + 0.004, yf, { bottom: false }));

  // side wall linings (macassar) with the antique-mirror panel
  for (const side of [-1, 1]) {
    const xw = side < 0 ? xa : xb;
    kit.add(LEVEL, mac, bxOn(0.06, VIP_BOX.ceiling + 0.3, z1 - z0, xw - side * 0.03, yf, (z0 + z1) / 2));
    const sofaSide = (side < 0) !== flip;
    if (organiser || sofaSide) {
      const pw = 2.4;
      const ph = 2.5;
      const { mirror, brass } = mirrorPanel(pw, ph);
      const ry = side < 0 ? Math.PI / 2 : -Math.PI / 2;
      const zc = z0 + 3.6;
      for (const m of mirror) kit.add(LEVEL, M('venues.vipAntiqueMirror'), tf(m, { ry, x: xw - side * 0.066, y: yf + 0.12, z: zc }));
      if (hi) for (const b of brass) kit.add(LEVEL, M('venues.brass'), tf(b, { ry, x: xw - side * 0.066, y: yf + 0.12, z: zc }));
    } else {
      // ribbed-glass sconces on the plain side wall
      for (const dz of [1.6, 4.6]) {
        kit.add(LEVEL, M('venues.brass'), bx(0.02, 0.46, 0.16, xw - side * 0.07, yf + 1.9, z0 + dz));
        kit.add(LEVEL, M('venues.vipSconce'), bx(0.08, 0.38, 0.11, xw - side * 0.11, yf + 1.9, z0 + dz));
      }
    }
  }

  // ceiling with the oval gold-leaf coffer over the sofa
  const sofaC = organiser ? [X(2.5), z0 + 3.45] : [X(1.9), z0 + 3.1];
  const oa = organiser ? 1.7 : 1.15;
  const ob = organiser ? 1.1 : 0.8;
  const oval = ellipseRing(oa, ob, 28, sofaC[0], sofaC[1]);
  kit.add(LEVEL, M('venues.vipBoxCeiling'), prism(rectRing(xa, z0, xb, z1), yC, yC + 0.06, { holes: [oval], top: false }));
  kit.add(LEVEL, M('venues.vipGoldLeaf'), prism(ellipseRing(oa + 0.05, ob + 0.05, 28, sofaC[0], sofaC[1]), yC + 0.24, yC + 0.29, { top: false }));
  kit.add(LEVEL, M('venues.goldPolished'), sweep([[0, yC - 0.035], [0.07, yC - 0.035], [0.07, yC + 0.24], [0, yC + 0.24]], oval, { closed: true }));
  // recessed downlights
  for (const [dx, dz] of [[0.8, 0.9], [0.8, 5.6], [w - 0.8, 0.9], [w - 0.8, 5.6], [w / 2, 0.9]]) kit.add(LEVEL, M('venues.spotLens'), cyl(0.04, 0.006, xa + dx, yC - 0.006, z0 + dz, 8));

  // monitor hung above the glass front, tilted toward the room
  const mx = organiser ? X(2.5) : X(1.9);
  kit.add(LEVEL, M('venues.trackBlack'), tf(bx(1.32, 0.77, 0.05), { rx: 0.22, x: mx, y: yC - 0.5, z: z0 + 0.28 }), bx(0.05, 0.14, 0.05, mx, yC - 0.07, z0 + 0.22));
  kit.add(LEVEL, M('venues.vipMonitor'), tf(bx(1.24, 0.69, 0.01, 0, 0, 0.03), { rx: 0.22, x: mx, y: yC - 0.5, z: z0 + 0.28 }));

  // kitchenette counter with the private beer server, against the corridor wall
  const kx = organiser ? X(3.4) : X(1.35);
  const kw = organiser ? 2.6 : 1.7;
  kit.add(LEVEL, M('venues.vipKitchenFront'), bxOn(kw, 0.88, 0.58, kx, yf, z1 - 0.31));
  kit.add(LEVEL, M('venues.blackStone'), bx(kw + 0.04, 0.04, 0.62, kx, yf + 0.9, z1 - 0.33));
  kit.add(LEVEL, M('venues.goldPolished'), cyl(0.035, 0.4, kx + kw / 2 - 0.35, yf + 0.92, z1 - 0.32, 8), bx(0.07, 0.06, 0.17, kx + kw / 2 - 0.35, yf + 1.35, z1 - 0.38));
  kit.add(LEVEL, M('venues.brass'), bx(kw - 0.2, 0.012, 0.012, kx, yf + 0.74, z1 - 0.605));

  // furniture
  if (organiser) {
    // serpentine sofa wrapping the mirror corner, cloud table, ottomans, side table
    kit.addParts(LEVEL, F.curvedSofa(2.1, -70 * D2R, 85 * D2R), M4(sofaC[0], yf, sofaC[1]));
    lists.cloud.push(M4(sofaC[0] + sgn * 0.1, yf, sofaC[1], 0.3));
    for (const a of [-55, -15, 25, 62]) lists.ottoman.push(M4(sofaC[0] + sgn * 1.3 * Math.cos(a * D2R), yf, sofaC[1] + 1.3 * Math.sin(a * D2R)));
    lists.rim.push(M4(sofaC[0] + sgn * 1.75, yf, sofaC[1] - 1.75));
    // dining table for eight, long axis toward the glass
    const tx = X(w - 2.35);
    const tz = z0 + 3.2;
    kit.addParts(LEVEL, F.diningTable(2.6, 1.0), M4(tx, yf, tz, Math.PI / 2));
    for (let i = 0; i < 4; i++) {
      const z = tz - 0.93 + i * 0.62;
      lists.chair.push(M4(tx - 0.72, yf, z, faceDir(1, 0)), M4(tx + 0.72, yf, z, faceDir(-1, 0)));
    }
    lists.pendantLong.push(M4(tx, yC, tz, Math.PI / 2));
  } else {
    lists.sofa.push(M4(sofaC[0], yf, sofaC[1], flip ? Math.PI : 0));
    lists.cloud.push(M4(sofaC[0] + sgn * 0.1, yf, sofaC[1], flip ? Math.PI : 0, 0.72));
    for (const a of [-38, 30]) lists.ottoman.push(M4(sofaC[0] + sgn * 1.0 * Math.cos(a * D2R), yf, sofaC[1] + 1.0 * Math.sin(a * D2R)));
    lists.rim.push(M4(sofaC[0] + sgn * 0.75, yf, sofaC[1] - 1.9, 0, 0.85));
    // round table for three near the back
    const tx = X(w - 1.15);
    const tz = z0 + 4.3;
    kit.add(LEVEL, M('venues.vipMarbleBlack'), cyl(0.45, 0.035, tx, yf + 0.72, tz, 20));
    kit.add(LEVEL, M('venues.goldPolished'), cyl(0.04, 0.7, tx, yf + 0.02, tz, 8), cyl(0.26, 0.02, tx, yf, tz, 16));
    for (let i = 0; i < 3; i++) {
      const t = (i / 3) * TAU + (flip ? 0.5 : Math.PI - 0.5);
      lists.chair.push(M4(tx + 0.74 * Math.cos(t), yf, tz + 0.74 * Math.sin(t), faceDir(-Math.cos(t), -Math.sin(t))));
    }
    lists.pendantShort.push(M4(tx, yC, tz, Math.PI / 2));
  }
}

export function buildVipBoxes(kit, ctx) {
  const hi = ctx.quality !== 'low';
  const lists = { chair: [], ottoman: [], cloud: [], rim: [], sofa: [], pendantLong: [], pendantShort: [] };
  for (const room of VIP_BOX.rooms) buildRoom(kit, room, lists, hi);

  kit.instance(LEVEL, 'vipbox-diningchair', F.diningChair(), lists.chair);
  kit.instance(LEVEL, 'vipbox-ottoman', F.ottoman(), lists.ottoman);
  kit.instance(LEVEL, 'vipbox-cloudtable', F.cloudTable(), lists.cloud);
  kit.instance(LEVEL, 'vipbox-sidetable', F.goldRimTable(), lists.rim);
  // The small box sofa curves around the west side of its table. Its asset is centred on the cushion.
  kit.instance(LEVEL, 'vipbox-sofa', F.curvedSofa(1.55, 110 * D2R, 250 * D2R), lists.sofa, {
    prop: 'vip_sofa', propTransform: M4(-1.05, 0, 0, Math.PI / 2),
  });
  kit.instance(LEVEL, 'vipbox-pendant-long', F.candelabraPendant(2.2, 0.8), lists.pendantLong);
  kit.instance(LEVEL, 'vipbox-pendant-short', F.candelabraPendant(1.0, 0.8), lists.pendantShort);

  return { rooms: VIP_BOX.rooms.length };
}

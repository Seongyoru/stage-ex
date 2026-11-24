// Lounge 5 (LEVEL 5, +12.67): about 400 free seats in the glass box above the Main Entrance.
// Official photo (shop guide), Oricon and Travel Watch photos: long room seen along its length,
// full-height glazing with the fair-faced colonnade columns on one side, a row of charcoal
// column casings with portrait screens and the "LOUNGE 5" shield on the hall side, rows of
// rust-topped steel tables with cobalt benches (long axis across the room), a block of high
// tables with shell stools toward the house-right end, cafe tables and a window counter along
// the glass, signal-red end walls with a porthole mirror, grey flat bulkheads on the column
// lines and black track spots. The kiosks 5B / 5C open toward the lounge from the centre block.
// Not built here: the charcoal column casings on the threshold row and the exposed soffit
// (arena/structure), glazing and colonnade columns (arena/exterior).
import { bx, bxOn, cyl, rod, M4, prism, rectRing, strokeText, tf, plateXY, faceDir } from './kit.js';
import { M } from './mats.js';
import { Y, FIN, BOX, ROW_Z, BOX_COLUMNS_X, COLUMN_Z, COLUMN_HALF, LOUNGE5 } from './layout.js';
import * as F from './furniture.js';

const LEVEL = 5;

/** Disc whose axis is the world X axis (porthole mirror on an end wall). */
function xDisc(r, t, x, y, z, seg = 28) {
  return tf(cyl(r, t, 0, -t / 2, 0, seg), { rz: Math.PI / 2, x, y, z });
}

export function buildLounge5(kit, ctx) {
  const y0 = Y.L5;
  const yf = y0 + FIN;
  const hi = ctx.quality !== 'low';
  const zWin = BOX.zGlassIn;
  const cols = BOX_COLUMNS_X; // −21.36 … 21.36 (colonnade and threshold row share these lines)
  const nearColumn = (x, margin) => cols.some((c) => Math.abs(c - x) < COLUMN_HALF + margin);

  // --- floor finish: sealed concrete over the whole lounge ---------------------------------
  kit.add(LEVEL, M('venues.lounge5Floor'), prism(rectRing(-BOX.xGlassIn, LOUNGE5.zEdge, BOX.xGlassIn, zWin), y0 + 0.004, yf, { bottom: false }));

  // --- red end walls with the porthole mirror ----------------------------------------------
  const zA = ROW_Z + 0.7;
  const zB = LOUNGE5.endWallZ1;
  for (const s of [-1, 1]) {
    const x = s * LOUNGE5.endWallX;
    kit.add(LEVEL, M('venues.lounge5RedWall'), bxOn(0.2, 4.4, zB - zA, x, yf, (zA + zB) / 2));
    const face = x - s * 0.1; // lounge-side face
    const zc = zA + 1.9;
    kit.add(LEVEL, M('venues.portholeHalo'), xDisc(1.0, 0.02, face - s * 0.012, y0 + 1.8, zc));
    kit.add(LEVEL, M('venues.portholeMirror'), xDisc(0.92, 0.03, face - s * 0.03, y0 + 1.8, zc));
    kit.add(LEVEL, M('venues.blackSteel'), xDisc(0.96, 0.016, face - s * 0.02, y0 + 1.8, zc));
    // charcoal return panel that closes the red wall toward the glazing (dark strip in the photo)
    kit.add(LEVEL, M('venues.charcoalPanel'), bxOn(0.24, 4.4, 0.5, x, yf, zB + 0.25));
  }

  // --- "LOUNGE 5" shield boards on the concourse face of the two middle threshold columns ------
  const zFaceHall = ROW_Z - COLUMN_HALF; // column face toward the concourse
  for (const x of cols.filter((c) => Math.abs(c) < 6)) {
    const z = zFaceHall - 0.013;
    const turn = { ry: Math.PI }; // boards read from the concourse (looking +Z)
    kit.add(LEVEL, M('venues.signBoard'), bx(1.06, 2.5, 0.02, x, y0 + 1.75, z));
    const shield = [[-0.24, 0.6], [0.24, 0.6], [0.24, 0.17], [0, 0], [-0.24, 0.17]];
    kit.add(LEVEL, M('venues.signWhite'), tf(plateXY(shield, 0.006), { ...turn, x, y: y0 + 1.95, z: z - 0.013 }));
    kit.add(LEVEL, M('venues.signBoard'), tf(plateXY(shield.map(([a, b]) => [a * 0.86, 0.045 + b * 0.86]), 0.006), { ...turn, x, y: y0 + 1.95, z: z - 0.019 }));
    kit.add(LEVEL, M('venues.signWhite'), tf(strokeText('5', { height: 0.26, weight: 0.045, depth: 0.006 }).geometry, { ...turn, x, y: y0 + 2.11, z: z - 0.025 }));
    kit.add(LEVEL, M('venues.signWhite'), tf(strokeText('LOUNGE', { height: 0.075, weight: 0.014, depth: 0.006 }).geometry, { ...turn, x, y: y0 + 2.62, z: z - 0.013 }));
    // gate direction lines below (stencil type; texture later) and the red "here" tag
    for (const [yy, w] of [[1.55, 0.62], [1.37, 0.74]]) kit.add(LEVEL, M('venues.signWhite'), bx(w, 0.07, 0.006, x + (0.74 - w) / 2, y0 + yy, z - 0.013));
    kit.add(LEVEL, M('venues.signRed'), bx(0.74, 0.05, 0.006, x, y0 + 1.2, z - 0.013));
  }

  // --- table field ---------------------------------------------------------------------------
  // three table slots across the room: a butt-joined pair and a single (slot 0 stands between
  // the threshold columns and is left out where a column is in the way)
  const slotsZ = [LOUNGE5.zField0 + 0.9, LOUNGE5.zField0 + 2.72, LOUNGE5.zField0 + 5.22];
  const rowsX = [];
  for (let i = 0; i < 13; i++) rowsX.push(-19.8 + 2.25 * i + (i >= 7 ? 0.9 : 0));
  const tables = [];
  const benches = [];
  const turn = Math.PI / 2; // long axis across the room (along Z)
  for (const x of rowsX) {
    slotsZ.forEach((z, k) => {
      if (k === 0 && nearColumn(x, 0.92)) return;
      tables.push(M4(x, yf, z, turn));
      benches.push(M4(x - 0.675, yf, z, turn), M4(x + 0.675, yf, z, turn));
    });
  }
  kit.instance(LEVEL, 'lounge5-table', F.loungeTable(), tables, { prop: 'lounge_table_set' });
  kit.instance(LEVEL, 'lounge5-bench', F.loungeBench(), benches, { placeholder: 'lounge_table_set' });

  // high tables with dark shell stools, house-right end
  const highX = [10.9, 13.0, 15.1, 17.2, 19.3];
  const highs = [];
  const stools = [];
  for (const x of highX) {
    slotsZ.forEach((z, k) => {
      if (k === 0 && nearColumn(x, 0.8)) return;
      highs.push(M4(x, yf, z, turn));
      for (const dz of [-0.675, -0.225, 0.225, 0.675]) {
        stools.push(M4(x - 0.56, yf, z + dz, faceDir(1, 0)), M4(x + 0.56, yf, z + dz, faceDir(-1, 0)));
      }
    });
  }
  kit.instance(LEVEL, 'lounge5-hightable', F.highTable(), highs);

  // --- window zone -----------------------------------------------------------------------------
  const paleStools = [];
  const cafeTables = [];
  const cafeChairs = [];
  for (let b = 0; b < cols.length - 1; b++) {
    const xa = cols[b] + COLUMN_HALF + 0.06;
    const xb = cols[b + 1] - COLUMN_HALF - 0.06;
    const xc = (xa + xb) / 2;
    if (b < 2) {
      // window counter between the columns with pale shell stools (house-left end, as in the official photo)
      const zc = COLUMN_Z + 0.2;
      kit.add(LEVEL, M('venues.lounge5TableTop'), bx(xb - xa, 0.04, 0.42, xc, yf + 1.0, zc));
      kit.add(LEVEL, M('venues.lounge5Frame'), bx(xb - xa, 0.05, 0.03, xc, yf + 0.955, zc - 0.19));
      for (let k = 0; k <= 4; k++) {
        const px = xa + 0.05 + ((xb - xa - 0.1) * k) / 4;
        kit.add(LEVEL, M('venues.lounge5Frame'), bxOn(0.04, 0.98, 0.04, px, yf, zc - 0.17), bx(0.03, 0.03, 0.34, px, yf + 0.955, zc));
      }
      for (let k = 0; k < 9; k++) paleStools.push(M4(xa + 0.42 + k * ((xb - xa - 0.84) / 8), yf, zc - 0.56, 0));
    } else {
      for (const dx of [-2.85, -1.0, 1.0, 2.85]) {
        const tx = xc + dx;
        const tz = COLUMN_Z - 1.0;
        cafeTables.push(M4(tx, yf, tz, 0));
        cafeChairs.push(M4(tx - 0.62, yf, tz, faceDir(1, 0)), M4(tx + 0.62, yf, tz, faceDir(-1, 0)));
        // every other table is a four-seater (chairs also on the window and the aisle side)
        if (Math.abs(dx) > 2) cafeChairs.push(M4(tx, yf, tz - 0.62, faceDir(0, 1)), M4(tx, yf, tz + 0.62, faceDir(0, -1)));
      }
    }
  }
  kit.instance(LEVEL, 'lounge5-stool', F.shellChair({ seatH: 0.76, shell: 'venues.shellLeatherGrey' }), stools, { prop: 'bar_stool' });
  kit.instance(LEVEL, 'lounge5-windowstool', F.shellChair({ seatH: 0.76, shell: 'venues.shellPale' }), paleStools);
  kit.instance(LEVEL, 'lounge5-cafetable', F.cafeTable(), cafeTables);
  kit.instance(LEVEL, 'lounge5-cafechair', F.shellChair({ seatH: 0.46, shell: 'venues.shellLeatherGrey', footrest: false, backH: 0.36 }), cafeChairs);

  // --- ceiling zone: bulkheads on the column lines, track spots ------------------------------
  const yBulk = y0 + 4.3;
  const zb0 = ROW_Z + COLUMN_HALF + 0.06;
  const zb1 = COLUMN_Z - COLUMN_HALF - 0.06;
  for (const x of cols) kit.add(LEVEL, M('venues.lounge5Bulkhead'), bx(2.4, 0.28, zb1 - zb0, x, yBulk + 0.14, (zb0 + zb1) / 2));
  // dark linear slot diffusers on the underside of each bulkhead
  for (const x of cols) kit.add(LEVEL, M('venues.trackBlack'), bx(0.18, 0.012, 2.4, x + 0.6, yBulk - 0.006, 88.4), bx(0.18, 0.012, 2.4, x + 0.6, yBulk - 0.006, 91.8));

  const yTrack = y0 + 4.18;
  const spots = [];
  for (const z of [87.4, 89.4, 91.4]) {
    kit.add(LEVEL, M('venues.trackBlack'), bx(43.0, 0.035, 0.035, 0, yTrack + 0.0175, z));
    for (let x = -20.25; x <= 20.3; x += hi ? 2.25 : 4.5) spots.push(M4(x, yTrack, z));
    for (let x = -21; x <= 21; x += 6) kit.add(LEVEL, M('venues.trackBlack'), rod([x, yTrack + 0.035, z], [x, yTrack + 0.75, z], 0.006, 4));
  }
  kit.instance(LEVEL, 'lounge5-trackspot', F.trackSpot(), spots);

  // --- portrait digital signage on the threshold columns, readable along the room ---------------
  const screens = [];
  for (const x of cols) {
    for (const s of [-1, 1]) {
      if (Math.abs(x + s * 1.5) > BOX.xGlassIn - 1.2) continue; // outer faces of the end columns face the red walls
      screens.push(M4(x + s * COLUMN_HALF, y0 + 3.15, ROW_Z + 0.08, faceDir(s, 0)));
    }
  }
  kit.instance(LEVEL, 'lounge5-signage', F.wallScreen(), screens);

  return { seats: tables.length * 6 + stools.length + paleStools.length + cafeChairs.length };
}

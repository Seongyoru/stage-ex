// Hilton Yokohama: 26-storey slab tower (99.87 m) on a 3-storey brick-and-white podium
// with mansard roofs, the pilotis passage "Music Terrace Plaza" with its tree columns
// and the 500-inch outdoor vision. Built in the Hilton frame (a = west, b = north, origin
// at the podium's north-east corner) and placed with one rotation.
import * as THREE from 'three';
import { metricUV } from '../../core/geom.js';
import { M, E } from './mats.js';
import { Bag, Tris, band, beam, lbox } from './kit.js';
import { face, rectFaces, blockText, textWidth, rnd } from './facade.js';
import { HF, HILTON, Y_PLAZA } from './layout.js';

const Y0 = Y_PLAZA; // podium stands on the plaza level
const Y_PIER = 13.6; // top of the brick piers (two storeys)
const Y_ENT = 14.7; // top of the white entablature
const Y_COR = 18.0; // underside of the cornice
const Y_CORNICE = HILTON.yCornice; // 18.6
const Y_MANSARD = HILTON.yMansard; // 21.4
const FLOORS = 23; // 26F = 3 podium storeys + 23 tower storeys of 3.42 m
const Y_T0 = Y_CORNICE;
const Y_CROWN = 97.25;
const FLOOR_H = (Y_CROWN - Y_T0) / FLOORS;
export const VISION = { a: 39.0, b: -4.45, w: 11.1, h: 6.2, y: 7.25 };

function pier(L, f, x, { y0 = Y0, y1 = Y_PIER, w = 1.3, brick = true } = {}) {
  const body = brick ? M('precinct.brick') : M('hilton.pier');
  const stone = M('precinct.stoneBase');
  L.add(stone, f.box(x - w / 2 - 0.1, x + w / 2 + 0.1, y0, y0 + 0.9, -0.9, 0.35));
  L.add(body, f.box(x - w / 2, x + w / 2, y0 + 0.9, y1 - 0.3, -0.9, 0.25));
  L.add(stone, f.box(x - w / 2 - 0.08, x + w / 2 + 0.08, y1 - 0.3, y1, -0.9, 0.33));
}

/** Lower two storeys of one bay between piers at x0 and x1. */
function lowerBay(L, f, x0, x1, type) {
  const glass = M('hilton.podiumGlass');
  const frame = M('hilton.podiumFrame');
  const stone = M('hilton.stoneBand');
  const a = x0 + 0.65;
  const b = x1 - 0.65;
  if (type === 'open') return;
  if (type === 'banded') {
    // grey horizontally banded stone panels with white string courses (south and west faces)
    L.add(stone, f.box(a, b, Y0, Y_PIER, -0.35, -0.2));
    for (const y of [Y0 + 0.9, 7.6, 9.3, 11.0, 12.7]) L.add(M('precinct.stoneBase'), f.box(a, b, y, y + 0.12, -0.2, -0.14));
    return;
  }
  // 'arcade': shopfront, dark-red sign band, stone beam, glazed mezzanine, stone head
  L.add(glass, f.box(a, b, Y0 + 0.12, 8.5, -1.0, -0.95));
  L.add(M('hilton.podiumGlow'), f.box(a + 0.1, b - 0.1, Y0 + 0.3, 8.3, -0.93, -0.915));
  const n = 4;
  for (let i = 0; i <= n; i++) {
    const x = a + ((b - a) * i) / n;
    L.add(frame, f.box(x - 0.04, x + 0.04, Y0, 8.5, -0.97, -0.87));
  }
  L.add(frame, f.box(a, b, 7.55, 7.63, -0.97, -0.87));
  L.add(stone, f.box(a, b, Y0, Y0 + 0.12, -1.0, -0.8));
  L.add(M('hilton.signBand'), f.box(a + 0.3, b - 0.3, 8.55, 9.15, -0.55, -0.2)); // sign band / awning
  L.add(frame, f.box(a + 0.3, b - 0.3, 8.5, 8.56, -0.6, 0.05));
  L.add(stone, f.box(a, b, 9.15, 9.7, -0.75, -0.3));
  L.add(glass, f.box(a, b, 9.7, 13.0, -0.6, -0.55));
  L.add(M('hilton.podiumGlow'), f.box(a + 0.1, b - 0.1, 9.9, 12.8, -0.53, -0.515));
  for (let i = 0; i <= 5; i++) {
    const x = a + ((b - a) * i) / 5;
    L.add(frame, f.box(x - 0.035, x + 0.035, 9.7, 13.0, -0.57, -0.48));
  }
  L.add(frame, f.box(a, b, 11.9, 11.97, -0.57, -0.48));
  L.add(stone, f.box(a, b, 13.0, Y_PIER, -0.75, -0.3));
}

/** White storey above the brick piers: entablature, pilasters, big black-framed windows, cornice. */
function upperBand(L, f, xs, { windows = true } = {}) {
  const white = M('hilton.pier');
  const x0 = xs[0] - 0.65;
  const x1 = xs[xs.length - 1] + 0.65;
  L.add(white, f.box(x0, x1, Y_PIER, Y_ENT, -0.9, 0.3));
  L.add(white, f.box(x0 - 0.1, x1 + 0.1, Y_ENT - 0.18, Y_ENT, -0.9, 0.42));
  for (const x of xs) L.add(white, f.box(x - 0.65, x + 0.65, Y_ENT, Y_COR, -0.9, 0.2));
  L.add(white, f.box(x0, x1, Y_COR, Y_CORNICE - 0.25, -0.9, 0.3));
  L.add(white, f.box(x0 - 0.25, x1 + 0.25, Y_CORNICE - 0.25, Y_CORNICE, -0.9, 0.6));
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i] + 0.65;
    const b = xs[i + 1] - 0.65;
    if (!windows) {
      L.add(M('hilton.stoneBand'), f.box(a, b, Y_ENT, Y_COR, -0.35, -0.2));
      continue;
    }
    L.add(M('hilton.podiumGlass'), f.box(a, b, Y_ENT, Y_COR, -0.45, -0.4));
    L.add(M('hilton.podiumGlow'), f.box(a + 0.1, b - 0.1, Y_ENT + 0.2, Y_COR - 0.2, -0.38, -0.365));
    const fr = M('hilton.podiumFrame');
    for (let k = 0; k <= 3; k++) {
      const x = a + ((b - a) * k) / 3;
      L.add(fr, f.box(x - 0.045, x + 0.045, Y_ENT, Y_COR, -0.42, -0.3));
    }
    L.add(fr, f.box(a, b, Y_COR - 0.75, Y_COR - 0.68, -0.42, -0.3));
    L.add(fr, f.box(a, b, Y_ENT, Y_ENT + 0.08, -0.42, -0.3));
  }
}

function podium(L) {
  const H = HILTON;
  const core = M('hilton.stoneBand');
  const eb = H.eastBlockLen; // 23.4
  // solid cores behind the facades (1 m inside the face planes)
  L.add(core, lbox(1.0, eb - 1.0, 0, Y_CORNICE, -H.eastBlockDepth + 1.0, -1.0));
  L.add(core, lbox(H.passage[1] + 1.0, H.len - 1.0, 0, Y_CORNICE, -H.depth + 1.0, -1.0));
  L.add(core, lbox(eb - 1.0, H.passage[1] + 1.0, Y_PIER + 0.3, Y_CORNICE, -H.depth + 1.0, -1.0)); // storey bridging the passage
  // plinth below the plaza level (hidden by the decks on most sides)
  L.add(core, lbox(0, eb, 0, Y0, -H.eastBlockDepth, 0));
  L.add(core, lbox(H.passage[1], H.len, 0, Y0, -H.depth, 0));

  // --- north face: BAYDECK arcade (3 bays), pilotis (3 bays), stone bays (2) ----------------
  const fN = face(0, 0, 1, 0, 0, 1, H.len);
  const xsN = [0.65, 7.8, 15.6, 23.4, 31.2, 39.0, 46.8, 54.6, H.len - 0.65];
  const typesN = ['arcade', 'arcade', 'arcade', 'open', 'open', 'open', 'banded', 'banded'];
  xsN.forEach((x) => pier(L, fN, x));
  typesN.forEach((t, i) => lowerBay(L, fN, xsN[i], xsN[i + 1], t));
  upperBand(L, fN, xsN);
  // --- east face (toward the arena): 4 arcade bays ---------------------------------------------
  const fE = face(0, -H.eastBlockDepth, 0, 1, -1, 0, H.eastBlockDepth);
  const xsE = [0.65, 9.5, 17.3, 25.1, H.eastBlockDepth - 0.65];
  xsE.forEach((x) => pier(L, fE, x));
  for (let i = 0; i < 4; i++) lowerBay(L, fE, xsE[i], xsE[i + 1], 'arcade');
  upperBand(L, fE, xsE);
  // --- south face of the east block: banded stone ------------------------------------------------
  const fS1 = face(eb, -H.eastBlockDepth, -1, 0, 0, -1, eb);
  const xsS1 = [0.65, 7.8, 15.6, eb - 0.65];
  xsS1.forEach((x) => pier(L, fS1, x));
  for (let i = 0; i < 3; i++) lowerBay(L, fS1, xsS1[i], xsS1[i + 1], 'banded');
  upperBand(L, fS1, xsS1, { windows: false });
  // return of the east block toward the portal
  const fS1w = face(eb, -H.depth, 0, -1, 1, 0, H.eastBlockDepth - H.depth);
  L.add(M('hilton.stoneBand'), fS1w.box(0, H.eastBlockDepth - H.depth, Y0, Y_CORNICE, -0.4, 0));
  // --- south face, west part: two stone bays; the portal of the passage is built below -----------
  const fS2 = face(H.len, -H.depth, -1, 0, 0, -1, H.len - eb);
  const xsS2 = [0.65, 7.8, 15.6];
  xsS2.forEach((x) => pier(L, fS2, x));
  for (let i = 0; i < 2; i++) lowerBay(L, fS2, xsS2[i], xsS2[i + 1], 'banded');
  upperBand(L, fS2, xsS2, { windows: false });
  // --- west face (Tower Street): banded stone ----------------------------------------------------------
  const fW = face(H.len, 0, 0, -1, 1, 0, H.depth);
  const xsW = [0.65, 7.0, 13.9, 20.8, H.depth - 0.65];
  xsW.forEach((x) => pier(L, fW, x));
  for (let i = 0; i < 4; i++) lowerBay(L, fW, xsW[i], xsW[i + 1], 'banded');
  upperBand(L, fW, xsW, { windows: false });
  // --- walls of the passage (glazed galleries between brick piers, photo T7) ---------------------------
  const fP1 = face(eb, 0, 0, -1, 1, 0, H.depth); // east block, facing west
  const fP2 = face(H.passage[1], -H.depth, 0, 1, -1, 0, H.depth); // west block, facing east
  for (const f of [fP1, fP2]) {
    const xs = [0.65, 7.0, 13.9, 20.8, H.depth - 0.65];
    xs.forEach((x) => pier(L, f, x));
    for (let i = 0; i < 4; i++) lowerBay(L, f, xs[i], xs[i + 1], 'arcade');
  }

  // --- mansard roofs (slate-grey, white ribs on the bay lines, small white dormers) -------------
  const yb = Y_CORNICE;
  const outer = [[H.len, 0.35], [-0.35, 0.35], [-0.35, -H.eastBlockDepth - 0.35], [eb, -H.eastBlockDepth - 0.35]];
  const inner = [[H.len, -2.2], [2.2, -2.2], [2.2, -H.eastBlockDepth + 2.2], [eb, -H.eastBlockDepth + 2.2]];
  L.add(M('hilton.mansard'), band(outer, yb, inner, Y_MANSARD, { closed: false }));
  const rib = M('hilton.pier');
  const ribAt = (o, i) => L.add(rib, beam([o[0], yb + 0.02, o[1]], [i[0], Y_MANSARD + 0.02, i[1]], 0.16, 0.1));
  for (const x of xsN) ribAt([x, 0.35], [Math.max(x, 2.2), -2.2]);
  for (const x of xsE) ribAt([-0.35, -H.eastBlockDepth + x], [2.2, Math.min(Math.max(-H.eastBlockDepth + x, -H.eastBlockDepth + 2.2), -2.2)]);
  for (const x of xsS1) ribAt([eb - x, -H.eastBlockDepth - 0.35], [Math.max(eb - x, 2.2), -H.eastBlockDepth + 2.2]);
  // gable closures at the open ends of the mansard band
  const g = new Tris();
  g.tri([H.len, yb, 0.35], [H.len, yb, -2.2], [H.len, Y_MANSARD, -2.2]);
  g.tri([H.len, yb, 0.35], [H.len, Y_MANSARD, -2.2], [H.len, yb, -2.2]);
  g.tri([eb, yb, -H.eastBlockDepth - 0.35], [eb, yb, -H.eastBlockDepth + 2.2], [eb, Y_MANSARD, -H.eastBlockDepth + 2.2]);
  g.tri([eb, yb, -H.eastBlockDepth - 0.35], [eb, Y_MANSARD, -H.eastBlockDepth + 2.2], [eb, yb, -H.eastBlockDepth + 2.2]);
  L.add(M('hilton.mansard'), g.build());
  // dormers: one per bay on the north and east slopes
  const dormer = (cx, cb, alongA) => {
    const w = alongA ? [1.3, 0.9] : [0.9, 1.3];
    L.add(M('hilton.pier'), lbox(cx - w[0] / 2, cx + w[0] / 2, yb + 0.7, yb + 2.0, cb - w[1] / 2, cb + w[1] / 2));
    const gw = alongA ? [0.9, 0.06] : [0.06, 0.9];
    const off = alongA ? [0, cb > -5 ? 0.46 : -0.46] : [cx < 5 ? -0.46 : 0.46, 0];
    L.add(M('hilton.podiumGlass'), lbox(cx + off[0] - gw[0] / 2, cx + off[0] + gw[0] / 2, yb + 0.95, yb + 1.8, cb + off[1] - gw[1] / 2, cb + off[1] + gw[1] / 2));
  };
  for (let i = 0; i < xsN.length - 1; i++) dormer((xsN[i] + xsN[i + 1]) / 2, -0.75, true);
  for (let i = 0; i < xsE.length - 1; i++) dormer(0.75, -H.eastBlockDepth + (xsE[i] + xsE[i + 1]) / 2, false);
  for (let i = 0; i < xsS1.length - 1; i++) dormer(eb - (xsS1[i] + xsS1[i + 1]) / 2, -H.eastBlockDepth + 0.75, true);
  // flat podium roof behind the mansard
  const roof = M('hilton.roof');
  L.add(roof, lbox(2.2, H.len, Y_MANSARD - 0.12, Y_MANSARD, H.tower.b1, -2.2));
  L.add(roof, lbox(2.2, H.tower.a0, Y_MANSARD - 0.12, Y_MANSARD, -H.eastBlockDepth + 2.2, -2.2));
  L.add(roof, lbox(H.tower.a0, eb, Y_MANSARD - 0.12, Y_MANSARD, -H.eastBlockDepth + 2.2, H.tower.b0));
  L.add(core, lbox(2.2, H.len - 0.5, Y_CORNICE, Y_MANSARD - 0.12, -H.depth + 0.5, -2.2));
  L.add(core, lbox(2.2, eb, Y_CORNICE, Y_MANSARD - 0.12, -H.eastBlockDepth + 2.2, -H.depth + 0.6));
}

/** Pilotis passage: soffit, tree columns with fan-vault capitals, portal on the south, vision wall. */
function pilotis(L, ctx) {
  const H = HILTON;
  const [p0, p1] = H.passage;
  const white = M('hilton.treeColumn');
  // soffit panel
  L.add(white, lbox(p0 - 1.0, p1 + 1.0, Y_PIER, Y_PIER + 0.3, -H.depth + 0.4, -0.4));
  // floor: pale radial paving field (decal on the plaza slab)
  const fl = new Tris();
  fl.quad([p0 + 0.9, Y0 + 0.006, -0.9], [p1 - 0.9, Y0 + 0.006, -0.9], [p1 - 0.9, Y0 + 0.006, -H.depth + 0.9], [p0 + 0.9, Y0 + 0.006, -H.depth + 0.9], [0, 1, 0]);
  L.add(M('hilton.pilotisFloor'), fl.build());

  // tree columns: brick octagon 2 m across on a white base, white fan vault with LED ribs
  const seg = ctx.quality === 'low' ? 8 : 8;
  const column = (a, b) => {
    const add = (mat, r0, r1, y0, y1) => {
      const g = new THREE.CylinderGeometry(r1, r0, y1 - y0, seg, 1, false);
      g.rotateY(Math.PI / 8);
      g.translate(a, (y0 + y1) / 2, b);
      L.add(mat, metricUV(g));
    };
    add(M('precinct.stoneBase'), 1.2, 1.2, Y0, Y0 + 0.8);
    add(M('precinct.brick'), 1.05, 1.05, Y0 + 0.8, 10.0);
    add(white, 1.2, 1.2, 10.0, 10.4);
    add(white, 1.1, 3.7, 10.4, Y_PIER); // fan vault
    for (let k = 0; k < 8; k++) {
      const ang = (k + 0.5) * (Math.PI / 4) + Math.PI / 8;
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      L.add(E('hilton.treeLed'), beam([a + c * 1.14, 10.45, b + s * 1.14], [a + c * 3.6, Y_PIER - 0.04, b + s * 3.6], 0.07, 0.05));
    }
  };
  for (const a of [31.2, 39.0]) for (const b of [-13.0, -21.4]) column(a, b);
  column(31.2, -4.6);

  // vision wall at the north end of the passage (faces south): brick base, dark frame, LED wall
  const V = VISION;
  const wa0 = 35.4;
  const wa1 = p1 + 0.2;
  L.add(M('precinct.brick'), lbox(wa0, wa1, Y0, 6.9, V.b + 0.15, V.b + 0.55));
  L.add(M('precinct.stoneBase'), lbox(wa0 - 0.05, wa1, 6.9, 7.05, V.b + 0.1, V.b + 0.55));
  L.add(M('precinct.visionFrame'), lbox(wa0, wa1, 7.05, Y_PIER, V.b + 0.2, V.b + 0.55));
  L.add(M('precinct.visionFrame'), lbox(V.a - V.w / 2 - 0.25, V.a + V.w / 2 + 0.25, V.y - 0.25, V.y + V.h + 0.25, V.b + 0.05, V.b + 0.2));
  L.add(visionMaterial(), lbox(V.a - V.w / 2, V.a + V.w / 2, V.y, V.y + V.h, V.b, V.b + 0.06));

  // south portal: tall white frame above the South Gate stair, glazed above the opening
  const fS = face(H.len, -H.depth, -1, 0, 0, -1, H.len - H.eastBlockLen);
  const x0 = H.len - p1; // 15.6
  const x1 = H.len - p0; // 39.0
  const whiteP = M('hilton.pier');
  L.add(whiteP, fS.box(x0, x0 + 1.9, Y0, Y_MANSARD + 1.0, -1.0, 0.45));
  L.add(whiteP, fS.box(x1 - 1.9, x1, Y0, Y_MANSARD + 1.0, -1.0, 0.45));
  L.add(whiteP, fS.box(x0, x1, Y_MANSARD - 0.6, Y_MANSARD + 1.0, -1.0, 0.45));
  L.add(whiteP, fS.box(x0 - 0.2, x1 + 0.2, Y_MANSARD + 1.0, Y_MANSARD + 1.5, -1.0, 0.75));
  L.add(M('hilton.podiumGlass'), fS.box(x0 + 1.9, x1 - 1.9, Y_PIER + 0.3, Y_MANSARD - 0.6, -0.5, -0.44));
  L.add(M('hilton.podiumGlow'), fS.box(x0 + 2.1, x1 - 2.1, Y_PIER + 0.5, Y_MANSARD - 0.8, -0.42, -0.405));
  L.add(whiteP, fS.box(x0 + 1.9, x1 - 1.9, Y_PIER - 0.1, Y_PIER + 0.3, -0.8, 0.2));
  const fr = M('hilton.podiumFrame');
  for (let k = 1; k < 10; k++) {
    const x = x0 + 1.9 + ((x1 - x0 - 3.8) * k) / 10;
    L.add(fr, fS.box(x - 0.05, x + 0.05, Y_PIER + 0.3, Y_MANSARD - 0.6, -0.47, -0.3));
  }
  for (const y of [16.2, 18.6]) L.add(fr, fS.box(x0 + 1.9, x1 - 1.9, y - 0.05, y + 0.05, -0.47, -0.3));
  // intermediate portal columns (white, slender) carrying the glazing
  for (const x of [x0 + 7.8, x1 - 7.8]) L.add(whiteP, fS.box(x - 0.45, x + 0.45, Y0, Y_PIER - 0.1, -0.8, 0.1));
}

/**
 * Material of the 500-inch outdoor vision. In the browser it shows a generated test card
 * (gradient, grid, "Music Terrace" lettering); in Node it is a plain emissive colour.
 * The geometry has metre UVs, so the texture transform maps the 11.1 x 6.2 m screen to 0..1.
 */
function visionMaterial() {
  if (typeof document === 'undefined') return E('precinct.vision');
  const V = VISION;
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 572;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, c.width, c.height);
  grad.addColorStop(0, '#2F52A0');
  grad.addColorStop(0.55, '#9B2A8F');
  grad.addColorStop(1, '#F06A8A');
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
  // fan of bars (abstracted eave and columns of the brand mark)
  g.fillStyle = 'rgba(255,255,255,0.9)';
  for (let i = 0; i < 17; i++) {
    const x = 262 + i * 30;
    const h = 150 - Math.abs(i - 8) * 7;
    g.fillRect(x, 250 - h, 12, h);
  }
  g.font = '600 92px Georgia, "Times New Roman", serif';
  g.textAlign = 'center';
  g.fillText('Music Terrace', c.width / 2, 372);
  g.font = '400 40px Georgia, "Times New Roman", serif';
  g.fillText('K-Arena Yokohama', c.width / 2, 440);
  // LED module seams
  g.strokeStyle = 'rgba(0,0,0,0.18)';
  g.lineWidth = 1;
  for (let x = 0; x < c.width; x += 64) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, c.height);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  // the screen faces −b: mirror u so the picture reads correctly from the passage
  tex.repeat.set(-1 / V.w, 1 / V.h);
  tex.offset.set((V.a + V.w / 2) / V.w, -V.y / V.h);
  const m = E('precinct.vision', { map: tex });
  m.userData.day = '#D8D8D8';
  m.userData.night = '#FFFFFF';
  m.color.set(m.userData.day);
  return m;
}

function tower(L) {
  const T = HILTON.tower;
  const len = T.a1 - T.a0; // 54.6 = 14 modules of 3.9 m
  const depth = T.b1 - T.b0; // 23.8
  const white = M('hilton.pier');
  const fr = M('hilton.frame');
  const sp = M('hilton.spandrel');
  // glass body
  L.add(M('hilton.glass'), lbox(T.a0 + 0.06, T.a1 - 0.06, Y_T0, Y_CROWN + 0.5, T.b0 + 0.06, T.b1 - 0.06));
  const F = rectFaces(T.a0, T.a1, T.b0, T.b1);
  const lit = M('hilton.windowLit');
  const dim = M('hilton.windowLitDim');

  const longFace = (f, id) => {
    const mod = len / 14;
    // spandrels and bronze transoms at every floor line (continuous behind the piers)
    for (let k = 0; k < FLOORS; k++) {
      const y = Y_T0 + k * FLOOR_H;
      L.add(sp, f.box(0, len, y, y + 1.15, 0, 0.07));
      L.add(fr, f.box(0, len, y + 1.15, y + 1.22, 0, 0.12));
      L.add(fr, f.box(0, len, y - 0.035, y + 0.035, 0, 0.12));
    }
    // piers: wide ones on the 7.8 m grid, slimmer ones between; corner piers wider
    for (let i = 0; i <= 14; i++) {
      const x = i * mod;
      const corner = i === 0 || i === 14;
      const w = corner ? 2.3 : i % 2 === 0 ? 1.55 : 1.3;
      const x0 = corner ? (i === 0 ? 0 : len - w) : x - w / 2;
      L.add(white, f.box(x0, x0 + w, Y_T0, Y_CROWN, 0, i % 2 === 0 ? 0.5 : 0.42));
      if (i % 2 === 0) L.add(E('hilton.pierLight'), f.box(x0 + w / 2 - 0.07, x0 + w / 2 + 0.07, Y_T0 + 1.5, Y_CROWN - 0.5, 0.5, 0.53));
    }
    // each glass strip: bronze centre mullion and jamb frames; lit panes at night
    for (let i = 0; i < 14; i++) {
      const xa = i * mod + (i === 0 ? 2.3 : i % 2 === 0 ? 0.775 : 0.65);
      const xb = (i + 1) * mod - (i === 13 ? 2.3 : (i + 1) % 2 === 0 ? 0.775 : 0.65);
      const xm = (xa + xb) / 2;
      L.add(fr, f.box(xm - 0.04, xm + 0.04, Y_T0, Y_CROWN, 0, 0.12));
      L.add(fr, f.box(xa, xa + 0.06, Y_T0, Y_CROWN, 0, 0.1));
      L.add(fr, f.box(xb - 0.06, xb, Y_T0, Y_CROWN, 0, 0.1));
      for (let k = 0; k < FLOORS; k++) {
        const y = Y_T0 + k * FLOOR_H;
        for (let h = 0; h < 2; h++) {
          const r = rnd(id, i, k, h);
          if (r > 0.42) continue;
          const p0 = h === 0 ? xa + 0.08 : xm + 0.06;
          const p1 = h === 0 ? xm - 0.06 : xb - 0.08;
          L.add(r < 0.24 ? lit : dim, f.box(p0, p1, y + 1.26, y + FLOOR_H - 0.06, 0.02, 0.045));
        }
      }
    }
  };
  longFace(F.north, 1);
  longFace(F.south, 2);

  const endFace = (f, id) => {
    // mostly solid light panels; two corridor-end window strips and a recessed centre panel
    const panel = M('hilton.endPanel');
    L.add(white, f.box(0, 2.3, Y_T0, Y_CROWN, 0, 0.5));
    L.add(white, f.box(depth - 2.3, depth, Y_T0, Y_CROWN, 0, 0.5));
    const s1 = [2.3, 4.5];
    const s2 = [depth - 4.5, depth - 2.3];
    L.add(panel, f.box(s1[1], s2[0], Y_T0, Y_CROWN, 0, 0.32));
    L.add(M('hilton.stoneBand'), f.box(depth / 2 - 3.2, depth / 2 + 3.2, Y_T0, Y_CROWN - 2, 0.32, 0.36));
    for (const x of [s1[1] + 0.02, depth / 2 - 3.25, depth / 2 + 3.2, s2[0] - 0.07]) L.add(white, f.box(x, x + 0.05, Y_T0, Y_CROWN, 0.3, 0.45));
    for (const [xa, xb] of [s1, s2]) {
      for (let k = 0; k < FLOORS; k++) {
        const y = Y_T0 + k * FLOOR_H;
        L.add(sp, f.box(xa, xb, y, y + 1.15, 0, 0.07));
        L.add(fr, f.box(xa, xb, y + 1.15, y + 1.22, 0, 0.12));
        if (rnd(id, xa | 0, k) < 0.3) L.add(dim, f.box(xa + 0.1, xb - 0.1, y + 1.26, y + FLOOR_H - 0.06, 0.02, 0.045));
      }
      L.add(fr, f.box((xa + xb) / 2 - 0.04, (xa + xb) / 2 + 0.04, Y_T0, Y_CROWN, 0, 0.12));
    }
    for (let k = 0; k <= FLOORS; k += 2) {
      const y = Y_T0 + k * FLOOR_H;
      L.add(white, f.box(s1[1], s2[0], y - 0.03, y + 0.03, 0.3, 0.34)); // panel joints every two storeys
    }
  };
  endFace(F.east, 3);
  endFace(F.west, 4);

  // crown: white band, projecting cap, parapet; roof and plant penthouse
  for (const f of [F.north, F.south, F.east, F.west]) {
    const l = f.length;
    L.add(white, f.box(-0.5, l + 0.5, Y_CROWN, HILTON.top - 0.7, 0, 0.5));
    L.add(white, f.box(-0.85, l + 0.85, HILTON.top - 0.7, HILTON.top, 0, 0.85));
    L.add(E('hilton.crownLight'), f.box(-0.8, l + 0.8, HILTON.top - 0.82, HILTON.top - 0.7, 0.5, 0.86));
  }
  L.add(M('hilton.roof'), lbox(T.a0 + 0.5, T.a1 - 0.5, HILTON.top - 1.3, HILTON.top - 1.2, T.b0 + 0.5, T.b1 - 0.5));
  L.add(M('hilton.endPanel'), lbox(T.a0 + 6, T.a1 - 6, HILTON.top - 1.3, HILTON.top + 3.6, T.b0 + 5, T.b1 - 5));
  // helipad "H" ring on the penthouse roof (ortho photo)
  {
    const g = new THREE.RingGeometry(5.2, 5.8, 32);
    g.rotateX(-Math.PI / 2);
    g.translate((T.a0 + T.a1) / 2 + 8, HILTON.top + 3.63, (T.b0 + T.b1) / 2);
    L.add(M('precinct.redSteel'), metricUV(g));
  }

  // "Hilton" signs: white block letters on a dark band at the west end of both long faces
  const sign = (f, atLeft) => {
    const cap = 2.6;
    const w = (textWidth('Hilton') * cap) / 7;
    const xStart = atLeft ? 3.4 : len - 3.4 - w;
    const yBase = Y_CROWN - 5.2;
    L.add(M('precinct.visionFrame'), f.box(xStart - 0.9, xStart + w + 0.9, yBase - 0.9, yBase + cap + 0.9, 0.5, 0.56));
    blockText('Hilton', cap, (x0, x1, y0, y1) => L.add(E('hilton.sign'), f.box(xStart + x0, xStart + x1, yBase + y0, yBase + y1, 0.56, 0.72)));
  };
  sign(F.north, false); // west end is on the right when seen from the north
  sign(F.south, true);
}

export function buildHilton(bag, ctx) {
  const L = new Bag();
  podium(L);
  pilotis(L, ctx);
  tower(L);
  bag.absorb(L, HF);
}

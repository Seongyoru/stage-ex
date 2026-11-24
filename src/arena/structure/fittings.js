// Reusable fittings of the concourses: gate door sets with their graphics, enclosed rooms
// with doors, kiosk shells, locker banks (instanced), toilet entrances, columns.
import * as THREE from 'three';
import { mesh } from '../../core/geom.js';
import { LEVEL_Y } from '../../core/envelope.js';
import { M } from './materials.js';
import { LAYER, beam3, tube3 } from './kit.js';
import { sign, signF } from './signs.js';

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Level whose storey contains height y. */
export function levelAt(y) {
  let lv = 1;
  for (const l of LEVELS) if (y >= LEVEL_Y[l] - 0.05) lv = l;
  return lv;
}

/**
 * Column that runs through several storeys: one box per storey so the floor selector can
 * hide it level by level. matOf(level) → material id.
 */
export function column(kit, f, p, q, size, y0, y1, matOf, levels = LEVELS) {
  const cuts = [y0, ...levels.map((l) => LEVEL_Y[l]).filter((y) => y > y0 + 0.05 && y < y1 - 0.05), y1];
  for (let i = 0; i < cuts.length - 1; i++) {
    const lv = levelAt(cuts[i] + 0.1);
    kit.box(f, p - size / 2, p + size / 2, q - size / 2, q + size / 2, cuts[i], cuts[i + 1], typeof matOf === 'function' ? matOf(lv) : matOf, lv);
  }
}

/**
 * Red double gate door in a wall. The wall runs along the frame axis `axis` ('p' or 'q')
 * through (p, q); `face` (±1) is the side (along the other axis) the public approaches
 * from, where the graphics go. Returns nothing; the wall itself must leave an opening of
 * `w` × `h` (use kit.wall openings).
 *   board: ±1 puts the gate board and the big stencil numerals on the wall beside the door
 *          (toward +axis or −axis); 0 = no board (boards can be placed separately).
 */
export function gateDoor(kit, f, level, { p, q, axis = 'p', face = 1, y, id, w = 2.4, h = 2.3, t = 0.4, board = 1, wallH = 3.2 }) {
  const along = axis === 'p' ? [1, 0] : [0, 1];
  const across = axis === 'p' ? [0, face] : [face, 0];
  const L = (u, v) => [p + along[0] * u + across[0] * v, q + along[1] * u + across[1] * v]; // u along the wall, v toward the public
  const bx = (u0, u1, v0, v1, y0, y1, m) => {
    const a = L(u0, v0);
    const b = L(u1, v1);
    kit.box(f, Math.min(a[0], b[0]), Math.max(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[1], b[1]), y0, y1, m, level);
  };
  // frame: jambs and head, slightly proud of the wall on both sides
  const d = t / 2 + 0.03;
  bx(-w / 2, -w / 2 + 0.09, -d, d, y, y + h, 'gateFrame');
  bx(w / 2 - 0.09, w / 2, -d, d, y, y + h, 'gateFrame');
  bx(-w / 2, w / 2, -d, d, y + h - 0.09, y + h, 'gateFrame');
  // transom panel above the leaves
  const hl = h - 0.09 - 0.42; // leaf height
  bx(-w / 2 + 0.09, w / 2 - 0.09, -0.03, 0.03, y + hl, y + h - 0.09, 'gateDoor');
  const [x, z] = f.pt(p, q);
  const [ux, uz] = f.dir(...along);
  const n = f.dir(...across);
  kit.gates.pairs.push({ id, level, x, y, z, u: [ux, 0, uz], n: [n[0], 0, n[1]],
    half: (w - 0.18) / 2, height: hl, angle: 0, open: false });
  // "GATE nnn" on the transom, public side
  const c = L(0, 0.034);
  const [cx, cz] = f.pt(c[0], c[1]);
  sign(kit, level, [cx, y + hl + 0.2, cz], n, 1.05, 0.34, { kind: 'text', lines: [`GATE ${id}`] }, 0.004);
  // exit lamp over the door
  bx(-0.3, 0.3, d, d + 0.05, y + h + 0.08, y + h + 0.26, 'exitSign');
  if (board) gateBoard(kit, f, level, { p: L(board * (w / 2 + 1.25), 0)[0], q: L(board * (w / 2 + 1.25), 0)[1], dp: across[0], dq: across[1], off: t / 2, y, id, wallH });
  // landscape information monitor on the other side of the door (official Lounge 5 / LEVEL 7 photos)
  if (board && wallH >= 3.05) {
    const sd = -board;
    bx(sd * (w / 2 + 0.45), sd * (w / 2 + 1.55), t / 2, t / 2 + 0.06, y + 1.55, y + 2.2, 'steelBlack');
    bx(sd * (w / 2 + 0.49), sd * (w / 2 + 1.51), t / 2 + 0.06, t / 2 + 0.064, y + 1.59, y + 2.16, 'gateMonitor');
  }
}

/** Gate board (seat-block plan, red footer) under the big stencil "GATE nnn", on a wall face. */
export function gateBoard(kit, f, level, { p, q, dp, dq, off = 0, y, id, wallH = 3.2 }) {
  const lv = Number(String(id)[0]);
  const tall = wallH >= 3.05;
  const bw = tall ? 1.6 : 1.4;
  const bh = tall ? 1.2 : 1.05;
  const by = y + (tall ? 0.85 : 0.62) + bh / 2;
  const P = p + dp * off;
  const Q = q + dq * off;
  // board: a 20 mm panel standing off the wall
  const [x, z] = f.pt(P + dp * 0.012, Q + dq * 0.012);
  const n = f.dir(dp, dq);
  const r = [n[1], -n[0]];
  const g = boardPanel(x, by, z, n, r, bw, bh, 0.02);
  kit.add('steelBlack', level, g);
  sign(kit, level, [x + n[0] * 0.012, by, z + n[1] * 0.012], n, bw - 0.04, bh - 0.04, { kind: 'board', level: lv }, 0.004);
  // big numerals above
  const gh = tall ? 0.78 : 0.5;
  const gy = by + bh / 2 + 0.12 + gh / 2;
  const [x2, z2] = f.pt(P, Q);
  if (gy + gh / 2 < y + wallH + 0.05) {
    sign(kit, level, [x2, gy, z2], n, gh * 1.3, gh, { kind: 'gate', id: String(id) });
    // two small spotlights on arms above the numerals
    const ys = Math.min(gy + gh / 2 + 0.3, y + wallH - 0.08);
    for (const e of [-0.35, 0.35]) {
      const px = x2 + r[0] * e;
      const pz = z2 + r[1] * e;
      kit.add('steelBlack', level, beam3([px, ys, pz], [px + n[0] * 0.45, ys, pz + n[1] * 0.45], 0.025, 0.025));
      kit.add('steelBlack', level, tube3([px + n[0] * 0.45, ys - 0.11, pz + n[1] * 0.45], [px + n[0] * 0.45, ys + 0.02, pz + n[1] * 0.45], 0.04, 8, true));
      kit.add('spot', level, tube3([px + n[0] * 0.45, ys - 0.118, pz + n[1] * 0.45], [px + n[0] * 0.45, ys - 0.11, pz + n[1] * 0.45], 0.032, 8, true));
    }
  }
}

function boardPanel(x, y, z, n, r, w, h, t) {
  const g = new THREE.BoxGeometry(w, h, t);
  // local +Z → n, local +X → r
  const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(r[0], 0, r[1]), new THREE.Vector3(0, 1, 0), new THREE.Vector3(n[0], 0, n[1]));
  m.setPosition(x, y, z);
  g.applyMatrix4(m);
  return g;
}

/**
 * Enclosed room: walls on the inside of the rectangle p0..p1 × q0..q1, optional lid.
 *   doors: [{ side: 'p0' | 'p1' | 'q0' | 'q1', at, w = 0.95, h = 2.1, leaf = true, mat }]  (`at` = coordinate along that side)
 *   skip:  sides not to build (they are provided by a neighbouring wall)
 */
export function room(kit, f, level, p0, p1, q0, q1, y0, h, matId, { t = 0.15, doors = [], lid = true, lidMat = 'bulkhead', skip = [], inner = null } = {}) {
  const sides = {
    q0: [p0, q0 + t / 2, p1, q0 + t / 2],
    q1: [p0, q1 - t / 2, p1, q1 - t / 2],
    p0: [p0 + t / 2, q0, p0 + t / 2, q1],
    p1: [p1 - t / 2, q0, p1 - t / 2, q1],
  };
  for (const [name, [pa, qa, pb, qb]] of Object.entries(sides)) {
    if (skip.includes(name)) continue;
    const horiz = name[0] === 'q';
    const ops = doors.filter((d) => d.side === name).map((d) => ({ at: horiz ? d.at - pa : d.at - qa, w: d.w ?? 0.95, h: d.h ?? 2.1 }));
    kit.wall(f, pa, qa, pb, qb, y0, y0 + h, t, matId, level, ops);
    for (const d of doors.filter((dd) => dd.side === name && dd.leaf !== false)) {
      const w = d.w ?? 0.95;
      const hh = d.h ?? 2.1;
      if (horiz) kit.box(f, d.at - w / 2, d.at + w / 2, qa - 0.025, qa + 0.025, y0, y0 + hh, d.mat || 'door', level);
      else kit.box(f, pa - 0.025, pa + 0.025, d.at - w / 2, d.at + w / 2, y0, y0 + hh, d.mat || 'door', level);
      // lever handle plate
      const hx = d.at + w / 2 - 0.12;
      if (horiz) kit.box(f, hx - 0.02, hx + 0.02, qa - 0.05, qa + 0.05, y0 + 0.95, y0 + 1.1, 'stainless', level);
      else kit.box(f, pa - 0.05, pa + 0.05, hx - 0.02, hx + 0.02, y0 + 0.95, y0 + 1.1, 'stainless', level);
    }
  }
  if (lid) kit.box(f, p0, p1, q0, q1, y0 + h, y0 + h + 0.1, lidMat, level);
  if (inner) kit.box(f, p0 + t, p1 - t, q0 + t, q1 - t, y0 + 0.001, y0 + 0.012, inner, level);
}

/**
 * Doorless toilet entrance: an opening in a wall along `axis` at (p, q) with a wallpapered
 * baffle wall behind it (`into` = ±1, direction along the other axis into the room).
 */
export function wcEntrance(kit, f, level, { p, q, axis = 'p', into = 1, y, w = 1.5, h = 2.2, t = 0.2, icon = 'wc', caption = null, wallMat = 'wcWall' }) {
  const along = axis === 'p' ? [1, 0] : [0, 1];
  const across = axis === 'p' ? [0, into] : [into, 0];
  const L = (u, v) => [p + along[0] * u + across[0] * v, q + along[1] * u + across[1] * v];
  const bx = (u0, u1, v0, v1, y0, y1, m) => {
    const a = L(u0, v0);
    const b = L(u1, v1);
    kit.box(f, Math.min(a[0], b[0]), Math.max(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[1], b[1]), y0, y1, m, level);
  };
  // baffle wall and the two short return walls of the lobby
  bx(-w / 2 - 0.9, w / 2 + 0.3, 1.5, 1.62, y, y + h + 0.2, wallMat);
  bx(-w / 2 - 1.0, -w / 2 - 0.9, 0.12, 1.62, y, y + h + 0.2, wallMat);
  bx(w / 2 + 1.3, w / 2 + 1.4, 0.12, 2.8, y, y + h + 0.2, wallMat);
  bx(-w / 2 - 1.0, w / 2 + 1.4, 0.12, 2.8, y + h + 0.2, y + h + 0.26, 'bulkhead');
  // stainless reveal of the opening
  bx(-w / 2 - 0.04, -w / 2, -0.12, 0.12, y, y + h, 'stainless');
  bx(w / 2, w / 2 + 0.04, -0.12, 0.12, y, y + h, 'stainless');
  // pictogram beside the opening, on the public face
  const c = L(-w / 2 - 0.75, -t / 2);
  signF(kit, f, level, c[0], c[1], y + 1.65, -across[0], -across[1], 0.62, caption ? 0.86 : 0.62, { kind: 'picto', icon, caption });
}

/**
 * Kiosk shell (counter and fit-out belong to arena/venues): a recess `w` wide and `depth`
 * deep with a black canopy fascia and four downlights. The front line runs along `axis`
 * through (p, q) (centre of the opening); `into` = ±1 points into the recess.
 * The descriptor is stored in kit.info.kiosks for the venues module.
 */
export function kioskShell(kit, f, level, { id, p, q, axis = 'p', into = 1, y, w = 8.5, depth = 2.6, h = 2.4, top = null, wallMat = 'kioskShell' }) {
  const along = axis === 'p' ? [1, 0] : [0, 1];
  const across = axis === 'p' ? [0, into] : [into, 0];
  const L = (u, v) => [p + along[0] * u + across[0] * v, q + along[1] * u + across[1] * v];
  const bx = (u0, u1, v0, v1, y0, y1, m) => {
    const a = L(u0, v0);
    const b = L(u1, v1);
    kit.box(f, Math.min(a[0], b[0]), Math.max(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[1], b[1]), y0, y1, m, level);
  };
  const yTop = top ?? y + h + 0.5;
  bx(-w / 2 - 0.15, -w / 2, 0, depth, y, yTop, wallMat); // side walls
  bx(w / 2, w / 2 + 0.15, 0, depth, y, yTop, wallMat);
  bx(-w / 2 - 0.15, w / 2 + 0.15, depth, depth + 0.15, y, yTop, wallMat); // back wall
  bx(-w / 2, w / 2, 0.02, depth, y + h, y + h + 0.08, 'kioskCanopy'); // ceiling of the recess
  // canopy fascia projecting 0.45 m over the queue, with four downlights
  const fh = Math.min(0.42, yTop - (y + h));
  bx(-w / 2 - 0.15, w / 2 + 0.15, -0.45, 0.02, y + h, y + h + fh, 'kioskCanopy');
  for (let i = 0; i < 4; i++) {
    const u = -w / 2 + (w * (i + 0.5)) / 4;
    bx(u - 0.06, u + 0.06, -0.3, -0.18, y + h - 0.012, y + h, 'spot');
  }
  // "DRINK" pictogram on the canopy fascia
  const c = L(-w / 2 + 0.55, -0.452);
  signF(kit, f, level, c[0], c[1], y + h + fh / 2, -across[0], -across[1], 0.5, Math.min(0.34, fh - 0.04), { kind: 'picto', icon: 'drink' });
  const c2 = L(-w / 2 + 1.55, -0.452);
  signF(kit, f, level, c2[0], c2[1], y + h + fh / 2, -across[0], -across[1], 1.3, Math.min(0.3, fh - 0.06), { kind: 'text', lines: [`DRINK ${id}`] });
  const [x, z] = f.pt(p, q);
  const n = f.dir(-across[0], -across[1]);
  (kit.info.kiosks ||= []).push({ id, level, position: [+x.toFixed(2), +y.toFixed(2), +z.toFixed(2)], facing: [+n[0].toFixed(3), +n[1].toFixed(3)], width: w, depth, height: h });
}

/** Fire-hydrant cabinet with its red lamp, on a wall face at (p, q) facing the local direction (dp, dq). */
export function hydrant(kit, f, level, p, q, dp, dq, y) {
  const along = dp !== 0 ? [0, 1] : [1, 0];
  const bx = (u0, u1, v0, v1, y0, y1, m) => {
    const a = [p + along[0] * u0 + dp * v0, q + along[1] * u0 + dq * v0];
    const b = [p + along[0] * u1 + dp * v1, q + along[1] * u1 + dq * v1];
    kit.box(f, Math.min(a[0], b[0]), Math.max(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[1], b[1]), y0, y1, m, level);
  };
  bx(-0.38, 0.38, 0, 0.16, y + 0.25, y + 1.55, 'hydrantBox');
  bx(-0.32, 0.32, 0.16, 0.166, y + 0.32, y + 1.2, 'stainless');
  bx(-0.05, 0.05, 0.16, 0.22, y + 1.32, y + 1.42, 'fireLamp');
}

/**
 * Row of toilet cubicles backing onto a wall: partitions, fronts with a door each.
 * The row runs along `axis` from `from` to `to`; `at` = wall line, `face` (±1) = side of the room.
 */
export function cubicles(kit, f, level, { axis = 'p', from, to, at, face = 1, y, n = null, depth = 1.4, h = 1.95 }) {
  const len = Math.abs(to - from);
  const count = n ?? Math.max(1, Math.floor(len / 0.92));
  const pitch = len / count;
  const lo = Math.min(from, to);
  const bx = (u0, u1, v0, v1, y0, y1, m) => {
    const a0 = at + face * v0;
    const a1 = at + face * v1;
    if (axis === 'p') kit.box(f, u0, u1, Math.min(a0, a1), Math.max(a0, a1), y0, y1, m, level);
    else kit.box(f, Math.min(a0, a1), Math.max(a0, a1), u0, u1, y0, y1, m, level);
  };
  for (let i = 0; i <= count; i++) bx(lo + i * pitch - 0.015, lo + i * pitch + 0.015, 0.02, depth, y + 0.12, y + h, 'wcPartition');
  for (let i = 0; i < count; i++) {
    const u = lo + i * pitch;
    bx(u + 0.015, u + 0.14, depth - 0.03, depth, y + 0.12, y + h, 'wcPartition'); // pilaster
    bx(u + 0.15, u + pitch - 0.02, depth - 0.045, depth - 0.015, y + 0.14, y + h - 0.04, 'wcPartition'); // door
    bx(u + pitch - 0.14, u + pitch - 0.1, depth, depth + 0.012, y + 0.98, y + 1.06, 'stainless'); // indicator / pull
  }
  bx(lo, lo + len, depth - 0.03, depth, y + h, y + h + 0.06, 'stainless'); // head rail
}

/** Vanity: counter on a wall with a mirror band and a cove light above (toilet photo: grey solid-surface counter, oval mirrors). */
export function vanity(kit, f, level, { axis = 'p', from, to, at, face = 1, y }) {
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  const bx = (u0, u1, v0, v1, y0, y1, m) => {
    const a0 = at + face * v0;
    const a1 = at + face * v1;
    if (axis === 'p') kit.box(f, u0, u1, Math.min(a0, a1), Math.max(a0, a1), y0, y1, m, level);
    else kit.box(f, Math.min(a0, a1), Math.max(a0, a1), u0, u1, y0, y1, m, level);
  };
  bx(lo, hi, 0, 0.55, y + 0.78, y + 0.84, 'wcCounter');
  bx(lo, hi, 0, 0.5, y + 0.3, y + 0.78, 'wcCounter');
  const n = Math.max(1, Math.floor((hi - lo) / 0.9));
  for (let i = 0; i < n; i++) {
    const u = lo + ((i + 0.5) * (hi - lo)) / n;
    bx(u - 0.28, u + 0.28, 0, 0.02, y + 1.05, y + 1.85, 'wcMirror');
    bx(u - 0.2, u + 0.2, 0.12, 0.46, y + 0.84, y + 0.86, 'stainless'); // basin rim
  }
  bx(lo, hi, 0, 0.1, y + 1.98, y + 2.02, 'ledWhite');
}

// --- lockers (instanced) ---------------------------------------------------------------------------
const lockerInst = new Map(); // level → Matrix4[]
/**
 * A bank of 5-tier coin lockers (0.9 m modules of 3 columns) along the frame axis from
 * `from` to `to`, backs on the line `at`, fronts facing `face` (±1 along the other axis).
 */
export function lockers(kit, f, level, { axis = 'p', from, to, at, face = 1, y }) {
  const n = Math.max(1, Math.floor(Math.abs(to - from) / 0.9));
  const start = Math.min(from, to) + (Math.abs(to - from) - n * 0.9) / 2;
  const list = lockerInst.get(level) || [];
  lockerInst.set(level, list);
  const front = f.dir(axis === 'p' ? 0 : face, axis === 'p' ? face : 0);
  const Zv = new THREE.Vector3(front[0], 0, front[1]);
  const Yv = new THREE.Vector3(0, 1, 0);
  const Xv = new THREE.Vector3().crossVectors(Yv, Zv);
  for (let i = 0; i < n; i++) {
    const c = start + (i + 0.5) * 0.9;
    const [x, z] = axis === 'p' ? f.pt(c, at) : f.pt(at, c);
    const m = new THREE.Matrix4().makeBasis(Xv, Yv, Zv);
    m.setPosition(x, y, z);
    list.push(m);
  }
  kit.info.lockers = (kit.info.lockers || 0) + n * 15;
}

function lockerGeometries(low) {
  // module: 0.9 wide, 0.45 deep (front at local +Z = 0.45), 1.86 high incl. 60 mm plinth
  const body = [];
  const grips = [];
  // boxes without their back face (the −Z face is never seen): 10 triangles
  const push = (list, cx, cy, cz, sx, sy, sz, back = false) => {
    const g = new THREE.BoxGeometry(sx, sy, sz).toNonIndexed();
    g.translate(cx, cy, cz);
    if (!back) for (const k of ['position', 'normal', 'uv']) g.setAttribute(k, new THREE.BufferAttribute(g.attributes[k].array.slice(0, 30 * g.attributes[k].itemSize), g.attributes[k].itemSize));
    list.push(g);
  };
  push(body, 0, 0.03, 0.2, 0.9, 0.06, 0.4);
  push(body, 0, 0.96, 0.215, 0.9, 1.8, 0.43, true);
  for (let c = 0; c < 3; c++) {
    for (let r = 0; r < 5; r++) {
      const cx = -0.3 + c * 0.3;
      const cy = 0.06 + 0.18 + r * 0.36;
      if (!low) push(body, cx, cy, 0.44, 0.275, 0.335, 0.02); // door
      push(grips, cx + 0.06, cy + 0.02, low ? 0.442 : 0.462, 0.085, 0.11, 0.024); // ivory key grip
    }
  }
  const mergeAll = (list) => {
    const pos = [];
    const nor = [];
    const uv = [];
    for (const g of list) {
      pos.push(...g.attributes.position.array);
      nor.push(...g.attributes.normal.array);
      uv.push(...g.attributes.uv.array);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return g;
  };
  return [mergeAll(body), mergeAll(grips)];
}

export function finishLockers(kit) {
  if (lockerInst.size === 0) return;
  const [body, grips] = lockerGeometries(kit.quality === 'low');
  for (const [level, list] of lockerInst) {
    for (const [geo, matId, nm] of [
      [body, 'locker', 'bodies'],
      [grips, 'lockerGrip', 'grips'],
    ]) {
      const im = new THREE.InstancedMesh(geo, M(matId), list.length);
      list.forEach((m, i) => im.setMatrixAt(i, m));
      im.instanceMatrix.needsUpdate = true;
      im.name = `structure L${level} locker ${nm}`;
      im.userData.layer = LAYER;
      im.userData.level = level;
      im.castShadow = false;
      im.receiveShadow = true;
      im.computeBoundingSphere();
      kit.extra.push(im);
    }
  }
  lockerInst.clear();
}

export { mesh };

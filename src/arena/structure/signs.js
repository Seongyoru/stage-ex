// Stencil wayfinding of the concourses: gate numerals, gate boards, level signs on the
// columns, pictogram tiles, the foyer mural and the directory wall. Everything is drawn
// into ONE canvas atlas (white paint on transparent, cut out with alphaTest), so all signs
// of a level are a single draw call. DOM-guarded: in Node the quads keep a plain material.
//
// Fact sheet §8 (signage system): DIN-style condensed type with a stencil cut, painted
// directly on the charcoal mortar walls and column casings; current level numeral in red;
// gate boards = black board with the seat-block plan and a red footer (navy on LEVEL 7).
import * as THREE from 'three';
import { M } from './materials.js';

const ATLAS_W = 4096;
const ATLAS_H = 2048;
const PX_PER_M = 200;
const FONT = 'Bahnschrift, "DIN Alternate", "DIN Condensed", "Roboto Condensed", "Arial Narrow", Arial, sans-serif';
const WHITE = '#F2F1EC';
const RED = '#E0251F';

const cells = new Map(); // key → { x, y, w, h, spec }
const pending = []; // quads waiting for their atlas cell
let packedHeight = 0;

function request(key, wpx, hpx, spec) {
  let c = cells.get(key);
  if (!c) {
    c = { x: 0, y: 0, w: Math.min(ATLAS_W - 4, Math.ceil(wpx / 16) * 16), h: Math.ceil(hpx / 16) * 16, spec, placed: false };
    cells.set(key, c);
  }
  return c;
}

/** Shelf-pack all requested cells, tallest first. */
function pack() {
  const list = [...cells.values()].sort((a, b) => b.h - a.h || b.w - a.w);
  let x = 2;
  let y = 2;
  let shelf = 0;
  for (const c of list) {
    if (x + c.w + 2 > ATLAS_W) {
      x = 2;
      y += shelf + 2;
      shelf = 0;
    }
    c.x = x;
    c.y = y;
    c.placed = y + c.h <= ATLAS_H;
    if (!c.placed) console.warn('structure/signs: atlas is full, sign dropped:', JSON.stringify(c.spec));
    x += c.w + 2;
    shelf = Math.max(shelf, c.h);
  }
  packedHeight = y + shelf;
  return packedHeight;
}

/**
 * Add a sign quad. `c` = world centre [x, y, z], `n` = outward normal in plan [nx, nz]
 * (the side the sign is read from), w × h in metres. `spec` describes the artwork:
 *   { kind: 'gate', id }  { kind: 'board', level }  { kind: 'level', level, lines: [...] }
 *   { kind: 'picto', icon, caption }  { kind: 'text', lines: [...], color }  { kind: 'mural' }  { kind: 'directory' }
 * The quads are created by flushSigns(kit), once all cells are known and packed.
 */
export function sign(kit, level, c, n, w, h, spec, lift = 0.014) {
  const key = JSON.stringify(spec) + `|${w.toFixed(2)}x${h.toFixed(2)}`;
  const scale = spec.kind === 'mural' ? 150 : spec.kind === 'board' ? 230 : PX_PER_M;
  const cell = request(key, w * scale, h * scale, spec);
  pending.push({ level, c, n, w, h, lift, cell });
}

/** Pack the atlas and hand the sign quads to the kit (call before kit.build). */
export function flushSigns(kit) {
  pack();
  for (const { level, c, n, w, h, lift, cell } of pending) {
    if (!cell.placed) continue;
    const u0 = cell.x / ATLAS_W;
    const u1 = (cell.x + cell.w) / ATLAS_W;
    const v1 = 1 - cell.y / ATLAS_H;
    const v0 = 1 - (cell.y + cell.h) / ATLAS_H;
    const l = Math.hypot(n[0], n[1]) || 1;
    const nx = n[0] / l;
    const nz = n[1] / l;
    // reading direction r = up × n
    const rx = nz;
    const rz = -nx;
    const cx = c[0] + nx * lift;
    const cz = c[2] + nz * lift;
    const BL = [cx - (rx * w) / 2, c[1] - h / 2, cz - (rz * w) / 2];
    const BR = [cx + (rx * w) / 2, c[1] - h / 2, cz + (rz * w) / 2];
    const TR = [cx + (rx * w) / 2, c[1] + h / 2, cz + (rz * w) / 2];
    const TL = [cx - (rx * w) / 2, c[1] + h / 2, cz - (rz * w) / 2];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([...BL, ...BR, ...TR, ...BL, ...TR, ...TL], 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute([nx, 0, nz, nx, 0, nz, nx, 0, nz, nx, 0, nz, nx, 0, nz, nx, 0, nz], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1], 2));
    kit.add('signs', level, g);
  }
  pending.length = 0;
}

/** Sign on a wall given in a plan frame: at (p, q), height yc, facing the local direction (dp, dq). */
export function signF(kit, f, level, p, q, yc, dp, dq, w, h, spec) {
  const [x, z] = f.pt(p, q);
  sign(kit, level, [x, yc, z], f.dir(dp, dq), w, h, spec);
}

// --- artwork --------------------------------------------------------------------------------------
function stencilText(ctx, text, x, y, px, { align = 'center', color = WHITE, weight = 700, spacing = 0.04, cut = true } = {}) {
  ctx.save();
  ctx.font = `${weight} ${px}px ${FONT}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width + px * spacing);
  const total = widths.reduce((a, b) => a + b, 0) - px * spacing;
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  for (let i = 0; i < chars.length; i++) {
    ctx.textAlign = 'left';
    ctx.fillText(chars[i], cx, y);
    if (cut && px >= 40 && /[0-9A-Z]/.test(chars[i]) && !/[1IJLT7]/.test(chars[i])) {
      // stencil bridges: one thin vertical gap through the middle of the glyph
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      const gw = Math.max(2, px * 0.055);
      const w0 = widths[i] - px * spacing;
      ctx.fillRect(cx + w0 / 2 - gw / 2, y - px * 0.86, gw, px * 0.22);
      ctx.fillRect(cx + w0 / 2 - gw / 2, y - px * 0.2, gw, px * 0.24);
      ctx.restore();
    }
    cx += widths[i];
  }
  ctx.restore();
  return total;
}

function arrow(ctx, x, y, len, dir, lw, color = WHITE) {
  // dir: angle in radians, 0 = pointing right, counter-clockwise positive (screen y down)
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-dir);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';
  ctx.beginPath();
  ctx.moveTo(-len / 2, 0);
  ctx.lineTo(len / 2, 0);
  ctx.moveTo(len / 2 - len * 0.38, -len * 0.38);
  ctx.lineTo(len / 2, 0);
  ctx.lineTo(len / 2 - len * 0.38, len * 0.38);
  ctx.stroke();
  ctx.restore();
}

function person(ctx, x, y, h, color, skirt) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y + h * 0.1, h * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  if (skirt) {
    ctx.moveTo(x - h * 0.1, y + h * 0.24);
    ctx.lineTo(x + h * 0.1, y + h * 0.24);
    ctx.lineTo(x + h * 0.22, y + h * 0.68);
    ctx.lineTo(x - h * 0.22, y + h * 0.68);
  } else {
    ctx.rect(x - h * 0.14, y + h * 0.24, h * 0.28, h * 0.42);
  }
  ctx.fill();
  ctx.fillRect(x - h * 0.11, y + h * 0.62, h * 0.09, h * 0.38);
  ctx.fillRect(x + h * 0.02, y + h * 0.62, h * 0.09, h * 0.38);
}

function icon(ctx, name, cx, cy, s, color = WHITE) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = s * 0.07;
  ctx.lineJoin = 'miter';
  const L = (pts) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(cx + x * s, cy + y * s) : ctx.moveTo(cx + x * s, cy + y * s)));
    ctx.stroke();
  };
  if (name === 'wc') {
    person(ctx, cx - s * 0.24, cy - s * 0.45, s * 0.9, '#F0456A', true);
    person(ctx, cx + s * 0.24, cy - s * 0.45, s * 0.9, '#3FA0F0', false);
  } else if (name === 'women') {
    person(ctx, cx, cy - s * 0.45, s * 0.9, '#F0456A', true);
  } else if (name === 'men') {
    person(ctx, cx, cy - s * 0.45, s * 0.9, '#3FA0F0', false);
  } else if (name === 'accessible') {
    ctx.beginPath();
    ctx.arc(cx - s * 0.05, cy - s * 0.36, s * 0.09, 0, Math.PI * 2);
    ctx.fill();
    L([[-0.05, -0.24], [-0.05, 0.1], [0.2, 0.1], [0.32, 0.38]]);
    L([[-0.05, -0.08], [0.18, -0.08]]);
    ctx.beginPath();
    ctx.arc(cx - s * 0.02, cy + s * 0.18, s * 0.24, Math.PI * 0.15, Math.PI * 1.35);
    ctx.stroke();
  } else if (name === 'stairs' || name === 'stairsDown') {
    const pts = [];
    for (let i = 0; i < 5; i++) pts.push([-0.4 + i * 0.2, 0.35 - i * 0.18], [-0.4 + (i + 1) * 0.2, 0.35 - i * 0.18]);
    if (name === 'stairsDown') pts.forEach((p) => (p[0] = -p[0]));
    L(pts);
  } else if (name === 'escalator') {
    L([[-0.45, 0.3], [-0.2, 0.3], [0.2, -0.2], [0.45, -0.2]]);
    L([[-0.45, 0.42], [-0.15, 0.42], [0.25, -0.08], [0.45, -0.08]]);
    ctx.beginPath();
    ctx.arc(cx - s * 0.02, cy - s * 0.3, s * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - s * 0.08, cy - s * 0.2, s * 0.12, s * 0.26);
  } else if (name === 'lift') {
    ctx.strokeRect(cx - s * 0.32, cy - s * 0.36, s * 0.64, s * 0.76);
    person(ctx, cx - s * 0.14, cy - s * 0.14, s * 0.5, color, false);
    person(ctx, cx + s * 0.14, cy - s * 0.14, s * 0.5, color, false);
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.1, cy - s * 0.42);
    ctx.lineTo(cx, cy - s * 0.54);
    ctx.lineTo(cx + s * 0.1, cy - s * 0.42);
    ctx.fill();
  } else if (name === 'locker') {
    ctx.strokeRect(cx - s * 0.3, cy - s * 0.2, s * 0.6, s * 0.56);
    ctx.fillRect(cx - s * 0.14, cy + s * 0.0, s * 0.28, s * 0.22);
    L([[-0.08, 0.0], [-0.08, -0.08], [0.08, -0.08], [0.08, 0.0]]);
    L([[-0.3, -0.34], [0.2, -0.34]]);
    ctx.beginPath();
    ctx.arc(cx + s * 0.27, cy - s * 0.34, s * 0.07, 0, Math.PI * 2);
    ctx.stroke();
  } else if (name === 'smoking') {
    ctx.fillRect(cx - s * 0.42, cy + s * 0.14, s * 0.62, s * 0.12);
    ctx.fillRect(cx + s * 0.25, cy + s * 0.14, s * 0.05, s * 0.12);
    ctx.fillRect(cx + s * 0.35, cy + s * 0.14, s * 0.05, s * 0.12);
    L([[0.22, 0.02], [0.22, -0.1], [0.05, -0.1], [0.05, -0.26]]);
  } else if (name === 'nursing') {
    ctx.beginPath();
    ctx.arc(cx, cy - s * 0.26, s * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, cy + s * 0.18, s * 0.2, s * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
    L([[0.3, -0.42], [0.3, -0.12]]);
    L([[0.22, -0.34], [0.38, -0.34]]);
  } else if (name === 'firstaid') {
    ctx.fillStyle = '#35B56A';
    ctx.fillRect(cx - s * 0.42, cy - s * 0.42, s * 0.84, s * 0.84);
    ctx.fillStyle = WHITE;
    ctx.fillRect(cx - s * 0.1, cy - s * 0.3, s * 0.2, s * 0.6);
    ctx.fillRect(cx - s * 0.3, cy - s * 0.1, s * 0.6, s * 0.2);
  } else if (name === 'drink') {
    L([[-0.26, -0.22], [0.02, -0.22], [-0.03, 0.4], [-0.21, 0.4], [-0.26, -0.22]]);
    L([[-0.08, -0.22], [-0.02, -0.46], [0.1, -0.46]]);
    L([[0.12, 0.4], [0.22, -0.12], [0.4, -0.12], [0.34, 0.4], [0.12, 0.4]]);
  }
  ctx.restore();
}

const STAND = { 1: ['ARENA', 'アリーナ'], 3: ['LOWER STAND', 'ロアースタンド'], 4: ['LOCKER WC', ''], 5: ['MIDDLE STAND', 'ミドルスタンド'], 6: ['VIP', ''], 7: ['UPPER STAND', 'アッパースタンド'] };

function draw(ctx, cell) {
  const { x, y, w, h, spec } = cell;
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();
  const k = spec.kind;
  if (k === 'gate') {
    stencilText(ctx, 'GATE', w / 2, h * 0.3, h * 0.26, { color: '#D9D8D3', spacing: 0.1 });
    stencilText(ctx, String(spec.id), w / 2, h * 0.93, h * 0.62, { spacing: 0.06 });
  } else if (k === 'door') {
    stencilText(ctx, 'GATE', w * 0.5, h * 0.36, h * 0.3, { spacing: 0.08, cut: false });
    stencilText(ctx, String(spec.id), w * 0.5, h * 0.95, h * 0.56, { spacing: 0.05 });
  } else if (k === 'board') {
    const lv = spec.level;
    ctx.fillStyle = '#1B1B1E';
    ctx.fillRect(0, 0, w, h);
    stencilText(ctx, 'STAGE', w / 2, h * 0.1, h * 0.06, { cut: false });
    ctx.font = `500 ${h * 0.035}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = WHITE;
    ctx.fillText('ステージ', w / 2, h * 0.145);
    // seat-block plan: light aisles, dark seat blocks with the seat-number ranges
    ctx.fillStyle = '#ECEBE6';
    ctx.fillRect(w * 0.1, h * 0.19, w * 0.8, h * 0.6);
    const blocks = lv === 1 ? 4 : 4;
    const base = 9;
    for (let r = 0; r < 2; r++) {
      for (let b = 0; b < blocks; b++) {
        const bx = w * (0.13 + b * 0.19);
        const by = h * (0.21 + r * 0.29);
        ctx.fillStyle = '#3A3B3E';
        ctx.fillRect(bx, by, w * 0.165, h * 0.26);
        ctx.strokeStyle = '#55565A';
        ctx.lineWidth = 1;
        for (let i = 1; i < 9; i++) {
          ctx.beginPath();
          ctx.moveTo(bx, by + (h * 0.26 * i) / 9);
          ctx.lineTo(bx + w * 0.165, by + (h * 0.26 * i) / 9);
          ctx.stroke();
        }
        const a = Math.max(1, base + b * 20);
        stencilText(ctx, `${a}-${a + 19}`, bx + w * 0.0825, by + h * 0.15, h * 0.05, { cut: false });
      }
    }
    ctx.fillStyle = RED;
    ctx.fillRect(w * 0.44, h * 0.8, w * 0.12, h * 0.07);
    stencilText(ctx, 'Here', w / 2, h * 0.848, h * 0.045, { cut: false });
    ctx.fillStyle = lv === 7 ? '#1E3FB0' : '#C4201C';
    ctx.fillRect(0, h * 0.885, w, h * 0.115);
    stencilText(ctx, STAND[lv][0], w / 2, h * 0.955, h * 0.062, { cut: false });
    ctx.font = `500 ${h * 0.03}px ${FONT}`;
    ctx.fillStyle = WHITE;
    ctx.textAlign = 'center';
    ctx.fillText(STAND[lv][1], w / 2, h * 0.99);
  } else if (k === 'level') {
    // column sign: LEVEL / big numeral / stand name / arrow line(s)
    const lv = spec.level;
    let yy = h * 0.1;
    stencilText(ctx, 'LEVEL', w / 2, yy, h * 0.075, { color: '#D9D8D3', spacing: 0.1, cut: false });
    yy += h * 0.36;
    stencilText(ctx, String(lv), w / 2, yy, h * 0.38, { color: spec.here ? RED : WHITE });
    yy += h * 0.11;
    for (const part of STAND[lv][0].split(' ')) {
      stencilText(ctx, part, w / 2, yy, h * 0.085, { cut: false });
      yy += h * 0.09;
    }
    yy += h * 0.035;
    for (const line of spec.lines || []) {
      const m = /^(<-|->)?\s*(.*?)\s*(<-|->)?$/.exec(line);
      const txt = m[2];
      // text and arrow are centred together
      const al = h * 0.05;
      const gap = h * 0.022;
      const shift = m[1] === '<-' ? (al + gap) / 2 : m[3] === '->' ? -(al + gap) / 2 : 0;
      const tw = stencilText(ctx, txt, w / 2 + shift, yy, h * 0.07, { cut: false });
      if (m[1] === '<-') arrow(ctx, w / 2 + shift - tw / 2 - gap - al / 2, yy - h * 0.025, al, Math.PI, h * 0.012);
      if (m[3] === '->') arrow(ctx, w / 2 + shift + tw / 2 + gap + al / 2, yy - h * 0.025, al, 0, h * 0.012);
      yy += h * 0.095;
    }
  } else if (k === 'way') {
    // diagonal arrow + "LEVEL n / NAME" (stairs down to the arena, up to the stands)
    const lv = spec.level;
    arrow(ctx, w * 0.5, h * 0.13, h * 0.13, spec.dir ?? Math.PI * 1.25, h * 0.022);
    stencilText(ctx, 'LEVEL', w / 2, h * 0.34, h * 0.075, { color: '#D9D8D3', spacing: 0.1, cut: false });
    stencilText(ctx, String(lv), w / 2, h * 0.68, h * 0.34);
    let yy = h * 0.8;
    for (const part of (spec.name || STAND[lv][0]).split(' ')) {
      stencilText(ctx, part, w / 2, yy, h * 0.085, { cut: false });
      yy += h * 0.09;
    }
  } else if (k === 'picto') {
    const s = Math.min(w, h * 0.7);
    icon(ctx, spec.icon, w / 2, h * (spec.caption ? 0.36 : 0.5), s * 0.82);
    if (spec.caption) {
      const lines = String(spec.caption).split('\n');
      lines.forEach((ln, i) => stencilText(ctx, ln, w / 2, h * (0.8 + i * 0.16) - (lines.length - 1) * h * 0.06, h * (i === 0 && lines.length > 1 ? 0.1 : 0.15), { cut: false, spacing: 0.06 }));
    }
  } else if (k === 'text') {
    const lines = spec.lines;
    let px = Math.min((h * 0.8) / lines.length, (w / Math.max(...lines.map((l) => l.length))) * 1.9);
    ctx.font = `700 ${px}px ${FONT}`;
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width + px * 0.06 * l.length));
    if (widest > w * 0.94) px *= (w * 0.94) / widest;
    lines.forEach((ln, i) => stencilText(ctx, ln, w / 2, h / 2 + px * (i - (lines.length - 1) / 2) * 1.08 + px * 0.36, px, { color: spec.color || WHITE, spacing: 0.06 }));
  } else if (k === 'mural') {
    // graffiti-style "K-Arena" logotype: cream letters, black outline, speed lines, on signal red
    ctx.fillStyle = '#D21F1B';
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w * 0.5, h * 0.74);
    ctx.transform(1, 0, -0.22, 1, 0, 0);
    ctx.font = `italic 900 ${h * 0.72}px "Arial Black", Impact, ${FONT}`;
    ctx.textAlign = 'center';
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 3;
    ctx.strokeStyle = '#0D0D0E';
    ctx.lineWidth = h * 0.085;
    ctx.strokeText('K-Arena', 0, 0);
    ctx.fillStyle = '#F1E9D2';
    ctx.fillText('K-Arena', 0, 0);
    ctx.restore();
    ctx.fillStyle = '#0D0D0E';
    for (let i = 0; i < 9; i++) {
      const yy = h * (0.22 + i * 0.065);
      const len = w * (0.05 + ((i * 37) % 11) / 90);
      ctx.fillRect(w * 0.79 + ((i * 13) % 5) * w * 0.006, yy, len, h * 0.016);
      ctx.fillRect(w * 0.16 - len * 0.6, yy + h * 0.03, len * 0.6, h * 0.012);
    }
  } else if (k === 'directory') {
    ctx.fillStyle = '#3A2038';
    ctx.fillRect(0, 0, w, h);
    const rows = [
      ['7', 'UPPER STAND', 'GATE 701-712', false],
      ['5', 'MIDDLE STAND', 'GATE 501-512', false],
      ['4', '', '', false],
      ['3', 'LOWER STAND', 'GATE 301-304', true],
      ['1', 'ARENA', 'GATE 101-104', false],
    ];
    const rh = h / (rows.length + 0.6);
    rows.forEach(([lv, name, gates, here], i) => {
      const yy = rh * (i + 0.3);
      ctx.fillStyle = WHITE;
      ctx.fillRect(w * 0.05, yy, w * 0.5, Math.max(2, h * 0.006));
      stencilText(ctx, 'LEVEL', w * 0.11, yy + rh * 0.24, rh * 0.15, { cut: false, color: here ? RED : WHITE });
      stencilText(ctx, lv, w * 0.11, yy + rh * 0.78, rh * 0.55, { color: here ? RED : WHITE });
      if (name) stencilText(ctx, name, w * 0.2, yy + rh * 0.9, rh * 0.14, { cut: false, align: 'left' });
      if (gates) stencilText(ctx, gates, w * 0.2, yy + rh * 0.62, rh * 0.36, { align: 'left' });
    });
    ctx.fillStyle = WHITE;
    ctx.fillRect(w * 0.05, rh * (rows.length + 0.3), w * 0.5, Math.max(2, h * 0.006));
    // plan of the level: hexagon hall with the red Lower Stand band
    const px = (u, v) => [w * (0.6 + u * 0.36), h * (0.12 + v * 0.76)];
    const poly = (pts, fill) => {
      ctx.beginPath();
      pts.forEach(([u, v], i) => {
        const [X, Yp] = px(u, v);
        if (i) ctx.lineTo(X, Yp);
        else ctx.moveTo(X, Yp);
      });
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    };
    poly([[0.36, 0], [0.64, 0], [1, 0.55], [0.74, 0.82], [0.74, 1], [0.26, 1], [0.26, 0.82], [0, 0.55]], '#ECEBE6');
    poly([[0.37, 0.02], [0.63, 0.02], [0.86, 0.38], [0.66, 0.52], [0.34, 0.52], [0.14, 0.38]], '#C9CACC');
    poly([[0.14, 0.38], [0.34, 0.52], [0.66, 0.52], [0.86, 0.38], [0.92, 0.47], [0.68, 0.64], [0.32, 0.64], [0.08, 0.47]], '#C4201C');
    stencilText(ctx, 'STAGE', px(0.5, 0.14)[0], px(0.5, 0.14)[1], h * 0.035, { cut: false, color: '#3A2038' });
    stencilText(ctx, 'LOWER STAND', px(0.5, 0.6)[0], px(0.5, 0.6)[1], h * 0.03, { cut: false });
    stencilText(ctx, 'Main Entrance', px(0.5, 0.95)[0], px(0.5, 0.95)[1], h * 0.028, { cut: false, color: '#3A2038' });
  }
  ctx.restore();
}

/** Paint the atlas and attach it to the sign material (browser only). */
export function finishSigns() {
  if (typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_W;
  canvas.height = ATLAS_H;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, ATLAS_W, ATLAS_H);
  for (const cell of cells.values()) {
    if (!cell.placed) continue;
    try {
      draw(ctx, cell);
    } catch (e) {
      console.warn('structure/signs: could not draw', cell.spec, e);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  const m = M('signs');
  m.map = tex;
  m.emissiveMap = tex;
  m.emissive = new THREE.Color('#ffffff');
  m.emissiveIntensity = 0.32;
  m.alphaTest = 0.45;
  m.userData.canvasAtlas = true; // not a tileable surface: keep it out of the texture manifest
  m.needsUpdate = true;
}

export function signStats() {
  return { cells: cells.size, atlas: [ATLAS_W, ATLAS_H], usedHeight: packedHeight };
}

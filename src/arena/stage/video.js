// House video: two 9.0 x 5.0 m stage side screens flown on trusses above the hanamichi,
// four 3.5 x 2 m upper service screens under the rear pin-spot gallery, and an optional
// tour-style upstage LED wall (show state only). research/00-consolidated.md 7.2,
// organizer-tech.md 10, model-spec.json production.video.
import * as THREE from 'three';
import { mesh } from '../../core/geom.js';
import { Collector, trs } from './batch.js';
import { boxTruss } from './rigging.js';
import { hoistLine, facetPoint } from './pa.js';

/** Emissive screen face: a quad with 0..1 UVs (image texture), placed by a matrix. */
function screenFace(w, h, M) {
  const g = new THREE.PlaneGeometry(w, h);
  g.applyMatrix4(M);
  return g;
}

function mergeFaces(list) {
  // tiny manual merge of plane geometries (position / normal / uv, non-indexed)
  const pos = [];
  const nor = [];
  const uv = [];
  for (const g0 of list) {
    const g = g0.toNonIndexed();
    pos.push(...g.attributes.position.array);
    nor.push(...g.attributes.normal.array);
    uv.push(...g.attributes.uv.array);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

export function buildVideo(SPEC, mats, ctx, rig) {
  const v = SPEC.production.video;
  const low = ctx.quality === 'low';
  const col = new Collector();
  const lvl9 = new Collector();
  const out = { meshes: [], level9: [] };

  // ---- stage side screens ---------------------------------------------------------------
  const W = v.sideScreenWidth_m;
  const Hs = v.sideScreenHeight_m;
  const y0 = v.sideScreenBottom_m;
  const zF = v.sideScreenY_H; // front (LED) face
  const faces = [];
  for (const s of [-1, 1]) {
    const cx = s * v.sideScreenX_H;
    const fr = col.b('led.frame');
    // cabinet layer (500 mm modules) and bezel
    fr.span(cx - W / 2, cx + W / 2, y0, y0 + Hs, zF - 0.1, zF - 0.03);
    faces.push(screenFace(W - 0.04, Hs - 0.04, trs(cx, y0 + Hs / 2, zF, 0)));
    // rear: vertical hanging bars and a power / data box on every cabinet
    const nx = Math.round(W / 0.5);
    const ny = Math.round(Hs / 0.5);
    for (let i = 0; i <= nx; i += 2) fr.span(cx - W / 2 + i * 0.5 - 0.03, cx - W / 2 + i * 0.5 + 0.03, y0, y0 + Hs + 0.2, zF - 0.16, zF - 0.1);
    if (!low) {
      for (let i = 0; i < nx; i++) {
        for (let j = 0; j < ny; j++) fr.box(cx - W / 2 + (i + 0.5) * 0.5, y0 + (j + 0.5) * 0.5, zF - 0.125, 0.3, 0.24, 0.05);
      }
    }
    // truss the screen hangs from, and the lines up to the roof
    const yT = y0 + Hs + 0.2 + 0.2;
    boxTruss(col.b('rig.truss'), [cx - W / 2 - 0.3, yT, zF - 0.13], [cx + W / 2 + 0.3, yT, zF - 0.13], { size: 0.4, chordR: 0.024, lace: 0.022, panel: low ? 0.8 : 0.45 });
    for (const o of [-3.6, -1.2, 1.2, 3.6]) hoistLine(col, [cx + o, yT + 0.2, zF - 0.13], { rig });
  }
  out.side = mesh(mergeFaces(faces), mats['led.side'], { name: 'side LED screens', layer: 'stage', cast: false, receive: false });

  // ---- upper service screens (facing the Upper Stand) -------------------------------------
  const pg = SPEC.production.pinSpotGallery;
  const sw = v.upperServiceWidth_m;
  const sh = v.upperServiceHeight_m;
  const sy = v.upperServiceCentreElevation_m;
  const sFaces = [];
  // two on the centre facet, one on each wing (Travel Watch photo 020: one screen about
  // 12 m off the axis and about 21 m in front of the last rows)
  for (const sArc of [-41.9, -12, 12, 41.9]) {
    const f = facetPoint(pg.row2CentreY_H, sArc, 1.75);
    const M = trs(f.x, sy, f.z, f.yaw);
    const fr = lvl9.b('led.frame');
    fr.boxM(M, sw, sh, 0.08, 0, 0, -0.07);
    sFaces.push(screenFace(sw - 0.04, sh - 0.04, M));
    // back stiffeners and two arms reaching back to the gallery steel
    for (const o of [-1.2, 1.2]) {
      fr.boxM(M, 0.07, sh, 0.05, o, 0, -0.135);
      fr.boxM(M, 0.07, 0.1, 0.36, o, sh / 2 - 0.3, -0.29); // to the outer face of the edge girder
    }
  }
  out.service = mesh(mergeFaces(sFaces), mats['led.service'], { name: 'upper service screens', layer: 'stage', level: 9, cast: false, receive: false });
  out.col = col;
  out.lvl9 = lvl9;
  return out;
}

/** Tour-style upstage LED wall, flown from lifting-grid row 0 (show state only). */
export function buildUpstageWall(SPEC, mats, col) {
  const w = 25;
  const h = 12;
  const y0 = 2.0;
  const z = -13.6;
  const fr = col.b('led.frame');
  fr.span(-w / 2, w / 2, y0, y0 + h, z - 0.1, z - 0.03);
  for (let i = 0; i <= 50; i += 2) fr.span(-w / 2 + i * 0.5 - 0.03, -w / 2 + i * 0.5 + 0.03, y0, y0 + h + 0.2, z - 0.16, z - 0.1);
  const yT = y0 + h + 0.45;
  boxTruss(col.b('rig.truss'), [-w / 2 - 0.2, yT, z - 0.13], [w / 2 + 0.2, yT, z - 0.13], { size: 0.5, panel: 0.6 });
  const gridY = SPEC.production.liftingGrids.parkedBottomElevation_m;
  for (const x of [-10.5, -7.5, -4.5, -1.5, 1.5, 4.5, 7.5, 10.5]) hoistLine(col, [x, yT + 0.25, z - 0.13], { yRoof: gridY });
  const g = screenFace(w - 0.04, h - 0.04, trs(0, y0 + h / 2, z, 0));
  return mesh(g, mats['led.upstage'], { name: 'upstage LED wall', layer: 'stage', cast: false, receive: false });
}

// ------------------------------------------------------------------------------------------
// Screen content (browser only; Node falls back to the plain emissive colours)
// ------------------------------------------------------------------------------------------
const hasCanvas = typeof document !== 'undefined';

/** Static idle slate: blue field, the fan mark and the venue name (as on the house screens). */
export function makeIdleTexture() {
  if (!hasCanvas) return null;
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 576;
  const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, c.height);
  bg.addColorStop(0, '#4a78c2');
  bg.addColorStop(1, '#3a62a8');
  g.fillStyle = bg;
  g.fillRect(0, 0, c.width, c.height);
  // fan mark: a slab over a fan of converging bars
  const cx = c.width / 2;
  const top = 150;
  g.fillStyle = '#f3e3a6';
  g.beginPath();
  g.moveTo(cx - 215, top);
  g.lineTo(cx + 215, top);
  g.lineTo(cx + 195, top + 20);
  g.lineTo(cx - 195, top + 20);
  g.closePath();
  g.fill();
  const bars = 19;
  for (let i = 0; i < bars; i++) {
    const t = i / (bars - 1) - 0.5;
    const xt = cx + t * 380;
    const xb = cx + t * 250;
    const len = 120 - Math.abs(t) * 80;
    g.beginPath();
    g.moveTo(xt - 5, top + 24);
    g.lineTo(xt + 5, top + 24);
    g.lineTo(xb + 4, top + 24 + len);
    g.lineTo(xb - 4, top + 24 + len);
    g.closePath();
    g.fill();
  }
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.fillStyle = '#fbf3d6';
  g.font = '600 118px Georgia, "Times New Roman", serif';
  g.fillText('K-Arena', cx, 400);
  g.fillStyle = '#f3e3a6';
  g.font = '600 40px Georgia, "Times New Roman", serif';
  g.fillText('Yokohama', cx, 452);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Animated show content: drifting colour bars and a sweeping highlight, redrawn at about 20 Hz. */
export function makeShowTexture() {
  if (!hasCanvas) return null;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 144;
  const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  let last = -1;
  const draw = (time, hue) => {
    if (time - last < 0.05 && last >= 0 && time >= last) return;
    last = time;
    const w = c.width;
    const h = c.height;
    // deep two-colour field
    const bg = g.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, `hsl(${(hue + 300) % 360} 90% 14%)`);
    bg.addColorStop(1, `hsl(${(hue + 30) % 360} 90% 20%)`);
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter';
    // two drifting glows
    for (let k = 0; k < 2; k++) {
      const bx = w * (0.5 + 0.38 * Math.sin(time * (0.31 + 0.17 * k) + k * 2.1));
      const by = h * (0.5 + 0.3 * Math.cos(time * (0.23 + 0.11 * k) + k));
      const rg = g.createRadialGradient(bx, by, 2, bx, by, h * 0.75);
      rg.addColorStop(0, `hsla(${(hue + 60 + 140 * k) % 360} 95% 55% / 0.75)`);
      rg.addColorStop(1, 'hsla(0 0% 0% / 0)');
      g.fillStyle = rg;
      g.fillRect(0, 0, w, h);
    }
    // colour chase: full-height columns, a wave of brightness running across
    const n = 24;
    for (let i = 0; i < n; i++) {
      const a = 0.5 + 0.5 * Math.sin(time * 3.2 - i * 0.62);
      const k = a * a * a;
      g.fillStyle = `hsla(${(hue + 180 + i * 6) % 360} 95% ${30 + 40 * k}% / ${0.12 + 0.75 * k})`;
      g.fillRect((i * w) / n + 1.5, 0, w / n - 3, h);
    }
    // horizontal scan bar
    const sy = ((time * 0.22) % 1.3) * h - 0.15 * h;
    const sweep = g.createLinearGradient(0, sy - 14, 0, sy + 14);
    sweep.addColorStop(0, 'rgba(255,255,255,0)');
    sweep.addColorStop(0.5, 'rgba(255,255,255,0.5)');
    sweep.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sweep;
    g.fillRect(0, sy - 14, w, 28);
    tex.needsUpdate = true;
  };
  draw(0, 260);
  return { texture: tex, draw };
}

/** Soft radial blob used for the haze sheets. */
export function makeHazeTexture() {
  if (!hasCanvas) return null;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const rg = g.createRadialGradient(64, 64, 2, 64, 64, 64);
  rg.addColorStop(0, 'rgba(255,255,255,1)');
  rg.addColorStop(0.45, 'rgba(255,255,255,0.45)');
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rg;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}


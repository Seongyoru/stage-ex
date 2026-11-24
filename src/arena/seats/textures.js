// Small procedural textures for seat fittings. THREE.DataTexture needs no DOM, so these
// work in plain Node as well as in the browser.
import * as THREE from 'three';

const clamp01 = (v) => Math.min(1, Math.max(0, v));

/** Distance from point p to segment a-b (2D). */
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = clamp01(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1));
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

// 3 x 5 pixel glyphs for the seat-number tag
const GLYPHS = {
  1: ['010', '110', '010', '010', '111'],
  2: ['111', '001', '111', '100', '111'],
  3: ['111', '001', '111', '001', '111'],
  4: ['101', '101', '111', '001', '001'],
  5: ['111', '100', '111', '001', '111'],
  7: ['111', '001', '010', '010', '010'],
  '-': ['000', '000', '111', '000', '000'],
};

/**
 * Fittings atlas, 128 x 64 RGBA.
 *   u 0.0-0.5  cup-holder ring seen from above: black ring (outer r 0.42, inner r 0.31 of the
 *              tile, centre at v = 0.56) with a short stem toward v = 0 (the seat side);
 *              everything else is transparent (alpha test).
 *   u 0.5-1.0  seat-number tag: black plate with white "25-147" style characters, opaque.
 */
export function makeFittingsAtlas() {
  const W = 128;
  const H = 64;
  const data = new Uint8Array(W * H * 4);
  const SS = 4;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < 64; x++) {
      let cover = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const u = (x + (sx + 0.5) / SS) / 64;
          const v = (y + (sy + 0.5) / SS) / H;
          const r = Math.hypot(u - 0.5, v - 0.56);
          const ring = r <= 0.42 && r >= 0.31;
          const stem = Math.abs(u - 0.5) <= 0.13 && v <= 0.28 && r >= 0.31;
          if (ring || stem) cover++;
        }
      }
      const o = (y * W + x) * 4;
      data[o] = 30;
      data[o + 1] = 31;
      data[o + 2] = 33;
      data[o + 3] = Math.round((cover / (SS * SS)) * 255);
    }
  }
  // tag tile
  const text = ['2', '5', '-', '1', '4', '7'];
  for (let y = 0; y < H; y++) {
    for (let x = 64; x < W; x++) {
      const o = (y * W + x) * 4;
      let white = false;
      const col = Math.floor((x - 64 - 8) / 2); // 2 px per glyph column, 8 px margin
      const row = Math.floor((y - 12) / 8); // 8 px per glyph row, 12 px margin
      if (col >= 0 && col < text.length * 4 && row >= 0 && row < 5) {
        const g = GLYPHS[text[Math.floor(col / 4)]];
        const c = col % 4;
        // v = 0 is the bottom row of the texture: flip the glyph vertically
        if (c < 3 && g[4 - row][c] === '1') white = true;
      }
      const edge = x < 66 || x > W - 3 || y < 2 || y > H - 3;
      const k = white ? 236 : edge ? 70 : 24;
      data[o] = k;
      data[o + 1] = k;
      data[o + 2] = white ? 232 : edge ? 72 : 26;
      data[o + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 4;
  tex.name = 'seat.fittings.atlas';
  tex.needsUpdate = true;
  return tex;
}

/** International symbol of access, white on blue, 128 x 128, opaque. v = 1 is "up". */
export function makeWheelchairSymbol() {
  const N = 128;
  const data = new Uint8Array(N * N * 4);
  const SS = 3;
  const inside = (u, v) => {
    // head
    if (Math.hypot(u - 0.45, v - 0.83) < 0.062) return true;
    // torso, arm, thigh, shin, foot
    if (segDist(u, v, 0.44, 0.73, 0.47, 0.5) < 0.036) return true;
    if (segDist(u, v, 0.455, 0.62, 0.64, 0.62) < 0.028) return true;
    if (segDist(u, v, 0.47, 0.5, 0.68, 0.5) < 0.036) return true;
    if (segDist(u, v, 0.68, 0.5, 0.78, 0.26) < 0.034) return true;
    if (segDist(u, v, 0.78, 0.26, 0.86, 0.28) < 0.03) return true;
    // wheel: open ring behind and below the seat
    const dx = u - 0.5;
    const dy = v - 0.34;
    const r = Math.hypot(dx, dy);
    if (r > 0.185 && r < 0.245) {
      const a = (Math.atan2(dy, dx) * 180) / Math.PI; // 0 = +u (front), 90 = up
      if (!(a > -12 && a < 100)) return true;
    }
    return false;
  };
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let cover = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          if (inside((x + (sx + 0.5) / SS) / N, (y + (sy + 0.5) / SS) / N)) cover++;
        }
      }
      const k = cover / (SS * SS);
      const o = (y * N + x) * 4;
      data[o] = Math.round(31 + (245 - 31) * k);
      data[o + 1] = Math.round(79 + (245 - 79) * k);
      data[o + 2] = Math.round(168 + (242 - 168) * k);
      data[o + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 4;
  tex.name = 'seat.wheelchairSymbol.map';
  tex.needsUpdate = true;
  return tex;
}

/**
 * Tangent-space normal map of the moulded rear shell of the Lux chair, so that the relief
 * costs no triangles: a raised rounded panel, a small recessed maker's label and the two
 * bosses the cup-holder rings hinge on (official seat-view photos, Lux-M product photo).
 * One tile = SHELL_RELIEF.width x SHELL_RELIEF.height metres of the chair's local (x, y);
 * the shell geometry has metric UVs u = x, v = y on its rear face, so with the repeat and
 * offset set below the relief registers on every instance.
 */
export const SHELL_RELIEF = Object.freeze({ width: 0.5, height: 0.7, x0: -0.25, y0: 0.3 });

export function makeShellNormalMap() {
  const W = 128;
  const H = 256;
  const { width, height, x0, y0 } = SHELL_RELIEF;
  const smooth = (e0, e1, v) => {
    const t = clamp01((v - e0) / (e1 - e0));
    return t * t * (3 - 2 * t);
  };
  // signed distance to a rounded rectangle
  const rrect = (x, y, cx, cy, hx, hy, r) => {
    const qx = Math.abs(x - cx) - (hx - r);
    const qy = Math.abs(y - cy) - (hy - r);
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
  };
  // height in metres at chair-local (x, y)
  const heightAt = (x, y) => {
    let h = 0;
    h += 0.003 * (1 - smooth(-0.012, 0, rrect(x, y, 0, 0.69, 0.168, 0.215, 0.035))); // raised panel
    h -= 0.0012 * (1 - smooth(-0.003, 0, rrect(x, y, 0, 0.7, 0.03, 0.011, 0.003))); // label recess
    for (const sx of [-1, 1]) h += 0.002 * (1 - smooth(0.02, 0.032, Math.hypot(x - sx * 0.15, y - 0.418))); // ring bosses
    return h;
  };
  const data = new Uint8Array(W * H * 4);
  const dx = width / W;
  const dy = height / H;
  const strength = 2.2;
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const x = x0 + (i + 0.5) * dx;
      const y = y0 + (j + 0.5) * dy;
      const gx = (heightAt(x + dx, y) - heightAt(x - dx, y)) / (2 * dx);
      const gy = (heightAt(x, y + dy) - heightAt(x, y - dy)) / (2 * dy);
      let nx = -gx * strength;
      let ny = -gy * strength;
      const l = Math.hypot(nx, ny, 1);
      nx /= l;
      ny /= l;
      const o = (j * W + i) * 4;
      data[o] = Math.round((nx * 0.5 + 0.5) * 255);
      data[o + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      data[o + 2] = Math.round((1 / l) * 0.5 * 255 + 127.5);
      data[o + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1 / width, 1 / height);
  tex.offset.set(-x0 / width, -y0 / height);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 4;
  tex.name = 'seat.shellBlack.normal';
  tex.needsUpdate = true;
  return tex;
}

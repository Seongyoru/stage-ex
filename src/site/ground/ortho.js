// Optional aerial-photo mode (ctx.flags.ortho): the keyless PLATEAU-Ortho 2024 tiles that
// cover the disc are drawn, rotated into the WORLD frame, onto one canvas texture that
// replaces the vector ground. Browser only; in Node the plain ground colour is used.
import * as THREE from 'three';
import { mat } from '../../core/materials.js';
import { lonLatToWorld, worldToLonLat } from '../../core/frame.js';
import { DISC } from './util.js';

export const ORTHO_TILE_URL = 'https://tile.plateauview.mlit.go.jp/tiles/plateau-ortho-2024/{z}/{x}/{y}.png';
export const ORTHO_ATTRIBUTION = '航空写真: 国土交通省 Project PLATEAU「PLATEAU-Ortho 2024」(CC BY 4.0) https://www.mlit.go.jp/plateau/';

const tileX = (lon, z) => ((lon + 180) / 360) * 2 ** z;
const tileY = (lat, z) => {
  const s = Math.sin((lat * Math.PI) / 180);
  return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * 2 ** z;
};
const tileLon = (x, z) => (x / 2 ** z) * 360 - 180;
const tileLat = (y, z) => (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / 2 ** z))) * 180) / Math.PI;

/** Tiles (z, x, y) whose footprint touches the square around the disc. */
export function orthoTiles(zoom) {
  const R = DISC.radius + 4;
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (let a = 0; a < 360; a += 3) {
    const [lon, lat] = worldToLonLat(DISC.cx + R * Math.cos((a * Math.PI) / 180), DISC.cz + R * Math.sin((a * Math.PI) / 180));
    x0 = Math.min(x0, tileX(lon, zoom));
    x1 = Math.max(x1, tileX(lon, zoom));
    y0 = Math.min(y0, tileY(lat, zoom));
    y1 = Math.max(y1, tileY(lat, zoom));
  }
  const out = [];
  for (let x = Math.floor(x0); x <= Math.floor(x1); x++) for (let y = Math.floor(y0); y <= Math.floor(y1); y++) out.push({ z: zoom, x, y });
  return out;
}

/** UVs of the photo texture for a geometry in world metres (v flipped: canvas row 0 is the −Z edge). */
export function photoUV(geometry) {
  const p = geometry.attributes.position;
  const uv = new Float32Array(p.count * 2);
  const R = DISC.radius;
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = (p.getX(i) - DISC.cx + R) / (2 * R);
    uv[i * 2 + 1] = 1 - (p.getZ(i) - DISC.cz + R) / (2 * R);
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geometry;
}

/**
 * Material showing the aerial photo. Tiles load progressively; `onProgress(done, total)` is
 * optional. Returns { material, ready } where ready resolves when every tile has settled.
 */
export function orthoMaterial(quality = 'high', onProgress = null) {
  const hasDom = typeof document !== 'undefined';
  if (!hasDom) return { material: mat('site.orthoPhoto', { color: '#8E8F86', roughness: 0.95, metalness: 0, tile: DISC.radius * 2 }), ready: Promise.resolve(false) };
  const zoom = quality === 'low' ? 17 : 18;
  const size = quality === 'low' ? 1024 : 2048;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#8E8F86';
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  // lit like the rest of the model so that the night mode still works
  const material = mat('site.orthoPhoto', { color: '#ffffff', roughness: 1, metalness: 0, tile: DISC.radius * 2, polygonOffset: true, polygonOffsetFactor: 6, polygonOffsetUnits: 12 });
  material.color.set('#ffffff');
  material.map = texture;
  material.needsUpdate = true;
  const R = DISC.radius;
  const toPx = ([x, z]) => [((x - DISC.cx + R) / (2 * R)) * size, ((z - DISC.cz + R) / (2 * R)) * size];
  const tiles = orthoTiles(zoom);
  let done = 0;
  const ready = Promise.all(
    tiles.map(
      (t) =>
        new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            // affine map tile pixels → canvas pixels through three tile corners
            const p00 = toPx(lonLatToWorld(tileLon(t.x, t.z), tileLat(t.y, t.z)));
            const p10 = toPx(lonLatToWorld(tileLon(t.x + 1, t.z), tileLat(t.y, t.z)));
            const p01 = toPx(lonLatToWorld(tileLon(t.x, t.z), tileLat(t.y + 1, t.z)));
            const w = img.naturalWidth || 256;
            const h = img.naturalHeight || 256;
            ctx.setTransform((p10[0] - p00[0]) / w, (p10[1] - p00[1]) / w, (p01[0] - p00[0]) / h, (p01[1] - p00[1]) / h, p00[0], p00[1]);
            ctx.drawImage(img, 0, 0, w + 0.6, h + 0.6); // slight overlap hides the seams
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            texture.needsUpdate = true;
            done++;
            if (onProgress) onProgress(done, tiles.length);
            resolve(true);
          };
          img.onerror = () => {
            done++;
            if (onProgress) onProgress(done, tiles.length);
            resolve(false);
          };
          img.src = ORTHO_TILE_URL.replace('{z}', t.z).replace('{x}', t.x).replace('{y}', t.y);
        }),
    ),
  ).then((r) => r.some(Boolean));
  return { material, ready };
}

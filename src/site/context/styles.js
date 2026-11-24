// Materials and facade families of the context buildings.
//
// Every visually distinct surface has its own material id ('context.<family>.<surface>').
// Facade materials carry a procedural albedo (textures.js) whose grid is stated in the
// comment next to each one: `tile` metres = bays x floors, so a generated texture set of
// the same id can replace it 1:1. Facade UVs are in "tile metres": the generator stretches
// each wall slightly so that it holds a whole number of bays and floors.
// Window glow at night is an emissive map on the same material (intensity driven by
// update()); it uses its own, larger repeat so the lit pattern does not tile visibly.
import * as THREE from 'three';
import { mat, emissiveMat } from '../../core/materials.js';
import { gridFacade, gridLights, panelSurface, ribbed, helipad, raster, toTexture, hex } from './textures.js';

const NIGHT = []; // { material, level } facade materials with lit windows
let built = false;

function avgHex(r) {
  let a = 0;
  let b = 0;
  let c = 0;
  const n = r.w * r.h;
  for (let i = 0; i < n; i += 7) {
    a += r.data[i * 4];
    b += r.data[i * 4 + 1];
    c += r.data[i * 4 + 2];
  }
  const k = Math.ceil(n / 7);
  return new THREE.Color().setRGB(a / k / 255, b / k / 255, c / k / 255, THREE.SRGBColorSpace).getHexString();
}

/** Textured, vertex-tinted standard material. `lights` = { raster, bays, floors, bay, floor, level }. */
function tex(id, r, tile, params = {}, lights = null) {
  const p = { color: '#ffffff', map: toTexture(r, tile), tile, vertexColors: true, roughness: 0.7, metalness: 0, ...params };
  if (lights) {
    p.emissiveMap = toTexture(lights.raster, lights.bays * lights.bay, lights.floors * lights.floor, { nearest: false });
    p.emissive = '#ffffff';
    p.emissiveIntensity = 0;
  }
  const m = mat(id, p);
  m.userData.baseColor = avgHex(r); // plain-colour stand-in for this surface
  if (lights && !NIGHT.some((n) => n.material === m)) NIGHT.push({ material: m, level: lights.level ?? 1 });
  return m;
}
function plain(id, color, params = {}) {
  return mat(id, { color, vertexColors: true, roughness: 0.75, metalness: 0, tile: 2, ...params });
}

const WARM = ['#ffd9a0', '#ffe6c2', '#fff0dc', '#ffcb8c', '#f6efe6'];
const COOL = ['#eaf1ff', '#f4f6f2', '#dfe9f5', '#fff4dc'];

export function ensureMaterials() {
  if (built) return;
  built = true;

  // ---- offices ---------------------------------------------------------------
  // tile 12 m = 8 bays of 1.5 m x 3 floors of 4.0 m
  const cwWin = { u0: 0.03, u1: 0.97, v0: 0.25, v1: 0.985 };
  tex(
    'context.office.curtainBlue',
    gridFacade({ bays: 8, floors: 3, wall: '#566f7c', win: cwWin, glass: '#7191a3', glassVar: 0.07, mullions: [{ every: 1, w: 0.06, col: '#b3babd' }], bands: [{ v0: 0.235, v1: 0.25, col: '#a7afb3' }, { v0: 0, v1: 0.02, col: '#a7afb3' }], seed: 11 }),
    12,
    { roughness: 0.3 },
    { raster: gridLights({ bays: 32, floors: 24, win: cwWin, lit: 0.1, rowBias: 0.22, colors: COOL, seed: 101 }), bays: 32, floors: 24, bay: 1.5, floor: 4, level: 0.7 },
  );
  // tile 12 m = 4 bays of 3.0 m (white fin every 3 m, dark mullion between) x 3 floors of 4.0 m
  tex(
    'context.office.curtainDark',
    gridFacade({ bays: 8, floors: 3, wall: '#2b3a47', win: { u0: 0.02, u1: 0.98, v0: 0.2, v1: 0.99 }, glass: '#3d5466', glassVar: 0.08, mullions: [{ every: 1, w: 0.04, col: '#1f2a33' }, { every: 2, w: 0.12, col: '#d9dcdc' }], bands: [{ v0: 0, v1: 0.07, col: '#d6d9d9' }], seed: 12 }),
    12,
    { roughness: 0.3 },
    { raster: gridLights({ bays: 32, floors: 24, win: { u0: 0.02, u1: 0.98, v0: 0.2, v1: 0.99 }, lit: 0.1, rowBias: 0.2, colors: COOL, seed: 102 }), bays: 32, floors: 24, bay: 1.5, floor: 4, level: 0.7 },
  );
  // tile 12 m = 4 bays of 3.0 m x 3 floors of 4.0 m, punched windows 2.2 x 2.1 m in precast
  const pcWin = { u0: 0.13, u1: 0.87, v0: 0.3, v1: 0.83 };
  tex(
    'context.office.precast',
    gridFacade({ bays: 4, floors: 3, wall: '#cfcabf', win: pcWin, glass: '#3f4d59', frame: '#8d9193', frameW: 0.025, joints: { du: 1, dv: 1, col: '#b3aea3', a: 0.7 }, seed: 13 }),
    12,
    { roughness: 0.8 },
    { raster: gridLights({ bays: 24, floors: 18, win: pcWin, lit: 0.2, rowBias: 0.3, colors: COOL, seed: 103 }), bays: 24, floors: 18, bay: 3, floor: 4, level: 0.9 },
  );
  // tile 6 m = 2 bays of 3.0 m x 1 storey (stretched over the lobby height): stone piers, tall glazing
  tex(
    'context.office.lobby',
    gridFacade({ bays: 2, floors: 1, wall: '#b7b2a8', win: { u0: 0.14, u1: 0.86, v0: 0.03, v1: 0.84 }, glass: '#4d5f6b', frame: '#3a3d40', frameW: 0.02, bands: [{ v0: 0.9, v1: 1, col: '#a5a096' }], mullions: [{ every: 1, w: 0.03, col: '#3a3d40' }], seed: 14, px: 128 }),
    6,
    { roughness: 0.5 },
    { raster: gridLights({ bays: 16, floors: 1, cell: 16, win: { u0: 0.14, u1: 0.86, v0: 0.03, v1: 0.84 }, lit: 0.75, colors: WARM, seed: 104 }), bays: 16, floors: 1, bay: 3, floor: 6, level: 0.8 },
  );
  // tile 11.7 m = 3 bays x 3 floors of 3.9 m: white tile, ribbon windows
  const cvWin = { u0: 0.04, u1: 0.96, v0: 0.33, v1: 0.78 };
  tex(
    'context.civic.wall',
    gridFacade({ bays: 3, floors: 3, wall: '#e2e2dd', win: cvWin, glass: '#42525e', frame: '#b7babb', frameW: 0.02, mullions: [{ every: 1, w: 0.035, col: '#d2d2cd' }], joints: { du: 0.5, dv: 0.5, col: '#cfcfca', a: 0.5 }, seed: 15 }),
    11.7,
    { roughness: 0.8 },
    { raster: gridLights({ bays: 18, floors: 12, win: cvWin, lit: 0.15, rowBias: 0.25, colors: COOL, seed: 105 }), bays: 18, floors: 12, bay: 3.9, floor: 3.9, level: 0.8 },
  );

  // ---- residential -----------------------------------------------------------
  // tile 12.4 m = 2 flats of 6.2 m x 4 floors of 3.1 m. This is the wall BEHIND the balconies:
  // a full-height sliding window 3.3 m wide and a small window per flat, beam soffit on top.
  const resWins = [
    { u0: 0.07, u1: 0.6, v0: 0.02, v1: 0.72 },
    { u0: 0.72, u1: 0.9, v0: 0.36, v1: 0.72 },
  ];
  const resLights = (seed) => ({ raster: gridLights({ bays: 24, floors: 32, win: { u0: 0.07, u1: 0.6, v0: 0.02, v1: 0.72 }, lit: 0.4, colors: WARM, seed }), bays: 24, floors: 32, bay: 6.2, floor: 3.1, level: 1.0 });
  tex(
    'context.residential.wallLight',
    gridFacade({ bays: 2, floors: 4, wall: '#d6d4ce', win: resWins, glass: '#3c4852', glassVar: 0.12, frame: '#8a8d8e', frameW: 0.012, bands: [{ v0: 0.86, v1: 1, col: '#bfbdb7' }], mullions: [{ every: 1, w: 0.02, col: '#b3b1ab' }], seed: 21 }),
    12.4,
    { roughness: 0.75 },
    resLights(121),
  );
  tex(
    'context.residential.wallBeige',
    gridFacade({ bays: 2, floors: 4, wall: '#c4b8a6', win: resWins, glass: '#3b4349', glassVar: 0.12, frame: '#7e7a72', frameW: 0.012, bands: [{ v0: 0.86, v1: 1, col: '#ada18f' }], mullions: [{ every: 1, w: 0.02, col: '#a99d8b' }], joints: { du: 0.25, dv: 0.5, col: '#b4a895', a: 0.35 }, seed: 22 }),
    12.4,
    { roughness: 0.8 },
    resLights(122),
  );
  // tile 6.2 m = one bay x one storey: tiled podium with an entrance-height opening
  tex(
    'context.residential.base',
    gridFacade({ bays: 2, floors: 1, wall: '#a69e91', win: { u0: 0.2, u1: 0.8, v0: 0.04, v1: 0.62 }, glass: '#3a444c', frame: '#5a5650', frameW: 0.02, joints: { du: 0.25, dv: 0.2, col: '#958d80', a: 0.5 }, seed: 23, px: 128 }),
    6.2,
    { roughness: 0.8 },
    { raster: gridLights({ bays: 16, floors: 1, cell: 16, win: { u0: 0.2, u1: 0.8, v0: 0.04, v1: 0.62 }, lit: 0.6, colors: WARM, seed: 123 }), bays: 16, floors: 1, bay: 3.1, floor: 6.2, level: 0.7 },
  );
  plain('context.residential.balconyGlass', '#b7ccd0', { roughness: 0.25, tile: 2 });

  // ---- hotel -----------------------------------------------------------------
  // tile 13.2 m = 4 rooms of 3.3 m x 4 floors of 3.3 m: white panels, one window per room
  const htWin = { u0: 0.2, u1: 0.8, v0: 0.22, v1: 0.8 };
  tex(
    'context.hotel.wall',
    gridFacade({ bays: 4, floors: 4, wall: '#e1e0db', win: htWin, glass: '#465563', frame: '#9b9d9c', frameW: 0.02, joints: { du: 1, dv: 1, col: '#c9c8c3', a: 0.6 }, seed: 31 }),
    13.2,
    { roughness: 0.75 },
    { raster: gridLights({ bays: 32, floors: 24, win: htWin, lit: 0.36, colors: WARM, seed: 131 }), bays: 32, floors: 24, bay: 3.3, floor: 3.3, level: 1.0 },
  );

  // ---- low commercial --------------------------------------------------------
  // tile 9 m = 3 bays of 3.0 m x 2 floors of 4.5 m: metal panels 1.5 m, ribbon window per floor
  const cmWin = { u0: 0.05, u1: 0.95, v0: 0.42, v1: 0.72 };
  tex(
    'context.commercial.wall',
    gridFacade({ bays: 3, floors: 2, wall: '#c8cac8', win: cmWin, glass: '#4a5964', frame: '#8f9394', frameW: 0.015, joints: { du: 0.5, dv: 0.5, col: '#aeb1b0', a: 0.6 }, seed: 41 }),
    9,
    { roughness: 0.7 },
    { raster: gridLights({ bays: 24, floors: 8, win: cmWin, lit: 0.45, rowBias: 0.2, colors: COOL, seed: 141 }), bays: 24, floors: 8, bay: 3, floor: 4.5, level: 0.9 },
  );
  // tile 6 m = 2 bays of 3.0 m x 1 storey: glazed shopfront with a sign fascia on top
  const sfWin = { u0: 0.05, u1: 0.95, v0: 0.04, v1: 0.74 };
  tex(
    'context.commercial.shopfront',
    gridFacade({ bays: 2, floors: 1, wall: '#2f3235', win: sfWin, glass: '#5e727c', glassVar: 0.1, bands: [{ v0: 0.78, v1: 1, col: '#d6d6d1' }], mullions: [{ every: 1, w: 0.03, col: '#2f3235' }], seed: 42, px: 128 }),
    6,
    { roughness: 0.4 },
    { raster: gridLights({ bays: 16, floors: 1, cell: 16, win: sfWin, lit: 0.85, colors: ['#fff3d6', '#ffe9c0', '#f3f6ff'], seed: 142 }), bays: 16, floors: 1, bay: 3, floor: 6, level: 1.1 },
  );

  // ---- parking structure -----------------------------------------------------
  tex('context.parking.spandrel', panelSurface({ color: '#c6c7c3', du: 1, dv: 1, joint: '#a9aaa6', seed: 51 }), 3, { roughness: 0.85 });
  plain('context.parking.void', '#26282b', { roughness: 0.95 });
  tex('context.parking.screen', ribbed({ color: '#b0b6b9', shade: '#8d9498', ribs: 8, duty: 0.45, seed: 52 }), 1.2, { roughness: 0.5 });
  {
    // tile 15 m: 4.5 m stalls / 6 m aisle / 4.5 m stalls, stall lines every 2.5 m
    const r = raster(256, 256, '#5a5d60');
    for (let i = 0; i < 6; i++) {
      r.rect(i / 6, 0.02, i / 6 + 0.008, 0.3, '#e6e6e0');
      r.rect(i / 6, 0.7, i / 6 + 0.008, 0.98, '#e6e6e0');
    }
    r.noise(5, 53);
    tex('context.parking.deck', r, 15, { roughness: 0.9 });
  }

  // ---- industrial / market ---------------------------------------------------
  tex('context.industrial.siding', ribbed({ color: '#bcc3c6', shade: '#a9b0b5', ribs: 20, duty: 0.4, seed: 61 }), 4, { roughness: 0.6 });
  tex('context.industrial.coldstore', panelSurface({ color: '#e3e5e3', du: 1 / 6, dv: 0.5, joint: '#c2c6c7', a: 0.7, seed: 62 }), 6, { roughness: 0.6 });
  tex('context.industrial.door', ribbed({ color: '#8998a5', shade: '#77858f', ribs: 12, vertical: false, seed: 63 }), 1.2, { roughness: 0.55 });
  tex('context.roof.metal', ribbed({ color: '#8a98a4', shade: '#7b8995', ribs: 10, duty: 0.2, seed: 64 }), 3, { roughness: 0.5 });

  // ---- small things ----------------------------------------------------------
  tex('context.utility.wall', panelSurface({ color: '#bdbcb6', du: 0.5, dv: 0.5, joint: '#a5a49e', seed: 71 }), 3, { roughness: 0.85 });

  // ---- roofs and plant -------------------------------------------------------
  tex('context.roof.membrane', panelSurface({ color: '#8f9294', du: 0.25, dv: 0.25, joint: '#84878a', a: 0.6, noise: 5, seed: 81 }), 8, { roughness: 0.9 });
  tex('context.roof.light', panelSurface({ color: '#cfd0cc', du: 0.25, dv: 0.25, joint: '#bfc0bc', a: 0.6, noise: 4, seed: 82 }), 8, { roughness: 0.85 });
  tex('context.roof.terracotta', ribbed({ color: '#a9674a', shade: '#93573d', ribs: 10, duty: 0.3, seed: 83 }), 2, { roughness: 0.85 });
  tex('context.plant.unit', ribbed({ color: '#c0c3c3', shade: '#9fa3a4', ribs: 8, vertical: false, duty: 0.4, seed: 84 }), 1.6, { roughness: 0.6 });
  tex('context.plant.screen', ribbed({ color: '#c3c7c9', shade: '#a6abae', ribs: 10, vertical: false, duty: 0.45, seed: 85 }), 2, { roughness: 0.6 });
  tex('context.plant.penthouse', panelSurface({ color: '#c6c6c1', du: 1 / 3, dv: 1 / 3, joint: '#aeaea9', seed: 86 }), 3.6, { roughness: 0.8 });
  tex('context.roof.helipadH', helipad({ letter: 'H' }), 1, { roughness: 0.85 });
  tex('context.roof.helipadR', helipad({ letter: 'R', deck: '#767a7c' }), 1, { roughness: 0.85 });

  // ---- shared ----------------------------------------------------------------
  plain('context.trim', '#ffffff', { roughness: 0.7 }); // copings, slab edges, fins: colour per building (vertex colour)
  mat('context.trim').userData.baseColor = 'd9d9d5';
  plain('context.cut', '#4b4e52', { roughness: 0.9 }); // section face where the diorama rim cuts a building

  // ---- landmarks -------------------------------------------------------------
  // Anpanman museum: smooth white panels 3 m, tile 6 m
  tex('context.anpanman.wall', panelSurface({ color: '#f1f1ee', du: 0.5, dv: 0.5, joint: '#dadad6', a: 0.6, noise: 2, seed: 91 }), 6, { roughness: 0.6 });
  tex('context.anpanman.sideWall', panelSurface({ color: '#aeb1b2', du: 0.5, dv: 0.25, joint: '#989b9c', a: 0.6, seed: 92 }), 6, { roughness: 0.75 });
  // tile 6 m = 4 panes of 1.5 m x 1 storey, white mullions
  const anWin = { u0: 0.03, u1: 0.97, v0: 0.03, v1: 0.97 };
  tex(
    'context.anpanman.glass',
    gridFacade({ bays: 4, floors: 1, wall: '#e9eae8', win: anWin, glass: '#6f97a2', glassVar: 0.1, sky: 0.2, seed: 93, px: 128 }),
    6,
    { roughness: 0.3 },
    { raster: gridLights({ bays: 16, floors: 2, cell: 16, win: anWin, lit: 0.8, colors: ['#fff0cf', '#ffe2b0', '#ffd7e2', '#d9f0ff'], seed: 193 }), bays: 16, floors: 2, bay: 1.5, floor: 6, level: 1.0 },
  );
  plain('context.anpanman.accent', '#ffffff', { roughness: 0.55 }); // coloured discs, rainbow stair, sign: vertex colour
  mat('context.anpanman.accent').userData.baseColor = 'e8552e';

  // Fujifilm BI oval tower: tile 12 m = 8 panes of 1.5 m x 3 floors of 4.0 m, teal glass, light sunshade line per floor
  const fjWin = { u0: 0.02, u1: 0.98, v0: 0.24, v1: 0.99 };
  tex(
    'context.fujifilm.glass',
    gridFacade({ bays: 8, floors: 3, wall: '#3e5c68', win: fjWin, glass: '#547a89', glassVar: 0.09, mullions: [{ every: 1, w: 0.035, col: '#2f4a55' }], bands: [{ v0: 0, v1: 0.07, col: '#aebdc0' }], seed: 94 }),
    12,
    { roughness: 0.28 },
    { raster: gridLights({ bays: 32, floors: 24, win: fjWin, lit: 0.12, rowBias: 0.24, colors: COOL, seed: 194 }), bays: 32, floors: 24, bay: 1.5, floor: 4, level: 0.7 },
  );
  // low wings: tile 9 m = 3 bays x 2 floors of 4.5 m, white aluminium panels with a glass ribbon
  const flWin = { u0: 0.02, u1: 0.98, v0: 0.3, v1: 0.8 };
  tex(
    'context.fujifilm.lowrise',
    gridFacade({ bays: 3, floors: 2, wall: '#e8e9e7', win: flWin, glass: '#557380', mullions: [{ every: 1, w: 0.03, col: '#cfd2d1' }], joints: { du: 0.5, dv: 0.5, col: '#d2d4d3', a: 0.5 }, seed: 95 }),
    9,
    { roughness: 0.5 },
    { raster: gridLights({ bays: 24, floors: 4, win: flWin, lit: 0.4, rowBias: 0.3, colors: COOL, seed: 195 }), bays: 24, floors: 4, bay: 3, floor: 4.5, level: 0.9 },
  );
  tex('context.fujifilm.drum', ribbed({ color: '#d6d9d9', shade: '#b7bbbc', ribs: 10, duty: 0.45, seed: 96 }), 2, { roughness: 0.5 });

  // OK Minatomirai building: tile 7.2 m, grey metal panels 1.2 x 3.6 m, no windows
  tex('context.okbuilding.panel', panelSurface({ color: '#b3b7b9', du: 1 / 6, dv: 0.5, joint: '#989da0', a: 0.7, seed: 97 }), 7.2, { roughness: 0.55 });
  // office floors: tile 7.4 m = 2 bays of 3.7 m x 2 floors of 3.7 m, same panels with a blue glass ribbon
  const okWin = { u0: 0, u1: 1, v0: 0.3, v1: 0.72 };
  tex(
    'context.okbuilding.office',
    gridFacade({ bays: 2, floors: 2, wall: '#b3b7b9', win: okWin, glass: '#587892', glassVar: 0.06, mullions: [{ every: 1, w: 0.03, col: '#8e9498' }], joints: { du: 1 / 3, dv: 1, col: '#989da0', a: 0.6 }, seed: 99, px: 128 }),
    7.4,
    { roughness: 0.5 },
    { raster: gridLights({ bays: 16, floors: 8, win: okWin, lit: 0.15, rowBias: 0.3, colors: COOL, seed: 199 }), bays: 16, floors: 8, bay: 3.7, floor: 3.7, level: 0.8 },
  );

  // The Kahala: tile 13.2 m = 8 panes of 1.65 m x 4 floors of 3.3 m, bright blue glass, white slab edge
  const khWin = { u0: 0.02, u1: 0.98, v0: 0.14, v1: 0.99 };
  tex(
    'context.kahala.glass',
    gridFacade({ bays: 8, floors: 4, wall: '#5c8197', win: khWin, glass: '#6f97ad', glassVar: 0.08, sky: 0.18, mullions: [{ every: 1, w: 0.03, col: '#547689' }], bands: [{ v0: 0, v1: 0.1, col: '#e4e7e7' }], seed: 98 }),
    13.2,
    { roughness: 0.25 },
    { raster: gridLights({ bays: 32, floors: 24, win: khWin, lit: 0.4, colors: WARM, seed: 198 }), bays: 32, floors: 24, bay: 1.65, floor: 3.3, level: 1.0 },
  );

  // red aviation obstruction lights on buildings above 60 m
  emissiveMat('context.light.aviation', { color: '#ff2a18' });
}

export function nightMaterials() {
  return NIGHT;
}

// ---------------------------------------------------------------- facade families
// bay / floor = grid of the wall texture in tile metres; floorReal = storey height used to
// count floors from the real building height; base = ground-storey material.
const c = (h) => {
  const col = new THREE.Color(h);
  return [col.r, col.g, col.b];
};
export const STYLES = {
  officeBlue: { wall: 'context.office.curtainBlue', bay: 1.5, floor: 4, floorReal: 4.2, base: 'context.office.lobby', baseBay: 3, baseTile: 6, baseH: 5.4, baseMinH: 16, cap: c('#bfc5c8'), solid: c('#b4babd'), roof: 'context.roof.membrane', crown: 'screen' },
  officeDark: { wall: 'context.office.curtainDark', bay: 1.5, floor: 4, floorReal: 4.3, base: 'context.office.lobby', baseBay: 3, baseTile: 6, baseH: 6, baseMinH: 16, cap: c('#d6d9d9'), solid: c('#d0d3d3'), roof: 'context.roof.membrane', crown: 'screen', fins: { every: 2, depth: 0.4, width: 0.28, col: c('#dcdfdf') } },
  officePrecast: { wall: 'context.office.precast', bay: 3, floor: 4, floorReal: 4, base: 'context.office.lobby', baseBay: 3, baseTile: 6, baseH: 4.6, baseMinH: 14, cap: c('#c9c4b9'), solid: c('#cfcabf'), roof: 'context.roof.membrane', crown: 'penthouse' },
  civic: { wall: 'context.civic.wall', bay: 3.9, floor: 3.9, floorReal: 3.9, cap: c('#e2e2dd'), solid: c('#e2e2dd'), roof: 'context.roof.light', crown: 'penthouse' },
  resLight: { wall: 'context.residential.wallLight', bay: 6.2, floor: 3.1, floorReal: 3.15, base: 'context.residential.base', baseBay: 3.1, baseTile: 6.2, baseH: 5.2, baseMinH: 24, cap: c('#e4e3df'), solid: c('#d6d4ce'), roof: 'context.roof.membrane', crown: 'solid', balcony: { depth: 1.5, rail: 'glass', col: c('#e6e5e1') } },
  resBeige: { wall: 'context.residential.wallBeige', bay: 6.2, floor: 3.1, floorReal: 3.15, base: 'context.residential.base', baseBay: 3.1, baseTile: 6.2, baseH: 5.2, baseMinH: 24, cap: c('#cdbfa9'), solid: c('#c6b7a1'), roof: 'context.roof.membrane', crown: 'solid', balcony: { depth: 1.4, rail: 'panel', col: c('#d5c8b3') } },
  hotel: { wall: 'context.hotel.wall', bay: 3.3, floor: 3.3, floorReal: 3.4, base: 'context.office.lobby', baseBay: 3, baseTile: 6, baseH: 5, baseMinH: 16, cap: c('#e1e0db'), solid: c('#dddcd7'), roof: 'context.roof.membrane', crown: 'screen' },
  commercial: { wall: 'context.commercial.wall', bay: 3, floor: 4.5, floorReal: 4.5, base: 'context.commercial.shopfront', baseBay: 3, baseTile: 6, baseH: 4.2, baseMinH: 7.5, cap: c('#c8cac8'), solid: c('#c2c4c2'), roof: 'context.roof.membrane', crown: 'penthouse' },
  shop: { wall: 'context.commercial.shopfront', bay: 3, floor: 6, floorReal: 4.6, oneStorey: true, cap: c('#d6d6d1'), solid: c('#cfcfca'), roof: 'context.roof.membrane', crown: 'penthouse' },
  industrial: { wall: 'context.industrial.siding', bay: 4, floor: 4, floorReal: 6, metric: true, cap: c('#aab1b6'), solid: c('#b3babd'), roof: 'context.roof.metal', crown: 'penthouse', doors: true },
  coldstore: { wall: 'context.industrial.coldstore', bay: 6, floor: 6, floorReal: 6, metric: true, cap: c('#d4d7d6'), solid: c('#dfe1df'), roof: 'context.roof.light', crown: 'penthouse', doors: true },
  utility: { wall: 'context.utility.wall', bay: 3, floor: 3, floorReal: 3, metric: true, cap: c('#a9a8a2'), solid: c('#bdbcb6'), roof: 'context.roof.membrane', crown: 'none' },
  // landmark families
  fujifilmTower: { wall: 'context.fujifilm.glass', bay: 1.5, floor: 4, floorReal: 4.5, base: 'context.office.lobby', baseBay: 3, baseTile: 6, baseH: 6, baseMinH: 16, cap: c('#9fb0b4'), solid: c('#9fb0b4'), roof: 'context.roof.membrane', crown: 'none', ledges: { depth: 0.55, thick: 0.22, col: c('#c9d2d3') } },
  fujifilmLow: { wall: 'context.fujifilm.lowrise', bay: 3, floor: 4.5, floorReal: 4.8, cap: c('#e8e9e7'), solid: c('#e3e4e2'), roof: 'context.roof.light', crown: 'penthouse' },
  okPanel: { wall: 'context.okbuilding.office', bay: 3.7, floor: 3.7, floorReal: 3.7, base: 'context.okbuilding.panel', baseMetric: true, baseFrac: 0.5, baseH: 18, baseMinH: 20, cap: c('#a9adb0'), solid: c('#b3b7b9'), roof: 'context.roof.membrane', crown: 'screen' },
  okBlind: { wall: 'context.okbuilding.panel', bay: 7.2, floor: 7.2, floorReal: 4, metric: true, cap: c('#a9adb0'), solid: c('#b3b7b9'), roof: 'context.roof.membrane', crown: 'none' },
  kahala: { wall: 'context.kahala.glass', bay: 1.65, floor: 3.3, floorReal: 3.6, cap: c('#e4e7e7'), solid: c('#dfe2e2'), roof: 'context.roof.light', crown: 'screen', ledges: { depth: 0.7, thick: 0.25, col: c('#eceeee') } },
};
export const hexToLinear = c;
export { hex };

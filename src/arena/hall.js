// K-Arena Yokohama — the hall's interior envelope at the stage end and along the sides
// (layer "hall"): side walls and stage rear wall, the four U-shaped production galleries
// (演出用バルコニー) with their handrails and end posts, the pleated acoustic curtains with their
// cove light, the nozzle fascia, the arena-level openings and the fill of the wall zone.
//
//   hall/layout.js     wall frames, stations, gallery ends, bands, openings (all numbers)
//   hall/builder.js    triangle collector in wall coordinates → world geometry per material / level
//   hall/walls.js      walls, linings, poche floors and caps
//   hall/galleries.js  gallery structure, handrails, end posts, nozzle fascia
//   hall/curtains.js   curtains (drawn + tied back), cove LED, baked cove glow
//   hall/openings.js   truck portals / GATE 101 + 104, service doors, technical doors, signs
//   hall/wash.js       scalloped wall-wash above the top gallery
//
// Flags (ctx.flags, i.e. URL parameters of the preview):
//   hall=spec        gallery ends and nozzle count exactly as in research/model-spec.json
//                    (default: as read off the official photographs, see layout.js)
//   curtains=tied    start with the curtains tied back (default: drawn)
import * as THREE from 'three';
import { mesh } from '../core/geom.js';
import { mat, emissiveMat } from '../core/materials.js';
import { Buckets } from './hall/builder.js';
import { galleryEnds } from './hall/layout.js';
import { buildWalls } from './hall/walls.js';
import { buildGalleries } from './hall/galleries.js';
import { buildCurtains } from './hall/curtains.js';
import { buildOpenings } from './hall/openings.js';
import { buildWash } from './hall/wash.js';

const LAYER = 'hall';

// Cove light colours. House state: cool white cove, the wine velour reads magenta-pink.
const HOUSE = Object.freeze({ led: '#FFF1FB', glow: '#A558A8', wall: '#57534A', wash: '#3A3833' });
// Show state: the cove cycles slowly through these (seen warm white, pink, purple in photos).
const SHOW = ['#C038B0', '#6A3CE0', '#2E5BEA', '#D0523A', '#E0A050', '#C038B0'];

function gateSignMaterial(id, text) {
  const m = mat(id, { color: '#101012', roughness: 0.6, metalness: 0, tile: 1 });
  if (typeof document !== 'undefined' && !m.map) {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#0c0c0e';
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#ECE9E0';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = '700 168px "DIN Alternate", "DIN Condensed", "Bahnschrift", "Arial Narrow", Arial, sans-serif';
    g.fillText(text, c.width / 2, c.height / 2 + 8);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    m.map = t;
    m.color.set('#ffffff');
  }
  return m;
}

function materials() {
  // additive sheets floating 12-14 mm in front of their surface; the polygon offset keeps them
  // stable against depth-buffer noise when seen from the far end of the hall
  const add = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, vertexColors: true, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 };
  return {
    'hall.wallPanel': mat('hall.wallPanel', { color: '#26272B', roughness: 0.9, metalness: 0, tile: 1.8 }),
    'hall.wallBehindCurtain': mat('hall.wallBehindCurtain', { color: '#5E5A4E', roughness: 0.8, metalness: 0, tile: 2.25 }),
    'hall.wallBlack': mat('hall.wallBlack', { color: '#141416', roughness: 0.7, metalness: 0.1, tile: 2 }),
    'hall.poche': mat('hall.poche', { color: '#1B1C1F', roughness: 1, metalness: 0, tile: 4 }),
    'hall.curtain': mat('hall.curtain', { color: '#7A3566', roughness: 1, metalness: 0, vertexColors: true, side: THREE.DoubleSide, tile: 1.2 }),
    'hall.curtainGlow': emissiveMat('hall.curtainGlow', { color: HOUSE.glow, ...add }),
    'hall.wallGlow': emissiveMat('hall.wallGlow', { color: HOUSE.wall, ...add }),
    'hall.wallWash': emissiveMat('hall.wallWash', { color: HOUSE.wash, ...add }),
    'hall.coveLed': emissiveMat('hall.coveLed', { color: HOUSE.led }),
    'hall.galleryFloor': mat('hall.galleryFloor', { color: '#A39C8F', roughness: 0.7, metalness: 0, tile: 3 }),
    'hall.gallerySteel': mat('hall.gallerySteel', { color: '#2B2D30', roughness: 0.6, metalness: 0.4, tile: 2 }),
    'hall.handrail': mat('hall.handrail', { color: '#111214', roughness: 0.5, metalness: 0.5, tile: 1 }),
    'hall.nozzleFascia': mat('hall.nozzleFascia', { color: '#141416', roughness: 0.6, metalness: 0.3, tile: 2 }),
    'hall.nozzleRing': mat('hall.nozzleRing', { color: '#34363A', roughness: 0.4, metalness: 0.6, tile: 1 }),
    'hall.shutter': mat('hall.shutter', { color: '#2A2C2F', roughness: 0.55, metalness: 0.5, tile: 0.6 }),
    'hall.doorSteel': mat('hall.doorSteel', { color: '#232427', roughness: 0.5, metalness: 0.4, tile: 1.2 }),
    'hall.doorFrame': mat('hall.doorFrame', { color: '#151618', roughness: 0.5, metalness: 0.5, tile: 1 }),
    'hall.threshold': mat('hall.threshold', { color: '#8F8A80', roughness: 0.35, metalness: 0, tile: 4 }),
    'hall.exitSign': emissiveMat('hall.exitSign', { color: '#27D987' }),
    'hall.gateSign101': gateSignMaterial('hall.gateSign101', 'GATE 101'),
    'hall.gateSign104': gateSignMaterial('hall.gateSign104', 'GATE 104'),
  };
}

const UNLIT = new Set(['hall.curtainGlow', 'hall.wallGlow', 'hall.wallWash', 'hall.coveLed', 'hall.exitSign']);
const NAMES = {
  'hall.wallPanel': 'hall walls',
  'hall.wallBehindCurtain': 'wall behind curtains',
  'hall.wallBlack': 'black wall and recesses',
  'hall.poche': 'wall zone fill',
  'hall.curtain': 'acoustic curtain',
  'hall.curtainGlow': 'cove glow on curtain',
  'hall.wallGlow': 'cove glow on wall',
  'hall.wallWash': 'wall wash',
  'hall.coveLed': 'cove LED',
  'hall.galleryFloor': 'gallery walkway',
  'hall.gallerySteel': 'gallery steel',
  'hall.handrail': 'gallery handrail',
  'hall.nozzleFascia': 'nozzle fascia',
  'hall.nozzleRing': 'nozzle rings',
  'hall.shutter': 'roll shutters',
  'hall.doorSteel': 'doors',
  'hall.doorFrame': 'door frames',
  'hall.threshold': 'door sills',
  'hall.exitSign': 'exit signs',
  'hall.gateSign101': 'gate sign 101',
  'hall.gateSign104': 'gate sign 104',
};

/** Show the curtains 'drawn' (closed, absorbing) or 'tied' (bunched every 4.5 m, wall exposed). */
export function setCurtains(group, state) {
  const tied = state === 'tied' || state === 'open';
  group.traverse((o) => {
    if (o.userData.curtainState === 'drawn') o.visible = !tied;
    else if (o.userData.curtainState === 'tied') o.visible = tied;
  });
  if (group.userData.hall) group.userData.hall.curtains = tied ? 'tied' : 'drawn';
}

export function build(ctx = {}) {
  const flags = ctx.flags || {};
  const variant = flags.hall === 'spec' ? 'spec' : 'photo';
  const low = ctx.quality === 'low';
  const ends = galleryEnds(variant);
  const opts = { ends, variant, low };

  const B = new Buckets();
  buildWalls(B, opts);
  buildGalleries(B, opts);
  buildCurtains(B, opts);
  buildOpenings(B, opts);
  buildWash(B, opts);

  const M = materials();
  const group = new THREE.Group();
  group.name = 'hall';
  group.userData.layer = LAYER;
  for (const b of B.map.values()) {
    if (b.triangles === 0) continue;
    const unlit = UNLIT.has(b.matId);
    const m = mesh(b.geometry(), M[b.matId], {
      name: `${NAMES[b.matId] || b.matId}${b.tag ? ` (${b.tag})` : ''} L${b.level}`,
      layer: LAYER,
      level: b.level,
      cast: !unlit && b.matId !== 'hall.curtain',
      receive: !unlit,
    });
    if (b.tag) m.userData.curtainState = b.tag;
    if (unlit && b.matId !== 'hall.coveLed' && b.matId !== 'hall.exitSign') m.renderOrder = 2;
    group.add(m);
  }
  group.userData.hall = {
    ends,
    variant,
    curtains: 'drawn',
    led: M['hall.coveLed'],
    glow: M['hall.curtainGlow'],
    wall: M['hall.wallGlow'],
    wash: M['hall.wallWash'],
    key: '',
  };
  setCurtains(group, flags.curtains === 'tied' || flags.curtains === 'open' ? 'tied' : 'drawn');
  return group;
}

const cA = new THREE.Color();
const cB = new THREE.Color();

/** Cove colour: steady cool white in the house state, a slow colour cycle in show mode. */
export function update(group, state) {
  const u = group.userData.hall;
  if (!u) return;
  if (!state || !state.show) {
    if (u.key === 'house') return;
    u.key = 'house';
    u.led.color.set(HOUSE.led);
    u.glow.color.set(HOUSE.glow);
    u.wall.color.set(HOUSE.wall);
    u.wash.color.set(HOUSE.wash);
    return;
  }
  u.key = 'show';
  const t = ((state.time || 0) / 9) % (SHOW.length - 1);
  const i = Math.floor(t);
  const f = t - i;
  const k = f * f * (3 - 2 * f);
  cA.set(SHOW[i]).lerp(cB.set(SHOW[i + 1]), k);
  u.led.color.copy(cA).lerp(cB.set('#ffffff'), 0.25);
  u.glow.color.copy(cA).multiplyScalar(0.62);
  u.wall.color.copy(cA).multiplyScalar(0.4);
  u.wash.color.set('#000000'); // house lights are out during a show
}

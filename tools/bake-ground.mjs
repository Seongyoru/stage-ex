#!/usr/bin/env node
// Bakes the ground of the site diorama: converts research/geo/site-context.geojson
// (OpenStreetMap, ODbL) to the WORLD frame, keeps what touches the diorama disc, simplifies
// it and writes src/site/data/ground-data.js. The two road bridges and the park footbridge
// use plan outlines and levels read from the MLIT PLATEAU 2024 bridge CityGML
// (research/geo/plateau/citygml/53391550_brid_6697_op.gml); those numbers are constants below.
//
//   node tools/bake-ground.mjs            (no dependencies; re-runnable)
//
// Exact clipping to the disc happens at build time on triangles (src/site/ground/util.js);
// here features are only culled and line work is cut at radius + MARGIN.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { lonLatToWorld } = await import(pathToFileURL(resolve(root, 'src/core/frame.js')).href);
const { DIORAMA } = await import(pathToFileURL(resolve(root, 'src/core/envelope.js')).href);

const { cx: CX, cz: CZ, radius: R } = DIORAMA;
const MARGIN = 30; // line work is kept this far beyond the rim so ribbons can be clipped cleanly
const gj = JSON.parse(readFileSync(resolve(root, 'research/geo/site-context.geojson'), 'utf8'));

// ---------------------------------------------------------------------------------------
// helpers
const r1 = (v) => Math.round(v * 10) / 10;
const key = (c) => `${c[0].toFixed(7)},${c[1].toFixed(7)}`;
const W = (c) => lonLatToWorld(c[0], c[1]);
const flat = (pts) => pts.flatMap((p) => [r1(p[0]), r1(p[1])]);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const distC = (p) => Math.hypot(p[0] - CX, p[1] - CZ);
const osmId = (p) => String(p.osm_id || '').replace(/^\w+\//, '');

function openRing(coords) {
  const r = coords.slice();
  if (r.length > 1 && key(r[0]) === key(r[r.length - 1])) r.pop();
  return r;
}
function ringArea(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
}
function ringCentroid(pts) {
  let a = 0;
  let x = 0;
  let z = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    const c = p[0] * q[1] - q[0] * p[1];
    a += c;
    x += (p[0] + q[0]) * c;
    z += (p[1] + q[1]) * c;
  }
  return [x / (3 * a), z / (3 * a)];
}
function pointInRing(p, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    if (a[1] > p[1] !== b[1] > p[1] && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
function distToSeg(p, a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const l2 = dx * dx + dz * dz;
  let t = l2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz);
}
function distToLine(p, pts) {
  let d = Infinity;
  for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, distToSeg(p, pts[i], pts[i + 1]));
  return d;
}
function distToRing(p, ring) {
  let d = Infinity;
  for (let i = 0; i < ring.length; i++) d = Math.min(d, distToSeg(p, ring[i], ring[(i + 1) % ring.length]));
  return d;
}
function lineLength(pts) {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += dist(pts[i - 1], pts[i]);
  return l;
}
function pointAlong(pts, s) {
  for (let i = 1; i < pts.length; i++) {
    const l = dist(pts[i - 1], pts[i]);
    if (s <= l || i === pts.length - 1) {
      const t = l ? Math.min(1, s / l) : 0;
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t, Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])];
    }
    s -= l;
  }
  return [...pts[pts.length - 1], 0];
}
/** Douglas-Peucker on an open polyline of [x, z]. */
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let worst = 0;
    let wi = -1;
    for (let i = a + 1; i < b; i++) {
      const d = distToSeg(pts[i], pts[a], pts[b]);
      if (d > worst) {
        worst = d;
        wi = i;
      }
    }
    if (worst > tol) {
      keep[wi] = 1;
      stack.push([a, wi], [wi, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}
/** Parts of a polyline that lie inside the circle of radius `rad` around the disc centre. */
function clipLine(pts, rad) {
  const out = [];
  let cur = [];
  const inside = (p) => distC(p) <= rad;
  const cross = (a, b) => {
    // parameter(s) t where |a + t (b - a) - c| = rad
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const fx = a[0] - CX;
    const fz = a[1] - CZ;
    const A = dx * dx + dz * dz;
    const B = 2 * (fx * dx + fz * dz);
    const C = fx * fx + fz * fz - rad * rad;
    const D = B * B - 4 * A * C;
    if (D < 0 || A === 0) return [];
    const s = Math.sqrt(D);
    return [(-B - s) / (2 * A), (-B + s) / (2 * A)].filter((t) => t > 0 && t < 1).map((t) => [a[0] + dx * t, a[1] + dz * t]);
  };
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (i > 0) {
      const xs = cross(pts[i - 1], p);
      const a = inside(pts[i - 1]);
      if (a && xs.length) {
        cur.push(xs[0]);
        out.push(cur);
        cur = [];
        if (xs.length > 1) cur.push(xs[1]);
      } else if (!a && xs.length === 2) {
        out.push([xs[0], xs[1]]);
      } else if (!a && xs.length === 1) {
        cur = [xs[0]];
      }
    }
    if (inside(p)) cur.push(p);
  }
  if (cur.length > 1) out.push(cur);
  return out.filter((l) => l.length > 1 && lineLength(l) > 0.5);
}

/**
 * Merge two rings of lon/lat that share a run of identical consecutive vertices (a common
 * boundary) into one ring. Returns null when they do not share at least one edge.
 */
function spliceRings(A, B) {
  const kb = new Map(B.map((c, i) => [key(c), i]));
  const n = A.length;
  const shared = A.map((c) => kb.has(key(c)));
  if (!shared.some(Boolean) || shared.every(Boolean)) return null;
  // start of the shared run: a shared vertex whose predecessor is not shared
  let i0 = -1;
  for (let i = 0; i < n; i++) if (shared[i] && !shared[(i + n - 1) % n]) i0 = i;
  if (i0 < 0) return null;
  let i1 = i0;
  while (shared[(i1 + 1) % n]) i1 = (i1 + 1) % n;
  if (i1 === i0) return null; // touches in one point only
  // A without the interior of the shared run: from i1 forward round to i0
  const out = [];
  for (let i = i1; ; i = (i + 1) % n) {
    out.push(A[i]);
    if (i === i0) break;
  }
  // B from the vertex matching A[i0] to the one matching A[i1], the long way round
  const m = B.length;
  const b0 = kb.get(key(A[i0]));
  const b1 = kb.get(key(A[i1]));
  const dir = key(B[(b0 + 1) % m]) === key(A[(i0 + 1) % n]) ? -1 : 1; // walk away from the shared run
  for (let j = (b0 + dir + m) % m; j !== b1; j = (j + dir + m) % m) out.push(B[j]);
  return out;
}

const feats = gj.features;
const byId = (id) => feats.find((f) => osmId(f.properties) === String(id));
const stats = {};
const count = (k) => (stats[k] = (stats[k] || 0) + 1);

// ---------------------------------------------------------------------------------------
// water
// The Katabira river (帷子川) polygon stops at a straight closure line across the river mouth;
// the harbour basin beyond it is only given as coastline ways. Replace the closure edge with
// the two coastline branches (closed far outside the disc), then add the next river polygon
// upstream of Minato Mirai Ohashi and the tidal beach, which all share exact OSM nodes.
const river = openRing(byId(13545312).geometry.coordinates[0]);
const river2 = openRing(byId(1122623).geometry.coordinates[0]);
const coastA = byId(130990593).geometry.coordinates; // ... east quay ... → river mouth east tip → mouth
const coastB = byId(130991417).geometry.coordinates; // mouth → west quay → north
const beach = openRing(byId(934667678).geometry.coordinates[0]);
const pond = openRing(byId(328302490).geometry.coordinates[0]);

function harbourSplice(ring) {
  const kr = new Map(ring.map((c, i) => [key(c), i]));
  // west quay: first vertex of coastB that is also on the river ring
  const bi = coastB.findIndex((c) => kr.has(key(c)));
  // east tip: last vertex of coastA that is on the river ring
  let ai = -1;
  coastA.forEach((c, i) => {
    if (kr.has(key(c))) ai = i;
  });
  if (bi < 0 || ai < 0) throw new Error('harbour coastline does not meet the river polygon');
  const iw = kr.get(key(coastB[bi]));
  const ie = kr.get(key(coastA[ai]));
  const n = ring.length;
  if ((iw + 1) % n !== ie && (ie + 1) % n !== iw) throw new Error(`river mouth closure edge not found (${iw}, ${ie})`);
  // path west quay → far north → (closure outside the disc) → east quay → east tip
  const path = [...coastB.slice(bi + 1), ...coastA.slice(0, ai)];
  const out = [];
  if ((iw + 1) % n === ie) {
    for (let k = 0; k < n; k++) {
      const i = (ie + k) % n;
      out.push(ring[i]);
    }
    // ring now runs ie … iw; append the path iw → ie
    out.push(...path);
  } else {
    for (let k = 0; k < n; k++) out.push(ring[(iw + k) % n]);
    out.push(...path.slice().reverse());
  }
  return out;
}

let waterLL = harbourSplice(river);
const withRiver2 = spliceRings(waterLL, river2);
if (!withRiver2) throw new Error('river polygons do not share an edge');
waterLL = withRiver2;
// The tidal beach (natural=beach) lies INSIDE the river polygon, along the park edge: the
// basin cut out of the ground is the river ring itself and the beach slopes down into it.
const waterNoBeach = waterLL;
const basinLL = waterLL;

const toWorldRing = (ll) => ll.map(W);
const water = {
  // ring of the open water surface (river + harbour)
  main: toWorldRing(waterNoBeach),
  // ring cut out of the ground (water + beach): quay walls follow it
  basin: toWorldRing(basinLL),
  beach: toWorldRing(beach),
  pond: toWorldRing(pond),
};
// beach vertices shared with the river ring are the top of the slope (park edge, dry);
// the others lie out in the river and form the submerged foot of the slope
const riverKeys = new Set(river.map(key));
water.beachWet = beach.map((c) => (riverKeys.has(key(c)) ? 0 : 1));

// ---------------------------------------------------------------------------------------
// land-use polygons
const siteRing = openRing(feats.find((f) => f.properties.kind === 'site').geometry.coordinates[0]).map(W);
const inSite = (p) => pointInRing(p, siteRing);
const mostlyInSite = (pts) => pts.filter(inSite).length > pts.length * 0.6;

function landClass(p) {
  if (p.kind === 'park') return 'park';
  if (p.kind === 'parking') return 'parking';
  if (p.kind === 'landuse') {
    if (p.natural === 'grassland') return 'meadow';
    if (p.leisure === 'garden') return 'garden';
    if (p.landuse === 'grass') return 'grass';
    if (p.landuse === 'greenfield') return 'vacant';
    if (p.landuse === 'brownfield') return /駐車場/.test(p.name || '') ? 'parking' : 'vacantGrass';
    if (p.landuse === 'construction') return 'construction';
    if (p.landuse === 'residential' || p.landuse === 'commercial') return 'block';
  }
  return null;
}
const land = [];
for (const f of feats) {
  const p = f.properties;
  if (f.geometry.type !== 'Polygon') continue;
  const cls = landClass(p);
  if (!cls) continue;
  const ring = openRing(f.geometry.coordinates[0]).map(W);
  if (Math.min(...ring.map(distC)) > R && !pointInRing([CX, CZ], ring)) {
    // may still cross the disc with a long edge
    if (distToRing([CX, CZ], ring) > R) continue;
  }
  if (mostlyInSite(ring)) {
    count('land skipped (on the Music Terrace site)');
    continue;
  }
  const holes = [];
  if (cls === 'park' && water.pond.every((q) => pointInRing(q, ring))) holes.push('pond');
  land.push({ cls, name: p.name || '', id: osmId(p), ring, holes, area: Math.abs(ringArea(ring)) });
  count(`land ${cls}`);
}
// big polygons first so that small gardens are drawn over the parks that contain them
land.sort((a, b) => b.area - a.area);

// ---------------------------------------------------------------------------------------
// roads
function roadWidth(p) {
  const lanes = Number(p.lanes) || 0;
  const oneway = p.oneway === 'yes';
  const name = p.name || '';
  switch (p.highway) {
    case 'tertiary':
      if (/みなとみらい大橋|みなとみらい大通り/.test(name)) return 10.5; // 3 lanes each way
      if (/みなとみらい橋/.test(name)) return 6.6;
      if (oneway) return lanes >= 3 ? 10 : 7; // 2 lanes of a dual carriageway
      return lanes === 1 ? 6.5 : lanes === 2 ? 7.5 : 8;
    case 'tertiary_link':
      return 6.6;
    case 'unclassified':
      return oneway ? 6.2 : 7;
    case 'residential':
      return 6;
    default:
      return oneway ? 4 : 4.8; // service
  }
}
const roads = [];
for (const f of feats) {
  const p = f.properties;
  if (p.kind !== 'road') continue;
  if (p.tunnel === 'yes' || Number(p.layer) < 0) {
    count('road skipped (tunnel)');
    continue;
  }
  const pts = f.geometry.coordinates.map(W);
  for (const part of clipLine(pts, R + MARGIN)) {
    roads.push({
      id: osmId(p),
      name: p.name || '',
      cls: p.highway,
      w: roadWidth(p),
      oneway: p.oneway === 'yes' ? 1 : 0,
      lanes: Number(p.lanes) || 0,
      bridge: p.bridge ? 1 : 0,
      passage: p.tunnel === 'building_passage' ? 1 : 0,
      pts: simplify(part, 0.15),
    });
    count(`road ${p.highway}`);
  }
}

// ---------------------------------------------------------------------------------------
// bridges — MLIT PLATEAU 2024 LOD2 (heights converted to metres above the arena floor, 4.18 m T.P.)
// Each deck is a centre line with [x, z, y, width]; `kind` per segment: 'fill' = solid approach
// on land, 'span' = open span over water. The flat model clamps the approaches to y = 0.
const decks = [
  {
    name: 'みなとみらい大橋',
    en: 'Minato Mirai Ohashi',
    // PLATEAU brid_74844d17: main span 220 m x 50 m at +2.5..+3.0, slab 1.5 m; north abutment 40 m wide
    pts: [
      [-123.2, 407.9, 0, 40],
      [-71.3, 389.6, 2.45, 40],
      [0.95, 364.4, 2.6, 49],
      [104.8, 327.9, 2.7, 50],
      [208.6, 291.3, 3.0, 50],
      [301.6, 258.5, 3.0, 50],
      [376.3, 232.2, 0, 50],
    ],
    kinds: ['fill', 'fill', 'span', 'span', 'fill', 'fill'],
    slab: 1.5,
    // PLATEAU BridgeConstructionElement: one wall pier in mid river, 38 m x 1 m
    piers: [{ a: [80.9, 318.4], b: [109.4, 343.8], t: 1.0 }],
    median: 4,
  },
  {
    name: 'みなとみらい橋',
    en: 'Minato Mirai-bashi',
    // PLATEAU brid_def9f9e7: curved, 35.5 → 38.5 → 45 m wide, crest +3.9 at mid channel
    pts: [
      [-342.2, -246.2, 0, 35.5],
      [-312.6, -232.3, 0.3, 35.5],
      [-281.3, -220.8, 1.25, 35.5],
      [-258.5, -214.0, 2.05, 36],
      [-243.2, -210.4, 2.65, 36.5],
      [-228.0, -207.6, 3.1, 37],
      [-200.6, -203.7, 3.55, 38],
      [-177.4, -201.9, 3.55, 38.5],
      [-155.2, -201.3, 3.4, 39.5],
      [-132.2, -201.8, 2.9, 41],
      [-112.9, -203.7, 2.4, 43],
      [-85.9, -207.5, 1.0, 45],
      [-57.7, -213.3, 0.3, 45],
      [-36.0, -218.5, 0, 45],
    ],
    kinds: ['fill', 'fill', 'fill', 'span', 'span', 'span', 'span', 'span', 'span', 'span', 'fill', 'fill', 'fill'],
    slab: 1.5,
    // pier positions are not in the survey data: two wall piers at the third points (ESTIMATED)
    piers: [
      { a: [-212.6, -186.6], b: [-217.6, -224.2], t: 1.2 },
      { a: [-164.6, -182.2], b: [-166.6, -221.2], t: 1.2 },
    ],
    median: 0,
  },
];

// Park footbridge over the freight line (PLATEAU brid_ccdc0328, OSM ways 328302480 / …96 / …89):
// deck 149 m2, walking surface about +6.7, underside +5.7, two lift towers to +10.4, dog-leg stairs.
const parkFootbridge = {
  name: '高島水際線公園 人道橋',
  deckY: 6.7,
  soffitY: 5.7,
  // deck outline (PLATEAU OuterFloorSurface, 21 vertices)
  deck: [
    [-38.9, 169.0], [-38.8, 170.9], [-38.0, 172.2], [-36.6, 173.0], [-33.7, 173.6], [-33.3, 171.7], [-34.1, 171.5], [-33.9, 170.7], [-33.3, 168.4], [-34.2, 168.2],
    [-29.3, 146.6], [-28.9, 144.2], [-29.5, 142.7], [-30.7, 141.7], [-34.4, 140.7], [-34.8, 142.7], [-34.0, 142.9], [-34.2, 143.9], [-34.7, 146.1], [-33.8, 146.3],
  ],
  towers: [
    { ring: [[-37.9, 142.1], [-34.9, 142.8], [-34.0, 139.2], [-37.1, 138.5]], top: 10.4 },
    { ring: [[-34.1, 175.3], [-31.1, 175.9], [-30.2, 172.1], [-33.2, 171.5]], top: 10.4 },
  ],
  // stair flights as quads with the level of each end: [[x, z] x 4, yLow, yHigh] (low end first two points)
  flights: [
    { quad: [[-45.5, 140.0], [-46.3, 142.3], [-41.0, 144.6], [-40.2, 142.3]], y0: 2.2, y1: 4.8 },
    { quad: [[-49.4, 138.5], [-50.2, 140.8], [-47.6, 141.9], [-46.7, 139.6]], y0: 0.0, y1: 2.2 },
    { quad: [[-38.7, 142.8], [-39.2, 145.0], [-34.7, 146.1], [-34.2, 143.9]], y0: 4.8, y1: 6.7 },
    { quad: [[-27.3, 169.7], [-27.9, 172.0], [-33.9, 170.7], [-33.3, 168.4]], y0: 4.9, y1: 6.7 },
    { quad: [[-20.7, 171.3], [-21.2, 173.5], [-26.5, 172.3], [-26.0, 170.0]], y0: 0.8, y1: 4.9 },
    { quad: [[-16.5, 172.2], [-17.1, 174.5], [-19.9, 173.8], [-19.4, 171.6]], y0: 0.0, y1: 0.8 },
  ],
  landings: [
    { ring: [[-41.0, 144.6], [-39.2, 145.0], [-38.7, 142.8], [-40.2, 142.3]], y: 4.8 },
    { ring: [[-46.3, 142.3], [-45.5, 140.0], [-46.7, 139.6], [-47.6, 141.9]], y: 2.2 },
    { ring: [[-27.9, 172.0], [-26.5, 172.3], [-26.0, 170.0], [-27.3, 169.7]], y: 4.9 },
    { ring: [[-21.2, 173.5], [-19.9, 173.8], [-19.4, 171.6], [-20.7, 171.3]], y: 0.8 },
  ],
};

// Freight-line bridge over the Katabira river (OSM way 224934439 and its west approach):
// several parallel deck-girder lines, only one still carries track (aerial photo).
const railBridge = (() => {
  const a = W(byId(224934439).geometry.coordinates[0]);
  const b = W(byId(224934439).geometry.coordinates[1]);
  return { a, b, lines: [-8.4, -4.2, 0, 4.2, 8.4], spans: 7 };
})();

const deckHit = (p) => {
  for (const d of decks) {
    for (let i = 0; i < d.pts.length - 1; i++) {
      const a = d.pts[i];
      const b = d.pts[i + 1];
      if (distToSeg(p, a, b) < Math.max(a[3], b[3]) / 2 + 2) return true;
    }
  }
  return false;
};

// ---------------------------------------------------------------------------------------
// paths: footways, sidewalks, crossings, cycleways, pedestrian streets, steps
// On the Music Terrace site (decks, stairs, plaza) everything belongs to site/precinct.
const PARK_FOOTBRIDGE = new Set(['328302480', '328302496', '328302489']); // modelled as an object
const paths = [];
const skywalks = [];
for (const f of feats) {
  const p = f.properties;
  if (!['footway', 'steps', 'pedestrian_area', 'pedestrian_deck_bridge'].includes(p.kind)) continue;
  if (f.geometry.type !== 'LineString') continue;
  const id = osmId(p);
  if (PARK_FOOTBRIDGE.has(id)) continue;
  if (Number(p.layer) < 0) continue;
  const pts = f.geometry.coordinates.map(W);
  if (mostlyInSite(pts) || /高島水際線デッキ/.test(p.name || '') || id === '1352486719') {
    count('path skipped (on site / station deck)');
    continue;
  }
  // ways riding on a road-bridge deck are ordinary paths (the deck lifts them)
  const onDeck = pts.filter((q) => deckHit(q)).length >= pts.length * 0.6;
  const elevated = !onDeck && (p.kind === 'pedestrian_deck_bridge' || (Number(p.layer) >= 1 && p.footway !== 'sidewalk'));
  let cls = 'path';
  let w = 3;
  if (p.kind === 'steps') {
    cls = 'steps';
    w = 3;
  } else if (p.kind === 'pedestrian_deck_bridge') {
    cls = 'sidewalk';
    w = 3;
  } else if (p.kind === 'pedestrian_area') {
    cls = 'promenade';
    w = 5;
  } else if (p.highway === 'cycleway') {
    cls = 'cycle';
    w = 3;
  } else if (p.footway === 'sidewalk') {
    cls = 'sidewalk';
    w = 3;
  } else if (p.footway === 'crossing') {
    cls = 'crossing';
    w = 4;
  }
  for (const part of clipLine(pts, R + MARGIN)) {
    const rec = { id, name: p.name || '', cls, w, pts: simplify(part, 0.15) };
    if (elevated) {
      // sidewalks of the road bridges ride on the bridge deck; everything else is a skywalk
      skywalks.push({ ...rec, w: p.kind === 'steps' ? 2.4 : 4, steps: p.kind === 'steps' ? 1 : 0 });
      count('skywalk');
    } else {
      paths.push(rec);
      count(`path ${cls}`);
    }
  }
}
// Small isolated "bridges" (a footbridge over a park stream, a few steps) are not skywalks:
// group the elevated pieces by shared end points and demote groups shorter than 45 m to paths.
{
  const parent = skywalks.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const ends = (s) => [s.pts[0], s.pts[s.pts.length - 1]];
  for (let i = 0; i < skywalks.length; i++) {
    for (let j = i + 1; j < skywalks.length; j++) {
      const touch = ends(skywalks[i]).some((p) => distToLine(p, skywalks[j].pts) < 1.5) || ends(skywalks[j]).some((p) => distToLine(p, skywalks[i].pts) < 1.5);
      if (touch) parent[find(i)] = find(j);
    }
  }
  const total = new Map();
  skywalks.forEach((s, i) => total.set(find(i), (total.get(find(i)) || 0) + lineLength(s.pts)));
  for (let i = skywalks.length - 1; i >= 0; i--) {
    if (total.get(find(i)) >= 45) continue;
    const s = skywalks[i];
    paths.push({ id: s.id, name: s.name, cls: s.steps ? 'steps' : 'path', w: 2.5, pts: s.pts });
    count('skywalk demoted to path');
  }
  const keep = skywalks.filter((s, i) => total.get(find(i)) >= 45);
  skywalks.length = 0;
  skywalks.push(...keep);
}

// paved pedestrian areas mapped as polygons (off site, at ground level)
const plazas = [];
for (const f of feats) {
  const p = f.properties;
  if (p.kind !== 'pedestrian_area' || f.geometry.type !== 'Polygon' || Number(p.layer) >= 1) continue;
  const ring = openRing(f.geometry.coordinates[0]).map(W);
  if (Math.min(...ring.map(distC)) > R || mostlyInSite(ring)) continue;
  plazas.push({ id: osmId(p), name: p.name || '', ring });
  count('plaza');
}

// ---------------------------------------------------------------------------------------
// railway: the Takashima freight line (active single track); abandoned alignments are gone
const rails = [];
for (const f of feats) {
  const p = f.properties;
  if (p.kind !== 'railway' || p.railway !== 'rail' || p.tunnel) continue;
  const pts = f.geometry.coordinates.map(W);
  for (const part of clipLine(pts, R + MARGIN)) {
    rails.push({ id: osmId(p), name: p.name || '', bridge: p.bridge ? 1 : 0, pts: simplify(part, 0.1) });
    count('rail');
  }
}
// join pieces that share end points into continuous tracks (bridge flags are kept per piece)
const tunnelWay = byId(220962684);
const tunnelPortal = W(tunnelWay.geometry.coordinates[0]);
const tunnelDir = (() => {
  const a = W(tunnelWay.geometry.coordinates[0]);
  const b = W(tunnelWay.geometry.coordinates[1]);
  const l = dist(a, b);
  return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
})();

// ---------------------------------------------------------------------------------------
// trees: OSM points + procedural street and park trees (deterministic)
let seed = 20230929;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const inWater = (p) => pointInRing(p, water.basin) || pointInRing(p, water.pond);
const roofRing = [[21.19, -34.7], [91.1, 70.6], [41.16, 103.76], [-41.16, 103.76], [-91.1, 70.6], [-21.19, -34.7]];
const trees = []; // [x, z, species, scale]
const siteTrees = [];
const treeGrid = new Map();
const cell = (p) => `${Math.floor(p[0] / 8)},${Math.floor(p[1] / 8)}`;
const nearTree = (p, d) => {
  const gx = Math.floor(p[0] / 8);
  const gz = Math.floor(p[1] / 8);
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const q of treeGrid.get(`${gx + i},${gz + j}`) || []) if (dist(p, q) < d) return true;
  return false;
};
const addTree = (p, species, scale) => {
  trees.push([p[0], p[1], species, scale]);
  const c = cell(p);
  if (!treeGrid.has(c)) treeGrid.set(c, []);
  treeGrid.get(c).push(p);
};
const roadClear = (p, extra = 0) => roads.every((r) => distToLine(p, r.pts) > r.w / 2 + extra);
const railClear = (p, d) => rails.every((r) => distToLine(p, r.pts) > d);
const parkRings = land.filter((l) => l.cls === 'park' || l.cls === 'garden' || l.cls === 'grass');
const inPark = (p) => parkRings.some((l) => pointInRing(p, l.ring));

const osmTrees = feats.find((f) => f.properties.kind === 'trees').geometry.coordinates.map(W);
for (const p of osmTrees) {
  if (distC(p) > R - 2) continue;
  if (inSite(p)) {
    siteTrees.push(p);
    continue;
  }
  if (inWater(p) || pointInRing(p, roofRing)) continue;
  // species: street trees (near a road) are zelkova-like, park trees mixed
  const street = !roadClear(p, 6);
  const k = rnd();
  addTree(p, street ? 0 : k < 0.55 ? 1 : k < 0.85 ? 0 : 2, 0.85 + rnd() * 0.4);
  count('tree (OSM)');
}
// street trees along the kerb of the main streets where the data has none
for (const r of roads) {
  if (!['tertiary', 'unclassified'].includes(r.cls) || r.bridge) continue;
  const len = lineLength(r.pts);
  const step = 9.5;
  for (const side of [-1, 1]) {
    for (let s = step * (0.5 + rnd() * 0.3); s < len - 6; s += step) {
      const [x, z, ang] = pointAlong(r.pts, s);
      const off = r.w / 2 + 1.3;
      const p = [x - Math.sin(ang) * off * side, z + Math.cos(ang) * off * side];
      if (distC(p) > R - 3 || distC(p) < 292 || inSite(p) || inWater(p) || deckHit(p)) continue; // OSM trees cover 300 m around the arena
      if (!roads.every((q) => q === r || distToLine(p, q.pts) > q.w / 2 + 1.0)) continue; // median or junction
      if (!railClear(p, 6) || nearTree(p, 7)) continue;
      if (distToRing(p, water.basin) < 3) continue;
      addTree(p, 0, 0.8 + rnd() * 0.35);
      count('tree (street, procedural)');
    }
  }
}
// park trees: loose groups away from paths and water
for (const l of land) {
  if (l.cls !== 'park') continue;
  const xs = l.ring.map((p) => p[0]);
  const zs = l.ring.map((p) => p[1]);
  const want = Math.round(l.area / 650);
  let placed = 0;
  for (let tries = 0; tries < want * 30 && placed < want; tries++) {
    const p = [Math.min(...xs) + rnd() * (Math.max(...xs) - Math.min(...xs)), Math.min(...zs) + rnd() * (Math.max(...zs) - Math.min(...zs))];
    if (!pointInRing(p, l.ring) || distC(p) > R - 3 || inWater(p) || inSite(p)) continue;
    if (distToRing(p, l.ring) < 2.5 || distToRing(p, water.pond) < 5 || distToRing(p, water.basin) < 4) continue;
    if (!roadClear(p, 2) || !railClear(p, 7) || nearTree(p, 9) || deckHit(p)) continue;
    if (paths.some((q) => distToLine(p, q.pts) < q.w / 2 + 1.2)) continue;
    if (parkFootbridge.deck.some((q) => dist(p, q) < 9)) continue;
    const k = rnd();
    addTree(p, k < 0.5 ? 1 : k < 0.8 ? 0 : 2, 0.8 + rnd() * 0.6);
    placed++;
    count('tree (park, procedural)');
  }
}

// ---------------------------------------------------------------------------------------
// labels for the app (text in Japanese as signed on site, `en` for an English UI)
const EN = {
  'とちのき通り': 'Tochinoki-dori',
  'みなとみらい大通り': 'Minato Mirai Odori',
  'みなとみらい大橋': 'Minato Mirai Ohashi',
  'みなとみらい橋': 'Minato Mirai-bashi',
  'すずかけ通り': 'Suzukake-dori',
  '国際大通り': 'Kokusai Odori',
  '臨港幹線道路': 'Rinko Kansen Road',
  '高島水際線公園': 'Takashima Suisaisen Park',
  'ポートサイド公園': 'Portside Park',
  '高島中央公園': 'Takashima Chuo Park',
  '潮入りの池': 'Tidal pond',
  '高島線': 'JR Takashima freight line',
};
const labels = [];
// one label per road name: middle of the longest in-disc piece
const byName = new Map();
for (const r of roads) {
  if (!r.name) continue;
  const inPts = clipLine(r.pts, R - 25).sort((a, b) => lineLength(b) - lineLength(a))[0];
  if (!inPts) continue;
  const len = lineLength(inPts);
  if (!byName.has(r.name) || byName.get(r.name).len < len) byName.set(r.name, { len, pts: inPts, bridge: r.bridge });
}
const deckY = (name) => {
  const d = decks.find((q) => q.name === name);
  return d ? Math.max(...d.pts.map((p) => p[2])) : 0;
};
for (const [name, v] of byName) {
  const [x, z] = pointAlong(v.pts, v.len / 2);
  labels.push({ text: name, en: EN[name] || name, x: r1(x), y: r1(deckY(name)), z: r1(z), kind: v.bridge ? 'bridge' : 'road' });
}
for (const l of land) {
  if (l.cls !== 'park' || !l.name) continue;
  // label position: centroid of the part inside the disc (approximated by in-disc vertices)
  const inside = l.ring.filter((p) => distC(p) < R - 20);
  if (inside.length < 3) continue;
  let c = ringCentroid(l.ring);
  if (distC(c) > R - 30 || !pointInRing(c, l.ring)) c = [inside.reduce((s, p) => s + p[0], 0) / inside.length, inside.reduce((s, p) => s + p[1], 0) / inside.length];
  labels.push({ text: l.name, en: EN[l.name] || l.name, x: r1(c[0]), y: 0, z: r1(c[1]), kind: 'park' });
}
{
  const c = ringCentroid(water.pond);
  labels.push({ text: '潮入りの池', en: EN['潮入りの池'], x: r1(c[0]), y: 0, z: r1(c[1]), kind: 'water' });
  // river and harbour: positions picked on open water (see the aerial photo)
  labels.push({ text: '帷子川', en: 'Katabira River', x: -60, y: 0, z: 262, kind: 'water' });
  labels.push({ text: '帷子川', en: 'Katabira River', x: -250, y: 0, z: -40, kind: 'water' });
  labels.push({ text: '横浜港', en: 'Port of Yokohama', x: -175, y: 0, z: -290, kind: 'water' });
  const track = rails.find((r) => !r.bridge && r.pts.length > 4);
  if (track) {
    const [x, z] = pointAlong(track.pts, lineLength(track.pts) * 0.35);
    labels.push({ text: 'JR高島線（貨物線）', en: EN['高島線'], x: r1(x), y: 0, z: r1(z), kind: 'rail' });
  }
  labels.push({ text: 'HARBOR EDGE PROJECT（62街区）', en: 'Harbor Edge Project (block 62)', x: -135, y: 0, z: -35, kind: 'place' });
  labels.push({ text: '60・61街区（未利用地）', en: 'Blocks 60/61 (vacant lot)', x: 120, y: 0, z: -5, kind: 'place' });
}

// ---------------------------------------------------------------------------------------
// write
const data = {
  disc: { cx: CX, cz: CZ, radius: R },
  water: { main: flat(water.main), basin: flat(water.basin), beach: flat(water.beach), beachWet: water.beachWet, pond: flat(water.pond) },
  site: flat(siteRing),
  land: land.map((l) => ({ cls: l.cls, name: l.name, id: l.id, ring: flat(l.ring), holes: l.holes })),
  plazas: plazas.map((l) => ({ id: l.id, name: l.name, ring: flat(l.ring) })),
  roads: roads.map((r) => ({ ...r, pts: flat(r.pts) })),
  paths: paths.map((r) => ({ ...r, pts: flat(r.pts) })),
  skywalks: skywalks.map((r) => ({ ...r, pts: flat(r.pts) })),
  rails: rails.map((r) => ({ ...r, pts: flat(r.pts) })),
  tunnelPortal: { x: r1(tunnelPortal[0]), z: r1(tunnelPortal[1]), dx: +tunnelDir[0].toFixed(4), dz: +tunnelDir[1].toFixed(4) },
  railBridge: { a: railBridge.a.map(r1), b: railBridge.b.map(r1), lines: railBridge.lines, spans: railBridge.spans },
  decks,
  parkFootbridge,
  trees: trees.flatMap((t) => [r1(t[0]), r1(t[1]), t[2], Math.round(t[3] * 100) / 100]),
  siteTrees: flat(siteTrees),
  labels,
};
const header = `// GENERATED by tools/bake-ground.mjs from research/geo/site-context.geojson — do not edit by hand.
// Ground of the site diorama in the WORLD frame (metres; flat arrays are x0, z0, x1, z1, …).
// Sources: © OpenStreetMap contributors (ODbL 1.0); bridge outlines and levels from MLIT
// Project PLATEAU Yokohama 2024 (CC BY 4.0). Re-run the bake script after changing the GeoJSON.
`;
const outFile = resolve(root, 'src/site/data/ground-data.js');
mkdirSync(dirname(outFile), { recursive: true });
const body = `${header}export const GROUND = ${JSON.stringify(data)};\nexport default GROUND;\n`;
writeFileSync(outFile, body);
console.log(JSON.stringify({ out: outFile, bytes: body.length, roads: roads.length, paths: paths.length, skywalks: skywalks.length, rails: rails.length, land: land.length, plazas: plazas.length, trees: trees.length, siteTrees: siteTrees.length, labels: labels.length, waterVerts: water.main.length, basinVerts: water.basin.length }, null, 1));
console.log(stats);

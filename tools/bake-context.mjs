#!/usr/bin/env node
// Bake the surrounding city buildings of the K-Arena diorama into plain data.
//
//   node tools/bake-context.mjs            writes src/site/data/context-data.js
//   node tools/bake-context.mjs --report   also prints one line per building
//
// No npm dependencies. Inputs (all inside the project):
//   research/geo/site-context.geojson      OSM buildings / parts + PLATEAU LOD0 footprints
//   research/geo/overpass-around600.json   raw OSM tags (name:en, min_height, materials)
//   research/geo/plateau/plateau_bldg_footprints_53391550_near.json   PLATEAU holes
//
// What it does
//   1. lon/lat -> WORLD metres (src/core/frame.js lonLatToWorld; +X house right, +Z rear).
//   2. Drops what other modules own: the arena, Hilton Yokohama, K Tower Yokohama, the
//      annex, the podium / deck, the tents (GeoJSON kinds arena*, hotel, office_tower,
//      annex*, deck, tent) and anything standing on those footprints.
//   3. Resolves duplicates. PLATEAU 2024 (aerial survey) wins for heights and, where it is
//      the only thing OSM also has, for the footprint; OSM wins for names and for stepped
//      massing (building:part with its own height). PLATEAU measuredHeight is the highest
//      surveyed point, i.e. the top of the roof plant; the OSM height tag of the same
//      building is its architectural height. The baked volume therefore has
//      y1 = roof level (OSM where it agrees) and top = PLATEAU measuredHeight (crown / plant).
//   4. Diorama rule: a building whose footprint centre lies outside the disc (DIORAMA in
//      src/core/envelope.js) is dropped. A kept building that sticks out is cut flush with
//      the disc (cut edges are flagged, the model shows them as a plain section face).
//      Buildings with the centre just outside but a real part of the footprint inside are
//      baked as well, flagged edge: 1; the model builds them only on request.
//   5. Classifies every building into a facade family and writes labels.
//
// Licences: OpenStreetMap contributors (ODbL); MLIT PLATEAU Yokohama 2024 (CC BY 4.0).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const imp = (p) => import(pathToFileURL(resolve(root, p)).href);
const { lonLatToWorld } = await imp('src/core/frame.js');
const { DIORAMA } = await imp('src/core/envelope.js');
const REPORT = process.argv.includes('--report');

const CLIP_R = DIORAMA.radius - 0.4; // cut faces sit just inside the ground disc edge
const EDGE_MIN_INSIDE = 0.25; // an "edge" building needs this share of its footprint inside

// ---------------------------------------------------------------- polygon helpers
const r2 = (v) => Math.round(v * 100) / 100;
function area(ring) {
  let s = 0;
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i];
    const q = ring[(i + 1) % ring.length];
    s += p[0] * q[1] - q[0] * p[1];
  }
  return s / 2;
}
function centroid(ring) {
  let a = 0;
  let cx = 0;
  let cz = 0;
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i];
    const q = ring[(i + 1) % ring.length];
    const c = p[0] * q[1] - q[0] * p[1];
    a += c;
    cx += (p[0] + q[0]) * c;
    cz += (p[1] + q[1]) * c;
  }
  if (Math.abs(a) < 1e-9) return ring[0].slice();
  return [cx / (3 * a), cz / (3 * a)];
}
function bbox(ring) {
  let x0 = Infinity;
  let z0 = Infinity;
  let x1 = -Infinity;
  let z1 = -Infinity;
  for (const [x, z] of ring) {
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (z < z0) z0 = z;
    if (z > z1) z1 = z;
  }
  return [x0, z0, x1, z1];
}
function inside(ring, x, z) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i];
    const [xj, zj] = ring[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}
/** Share of polygon a (0..1) that lies inside polygon b, by grid sampling. */
function shareInside(a, b) {
  const [x0, z0, x1, z1] = bbox(a.ring);
  const [bx0, bz0, bx1, bz1] = b.bb;
  if (x1 < bx0 || bx1 < x0 || z1 < bz0 || bz1 < z0) return 0;
  const n = 36;
  let inA = 0;
  let inB = 0;
  for (let i = 0; i < n; i++) {
    const x = x0 + ((i + 0.5) / n) * (x1 - x0);
    for (let j = 0; j < n; j++) {
      const z = z0 + ((j + 0.5) / n) * (z1 - z0);
      if (!inside(a.ring, x, z)) continue;
      inA++;
      if (inside(b.ring, x, z)) inB++;
    }
  }
  return inA ? inB / inA : 0;
}
/** Closed-ring Douglas-Peucker; keeps corners, drops survey noise below `tol` metres. */
function simplify(ring, tol) {
  if (ring.length <= 4) return ring;
  // start at the two mutually farthest vertices so the split is stable
  let ia = 0;
  let ib = 0;
  let best = -1;
  for (let i = 0; i < ring.length; i++) {
    const d = Math.hypot(ring[i][0] - ring[0][0], ring[i][1] - ring[0][1]);
    if (d > best) {
      best = d;
      ib = i;
    }
  }
  best = -1;
  for (let i = 0; i < ring.length; i++) {
    const d = Math.hypot(ring[i][0] - ring[ib][0], ring[i][1] - ring[ib][1]);
    if (d > best) {
      best = d;
      ia = i;
    }
  }
  const n = ring.length;
  const chain = (from, to) => {
    const pts = [];
    for (let i = from; ; i = (i + 1) % n) {
      pts.push(ring[i]);
      if (i === to) break;
    }
    return pts;
  };
  const dp = (pts) => {
    if (pts.length <= 2) return pts;
    const [ax, az] = pts[0];
    const [bx, bz] = pts[pts.length - 1];
    const len = Math.hypot(bx - ax, bz - az) || 1e-9;
    let k = -1;
    let dm = tol;
    for (let i = 1; i < pts.length - 1; i++) {
      const d = Math.abs((pts[i][0] - ax) * (bz - az) - (pts[i][1] - az) * (bx - ax)) / len;
      if (d > dm) {
        dm = d;
        k = i;
      }
    }
    if (k < 0) return [pts[0], pts[pts.length - 1]];
    const l = dp(pts.slice(0, k + 1));
    const r = dp(pts.slice(k));
    return l.slice(0, -1).concat(r);
  };
  const a = dp(chain(ia, ib));
  const b = dp(chain(ib, ia));
  const out = a.slice(0, -1).concat(b.slice(0, -1));
  return out.length >= 3 ? out : ring;
}
function cleanRing(coords) {
  let ring = coords.map(([lon, lat]) => lonLatToWorld(lon, lat));
  if (ring.length > 1) {
    const f = ring[0];
    const l = ring[ring.length - 1];
    if (Math.hypot(f[0] - l[0], f[1] - l[1]) < 0.01) ring.pop();
  }
  ring = ring.filter((p, i) => {
    const q = ring[(i + ring.length - 1) % ring.length];
    return Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.05;
  });
  if (area(ring) < 0) ring.reverse(); // positive (x, z) signed area, as geom.js prism() normalises
  return ring;
}
/** Sutherland-Hodgman clip of a ring against the diorama disc (as a 240-gon). */
function clipToDisc(ring, R) {
  const N = 240;
  let out = ring.map((p) => [p[0] - DIORAMA.cx, p[1] - DIORAMA.cz]);
  if (out.every((p) => Math.hypot(p[0], p[1]) <= R * Math.cos(Math.PI / N))) return { ring, cut: [] };
  for (let k = 0; k < N && out.length; k++) {
    const a = ((k + 0.5) / N) * Math.PI * 2;
    const nx = Math.cos(a);
    const nz = Math.sin(a);
    const d = R * Math.cos(Math.PI / N);
    const res = [];
    for (let i = 0; i < out.length; i++) {
      const p = out[i];
      const q = out[(i + 1) % out.length];
      const dp = p[0] * nx + p[1] * nz - d;
      const dq = q[0] * nx + q[1] * nz - d;
      if (dp <= 0) res.push(p);
      if (dp <= 0 !== dq <= 0) {
        const t = dp / (dp - dq);
        res.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
      }
    }
    out = res;
  }
  out = out.filter((p, i) => {
    const q = out[(i + out.length - 1) % out.length];
    return Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.02;
  });
  if (out.length < 3) return { ring: [], cut: [] };
  const lim = R * Math.cos(Math.PI / N) - 0.05;
  const cut = [];
  for (let i = 0; i < out.length; i++) {
    const p = out[i];
    const q = out[(i + 1) % out.length];
    if (Math.hypot(p[0], p[1]) >= lim && Math.hypot(q[0], q[1]) >= lim) cut.push(i);
  }
  return { ring: out.map((p) => [p[0] + DIORAMA.cx, p[1] + DIORAMA.cz]), cut };
}
const distC = (c) => Math.hypot(c[0] - DIORAMA.cx, c[1] - DIORAMA.cz);

// ---------------------------------------------------------------- load
const gj = JSON.parse(readFileSync(resolve(root, 'research/geo/site-context.geojson'), 'utf8'));
const overpass = JSON.parse(readFileSync(resolve(root, 'research/geo/overpass-around600.json'), 'utf8'));
const osmTags = new Map();
for (const e of overpass.elements) if (e.tags) osmTags.set(`${e.type}/${e.id}`, e.tags);
const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

function poly(f) {
  const ring = cleanRing(f.geometry.coordinates[0]);
  return { ring, bb: bbox(ring), area: Math.abs(area(ring)), c: centroid(ring) };
}

const EXCLUDE_KIND = /^(arena|hotel$|office_tower$|annex|deck$|tent$)/;
const exclusion = [];
const osmOutlines = [];
const osmParts = [];
const plateau = [];
for (const f of gj.features) {
  const p = f.properties;
  if (!f.geometry || f.geometry.type !== 'Polygon') continue;
  if (EXCLUDE_KIND.test(p.kind)) {
    exclusion.push({ ...poly(f), kind: p.kind });
    continue;
  }
  if (p.kind === 'building' || p.kind === 'building_part' || p.kind === 'toilets') {
    const t = osmTags.get(p.osm_id) || {};
    const o = {
      ...poly(f),
      id: p.osm_id,
      src: 'osm',
      name: p.name || t.name || null,
      nameEn: t['name:en'] || null,
      nameJa: t['name:ja'] || null,
      h: num(p.height ?? t.height),
      minH: num(t.min_height) || 0,
      levels: num(p.levels ?? t['building:levels']),
      tag: p.kind === 'toilets' ? 'toilets' : p.building || t.building || t['building:part'] || 'yes',
      material: t['building:material'] || null,
      colour: p.colour || t['building:colour'] || null,
      roofColour: p.roof_colour || t['roof:colour'] || null,
      roofShape: t['roof:shape'] || null,
    };
    if (o.area < 1) continue;
    (p.kind === 'building_part' ? osmParts : osmOutlines).push(o);
  } else if (p.kind === 'building_plateau') {
    const o = { ...poly(f), id: `plateau/${p.plateau_building_id.replace('14100-bldg-', '')}${p.part_id ? ':' + p.gml_id.slice(5, 9) : ''}`, src: 'plateau', name: p.name || null, h: num(p.height), gid: p.gml_id };
    if (o.area >= 1) plateau.push(o);
  }
}

// ---------------------------------------------------------------- 2. exclusions
const excluded = (o) => exclusion.some((e) => inside(e.ring, o.c[0], o.c[1]) || shareInside(o, e) > 0.25);
const keep = (list) => list.filter((o) => !excluded(o));
let O = keep(osmOutlines);
let OP = keep(osmParts);
let P = keep(plateau);

// OSM outlines mapped twice (old + new mapping of the same building): keep the richer one.
{
  const score = (o) => (o.h ? 2 : 0) + (o.levels ? 1 : 0) + (o.name ? 1 : 0) + (/yes/.test(o.tag) ? 0 : 1);
  const dead = new Set();
  for (let i = 0; i < O.length; i++) {
    for (let j = i + 1; j < O.length; j++) {
      const a = O[i];
      const b = O[j];
      if (dead.has(a) || dead.has(b)) continue;
      const small = a.area < b.area ? a : b;
      const big = small === a ? b : a;
      if (shareInside(small, big) > 0.8 && small.area / big.area > 0.7) {
        const loser = score(a) >= score(b) ? b : a;
        const winner = loser === a ? b : a;
        if (!winner.name && loser.name) winner.name = loser.name;
        dead.add(loser);
      }
    }
  }
  O = O.filter((o) => !dead.has(o));
}

// ---------------------------------------------------------------- 3. complexes (union-find)
const all = [...O, ...OP, ...P];
all.forEach((o, i) => {
  o.i = i;
});
const parent = all.map((_, i) => i);
const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
const union = (a, b) => {
  parent[find(a.i)] = find(b.i);
};
// parts belong to the outline that contains them
for (const part of OP) {
  let best = null;
  let bs = 0.6;
  for (const o of O) {
    const s = shareInside(part, o);
    if (s > bs) {
      bs = s;
      best = o;
    }
  }
  if (best) {
    part.owner = best;
    (best.parts ||= []).push(part);
    union(part, best);
  }
}
// PLATEAU footprint <-> OSM outline of the same building. A footprint joins ONE outline
// (the one it shares most ground with), so a survey polygon that spans two neighbours
// (Pacifico North + the Kahala podium) cannot weld them into one complex.
for (const p of P) {
  let best = null;
  let bestShared = 0;
  for (const o of [...O, ...OP.filter((x) => !x.owner)]) {
    const small = p.area < o.area ? p : o;
    const big = small === p ? o : p;
    const s = shareInside(small, big);
    if (s > 0.55 && s * small.area > bestShared) {
      bestShared = s * small.area;
      best = o;
    }
  }
  if (best) union(p, best);
}
const groups = new Map();
for (const o of all) {
  const g = find(o.i);
  if (!groups.has(g)) groups.set(g, []);
  groups.get(g).push(o);
}

// ---------------------------------------------------------------- curated knowledge
// Keys: OSM id of the outline, or plateau/<number>. Heights marked est are estimates
// (no height in either dataset); sources are noted per entry.
const CURATED = {
  'way/723905273': { landmark: 'anpanman', type: 'commercial', ko: '요코하마 호빵맨 어린이 뮤지엄 & 몰', en: "Yokohama Anpanman Children's Museum & Mall" },
  'way/902226624': { landmark: 'fujifilm', type: 'office', ko: '후지필름 비즈니스 이노베이션', short: '富士フイルムビジネスイノベーション', en: 'FUJIFILM Business Innovation Yokohama Minatomirai' },
  'way/771682339': { landmark: 'grangate', type: 'office', ko: '요코하마 그랑게이트', en: 'Yokohama Grangate' },
  'way/459343648': { landmark: 'okbuilding', type: 'commercial', ko: 'OK 미나토미라이 빌딩', en: 'OK Minatomirai Building' },
  'way/396967547': { landmark: 'keihinport', type: 'civic', name: '関東地方整備局 京浜港湾事務所', ko: '간토지방정비국 게이힌 항만사무소', en: 'Keihin Port Office (MLIT Kanto Regional Development Bureau)' },
  'way/459275387': { type: 'utility', name: '高島水際線公園 トイレ', ko: '다카시마 수제선 공원 화장실', en: 'Takashima Suisaisen Park toilets', label: false },
  'way/913804932': { landmark: 'blueharbor', type: 'residential', name: 'ブルーハーバータワーみなとみらい', ko: '블루 하버 타워 미나토미라이', en: 'Blue Harbor Tower Minatomirai' },
  'way/886611260': { landmark: 'blueharbor', type: 'residential', name: 'ブルーハーバータワーみなとみらい', ko: '블루 하버 타워 미나토미라이', en: 'Blue Harbor Tower Minatomirai' },
  'way/913875858': { landmark: 'hgi', type: 'hotel', name: 'ヒルトン・ガーデン・イン横浜みなとみらい', ko: '힐튼 가든 인 요코하마 미나토미라이', en: 'Hilton Garden Inn Yokohama Minatomirai' },
  'way/886611262': { type: 'parking', name: 'プライムコーストみなとみらい 駐車場', ko: '프라임 코스트 미나토미라이 주차장', en: 'Pryme Coast Minatomirai car park', label: false },
  'way/72849297': { landmark: 'prc', type: 'residential', ko: '퍼시픽 로열 코트 미나토미라이 오션 타워', en: 'Pacific Royal Court Minatomirai Ocean Tower' },
  'way/72849299': { landmark: 'prc', type: 'residential', ko: '퍼시픽 로열 코트 미나토미라이 어번 타워', en: 'Pacific Royal Court Minatomirai Urban Tower' },
  'way/72849298': { landmark: 'brillia', type: 'residential', name: 'ブリリアグランデみなとみらい オーシャンフロントタワー', ko: '브릴리아 그란데 미나토미라이 오션 프런트 타워', en: 'Brillia Grande Minatomirai Ocean Front Tower' },
  'way/72849300': { landmark: 'brillia', type: 'residential', name: 'ブリリアグランデみなとみらい パークフロントタワー', ko: '브릴리아 그란데 미나토미라이 파크 프런트 타워', en: 'Brillia Grande Minatomirai Park Front Tower' },
  'way/930678644': { landmark: 'mmtowers', type: 'residential', name: 'M.M.タワーズ ザ・ウエスト', ko: 'M.M. 타워즈 더 웨스트', en: 'M.M. Towers the West' },
  'way/72879090': { landmark: 'mmtowers', type: 'residential', name: 'M.M.タワーズ ザ・イースト', ko: 'M.M. 타워즈 더 이스트', en: 'M.M. Towers the East' },
  'way/72879759': { landmark: 'mmtowers', type: 'residential', name: 'M.M.タワーズ フォレシス L棟', ko: 'M.M. 타워즈 포레시스 L동', en: 'M.M. Towers Foresis L' },
  'way/827806392': { landmark: 'kahala', type: 'hotel', ko: '더 카할라 호텔 & 리조트 요코하마', en: 'The Kahala Hotel & Resort Yokohama' },
  'way/909648671': { landmark: 'pacificonorth', type: 'civic', ko: '퍼시피코 요코하마 노스', en: 'Pacifico Yokohama North' },
  'way/961365921': { landmark: 'symphostage', type: 'office', ko: '요코하마 심포스테이지 이스트 타워', en: 'Yokohama Symphostage East Tower' },
  'way/72657188': { landmark: 'nissan', type: 'office', ko: '닛산자동차 글로벌 본사', en: 'Nissan Global Headquarters' },
  'way/909264189': { landmark: 'bayquarter', type: 'commercial', ko: '요코하마 베이 쿼터', en: 'Yokohama Bay Quarter', hEst: 30 },
  'way/160063503': { type: 'residential', ko: '미쓰비시중공업 포트사이드 빌딩 사택', en: 'MHI Portside Building company housing' },
  'way/160012372': { landmark: 'nabure', type: 'residential', ko: '나뷰레 요코하마 타워 레지던스', en: 'Nabure Yokohama Tower Residence', levels: 41 },
  // Portside buildings without any height in the data: estimates from the building type
  // and the satellite / skyline photos (flagged hEst in the output).
  'way/160063523': { type: 'residential', ko: '요코하마 포트사이드 로아 1번관', en: 'Yokohama Portside Roa Ichibankan', hEst: 44, levels: 14 },
  'way/160063514': { type: 'residential', ko: '요코하마 포트사이드 로아 2번관', en: 'Yokohama Portside Roa Nibankan', hEst: 44, levels: 14 },
  'way/160012377': { type: 'civic', ko: '포트사이드 파출소', en: 'Portside police box', hEst: 7, levels: 2, label: false },
  'way/160012358': { type: 'commercial', hEst: 11, levels: 3, roof: 'terracotta' }, // low terracotta-roofed complex with a pool (satellite)
  'way/160012355': { type: 'commercial', hEst: 16, levels: 4 }, // glazed-roof low building (satellite)
  'way/294605936': { type: 'residential' },
  'way/160063513': { type: 'residential' },
  'way/419655279': { type: 'office', ko: 'J프로 포트사이드 빌딩', en: 'J-Pro Portside Building', hEst: 40, levels: 10 },
  'way/165934688': { landmark: 'market', type: 'industrial', name: '横浜市中央卸売市場 本場 水産棟', ko: '요코하마시 중앙도매시장 본장 수산동', en: 'Yokohama Central Wholesale Market, fish hall', hEst: 14, levels: 2, roof: 'parkingDeck' },
  'way/78599642': { type: 'industrial', name: null }, // white cold-store block on the market quay, PLATEAU 33.1 m
  'way/78599641': { type: 'industrial', name: null, roof: 'metal' }, // cold store with a blue-grey roof, PLATEAU 35.6 m
  'way/72660754': { type: 'office', ko: 'MUFG 글로벌 러닝 센터', en: 'MUFG Global Learning Center' },
};
// Dropped on evidence: plateau/9900057 is a 940 m2, 10 m block south of K Tower in the 2024
// survey (the white prefab site offices of the 2023 photos); the 2025 satellite image shows
// an excavation there.
const DROP = new Set(['plateau/9900057']);
Object.assign(CURATED, {
  'way/913804931': { type: 'commercial' }, // Pryme Coast retail podium pieces
  'way/913875857': { type: 'commercial' },
  'way/913804930': { type: 'commercial' },
  'way/396967550': { type: 'civic' },
  'way/396967552': { type: 'civic' },
  'way/396967554': { type: 'civic' },
});

// ---------------------------------------------------------------- 4. volumes per complex
function typeOf(tag, h, a, c, name) {
  if (tag === 'apartments' || tag === 'residential' || tag === 'dormitory') return 'residential';
  if (tag === 'house') return 'house';
  if (tag === 'hotel') return 'hotel';
  if (tag === 'office') return 'office';
  if (tag === 'retail' || tag === 'commercial') return 'commercial';
  if (tag === 'parking') return 'parking';
  if (tag === 'roof') return 'canopy';
  if (tag === 'toilets') return 'utility';
  if (name && /タワー|レジデンス|コート|館$/.test(name) && h > 30) return 'residential';
  // The wholesale-market quay across the water (house-left of the stage end) is all sheds and cold stores.
  if (c[0] < -250 && c[1] < 90) return a < 60 && h < 6 ? 'utility' : 'industrial';
  if (a < 70 && h <= 6.5) return 'utility';
  if (a < 150 && h < 6) return 'utility';
  if (a < 14) return 'utility';
  if (h > 45) return 'office';
  if (h <= 7 && a > 500) return 'industrial';
  if (h <= 16) return 'commercial';
  return 'office';
}
const FLOOR = { residential: 3.1, hotel: 3.3, office: 4.2, commercial: 4.5, parking: 3.1, industrial: 6, civic: 3.9, utility: 3, house: 2.9, canopy: 3.2 };

const buildings = [];
for (const members of groups.values()) {
  if (members.some((m) => DROP.has(m.id))) continue;
  const outs = members.filter((m) => m.src === 'osm' && !m.owner && O.includes(m));
  const parts = members.filter((m) => m.src === 'osm' && OP.includes(m));
  const pls = members.filter((m) => m.src === 'plateau');
  const main = outs.slice().sort((a, b) => b.area - a.area)[0] || pls.slice().sort((a, b) => b.area - a.area)[0] || parts.slice().sort((a, b) => b.area - a.area)[0];
  let cur = {};
  for (const m of [...parts, ...pls, ...[...outs].sort((a, b) => a.area - b.area)]) if (CURATED[m.id]) cur = { ...cur, ...CURATED[m.id] };
  const named = outs.filter((o) => o.name).sort((a, b) => b.area - a.area)[0];
  const name = cur.name !== undefined ? cur.name : named ? named.name : pls.find((p) => p.name)?.name || null;
  const plTop = pls.length ? Math.max(...pls.map((p) => p.h || 0)) : 0;

  // OSM volumes: parts, and outlines that have no parts of their own
  const cover = (o) => (o.parts ? o.parts.reduce((s, p) => s + p.area, 0) / o.area : 0);
  const osmVols = [...parts, ...outs.filter((o) => cover(o) < 0.6)];
  const known = osmVols.filter((v) => v.h || v.levels);
  const hOf = (v, t) => v.h || (v.levels ? Math.max(3, v.levels * (FLOOR[t] || 3.5) + 1) : null);
  const mainTag = (named || outs[0] || parts[0] || {}).tag || 'yes';
  const hGuess = plTop || Math.max(0, ...known.map((v) => hOf(v, 'office') || 0)) || cur.hEst || 0;
  const type = cur.type || typeOf(mainTag, hGuess, main.area, main.c, name);

  const knownH = known.map((v) => hOf(v, type));
  const spread = knownH.length >= 2 && Math.max(...knownH) - Math.min(...knownH) > 3;
  const plArea = pls.reduce((s, p) => s + p.area, 0);
  const osmArea = osmVols.reduce((s, v) => s + v.area, 0);
  const knownArea = known.reduce((s, v) => s + v.area, 0);
  // OSM geometry wins when it shows stepped massing, or when the survey polygon is far larger
  // than the building it was matched to (it then also covers a podium / a neighbour that OSM
  // maps separately, e.g. Blue Harbor Tower inside the Pryme Coast block footprint).
  const useOsm = !pls.length || (spread && osmArea > 0.5 * plArea) || (knownArea > 0 && plArea > 1.4 * knownArea);

  const vols = [];
  let hEst = false;
  if (useOsm) {
    let maxRoof = 0;
    for (const v of osmVols) {
      let h = hOf(v, type);
      if (!h) {
        if (plTop) h = plTop;
        else if (cur.hEst) {
          h = cur.hEst;
          hEst = true;
        } else {
          // no height anywhere: one generic storey height by type and size
          h = type === 'industrial' ? 8 : type === 'utility' || type === 'canopy' ? 3.2 : v.area > 1500 ? 24 : v.area > 300 ? 13 : 7;
          hEst = true;
        }
      }
      maxRoof = Math.max(maxRoof, h);
      vols.push({ ring: v.ring, y0: v.minH || 0, y1: h, src: v.id, tag: v.tag, material: v.material, colour: v.colour, roofColour: v.roofColour, roofShape: v.roofShape, levels: v.levels });
    }
    // outline(s) that carry parts: fill what the parts leave open with a low base
    for (const o of outs) {
      const cv = cover(o);
      if (cv >= 0.6 && cv < 0.9) {
        const low = Math.min(...o.parts.map((p) => hOf(p, type) || 99));
        vols.push({ ring: o.ring, y0: 0, y1: Math.max(4, Math.min(low, 12)), src: o.id, tag: o.tag, base: 1 });
      }
    }
    // stacking: a volume that stands on a lower one starts at that roof (no buried, coplanar
    // walls); a volume inside another of the same height is redundant
    for (const v of vols) v.a = { ring: v.ring, bb: bbox(v.ring), area: Math.abs(area(v.ring)) };
    for (const v of vols) {
      for (const w of vols) {
        if (v === w || w.dead || v.dead || v.a.area > w.a.area) continue;
        if (shareInside(v.a, w.a) < 0.7) continue;
        if (Math.abs(v.y1 - w.y1) < 0.5) v.dead = true;
        else if (w.y1 < v.y1) v.y0 = Math.max(v.y0, w.y1);
        else v.dead = true; // lower volume buried inside a taller one
      }
    }
    for (let i = vols.length - 1; i >= 0; i--) if (vols[i].dead) vols.splice(i, 1);
    if (!plTop && maxRoof > 60) {
      // towers known only from an OSM height tag: the tag is the top, the roof sits 5 m lower
      for (const v of vols) if (v.y1 >= maxRoof - 0.5 && v.a.area > 300) { v.top = v.y1; v.y1 -= 5; }
    }
    // PLATEAU measured top = crown of the tallest tier
    if (plTop > maxRoof + 1.5) {
      const tall = vols.filter((v) => v.y1 >= maxRoof - 0.5).sort((a, b) => Math.abs(area(b.ring)) - Math.abs(area(a.ring)))[0];
      const big = vols.filter((v) => v.y1 >= maxRoof * 0.8).sort((a, b) => Math.abs(area(b.ring)) - Math.abs(area(a.ring)))[0];
      (Math.abs(area(tall.ring)) > 150 ? tall : big).top = plTop;
    }
  } else {
    // PLATEAU footprints; roof level from the OSM height of the same building where the two agree
    const oh = Math.max(0, ...known.map((v) => hOf(v, type)));
    for (const p of pls) {
      let roof = p.h;
      let top;
      if (pls.length === 1 && oh && oh < p.h && oh > 0.8 * p.h) {
        roof = oh;
        top = p.h;
      } else if (p.h > 60 && p.h === plTop) {
        roof = p.h - 6.5; // towers: surveyed top is the plant screen (OSM-vs-PLATEAU pairs here differ by 6-8 m)
        top = p.h;
      } else if (p.h > 25 && p.area > 300) {
        roof = p.h - 3.2;
        top = p.h;
      }
      vols.push({ ring: p.ring, y0: 0, y1: roof, top, src: p.id });
    }
  }
  if (!vols.length) continue;
  const levels = cur.levels || (named && named.levels) || known.find((v) => v.levels && v.area > 0.3 * main.area)?.levels || null;
  buildings.push({
    id: (named || outs[0] || pls[0] || parts[0]).id,
    name,
    nameEn: cur.en || (named && named.nameEn) || null,
    nameKo: cur.ko || null,
    short: cur.short || null,
    label: cur.label,
    type,
    landmark: cur.landmark || null,
    roofKind: cur.roof || null,
    levels,
    c: main.c,
    mainArea: main.area,
    hEst,
    src: pls.length && (outs.length || parts.length) ? 'plateau+osm' : pls.length ? 'plateau' : 'osm',
    vols,
    members: members.map((m) => m.id),
  });
}

// ---------------------------------------------------------------- 5. disc rule, clipping, output
const out = [];
for (const b of buildings) {
  const d = distC(b.c);
  const outline = b.vols.slice().sort((x, y) => Math.abs(area(y.ring)) - Math.abs(area(x.ring)))[0].ring;
  let edge = 0;
  if (d > DIORAMA.radius) {
    // centre outside: dropped by the diorama rule; kept only as an optional edge building
    const cl = clipToDisc(outline, CLIP_R);
    const share = cl.ring.length ? Math.abs(area(cl.ring)) / Math.abs(area(outline)) : 0;
    if (share < EDGE_MIN_INSIDE || !(b.landmark || b.mainArea > 3000)) continue;
    edge = 1;
  }
  const vols = [];
  for (const v of b.vols) {
    const tol = Math.abs(area(v.ring)) > 2500 ? 0.45 : 0.3;
    let ring = simplify(v.ring, tol);
    const cl = clipToDisc(ring, CLIP_R);
    if (cl.ring.length < 3 || Math.abs(area(cl.ring)) < 4) continue;
    ring = cl.ring;
    if (area(ring) < 0) ring.reverse();
    const o = { ring: ring.map(([x, z]) => [r2(x), r2(z)]), y0: r2(v.y0), y1: r2(v.y1) };
    if (v.top) o.top = r2(v.top);
    if (cl.cut.length) o.cut = cl.cut;
    if (v.base) o.base = 1;
    for (const k of ['material', 'colour', 'roofColour', 'roofShape', 'levels', 'tag']) if (v[k]) o[k] = v[k];
    o.src = v.src;
    vols.push(o);
  }
  if (!vols.length) continue;
  vols.sort((x, y) => x.y1 - y.y1);
  const top = Math.max(...vols.map((v) => v.top || v.y1));
  const rec = { id: b.id, name: b.name, type: b.type, src: b.src, c: [r2(b.c[0]), r2(b.c[1])], dist: Math.round(d), top: r2(top) };
  if (b.nameEn) rec.nameEn = b.nameEn;
  if (b.nameKo) rec.nameKo = b.nameKo;
  if (b.short) rec.short = b.short;
  if (b.landmark) rec.landmark = b.landmark;
  if (b.roofKind) rec.roofKind = b.roofKind;
  if (b.levels) rec.levels = b.levels;
  if (b.hEst) rec.hEst = 1;
  if (edge) rec.edge = 1;
  if (b.label === false) rec.noLabel = 1;
  rec.vols = vols;
  out.push(rec);
}
// small roofs / kiosks that stand inside another building's volume (an entrance canopy that
// OSM maps as building=roof within the surveyed footprint) would be buried: drop them
for (let i = out.length - 1; i >= 0; i--) {
  const s = out[i];
  if (!(s.type === 'canopy' || s.type === 'utility') || s.vols.length !== 1) continue;
  const sv = { ring: s.vols[0].ring };
  const buried = out.some((o) => o !== s && o.vols.some((v) => v.y1 > s.vols[0].y1 && shareInside(sv, { ring: v.ring, bb: bbox(v.ring) }) > 0.5));
  if (buried) out.splice(i, 1);
}
out.sort((a, b) => a.dist - b.dist);

// Stations: none lies inside the disc, so they become signposts on the rim in their true direction.
const signposts = [];
{
  const st = gj.features.filter((f) => f.properties.kind === 'station' && f.geometry.type === 'Point');
  const pick = (re) => st.find((f) => re.test(f.properties.name || ''));
  const add = (f, ja, ko, en) => {
    if (!f) return;
    const [x, z] = lonLatToWorld(...f.geometry.coordinates);
    const d = Math.hypot(x - DIORAMA.cx, z - DIORAMA.cz);
    const k = d > DIORAMA.radius - 12 ? (DIORAMA.radius - 12) / d : 1;
    signposts.push({ ja, ko, en, x: r2(DIORAMA.cx + (x - DIORAMA.cx) * k), z: r2(DIORAMA.cz + (z - DIORAMA.cz) * k), trueX: r2(x), trueZ: r2(z), beyond: Math.max(0, Math.round(d - DIORAMA.radius)) });
  };
  add(pick(/^新高島駅4/), '新高島駅 4番出口', '신타카시마역 4번 출구', 'Shin-Takashima Sta. Exit 4');
  add(pick(/^横浜駅/), '横浜駅 東口', '요코하마역 동쪽 출구', 'Yokohama Sta. East Exit');
}

const header = `// GENERATED by tools/bake-context.mjs — do not edit by hand.
// Surrounding city buildings of the K-Arena diorama, WORLD metres (see src/core/frame.js).
// Sources: OpenStreetMap contributors (ODbL), MLIT PLATEAU Yokohama 2024 (CC BY 4.0).
//   buildings[]  { id, name, nameEn?, nameKo?, type, landmark?, src, c:[x,z], dist, top, levels?, hEst?, edge?, vols[] }
//     vols[]     { ring:[[x,z]…] (positive x-z signed area), y0, y1 (roof level), top? (crown / plant top),
//                  cut?:[edge indices on the diorama rim], base?, material?, colour?, roofColour?, tag?, src }
//   hEst = height estimated (neither dataset has one); edge = centre outside the disc (optional).
`;
const body = `export const CONTEXT_META = ${JSON.stringify({ generated: new Date().toISOString().slice(0, 10), diorama: DIORAMA, clipRadius: CLIP_R, count: out.length, counts: { inside: out.filter((b) => !b.edge).length, edge: out.filter((b) => b.edge).length } })};\n\nexport const CONTEXT_BUILDINGS = [\n${out.map((b) => '  ' + JSON.stringify(b)).join(',\n')}\n];\n\nexport const CONTEXT_SIGNPOSTS = ${JSON.stringify(signposts, null, 2)};\n`;
const target = resolve(root, 'src/site/data/context-data.js');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, header + body);

if (REPORT) {
  for (const b of out) {
    console.log(
      [b.edge ? 'EDGE' : '    ', String(b.dist).padStart(3), b.type.padEnd(11), (b.landmark || '').padEnd(12), b.src.padEnd(11), `top ${String(b.top).padStart(6)}`, b.hEst ? 'EST' : '   ', `[${b.vols.map((v) => `${Math.round(Math.abs(area(v.ring)))}m2:${v.y0 ? v.y0 + '-' : ''}${v.y1}${v.top ? '^' + v.top : ''}${v.cut ? 'c' : ''}/${v.ring.length}`).join(' ')}]`, b.id, b.name || ''].join(' '),
    );
  }
}
const tot = out.reduce((s, b) => s + b.vols.length, 0);
console.log(`context-data.js: ${out.length} buildings (${out.filter((b) => b.edge).length} edge), ${tot} volumes, ${(header.length + body.length) >> 10} KiB`);

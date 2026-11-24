// Every seat of K-Arena Yokohama.
//
//   19,893 seats of the official seat map (core/seating.js)        Kotobuki "Lux" / "Cadenza TS-71"
//      120 VIP-box seats on the LEVEL 6 box balconies (REPORTED)   TS-71 armchairs + side tables
//       20 wheelchair positions on the LEVEL 3 platform (ESTIMATED) floor bays + companion chairs
//   = 20,033, the official capacity.
//
// Scene graph (all meshes: userData.layer = 'seats', userData.level = building LEVEL):
//   seats
//   ├─ arena        userData.arenaSeats = true   LEVEL 1 movable seats and their leg frames
//   ├─ telescopic   userData.telescopic = true   Lower Stand rows 1-11 (retractable units)
//   ├─ stands       one child group per tier part (PARTS key, e.g. "L7/C")
//   ├─ balcony      Middle Stand centre rows 1-3 (red Cadenza)
//   ├─ vip          LEVEL 6 box balconies
//   ├─ wheelchair   userData.wheelchair = true    bay markings on the LEVEL 3 platform
//   └─ highlight    marker of highlightSeat()
//
// Seats are InstancedMeshes, one per tier part x seat kind x material. All meshes of one
// batch share a single instance-matrix buffer. Pickable meshes carry userData.seatLookup;
// use seatFromInstance(mesh, instanceId). Every mesh also carries userData.kind / part /
// role ('fabric', 'shell', 'fittings', 'bracket', 'beam', 'leg', 'cuparm', …); small parts
// that only matter close up have userData.detail = true.
//
// Exports: build(ctx), update(group, state, dt), seatFromInstance(mesh, instanceId),
//          highlightSeat(group, seat | null), setSeatModel(kind, geometry, material), SEAT_KINDS.
// ctx.quality 'high' = full chairs with fittings, legs and leg frames (about 1.41 M triangles),
//             'low'  = simplified chairs, brackets and beams only (about 0.52 M).
// ctx.flags   vipTables = '0'      VIP chairs packed at the bare 0.553 m module (no side tables)
//             seathl = '7-20-142'  put the highlight marker on that seat (level-row-number)
//
// Materials with a built-in procedural texture (leave them out of the texture manifest, or
// supply a matching texture): 'seat.fittings' (alpha atlas: cup-holder ring + number tag),
// 'seat.shellBlack' (normal map of the moulded shell), 'seat.wheelchairSymbol' (pictogram).
import * as THREE from 'three';
import { SPEC as SPEC_DEFAULT } from '../core/spec.js';
import { PARTS, FACETS, uvToWorld, findSeat, SEAT_OUTLINES, FAN_APEX_Z, ROW_TREAD, MAPPED_SEAT_COUNT } from '../core/seating.js';
import { LEVEL_Y } from '../core/envelope.js';
import { box, merge, mesh, countTriangles } from '../core/geom.js';
import { mat, emissiveMat, getMaterial } from '../core/materials.js';
import * as M from './seats/models.js';
import { MeshBuilder } from './seats/meshbuilder.js';
import { makeFittingsAtlas, makeWheelchairSymbol, makeShellNormalMap } from './seats/textures.js';

const LAYER = 'seats';
export const SEAT_KINDS = Object.freeze(['arena', 'telescopic', 'stand', 'balcony', 'vip', 'companion']);
const KIND_CODE = Object.fromEntries(SEAT_KINDS.map((k, i) => [k, i]));
/** Seat kinds that use the Lux chair (setSeatModel('lux', …) addresses all of them). */
const LUX_KINDS = ['arena', 'telescopic', 'stand'];

// Arena floor: rows 1-17 are caster-type seats, rows 18-34 "Matrix System" seats
// (research/seatmap.md 4.1: the two zones have different row pitches). ESTIMATED split.
const ARENA_CASTER_LAST_ROW = 17;
// Wheelchair bays (ESTIMATED): 20 bays in one row along the front of the platform.
const WC_BAY = { width: 0.85, depth: 1.25, frontMargin: 0.25, line: 0.05 };
// VIP side tables between the chairs (Kotobuki case-study photo 8).
const VIP_TABLE_W = 0.28;

const overrides = new Map(); // kind → { geometry, material }
const builtRoots = new Set(); // WeakRef<Group> of every group build() has returned

// --------------------------------------------------------------------------------------
// materials
// --------------------------------------------------------------------------------------
function materials() {
  // materials that carry a built-in procedural texture: make the texture only once
  const withTexture = (id, params) => getMaterial(id) || mat(id, params());
  return {
    fabricBlue: mat('seat.fabricBlue', { color: '#2F4A78', roughness: 0.95, metalness: 0, tile: 0.25 }),
    shell: withTexture('seat.shellBlack', () => ({ color: '#1E1F21', roughness: 0.5, metalness: 0, normalMap: makeShellNormalMap(), tile: 0.5 })),
    cup: mat('seat.cupHolderBlack', { color: '#1E1F21', roughness: 0.5, metalness: 0, tile: 0.5 }),
    bracket: mat('seat.bracketGrey', { color: '#B8BCC0', roughness: 0.4, metalness: 0.35, tile: 0.25 }),
    steel: mat('seat.frameSteel', { color: '#141517', roughness: 0.5, metalness: 0.4, tile: 0.5 }),
    fittings: withTexture('seat.fittings', () => ({
      color: '#ffffff',
      map: makeFittingsAtlas(),
      alphaTest: 0.38,
      side: THREE.DoubleSide,
      roughness: 0.55,
      metalness: 0,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -2,
      tile: 0.106,
    })),
    rail: mat('seat.matrixRail', { color: '#A9ACAF', roughness: 0.45, metalness: 0.3, tile: 0.5 }),
    fabricRed: mat('seat.fabricRed', { color: '#D8391F', roughness: 0.95, metalness: 0, tile: 0.25 }),
    woodWalnut: mat('seat.woodWalnut', { color: '#4A2A1C', roughness: 0.4, metalness: 0, tile: 0.6 }),
    fabricVip: mat('seat.fabricVip', { color: '#2B3F6B', roughness: 0.95, metalness: 0, tile: 0.2 }),
    woodVip: mat('seat.woodVip', { color: '#6E3A26', roughness: 0.4, metalness: 0, tile: 0.6 }),
    wcLine: mat('seat.wheelchairLine', {
      color: '#ECECE6',
      roughness: 0.6,
      metalness: 0,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -4,
      tile: 1,
    }),
    wcSymbol: withTexture('seat.wheelchairSymbol', () => ({
      color: '#ffffff',
      map: makeWheelchairSymbol(),
      roughness: 0.6,
      metalness: 0,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -6,
      tile: 0.5,
    })),
    highlight: emissiveMat('seat.highlight', { color: '#FFD23F', transparent: true, opacity: 0.38, depthWrite: false }),
    // the pin is drawn over everything (no depth test) so the seat can be found from anywhere
    highlightPin: emissiveMat('seat.highlightPin', { color: '#FFB300', transparent: true, opacity: 0.95, depthTest: false, depthWrite: false }),
  };
}

// --------------------------------------------------------------------------------------
// helpers
// --------------------------------------------------------------------------------------
/** Append the column-major matrix "rotate about +Y by rotY, then translate" (optional x scale). */
function pushM(arr, x, y, z, rotY, sx = 1) {
  const c = Math.cos(rotY);
  const s = Math.sin(rotY);
  arr.push(c * sx, 0, -s * sx, 0, 0, 1, 0, 0, s, 0, c, 0, x, y, z, 1);
}

// Meshes with these roles are small parts that only matter close up; they are tagged
// userData.detail = true so the app may hide them when the camera is far away.
const DETAIL_ROLES = new Set(['fittings', 'leg', 'cuparm', 'casterfoot', 'matrixpost', 'cupholder']);

function tag(o, { name, level, kind, part, role }) {
  o.name = name;
  o.userData.layer = LAYER;
  if (level !== undefined) o.userData.level = level;
  if (kind) o.userData.kind = kind;
  if (part) o.userData.part = part;
  if (role) o.userData.role = role;
  if (DETAIL_ROLES.has(role)) o.userData.detail = true;
  return o;
}

/**
 * InstancedMesh from a list of matrices (number[] / Float32Array) or from an existing
 * InstancedBufferAttribute (shared between the meshes of one batch).
 */
function instanced(geometry, material, matrices, tags) {
  const attr = matrices.isBufferAttribute ? matrices : new THREE.InstancedBufferAttribute(new Float32Array(matrices), 16);
  const m = new THREE.InstancedMesh(geometry, material, 0);
  m.instanceMatrix = attr;
  m.count = attr.count;
  m.castShadow = false;
  m.receiveShadow = true;
  tag(m, tags);
  m.computeBoundingBox();
  m.computeBoundingSphere();
  return m;
}

function newBatch(key, part, kind, tier, facet) {
  return {
    key,
    part,
    kind,
    tier,
    facet,
    seatM: [],
    row: [],
    num: [],
    kindCode: [],
    pos: [],
    extra: [], // box number for VIP seats
    bracketM: [],
    legM: [],
    beams: [],
    casterM: [],
    postM: [],
    railM: [],
    armM: [],
    standardM: [],
    endPanelM: [],
    tableM: [],
  };
}

function addSeat(b, x, y, z, rotY, row, num, kind, extra = 0, sx = 1) {
  pushM(b.seatM, x, y, z, rotY, sx);
  b.row.push(row);
  b.num.push(num);
  b.kindCode.push(KIND_CODE[kind]);
  b.pos.push(x, y, z, rotY);
  b.extra.push(extra);
}

function makeLookup(b) {
  return {
    count: b.row.length,
    part: b.part,
    tier: b.tier,
    row: Uint16Array.from(b.row),
    num: Uint16Array.from(b.num),
    kind: Uint8Array.from(b.kindCode),
    pos: Float32Array.from(b.pos),
    box: b.kind === 'vip' ? Uint8Array.from(b.extra) : null,
  };
}

/** Evenly spaced boundary indices 0..n with at most `every` seats between supports. */
function supportIndices(n, every) {
  const m = Math.max(1, Math.ceil(n / every));
  const out = [];
  for (let j = 0; j <= m; j++) {
    const k = Math.round((j * n) / m);
    if (out[out.length - 1] !== k) out.push(k);
  }
  return out;
}

// --------------------------------------------------------------------------------------
// layout: the mapped seats and the row furniture of every run
// --------------------------------------------------------------------------------------
function layoutLuxRun(b, part, r, seg, prevNear, quality) {
  const f = FACETS[part.facet];
  const at = (u, v) => uvToWorld(part.facet, u, v);
  const n = seg.n;
  // pivot brackets on every seat boundary
  for (let k = 0; k <= n; k++) {
    const [x, z] = at(seg.u0 + k * seg.pitch, r.v);
    pushM(b.bracketM, x, r.y, z, f.rotY);
  }
  // beam under the run
  const zc = (M.LUX.beamZ[0] + M.LUX.beamZ[1]) / 2;
  const [bx, bz] = at((seg.u0 + seg.u1) / 2, r.v + zc);
  b.beams.push(
    box(
      bx,
      r.y + (M.LUX.beamY[0] + M.LUX.beamY[1]) / 2,
      bz,
      seg.u1 - seg.u0 + 2 * M.LUX.bracketHalf,
      M.LUX.beamY[1] - M.LUX.beamY[0],
      M.LUX.beamZ[1] - M.LUX.beamZ[0],
      f.rotY,
    ),
  );
  if (quality !== 'high') return;
  if (b.kind === 'arena') {
    const caster = r.row <= ARENA_CASTER_LAST_ROW;
    for (const k of supportIndices(n, caster ? 3 : 2)) {
      const [x, z] = at(seg.u0 + k * seg.pitch, r.v);
      if (caster) pushM(b.casterM, x, r.y, z, f.rotY);
      else {
        pushM(b.postM, x, r.y, z, f.rotY);
        pushM(b.railM, x, r.y, z, f.rotY);
        // the leg frame sticks out in front of the first Matrix row
        if (r.row === ARENA_CASTER_LAST_ROW + 1) {
          const [x2, z2] = at(seg.u0 + k * seg.pitch, r.v - 0.45);
          pushM(b.railM, x2, r.y, z2, f.rotY);
        }
      }
    }
    // aisle-end armrest with cup holder on both ends of every movable row
    for (const [k, off] of [
      [0, -0.03],
      [n, 0.03],
    ]) {
      const [x, z] = at(seg.u0 + k * seg.pitch + off, r.v);
      pushM(b.armM, x, r.y, z, f.rotY);
    }
  } else {
    for (const k of supportIndices(n, 3)) {
      const [x, z] = at(seg.u0 + k * seg.pitch, r.v);
      pushM(b.legM, x, r.y, z, f.rotY);
    }
    // Seats with no seat in front of them have no back-mounted cup holder to use:
    // they get the arm-mounted ring between the chairs.
    const hasFront = (u) => prevNear && prevNear.segs.some((s) => u > s.u0 - 0.3 && u < s.u1 + 0.3);
    const front = [];
    for (let i = 0; i < n; i++) front.push(!hasFront(seg.u0 + (i + 0.5) * seg.pitch));
    for (let k = 0; k <= n; k++) {
      if ((k > 0 && front[k - 1]) || (k < n && front[k])) {
        const [x, z] = at(seg.u0 + k * seg.pitch, r.v);
        pushM(b.armM, x, r.y, z, f.rotY);
      }
    }
  }
}

function layoutBalconyRun(b, part, r, seg) {
  const f = FACETS[part.facet];
  for (let k = 0; k <= seg.n; k++) {
    const [x, z] = uvToWorld(part.facet, seg.u0 + k * seg.pitch, r.v);
    pushM(b.standardM, x, r.y, z, f.rotY);
  }
  const off = 0.016; // outer face flush with the armrest cap
  for (const u of [seg.u0 - off, seg.u1 + off]) {
    const [x, z] = uvToWorld(part.facet, u, r.v);
    pushM(b.endPanelM, x, r.y, z, f.rotY);
  }
}

/**
 * The 19,893 seats of the official map. Same walk and same arithmetic as forEachSeat() of
 * core/seating.js (so positions are identical), but run by run, because the row furniture
 * (beam, brackets, legs, armrest standards) needs the ends of every seat run.
 */
function layoutMappedSeats(batches, quality) {
  let count = 0;
  for (const part of PARTS) {
    const f = FACETS[part.facet];
    const rowByNum = new Map(part.rows.map((r) => [r.row, r]));
    for (const r of part.rows) {
      const key = `${part.key}|${r.kind}`;
      let b = batches.get(key);
      if (!b) batches.set(key, (b = newBatch(key, part.key, r.kind, part.tier, part.facet)));
      const prev = rowByNum.get(r.row - 1);
      const prevNear = prev && Math.abs(r.v - prev.v) < 1.1 ? prev : null;
      for (const seg of r.segs) {
        for (let i = 0; i < seg.n; i++) {
          const u = seg.u0 + (i + 0.5) * seg.pitch;
          addSeat(b, u * f.u[0] + r.v * f.v[0], r.y, u * f.u[1] + r.v * f.v[1], f.rotY, r.row, seg.first + i, r.kind);
          count++;
        }
        if (r.kind === 'balcony') layoutBalconyRun(b, part, r, seg);
        else layoutLuxRun(b, part, r, seg, prevNear, quality);
      }
    }
  }
  return count;
}

// --------------------------------------------------------------------------------------
// VIP boxes (LEVEL 6)
// --------------------------------------------------------------------------------------
function layoutVip(SPEC, flags) {
  const t = (SPEC.tiers || []).find((x) => /VIP/i.test(x.name || '')) || {};
  const z1 = (t.innerRadius_m ?? 102.8) + FAN_APEX_Z;
  const z2 = (t.outerRadius_m ?? 103.85) + FAN_APEX_Z;
  const y1 = t.frontElevation_m ?? 17.37;
  const y2 = t.backElevation_m ?? 17.72;
  const chairW = t.seatSpacing_m ?? 0.553;
  const tableW = flags && flags.vipTables === '0' ? 0 : VIP_TABLE_W;
  const corpW = t.corporateBoxWidth_m ?? 5;
  const orgW = t.organiserBoxWidth_m ?? 10;
  const nCorp = t.corporateBoxes ?? 10;
  const corpSeats = t.corporateBoxSeats ?? 10;
  const orgSeats = t.organiserBoxSeats ?? 20;
  const boxes = [];
  const side = nCorp / 2;
  for (let i = side; i >= 1; i--) boxes.push({ cx: -(orgW / 2 + (i - 0.5) * corpW), width: corpW, perRow: corpSeats / 2 });
  boxes.push({ cx: 0, width: orgW, perRow: orgSeats / 2, organiser: true });
  for (let i = 1; i <= side; i++) boxes.push({ cx: orgW / 2 + (i - 0.5) * corpW, width: corpW, perRow: corpSeats / 2 });
  const b = newBatch('L6/VIP|vip', 'L6/VIP', 'vip', 6, 'C');
  const spacing = chairW + tableW;
  const rows = [
    { row: 1, y: y1, z: z1 },
    { row: 2, y: y2, z: z2 },
  ];
  for (const r of rows) {
    let num = 1;
    boxes.forEach((bx, bi) => {
      for (let i = 0; i < bx.perRow; i++) {
        const x = bx.cx + (i - (bx.perRow - 1) / 2) * spacing;
        addSeat(b, x, r.y, r.z, 0, r.row, num++, 'vip', bi + 1, chairW / M.CADENZA.width);
        if (tableW > 0 && i < bx.perRow - 1) pushM(b.tableM, x + spacing / 2, r.y, r.z, 0);
      }
    });
  }
  b.boxes = boxes.map((bx, i) => ({ box: i + 1, cx: bx.cx, width: bx.width, seats: bx.perRow * 2, organiser: !!bx.organiser }));
  b.rows = rows;
  return b;
}

// --------------------------------------------------------------------------------------
// wheelchair platform (LEVEL 3)
// --------------------------------------------------------------------------------------
function layoutWheelchair(SPEC) {
  const ring = SEAT_OUTLINES.wheelchairPlatform;
  const zFront = Math.min(...ring.map((p) => p[1]));
  // stretches of the platform's front edge (between the two aisle heads)
  const spans = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const c = ring[(i + 1) % ring.length];
    if (Math.abs(a[1] - zFront) < 0.02 && Math.abs(c[1] - zFront) < 0.02) spans.push([Math.min(a[0], c[0]), Math.max(a[0], c[0])]);
  }
  spans.sort((p, q) => p[0] - q[0]);
  const want = SPEC.seatTotals?.wheelchairPositions ?? 20;
  let w = WC_BAY.width;
  let counts = spans.map(([a, c]) => Math.floor((c - a + 1e-6) / w));
  let total = counts.reduce((s, v) => s + v, 0);
  if (total < want) {
    // not enough room at the nominal width: share the positions out by length
    const len = spans.reduce((s, [a, c]) => s + (c - a), 0);
    counts = spans.map(([a, c]) => Math.round((want * (c - a)) / len));
    w = Math.min(...spans.map(([a, c], i) => (c - a) / Math.max(1, counts[i])));
    total = counts.reduce((s, v) => s + v, 0);
  }
  while (total > want) {
    const i = counts.indexOf(Math.max(...counts));
    counts[i]--;
    total--;
  }
  const tLower = (SPEC.tiers || []).find((x) => x.wheelchairPlatformElevation_m !== undefined);
  const y = tLower?.wheelchairPlatformElevation_m ?? LEVEL_Y[3];
  const z0 = zFront + WC_BAY.frontMargin;
  const z1 = z0 + WC_BAY.depth;
  const bays = [];
  const groups = [];
  spans.forEach(([a, c], i) => {
    const n = counts[i];
    if (!n) return;
    const x0 = (a + c) / 2 - (n * w) / 2;
    groups.push({ x0, x1: x0 + n * w, n });
    for (let k = 0; k < n; k++) bays.push({ num: bays.length + 1, x: x0 + (k + 0.5) * w, y, z: (z0 + z1) / 2, width: w, depth: WC_BAY.depth });
  });
  return { y, z0, z1, w, bays, groups, companionZ: z1 + 0.4 };
}

function buildWheelchairMarkings(wc, mats) {
  const g = new THREE.Group();
  tag(g, { name: 'wheelchair', level: 3 });
  g.userData.wheelchair = true;
  const y = wc.y;
  const lw = WC_BAY.line;
  const lines = new MeshBuilder();
  const flat = (x0, x1, z0, z1) => lines.quad([x0, y + 0.004, z0], [x1, y + 0.004, z0], [x1, y + 0.004, z1], [x0, y + 0.004, z1], [0, 1, 0]);
  for (const grp of wc.groups) {
    flat(grp.x0 - lw / 2, grp.x1 + lw / 2, wc.z0 - lw / 2, wc.z0 + lw / 2);
    flat(grp.x0 - lw / 2, grp.x1 + lw / 2, wc.z1 - lw / 2, wc.z1 + lw / 2);
    for (let k = 0; k <= grp.n; k++) {
      const x = grp.x0 + k * wc.w;
      flat(x - lw / 2, x + lw / 2, wc.z0 + lw / 2, wc.z1 - lw / 2);
    }
  }
  g.add(mesh(lines.build({ crease: 1 }), mats.wcLine, { name: 'wheelchair bay lines', layer: LAYER, level: 3, cast: false }));
  const sym = new MeshBuilder();
  const s = 0.25;
  for (const bay of wc.bays) {
    // "up" of the pictogram points to the stage; read by someone standing behind the bay
    sym.quad(
      [bay.x - s, y + 0.006, bay.z + s],
      [bay.x + s, y + 0.006, bay.z + s],
      [bay.x + s, y + 0.006, bay.z - s],
      [bay.x - s, y + 0.006, bay.z - s],
      [0, 1, 0],
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ],
    );
  }
  g.add(mesh(sym.build({ crease: 1 }), mats.wcSymbol, { name: 'wheelchair pictograms', layer: LAYER, level: 3, cast: false }));
  g.userData.wheelchairPositions = wc.bays.map((b) => ({ num: b.num, x: b.x, y: b.y, z: b.z, rotY: 0, width: b.width, depth: b.depth }));
  return g;
}

// --------------------------------------------------------------------------------------
// mesh construction
// --------------------------------------------------------------------------------------
function geometries(quality) {
  const hi = quality === 'high';
  const g = {
    luxFabric: M.luxFabric(quality),
    luxShell: M.luxShell(quality),
    luxBracket: M.luxBracket(quality),
    cadSeat: M.cadenzaSeat(quality),
    cadStandard: M.cadenzaStandard(quality),
    cadEndPanel: M.cadenzaEndPanel(),
    vipSeat: M.vipSeat(quality),
    vipTable: M.vipTable(VIP_TABLE_W),
  };
  if (hi) {
    g.luxFittings = M.luxFittings();
    g.luxLeg = M.luxLeg();
    g.luxCupArm = M.luxCupArm();
    g.arenaEndArm = M.arenaEndArm();
    g.casterFoot = M.arenaCasterFoot();
    g.matrixPost = M.arenaMatrixPost();
    g.matrixRail = M.arenaMatrixRail(ROW_TREAD);
  }
  return g;
}

/** Procedural seat meshes (one per material) of a batch; they share `attr`. */
function proceduralSeatMeshes(b, attr, geo, mats, level, lookup) {
  const tags = (role) => ({ name: `${b.key} ${role}`, level, kind: b.kind, part: b.part, role });
  const out = [];
  if (b.kind === 'balcony') {
    out.push(instanced(geo.cadSeat.fabric, mats.fabricRed, attr, tags('fabric')));
    out.push(instanced(geo.cadSeat.wood, mats.woodWalnut, attr, tags('wood')));
  } else if (b.kind === 'vip') {
    out.push(instanced(geo.vipSeat.fabric, mats.fabricVip, attr, tags('fabric')));
    out.push(instanced(geo.vipSeat.wood, mats.woodVip, attr, tags('wood')));
    out.push(instanced(geo.vipSeat.steel, mats.steel, attr, tags('feet')));
  } else {
    out.push(instanced(geo.luxFabric, mats.fabricBlue, attr, tags('fabric')));
    out.push(instanced(geo.luxShell, mats.shell, attr, tags('shell')));
    if (geo.luxFittings) out.push(instanced(geo.luxFittings, mats.fittings, attr, tags('fittings')));
  }
  for (const m of out) m.userData.seatLookup = lookup;
  return out;
}

function customSeatMesh(b, attr, level, lookup, override) {
  const m = instanced(override.geometry, override.material, attr, { name: `${b.key} custom model`, level, kind: b.kind, part: b.part, role: 'custom' });
  m.userData.seatLookup = lookup;
  return m;
}

function buildBatch(b, parent, geo, mats, level) {
  if (!b.row.length) return null;
  const attr = new THREE.InstancedBufferAttribute(new Float32Array(b.seatM), 16);
  const lookup = makeLookup(b);
  const record = { key: b.key, part: b.part, kind: b.kind, tier: b.tier, level, group: parent, attr, lookup, count: lookup.count, procedural: [], custom: null };
  record.procedural = proceduralSeatMeshes(b, attr, geo, mats, level, lookup);
  const ov = overrides.get(b.kind);
  if (ov) {
    record.custom = customSeatMesh(b, attr, level, lookup, ov);
    parent.add(record.custom);
  } else for (const m of record.procedural) parent.add(m);

  // row furniture (not pickable)
  const tags = (role) => ({ name: `${b.key} ${role}`, level, kind: b.kind, part: b.part, role });
  const addInst = (geometry, material, matrices, role) => {
    if (geometry && matrices.length) parent.add(instanced(geometry, material, matrices, tags(role)));
  };
  if (b.kind === 'balcony') {
    const stdAttr = new THREE.InstancedBufferAttribute(new Float32Array(b.standardM), 16);
    parent.add(instanced(geo.cadStandard.steel, mats.steel, stdAttr, tags('standard')));
    parent.add(instanced(geo.cadStandard.wood, mats.woodWalnut, stdAttr, tags('armrest')));
    if (geo.cadStandard.cup) parent.add(instanced(geo.cadStandard.cup, mats.cup, stdAttr, tags('cupholder')));
    addInst(geo.cadEndPanel, mats.woodWalnut, b.endPanelM, 'endpanel');
  } else if (b.kind === 'vip') {
    addInst(geo.vipTable, mats.woodVip, b.tableM, 'sidetable');
  } else {
    addInst(geo.luxBracket, mats.bracket, b.bracketM, 'bracket');
    if (b.beams.length) {
      const beams = mesh(merge(b.beams), mats.steel, { name: `${b.key} beams`, layer: LAYER, level, cast: false });
      Object.assign(beams.userData, { kind: b.kind, part: b.part, role: 'beam' });
      parent.add(beams);
    }
    addInst(geo.luxLeg, mats.steel, b.legM, 'leg');
    addInst(geo.casterFoot, mats.steel, b.casterM, 'casterfoot');
    addInst(geo.matrixPost, mats.steel, b.postM, 'matrixpost');
    addInst(geo.matrixRail, mats.rail, b.railM, 'matrixrail');
    addInst(b.kind === 'arena' ? geo.arenaEndArm : geo.luxCupArm, mats.fittings, b.armM, 'cuparm');
  }
  return record;
}

function buildHighlight(mats) {
  const g = new THREE.Group();
  g.name = 'highlight';
  g.userData.layer = LAYER;
  g.visible = false;
  const boxMesh = mesh(M.markerBox(), mats.highlight, { name: 'seat highlight box', layer: LAYER, cast: false, receive: false });
  const pin = mesh(M.markerPin(), mats.highlightPin, { name: 'seat highlight pin', layer: LAYER, cast: false, receive: false });
  boxMesh.renderOrder = 10;
  pin.renderOrder = 11;
  g.add(boxMesh, pin);
  g.userData.box = boxMesh;
  g.userData.pin = pin;
  return g;
}

// --------------------------------------------------------------------------------------
// module API
// --------------------------------------------------------------------------------------
export function build(ctx = {}) {
  const quality = ctx.quality === 'low' ? 'low' : 'high';
  const SPEC = ctx.SPEC || SPEC_DEFAULT;
  const flags = ctx.flags || {};
  const mats = materials();
  const geo = geometries(quality);

  const root = new THREE.Group();
  root.name = 'seats';
  root.userData.layer = LAYER;
  root.userData.seatsRoot = true;

  const batches = new Map();
  const mapped = layoutMappedSeats(batches, quality);
  if (mapped !== MAPPED_SEAT_COUNT) console.warn(`[seats] placed ${mapped} mapped seats, expected ${MAPPED_SEAT_COUNT}`);

  // wheelchair bays + one companion chair behind each bay (movable Lux chair, ESTIMATED)
  const wc = layoutWheelchair(SPEC);
  {
    const key = 'L3/C|stand';
    let b = batches.get(key);
    if (!b) batches.set(key, (b = newBatch(key, 'L3/C', 'stand', 3, 'C')));
    const half = M.LUX.width / 2;
    for (const bay of wc.bays) {
      addSeat(b, bay.x, wc.y, wc.companionZ, 0, 0, bay.num, 'companion');
      for (const dx of [-half, half]) {
        pushM(b.bracketM, bay.x + dx, wc.y, wc.companionZ, 0);
        if (quality === 'high') pushM(b.legM, bay.x + dx, wc.y, wc.companionZ, 0);
      }
      b.beams.push(
        box(
          bay.x,
          wc.y + (M.LUX.beamY[0] + M.LUX.beamY[1]) / 2,
          wc.companionZ + (M.LUX.beamZ[0] + M.LUX.beamZ[1]) / 2,
          M.LUX.width + 2 * M.LUX.bracketHalf,
          M.LUX.beamY[1] - M.LUX.beamY[0],
          M.LUX.beamZ[1] - M.LUX.beamZ[0],
        ),
      );
    }
  }
  const vip = layoutVip(SPEC, flags);
  batches.set(vip.key, vip);

  // groups
  const gArena = tag(new THREE.Group(), { name: 'arena', level: 1 });
  gArena.userData.arenaSeats = true;
  const gTele = tag(new THREE.Group(), { name: 'telescopic', level: 3 });
  gTele.userData.telescopic = true;
  const gStands = tag(new THREE.Group(), { name: 'stands' });
  const gBalcony = tag(new THREE.Group(), { name: 'balcony', level: 5 });
  const gVip = tag(new THREE.Group(), { name: 'vip', level: 6 });
  root.add(gArena, gTele, gStands, gBalcony, gVip);

  const records = [];
  const partGroups = new Map();
  for (const b of batches.values()) {
    const level = b.tier;
    let parent;
    if (b.kind === 'arena') parent = gArena;
    else if (b.kind === 'telescopic') parent = gTele;
    else if (b.kind === 'balcony') parent = gBalcony;
    else if (b.kind === 'vip') parent = gVip;
    else {
      parent = partGroups.get(b.part);
      if (!parent) {
        parent = tag(new THREE.Group(), { name: b.part, level, part: b.part });
        partGroups.set(b.part, parent);
        gStands.add(parent);
      }
    }
    const rec = buildBatch(b, parent, geo, mats, level);
    if (rec) records.push(rec);
  }
  gVip.userData.boxes = vip.boxes;

  root.add(buildWheelchairMarkings(wc, mats));
  const hl = buildHighlight(mats);
  root.add(hl);

  root.userData.seatBatches = records;
  root.userData.highlight = hl;
  root.userData.quality = quality;
  const byKind = {};
  for (const r of records) for (let i = 0; i < r.count; i++) byKind[SEAT_KINDS[r.lookup.kind[i]]] = (byKind[SEAT_KINDS[r.lookup.kind[i]]] || 0) + 1;
  root.userData.seatStats = {
    mapped,
    vip: byKind.vip || 0,
    wheelchair: wc.bays.length,
    companion: byKind.companion || 0,
    capacity: mapped + (byKind.vip || 0) + wc.bays.length,
    byKind,
    triangles: countTriangles(root),
  };
  builtRoots.add(new WeakRef(root));
  // dev / deep link: ?seathl=7-20-142 puts the highlight marker on that seat
  if (typeof flags.seathl === 'string') {
    const [tier, row, num] = flags.seathl.split('-').map(Number);
    highlightSeat(root, { tier, row, num });
  }
  return root;
}

/** Animates the highlight marker (bobbing pin, pulsing box). */
export function update(group, state) {
  const hl = group?.userData?.highlight;
  if (!hl || !hl.visible) return;
  const t = state?.time || 0;
  hl.userData.pin.position.y = 0.07 * Math.sin(t * 3.2);
  hl.userData.pin.rotation.y = t * 1.2;
  const k = 1 + 0.03 * Math.sin(t * 5);
  hl.userData.box.scale.set(hl.userData.wide ? 1.14 * k : k, 1, k);
}

function seatAt(L, i) {
  const o = {
    tier: L.tier,
    row: L.row[i],
    num: L.num[i],
    kind: SEAT_KINDS[L.kind[i]],
    x: L.pos[i * 4],
    y: L.pos[i * 4 + 1],
    z: L.pos[i * 4 + 2],
    rotY: L.pos[i * 4 + 3],
    part: L.part,
  };
  if (L.box) o.box = L.box[i];
  return o;
}

/**
 * Raycast picking: the seat behind an InstancedMesh hit.
 *   const hit = raycaster.intersectObject(seatsGroup, true)[0];
 *   const seat = seatFromInstance(hit.object, hit.instanceId);
 * Returns { tier, row, num, kind, x, y, z, rotY, part, box? } or null when the mesh is not a
 * seat mesh (row furniture, markings). (x, y, z) is the seat's floor point, as in
 * core/seating.js. VIP seats: tier 6, row 1-2, num 1-60 from house left, box 1-11.
 * Companion chairs of the wheelchair bays: tier 3, row 0, num 1-20.
 */
export function seatFromInstance(meshObj, instanceId) {
  const L = meshObj?.userData?.seatLookup;
  if (!L || instanceId === undefined || instanceId === null || instanceId < 0 || instanceId >= L.count) return null;
  return seatAt(L, instanceId);
}

function rootOf(obj) {
  for (let o = obj; o; o = o.parent) if (o.userData && o.userData.seatsRoot) return o;
  return null;
}

function resolveSeat(root, seat) {
  const tier = Number(seat.tier);
  const row = Number(seat.row);
  const num = Number(seat.num);
  if (seat.kind !== 'vip' && seat.kind !== 'companion' && tier !== 6 && row > 0) {
    const s = findSeat(tier, row, num);
    if (s) return s;
  }
  for (const rec of root.userData.seatBatches) {
    const L = rec.lookup;
    if (L.tier !== tier) continue;
    for (let i = 0; i < L.count; i++) {
      if (L.row[i] !== row || L.num[i] !== num) continue;
      if (seat.kind && SEAT_KINDS[L.kind[i]] !== seat.kind) continue;
      return seatAt(L, i);
    }
  }
  return null;
}

/**
 * Show the marker on one seat (or hide it with null). `seat` is what seatFromInstance()
 * or core/seating.js findSeat() returns, or just { tier, row, num }. Returns the resolved
 * seat or null.
 */
export function highlightSeat(group, seat) {
  const root = rootOf(group) || (group?.userData?.highlight ? group : null);
  if (!root) return null;
  const hl = root.userData.highlight;
  if (!seat) {
    hl.visible = false;
    root.userData.highlighted = null;
    return null;
  }
  const s = seat.x !== undefined && seat.rotY !== undefined ? seat : resolveSeat(root, seat);
  if (!s) {
    hl.visible = false;
    root.userData.highlighted = null;
    return null;
  }
  hl.position.set(s.x, s.y, s.z);
  hl.rotation.set(0, s.rotY, 0);
  hl.userData.wide = s.kind === 'balcony' || s.kind === 'vip';
  hl.userData.box.scale.set(hl.userData.wide ? 1.14 : 1, 1, 1);
  const level = s.tier;
  hl.userData.level = level;
  hl.userData.box.userData.level = level;
  hl.userData.pin.userData.level = level;
  hl.visible = true;
  hl.updateMatrixWorld(true);
  root.userData.highlighted = { tier: s.tier, row: s.row, num: s.num, kind: s.kind };
  return s;
}

function applyOverride(root, kinds) {
  for (const rec of root.userData.seatBatches || []) {
    if (!kinds.includes(rec.kind)) continue;
    const ov = overrides.get(rec.kind);
    if (rec.custom) {
      rec.group.remove(rec.custom);
      rec.custom.dispose();
      rec.custom = null;
    }
    if (ov) {
      for (const m of rec.procedural) rec.group.remove(m);
      const b = { key: rec.key, kind: rec.kind, part: rec.part };
      rec.custom = customSeatMesh(b, rec.attr, rec.level, rec.lookup, ov);
      rec.group.add(rec.custom);
    } else {
      for (const m of rec.procedural) if (m.parent !== rec.group) rec.group.add(m);
    }
  }
}

/**
 * Replace the procedural chair of one seat kind by another model (e.g. a generated GLB).
 *   kind      'stand' | 'telescopic' | 'arena' | 'balcony' | 'vip', or 'lux' for the three
 *             kinds that use the Lux chair (the 20 companion chairs follow 'stand').
 *   geometry  BufferGeometry modelled like the procedural chairs: metres, facing −Z, floor
 *             at y = 0, centred on x, z = 0 on the row line (chair back about z = +0.16 … +0.28).
 *             Pass null to return to the procedural model.
 *   material  Material or Material[] (with geometry groups).
 * Works before build() (the next build uses it) and after (built groups are updated in
 * place). The row furniture (beams, legs, brackets, armrest standards) is kept.
 */
export function setSeatModel(kind, geometry, material) {
  const kinds = kind === 'lux' ? LUX_KINDS : [kind];
  for (const k of kinds) {
    if (!SEAT_KINDS.includes(k)) throw new Error(`setSeatModel: unknown seat kind "${k}"`);
    if (geometry) {
      if (!geometry.boundingBox) geometry.computeBoundingBox();
      if (!geometry.boundingSphere) geometry.computeBoundingSphere();
      overrides.set(k, { geometry, material: material || mat('seat.fabricBlue') });
    } else overrides.delete(k);
  }
  for (const ref of builtRoots) {
    const root = ref.deref();
    if (root) applyOverride(root, kinds);
    else builtRoots.delete(ref);
  }
}

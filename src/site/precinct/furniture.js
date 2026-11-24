// Outdoor furniture of the precinct as simple stand-ins, and PROP_SLOTS: the positions of
// every stand-in so generated 3D props can replace them later.
//
// Slot convention: { type, x, y, z, rotY } in world metres; y is the surface the prop stands
// on; the prop is modelled with its front toward −Z and its length along +X, then rotated by
// rotY about +Y (same convention as the seats in core/seating.js).
import * as THREE from 'three';
import { GLASS_BOX } from '../../core/envelope.js';
import { merge, metricUV, box, cylinder } from '../../core/geom.js';
import { M, E } from './mats.js';
import { Bag, Tris, beam, instanced, lbox, frame, pointInRing, stairProfile, trs, tube } from './kit.js';
import { blockText, textWidth, rnd } from './facade.js';
import {
  ARENA_DECK_RING, BAY_TENT, FACET_L, FACET_R, H, HF, JOG_T, LIFT_E, LIFT_N, LIFT_S, LIFT_W, NGATE, P, PF, PLAZA_RING, SITE_TREES, STEPS, WALL_OFF, Y_DECK, Y_PLAZA,
} from './layout.js';
import { VISION } from './hilton.js';

/** rotY that turns a prop's front (−Z) toward the plan direction (nx, nz). */
const faceTo = (nx, nz) => Math.atan2(-nx, -nz);
const r3 = (v) => Math.round(v * 1000) / 1000;

function computeSlots() {
  const s = [];
  const add = (type, [x, z], y, rotY = 0) => s.push(Object.freeze({ type, x: r3(x), y: r3(y), z: r3(z), rotY: r3(rotY) }));
  const D = Y_DECK;
  const Pz = Y_PLAZA;
  const rotR = faceTo(FACET_R.n[0], FACET_R.n[1]);
  const rotL = faceTo(FACET_L.n[0], FACET_L.n[1]);

  // --- plaza lamp posts with paired banners (about 6.5 m; every 10-20 m) -------------------
  for (const x of [6, 16, 26, 36, 46]) add('lamp_post', [x, STEPS.zTop - 1.3], D); // head of the Big Steps
  for (const x of [-7, -22]) add('lamp_post', [x, 106.5], D);
  for (const t of [14, 30, 46]) add('lamp_post', FACET_R.at(t, 1.6), D, rotR);
  for (const t of [50]) add('lamp_post', FACET_L.at(t, 4.0), D, rotL);
  add('lamp_post', FACET_L.at(JOG_T + 9, 1.0), D, rotL);
  for (const x of [8, 24, 40]) add('lamp_post', [x, STEPS.zTop + STEPS.depth + 2.0], Pz); // foot of the Big Steps
  add('lamp_post', [15, 131], Pz);
  add('lamp_post', [29.5, 127.5], Pz);
  for (const [a, b] of [[12, 9], [28, 9], [44, 11], [66, 12], [80, 5], [66, -2], [61, 19]]) add('lamp_post', H(a, b), Pz, HF.rotY);
  add('lamp_post', [NGATE.x0 - 1.6, NGATE.zFoot + 2.5], 0.09);
  add('lamp_post', [NGATE.x1 + 1.5, NGATE.zFoot + 3.5], 0.09);

  // --- totems and digital signage pillars -------------------------------------------------------
  add('totem', [4.2, STEPS.zTop - 1.6], D);
  add('totem', [-25.5, GLASS_BOX.zFront + 2.4], D);
  add('totem', [25.5, GLASS_BOX.zFront + 2.4], D);
  add('totem', FACET_L.at(JOG_T + 2.5, 1.2), D, rotL);
  add('totem', FACET_L.at(48.5, 6.5), D, rotL);
  add('totem', [NGATE.x1 + 1.2, NGATE.zTop - 1.0], Pz);
  add('totem', H(27.2, -34.2), Pz, HF.rotY + Math.PI);
  add('totem', [NGATE.x1 + 2.6, NGATE.zFoot + 1.2], 0.09, Math.PI);
  // two portrait screens side by side at the south end of the Big Steps (photo T8)
  add('signage_pillar', H(9.4, 4.6), Pz, HF.rotY);
  add('signage_pillar', H(10.6, 4.6), Pz, HF.rotY);
  add('signage_pillar', H(86.0, 7.5), Pz, HF.rotY + Math.PI / 2);
  add('signage_pillar', H(33.0, 2.6), Pz, HF.rotY);

  // --- benches, planters -------------------------------------------------------------------------
  for (const a of [5, 12.2, 19.4]) add('bench', P(a, -1.6), Pz, PF.rotY);
  add('bench', H(72, 16.5), Pz, HF.rotY + 0.6);
  add('bench', H(78, 12.6), Pz, HF.rotY + 0.6);
  add('bench', [27.5, 147.2], Pz, 0.4);
  add('bench', [33.5, 150.9], Pz, -0.35);
  add('bench', FACET_L.at(47.5, 2.6), D, rotL);
  add('bench', FACET_L.at(51.5, 2.6), D, rotL);
  for (const a of [2.6, 5.2, 10.4, 13.0, 18.2, 20.8]) add('planter', H(a, 1.5), Pz, HF.rotY); // in front of the BAYDECK arcade
  // Estimated positions on the BAYDECK terrace, alongside the pavilion benches (research/exterior-site.md).
  for (const a of [7.6, 14.8, 22.0]) add('planter', P(a, -1.6), Pz, PF.rotY);

  // --- bollards --------------------------------------------------------------------------------------
  for (let k = 0; k < 4; k++) add('bollard', H(89.6 - k * 0.9 * 0.47 - 0.9, 3.9 + k * 1.75 + 0.8), Pz);
  for (const t of [21.4, 29.6]) add('bollard', FACET_L.at(t, 9.3), 0.05);
  for (let x = NGATE.x0 + 1; x <= NGATE.x1 + 6; x += 3.2) add('bollard', [x, NGATE.zFoot + 7.6], 0.09);

  // --- red outdoor locker banks along the deck-level wall (0.9 m modules) ---------------------
  for (const [f, rot] of [[FACET_R, rotR], [FACET_L, rotL]]) {
    for (const [t0, t1] of [[10.6, 21.4], [34.6, 55.3]]) {
      for (let t = t0 + 0.45; t < t1; t += 0.9) add('locker_bank', f.at(t, WALL_OFF + 0.8), D, rot);
    }
  }
  for (const sg of [-1, 1]) for (let x = 24.4 + 0.45; x < 34.4; x += 0.9) add('locker_bank', [sg * x, GLASS_BOX.zBack + 0.8], D, faceTo(0, 1));

  // --- crowd barriers in front of the Main Entrance ---------------------------------------------
  for (let x = -20.9; x <= 21; x += 2.2) if (Math.abs(x) > 1.5) add('crowd_barrier', [x, GLASS_BOX.zFront + 1.5], D);

  // --- Bay Tent surroundings: flag poles, monument letters, kitchen cars ------------------------
  for (let k = 0; k < 3; k++) add('flag_pole', [BAY_TENT.cx + BAY_TENT.len / 2 + 2.6 + k * 1.3, BAY_TENT.cz - 3.2], Pz);
  add('monument_letters', [BAY_TENT.cx, BAY_TENT.cz - BAY_TENT.depth / 2 - 3.0], Pz, 0); // readable from the Big Steps side
  for (const a of [7.5, 14.5, 21.5]) add('kitchen_car', P(a, -7.5), Pz, PF.rotY);

  // --- single objects built elsewhere ---------------------------------------------------------------
  add('zigzag_rail', [STEPS.xNorth - 0.2, STEPS.zTop + STEPS.depth / 2], Y_PLAZA + (Y_DECK - Y_PLAZA) / 2, Math.PI / 2);
  add('outdoor_vision', H(VISION.a, VISION.b), VISION.y, HF.rotY);
  add('brick_lift_tower', FACET_L.at(LIFT_N.t + LIFT_N.len / 2, (LIFT_N.off0 + LIFT_N.off1) / 2), 0, rotL);
  add('brick_lift_tower', H(LIFT_W.a, LIFT_W.b), 0, HF.rotY);
  add('brick_lift_tower', H((LIFT_S.a0 + LIFT_S.a1) / 2, (LIFT_S.b0 + LIFT_S.b1) / 2), 0, HF.rotY + Math.PI);
  add('brick_lift_tower', LIFT_E, 0, 0);

  // --- trees on the site (surveyed positions that are not under a deck) ----------------------------
  SITE_TREES.forEach(([x, z], i) => {
    if (pointInRing(x, z, ARENA_DECK_RING) || pointInRing(x, z, PLAZA_RING)) return;
    add('street_tree', [x, z], 0.05, rnd(i, 3) * Math.PI * 2);
  });
  // specimen trees of the garden beside the North Gate stair (photos B8, T2)
  for (const [x, z] of [[-1.5, 130.5], [-9.5, 129.8], [1.5, 136.5], [-20, 124.5], [-27.5, 119.2]]) add('street_tree', [x, z], 0.3, rnd(x | 0, 9) * 6);
  return s;
}

export const PROP_SLOTS = Object.freeze(computeSlots());
const of = (type) => PROP_SLOTS.filter((p) => p.type === type);
const levelOf = (y) => (Math.abs(y - Y_DECK) < 0.4 ? 3 : y < 1 ? 1 : undefined);

/** Instanced stand-ins for one slot type: parts = [[geometry, material, cast?]]. */
function place(out, type, parts, { scale } = {}) {
  const byLevel = new Map();
  of(type).forEach((p, i) => {
    const lv = levelOf(p.y);
    if (!byLevel.has(lv)) byLevel.set(lv, []);
    const k = scale ? scale(i) : 1;
    byLevel.get(lv).push(trs(p.x, p.y, p.z, p.rotY, k, k, k));
  });
  for (const [lv, mats] of byLevel) {
    for (const [g, m, cast = true] of parts) {
      const item = instanced(g, m, mats, { name: `precinct ${type} ${m.name}${lv !== undefined ? ` L${lv}` : ''}`, level: lv, cast });
      item.userData.propPlaceholder = type;
      out.push(item);
    }
  }
}

export function buildFurniture(bag, rails, ctx) {
  const out = [];
  const high = ctx.quality !== 'low';

  // --- lamp post: slim pole, cylindrical lantern with a disc cap, banner arm, two banners -----
  {
    const pole = M('precinct.lampPole');
    const g = [
      cylinder(0, 0, 0, 6.15, 0.065, 10),
      cylinder(0, 0, 0, 0.35, 0.11, 10),
      cylinder(0, 0, 6.8, 6.85, 0.21, 14),
      cylinder(0, 0, 6.1, 6.18, 0.15, 12),
      tube([-0.78, 4.86, 0], [0.78, 4.86, 0], 0.025, 6),
      tube([-0.78, 3.3, 0], [0.78, 3.3, 0], 0.02, 6),
    ];
    const lantern = cylinder(0, 0, 6.18, 6.8, 0.13, 12);
    const b = new Tris();
    for (const x0 of [-0.74, 0.12]) b.quad([x0, 3.34, 0], [x0 + 0.62, 3.34, 0], [x0 + 0.62, 4.82, 0], [x0, 4.82, 0], [0, 0, 1]);
    place(out, 'lamp_post', [[merge(g), pole], [lantern, E('precinct.lampLantern'), false], [b.build(), M('precinct.banner'), false]]);
  }
  // --- totem (black monolith) and digital signage pillar (portrait screen) ---------------------
  place(out, 'totem', [[box(0, 1.1, 0, 0.7, 2.2, 0.22), M('precinct.totem')], [box(0, 1.55, -0.115, 0.5, 0.9, 0.012), E('precinct.totemScreen'), false]]);
  place(out, 'signage_pillar', [[box(0, 1.0, 0, 0.85, 2.0, 0.3), M('precinct.totem')], [box(0, 1.1, -0.156, 0.68, 1.4, 0.012), E('precinct.totemScreen'), false]]);
  // --- bench: timber slats on dark steel legs ----------------------------------------------------
  {
    const seat = merge([box(0, 0.43, 0, 1.8, 0.06, 0.45)]);
    const legs = merge([box(-0.7, 0.2, 0, 0.06, 0.4, 0.4), box(0.7, 0.2, 0, 0.06, 0.4, 0.4)]);
    place(out, 'bench', [[seat, M('precinct.bench')], [legs, M('precinct.darkMetal')]]);
  }
  // --- planter box with shrubs --------------------------------------------------------------------
  {
    const g = new THREE.IcosahedronGeometry(0.42, 1);
    g.scale(1.6, 0.9, 0.8);
    g.translate(0, 0.86, 0);
    place(out, 'planter', [[box(0, 0.3, 0, 1.6, 0.6, 0.6), M('precinct.planter')], [metricUV(g), M('precinct.planting')]]);
  }
  place(out, 'bollard', [[merge([cylinder(0, 0, 0, 0.85, 0.075, 10), cylinder(0, 0, 0.85, 0.88, 0.085, 10)]), M('precinct.bollard')]]);
  // --- red locker module: 0.9 x 0.65 x 2.0 m, five tiers of doors (recessed joints) ------------
  {
    const body = [box(0, 1.0, 0.05, 0.9, 2.0, 0.6)];
    const doors = [];
    for (let c = 0; c < 2; c++) for (let k = 0; k < 5; k++) doors.push(box(-0.225 + c * 0.45, 0.24 + k * 0.38, -0.262, 0.42, 0.35, 0.025));
    place(out, 'locker_bank', [[merge(body), M('precinct.darkMetal')], [merge(doors), M('precinct.locker')]]);
  }
  // --- crowd barrier: interlocking steel barrier 2.0 x 1.1 m -----------------------------------------
  {
    const g = [beam([-1, 1.05, 0], [1, 1.05, 0], 0.04, 0.04), beam([-1, 0.22, 0], [1, 0.22, 0], 0.04, 0.04)];
    for (const x of [-1, 1]) g.push(box(x, 0.55, 0, 0.04, 1.1, 0.04), box(x * 0.82, 0.02, 0, 0.05, 0.04, 0.55));
    if (high) for (let k = 1; k < 12; k++) g.push(box(-1 + (2 * k) / 12, 0.635, 0, 0.018, 0.83, 0.018));
    place(out, 'crowd_barrier', [[merge(g), M('precinct.barrier')]]);
  }
  // --- flag poles -----------------------------------------------------------------------------------------
  {
    const f = new Tris();
    f.quad([0.06, 7.7, 0], [1.56, 7.7, 0], [1.56, 8.7, 0], [0.06, 8.7, 0], [0, 0, 1]);
    place(out, 'flag_pole', [[merge([cylinder(0, 0, 0, 9, 0.05, 8), cylinder(0, 0, 9, 9.12, 0.07, 8)]), M('precinct.flagpole')], [f.build(), M('precinct.flag'), false]]);
  }
  // --- kitchen car: small food truck with a serving hatch and awning (stand-in) ---------------------
  {
    const body = merge([box(0.5, 1.45, 0, 3.4, 2.1, 1.9), box(-1.85, 1.1, 0, 1.3, 1.4, 1.8)]);
    const dark = merge([
      box(0.5, 1.75, -0.96, 2.2, 0.9, 0.04), // hatch
      box(-2.2, 1.45, 0, 0.62, 0.6, 1.6), // windscreen
      box(0.5, 2.35, -1.4, 2.6, 0.06, 0.9), // awning
      ...[[-1.7, -0.9], [-1.7, 0.9], [1.4, -0.9], [1.4, 0.9]].map(([x, z]) => {
        const w = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 12);
        w.rotateX(Math.PI / 2);
        w.translate(x, 0.34, z);
        return metricUV(w);
      }),
    ]);
    place(out, 'kitchen_car', [[body, M('precinct.kitchenCar')], [dark, M('precinct.totem')]]);
  }
  // --- trees: trunk and a faceted crown (stand-in for generated trees) --------------------------------
  {
    const crown = new THREE.IcosahedronGeometry(1.35, 1);
    crown.scale(1, 1.25, 1);
    crown.translate(0, 3.6, 0);
    const trunk = cylinder(0, 0, 0, 2.7, 0.1, 7);
    place(out, 'street_tree', [[trunk, M('precinct.treeTrunk')], [metricUV(crown), M('precinct.treeCrown')]], { scale: (i) => 0.82 + 0.4 * rnd(i, 17) });
  }

  // --- "K-Arena" monument letters on a low plinth in front of the Bay Tent ---------------------------
  for (const p of of('monument_letters')) {
    const cap = 0.8;
    const w = (textWidth('K-Arena') * cap) / 7;
    // letters read from the prop's front (−Z): the text runs toward local −X
    const f = frame(p.x, p.z, -Math.cos(p.rotY), Math.sin(p.rotY));
    const L = new Bag();
    L.add(M('precinct.concrete'), lbox(-w / 2 - 0.35, w / 2 + 0.35, 0, 0.3, -0.3, 0.3));
    blockText('K-Arena', cap, (x0, x1, y0, y1) => L.add(M('precinct.monument'), lbox(-w / 2 + x0, -w / 2 + x1, 0.3 + y0, 0.3 + y1, -0.13, 0.13)));
    const tmp = new Bag();
    tmp.absorb(L, f);
    for (const e of tmp.parts.values()) for (const g of e.list) bag.add(e.material, g.translate(0, p.y, 0));
  }

  // --- red zig-zag tube rail on the cheek wall at the north end of the Big Steps --------------------
  {
    const prof = stairProfile({ yTop: Y_DECK, n: STEPS.n, r: STEPS.r, t: STEPS.t, landings: STEPS.landings });
    const yAt = (d) => {
      const pts = prof.pts;
      for (let i = 0; i < pts.length - 1; i++) if (d <= pts[i + 1][0]) return pts[i][1] + ((pts[i + 1][1] - pts[i][1]) * (d - pts[i][0])) / (pts[i + 1][0] - pts[i][0] || 1);
      return pts[pts.length - 1][1];
    };
    const x = STEPS.xNorth - 0.2;
    const n = 9;
    const len = STEPS.depth - 0.4;
    let prev = null;
    for (let k = 0; k <= n; k++) {
      const d = 0.2 + (len * k) / n;
      const pt = [x, yAt(d) + 0.25 + (k % 2 === 0 ? 0.12 : 1.25), STEPS.zTop + d];
      if (prev) bag.add(M('precinct.redSteel'), tube(prev, pt, 0.055, 8), 3);
      prev = pt;
    }
  }
  return out;
}

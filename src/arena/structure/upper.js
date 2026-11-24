// LEVEL 5 (Middle Stand concourse and the centre block band), LEVEL 6 (VIP floor shell),
// LEVEL 7 (Upper Stand concourse, forward side corridors), LEVEL 8 / 9 (plant).
import { WING_ANGLE } from '../../core/seating.js';
import { frameC, frameW, xJ, aJ, RC0, RW0 } from './kit.js';
import { R, Y, wallIn, A_IN, A_ZONE, A_HALL, GATE_PLAN, CIRC, standY } from './plan.js';
import { gateDoor, room, wcEntrance, kioskShell, lockers, cubicles, vanity, hydrant, column } from './fittings.js';
import { signF } from './signs.js';

const SIN = Math.sin(WING_ANGLE);
const COS = Math.cos(WING_ANGLE);
const y5 = Y[5];
const c5 = Y[6] - 0.35;
const y6 = Y[6];
const c6 = Y[7] - 0.35;
const y7 = Y[7];
const c7 = Y[8] - 0.3;

// --- LEVEL 5 ----------------------------------------------------------------------------------------
function level5(kit) {
  const rgw = R.l5BackW + 0.2; // wing gate wall (stand back wall, concourse side)
  const rBack = R.l5BackC + 0.2; // back wall of the centre block band
  const rFaceC = R.l5Face - 0.2; // concourse face of the centre block band
  const s45 = CIRC.s45;
  const r45 = s45.r0 + 15 * s45.going;
  const rLand = r45 + 1.4;

  for (const s of [1, -1]) {
    const W = frameW(s);
    const C = frameC(s);
    const ids = s < 0 ? ['501', '502', '503', '504', '505', '506'] : ['512', '511', '510', '509', '508', '507'];
    const wing = ids.slice(0, 3).map((id) => GATE_PLAN[id]);
    const [gJ, gO, gI] = ids.slice(3).map((id) => GATE_PLAN[id]); // junction, outer centre, inner centre

    // wings: the back wall of the Middle Stand with the vomitory doors 501-503 / 510-512
    const a0 = aJ(rgw);
    kit.wall(W, a0, rgw, A_IN, rgw, y5, c5, 0.4, 'mortar', 5, [...wing.map((g) => ({ at: g.p - a0, w: 2.4, h: 2.3 })), { at: 34.4 - a0, w: 1.0, h: 2.1 }]);
    kit.box(W, 33.9, 34.9, rgw - 0.03, rgw + 0.03, y5, y5 + 2.1, 'door', 5);
    for (const g of wing) gateDoor(kit, W, 5, { p: g.p, q: rgw, axis: 'p', face: 1, y: y5, id: g.id, board: 1, wallH: c5 - y5 });
    signF(kit, W, 5, -8.0, rgw + 0.2, y5 + 1.7, 0, 1, 1.05, 2.4, { kind: 'level', level: 5, here: true, lines: [s < 0 ? '<- 501-503' : '510-512 ->', s < 0 ? '504-512 ->' : '<- 501-509'] });
    for (const a of [6.0, 18.2, 29.5]) hydrant(kit, W, 5, a, rgw + 0.2, 0, 1, y5);
    // fair-faced concrete columns on the facade side of the concourse (clear of the cores)
    for (const a of [3.58, 11.58, 27.58]) column(kit, W, a, R.wall - 0.95, 0.9, y5, c5, 'concreteFair', [6]);
    // far end: red end wall with the kiosk 5A / 5D and its free space
    kit.box(W, A_IN - 0.06, A_IN, rgw + 0.2, R.wall - 0.4, y5, c5, 'red', 5);
    kioskShell(kit, W, 5, { id: s < 0 ? '5A' : '5D', p: A_IN - 2.75, q: 113.9, axis: 'q', into: 1, y: y5, w: 7.6, top: y5 + 3.3 });
    // accessible toilet beside the near stair core
    const near = CIRC.s357.wing[0];
    room(kit, W, 5, near[1] + 0.1, near[1] + 3.3, R.shaft0, R.shaft1, y5, 2.7, 'mortar', { doors: [{ side: 'q0', at: near[1] + 1.4, w: 1.0 }] });
    signF(kit, W, 5, near[1] + 2.5, R.shaft0, y5 + 1.65, 0, -1, 0.55, 0.55, { kind: 'picto', icon: 'accessible' });

    // centre block band between the stand and the concourse
    const lobbyP = [gI.p, gO.p, 29.0];
    const lobbyIds = [gI.id, gO.id, gJ.id];
    kit.wall(C, 0, rBack, xJ(rBack), rBack, y5, c5, 0.2, 'mortar', 5, lobbyP.map((p) => ({ at: p, w: 3.0, h: c5 - y5 })));
    const kx = (lobbyP[0] + lobbyP[1]) / 2; // kiosk 5B / 5C between the two centre lobbies
    // Set the last gate back from the escalator well, leaving a walkable approach
    // from the concourse around the end of the guard rail.
    const recessStart = CIRC.esc.comb0 - 1.2;
    const recessEnd = lobbyP[2] + 2.95;
    const junctionFace = rFaceC - 1.3;
    kit.wall(C, 0, rFaceC, recessStart, rFaceC, y5, c5, 0.4, 'mortar', 5, [...lobbyP.slice(0, 2).map((p) => ({ at: p, w: 2.4, h: 2.3 })), { at: kx, w: 8.2, h: 2.4 }, { at: 2.6, w: 0.95, h: 2.1 }]);
    kit.wall(C, recessStart, junctionFace, recessEnd, junctionFace, y5, c5, 0.4, 'mortar', 5, [{ at: lobbyP[2] - recessStart, w: 2.4, h: 2.3 }]);
    for (const p of [recessStart, recessEnd]) kit.wall(C, p, junctionFace, p, rFaceC, y5, c5, 0.2, 'mortar', 5);
    kit.wall(C, recessEnd, rFaceC, xJ(rFaceC), rFaceC, y5, c5, 0.4, 'mortar', 5);
    kit.box(C, 2.125, 3.075, rFaceC - 0.03, rFaceC + 0.03, y5, y5 + 2.1, 'door', 5);
    lobbyP.forEach((p, i) => {
      const gateFace = i === 2 ? junctionFace : rFaceC;
      for (const e of [-1.5, 1.5]) {
        // lobby side walls; the stair landings open into the neighbouring lobby
        const ops = [];
        if (i === 1 && e > 0) ops.push({ at: rLand - 0.7 - (rBack + 0.1), w: 1.2, h: 2.2 }); // the 4-5 stair opens into the 505 / 508 lobby
        kit.wall(C, p + e, rBack + 0.1, p + e, gateFace - 0.2, y5, c5, 0.2, 'red', 5, ops);
      }
      gateDoor(kit, C, 5, { p, q: gateFace, axis: 'p', face: 1, y: y5, id: lobbyIds[i], board: i === 1 ? 1 : -1, wallH: c5 - y5 });
    });
    kioskShell(kit, C, 5, { id: s < 0 ? '5B' : '5C', p: kx, q: rFaceC - 0.2, into: -1, y: y5, w: 8.2, depth: 2.4, top: y5 + 3.3 });
    // landings of the 4 → 5 flights inside the blocks
    s45.xs.forEach((x, i) => {
      const sd = x > lobbyP[1] ? 1 : -1; // side of the 505 / 508 lobby the stair lies on
      void i;
      const lob = lobbyP[1] + sd * 1.6; // face of the lobby side wall toward the stair
      const xo = x + sd * (s45.width / 2 + 0.62); // far side of the landing
      kit.wall(C, Math.min(lob, xo) - 0.1, rLand, Math.max(lob, xo) + 0.1, rLand, y5, c5, 0.2, 'mortar', 5);
      kit.wall(C, xo, rBack + 0.1, xo, rLand, y5, c5, 0.2, 'mortar', 5);
      signF(kit, C, 5, lobbyP[1] + sd * 1.4, rLand + 0.75, y5 + 1.6, -sd, 0, 0.62, 0.86, { kind: 'picto', icon: 'stairsDown', caption: 'LEVEL\n3·4·5' });
    });
    signF(kit, C, 5, 22.6, rFaceC + 0.2, y5 + 1.7, 0, 1, 1.05, 2.4, { kind: 'level', level: 5, here: true, lines: [s < 0 ? '<- 501-506' : '507-512 ->'] });

    // guard rail round the escalator well
    const e = CIRC.esc;
    const xe0 = e.comb0 - 0.3;
    const xe1 = e.comb0 + e.run + 0.3;
    kit.rail(C, [[xe1, e.r0 - 0.05, y5], [xe0, e.r0 - 0.05, y5], [xe0, e.r1 + 0.05, y5]], 5, { infill: 'mesh' });
    kit.rail(C, [[CIRC.s357.centre[1] + 0.1, e.r1 + 0.05, y5], [xe1, e.r1 + 0.05, y5]], 5, { infill: 'mesh' });
    for (const [q0, q1] of [[e.r0 - 0.02, e.r0 + 0.02], [e.r1 - 0.02, e.r1 + 0.02]]) kit.box(C, xe0, xe1, q0, q1, y5 - 0.6, y5 + 0.02, 'bulkhead', 5);
    kit.box(C, xe0 - 0.02, xe0 + 0.02, e.r0, e.r1, y5 - 0.6, y5 + 0.02, 'bulkhead', 5);
    signF(kit, C, 5, CIRC.s357.centre[1] + 0.9, R.shaft0, y5 + 1.6, 0, -1, 0.62, 0.86, { kind: 'picto', icon: 'escalator', caption: 'LEVEL\n3·5' });
  }
}

// --- LEVEL 6 ---------------------------------------------------------------------------------------
function level6(kit) {
  // shell of the VIP floor: 11 box rooms behind the centre of the Middle Stand (a double
  // organiser's room on the axis and five corporate rooms each side), the corridor wall
  // with one door per room, and a plain back-of-house wall on the wings.
  const rFront = R.l6Front;
  // The bowl's thin rear shell sits inside this finished wall. Centre each closed
  // leaf on its opening so it is visible from both the room and the corridor.
  const rBackWall = 111.3;
  const wallThickness = 0.2;
  const jambDepth = wallThickness / 2 + 0.015;
  const leafDepth = 0.06; // half-depth, clears the 0.045 m shell on either side
  for (const s of [1, -1]) {
    const C = frameC(s);
    const W = frameW(s);
    const doors = [5, 10, 15, 20, 25].map((b) => b + 0.87);
    if (s < 0) doors.push(3.98); // organiser's room: door on the house-left side
    kit.wall(C, 0, rBackWall, 29.85, rBackWall, y6, c6, wallThickness, 'vipPanel', 6, doors.map((d) => ({ at: d, w: 1.0, h: 2.2 })));
    for (const d of doors) {
      kit.box(C, d - 0.48, d + 0.48, rBackWall - leafDepth, rBackWall + leafDepth, y6, y6 + 2.17, 'vipDoor', 6);
      for (const [left, right] of [[d - 0.56, d - 0.48], [d + 0.48, d + 0.56]]) {
        kit.box(C, left, right, rBackWall - jambDepth, rBackWall + jambDepth, y6, y6 + 2.17, 'steelBlack', 6);
      }
      kit.box(C, d - 0.56, d + 0.56, rBackWall - jambDepth, rBackWall + jambDepth, y6 + 2.17, y6 + 2.28, 'steelBlack', 6);
      kit.box(C, d + 0.34, d + 0.38, rBackWall + leafDepth, rBackWall + leafDepth + 0.06, y6 + 0.9, y6 + 1.3, 'stainless', 6);
    }
    kit.wall(C, 30.0, rFront, xJ(rFront), rFront, y6, c6, 0.2, 'boh', 6);
    // wings: wall behind the top row of the Middle Stand, service partitions
    const rw = R.l5BackW + 0.5;
    kit.wall(W, aJ(rw), rw, A_IN, rw, y6, c6, 0.2, 'boh', 6, [{ at: 6 - aJ(rw), w: 1.0, h: 2.1 }, { at: 26 - aJ(rw), w: 1.0, h: 2.1 }]);
    for (const a of [6, 26]) kit.box(W, a - 0.5, a + 0.5, rw - 0.03, rw + 0.03, y6, y6 + 2.1, 'door', 6);
    kit.wall(W, 31.0, rw, 31.0, R.wall - 0.5, y6, c6, 0.2, 'boh', 6, [{ at: 2.0, w: 1.0, h: 2.1 }]);
  }
}

// --- LEVEL 7 ---------------------------------------------------------------------------------------
const R7_FLAT = 112.2; // from here outward the LEVEL 7 ceiling is flat (lid + LEVEL 8 slab); inside it is the stand soffit
/** Radial wall of the LEVEL 7 block band: lower under the stand soffit, full height further out. */
function radial7(kit, f, p, q0, q1, t = 0.2, mat = 'mortarL7') {
  const low = standY(7, R.l7Gate + 0.18) - 0.9;
  if (q0 < R7_FLAT) kit.wall(f, p, q0, p, Math.min(q1, R7_FLAT), y7, low, t, mat, 7);
  if (q1 > R7_FLAT) kit.wall(f, p, Math.max(q0, R7_FLAT), p, q1, y7, c7, t, mat, 7);
}

function level7(kit) {
  const rg = R.l7Gate + 0.18; // wall at the back of the vomitory cuts
  const rB0 = R.l7Gate + 0.36; // block band
  const rf = R.shaft1 - 0.15; // concourse face of the block band
  const hg = standY(7, rg) - 0.9 - y7; // height under the stand soffit at the gate wall
  const hall = c7 - y7;
  const cs = CIRC.s357.centre;
  const wingCores = [...CIRC.s357.wing, CIRC.liftWing];

  for (const s of [1, -1]) {
    const W = frameW(s);
    const C = frameC(s);
    const ids = s < 0 ? ['701', '702', '703', '704', '705', '706'] : ['712', '711', '710', '709', '708', '707'];
    const wing = ids.slice(0, 3).map((id) => GATE_PLAN[id]);
    const [gJ, gO, gI] = ids.slice(3).map((id) => GATE_PLAN[id]);

    // --- wing blocks between the vomitories -------------------------------------------------
    const a0 = aJ(rg);
    kit.wall(W, a0, rg, 34.5, rg, y7, y7 + hg, 0.35, 'mortarL7', 7, wing.map((g) => ({ at: g.p - a0, w: 2.9, h: 2.4 })));
    const af = aJ(rf);
    const wcP = [wing[2].p + 1.7, wing[1].p - 1.7];
    const smP = [wing[0].p + 1.7, 31.8];
    kit.wall(W, af, rf, 32.0, rf, y7, c7, 0.3, 'mortarL7', 7, [
      ...wing.map((g) => ({ at: g.p - af, w: 2.4, h: 2.3 })),
      ...wingCores.map(([p0, p1]) => ({ at: (p0 + p1) / 2 - af, w: p1 - p0, h: hall })),
      { at: (wcP[0] + wcP[1]) / 2 - af, w: 1.5, h: 2.2 },
      { at: smP[0] + 1.2 - af, w: 0.95, h: 2.1 },
    ]);
    kit.box(W, smP[0] + 0.725, smP[0] + 1.675, rf - 0.03, rf + 0.03, y7, y7 + 2.1, 'door', 7);
    signF(kit, W, 7, smP[0] + 2.4, rf + 0.15, y7 + 1.6, 0, 1, 0.6, 0.6, { kind: 'picto', icon: 'smoking' });
    radial7(kit, W, 32.0, rB0, rf);
    // flat lid over the block band and its lobbies, up to the LEVEL 8 slab
    kit.prism(W, [[aJ(R7_FLAT), R7_FLAT], [A_IN, R7_FLAT], [A_IN, R.shaft1 + 0.2], [aJ(R.shaft1 + 0.2), R.shaft1 + 0.2]], c7, c7 + 0.12, 'soffit', 7);
    kit.prism(C, [[0, R7_FLAT], [xJ(R7_FLAT), R7_FLAT], [xJ(R.shaft1 + 0.2), R.shaft1 + 0.2], [0, R.shaft1 + 0.2]], c7, c7 + 0.12, 'soffit', 7);
    wcEntrance(kit, W, 7, { p: (wcP[0] + wcP[1]) / 2, q: rf, into: -1, y: y7, t: 0.3, icon: 'women', caption: '8' });
    kit.box(W, wcP[0] + 0.1, wcP[1] - 0.1, rB0 + 0.2, rB0 + 0.24, y7, y7 + 2.4, 'wcWall', 7);
    cubicles(kit, W, 7, { from: wcP[0] + 0.2, to: wcP[0] + 7.56, at: rB0 + 0.24, face: 1, y: y7, n: 8 });
    wing.forEach((g, i) => {
      for (const e of [-1.5, 1.5]) radial7(kit, W, g.p + e, rB0, rf - 0.15);
      gateDoor(kit, W, 7, { p: g.p, q: rf, axis: 'p', face: 1, y: y7, id: g.id, t: 0.3, board: i === 2 ? -1 : 1, wallH: hall });
    });
    // wall along the junction (wing side of the 704 / 709 lobby)
    kit.wall(C, xJ(rB0), rB0, xJ(rf), rf, y7, c7, 0.2, 'mortarL7', 7);

    // --- centre blocks ---------------------------------------------------------------------------
    const xj0 = xJ(rg);
    const pJ0 = (cs[1] + 0.2 + xj0) / 2; // junction vomitory, stand end
    const pJ1 = (cs[1] + 0.2 + xJ(rf)) / 2; // … concourse end
    kit.wall(C, 0, rg, xj0, rg, y7, y7 + hg, 0.35, 'mortarL7', 7, [{ at: gI.p, w: 2.9, h: 2.4 }, { at: gO.p, w: 2.9, h: 2.4 }, { at: pJ0, w: Math.min(2.6, xj0 - cs[1] - 0.5), h: 2.4 }]);
    const menP = [gI.p + 1.7, gO.p - 1.7];
    kit.wall(C, 0, rf, xJ(rf), rf, y7, c7, 0.3, 'mortarL7', 7, [
      { at: 2.125, w: 4.25, h: 2.4 },
      { at: gI.p, w: 2.4, h: 2.3 },
      { at: gO.p, w: 2.4, h: 2.3 },
      { at: (menP[0] + menP[1]) / 2, w: 1.5, h: 2.2 },
      { at: (cs[0] + cs[1]) / 2, w: cs[1] - cs[0], h: hall },
      { at: pJ1, w: 2.4, h: 2.3 },
    ]);
    for (const g of [gI, gO]) {
      for (const e of [-1.5, 1.5]) radial7(kit, C, g.p + e, rB0, rf - 0.15);
      gateDoor(kit, C, 7, { p: g.p, q: rf, axis: 'p', face: 1, y: y7, id: g.id, t: 0.3, board: g === gI ? 1 : 1, wallH: hall });
    }
    gateDoor(kit, C, 7, { p: pJ1, q: rf, axis: 'p', face: 1, y: y7, id: gJ.id, t: 0.3, board: 0, wallH: hall });
    signF(kit, C, 7, gO.p + 4.3, rf + 0.15, y7 + 1.75, 0, 1, 1.05, 2.4, { kind: 'level', level: 7, here: true, lines: [s < 0 ? '<- 701-706' : '707-712 ->'] });
    wcEntrance(kit, C, 7, { p: (menP[0] + menP[1]) / 2, q: rf, into: -1, y: y7, t: 0.3, icon: 'men', caption: '4' });
    kit.box(C, menP[0] + 0.1, menP[1] - 0.1, rB0 + 0.2, rB0 + 0.24, y7, y7 + 2.4, 'wcWall', 7);
    cubicles(kit, C, 7, { from: menP[0] + 0.2, to: menP[0] + 3.9, at: rB0 + 0.24, face: 1, y: y7, n: 4 });
    vanity(kit, C, 7, { axis: 'q', from: rB0 + 2.0, to: rf - 3.2, at: menP[1] - 0.12, face: -1, y: y7 });
    radial7(kit, C, cs[0] - 0.2, rB0, rf - 0.15);

    for (const a of [9.2, 30.6]) hydrant(kit, W, 7, a, rf + 0.15, 0, 1, y7);
    // --- standing counter along the leaning facade (wings) -------------------------------------
    const rc = wallIn(y7) - 0.5;
    kit.box(W, -9, 30, rc - 0.36, rc, y7 + 1.02, y7 + 1.06, 'steelBlack', 7);
    for (let a = -8.6; a <= 30; a += 2.4) kit.box(W, a - 0.02, a + 0.02, rc - 0.2, rc - 0.16, y7, y7 + 1.02, 'steelBlack', 7);
    // far end: blue end wall with the kiosk 7A / 7C
    kit.box(W, A_IN - 0.06, A_IN, 110.4, wallIn(y7), y7, c7, 'blue', 7);
    kioskShell(kit, W, 7, { id: s < 0 ? '7A' : '7C', p: A_IN - 2.75, q: 116.4, axis: 'q', into: 1, y: y7, w: 7.6, top: y7 + 3.3 });

    // --- forward side corridor in the flank zone: toilets (19 / 6), lockers 7A / 7B --------------
    const rEnd = 49.5; // the public corridor stops short of the recessed opening of the flank facade
    const ceil = y7 + 2.9;
    kit.box(W, A_ZONE, A_IN, rEnd, R.l7Gate, ceil, ceil + 0.1, 'bulkhead', 7);
    kit.wall(W, A_ZONE + 0.05, rEnd, A_ZONE + 0.05, R.l7Gate, y7, ceil, 0.1, 'mortarL7', 7);
    kit.wall(W, A_ZONE, rEnd, A_IN, rEnd, y7, ceil, 0.2, 'mortarL7', 7);
    const aP = 34.4;
    kit.wall(W, aP, 52, aP, 76, y7, ceil, 0.15, 'mortarL7', 7, [{ at: 3.0, w: 0.95, h: 2.1 }, { at: 13.0, w: 1.4, h: 2.2 }]);
    kit.box(W, aP - 0.03, aP + 0.03, 54.525, 55.475, y7, y7 + 2.1, 'door', 7);
    for (const r of [52, 58.2, 76]) kit.wall(W, A_ZONE + 0.1, r, aP, r, y7, ceil, 0.15, 'mortarL7', 7);
    kit.box(W, A_ZONE + 0.1, A_ZONE + 0.16, 58.3, 75.9, y7, ceil, 'wcWall', 7);
    kit.box(W, A_ZONE + 0.9, A_ZONE + 0.98, 62.5, 67.5, y7, y7 + 2.2, 'wcWall', 7); // privacy screen behind the women's entrance
    signF(kit, W, 7, aP + 0.08, 63.8, y7 + 1.65, 1, 0, 0.62, 0.86, { kind: 'picto', icon: 'women', caption: '19' });
    cubicles(kit, W, 7, { axis: 'q', from: 58.5, to: 62.2, at: A_ZONE + 0.16, face: 1, y: y7, depth: 1.3, n: 4 });
    cubicles(kit, W, 7, { axis: 'q', from: 67.8, to: 75.8, at: A_ZONE + 0.16, face: 1, y: y7, depth: 1.3 });
    cubicles(kit, W, 7, { axis: 'q', from: 52.3, to: 58.0, at: A_ZONE + 0.16, face: 1, y: y7, depth: 1.3, n: 6 });
    signF(kit, W, 7, aP + 0.08, 56.3, y7 + 1.65, 1, 0, 0.62, 0.86, { kind: 'picto', icon: 'men', caption: '6' });
    kit.box(W, (A_ZONE + A_IN) / 2 - 0.5, (A_ZONE + A_IN) / 2 + 0.5, rEnd + 0.1, rEnd + 0.16, y7, y7 + 2.1, 'door', 7); // staff door to the service zone and lift
    lockers(kit, W, 7, { axis: 'q', from: 78.5, to: 96.5, at: A_ZONE + 0.12, face: 1, y: y7 });
    kit.box(W, A_ZONE + 0.1, A_ZONE + 0.13, 78.2, 96.8, y7 + 1.86, ceil, 'lockerWall', 7);
    signF(kit, W, 7, A_ZONE + 0.14, 87.5, y7 + 2.3, 1, 0, 0.9, 0.55, { kind: 'picto', icon: 'locker', caption: s < 0 ? '7A' : '7B' });
  }
  // kiosk 7B on the axis, facing Arena Bar 7
  kioskShell(kit, frameC(1), 7, { id: '7B', p: 0, q: rf - 0.15, into: -1, y: y7, w: 8.5, depth: 2.4, top: y7 + 3.3 });
}

// --- stand soffits ------------------------------------------------------------------------------------
/** Dark soffit lining hung 0.9 m (drop) under the treads of a stand, between two apothems. */
function standSoffit(kit, tier, r0, r1, drop, level, aEnd = A_HALL) {
  const yC = (x, z) => standY(tier, z + RC0) - drop;
  kit.prismW([[-xJ(r0), r0 - RC0], [xJ(r0), r0 - RC0], [xJ(r1), r1 - RC0], [-xJ(r1), r1 - RC0]], (x, z) => yC(x, z) - 0.1, yC, 'soffit', level);
  for (const s of [1, -1]) {
    const W = frameW(s);
    const yW = (x, z) => standY(tier, s * x * SIN + z * COS + RW0) - drop;
    kit.prism(W, [[aJ(r0), r0], [aEnd, r0], [aEnd, r1], [aJ(r1), r1]], (x, z) => yW(x, z) - 0.1, yW, 'soffit', level);
  }
}

function plantLevels(kit) {
  for (const s of [1, -1]) {
    const W = frameW(s);
    const C = frameC(s);
    // LEVEL 8 / 9: walls toward the underside of the Upper Stand, air-handling units
    const r8 = R.shaft1 + 0.3;
    kit.wall(W, aJ(r8), r8, A_IN, r8, Y[8], standY(7, r8) - 1.0, 0.2, 'boh', 8);
    kit.wall(C, 0, r8, xJ(r8), r8, Y[8], standY(7, r8) - 1.0, 0.2, 'boh', 8);
    kit.wall(W, aJ(120.6), 120.6, A_IN, 120.6, Y[9], standY(7, 120.6) - 1.0, 0.2, 'boh', 9);
    kit.wall(C, 0, 120.6, xJ(120.6), 120.6, Y[9], standY(7, 120.6) - 1.0, 0.2, 'boh', 9);
    for (const a of [-6, 6, 18]) {
      kit.box(W, a - 2.2, a + 2.2, 118.6, 121.2, Y[8] + 0.15, Y[8] + 2.0, 'plant', 8);
      kit.box(W, a - 2.4, a + 2.4, 118.4, 121.4, Y[8], Y[8] + 0.15, 'concreteCore', 8);
      kit.tube(W, [a, 119.9, Y[8] + 2.0], [a, 119.9, Y[8] + 2.5], 0.35, 'duct', 8, 12);
    }
    for (const x of [8.5, 17]) {
      kit.box(C, x - 2.2, x + 2.2, 119.0, 121.4, Y[8] + 0.15, Y[8] + 2.0, 'plant', 8);
      kit.box(C, x - 2.4, x + 2.4, 118.8, 121.6, Y[8], Y[8] + 0.15, 'concreteCore', 8);
    }
    for (const a of [0, 20]) kit.box(W, a - 1.5, a + 1.5, 121.4, 123.6, Y[9] + 0.1, Y[9] + 1.6, 'plant', 9);
  }
}

export default function buildUpper(kit) {
  level5(kit);
  level6(kit);
  level7(kit);
  plantLevels(kit);
  // soffit linings under the stands, where a concourse looks up at a stand
  standSoffit(kit, 7, R.l7Gate, R7_FLAT + 0.1, 0.9, 7);
  standSoffit(kit, 7, R.shaft1 + 0.2, 120.5, 0.9, 8);
  standSoffit(kit, 7, 120.5, 124.7, 0.9, 9);
}

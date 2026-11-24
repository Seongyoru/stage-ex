// LEVEL 1 (arena concourse under the Lower Stand), LEVEL 2 (back of house), LEVEL 3 (main
// foyer and wing concourses) and LEVEL 4 (mezzanine): walls, rooms, gates and graphics.
// Stairs, escalators and lift cores are in circulation.js.
import { frameC, frameW, xJ, aJ, RC0 } from './kit.js';
import { R, Y, A_IN, A_ZONE, GATE_PLAN, CIRC, ROW_C, ROW_D } from './plan.js';
import { gateDoor, gateBoard, room, wcEntrance, kioskShell, lockers, cubicles, vanity, hydrant } from './fittings.js';
import { sign, signF } from './signs.js';

const yF1 = 0.02;
const c1 = Y[2] - 0.35; // underside of the LEVEL 2 slab
const y3 = Y[3];
const c3low = Y[4] - 0.3; // underside of the mezzanine
const c3 = Y[5] - 0.35; // underside of the LEVEL 5 slab
const y4 = Y[4];
const c4 = 12.2; // flat services lid over the mezzanine (the Middle Stand vomitories pass above it)

// --- LEVEL 1 ------------------------------------------------------------------------------------
function level1(kit) {
  const rIn = R.arenaWall + 0.35; // back of the arena rear wall (the wall itself belongs to arena/bowl)
  const rBlock = 86.5; // front of the toilet / store blocks = inner edge of the corridor
  const rOut = 93.4; // outer side of the corridor = edge of the LEVEL 2 slab above
  const rBack = 100.35;
  const hBlock = 2.7;

  for (const s of [1, -1]) {
    const W = frameW(s);
    const C = frameC(s);
    const idFar = s < 0 ? '101' : '104';
    const idNear = s < 0 ? '102' : '103';
    // Gate 101 / 104: in the pocket beside the outer telescopic unit (the official marker sits on
    // that unit's front corner). Gate 102 / 103: arena/bowl opens two 3.6 m portals in the front
    // wall of the fixed stand, either side of a 0.9 m corner pier on the junction line; one red
    // door set stands behind each half.
    const aFar = 26.5;
    const aNear = aJ(R.arenaWall) + 0.45 + 1.8;
    const xNear = xJ(R.arenaWall) - 0.45 - 1.8;

    // inner blocks on the diagonal: toilets between the gates, stores beyond
    const a0 = aJ(rBlock);
    const openings = [
      { at: aNear - a0, w: 2.4, h: 2.3 },
      { at: aFar - a0, w: 3.0, h: 2.5 },
      { at: 7.0 - a0, w: 1.5, h: 2.2 },
      { at: 15.0 - a0, w: 1.5, h: 2.2 },
      { at: 19.6 - a0, w: 1.0, h: 2.1 },
    ];
    kit.wall(W, a0, rBlock - 0.1, A_IN, rBlock - 0.1, yF1, hBlock, 0.2, 'mortar', 1, openings);
    kit.box(W, 19.1, 20.1, rBlock - 0.13, rBlock - 0.07, yF1, yF1 + 2.1, 'door', 1); // accessible toilet door
    signF(kit, W, 1, 18.5, rBlock, 1.7, 0, 1, 0.5, 0.5, { kind: 'picto', icon: 'accessible' });
    wcEntrance(kit, W, 1, { p: 7.0, q: rBlock - 0.1, into: -1, y: yF1, icon: 'women', caption: '19' });
    wcEntrance(kit, W, 1, { p: 15.0, q: rBlock - 0.1, into: -1, y: yF1, icon: 'men', caption: '4' });
    kit.prism(W, [[aJ(rIn), rIn], [A_IN, rIn], [A_IN, rBlock], [a0, rBlock]], hBlock, hBlock + 0.12, 'bulkhead', 1);
    kit.wall(W, aNear + 2.35, rIn, aNear + 2.35, rBlock - 0.2, yF1, hBlock, 0.15, 'wcWall', 1);
    kit.wall(W, aFar - 1.75, rIn, aFar - 1.75, rBlock - 0.2, yF1, hBlock, 0.15, 'wcWall', 1);
    kit.wall(W, 11.5, rIn, 11.5, rBlock - 0.2, yF1, hBlock, 0.12, 'wcWall', 1); // women | men
    kit.box(W, aNear + 2.45, aFar - 1.85, rIn, rIn + 0.03, yF1, hBlock, 'wcWall', 1); // wallpapered back wall
    cubicles(kit, W, 1, { from: aNear + 2.6, to: 11.3, at: rIn + 0.03, face: 1, y: yF1 });
    cubicles(kit, W, 1, { from: 11.7, to: 15.4, at: rIn + 0.03, face: 1, y: yF1, n: 4 });
    vanity(kit, W, 1, { from: aNear + 2.8, to: 4.6, at: rBlock - 0.21, face: -1, y: yF1 });
    vanity(kit, W, 1, { from: 20.6, to: aFar - 2.1, at: rBlock - 0.21, face: -1, y: yF1 });

    // gate 102 / 103, wing half: passage from the portal straight to the door in the block front
    for (const e of [-2.15, 2.15]) kit.wall(W, aNear + e, rIn, aNear + e, rBlock - 0.2, yF1, hBlock, 0.2, 'red', 1);
    gateDoor(kit, W, 1, { p: aNear, q: rBlock - 0.1, axis: 'p', face: 1, y: yF1, id: idNear, t: 0.2, board: 1, wallH: hBlock });
    // gate 101 / 104: red tunnel through the block, door set just behind the arena wall
    for (const e of [-1.6, 1.6]) kit.wall(W, aFar + e, rIn, aFar + e, rBlock - 0.2, yF1, hBlock, 0.2, 'red', 1);
    kit.wall(W, aFar - 1.5, rIn + 0.35, aFar + 1.5, rIn + 0.35, yF1, hBlock, 0.3, 'red', 1, [{ at: 1.5, w: 2.4, h: 2.3 }]);
    gateDoor(kit, W, 1, { p: aFar, q: rIn + 0.35, axis: 'p', face: 1, y: yF1, id: idFar, t: 0.3, board: 0 });
    gateBoard(kit, W, 1, { p: aFar - 2.75, q: rBlock, dp: 0, dq: 1, y: yF1, id: idFar, wallH: hBlock });
    kit.box(W, aFar - 1.5, aFar + 1.5, rBlock - 0.4, rBlock + 0.02, 2.5, hBlock, 'red', 1); // red lintel band over the tunnel mouth
    // locker bank 1G: house-right only, on the block wall beyond gate 104
    if (s > 0) {
      lockers(kit, W, 1, { from: 28.7, to: 34.2, at: rBlock + 0.02, face: 1, y: yF1 });
      signF(kit, W, 1, 31.4, rBlock, 2.3, 0, 1, 0.9, 0.55, { kind: 'picto', icon: 'locker', caption: '1G' });
    }

    // outer band under the LEVEL 2 slab: locker alcoves, kiosk, stores
    const a1 = aJ(rOut);
    const alc = [
      [-9.4, -1.6, s < 0 ? '1B' : '1E'],
      [23.0, 30.4, s < 0 ? '1A' : '1F'],
    ];
    const ops = [...alc.map(([p0, p1]) => ({ at: (p0 + p1) / 2 - a1, w: p1 - p0, h: 2.5 })), { at: 5.3 - a1, w: 8.5, h: 2.4 }];
    kit.wall(W, a1, rOut, A_IN, rOut, yF1, c1, 0.2, 'mortar', 1, ops);
    kit.wall(W, aJ(rBack), rBack, A_IN, rBack, yF1, c1, 0.3, 'boh', 1);
    kit.wall(W, a1, rOut, A_IN, rOut, c1, Y[3] - 0.35, 0.2, 'mortar', 2); // LEVEL 2 wall above, up to the foyer slab
    kioskShell(kit, W, 1, { id: s < 0 ? '1A' : '1B', p: 5.3, q: rOut + 0.1, into: 1, y: yF1, top: c1 });
    for (const a of [11.8, 20.6]) hydrant(kit, W, 1, a, rOut - 0.1, 0, -1, yF1);
    for (const [p0, p1, name] of alc) lockerAlcove(kit, W, 1, p0, p1, rOut + 0.1, 2.2, yF1, c1, name);

    // centre: closed block behind the arena rear wall (telescopic stand store), corridor, stairs
    kit.wall(C, 0, rBlock - 0.1, xJ(rBlock), rBlock - 0.1, yF1, hBlock, 0.2, 'mortar', 1, [{ at: 9.0, w: 1.9, h: 2.2 }, { at: xNear, w: 2.4, h: 2.3 }]);
    // gate 102 / 103, centre half
    for (const e of [-2.15, 2.15]) kit.wall(C, xNear + e, rIn, xNear + e, rBlock - 0.2, yF1, hBlock, 0.2, 'red', 1);
    gateDoor(kit, C, 1, { p: xNear, q: rBlock - 0.1, axis: 'p', face: 1, y: yF1, id: idNear, t: 0.2, board: -1, wallH: hBlock });
    kit.box(C, 8.05, 9.95, rBlock - 0.13, rBlock - 0.07, yF1, yF1 + 2.2, 'door', 1);
    kit.prism(C, [[0, rIn], [xJ(rIn), rIn], [xJ(rBlock), rBlock], [0, rBlock]], hBlock, hBlock + 0.12, 'bulkhead', 1);
    // outer band, centre: stair mouths (walls by circulation.js), locker alcove between them, service door on the axis
    const st = CIRC.s13;
    const xa = [st.xs[0] + st.width / 2 + 0.55, st.xs[1] - st.width / 2 - 0.55];
    const opsC = [
      { at: 1.0, w: 2.0, h: 2.2 },
      ...st.xs.map((x) => ({ at: x, w: st.width + 0.24, h: c1 - yF1 })),
      { at: (xa[0] + xa[1]) / 2, w: xa[1] - xa[0], h: 2.5 },
    ];
    kit.wall(C, 0, rOut, xJ(rOut), rOut, yF1, c1, 0.2, 'mortar', 1, opsC);
    kit.box(C, 0, 2.0, rOut - 0.03, rOut + 0.03, yF1, yF1 + 2.2, 'door', 1);
    kit.wall(C, 0, rOut, xJ(rOut), rOut, c1, Y[3] - 0.35, 0.2, 'mortar', 2);
    kit.wall(C, 0, rBack, xJ(rBack), rBack, yF1, c1, 0.3, 'boh', 1, st.xs.map((x) => ({ at: x, w: st.width + 0.24, h: c1 - yF1 })));
    lockerAlcove(kit, C, 1, xa[0], xa[1], rOut + 0.1, 2.2, yF1, c1, s < 0 ? '1C' : '1D');
    for (const x of st.xs) signF(kit, C, 1, x, rOut - 0.1, 2.95, 0, -1, 1.5, 0.5, { kind: 'text', lines: ['LEVEL 3'] });
    for (const x of st.xs) signF(kit, C, 1, x + st.width / 2 + 0.75, rOut - 0.1, 1.7, 0, -1, 0.62, 0.86, { kind: 'picto', icon: 'stairs', caption: 'LEVEL\n1·3' });
  }
  // aubergine map wall and level sign on the centre block, facing the corridor
  const C = frameC(1);
  kit.box(C, -2.4, 2.4, rBlock, rBlock + 0.03, yF1 + 0.15, hBlock, 'aubergine', 1);
  sign(kit, 1, [0, 1.5, rBlock + 0.03 - RC0], [0, 1], 3.3, 2.1, { kind: 'directory' }, 0.006);
  for (const sx of [-1, 1]) sign(kit, 1, [sx * 5.2, 1.55, rBlock - RC0], [0, 1], 0.95, 2.2, { kind: 'level', level: 1, here: true, lines: ['<- 101-102', '103-104 ->'] });
}

/** Open locker alcove: back and side banks, magenta-aubergine lining above the lockers. */
function lockerAlcove(kit, f, level, p0, p1, q0, depth, y, yCeil, name) {
  const q1 = q0 + depth;
  kit.wall(f, p0, q1 + 0.08, p1, q1 + 0.08, y, yCeil, 0.16, 'lockerWall', level);
  kit.wall(f, p0 - 0.08, q0, p0 - 0.08, q1 + 0.16, y, yCeil, 0.16, 'lockerWall', level);
  kit.wall(f, p1 + 0.08, q0, p1 + 0.08, q1 + 0.16, y, yCeil, 0.16, 'lockerWall', level);
  lockers(kit, f, level, { from: p0 + 0.5, to: p1 - 0.5, at: q1, face: -1, y });
  lockers(kit, f, level, { axis: 'q', from: q0 + 0.1, to: q1 - 0.05, at: p0, face: 1, y });
  lockers(kit, f, level, { axis: 'q', from: q0 + 0.1, to: q1 - 0.05, at: p1, face: -1, y });
  signF(kit, f, level, (p0 + p1) / 2, q1, Math.min(y + 2.45, yCeil - 0.35), 0, -1, 0.9, 0.55, { kind: 'picto', icon: 'locker', caption: name });
}

// --- LEVEL 3 --------------------------------------------------------------------------------------
function level3(kit) {
  const g = CIRC.grand;
  const rg = R.l3Gate + 0.2; // centre line of the hall rear wall
  const rFace = R.l3Gate + 0.4; // its foyer-side face
  const rIn = R.l4Edge; // front wall of the inner band (under the mezzanine edge)
  const rs0 = R.shaft0;
  const rw = R.wall - 0.4;

  for (const s of [1, -1]) {
    const W = frameW(s);
    const C = frameC(s);
    const gC = GATE_PLAN[s < 0 ? '302' : '303'];
    const gW = GATE_PLAN[s < 0 ? '301' : '304'];

    // hall rear wall with the gates 301-304 (LEVEL 3 storey and the mezzanine storey above)
    kit.wall(C, 0, rg, xJ(rg), rg, y3, y4, 0.4, 'mortarL3', 3, [{ at: gC.p, w: 2.4, h: 2.3 }]);
    // mezzanine storey: up to the raking soffit of the Middle Stand; lower where the vomitory floors (arena/bowl) pass over it
    const vomC = (s < 0 ? ['506', '505', '504'] : ['507', '508', '509']).map((id) => ({ at: Math.min(GATE_PLAN[id].p, xJ(rg) - 1.5), w: 3.1, h: 1.0, sill: 12.42 - y4 }));
    kit.wall(C, 0, rg, xJ(rg), rg, y4, 12.95, 0.4, 'mortar', 4, vomC);
    kit.wall(W, aJ(rg), rg, A_ZONE, rg, y3, y4, 0.4, 'mortarL3', 3, [{ at: gW.p - aJ(rg), w: 2.4, h: 2.3 }]);
    const vomW = (s < 0 ? ['501', '502', '503'] : ['512', '511', '510']).map((id) => ({ at: GATE_PLAN[id].p - aJ(rg), w: 3.1, h: 1.0, sill: 12.42 - y4 }));
    kit.wall(W, aJ(rg), rg, A_ZONE, rg, y4, 12.95, 0.4, 'mortar', 4, vomW);
    gateDoor(kit, C, 3, { p: gC.p, q: rg, axis: 'p', face: 1, y: y3, id: gC.id, board: 1, wallH: c3low - y3 });
    gateDoor(kit, W, 3, { p: gW.p, q: rg, axis: 'p', face: 1, y: y3, id: gW.id, board: 1, wallH: c3low - y3 });

    // --- centre: stair zone -----------------------------------------------------------------
    // red balustrade walls of the grand stair / of the 4-5 flights above the outer lanes
    const s45 = CIRC.s45;
    const r45 = s45.r0 + 15 * s45.going;
    const stairTop = (x, z) => y3 + ((g.rFoot - (z + RC0)) / g.going) * g.rise + 1.05;
    const flightTop = (x, z) => y4 + ((z + RC0 - s45.r0) / s45.going) * s45.rise + 1.05;
    // red balustrade wall between the stair and the outer-lane void (stair down to LEVEL 1)
    kit.prism(C, [[g.inner[1], g.rTop], [g.outer[0], g.rTop], [g.outer[0], g.rFoot], [g.inner[1], g.rFoot]], y3, stairTop, 'red', 3);
    // red walls closing the volume under the landing: across the outer lane, and toward bay D
    kit.box(C, g.outer[0], g.outer[1] + 0.3, g.rTop - 0.25, g.rTop, y3, y4 - 0.3, 'red', 3);
    kit.box(C, g.outer[1], g.outer[1] + 0.3, rFace, g.rTop - 0.25, y3, y4 - 0.3, 'red', 3);
    // red steel diagonal braces on the column lines between the stair-foot and upper columns
    kit.beam(C, [12.81, ROW_C - 0.7, y3 + 0.1], [12.81, ROW_D + 0.7, c3 - 0.3], 0.3, 0.3, 'redSteel', 3);
    kit.beam(C, [21.36, ROW_C - 0.7, y3 + 0.1], [21.36, ROW_D + 0.7, c3 - 0.3], 0.3, 0.3, 'redSteel', 3);
    void r45;
    void flightTop;
    // tactile strip at the foot of the stair
    kit.box(C, 0, g.inner[1], g.rFoot + 0.35, g.rFoot + 0.65, y3 + 0.001, y3 + 0.006, 'tactile', 3);
    // handrails on the red walls and between the columns of the centre flight
    kit.beam(C, [g.inner[1] - 0.08, g.rFoot, y3 + 0.95], [g.inner[1] - 0.08, g.rTop, y4 + 0.95], 0.05, 0.05, 'steelBlack', 3);
    kit.beam(C, [4.27, ROW_C - 0.65, y3 + 1.0 + ((g.rFoot - ROW_C + 0.65) / g.going) * g.rise], [4.27, ROW_D + 0.65, y3 + 1.0 + ((g.rFoot - ROW_D - 0.65) / g.going) * g.rise], 0.05, 0.05, 'steelBlack', 3);

    // bay D: passage to gate 302 / 303 beside the stair void; red wall toward bay E
    const xE = 21.66;
    kit.wall(C, xE, rFace, xE, rIn + 0.15, y3, c3low, 0.3, 'red', 3);
    signF(kit, C, 3, xE - 0.15, 103.2, y3 + 1.45, -1, 0, 0.95, 2.1, { kind: 'level', level: 3, here: true, lines: [s < 0 ? '<- 301-302' : '303-304 ->'] });
    // guard rails round the two stair openings (LEVEL 1-3 stairs)
    const st = CIRC.s13;
    const zo = st.open3[0] + RC0;
    for (const x of st.xs) {
      const x0 = x - st.width / 2 - 0.12;
      const x1 = x + st.width / 2 + 0.12;
      kit.rail(C, [[x0, st.rTop, y3], [x0, zo, y3], [x1, zo, y3], [x1, st.rTop, y3]], 3);
    }
    // bay E: inner band under the mezzanine, with the mouth of the 3-4 stair
    const s34 = CIRC.s34;
    kit.wall(C, xE + 0.15, rIn, xJ(rIn), rIn, y3, c3low, 0.3, 'mortarL3', 3, [{ at: s34.x - xE - 0.15, w: s34.width + 0.1, h: 2.45 }]);
    for (const e of [-1, 1]) kit.wall(C, s34.x + e * (s34.width / 2 + 0.15), rIn - 16 * s34.going - 0.3, s34.x + e * (s34.width / 2 + 0.15), rIn - 0.15, y3, c3low, 0.2, 'red', 3);
    kit.wall(C, s34.x - s34.width / 2 - 0.25, rIn - 16 * s34.going - 0.4, s34.x + s34.width / 2 + 0.25, rIn - 16 * s34.going - 0.4, y3, c3low, 0.2, 'red', 3);
    signF(kit, C, 3, s34.x + s34.width / 2 + 0.85, rIn + 0.15, y3 + 1.65, 0, 1, 0.62, 0.86, { kind: 'picto', icon: 'stairs', caption: 'LEVEL\n3·4·5' });
    signF(kit, C, 3, s34.x - s34.width / 2 - 1.3, rIn + 0.15, y3 + 1.35, 0, 1, 0.9, 2.0, { kind: 'way', level: 4, name: 'LOCKER WC', dir: Math.PI * 0.75 });

    // escalator portal: red wall with an arched cut-out between the stair-foot column and the rear wall
    archWall(kit, C, 3, { p: 21.75, q0: 110.0, q1: rs0, y0: y3, y1: c3, open: [CIRC.esc.r0 + 0.2, CIRC.esc.r1 - 0.2], spring: 2.3, t: 0.25 });
    signF(kit, C, 3, 21.62, 111.1, y3 + 4.4, -1, 0, 0.62, 0.62, { kind: 'picto', icon: 'escalator' });
    signF(kit, C, 3, 21.62, 112.35, y3 + 4.4, -1, 0, 1.7, 0.62, { kind: 'text', lines: ['LEVEL 5', 'MIDDLE STAND'] });
    // store between the centre stair core and the junction
    kit.wall(C, CIRC.s357.centre[1], rs0 + 0.1, xJ(rs0), rs0 + 0.1, y3, c3, 0.2, 'mortarL3', 3);

    // --- wing: inner band under the mezzanine ---------------------------------------------------
    const aw0 = aJ(rIn);
    const lobby = [gW.p - 2.56, gW.p + 4.24];
    const opsW = [
      { at: -7.5 - aw0, w: 8.5, h: 2.1 },
      { at: (lobby[0] + lobby[1]) / 2 - aw0, w: lobby[1] - lobby[0], h: 2.45 },
      { at: 15.0 - aw0, w: 1.5, h: 2.2 },
      { at: 22.5 - aw0, w: 1.5, h: 2.2 },
      { at: 26.3 - aw0, w: 1.0, h: 2.1 },
    ];
    kit.wall(W, aw0, rIn, A_IN, rIn, y3, c3low, 0.3, 'mortarL3', 3, opsW);
    kit.box(W, 25.8, 26.8, rIn - 0.03, rIn + 0.03, y3, y3 + 2.1, 'door', 3);
    signF(kit, W, 3, 25.3, rIn + 0.15, y3 + 1.65, 0, 1, 0.5, 0.5, { kind: 'picto', icon: 'accessible' });
    kioskShell(kit, W, 3, { id: s < 0 ? '3A' : '3B', p: -7.5, q: rIn - 0.15, into: -1, y: y3, h: 2.1, top: c3low });
    for (const a of lobby) kit.wall(W, a, rFace, a, rIn - 0.15, y3, c3low, 0.2, 'red', 3);
    signF(kit, W, 3, lobby[0] + 0.1, 102.2, y3 + 1.3, 1, 0, 0.95, 2.1, { kind: 'level', level: 3, here: true, lines: [s < 0 ? '301-302' : '303-304'] });
    wcEntrance(kit, W, 3, { p: 15.0, q: rIn, into: -1, y: y3, t: 0.3, icon: 'women', caption: '18' });
    for (const a of [-1.6, 30.0]) hydrant(kit, W, 3, a, rIn + 0.15, 0, 1, y3);
    wcEntrance(kit, W, 3, { p: 22.5, q: rIn, into: -1, y: y3, t: 0.3, icon: 'men', caption: '6' });
    kit.wall(W, 28.0, rFace, 28.0, rIn - 0.15, y3, c3low, 0.15, 'wcWall', 3);
    kit.wall(W, 19.3, rFace, 19.3, rIn - 0.15, y3, c3low, 0.12, 'wcWall', 3); // women | men
    kit.box(W, lobby[1] + 0.3, 27.9, rFace, rFace + 0.03, y3, c3low, 'wcWall', 3);
    cubicles(kit, W, 3, { from: lobby[1] + 0.4, to: 19.1, at: rFace + 0.03, face: 1, y: y3 });
    cubicles(kit, W, 3, { axis: 'q', from: rFace + 1.7, to: rIn - 4.4, at: lobby[1] + 0.3, face: 1, y: y3 });
    cubicles(kit, W, 3, { from: 19.5, to: 25.1, at: rFace + 0.03, face: 1, y: y3, n: 6 });
    vanity(kit, W, 3, { axis: 'q', from: rFace + 1.8, to: rIn - 3.4, at: 19.2, face: -1, y: y3 });
    vanity(kit, W, 3, { axis: 'q', from: rFace + 1.8, to: rIn - 3.4, at: 27.9, face: -1, y: y3 });
    kit.wall(W, lobby[1] + 0.2, rFace, lobby[1] + 0.2, rIn - 0.15, y3, c3low, 0.15, 'wcWall', 3);
    // services lid between the mezzanine wall and the LEVEL 5 slab (under the top rows of the Middle Stand wing)
    kit.prism(W, [[aJ(rIn + 0.15), rIn + 0.15], [A_IN, rIn + 0.15], [A_IN, R.l5BackW + 0.06], [aJ(R.l5BackW + 0.06), R.l5BackW + 0.06]], c4, c3, 'soffit', 3);

    // --- wing: outer band along the facade (stair cores and lifts by circulation.js) ---------------
    const rO = rs0 + 0.1;
    const near = CIRC.s357.wing[0];
    const far = CIRC.s357.wing[1];
    const lift = CIRC.liftWing;
    // entrance lobby of the North / South Entrance: the door screen of arena/exterior is 8.8 m wide,
    // centred 32.4 m from the shoulder (a = 4.41) and 3.0 m high
    const ent = [-0.25, 9.05];
    kit.wall(W, aJ(rO) + 0.1, rO, lift[0], rO, y3, c3, 0.2, 'mortarL3', 3);
    kit.wall(W, near[1], rO, ent[0], rO, y3, c3, 0.2, 'mortarL3', 3);
    kit.wall(W, ent[0] - 0.1, rs0, ent[0] - 0.1, rw, y3, c3, 0.2, 'mortarL3', 3);
    kit.wall(W, ent[1] + 0.1, rs0, ent[1] + 0.1, rw, y3, c3, 0.2, 'mortarL3', 3);
    kit.box(W, ent[0], ent[1], rs0, rw, y3 + 3.25, c3, 'bulkhead', 3); // lowered lobby ceiling
    kit.box(W, (ent[0] + ent[1]) / 2 - 0.35, (ent[0] + ent[1]) / 2 + 0.35, rs0 - 0.05, rs0, y3 + 3.3, y3 + 3.52, 'exitSign', 3);
    signF(kit, W, 3, (ent[0] + ent[1]) / 2, rs0 - 0.001, y3 + 3.95, 0, -1, 4.6, 0.5, { kind: 'text', lines: [s < 0 ? 'NORTH ENTRANCE' : 'SOUTH ENTRANCE'] });
    const dlE = [];
    for (let a = ent[0] + 1.1; a < ent[1]; a += 1.75) dlE.push([a, (rs0 + rw) / 2]);
    for (const [a, q] of dlE) kit.box(W, a - 0.07, a + 0.07, q - 0.07, q + 0.07, y3 + 3.235, y3 + 3.25, 'spot', 3);
    // aubergine directory wall between the entrance lobby and the far stair core
    kit.wall(W, ent[1] + 0.2, rO, far[0], rO, y3, c3, 0.2, 'aubergine', 3);
    signF(kit, W, 3, (ent[1] + 0.2 + far[0]) / 2, rO - 0.1, y3 + 1.55, 0, -1, 3.3, 2.1, { kind: 'directory' });
    // gate board of 301 / 304 at the mouth of the gate lobby, on the concourse face
    gateBoard(kit, W, 3, { p: lobby[1] + 1.25, q: rIn + 0.15, dp: 0, dq: 1, y: y3, id: gW.id, wallH: c3low - y3 });
    kit.wall(W, far[1], rO, 24.0, rO, y3, c3, 0.2, 'mortarL3', 3);
    // nursing room (house left = north end) / first-aid room (house right, beside the South Entrance: estimate)
    room(kit, W, 3, 24.0, 31.0, rs0, rw, y3, 2.8, 'mortarL3', { doors: [{ side: 'q0', at: 25.3 }], skip: ['q1'] });
    signF(kit, W, 3, 26.6, rs0, y3 + 1.65, 0, -1, 0.62, 0.86, s < 0 ? { kind: 'picto', icon: 'nursing', caption: 'NURSING\nROOM' } : { kind: 'picto', icon: 'firstaid', caption: 'FIRST\nAID' });
    kit.wall(W, 31.0, rO, A_IN, rO, y3, c3, 0.2, 'mortarL3', 3);
    kit.box(W, 24.0, 31.0, rs0, rw, y3 + 2.9, c3, 'mortarL3', 3);
  }

  // red mural wall at the head of the grand stair = the hall rear wall, mezzanine storey.
  // arena/venues hangs its relief logotype on this face (apothem 96.73, 7.6 x 1.9 m, centred
  // 1.08 m above LEVEL 4); the painted version below sits behind that board.
  const C = frameC(1);
  kit.box(C, -(g.outer[1] + 0.3), g.outer[1] + 0.3, rFace, rFace + 0.03, y4, c4, 'red', 4);
  sign(kit, 4, [0, y4 + 1.08, rFace + 0.03 - RC0], [0, 1], 7.6, 1.9, { kind: 'mural' }, 0.006);
  // dark nosing lines of the grand stair
  for (let i = 1; i < g.n; i++) kit.box(C, -g.inner[1], g.inner[1], g.rFoot - (i - 1) * g.going - 0.045, g.rFoot - (i - 1) * g.going - 0.005, y3 + i * g.rise, y3 + i * g.rise + 0.004, 'redNosing', 3);
}

/**
 * Wall along the frame's q axis at lateral position p with an arched opening
 * (straight jambs up to `spring`, semicircle above, approximated by 14 slices).
 */
function archWall(kit, f, level, { p, q0, q1, y0, y1, open, spring, t, mat = 'red' }) {
  kit.box(f, p - t / 2, p + t / 2, q0, open[0], y0, y1, mat, level);
  kit.box(f, p - t / 2, p + t / 2, open[1], q1, y0, y1, mat, level);
  const rad = (open[1] - open[0]) / 2;
  const mid = (open[0] + open[1]) / 2;
  const n = 32;
  for (let i = 0; i < n; i++) {
    const u0 = -rad + (2 * rad * i) / n;
    const u1 = -rad + (2 * rad * (i + 1)) / n;
    const um = Math.abs((u0 + u1) / 2);
    const top = y0 + spring + Math.sqrt(Math.max(0, rad * rad - um * um));
    kit.box(f, p - t / 2, p + t / 2, mid + u0, mid + u1, top, y1, mat, level);
  }
}

// --- LEVEL 4 ----------------------------------------------------------------------------------------
function level4(kit) {
  const g = CIRC.grand;
  const rFace = R.l3Gate + 0.4;
  const rEdge = R.l4Edge;
  const rRoom = 100.4;
  const aEnd = 31.2;
  const s45 = CIRC.s45;
  const s34 = CIRC.s34;
  const r45 = s45.r0 + 15 * s45.going;
  for (const s of [1, -1]) {
    const W = frameW(s);
    const C = frameC(s);

    // services lid (flat ceiling) of the mezzanine: centre strip behind the hall wall, and the arms
    kit.prism(C, [[0, rFace], [xJ(rFace), rFace], [xJ(R.l5BackC), R.l5BackC], [0, R.l5BackC]], c4, c3, 'soffit', 4);
    kit.prism(W, [[aJ(rFace), rFace], [A_IN, rFace], [A_IN, rEdge + 0.15], [aJ(rEdge + 0.15), rEdge + 0.15]], c4, c3, 'soffit', 4);

    // arm: outer wall toward the LEVEL 3 concourse, end wall, rooms along the outer side
    kit.wall(W, aJ(rEdge), rEdge, A_IN, rEdge, y4, c4, 0.3, 'mortar', 4);
    kit.wall(W, aEnd + 0.08, rFace, aEnd + 0.08, rEdge, y4, c4, 0.16, 'mortar', 4);
    const aSm = [aJ(rRoom) + 0.6, -2.0];
    room(kit, W, 4, aSm[0], aSm[1], rRoom, rEdge - 0.15, y4, c4 - y4, 'mortar', { doors: [{ side: 'q0', at: (aSm[0] + aSm[1]) / 2 }], lid: false, skip: ['q1'] });
    signF(kit, W, 4, (aSm[0] + aSm[1]) / 2 + 1.1, rRoom, y4 + 1.6, 0, -1, 0.6, 0.6, { kind: 'picto', icon: 'smoking' });
    const wc = [-1.6, 21.0];
    kit.wall(W, wc[0], rRoom + 0.1, wc[1], rRoom + 0.1, y4, c4, 0.2, 'mortar', 4, [
      { at: 4.0 - wc[0], w: 1.5, h: 1.95 },
      { at: 16.0 - wc[0], w: 1.5, h: 1.95 },
    ]);
    wcEntrance(kit, W, 4, { p: 4.0, q: rRoom + 0.1, into: 1, y: y4, h: 1.9, icon: 'women', caption: '25' });
    wcEntrance(kit, W, 4, { p: 16.0, q: rRoom + 0.1, into: 1, y: y4, h: 1.9, icon: 'men', caption: '4' });
    kit.wall(W, wc[1] + 0.1, rRoom, wc[1] + 0.1, rEdge - 0.15, y4, c4, 0.2, 'mortar', 4);
    kit.wall(W, 12.2, rRoom + 0.2, 12.2, rEdge - 0.15, y4, c4, 0.12, 'wcWall', 4); // women | men
    kit.box(W, wc[0] + 0.1, wc[1], rEdge - 0.19, rEdge - 0.15, y4, c4, 'wcWall', 4);
    cubicles(kit, W, 4, { from: wc[0] + 0.2, to: 12.0, at: rEdge - 0.19, face: -1, y: y4, h: 1.9 });
    cubicles(kit, W, 4, { axis: 'q', from: rRoom + 3.2, to: rEdge - 1.8, at: wc[0] + 0.1, face: 1, y: y4, h: 1.9 });
    cubicles(kit, W, 4, { from: 12.4, to: 16.1, at: rEdge - 0.19, face: -1, y: y4, h: 1.9, n: 4 });
    vanity(kit, W, 4, { from: 7.2, to: 11.8, at: rRoom + 0.21, face: 1, y: y4 });
    vanity(kit, W, 4, { from: 18.2, to: 20.8, at: rRoom + 0.21, face: 1, y: y4 });
    // lockers 4A / 4B at the far end: banks on three sides and a double island
    const la = [wc[1] + 0.3, aEnd - 0.05];
    lockers(kit, W, 4, { from: la[0] + 0.3, to: la[1] - 0.3, at: rEdge - 0.16, face: -1, y: y4 });
    lockers(kit, W, 4, { axis: 'q', from: rRoom + 0.2, to: rEdge - 0.7, at: la[0], face: 1, y: y4 });
    lockers(kit, W, 4, { axis: 'q', from: rRoom + 0.2, to: rEdge - 0.7, at: la[1], face: -1, y: y4 });
    for (const fc of [-1, 1]) lockers(kit, W, 4, { axis: 'q', from: rRoom + 1.0, to: rEdge - 1.6, at: (la[0] + la[1]) / 2, face: fc, y: y4 });
    signF(kit, W, 4, (la[0] + la[1]) / 2, rFace, y4 + 1.5, 0, 1, 0.9, 0.55, { kind: 'picto', icon: 'locker', caption: s < 0 ? '4A' : '4B' });
    signF(kit, W, 4, 0.5, rFace, y4 + 1.25, 0, 1, 0.85, 1.75, { kind: 'level', level: 4, lines: [] });

    // balustrades of the mezzanine toward the foyer voids
    const xE = 21.36;
    kit.rail(C, [[g.inner[1], g.rTop - 0.06, y4], [xE - 0.06, g.rTop - 0.06, y4], [xE - 0.06, rEdge - 0.06, y4], [s34.x - s34.width / 2 - 0.16, rEdge - 0.06, y4], [s34.x - s34.width / 2 - 0.16, rEdge - 16 * s34.going - 0.1, y4], [s34.x + s34.width / 2 + 0.16, rEdge - 16 * s34.going - 0.1, y4], [s34.x + s34.width / 2 + 0.16, rEdge - 0.06, y4], [xJ(rEdge) + 0.3, rEdge - 0.06, y4]], 4);
    kit.box(C, xE, xJ(rEdge), rEdge - 0.02, rEdge + 0.02, y4 - 0.55, y4 + 0.02, 'bulkhead', 4); // edge fascia
    kit.box(C, xE - 0.02, xE + 0.02, g.rTop, rEdge, y4 - 0.55, y4 + 0.02, 'bulkhead', 4);
    kit.box(C, g.outer[0], xE, g.rTop - 0.02, g.rTop + 0.02, y4 - 0.55, y4 + 0.02, 'bulkhead', 4);
    // red balustrade walls of the 4-5 flights (they pass up through the LEVEL 5 slab)
    const flightTop = (x, z) => y4 + ((z + RC0 - s45.r0) / s45.going) * s45.rise + 1.05;
    for (const x of s45.xs) {
      for (const e of [-1, 1]) {
        const xw = x + e * (s45.width / 2 + 0.1);
        kit.prism(C, [[xw - 0.1, s45.r0], [xw + 0.1, s45.r0], [xw + 0.1, r45], [xw - 0.1, r45]], y4, flightTop, 'red', 4);
      }
      signF(kit, C, 4, x + s45.width / 2 + 0.22, s45.r0 + 1.0, y4 + 1.05, 1, 0, 1.3, 0.34, { kind: 'text', lines: ['LEVEL 5'] });
    }
  }
}

// --- LEVEL 2 -----------------------------------------------------------------------------------------
function level2(kit) {
  // back of house: a few partitions on the column lines so the floor is not an empty plate
  for (const s of [1, -1]) {
    const C = frameC(s);
    const W = frameW(s);
    for (const x of [4.27, 21.36]) kit.wall(C, x, 101.0, x, 117.6, Y[2], Y[3] - 0.35, 0.2, 'boh', 2, [{ at: 8.0, w: 1.8, h: 2.1 }]);
    for (const a of [-4.42, 11.58, 27.58]) kit.wall(W, a, 96.0, a, 113.4, Y[2], Y[3] - 0.35, 0.2, 'boh', 2, [{ at: 6.0, w: 1.8, h: 2.1 }]);
    for (const [p0, p1] of [[6, 10], [-10, -6]]) kit.box(W, p0, p1, 100, 104, Y[2], Y[2] + 2.2, 'plant', 2);
  }
}

export default function buildLower(kit) {
  level1(kit);
  level2(kit);
  level3(kit);
  level4(kit);
}

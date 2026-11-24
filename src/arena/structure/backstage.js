// Backstage block between the stage-end facade and the stage rear wall (17.5 m deep, bays
// 4.6 + 8.1 + 4.8 m, JATET section): ground-floor truck lane / stage-rear dock, four floors
// of dressing rooms and crew rooms aligned with LEVEL 3 / 5 / 6 / 7 (the same levels as the
// stage galleries, which open off the stage-side corridor), machine rooms on LEVEL 9.
import { LEVEL_Y, BACKSTAGE_ROOF_Y } from '../../core/envelope.js';
import { frameX } from './kit.js';
import { BS, CIRC } from './plan.js';
import { BS_STAIR } from './slabs.js';
import { column } from './fittings.js';
import { signF } from './signs.js';

export default function buildBackstage(kit) {
  const ys = { 1: 0.02, ...Object.fromEntries(BS.levels.map((lv) => [lv, LEVEL_Y[lv]])) };
  const lvs = [1, ...BS.levels];
  const ceil = (i) => (i < lvs.length - 1 ? ys[lvs[i + 1]] - 0.35 : BACKSTAGE_ROOF_Y - 0.5);
  const zA = -26.2; // rooms on the facade side | central corridor
  const zB = -24.2; // central corridor | small rooms
  const zC = -21.2; // small rooms | stage-side corridor (gallery access)

  for (const s of [1, -1]) {
    const f = frameX(s);
    // structural columns on the two bay lines, through all floors
    for (const [z, xs] of [[BS.bay1, [8, 16]], [BS.bay2, [s > 0 ? 0 : null, 8, 16, 24]]]) {
      for (const x of xs) if (x !== null) column(kit, f, x, z, 0.8, 0.02, BACKSTAGE_ROOF_Y - 0.5, 'concreteCore');
    }

    lvs.forEach((lv, i) => {
      const y = ys[lv];
      const c = ceil(i);
      const hwA = BS.halfWidth(zA) - 0.1;
      const hwC = BS.halfWidth(zC) - 0.1;
      if (lv === 1) {
        // ground floor: stores along the facade, the truck lane and the stage-rear dock stay open
        kit.wall(f, BS.notchHalf, BS.bay1, BS.halfWidth(BS.bay1), BS.bay1, y, c, 0.2, 'concreteCore', 1, [
          { at: 12.0 - BS.notchHalf - 3.2, w: 3.0, h: 3.2 },
          { at: 22.0 - BS.notchHalf - 1.6, w: 2.4, h: 3.0 },
        ]);
        kit.wall(f, BS.notchHalf + 0.1, BS.z0, BS.notchHalf + 0.1, BS.notchZ, y, c, 0.2, 'concreteCore', 1);
        // lane markings of the dock: yellow edge lines, hatched unloading bay behind the stage
        for (const z of [BS.bay1 + 0.6, BS.bay2 - 0.4]) kit.box(f, 0, BS.halfWidth(z) - 0.6, z - 0.06, z + 0.06, y + 0.001, y + 0.004, 'laneYellow', 1);
        for (let x = 1.2; x < 20; x += 2.4) kit.box(f, x, x + 1.2, -21.0, -18.6, y + 0.001, y + 0.004, 'laneYellow', 1);
        // linear lights over the lane
        for (let x = 2; x < 26; x += 6) kit.box(f, x, x + 3.6, -26.1, -26.0, c - 0.08, c - 0.02, 'ledWhite', 1);
        return;
      }
      if (lv === 9) {
        // machine rooms: air-handling units on plinths, a duct header
        for (const x of [5, 13, 21]) {
          kit.box(f, x - 2.6, x + 2.6, -29.4, -23.2, y, y + 0.15, 'concreteCore', 9);
          kit.box(f, x - 2.4, x + 2.4, -29.2, -23.4, y + 0.15, y + 2.2, 'plant', 9);
        }
        kit.tube(f, [1.0, -21.0, y + 1.9], [27.0, -21.0, y + 1.9], 0.4, 'duct', 9, 12);
        return;
      }
      const wm = 'backstageWall';
      // --- long walls ---------------------------------------------------------------------------
      // facade-side rooms: one large room (rehearsal / green room) and a corner room, doors to the corridor
      kit.wall(f, BS.notchHalf, zA, hwA, zA, y, c, 0.15, wm, lv, [
        { at: 9.5 - BS.notchHalf, w: 1.6, h: 2.1 },
        { at: 22.6 - BS.notchHalf, w: 0.95, h: 2.1 },
      ]);
      kit.box(f, 8.7, 9.495, zA - 0.025, zA + 0.025, y, y + 2.1, 'doorLight', lv);
      kit.box(f, 9.505, 10.3, zA - 0.025, zA + 0.025, y, y + 2.1, 'doorLight', lv);
      kit.box(f, 22.125, 23.075, zA - 0.025, zA + 0.025, y, y + 2.1, 'doorLight', lv);
      kit.wall(f, 20.2, BS.z0 + 0.1, 20.2, zA, y, c, 0.15, wm, lv);
      kit.wall(f, BS.notchHalf + 0.08, BS.notchZ, BS.notchHalf + 0.08, zA, y, c, 0.15, wm, lv);
      kit.wall(f, 0, BS.notchZ + 0.08, BS.notchHalf + 0.16, BS.notchZ + 0.08, y, c, 0.15, wm, lv);
      // blue feature wall of the large room (rehearsal-room photo: blue walls, timber-look floor)
      kit.box(f, BS.notchHalf + 0.16, BS.notchHalf + 0.19, BS.notchZ + 0.2, zA - 0.1, y, c, 'backstageBlue', lv);
      // small rooms between the two corridors: dressing rooms 5.2 m wide, one door each
      const bounds = [2.6, 7.8, 13.0, 18.2, 23.4];
      const doorsB = bounds.slice(0, -1).map((b, k) => (b + bounds[k + 1]) / 2 - 1.2).concat(hwC > 26 ? [25.2] : []);
      kit.wall(f, bounds[0], zB, hwC - 0.4, zB, y, c, 0.15, wm, lv, doorsB.map((d) => ({ at: d - bounds[0], w: 0.95, h: 2.1 })));
      for (const d of doorsB) {
        kit.box(f, d - 0.475, d + 0.475, zB - 0.025, zB + 0.025, y, y + 2.1, 'doorLight', lv);
        kit.box(f, d + 0.33, d + 0.37, zB - 0.06, zB + 0.06, y + 0.95, y + 1.1, 'stainless', lv);
        kit.box(f, d - 0.3, d + 0.3, zB - 0.085, zB - 0.075, y + 1.5, y + 1.7, 'steelBlack', lv); // room name plate
      }
      kit.wall(f, bounds[0], zC, hwC, zC, y, c, 0.15, wm, lv, [{ at: 14.0, w: 1.6, h: 2.1 }]);
      for (const e of [-1, 1]) kit.box(f, bounds[0] + 14.0 + (e < 0 ? -0.8 : 0.005), bounds[0] + 14.0 + (e < 0 ? -0.005 : 0.8), zC - 0.025, zC + 0.025, y, y + 2.1, 'doorLight', lv);
      for (const b of bounds) kit.wall(f, b, zB, b, zC, y, c, 0.15, wm, lv);
      // ceiling strip lights of the two corridors
      for (let x = 1.5; x < hwC - 4; x += 4.8) {
        kit.box(f, x, x + 2.4, (zA + zB) / 2 - 0.05, (zA + zB) / 2 + 0.05, c - 0.04, c, 'ledWhite', lv);
        kit.box(f, x, x + 2.4, (zC + BS.z1) / 2 - 0.05, (zC + BS.z1) / 2 + 0.05, c - 0.04, c, 'ledWhite', lv);
      }
      // floor number on the wall opposite the lift / stair
      if (s > 0) signF(kit, f, lv, (CIRC.liftBackstage.x[0] + CIRC.liftBackstage.x[1]) / 2, zA - 0.08, y + 1.6, 0, -1, 1.2, 1.0, { kind: 'text', lines: [`${lv}F`, 'BACKSTAGE'], color: '#30343A' });
    });
  }
  void BS_STAIR;
}

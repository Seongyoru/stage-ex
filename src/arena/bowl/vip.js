// LEVEL 6 VIP boxes: 11 glass-fronted rooms behind and above the centre of the Middle
// Stand (organiser box 10 m on the axis, five 5 m boxes each side), each with a private
// balcony of two stepped rows. Shells only: seats and furnishing belong to other modules.
import { FAN_APEX_Z } from '../../core/seating.js';
import { SPEC } from '../../core/spec.js';
import { LEVEL_Y } from '../../core/envelope.js';
import { hq, vqv, fbox, fprism } from './soup.js';

export function vipLayout(C5) {
  const vip = SPEC.tiers.find((t) => t.level === 'LEVEL 6');
  const zA = vip.innerRadius_m + FAN_APEX_Z; // row lines of the two balcony rows
  const zB = vip.outerRadius_m + FAN_APEX_Z;
  const yA = vip.frontElevation_m;
  const yB = vip.backElevation_m;
  const yRoom = vip.roomFloorElevation_m ?? LEVEL_Y[6];
  const yCeil = vip.roomCeilingElevation_m;
  const z0 = C5.vBack + 0.04; // outer face of the balcony parapet, directly behind row 17
  const zIn = z0 + 0.3; // inner face
  const zStepB = zB - 0.48; // front edge of the second row
  const zRoom = zStepB + vip.rowPitch_m; // edge of the room floor level
  // Stations shared with the neighbours: arena/venues lays the room carpet from apothem
  // 104.75 (z = 72.15), arena/structure starts the LEVEL 6 slab and the room walls at apothem
  // 104.5 and closes the rooms with the corridor wall at apothem 111.3.
  const zGlass = zB + 0.8; // glass front, 0.1 m in front of the room carpet
  const zSlab = FAN_APEX_Z + 104.5;
  const zBack = FAN_APEX_Z + 111.3;
  const wOrg = vip.organiserBoxWidth_m;
  const wBox = vip.corporateBoxWidth_m;
  const perSide = vip.corporateBoxes / 2;
  // dividing walls (centre x, thickness on the balcony)
  const dividers = [];
  for (const s of [-1, 1]) {
    dividers.push({ x: (s * wOrg) / 2, t: 0.5 });
    for (let k = 1; k <= perSide; k++) dividers.push({ x: s * (wOrg / 2 + k * wBox), t: k === perSide ? 0.3 : 0.2 });
  }
  dividers.sort((p, q) => p.x - q.x);
  const boxes = [];
  for (let i = 0; i + 1 < dividers.length; i++) boxes.push({ x0: dividers[i].x + dividers[i].t / 2, x1: dividers[i + 1].x - dividers[i + 1].t / 2, organiser: Math.abs(dividers[i].x + dividers[i + 1].x) < 0.01 });
  return { zA, zB, yA, yB, yRoom, yCeil, z0, zIn, zStepB, zRoom, zGlass, zSlab, zBack, dividers, boxes, parapetTop: yA + 1.1, slabBottom: yA - 0.25, glassTop: yRoom + 3.0, half: wOrg / 2 + perSide * wBox };
}

/**
 * VIP band. Built here: balcony parapet, the two balcony steps, dividing walls, end piers,
 * the soffit over the balconies, the glass fronts with their frames. Behind the glass only
 * a bare structural shell is built (floor 2 cm below the finished slab, 0.12 m dividing
 * walls, rear wall, structural ceiling): it lies inside the slab, walls and linings that
 * arena/structure and arena/venues build at the same stations, so nothing is coplanar.
 */
export function buildVip(soup, M, V, F, endHalf) {
  const level = 6;
  const g = 'vip';
  const bkPar = soup.get(M.vipParapet, { level, group: g });
  const bkWall = soup.get(M.vipWall, { level, group: g });
  const bkSof = soup.get(M.vipSoffit, { level, group: g, cast: false });
  const bkCb = soup.get(M.vipCarpetBalcony, { level, group: g });
  const bkGl = soup.get(M.vipGlass, { level, group: 'vipGlass', cast: false });
  const bkMu = soup.get(M.vipMullion, { level, group: g });
  const { z0, zIn, zStepB, zRoom, zGlass, zSlab, zBack, yA, yB, yRoom, yCeil, parapetTop, slabBottom, glassTop } = V;
  // the band ends on the centre / wing junction lines: endHalf(z) is its half width at station z
  const eh = endHalf;

  // balcony parapet: solid upstand with a wide flat top, directly behind row 17 of the Middle Stand
  fprism(bkPar, F, [[-eh(z0), z0], [eh(z0), z0], [eh(zIn), zIn], [-eh(zIn), zIn]], slabBottom, parapetTop);
  // underside of the balcony slab (the LEVEL 6 slab of arena/structure takes over at zSlab)
  hq(bkSof, F, -eh(zIn), eh(zIn), zIn, -eh(zSlab), eh(zSlab), zSlab, slabBottom, -1);
  // black soffit over the balconies and bulkhead above the glass
  hq(bkSof, F, -eh(zIn), eh(zIn), zIn, -eh(zGlass), eh(zGlass), zGlass, yCeil, -1);
  fbox(bkWall, F, -eh(zGlass - 0.06), eh(zGlass - 0.06), zGlass - 0.06, zGlass + 0.06, glassTop, yCeil, 'tb');
  // end piers of the band
  for (const s of [-1, 1]) {
    fprism(bkWall, F, [[s * V.half, zIn], [s * eh(zIn), zIn], [s * eh(zGlass), zGlass], [s * V.half, zGlass]], slabBottom, yCeil, { top: false, bottom: false });
  }
  // dividing walls: full thickness on the balcony, a thin core behind the glass
  for (const d of V.dividers) {
    fbox(bkWall, F, d.x - d.t / 2, d.x + d.t / 2, zIn, zGlass + 0.06, slabBottom, yCeil, 'tb');
    fbox(bkWall, F, d.x - 0.06, d.x + 0.06, zGlass + 0.06, zBack, yRoom - 0.02, yCeil, 'tbf');
  }
  // bare shell behind the glass (hidden inside the neighbours' finishes)
  hq(bkWall, F, -V.half, V.half, zGlass, -V.half, V.half, zBack, yRoom - 0.02, 1);
  fbox(bkWall, F, -V.half, V.half, zBack - 0.045, zBack + 0.045, yRoom - 0.02, yCeil, 'tb');
  hq(bkSof, F, -V.half, V.half, zGlass, -V.half, V.half, zBack, yCeil, -1);

  for (const b of V.boxes) {
    const { x0, x1 } = b;
    // two stepped balcony rows and the landing in front of the glass (6 mm of carpet above the slab)
    hq(bkCb, F, x0, x1, zIn, x0, x1, zStepB, yA, 1);
    vqv(bkCb, F, x0, x1, zStepB, yA, yB, -1);
    hq(bkCb, F, x0, x1, zStepB, x0, x1, zRoom, yB, 1);
    vqv(bkCb, F, x0, x1, zRoom, yB, yRoom + 0.006, -1);
    hq(bkCb, F, x0, x1, zRoom, x0, x1, zGlass + 0.05, yRoom + 0.006, 1);
    // glass front with sliding-door frames
    vqv(bkGl, F, x0, x1, zGlass, yRoom, glassTop, -1);
    vqv(bkGl, F, x0, x1, zGlass + 0.012, yRoom, glassTop, 1);
    const n = Math.max(2, Math.round((x1 - x0) / 1.2));
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      fbox(bkMu, F, Math.max(x0, x - 0.03), Math.min(x1, x + 0.03), zGlass - 0.04, zGlass + 0.05, yRoom, glassTop, 'tb');
    }
    fbox(bkMu, F, x0, x1, zGlass - 0.04, zGlass + 0.05, glassTop - 0.07, glassTop, 't');
    fbox(bkMu, F, x0, x1, zGlass - 0.04, zGlass + 0.05, yRoom, yRoom + 0.05, 'b');
  }
}

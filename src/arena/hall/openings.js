// Openings of the hall walls at arena level and the small technical doors on the galleries.
//   side walls  truck portal = GATE 101 / 104 (roll shutter 2.6 m inside the wall zone),
//               wide sliding service door under the nozzle fascia
//   rear wall   two stage-rear truck doors to the dock lane of the backstage block
//   galleries   flush steel doors to the backstage corridors (seen when the curtains are tied back)
import { Mesher } from './builder.js';
import { FRAME_R, FRAME_L, FRAME_B, REAR_LEN, REAR_T, LEVEL_Y, OPENINGS, curtainBands } from './layout.js';

const SIDES = [FRAME_R, FRAME_L];

/** Inside faces of a recess cut into a wall: jambs, head, sill. */
function recess(walls, sill, s0, s1, h, depth) {
  walls.quadToward([s0, 0, -depth], [s0, 0, 0], [s0, h, 0], [s0, h, -depth], [1, 0, 0]);
  walls.quadToward([s1, 0, -depth], [s1, 0, 0], [s1, h, 0], [s1, h, -depth], [-1, 0, 0]);
  walls.quadToward([s0, h, -depth], [s1, h, -depth], [s1, h, 0], [s0, h, 0], [0, -1, 0]);
  sill.quadToward([s0, 0.006, -depth], [s1, 0.006, -depth], [s1, 0.006, 0], [s0, 0.006, 0], [0, 1, 0]);
}

/** Roll shutter closing a recess at depth `d`: curtain of slats, bottom bar, guides, hood. */
function shutter(slats, frame, s0, s1, h, d, back = d - 0.3) {
  slats.box(s0 + 0.08, s1 - 0.08, 0.12, h - 0.42, d - 0.05, d);
  frame.box(s0 + 0.08, s1 - 0.08, 0.006, 0.12, d - 0.06, d + 0.02); // bottom bar
  frame.box(s0, s0 + 0.1, 0.006, h - 0.42, d - 0.08, d + 0.06); // guides
  frame.box(s1 - 0.1, s1, 0.006, h - 0.42, d - 0.08, d + 0.06);
  frame.box(s0, s1, h - 0.42, h, back, d + 0.12); // hood
}

/** Steel frame standing proud of the wall face around an opening. */
function portalFrame(frame, s0, s1, h, w, proud) {
  frame.box(s0 - w, s0, 0, h + w, 0, proud);
  frame.box(s1, s1 + w, 0, h + w, 0, proud);
  frame.box(s0, s1, h, h + w, 0, proud);
}

/** Green emergency-exit light box above an opening. */
function exitSign(frame, sign, sc, y, d = 0) {
  frame.box(sc - 0.42, sc + 0.42, y, y + 0.3, d, d + 0.09);
  sign.quadToward([sc - 0.39, y + 0.03, d + 0.092], [sc + 0.39, y + 0.03, d + 0.092], [sc + 0.39, y + 0.27, d + 0.092], [sc - 0.39, y + 0.27, d + 0.092], [0, 0, 1]);
}

export function buildOpenings(B, { ends }) {
  const O = OPENINGS;

  // --- side walls -------------------------------------------------------------------------
  {
    const black = new Mesher();
    const sill = new Mesher();
    const slats = new Mesher();
    const frame = new Mesher();
    const leaf = new Mesher();
    const sign = new Mesher();
    const t = O.truck;
    recess(black, sill, t.s0, t.s1, t.h, t.depth);
    shutter(slats, frame, t.s0, t.s1, t.h, -t.depth + 0.3);
    portalFrame(frame, t.s0, t.s1, t.h, 0.16, 0.075);
    const tc = (t.s0 + t.s1) / 2;
    exitSign(frame, sign, tc + 2.2, t.h + 0.34, 0.075);
    frame.box(tc - 1.25, tc + 1.25, t.h + 0.3, t.h + 0.98, 0, 0.05); // board of the gate sign

    // sliding service door: two leaves on a head track
    const sv = O.service;
    const sm = (sv.s0 + sv.s1) / 2;
    leaf.box(sv.s0, sm - 0.008, 0.02, sv.h, 0.0, 0.05);
    leaf.box(sm + 0.008, sv.s1, 0.02, sv.h, 0.0, 0.05);
    portalFrame(frame, sv.s0, sv.s1, sv.h, 0.12, 0.1);
    frame.box(sv.s0 - 0.12, sv.s1 + 0.12, sv.h + 0.12, sv.h + 0.26, 0, 0.14); // track cover
    for (const s of [sm - 0.25, sm + 0.25]) frame.box(s - 0.02, s + 0.02, 0.95, 1.35, 0.05, 0.09); // pull handles
    exitSign(frame, sign, sm, sv.h + 0.36, 0.06);

    B.add('hall.wallBlack', 1, black, SIDES);
    B.add('hall.threshold', 1, sill, SIDES);
    B.add('hall.shutter', 1, slats, SIDES);
    B.add('hall.doorFrame', 1, frame, SIDES);
    B.add('hall.doorSteel', 1, leaf, SIDES);
    B.add('hall.exitSign', 1, sign, SIDES);

    // gate numbers: house left = 101, house right = 104 (text must not be mirrored)
    for (const [f, id, flip] of [
      [FRAME_R, 'hall.gateSign104', false],
      [FRAME_L, 'hall.gateSign101', true],
    ]) {
      const m = new Mesher();
      const u0 = flip ? 1 : 0;
      const u1 = flip ? 0 : 1;
      m.quadToward([tc - 1.2, t.h + 0.34, 0.052], [tc + 1.2, t.h + 0.34, 0.052], [tc + 1.2, t.h + 0.94, 0.052], [tc - 1.2, t.h + 0.94, 0.052], [0, 0, 1], [
        [u0, 0],
        [u1, 0],
        [u1, 1],
        [u0, 1],
      ]);
      B.add(id, 1, m, [f]);
    }
  }

  // --- stage rear wall: truck doors to the dock lane ----------------------------------------
  {
    const black = new Mesher();
    const sill = new Mesher();
    const slats = new Mesher();
    const frame = new Mesher();
    const sign = new Mesher();
    for (const [s0, s1] of [
      [O.rear.s0, O.rear.s1],
      [REAR_LEN - O.rear.s1, REAR_LEN - O.rear.s0],
    ]) {
      recess(black, sill, s0, s1, O.rear.h, REAR_T);
      shutter(slats, frame, s0, s1, O.rear.h, -REAR_T + 0.13, -REAR_T);
      portalFrame(frame, s0, s1, O.rear.h, 0.14, 0.075);
      exitSign(frame, sign, (s0 + s1) / 2, O.rear.h + 0.32, 0.055);
    }
    B.add('hall.wallBlack', 1, black, [FRAME_B]);
    B.add('hall.threshold', 1, sill, [FRAME_B]);
    B.add('hall.shutter', 1, slats, [FRAME_B]);
    B.add('hall.doorFrame', 1, frame, [FRAME_B]);
    B.add('hall.exitSign', 1, sign, [FRAME_B]);
  }

  // --- technical doors on the galleries and at arena level ---------------------------------
  const door = (m, frame, sc, y, d) => {
    m.box(sc - 0.45, sc + 0.45, y + 0.01, y + 2.1, d, d + 0.035);
    frame.box(sc - 0.5, sc - 0.45, y, y + 2.15, d, d + 0.045);
    frame.box(sc + 0.45, sc + 0.5, y, y + 2.15, d, d + 0.045);
    frame.box(sc - 0.5, sc + 0.5, y + 2.1, y + 2.15, d, d + 0.045);
  };
  for (const band of curtainBands(ends)) {
    const y = band.level === 1 ? 0 : LEVEL_Y[band.level];
    const leafS = new Mesher();
    const frameS = new Mesher();
    const signS = new Mesher();
    for (const s of band.level === 1 ? [9] : [9, 22.5, 36, 49.5]) {
      if (s > band.sideEnd - 1.5) continue;
      door(leafS, frameS, s, y, 0.05);
      if (band.level === 1) exitSign(frameS, signS, s, 2.3, 0.05);
    }
    const leafR = new Mesher();
    const frameR = new Mesher();
    const signR = new Mesher();
    for (const x of band.level === 1 ? [-9, 9] : [-13.5, 0, 13.5]) {
      door(leafR, frameR, REAR_LEN / 2 + x, y, 0.05);
      if (band.level === 1) exitSign(frameR, signR, REAR_LEN / 2 + x, 2.3, 0.05);
    }
    B.add('hall.doorSteel', band.level, leafS, SIDES);
    B.add('hall.doorFrame', band.level, frameS, SIDES);
    B.add('hall.doorSteel', band.level, leafR, [FRAME_B]);
    B.add('hall.doorFrame', band.level, frameR, [FRAME_B]);
    if (band.level === 1) {
      B.add('hall.exitSign', 1, signS, SIDES);
      B.add('hall.exitSign', 1, signR, [FRAME_B]);
    }
  }
  {
    // top gallery (7F): doors in the plain charcoal wall
    const y = LEVEL_Y[7];
    const leafS = new Mesher();
    const frameS = new Mesher();
    for (const s of [9, 36, 63]) if (s < ends[7] - 2) door(leafS, frameS, s, y, 0);
    const leafR = new Mesher();
    const frameR = new Mesher();
    for (const x of [-13.5, 13.5]) door(leafR, frameR, REAR_LEN / 2 + x, y, 0);
    B.add('hall.doorSteel', 7, leafS, SIDES);
    B.add('hall.doorFrame', 7, frameS, SIDES);
    B.add('hall.doorSteel', 7, leafR, [FRAME_B]);
    B.add('hall.doorFrame', 7, frameR, [FRAME_B]);
  }
}

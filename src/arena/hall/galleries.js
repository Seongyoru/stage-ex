// Production galleries (演出用バルコニー): four U-shaped levels along the stage rear wall and
// both side walls. Pale concrete walkway on a steel deck, cantilever brackets every 4.5 m,
// H-section edge beam, black three-rail pipe guard, exposed H-posts in the audience-side end
// bays of the 5F-7F side galleries, and the black nozzle fascia under the 3F side galleries.
import { Mesher } from './builder.js';
import {
  FRAME_R,
  FRAME_L,
  FRAME_B,
  REAR_LEN,
  MITRE,
  LEVEL_Y,
  GALLERY_LEVELS,
  GALLERY_D,
  RAIL_H,
  BAY,
  G,
  STAND_S,
  NOZZLE,
  NOZZLE_S0,
  nozzlePorts,
} from './layout.js';

const SIDES = [FRAME_R, FRAME_L];

/** Bay lines (cantilever brackets, curtain ties) along a run. */
export function bayLines(run) {
  const out = [];
  if (run.side) {
    for (let s = BAY / 2; s < run.s1 - 0.6; s += BAY) out.push(s);
  } else {
    for (let s = REAR_LEN / 2 - BAY / 2; s > MITRE * GALLERY_D + 0.3; s -= BAY) out.unshift(s);
    for (let s = REAR_LEN / 2 + BAY / 2; s < REAR_LEN - MITRE * GALLERY_D - 0.3; s += BAY) out.push(s);
  }
  return out;
}

/** The two kinds of gallery run of a level: both side walls (mirrored) and the rear wall. */
export function runsOf(level, ends) {
  return [
    { side: true, frames: SIDES, s0: 0, s1: ends[level], k0: MITRE, k1: 0 },
    { side: false, frames: [FRAME_B], s0: 0, s1: REAR_LEN, k0: MITRE, k1: -MITRE },
  ];
}

/** Posts of the end bays, s relative to the front of the telescopic stand (read off the frontal photo). */
const TOWER_POSTS = [2.2, 3.8, 5.2, 7.6].map((d) => STAND_S.teleFront + d);

function hPost(m, s, y0, y1) {
  const w = 0.125;
  m.box(s - w, s + w, y0, y1, 2.56, 2.578); // inner flange
  m.box(s - w, s + w, y0, y1, 2.792, 2.81); // outer flange (faces the hall)
  m.box(s - 0.007, s + 0.007, y0, y1, 2.578, 2.792); // web
}

/** One round air nozzle standing 60 mm proud of the fascia: ring, dished throat, dark centre. */
function nozzlePort(ring, dark, sc, yc, dFace, radius, seg) {
  const rOut = radius;
  const rIn = radius * 0.74;
  const rThroat = radius * 0.46;
  const dFront = dFace + 0.06;
  const dBack = dFace + 0.008;
  const pt = (r, a, d) => [sc + r * Math.cos(a), yc + r * Math.sin(a), d];
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2;
    const a1 = ((i + 1) / seg) * Math.PI * 2;
    const am = (a0 + a1) / 2;
    const rad = [Math.cos(am), Math.sin(am), 0];
    ring.quadToward(pt(rOut, a0, dFace), pt(rOut, a1, dFace), pt(rOut, a1, dFront), pt(rOut, a0, dFront), rad);
    ring.quadToward(pt(rIn, a0, dFront), pt(rIn, a1, dFront), pt(rOut, a1, dFront), pt(rOut, a0, dFront), [0, 0, 1]);
    ring.quadToward(pt(rThroat, a0, dBack), pt(rThroat, a1, dBack), pt(rIn, a1, dFront), pt(rIn, a0, dFront), [-rad[0], -rad[1], 0.6]);
    dark.triToward([sc, yc, dBack], pt(rThroat, a0, dBack), pt(rThroat, a1, dBack), [0, 0, 1]);
  }
}

export function buildGalleries(B, { ends, variant, low }) {
  for (const level of GALLERY_LEVELS) {
    const L = LEVEL_Y[level];
    const yDeck = L - G.topping;
    const ySlab = yDeck - G.deck;
    const yBeam0 = L + G.beamTop - G.beamDepth; // underside of the edge beam
    for (const run of runsOf(level, ends)) {
      const { s0, s1, k0, k1 } = run;
      const sSlab1 = run.side ? s1 - 0.2 : s1; // the side galleries finish with an end beam
      const floor = new Mesher();
      const steel = new Mesher();
      const rail = new Mesher();

      // walkway and deck
      floor.run(s0, sSlab1, 0, G.slabD, yDeck, L, k0, k1);
      steel.run(s0, sSlab1, 0, G.slabD, ySlab, yDeck, k0, k1);

      // edge beam: H-section lying on its side (web vertical, flanges top and bottom)
      steel.run(s0, s1, G.slabD, GALLERY_D, L + G.beamTop - 0.02, L + G.beamTop, k0, k1);
      steel.run(s0, s1, G.slabD, GALLERY_D, yBeam0, yBeam0 + 0.02, k0, k1);
      steel.run(s0, s1, 2.694, 2.706, yBeam0 + 0.02, L + G.beamTop - 0.02, k0, k1);
      if (run.side) steel.box(s1 - 0.2, s1, yBeam0, L + G.beamTop, 0, G.slabD);

      // cantilever brackets, web stiffeners and bolted splices
      const bays = bayLines(run);
      bays.forEach((s, i) => {
        steel.box(s - G.crossW / 2, s + G.crossW / 2, ySlab - G.crossDepth, ySlab, 0, G.slabD);
        if (!low) {
          steel.box(s - 0.006, s + 0.006, yBeam0 + 0.02, L + G.beamTop - 0.02, 2.706, GALLERY_D - 0.004);
          if (i % 2 === 1) steel.box(s + BAY / 2 - 0.28, s + BAY / 2 + 0.28, yBeam0 + 0.07, L + G.beamTop - 0.07, 2.706, 2.724);
        }
      });

      // handrail: top rail at 1.1 m, two lower rails, posts at about 1 m
      const dR = G.railD;
      const yTop = L + RAIL_H;
      const sR1 = run.side ? s1 - 0.03 : s1;
      rail.run(s0, sR1, dR - 0.024, dR + 0.024, yTop - 0.048, yTop, k0, k1);
      rail.run(s0, sR1, dR - 0.016, dR + 0.016, L + 0.6, L + 0.632, k0, k1);
      rail.run(s0, sR1, dR - 0.016, dR + 0.016, L + 0.13, L + 0.162, k0, k1);
      const pA = s0 + k0 * dR + (run.side ? 0.02 : 0);
      const pB = (run.side ? s1 - 0.05 : s1 + k1 * dR) - 0.0;
      const n = Math.max(1, Math.round((pB - pA) / (low ? 2 * G.postPitch : G.postPitch)));
      for (let i = run.side ? 1 : 0; i <= n; i++) {
        const s = pA + ((pB - pA) * i) / n;
        rail.box(s - 0.02, s + 0.02, L + G.beamTop, yTop - 0.048, dR - 0.02, dR + 0.02);
      }
      if (run.side) {
        // return across the free end
        const e = s1 - 0.05;
        rail.box(e - 0.024, e + 0.024, yTop - 0.048, yTop, 0.12, dR + 0.024);
        rail.box(e - 0.016, e + 0.016, L + 0.6, L + 0.632, 0.12, dR);
        rail.box(e - 0.016, e + 0.016, L + 0.13, L + 0.162, 0.12, dR);
        for (const d of [0.14, 1.0, 1.86]) rail.box(e - 0.02, e + 0.02, L + G.beamTop, yTop - 0.048, d - 0.02, d + 0.02);
      }

      // exposed H-posts of the end bays (5F to 7F) with the denser guard between them
      if (run.side && level >= 5) {
        const y0 = yBeam0;
        const y1 = level === 7 ? L + G.beamTop : LEVEL_Y[level + 1] + G.beamTop - G.beamDepth;
        for (const s of TOWER_POSTS) {
          if (s > s1 - 0.3) continue;
          hPost(steel, s, y0, y1);
          // bolted column splice 1.2 m above the walkway
          if (!low && level < 7) steel.box(s - 0.1, s + 0.1, L + 1.0, L + 1.45, 2.81, 2.824);
        }
        // the end bays carry a taller guard: rails up to 2.1 m between the posts (frontal photo)
        if (level < 7 && TOWER_POSTS[0] < s1 - 1) {
          for (const h of [0.38, 0.86, 1.36, 1.62, 1.88, 2.14]) rail.box(TOWER_POSTS[0], Math.min(TOWER_POSTS[3], s1 - 0.05), L + h, L + h + 0.03, dR - 0.015, dR + 0.015);
        }
      }

      B.add('hall.galleryFloor', level, floor, run.frames);
      B.add('hall.gallerySteel', level, steel, run.frames);
      B.add('hall.handrail', level, rail, run.frames);
    }
  }

  // --- nozzle fascia under the 3F side galleries ------------------------------------------
  {
    const L = LEVEL_Y[3];
    const sEnd = ends[3];
    const box = new Mesher();
    const ring = new Mesher();
    // plenum box hung under the gallery, its face just behind the edge beam
    box.box(NOZZLE_S0, sEnd, NOZZLE.y0, L - G.topping - G.deck, NOZZLE.d0, G.slabD);
    box.box(NOZZLE_S0, sEnd, NOZZLE.y0, L + G.beamTop - G.beamDepth, G.slabD, NOZZLE.d1);
    const yc = (NOZZLE.y0 + L + G.beamTop - G.beamDepth) / 2 + 0.02;
    for (const s of nozzlePorts(variant, sEnd)) nozzlePort(ring, box, s, yc, NOZZLE.d1, NOZZLE.dia / 2, low ? 10 : 16);
    B.add('hall.nozzleFascia', 1, box, SIDES);
    B.add('hall.nozzleRing', 1, ring, SIDES);
  }
}

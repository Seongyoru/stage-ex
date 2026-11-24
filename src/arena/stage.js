// K-Arena Yokohama — stage and permanent production equipment (layer 'stage').
//
//   basic stage kit (基礎ステージ)      src/arena/stage/kit.js       userData.stageKit, LEVEL 1
//   lifting grids, hoists, lighting    src/arena/stage/rigging.js
//   L-Acoustics K series system        src/arena/stage/pa.js        (delays LEVEL 9, side fills LEVEL 5)
//   side / service screens, LED wall   src/arena/stage/video.js
//   FOH riser, barricade, skirt        src/arena/stage/foh.js       userData.showOnly
//   show state (beams, haze, LED)      src/arena/stage/show.js
//
// Facts: research/00-consolidated.md 7 and 9.2, research/organizer-tech.md 2, 5, 8, 9, 10, 12,
// research/model-spec.json stage / production. World frame: x = house right, z = toward the
// rear of the hall, stage front at z = 0, arena floor y = 0.
//
// ctx.flags understood here (all optional, strings as they come from the URL):
//   followSpots=0   do not place the eight follow spots (if arena/roof models them)
//   upstageWall=0   no default upstage LED wall in the show state
import * as THREE from 'three';
import { SPEC as DEFAULT_SPEC } from '../core/spec.js';
import { Collector } from './stage/batch.js';
import { stageMaterials } from './stage/mats.js';
import { buildStageKit, buildSkirt, buildTiedSkirt, KEN } from './stage/kit.js';
import { buildFlownPA, addUnderStagePA } from './stage/pa.js';
import { buildLiftingGrids, buildLightingRig, buildMovingHeads, buildFollowSpots } from './stage/rigging.js';
import { buildVideo, buildUpstageWall } from './stage/video.js';
import { buildFOH, buildBarricade } from './stage/foh.js';
import { createShow, updateShow } from './stage/show.js';
import { RoofRig } from './stage/roofrig.js';

function sub(name, userData) {
  const g = new THREE.Group();
  g.name = name;
  g.userData.layer = 'stage';
  if (userData) Object.assign(g.userData, userData);
  return g;
}

export function build(ctx = {}) {
  const SPEC = ctx.SPEC || DEFAULT_SPEC;
  const flags = ctx.flags || {};
  const c = { quality: ctx.quality || 'high', SPEC, flags };
  const mats = stageMaterials();

  const root = sub('stage');

  // ---- 1. basic stage kit ------------------------------------------------------------------
  const kit = sub('basic stage kit', { stageKit: true, level: 1 });
  const kitCol = buildStageKit(c);
  addUnderStagePA(kitCol, SPEC, KEN);
  kitCol.flush(kit, mats, { prefix: 'stage kit / ', level: 1, userData: { stageKit: true } });
  // the skirt tied up in bundles: only while no show is loaded (update() swaps it for the hung skirt)
  const tied = sub('stage skirt, tied up', { stageKit: true, level: 1, neutralOnly: true });
  buildTiedSkirt(new Collector()).flush(tied, mats, { prefix: 'stage kit / tied ', level: 1, userData: { stageKit: true, neutralOnly: true } });
  kit.add(tied);
  root.add(kit);

  // ---- 2. lifting grids, hoists, lighting trusses ---------------------------------------------
  const rig = sub('rigging and lighting');
  const rigCol = new Collector();
  const roofRig = new RoofRig(SPEC, rigCol.b('rig.grid')); // rigging beams under the roof trusses
  buildLiftingGrids(rigCol, SPEC, c, roofRig);
  const lighting = buildLightingRig(rigCol, SPEC, c);
  const mh = buildMovingHeads(lighting.heads, mats, c);
  // The generated fixture is a single rigid mesh. During a show use the articulated
  // fixture so its lenses stay aligned with the animated beams.
  root.userData.propSlots = lighting.heads.map(({ x, y, z }) => ({ type: 'moving_head', x, y, z, layer: 'stage' }));
  for (const mesh of Object.values(mh)) {
    mesh.userData.propPlaceholder = 'moving_head';
    mesh.userData.animatedStandIn = true;
  }
  rig.add(mh.yokeMesh, mh.headMesh, mh.lensMesh);
  root.add(rig);

  // ---- 3. loudspeakers --------------------------------------------------------------------
  const pa = sub('L-Acoustics system');
  const flown = buildFlownPA(SPEC, roofRig);
  flown.col.flush(pa, mats, { prefix: 'pa / ' });
  flown.lvl5.flush(pa, mats, { prefix: 'pa side fill / ', level: 5 });
  flown.lvl9.flush(pa, mats, { prefix: 'pa delay / ', level: 9 });
  root.add(pa);

  // ---- 4. video -----------------------------------------------------------------------------
  const video = sub('video');
  const vid = buildVideo(SPEC, mats, c, roofRig);
  vid.col.flush(video, mats, { prefix: 'video / ' });
  vid.lvl9.flush(video, mats, { prefix: 'video service / ', level: 9 });
  video.add(vid.side, vid.service);
  root.add(video);
  rigCol.flush(rig, mats, { prefix: 'rig / ' }); // after the PA and video have asked for their roof beams

  // ---- 5. follow spots on the pin-spot galleries ------------------------------------------------
  let spots = [];
  if (flags.followSpots !== '0') {
    const fs = sub('follow spots', { level: 9 });
    const fsCol = new Collector();
    spots = buildFollowSpots(fsCol, SPEC);
    fsCol.flush(fs, mats, { prefix: 'follow spot / ', level: 9 });
    fs.userData.propPlaceholder = 'follow_spot';
    fs.userData.animatedStandIn = true;
    for (const spot of spots) {
      root.userData.propSlots.push({ type: 'follow_spot', ...spot.slot, level: 9, layer: 'stage' });
    }
    root.add(fs);
  }

  // ---- 6. show-only furniture: skirt, barricade, FOH, upstage LED wall -----------------------------
  const showGroup = sub('show set (showOnly)', { showOnly: true });
  {
    // dressed skirt and crowd barrier belong to the stage: they go when the stage kit goes
    const dress = new Collector();
    buildSkirt(dress);
    buildBarricade(SPEC, dress);
    dress.flush(showGroup, mats, { prefix: 'show stage / ', level: 1, userData: { showOnly: true, stageKit: true } });
    buildFOH(SPEC).flush(showGroup, mats, { prefix: 'show FOH / ', level: 1, userData: { showOnly: true } });
    if (flags.upstageWall !== '0') {
      const wallCol = new Collector();
      const face = buildUpstageWall(SPEC, mats, wallCol);
      face.userData.showOnly = true;
      wallCol.flush(showGroup, mats, { prefix: 'show wall / ', userData: { showOnly: true } });
      showGroup.add(face);
    }
  }
  showGroup.visible = false;
  root.add(showGroup);

  // ---- 7. show runtime ------------------------------------------------------------------------
  const rt = createShow({ heads: lighting.heads, spots, showGroup, neutralGroup: tied, mats, ...mh }, c);
  root.add(rt.fx);
  Object.defineProperty(root.userData, 'stage', { value: rt, enumerable: false, writable: true });
  return root;
}

/** state = { time, night, show, quality } */
export function update(group, state, dt) {
  const rt = group && group.userData.stage;
  if (rt) updateShow(rt, state || {}, dt);
}

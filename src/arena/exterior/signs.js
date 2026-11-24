// "K-Arena" roof sign (white serif channel letters on a steel frame standing on the roof
// skirt above the glass box) and the small entrance sign over the central door bay.
import { layoutWord } from './glyphs.js';
import { FACADE, RC, Z, LIP_TOP, S_SKIRT, S_COL, roofY, frame, slab, bar, lerp } from './common.js';

const TEXT = 'K-Arena';

function letters(col, F, word, depth, level, part) {
  const face = col.geo('sign.letterWhite', { level, part });
  const side = col.geo('sign.letterReturn', { level, part: `${part} returns` });
  const lit = col.geo('sign.letterLit', { level, part: `${part} lit` });
  for (const p of word.parts) {
    slab(face, F, p.pts, { holes: p.holes, t: depth, back: false, edge: false, holeEdge: false });
    slab(side, F, p.pts, { holes: p.holes, t: depth, front: false });
    slab(lit, F, p.pts, { holes: p.holes, t: 0, off: 0.03, back: false });
  }
}

/** Word laid out to an exact overall width by letter spacing. */
function fitted(capHeight, width) {
  const natural = layoutWord(TEXT, capHeight, 0).width;
  const track = (width - natural) / ((TEXT.length - 1) * capHeight);
  return layoutWord(TEXT, capHeight, track);
}

export function buildSigns(col, entrance, { detail = true } = {}) {
  // ---- roof sign ------------------------------------------------------------------------------
  const W = FACADE.signage.roofSignWidth_m; // 18.3
  const H = FACADE.signage.roofSignHeight_m; // 3.7 cap height
  const base = 43.2; // just clear of the skirt (see report; fact sheet "about +43.5")
  const zFace = RC[1] - 6.0; // letters stand 6 m behind the eave tip
  const depth = 0.45;
  letters(col, frame([-W / 2, base, zFace], [1, 0, 0], [0, 0, 1]), fitted(H, W), depth, undefined, 'roof sign');
  const steel = col.geo('sign.frameSteel', { part: 'roof sign frame' });
  const zFrame = zFace - depth - 0.12;
  const zFoot = RC[1] - S_SKIRT;
  const skirtY = (x, z) => lerp(LIP_TOP, roofY(x, Z.columnLine), Math.min(Math.max((zFoot - z) / (S_COL - S_SKIRT), 0), 1));
  for (const y of [base + 0.35, base + 1.85, base + H - 0.35]) bar(steel, [-W / 2 + 0.2, y, zFrame], [W / 2 - 0.2, y, zFrame], 0.1, 0.1);
  const nPost = detail ? 9 : 5;
  for (let i = 0; i < nPost; i++) {
    const x = lerp(-W / 2 + 0.4, W / 2 - 0.4, i / (nPost - 1));
    const top = [x, base + H - 0.3, zFrame];
    bar(steel, [x, skirtY(x, zFrame) - 0.05, zFrame], top, 0.12, 0.12, [0, 0, 1]);
    const zBack = Z.columnLine - 0.9;
    bar(steel, top, [x, roofY(x, zBack) - 0.05, zBack], 0.09, 0.09);
    bar(steel, [x, base + 0.35, zFrame], [x, base + 0.35, zFace - depth], 0.07, 0.07);
    bar(steel, [x, base + H - 0.35, zFrame], [x, base + H - 0.35, zFace - depth], 0.07, 0.07);
  }

  // ---- entrance sign on the dark transom over the central door bay --------------------------------
  if (entrance) {
    const w = FACADE.signage.entranceSignWidth_m; // 3.9
    const cap = (w * H) / W; // same proportions as the roof sign: 0.79
    const y = (entrance.yD + entrance.yTop) / 2 - cap / 2;
    letters(col, frame([-w / 2, y, entrance.z + 0.05], [1, 0, 0], [0, 0, 1]), fitted(cap, w), 0.07, 3, 'entrance sign');
  }
}

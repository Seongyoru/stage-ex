// Camera viewpoints, walk start points and per-level information of the app.
// All positions are in the WORLD frame of src/core/frame.js (metres, +X = house right,
// +Z = away from the stage, y = 0 = arena floor = outdoor ground).
import { LEVEL_Y, DECK_Y, Z, GLASS_BOX } from '../core/envelope.js';
import { findSeat, rowElevation } from '../core/seating.js';
import { SPEC } from '../core/spec.js';

const STAGE_H = SPEC.stage.height_m; // 1.8
const EYE = 1.6;

// standing in the centre aisle of the Upper Stand, row 17 of 28
const UPPER_ROW = 17;
const upperSeat = findSeat(7, UPPER_ROW, 142) || { x: 0, z: 83 };
const TOP_ROW_Z = (findSeat(7, 28, 142) || { z: 92.1 }).z; // row line of the last Upper Stand row
const UPPER_STANDPOINT = [0, rowElevation(7, UPPER_ROW) + EYE + 0.1, upperSeat.z + 0.15];

/**
 * Preset viewpoints. kind 'orbit' = turn around the target (exterior), 'look' = stand at
 * the position and look around (interior). `inside` marks views inside the building
 * (they force the interior light state while the camera flies there).
 */
export const VIEWS = [
  // --- exterior -----------------------------------------------------------------------
  // The north-west side is open (park, railway, river mouth); the Hilton and the K Tower
  // stand to the west of the arena. "overview" is the vantage of the operator's own aerial
  // photo (from across the Katabira river, the three rear facets in front, towers to the right).
  { id: 'overview', ko: '전경', group: 'out', kind: 'orbit', pos: [-78, 96, 384], target: [24, 16, 72], fov: 40, key: '1' },
  { id: 'front', ko: '메인 엔트런스 정면', group: 'out', kind: 'orbit', pos: [0, 24, 236], target: [0, 21, 95], key: '2' },
  // the classic press view: from the north corner at deck height, eave and colonnade in perspective
  { id: 'quarter', ko: '북측 코너 (처마와 열주)', group: 'out', kind: 'orbit', pos: [-112, 12.5, 160], target: [-6, 23, 84], fov: 56 },
  { id: 'eave', ko: '처마 근접', group: 'out', kind: 'orbit', pos: [31, 9.2, 126], target: [8, 31, 92], fov: 58, key: '3' },
  { id: 'flankR', ko: '남서 측면 (Hilton 쪽)', group: 'out', kind: 'orbit', pos: [236, 46, 14], target: [40, 18, 30], key: '4' },
  { id: 'flankL', ko: '북동 측면', group: 'out', kind: 'orbit', pos: [-236, 46, 14], target: [-40, 18, 30] },
  { id: 'stageend', ko: '무대 측 외관', group: 'out', kind: 'orbit', pos: [40, 64, -132], target: [0, 15, -28], key: '5' },
  { id: 'aerial', ko: '항공 뷰', group: 'out', kind: 'orbit', pos: [-150, 330, 400], target: [14, 0, 66], key: '6' },
  { id: 'plan', ko: '배치도 (수직)', group: 'out', kind: 'orbit', pos: [0, 520, 36.5], target: [0, 0, 36], fov: 32 },
  // --- interior -----------------------------------------------------------------------
  { id: 'upper', ko: 'Upper Stand에서 본 홀', group: 'in', kind: 'look', pos: UPPER_STANDPOINT, target: [0, 12, -14], fov: 66, inside: true, key: '7' },
  { id: 'stage', ko: '무대에서 본 객석', group: 'in', kind: 'look', pos: [0, STAGE_H + EYE, -2.5], target: [0, 15, 62], fov: 78, inside: true, key: '8' },
  { id: 'arena', ko: '아레나 플로어', group: 'in', kind: 'look', pos: [0, EYE, 30], target: [0, 6, -6], fov: 70, inside: true, key: '9' },
  { id: 'side', ko: 'Middle Stand 측면', group: 'in', kind: 'look', pos: [-56, 22.2, 43], target: [8, 5, 6], fov: 66, inside: true },
  {
    id: 'lounge5',
    ko: 'Lounge 5 (LEVEL 5)',
    group: 'in',
    kind: 'look',
    pos: [-16, LEVEL_Y[5] + EYE, (GLASS_BOX.zBack + GLASS_BOX.zFront) / 2 - 0.6],
    target: [14, LEVEL_Y[5] + 1.5, GLASS_BOX.zFront - 1.5],
    fov: 72,
    inside: true,
    key: '0',
  },
  {
    // as in the operator's photo: in front of the counter, the skyline behind the bar
    id: 'bar7',
    ko: 'Arena Bar 7 (LEVEL 7)',
    group: 'in',
    kind: 'look',
    pos: [1.5, LEVEL_Y[7] + 1.45, GLASS_BOX.zBack - 1.5],
    target: [0.4, LEVEL_Y[7] + 1.55, GLASS_BOX.zFront],
    fov: 80,
    inside: true,
  },
  { id: 'foyer', ko: '메인 홀 (LEVEL 3)', group: 'in', kind: 'look', pos: [0, LEVEL_Y[3] + EYE, GLASS_BOX.zFront - 2.4], target: [0, LEVEL_Y[3] + 2.2, 66], fov: 74, inside: true },
];

export const HOME_VIEW = 'overview';

export function viewById(id) {
  return VIEWS.find((v) => v.id === id) || null;
}

/**
 * Walk-mode start points: feet position (snapped to the floor found below it) and the
 * direction the walker initially faces (world XZ).
 */
export const WALK_STARTS = [
  { id: 'deck', ko: 'Arena Deck · 메인 엔트런스 앞', pos: [0, DECK_Y.arenaDeck, Z.rearEave + 3.2], face: [0, -1], inside: false },
  { id: 'l5', ko: 'LEVEL 5 콘코스', pos: [11, LEVEL_Y[5], 78.5], face: [-1, 0.15], inside: true },
  { id: 'arena', ko: '아레나 플로어', pos: [0, 0, 26], face: [0, -1], inside: true },
  { id: 'stage', ko: '무대 위', pos: [0, STAGE_H, -4], face: [0, 1], inside: true },
  { id: 'upper', ko: 'Upper Stand 맨 뒷줄', pos: [0, rowElevation(7, 28), TOP_ROW_Z - 0.1], face: [0, -1], inside: true },
  { id: 'steps', ko: 'Big Steps 아래 광장', pos: [13, DECK_Y.plaza, 128], face: [-0.1, -1], inside: false },
];

/** What is on each building LEVEL (Korean summary; proper names kept in English / Japanese). */
export const LEVEL_INFO = [
  { level: 1, y: LEVEL_Y[1], ko: 'ARENA 플로어 · 게이트 101–104 · 반입 동선', pub: true },
  { level: 2, y: LEVEL_Y[2], ko: '비공개 (백오브하우스)', pub: false },
  { level: 3, y: LEVEL_Y[3], ko: 'Arena Deck · Main / North / South Entrance · LOWER STAND 상단 · 게이트 301–304', pub: true },
  { level: 4, y: LEVEL_Y[4], ko: '중층 — 화장실 · 코인로커 4A / 4B', pub: true },
  { level: 5, y: LEVEL_Y[5], ko: 'MIDDLE STAND 콘코스 · 게이트 501–512 · Lounge 5 · Hilton 연결 브리지', pub: true },
  { level: 6, y: LEVEL_Y[6], ko: 'VIP K-Arena — VIP 라운지 · VIP BOX 11실', pub: false },
  { level: 7, y: LEVEL_Y[7], ko: 'UPPER STAND 콘코스 · 게이트 701–712 · Arena Bar 7', pub: true },
  { level: 8, y: LEVEL_Y[8], ko: '비공개 (설비)', pub: false },
  { level: 9, y: LEVEL_Y[9], ko: '비공개 (기계실 · 핀스폿 갤러리)', pub: false },
];

/** Camera pose that shows one isolated level from above. */
export function levelView(level) {
  const y = LEVEL_Y[level] ?? 0;
  return { kind: 'orbit', pos: [92, y + 118, 150], target: [0, y, 40], fov: 42 };
}

/** Camera poses for the three section directions (looking square at the cut). */
export function sectionView(axis, pos, flip) {
  if (axis === 'z') {
    // cross section: keep the stage side, look toward the stage (or the reverse when flipped)
    const d = flip ? -1 : 1;
    return { kind: 'orbit', pos: [d * 28, 31, pos + d * 245], target: [0, 17, pos], fov: 30 };
  }
  if (axis === 'y') return { kind: 'orbit', pos: [70, pos + 150, 150], target: [0, Math.max(pos - 6, 0), 36], fov: 40 };
  // longitudinal section: keep the house-left half, look from house right (or the reverse)
  const d = flip ? -1 : 1;
  return { kind: 'orbit', pos: [pos + d * 250, 34, 34 + 26], target: [pos, 17, 34], fov: 30 };
}

export const SECTION_RANGE = {
  x: { min: -92, max: 92, step: 0.5, def: 0 },
  z: { min: -34, max: 103, step: 0.5, def: 30 },
  y: { min: 0.5, max: 46, step: 0.25, def: LEVEL_Y[5] + 1.5 },
};

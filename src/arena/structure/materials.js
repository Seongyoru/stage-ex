// Material table of the structure module. Colours from research/00-consolidated.md §9.2
// (interior palette). Every visually distinct surface has its own id so a generated
// texture set can be attached to it later; `tile` = real size of one texture repeat (m).
import { mat, emissiveMat } from '../../core/materials.js';

const DEF = {
  // floors
  floorSealed: () => mat('structure.floorSealed', { color: '#8C857C', roughness: 0.28, metalness: 0, tile: 4 }),
  floorFoyer: () => mat('structure.floorFoyer', { color: '#8E8478', roughness: 0.2, metalness: 0, tile: 4 }),
  floorDark: () => mat('structure.floorDark', { color: '#3A3B3D', roughness: 0.25, metalness: 0, tile: 4 }),
  floorBoh: () => mat('structure.floorBoh', { color: '#9A968E', roughness: 0.6, metalness: 0, tile: 3 }),
  floorVipShell: () => mat('structure.floorVipShell', { color: '#2B2A2E', roughness: 0.5, metalness: 0, tile: 2 }),
  floorBackstage: () => mat('structure.floorBackstage', { color: '#7D7266', roughness: 0.55, metalness: 0, tile: 1.8 }),
  laneYellow: () => mat('structure.laneMarking', { color: '#D9A91E', roughness: 0.6, metalness: 0, tile: 1 }),
  tactile: () => mat('structure.tactileStrip', { color: '#C9CBCD', roughness: 0.35, metalness: 0.8, tile: 0.3 }),
  // structure
  soffit: () => mat('structure.soffit', { color: '#2A2A2A', roughness: 0.95, metalness: 0, tile: 2 }),
  bulkhead: () => mat('structure.bulkhead', { color: '#2E3034', roughness: 0.8, metalness: 0, tile: 2.4 }),
  beam: () => mat('structure.beamSteel', { color: '#3A3B3E', roughness: 0.9, metalness: 0, tile: 2 }),
  concreteFair: () => mat('structure.concreteFair', { color: '#BDBAB3', roughness: 0.7, metalness: 0, tile: 1.8 }),
  concreteCore: () => mat('structure.concreteCore', { color: '#8F8D88', roughness: 0.8, metalness: 0, tile: 2.4 }),
  stairNosing: () => mat('structure.stairNosing', { color: '#2E2F31', roughness: 0.8, metalness: 0, tile: 0.5 }),
  stairConcrete: () => mat('structure.stairConcrete', { color: '#8E8E8C', roughness: 0.6, metalness: 0, tile: 1.2 }),
  // wall finishes
  mortar: () => mat('structure.mortar', { color: '#55575C', roughness: 0.8, metalness: 0, tile: 2.4 }),
  mortarL3: () => mat('structure.mortarL3', { color: '#6E7075', roughness: 0.8, metalness: 0, tile: 2.4 }),
  mortarL7: () => mat('structure.mortarL7', { color: '#3A3B3F', roughness: 0.8, metalness: 0, tile: 2.4 }),
  red: () => mat('structure.redPaint', { color: '#D21F1B', roughness: 0.5, metalness: 0, tile: 2 }),
  redStair: () => mat('structure.redStair', { color: '#D4231D', roughness: 0.42, metalness: 0, tile: 1.5 }),
  redNosing: () => mat('structure.redStairNosing', { color: '#7E1512', roughness: 0.7, metalness: 0, tile: 0.5 }),
  redSteel: () => mat('structure.redSteel', { color: '#D7262B', roughness: 0.4, metalness: 0.3, tile: 1 }),
  blue: () => mat('structure.bluePaint', { color: '#1E3FB0', roughness: 0.5, metalness: 0, tile: 2 }),
  aubergine: () => mat('structure.aubergine', { color: '#3A2038', roughness: 0.7, metalness: 0, tile: 2 }),
  lockerWall: () => mat('structure.lockerWall', { color: '#8A3A66', roughness: 0.7, metalness: 0, tile: 4 }),
  wcWall: () => mat('structure.wcWallpaper', { color: '#3F8F9A', roughness: 0.7, metalness: 0, tile: 1.2 }),
  wcPartition: () => mat('structure.wcPartition', { color: '#CFC9BC', roughness: 0.5, metalness: 0, tile: 1 }),
  wcCounter: () => mat('structure.wcCounter', { color: '#8E9194', roughness: 0.35, metalness: 0, tile: 1 }),
  wcMirror: () => mat('structure.wcMirror', { color: '#B9C4C8', roughness: 0.06, metalness: 0.9, tile: 1 }),
  boh: () => mat('structure.bohWall', { color: '#B9B7B1', roughness: 0.85, metalness: 0, tile: 2.4 }),
  vipPanel: () => mat('structure.vipPanel', { color: '#3B2418', roughness: 0.25, metalness: 0, tile: 1.2 }),
  vipDoor: () => mat('structure.vipDoor', { color: '#1E2A5A', roughness: 0.4, metalness: 0.1, tile: 1 }),
  backstageWall: () => mat('structure.backstageWall', { color: '#D9D6CF', roughness: 0.8, metalness: 0, tile: 2.4 }),
  backstageBlue: () => mat('structure.backstageBlue', { color: '#3E5F8F', roughness: 0.75, metalness: 0, tile: 2.4 }),
  // doors and metalwork
  gateDoor: () => mat('structure.gateDoor', { color: '#C8201C', roughness: 0.45, metalness: 0.1, tile: 1 }),
  gateFrame: () => mat('structure.gateFrame', { color: '#8E1512', roughness: 0.5, metalness: 0.1, tile: 1 }),
  door: () => mat('structure.serviceDoor', { color: '#33353A', roughness: 0.55, metalness: 0.3, tile: 1 }),
  doorLight: () => mat('structure.backstageDoor', { color: '#8C8F94', roughness: 0.5, metalness: 0.3, tile: 1 }),
  steelBlack: () => mat('structure.steelBlack', { color: '#111214', roughness: 0.5, metalness: 0.5, tile: 1 }),
  steelGrey: () => mat('structure.steelGrey', { color: '#8A8C90', roughness: 0.5, metalness: 0.4, tile: 1 }),
  stainless: () => mat('structure.stainless', { color: '#B4B8BC', roughness: 0.3, metalness: 0.85, tile: 1 }),
  meshPanel: () => mat('structure.meshPanel', { color: '#17181A', roughness: 0.6, metalness: 0.4, transparent: true, opacity: 0.62, tile: 0.25 }),
  // services
  duct: () => mat('structure.ductFoil', { color: '#B8B8B8', roughness: 0.4, metalness: 0.8, tile: 1.2 }),
  pipe: () => mat('structure.pipe', { color: '#6F7376', roughness: 0.5, metalness: 0.6, tile: 1 }),
  tray: () => mat('structure.cableTray', { color: '#1B1C1E', roughness: 0.6, metalness: 0.5, tile: 1 }),
  plant: () => mat('structure.plantUnit', { color: '#8B9096', roughness: 0.55, metalness: 0.5, tile: 1.5 }),
  ledWarm: () => emissiveMat('structure.ledWarm', { color: '#FFA24A' }),
  ledWhite: () => emissiveMat('structure.ledWhite', { color: '#FFF4E2' }),
  ledBlue: () => emissiveMat('structure.ledBlue', { color: '#7FBFFF' }),
  spot: () => emissiveMat('structure.downlight', { color: '#FFF1D8' }),
  gateMonitor: () => emissiveMat('structure.gateMonitor', { color: '#22314F' }),
  fireLamp: () => emissiveMat('structure.fireLamp', { color: '#FF2A1E' }),
  exitSign: () => emissiveMat('structure.exitSign', { color: '#27C46B' }),
  // fittings
  hydrantBox: () => mat('structure.hydrantCabinet', { color: '#C9CBCC', roughness: 0.45, metalness: 0.3, tile: 1 }),
  locker: () => mat('structure.locker', { color: '#1B1B1D', roughness: 0.5, metalness: 0.5, tile: 1 }),
  lockerGrip: () => mat('structure.lockerGrip', { color: '#E9E2CF', roughness: 0.6, metalness: 0, tile: 1 }),
  kioskCanopy: () => mat('structure.kioskCanopy', { color: '#141416', roughness: 0.6, metalness: 0.3, tile: 1 }),
  kioskShell: () => mat('structure.kioskShell', { color: '#232427', roughness: 0.7, metalness: 0, tile: 1.2 }),
  // escalators and lifts
  escStep: () => mat('structure.escalatorStep', { color: '#2A2B2D', roughness: 0.5, metalness: 0.6, tile: 0.4 }),
  escSteel: () => mat('structure.escalatorSteel', { color: '#A9ADB2', roughness: 0.3, metalness: 0.85, tile: 1 }),
  escTruss: () => mat('structure.escalatorCladding', { color: '#1C1D20', roughness: 0.55, metalness: 0.4, tile: 1 }),
  escGlass: () => mat('structure.escalatorGlass', { color: '#BFD3DA', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.28, tile: 1 }),
  escRubber: () => mat('structure.escalatorHandrail', { color: '#0C0C0D', roughness: 0.6, metalness: 0, tile: 1 }),
  escLight: () => emissiveMat('structure.escalatorLight', { color: '#3D7BFF' }),
  liftDoor: () => mat('structure.liftDoor', { color: '#9A9DA0', roughness: 0.35, metalness: 0.8, tile: 1 }),
  liftCall: () => emissiveMat('structure.liftIndicator', { color: '#FFB347' }),
  // signs: canvas atlases, attached in signs.js (not tileable — exclude from the texture manifest)
  signs: () => mat('structure.signAtlas', { color: '#FFFFFF', roughness: 0.7, metalness: 0, tile: 1 }),
};

const cache = new Map();
/** Material by short id (see DEF). */
export function M(id) {
  let m = cache.get(id);
  if (!m) {
    if (!DEF[id]) throw new Error(`structure: unknown material "${id}"`);
    m = DEF[id]();
    cache.set(id, m);
  }
  return m;
}

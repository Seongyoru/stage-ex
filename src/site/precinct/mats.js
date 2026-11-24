// Material table of the precinct. Colours from research/00-consolidated.md §9.1 and
// model-spec palette.exterior. Every visually distinct surface has its own id; `tile` is
// the real-world size of one texture repeat in metres.
import * as THREE from 'three';
import { mat, emissiveMat } from '../../core/materials.js';

const decal = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };

const TABLE = {
  // --- decks, stairs, ground ---------------------------------------------------------------
  'precinct.paver': { color: '#A6A4A0', roughness: 0.8, metalness: 0, tile: 2.4 },
  'precinct.paverBand': { color: '#6C6B69', roughness: 0.8, metalness: 0, tile: 1.2, ...decal },
  'precinct.tactile': { color: '#B39A4E', roughness: 0.85, metalness: 0, tile: 0.3, ...decal },
  'precinct.drain': { color: '#3F4245', roughness: 0.45, metalness: 0.6, tile: 1.0, ...decal },
  'precinct.deckFascia': { color: '#E2E1DC', roughness: 0.65, metalness: 0, tile: 2.4 },
  'precinct.deckSoffit': { color: '#8F8E8A', roughness: 0.9, metalness: 0, tile: 3.0 },
  'precinct.deckColumn': { color: '#BDBAB3', roughness: 0.8, metalness: 0, tile: 1.8 },
  'precinct.podiumWall': { color: '#DCDDDD', roughness: 0.6, metalness: 0, tile: 1.2 },
  'precinct.podiumRecess': { color: '#6C727A', roughness: 0.7, metalness: 0, tile: 2.4 },
  'precinct.concrete': { color: '#C9C7C1', roughness: 0.8, metalness: 0, tile: 1.8 },
  'precinct.bigSteps': { color: '#A8705C', roughness: 0.75, metalness: 0, tile: 1.2 },
  'precinct.bigStepsNosing': { color: '#8B5746', roughness: 0.7, metalness: 0, tile: 1.2, ...decal },
  'precinct.granite': { color: '#B9B9B6', roughness: 0.7, metalness: 0, tile: 1.2 },
  'precinct.graniteNosing': { color: '#8E8F8D', roughness: 0.7, metalness: 0, tile: 1.2, ...decal },
  'precinct.forecourt': { color: '#D8D8D5', roughness: 0.6, metalness: 0, tile: 2.4 },
  'precinct.forecourtGrid': { color: '#484848', roughness: 0.6, metalness: 0, tile: 1.2, ...decal },
  'precinct.groundPaving': { color: '#A9A7A2', roughness: 0.85, metalness: 0, tile: 2.0 },
  'precinct.yardAsphalt': { color: '#4B4D50', roughness: 0.9, metalness: 0, tile: 4.0, ...decal },
  'precinct.yardLine': { color: '#E8E8E4', roughness: 0.7, metalness: 0, tile: 1.0, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 },
  'precinct.planting': { color: '#4F6B3A', roughness: 0.95, metalness: 0, tile: 1.5 },
  'precinct.treeTrunk': { color: '#5A4A3A', roughness: 0.95, metalness: 0, tile: 1.0 },
  'precinct.treeCrown': { color: '#6C9A45', roughness: 0.95, metalness: 0, tile: 2.0, flatShading: true },
  'precinct.planter': { color: '#3A3D40', roughness: 0.6, metalness: 0.3, tile: 1.0 },
  'precinct.brick': { color: '#8C3B2E', roughness: 0.8, metalness: 0, tile: 1.2 },
  'precinct.stoneBase': { color: '#E6E4DE', roughness: 0.6, metalness: 0, tile: 1.5 },
  'precinct.liftGlass': { color: '#3D4E57', roughness: 0.08, metalness: 0.1, tile: 1.5 },
  'precinct.darkMetal': { color: '#2A2C2E', roughness: 0.4, metalness: 0.6, tile: 1.0 },
  'precinct.shopGlass': { color: '#2C3941', roughness: 0.08, metalness: 0.1, tile: 3.0 },
  // --- street furniture --------------------------------------------------------------------------
  'precinct.railing': { color: '#25272A', roughness: 0.45, metalness: 0.5, tile: 1.0 },
  'precinct.redSteel': { color: '#D7262B', roughness: 0.4, metalness: 0.3, tile: 1.0 },
  'precinct.lampPole': { color: '#2E3032', roughness: 0.45, metalness: 0.5, tile: 1.0 },
  'precinct.banner': { color: '#1B2A6B', roughness: 0.9, metalness: 0, tile: 1.5, side: THREE.DoubleSide },
  'precinct.locker': { color: '#C8201E', roughness: 0.5, metalness: 0.5, tile: 0.9 },
  'precinct.totem': { color: '#151618', roughness: 0.35, metalness: 0.4, tile: 1.0 },
  'precinct.bench': { color: '#8A6A48', roughness: 0.7, metalness: 0, tile: 1.8 },
  'precinct.bollard': { color: '#9A9EA2', roughness: 0.35, metalness: 0.8, tile: 0.5 },
  'precinct.flagpole': { color: '#C4C8CC', roughness: 0.3, metalness: 0.8, tile: 1.0 },
  'precinct.flag': { color: '#F2F2EE', roughness: 0.9, metalness: 0, tile: 1.5, side: THREE.DoubleSide },
  'precinct.monument': { color: '#F4F4F0', roughness: 0.4, metalness: 0, tile: 1.0 },
  'precinct.visionFrame': { color: '#0F1012', roughness: 0.4, metalness: 0.3, tile: 1.0 },
  'precinct.kitchenCar': { color: '#E9E6DC', roughness: 0.5, metalness: 0.2, tile: 2.0 },
  'precinct.barrier': { color: '#2447A8', roughness: 0.5, metalness: 0.3, tile: 1.0 },
  // --- tents ---------------------------------------------------------------------------------------
  'precinct.tentMembrane': { color: '#EFEFEC', roughness: 0.6, metalness: 0, tile: 3.0, side: THREE.DoubleSide },
  'precinct.tentFrame': { color: '#8E9498', roughness: 0.45, metalness: 0.6, tile: 1.0 },
  'precinct.bayTentFrame': { color: '#ECECEA', roughness: 0.45, metalness: 0.3, tile: 1.0 },
  // --- sky-bridge -----------------------------------------------------------------------------------
  'skybridge.glass': { color: '#8FB3C2', roughness: 0.05, metalness: 0, tile: 1.2, transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false },
  'skybridge.frame': { color: '#1F2124', roughness: 0.4, metalness: 0.5, tile: 1.0 },
  'skybridge.floor': { color: '#77797C', roughness: 0.6, metalness: 0, tile: 1.2 },
  // --- Hilton Yokohama --------------------------------------------------------------------------------
  'hilton.pier': { color: '#E6E4DE', roughness: 0.6, metalness: 0, tile: 3.42 },
  'hilton.glass': { color: '#6E8CA3', roughness: 0.06, metalness: 0.15, tile: 3.42 },
  'hilton.spandrel': { color: '#58708A', roughness: 0.25, metalness: 0.2, tile: 3.42 },
  'hilton.frame': { color: '#A38D6C', roughness: 0.35, metalness: 0.7, tile: 1.0 },
  'hilton.endPanel': { color: '#D4D5D3', roughness: 0.6, metalness: 0.05, tile: 3.42 },
  'hilton.stoneBand': { color: '#B9B6AE', roughness: 0.7, metalness: 0, tile: 1.2 },
  'hilton.podiumGlass': { color: '#34424B', roughness: 0.08, metalness: 0.1, tile: 3.9 },
  'hilton.podiumFrame': { color: '#1B1C1E', roughness: 0.4, metalness: 0.5, tile: 1.0 },
  'hilton.signBand': { color: '#6E1F1F', roughness: 0.6, metalness: 0.1, tile: 2.0 },
  'hilton.mansard': { color: '#3C3F45', roughness: 0.6, metalness: 0.2, tile: 0.6 },
  'hilton.roof': { color: '#7C7F82', roughness: 0.85, metalness: 0, tile: 3.0 },
  'hilton.treeColumn': { color: '#EDECE8', roughness: 0.5, metalness: 0.1, tile: 1.0 },
  'hilton.pilotisFloor': { color: '#B4B2AD', roughness: 0.7, metalness: 0, tile: 2.4, ...decal },
  // --- K Tower Yokohama ---------------------------------------------------------------------------------
  'ktower.glass': { color: '#2C4156', roughness: 0.05, metalness: 0, tile: 4.3 },
  'ktower.spandrel': { color: '#22313F', roughness: 0.2, metalness: 0.05, tile: 4.3 },
  'ktower.fin': { color: '#ECECE8', roughness: 0.5, metalness: 0.1, tile: 4.3 },
  'ktower.panel': { color: '#DADBDA', roughness: 0.55, metalness: 0.05, tile: 4.3 },
  'ktower.mullion': { color: '#1A2028', roughness: 0.4, metalness: 0.6, tile: 1.0 },
  'ktower.baseGlass': { color: '#2B3B48', roughness: 0.08, metalness: 0.1, tile: 3.6 },
  'ktower.roof': { color: '#74777A', roughness: 0.85, metalness: 0, tile: 3.0 },
  // --- annex pavilion and link wing --------------------------------------------------------------------------
  'annex.granite': { color: '#BEBDB8', roughness: 0.7, metalness: 0, tile: 1.2 },
  'annex.band': { color: '#D9D7D0', roughness: 0.65, metalness: 0, tile: 1.2 },
  'annex.glass': { color: '#2F3D46', roughness: 0.08, metalness: 0.1, tile: 3.5 },
  'annex.frame': { color: '#17181A', roughness: 0.4, metalness: 0.5, tile: 1.0 },
  'annex.roof': { color: '#34373C', roughness: 0.6, metalness: 0.2, tile: 0.6 },
  'annex.roofTrim': { color: '#E9E8E3', roughness: 0.6, metalness: 0, tile: 1.0 },
  'annex.linkGlass': { color: '#33434D', roughness: 0.06, metalness: 0.15, tile: 1.2 },
  'annex.terrace': { color: '#7A6650', roughness: 0.8, metalness: 0, tile: 1.5 },
  // --- Takashima Suisaisen Deck -----------------------------------------------------------------------------------
  'tdeck.girder': { color: '#E4E5E3', roughness: 0.45, metalness: 0.3, tile: 2.0 },
  'tdeck.paving': { color: '#B5B5B2', roughness: 0.85, metalness: 0, tile: 1.0 },
  'tdeck.railing': { color: '#EDEDED', roughness: 0.4, metalness: 0.3, tile: 1.0 },
  'tdeck.screen': { color: '#CFE0E6', roughness: 0.05, metalness: 0, tile: 2.0, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false },
  'tdeck.pier': { color: '#C2C0BA', roughness: 0.85, metalness: 0, tile: 1.8 },
};

// Emissive ids. `day` = colour when the light source is off, `night` = when it is on.
const EMISSIVE = {
  'precinct.lampLantern': { day: '#DCD8CC', night: '#FFD9A0' },
  'precinct.stepLight': { day: '#8B5746', night: '#FFB060' },
  'precinct.totemScreen': { day: '#2B3F6E', night: '#9DBBFF' },
  'precinct.vision': { day: '#7A5BC8', night: '#B48CFF' },
  'precinct.tentGlow': { day: '#D9D0BC', night: '#FFDCA8' },
  'precinct.liftGlow': { day: '#8E6A4A', night: '#FFB868' },
  'precinct.yardLight': { day: '#DAD6C8', night: '#FFE9C0' },
  'skybridge.light': { day: '#C9CCD0', night: '#FFF1D6' },
  'hilton.sign': { day: '#FFFFFF', night: '#FFFFFF' },
  'hilton.windowLit': { day: '#6E8CA3', night: '#FFD8A0' },
  'hilton.windowLitDim': { day: '#6E8CA3', night: '#C99A5E' },
  'hilton.crownLight': { day: '#E6E4DE', night: '#FFF4E0' },
  'hilton.pierLight': { day: '#E6E4DE', night: '#FFE7BF' },
  'hilton.podiumGlow': { day: '#232B31', night: '#FFC47A' },
  'hilton.treeLed': { day: '#F4F4F0', night: '#FFFFFF' },
  'ktower.windowLit': { day: '#2C4156', night: '#DDEBFF' },
  'ktower.windowLitDim': { day: '#2C4156', night: '#8FA6C4' },
  'ktower.crownLight': { day: '#ECECE8', night: '#FFFFFF' },
  'ktower.cornerLight': { day: '#B03A3A', night: '#FF3B30' },
  'ktower.baseGlow': { day: '#1F2A33', night: '#FFD9A8' },
  'annex.glow': { day: '#1F282E', night: '#FFC98A' },
  'tdeck.light': { day: '#E0E0DC', night: '#FFF2D8' },
};

export function M(id) {
  const p = TABLE[id];
  if (!p) {
    if (EMISSIVE[id]) return E(id);
    throw new Error(`precinct: unknown material id ${id}`);
  }
  return mat(id, p);
}
export function E(id, extra = {}) {
  const p = EMISSIVE[id];
  if (!p) throw new Error(`precinct: unknown emissive id ${id}`);
  const m = emissiveMat(id, { color: p.day, ...extra });
  if (m.userData.day === undefined) {
    m.userData.day = p.day;
    m.userData.night = p.night;
  }
  return m;
}
export const EMISSIVE_IDS = Object.keys(EMISSIVE);
export const MATERIAL_IDS = Object.keys(TABLE);

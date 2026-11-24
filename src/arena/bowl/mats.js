// Materials of the seating bowl. Colours follow research/00-consolidated.md section 9.2
// (interior palette); `tile` is the real-world size of one texture repeat in metres.
import { mat, emissiveMat } from '../../core/materials.js';

export function bowlMaterials() {
  return {
    // arena floor
    arenaFloor: mat('bowl.arenaFloor', { color: '#8F8A80', roughness: 0.35, metalness: 0, tile: 6 }),
    floorCover: mat('bowl.floorCoverStrip', { color: '#A7A299', roughness: 0.5, metalness: 0.1, tile: 1.2, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    floorLine: mat('bowl.floorLine', { color: '#E6E4DC', roughness: 0.6, metalness: 0, tile: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    // terraces
    terrace: mat('bowl.terrace', { color: '#8E8E8C', roughness: 0.7, metalness: 0, tile: 2 }),
    riser: mat('bowl.terraceRiser', { color: '#848482', roughness: 0.75, metalness: 0, tile: 2 }),
    nosing: mat('bowl.nosingLine', { color: '#ECEADF', roughness: 0.5, metalness: 0, tile: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    aisleLight: emissiveMat('bowl.aisleLight', { color: '#FFB45A', polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    crossAisleLight: emissiveMat('bowl.crossAisleLight', { color: '#8E63F5', polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    teleStepLight: emissiveMat('bowl.teleStepLight', { color: '#3E6BFF', polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    // fronts
    parapet: mat('bowl.parapetConcrete', { color: '#D8D2C4', roughness: 0.7, metalness: 0, tile: 3 }),
    fasciaDark: mat('bowl.fasciaDark', { color: '#3F4146', roughness: 0.55, metalness: 0.3, tile: 3.3 }),
    fasciaRecess: mat('bowl.fasciaRecess', { color: '#1B1C1F', roughness: 0.8, metalness: 0.1, tile: 2 }),
    nozzle: mat('bowl.nozzlePort', { color: '#09090A', roughness: 0.4, metalness: 0.4, tile: 0.5, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    coveLight: emissiveMat('bowl.fasciaCoveLight', { color: '#FFE2B8', polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    balconyPanel: mat('bowl.balconyPanel', { color: '#E9E1EC', roughness: 0.35, metalness: 0, transparent: true, opacity: 0.55, tile: 1.2 }),
    railSteel: mat('bowl.railSteel', { color: '#8A8C90', roughness: 0.5, metalness: 0.4, tile: 1 }),
    handrail: mat('bowl.handrail', { color: '#111214', roughness: 0.5, metalness: 0.5, tile: 1 }),
    // undersides and walls
    soffit: mat('bowl.soffit', { color: '#1E1F22', roughness: 0.9, metalness: 0, tile: 3 }),
    downlight: emissiveMat('bowl.soffitDownlight', { color: '#FFF1D6' }),
    rearWall: mat('bowl.rearWallDark', { color: '#26272B', roughness: 0.9, metalness: 0, tile: 2 }),
    frontWallDark: mat('bowl.frontWallDark', { color: '#1A1B1E', roughness: 0.8, metalness: 0.1, tile: 2.4 }),
    // vomitories
    portal: mat('bowl.portalConcrete', { color: '#DDD3C8', roughness: 0.7, metalness: 0, tile: 2.7 }),
    tunnelWall: mat('bowl.tunnelWall', { color: '#55575C', roughness: 0.8, metalness: 0, tile: 2 }),
    tunnelCeiling: mat('bowl.tunnelCeiling', { color: '#2A2A2A', roughness: 0.95, metalness: 0, tile: 2 }),
    tunnelFloor: mat('bowl.tunnelFloor', { color: '#8C857C', roughness: 0.3, metalness: 0, tile: 3 }),
    exitSign: emissiveMat('bowl.exitSign', { color: '#27D17F' }),
    // telescopic stand
    teleDeck: mat('bowl.teleDeck', { color: '#2C2F36', roughness: 0.7, metalness: 0.2, tile: 1 }),
    teleRiser: mat('bowl.teleRiser', { color: '#141518', roughness: 0.6, metalness: 0.3, tile: 1 }),
    teleCheek: mat('bowl.teleCheek', { color: '#0E0F11', roughness: 0.6, metalness: 0.3, tile: 2 }),
    // VIP boxes
    vipParapet: mat('bowl.vipParapet', { color: '#8D8A84', roughness: 0.7, metalness: 0, tile: 3 }),
    vipWall: mat('bowl.vipWall', { color: '#1F1F22', roughness: 0.7, metalness: 0.1, tile: 2 }),
    vipSoffit: mat('bowl.vipSoffit', { color: '#131315', roughness: 0.8, metalness: 0.1, tile: 1.2 }),
    vipCarpetBalcony: mat('bowl.vipBalconyCarpet', { color: '#4D69A6', roughness: 0.95, metalness: 0, tile: 2 }),
    vipGlass: mat('bowl.vipGlass', { color: '#A9BCC6', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.22, depthWrite: false, tile: 1 }),
    vipMullion: mat('bowl.vipMullion', { color: '#17181A', roughness: 0.4, metalness: 0.6, tile: 1 }),
  };
}

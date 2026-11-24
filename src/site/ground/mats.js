// Every material of the ground module, by stable id (textures are attached later by id).
// Flat ground layers sit a few centimetres apart; so that they never z-fight when seen from
// several hundred metres, the LOWER layers are pushed back with polygonOffset (the top layer
// has none). Other modules' surfaces at y = 0 therefore always win against the base ground.
import { mat } from '../../core/materials.js';

const layer = (n) => ({ polygonOffset: true, polygonOffsetFactor: n, polygonOffsetUnits: n * 2 });

export function groundMaterials() {
  return {
    // --- terrain
    ground: mat('site.ground', { color: '#B4B2AC', roughness: 0.92, metalness: 0, tile: 4, ...layer(6) }),
    yard: mat('site.yardAsphalt', { color: '#5E6165', roughness: 0.9, metalness: 0, tile: 6, ...layer(6) }),
    subfloor: mat('site.arenaSubfloor', { color: '#8D8C88', roughness: 0.9, metalness: 0, tile: 4 }),
    lot: mat('site.lotPaving', { color: '#C2BDB3', roughness: 0.9, metalness: 0, tile: 3, ...layer(5) }),
    vacant: mat('site.vacantLot', { color: '#A8916A', roughness: 1, metalness: 0, tile: 12, ...layer(5) }),
    vacantGrass: mat('site.vacantGrass', { color: '#86945A', roughness: 1, metalness: 0, tile: 10, ...layer(5) }),
    construction: mat('site.constructionGround', { color: '#B39A78', roughness: 1, metalness: 0, tile: 10, ...layer(5) }),
    parking: mat('site.parkingAsphalt', { color: '#6A6C6F', roughness: 0.9, metalness: 0, tile: 10, ...layer(5) }),
    meadow: mat('site.meadow', { color: '#869A52', roughness: 1, metalness: 0, tile: 8, ...layer(4) }),
    park: mat('site.parkLawn', { color: '#7FA84A', roughness: 0.95, metalness: 0, tile: 6, ...layer(4) }),
    grass: mat('site.grassVerge', { color: '#86AD52', roughness: 0.95, metalness: 0, tile: 6, ...layer(3) }),
    garden: mat('site.gardenPlanting', { color: '#5E8A3E', roughness: 1, metalness: 0, tile: 4, ...layer(3) }),
    beach: mat('site.tidalBeach', { color: '#A9A294', roughness: 0.95, metalness: 0, tile: 3 }),
    stoneSteps: mat('site.stoneSteps', { color: '#B9B9B6', roughness: 0.8, metalness: 0, tile: 2 }),
    water: mat('site.water', { color: '#3F5A55', roughness: 0.12, metalness: 0, tile: 12 }),
    waterSection: mat('site.waterSection', { color: '#2C4947', roughness: 0.35, metalness: 0, tile: 12 }),
    quayWall: mat('site.quayWall', { color: '#9C9A93', roughness: 0.9, metalness: 0, tile: 3 }),
    quayCoping: mat('site.quayCoping', { color: '#BDBCB7', roughness: 0.85, metalness: 0, tile: 2 }),
    plinth: mat('site.plinth', { color: '#2A2C2F', roughness: 0.75, metalness: 0, tile: 8 }),
    plinthEdge: mat('site.plinthEdge', { color: '#8E8B84', roughness: 0.9, metalness: 0, tile: 4 }),
    // --- roads and paths
    asphalt: mat('site.asphalt', { color: '#4A4D51', roughness: 0.88, metalness: 0, tile: 6, ...layer(1) }),
    marking: mat('site.roadMarking', { color: '#E9E9E4', roughness: 0.6, metalness: 0, tile: 1 }),
    sidewalk: mat('site.sidewalk', { color: '#B5ABA4', roughness: 0.9, metalness: 0, tile: 2, ...layer(2) }),
    kerb: mat('site.kerb', { color: '#C9C7C1', roughness: 0.8, metalness: 0, tile: 1 }),
    footpath: mat('site.footpath', { color: '#C9C2B4', roughness: 0.9, metalness: 0, tile: 2, ...layer(2.4) }),
    promenade: mat('site.promenade', { color: '#BDB6AB', roughness: 0.9, metalness: 0, tile: 2, ...layer(2.6) }),
    cycle: mat('site.cyclePath', { color: '#9A7B6B', roughness: 0.9, metalness: 0, tile: 4, ...layer(1.8) }),
    steps: mat('site.pathSteps', { color: '#B9B9B6', roughness: 0.8, metalness: 0, tile: 1, ...layer(2.2) }),
    median: mat('site.medianPlanting', { color: '#6F9648', roughness: 1, metalness: 0, tile: 3, ...layer(1.5) }),
    // --- railway
    ballast: mat('site.ballast', { color: '#7A736A', roughness: 1, metalness: 0, tile: 2 }),
    sleeper: mat('site.sleeper', { color: '#A9A69E', roughness: 0.9, metalness: 0, tile: 1 }),
    rail: mat('site.rail', { color: '#6A6058', roughness: 0.45, metalness: 0.3, tile: 1 }),
    railFence: mat('site.railFence', { color: '#C4C8CA', roughness: 0.6, metalness: 0.1, tile: 2, transparent: true, opacity: 0.3, side: 2, depthWrite: false }),
    catenary: mat('site.catenarySteel', { color: '#8C9196', roughness: 0.6, metalness: 0.2, tile: 1 }),
    railGirder: mat('site.railGirder', { color: '#7A3B2B', roughness: 0.8, metalness: 0.1, tile: 2 }),
    pier: mat('site.bridgePier', { color: '#A5A29A', roughness: 0.9, metalness: 0, tile: 3 }),
    // --- road bridges
    bridgeDeck: mat('site.bridgeDeck', { color: '#AFAAA2', roughness: 0.9, metalness: 0, tile: 3, ...layer(3) }),
    bridgeParapet: mat('site.bridgeParapet', { color: '#C4C2BC', roughness: 0.85, metalness: 0, tile: 2 }),
    bridgeGirder: mat('site.bridgeGirder', { color: '#9A9892', roughness: 0.8, metalness: 0.1, tile: 3 }),
    bridgeRail: mat('site.bridgeRailing', { color: '#D4D6D6', roughness: 0.5, metalness: 0.2, tile: 1 }),
    tunnelDark: mat('site.tunnelDark', { color: '#0B0C0D', roughness: 1, metalness: 0, tile: 1 }),
    // --- pedestrian bridges
    fbSteel: mat('site.footbridgeSteel', { color: '#ECEDEB', roughness: 0.55, metalness: 0.05, tile: 1 }),
    fbDeck: mat('site.footbridgeDeck', { color: '#A6A4A0', roughness: 0.85, metalness: 0, tile: 1 }),
    fbGlass: mat('site.footbridgeGlass', { color: '#7FA0AE', roughness: 0.1, metalness: 0, tile: 1, transparent: true, opacity: 0.55 }),
    skyDeck: mat('site.skywalkDeck', { color: '#B8B5AE', roughness: 0.85, metalness: 0, tile: 2 }),
    skyRail: mat('site.skywalkRailing', { color: '#D8D9D6', roughness: 0.5, metalness: 0.15, tile: 1 }),
    quayRail: mat('site.quayRailing', { color: '#5B6166', roughness: 0.55, metalness: 0.2, tile: 1 }),
    parkingLine: mat('site.parkingLine', { color: '#DADAD4', roughness: 0.7, metalness: 0, tile: 1, polygonOffset: true, polygonOffsetFactor: 4, polygonOffsetUnits: 8 }),
    // --- trees
    trunk: mat('site.treeTrunk', { color: '#5A4A3A', roughness: 0.95, metalness: 0, tile: 1 }),
    crownA: mat('site.treeCrownZelkova', { color: '#6C9A45', roughness: 0.95, metalness: 0, tile: 2, flatShading: true }),
    crownB: mat('site.treeCrownEvergreen', { color: '#467A3A', roughness: 0.95, metalness: 0, tile: 2, flatShading: true }),
    crownC: mat('site.treeCrownConifer', { color: '#33603C', roughness: 0.95, metalness: 0, tile: 2, flatShading: true }),
  };
}

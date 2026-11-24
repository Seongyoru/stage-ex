// Material table of the venues module. Every visually distinct surface has its own id so a
// generated texture set can be attached later (src/core/materials.js applyTextureManifest).
// Colours: research/00-consolidated.md section 9.2 and research/interior-facilities.md section 9
// (all ESTIMATED from photographs). `tile` = real size in metres of one texture repeat.
import * as THREE from 'three';
import { mat, emissiveMat } from '../../core/materials.js';

const LIT = {
  // --- shared metalwork / stone ---------------------------------------------------------
  'venues.blackSteel': { color: '#25272A', roughness: 0.5, metalness: 0.5, tile: 1 },
  'venues.brass': { color: '#B8943F', roughness: 0.32, metalness: 0.65, tile: 0.5 },
  'venues.brassRibbed': { color: '#BF9B42', roughness: 0.35, metalness: 0.65, tile: 0.1 },
  'venues.goldPolished': { color: '#D8B25A', roughness: 0.15, metalness: 0.7, tile: 0.5 },
  'venues.blackStone': { color: '#0B0B0C', roughness: 0.1, metalness: 0, tile: 1.5 },
  'venues.charcoalPanel': { color: '#3A3B3F', roughness: 0.8, metalness: 0, tile: 2 },
  'venues.bottleGlass': { color: '#FFFFFF', roughness: 0.15, metalness: 0.1, tile: 0.3 },
  // --- Lounge 5 ---------------------------------------------------------------------------
  'venues.lounge5Floor': { color: '#8C857C', roughness: 0.25, metalness: 0, tile: 4 },
  'venues.lounge5TableTop': { color: '#8A4B2A', roughness: 0.6, metalness: 0, tile: 1.8 },
  'venues.lounge5Frame': { color: '#2E3136', roughness: 0.5, metalness: 0.5, tile: 1 },
  'venues.lounge5Bench': { color: '#2F4FA8', roughness: 0.5, metalness: 0.4, tile: 1 },
  'venues.lounge5DarkTop': { color: '#232427', roughness: 0.45, metalness: 0, tile: 1.8 },
  'venues.shellLeatherGrey': { color: '#3B3C40', roughness: 0.6, metalness: 0, tile: 0.5 },
  'venues.shellPale': { color: '#D6D3CC', roughness: 0.55, metalness: 0, tile: 0.5 },
  'venues.lounge5RedWall': { color: '#D21F1B', roughness: 0.5, metalness: 0, tile: 2 },
  'venues.portholeMirror': { color: '#C6CBD0', roughness: 0.05, metalness: 0.8, tile: 2 },
  'venues.signBoard': { color: '#2C2D31', roughness: 0.75, metalness: 0, tile: 2 },
  'venues.signWhite': { color: '#EDEDE8', roughness: 0.6, metalness: 0, tile: 1 },
  'venues.signRed': { color: '#D21F1B', roughness: 0.55, metalness: 0, tile: 1 },
  'venues.signageBezel': { color: '#E6E6E3', roughness: 0.4, metalness: 0.1, tile: 1 },
  'venues.signageInk': { color: '#16171A', roughness: 0.6, metalness: 0, tile: 1 },
  'venues.lounge5Bulkhead': { color: '#66676A', roughness: 0.85, metalness: 0, tile: 2.4 },
  'venues.trackBlack': { color: '#151516', roughness: 0.5, metalness: 0.4, tile: 1 },
  // --- Arena Bar 7 ------------------------------------------------------------------------
  'venues.bar7Floor': { color: '#3A3B3D', roughness: 0.22, metalness: 0, tile: 4 },
  'venues.bar7Mosaic': { color: '#C9A65A', roughness: 0.3, metalness: 0.45, tile: 0.95, emissive: '#3A2A0C', emissiveIntensity: 1 },
  'venues.bar7Plinth': { color: '#0D0D0E', roughness: 0.3, metalness: 0.1, tile: 1 },
  'venues.bar7WorkCounter': { color: '#2B2C2E', roughness: 0.35, metalness: 0.6, tile: 1 },
  'venues.bar7MirrorDeco': { color: '#B9BDC0', roughness: 0.08, metalness: 0.8, tile: 1.3 },
  'venues.bar7Ceiling': { color: '#2A2B2D', roughness: 0.9, metalness: 0, tile: 2 },
  'venues.bar7TableTop': { color: '#1D1D1F', roughness: 0.3, metalness: 0, tile: 0.7 },
  'venues.lowChairLeather': { color: '#6B4630', roughness: 0.55, metalness: 0, tile: 0.5 },
  // --- VIP lounge -------------------------------------------------------------------------
  'venues.vipCarpetRed': { color: '#B3121F', roughness: 0.95, metalness: 0, tile: 4 },
  'venues.vipMarbleBlack': { color: '#0E0E10', roughness: 0.1, metalness: 0, tile: 1.2 },
  'venues.vipMarbleWhite': { color: '#EDEDED', roughness: 0.12, metalness: 0, tile: 1.2 },
  'venues.vipMarblePortal': { color: '#17140F', roughness: 0.1, metalness: 0, tile: 1.5 },
  'venues.vipMacassar': { color: '#3B2418', roughness: 0.15, metalness: 0, tile: 1.2 },
  'venues.vipGoldLeaf': { color: '#D1A63B', roughness: 0.3, metalness: 0.6, tile: 0.4 },
  'venues.vipValance': { color: '#D6AC40', roughness: 0.28, metalness: 0.55, tile: 0.9, side: THREE.DoubleSide },
  'venues.vipVelvetRed': { color: '#8E1220', roughness: 0.9, metalness: 0, tile: 0.5 },
  'venues.vipLeatherBurgundy': { color: '#7A1F2A', roughness: 0.5, metalness: 0, tile: 0.5 },
  'venues.vipLeatherTan': { color: '#A8683C', roughness: 0.5, metalness: 0, tile: 0.5 },
  'venues.vipGranite': { color: '#101012', roughness: 0.15, metalness: 0.1, tile: 0.8 },
  'venues.vipCushion': { color: '#D8C39A', roughness: 0.5, metalness: 0.1, tile: 0.3 },
  'venues.vipMosaicGold': { color: '#D0A744', roughness: 0.25, metalness: 0.45, tile: 1, emissive: '#4A3208', emissiveIntensity: 1 },
  'venues.vipCeilingWhite': { color: '#EFEBE2', roughness: 0.8, metalness: 0, tile: 2 },
  'venues.vipMirrorCeiling': { color: '#B9AE98', roughness: 0.06, metalness: 0.8, tile: 1.2 },
  'venues.vipBronzeMirror': { color: '#6E655A', roughness: 0.1, metalness: 0.75, tile: 1.2 },
  'venues.vipNavySign': { color: '#141B3A', roughness: 0.5, metalness: 0, tile: 1 },
  'venues.vipFretwork': { color: '#D4B060', roughness: 0.3, metalness: 0.6, tile: 0.3 },
  'venues.pianoBlack': { color: '#050506', roughness: 0.05, metalness: 0, tile: 1 },
  'venues.vipCorridorCarpet': { color: '#232A52', roughness: 0.95, metalness: 0, tile: 3 },
  'venues.vipWoodDark': { color: '#2A1A12', roughness: 0.4, metalness: 0, tile: 0.6 },
  // --- VIP BOX rooms ----------------------------------------------------------------------
  'venues.vipBoxCarpet': { color: '#1E2A5A', roughness: 0.95, metalness: 0, tile: 3 },
  'venues.vipAntiqueMirror': { color: '#AEB2B2', roughness: 0.1, metalness: 0.8, tile: 1 },
  'venues.vipBoxCeiling': { color: '#DDD8CC', roughness: 0.9, metalness: 0, tile: 1.5 },
  'venues.vipSofaBoucle': { color: '#D99A1E', roughness: 0.95, metalness: 0, tile: 0.4 },
  'venues.vipDiningFabric': { color: '#D9D2C2', roughness: 0.8, metalness: 0, tile: 0.25 },
  'venues.vipKitchenFront': { color: '#1A1512', roughness: 0.2, metalness: 0, tile: 1 },
  // --- main foyer features ------------------------------------------------------------------
  'venues.foyerMuralRed': { color: '#D21F1B', roughness: 0.5, metalness: 0, tile: 2 },
  'venues.foyerLogoCream': { color: '#F1E9D2', roughness: 0.6, metalness: 0, tile: 1 },
  'venues.foyerLogoBlack': { color: '#111111', roughness: 0.6, metalness: 0, tile: 1 },
  'venues.totemBody': { color: '#18191B', roughness: 0.4, metalness: 0.3, tile: 1 },
  'venues.laneBelt': { color: '#101114', roughness: 0.8, metalness: 0, tile: 0.5 },
  'venues.laneChrome': { color: '#C9CCD0', roughness: 0.2, metalness: 0.8, tile: 0.5 },
  // --- kiosks ---------------------------------------------------------------------------------
  'venues.kioskBack': { color: '#1C1D1F', roughness: 0.7, metalness: 0, tile: 2 },
  'venues.kioskCounterTop': { color: '#0E0E0F', roughness: 0.25, metalness: 0.1, tile: 2 },
  'venues.kioskCounterFront': { color: '#2A2B2D', roughness: 0.5, metalness: 0.3, tile: 2 },
  'venues.kioskFridgeBody': { color: '#151517', roughness: 0.4, metalness: 0.5, tile: 1 },
  'venues.kioskTerminal': { color: '#D8D8D8', roughness: 0.5, metalness: 0, tile: 0.3 },
};

const GLOW = {
  'venues.ledCool': { color: '#9CCBFF' }, // blue-white linear LED and cove (L7)
  'venues.spotLens': { color: '#FFE2B8' }, // lens of track spots and recessed downlights
  'venues.signagePortrait': { color: '#F1F1EC' }, // portrait digital signage screens
  'venues.portholeHalo': { color: '#FF7A30' }, // halo ring of the Lounge 5 porthole mirror
  'venues.bar7LedDot': { color: '#FFE9C0' }, // LED dots in the bar plinth, floor uplights
  'venues.bar7BottleRiser': { color: '#FFF1D0' }, // under-lit bottle steps of the back bar
  'venues.chandelierGlass': { color: '#FFD9A0' }, // ribbed-glass lanterns of the Arena Bar 7 chandeliers, block lamp
  'venues.vipRingGlass': { color: '#FFE7B8', side: THREE.DoubleSide }, // frosted glass rings of the VIP chandelier
  'venues.vipLantern': { color: '#FFD08A' }, // VIP lounge lantern pendants
  'venues.vipSconce': { color: '#FFE6B0' }, // ribbed-glass wall sconces, pendant tubes
  'venues.vipGoldBacklit': { color: '#E8A92C' }, // back-lit gold-leaf panel of the VIP entrance
  'venues.vipMonitor': { color: '#3B4A8A' }, // wall monitors in the VIP rooms (live relay)
  'venues.laneIndicator': { color: '#3CE07A' }, // ticket-reader ready light
  'venues.laneSign': { color: '#F2F2F2' }, // lane number flags above the ticket lanes
  'venues.kioskGlowRed': { color: '#E0201C' }, // back-lit kiosk counter front L1 / L3 / L5
  'venues.kioskGlowBlue': { color: '#1E3FB0' }, // back-lit kiosk counter front L7
  'venues.kioskMenu': { color: '#DDE6F5' }, // kiosk menu monitors
  'venues.kioskFridgeLight': { color: '#EAF4FF' }, // lit interior of the glass-door fridges
  'venues.kioskStockBlue': { color: '#2F6FD0' }, // rows of water bottles in the fridges (blue labels)
  'venues.kioskStockGreen': { color: '#7DB83A' }, // rows of green-tea bottles
  'venues.kioskStockRed': { color: '#B81E1E' }, // rows of cola bottles
  'venues.kioskMenuPurple': { color: '#6A2FB8' }, // alcohol menu slide (purple ground)
};

/** Material by id (created on first use through the shared registry). */
export function M(id) {
  if (LIT[id]) return mat(id, LIT[id]);
  if (GLOW[id]) return emissiveMat(id, GLOW[id]);
  throw new Error(`venues: unknown material id "${id}"`);
}

/** Additive vertex-coloured glow (uplight pools on the bar fronts). */
export function glowMaterial() {
  return emissiveMat('venues.uplightGlow', {
    color: '#FFFFFF',
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

export const MATERIAL_IDS = [...Object.keys(LIT), ...Object.keys(GLOW), 'venues.uplightGlow'];

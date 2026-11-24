// Material table of the stage module. Colours follow research/00-consolidated.md 9.2
// (interior palette) and the production photographs; every visually distinct surface
// has its own id so a generated texture set can be attached later.
import * as THREE from 'three';
import { mat, emissiveMat } from '../../core/materials.js';

export const LENS_OFF = '#1b1f25';
export const WORK_ON = '#ffe7c0';
export const WORK_OFF = '#2a2620';

export function stageMaterials() {
  const m = {};
  const std = (id, params) => (m[id] = mat(id, params));
  const emi = (id, params) => (m[id] = emissiveMat(id, params));

  // --- basic stage kit ---------------------------------------------------------------
  std('stage.deck', { color: '#55565A', roughness: 0.6, metalness: 0, tile: 1.8167 });
  std('stage.steel', { color: '#101113', roughness: 0.55, metalness: 0.5, tile: 1 });
  std('stage.rail', { color: '#111214', roughness: 0.5, metalness: 0.5, tile: 1 });
  std('stage.ramp', { color: '#3A3B3E', roughness: 0.85, metalness: 0, tile: 1.2 });
  std('stage.skirt', { color: '#0B0B0C', roughness: 1, metalness: 0, tile: 0.6, side: THREE.DoubleSide });
  std('stage.rack', { color: '#1A1B1D', roughness: 0.5, metalness: 0.3, tile: 0.6 });
  emi('stage.rackPanel', { color: '#0e5e3d' });
  std('stage.barricade', { color: '#17181A', roughness: 0.5, metalness: 0.5, tile: 1 });

  // --- rigging -----------------------------------------------------------------------
  std('rig.grid', { color: '#0E0F11', roughness: 0.8, metalness: 0.3, tile: 1 });
  std('rig.plate', { color: '#E6C229', roughness: 0.6, metalness: 0, tile: 0.6 });
  std('rig.hoist', { color: '#2B2D30', roughness: 0.6, metalness: 0.4, tile: 1 });
  std('rig.wire', { color: '#9A9EA3', roughness: 0.4, metalness: 0.8, tile: 1 });
  std('rig.truss', { color: '#8D9196', roughness: 0.4, metalness: 0.85, tile: 1 });
  std('rig.motor', { color: '#17181A', roughness: 0.5, metalness: 0.3, tile: 0.5 });
  std('rig.cable', { color: '#0A0A0B', roughness: 0.9, metalness: 0, tile: 0.5 });
  std('rig.basket', { color: '#3A3D41', roughness: 0.6, metalness: 0.5, tile: 0.5 });
  std('rig.flyDuct', { color: '#34373B', roughness: 0.55, metalness: 0.5, tile: 0.5 });

  // --- lighting ----------------------------------------------------------------------
  std('light.body', { color: '#151618', roughness: 0.45, metalness: 0.1, tile: 0.5 });
  emi('light.lens', { color: '#ffffff', side: THREE.DoubleSide }); // per-instance colour carries the state
  emi('light.work', { color: WORK_ON });
  emi('light.spotLens', { color: LENS_OFF });

  // --- loudspeakers ------------------------------------------------------------------
  std('pa.cabinet', { color: '#211F1D', roughness: 0.6, metalness: 0, tile: 0.5 });
  std('pa.grille', { color: '#33312D', roughness: 0.55, metalness: 0.2, tile: 0.1 });
  std('pa.subGrey', { color: '#8A867F', roughness: 0.6, metalness: 0, tile: 0.55 });
  std('pa.port', { color: '#0A0A0B', roughness: 0.9, metalness: 0, tile: 0.5 });
  std('pa.rigging', { color: '#1E1F21', roughness: 0.5, metalness: 0.6, tile: 0.5 });

  // --- video -------------------------------------------------------------------------
  std('led.frame', { color: '#101113', roughness: 0.5, metalness: 0.3, tile: 0.5 });
  emi('led.side', { color: '#3f6db5', toneMapped: false });
  emi('led.service', { color: '#3f6db5', toneMapped: false });
  emi('led.upstage', { color: '#5a3fd0', toneMapped: false });

  // --- front of house ----------------------------------------------------------------
  std('foh.riser', { color: '#0E0E10', roughness: 0.8, metalness: 0, tile: 1.2 });
  std('foh.console', { color: '#2A2B2E', roughness: 0.5, metalness: 0.3, tile: 0.5 });
  std('foh.mat', { color: '#27488F', roughness: 0.9, metalness: 0, tile: 1 });
  emi('foh.screen', { color: '#7fb2ff' });

  // --- show effects (additive, unlit) ------------------------------------------------
  const fx = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, toneMapped: false };
  emi('fx.beam', { color: '#ffffff', opacity: 0.085, vertexColors: true, ...fx });
  emi('fx.pool', { color: '#ffffff', opacity: 0.35, ...fx });
  emi('fx.haze', { color: '#8a7cff', opacity: 0.05, ...fx });
  return m;
}

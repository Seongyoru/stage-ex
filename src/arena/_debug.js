// Development-only registration check: every seat as a small box, the surveyed roof
// outline, the rear columns, the stage and the level planes. Not part of the shipped model.
import * as THREE from 'three';
import { SPEC } from '../core/spec.js';
import { G, H } from '../core/frame.js';
import { forEachSeat, MAPPED_SEAT_COUNT, GATES } from '../core/seating.js';
import { box, prism, cylinder, merge, mesh } from '../core/geom.js';
import { mat } from '../core/materials.js';

export function build() {
  const group = new THREE.Group();
  group.name = 'debug';

  const colors = { arena: '#7f8fa6', telescopic: '#3c6fb0', stand: '#274b8a', balcony: '#d73a29' };
  const seats = new THREE.InstancedMesh(new THREE.BoxGeometry(0.44, 0.9, 0.5), new THREE.MeshStandardMaterial({ roughness: 0.8 }), MAPPED_SEAT_COUNT);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const s1 = new THREE.Vector3(1, 1, 1);
  const c = new THREE.Color();
  forEachSeat((s) => {
    q.setFromAxisAngle(up, s.rotY);
    m4.compose(new THREE.Vector3(s.x, s.y + 0.45, s.z), q, s1);
    seats.setMatrixAt(s.index, m4);
    seats.setColorAt(s.index, c.set(colors[s.kind]));
  });
  seats.userData.layer = 'seats';
  group.add(seats);

  // surveyed roof outline as a thin ring at ground level and at eave height
  const ring = SPEC.geo.footprintSharp_G.map(([x, y]) => G(x, y));
  const outline = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    outline.push(box((a[0] + b[0]) / 2, 0.15, (a[1] + b[1]) / 2, len, 0.3, 0.4, Math.atan2(-(b[1] - a[1]), b[0] - a[0])));
  }
  group.add(mesh(merge(outline), mat('debug.outline', { color: '#ff7a00' }), { name: 'roof outline', layer: 'exterior' }));

  // level-3 wall polygon from the spec
  const wallRing = SPEC.facade.rearWall.l3WallPolygon_G.map(([x, y]) => G(x, y));
  group.add(mesh(prism(wallRing, -0.05, 0.0), mat('debug.floor', { color: '#d9d4cc' }), { name: 'L3 wall polygon', layer: 'structure' }));

  // rear columns
  const cols = SPEC.facade.columns.positions_G.map(([x, y]) => {
    const [wx, wz] = G(x, y);
    return box(wx, 18.6, wz, 1.2, 37.3, 1.2);
  });
  group.add(mesh(merge(cols), mat('debug.column', { color: '#d9d6cf' }), { name: 'columns', layer: 'exterior' }));

  // stage
  const st = SPEC.stage;
  group.add(mesh(box(0, st.height_m / 2, -st.depth_m / 2, st.width_m, st.height_m, st.depth_m), mat('debug.stage', { color: '#222222' }), { name: 'stage', layer: 'stage' }));

  // gate markers
  const gates = Object.values(GATES).map(([x, z]) => cylinder(x, z, 0, 40, 0.25, 8));
  group.add(mesh(merge(gates), mat('debug.gate', { color: '#00d084', transparent: true, opacity: 0.35 }), { name: 'gates', layer: 'structure', cast: false }));

  // hall arena floor polygon (stands retracted)
  const floorRing = SPEC.hall.arenaFloor.polygonStandsRetracted_H.map(([x, y]) => H(x, y));
  group.add(mesh(prism(floorRing, 0.0, 0.02), mat('debug.arenaFloor', { color: '#bfb3a8' }), { name: 'arena floor', layer: 'structure' }));

  // level planes as thin lines on the axis section (x = 0) for the section view
  const lv = SPEC.levels.filter((l) => l.elevation_m > 0 && l.elevation_m < 40).map((l) => box(0, l.elevation_m, 30, 0.2, 0.06, 140));
  group.add(mesh(merge(lv), mat('debug.level', { color: '#ff2d55' }), { name: 'levels', layer: 'structure', cast: false }));

  return group;
}

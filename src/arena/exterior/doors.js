// Black-framed glazed door screens of the LEVEL 3 entrances.
import * as THREE from 'three';
import { Collector, frame, fpt, slab, rect, obox } from './common.js';

/** One door leaf in the plane d = 0 of frame F, hinged at u0 (pull bar near u1). */
function leaf(col, F, u0, u1, y0, y1, level) {
  const fr = col.geo('facade.doorFrame', { level, part: 'entrance door frames' });
  const glass = col.geo('facade.doorGlass', { level, part: 'entrance door glass' });
  const pull = col.geo('facade.doorPull', { level, part: 'door pulls' });
  const a = Math.min(u0, u1);
  const b = Math.max(u0, u1);
  const st = 0.06;
  obox(fr, F, a, a + st, y0, y1, -0.025, 0.025);
  obox(fr, F, b - st, b, y0, y1, -0.025, 0.025);
  obox(fr, F, a + st, b - st, y1 - 0.08, y1, -0.025, 0.025, 'lr');
  obox(fr, F, a + st, b - st, y0 + 0.02, y0 + 0.14, -0.025, 0.025, 'lr');
  slab(glass, F, rect(a + st, y0 + 0.14, b - st, y1 - 0.08), { t: 0.012, off: 0.006, edge: false });
  const up = u1 > u0 ? u1 - 0.11 : u1 + 0.11;
  for (const d of [0.05, -0.08]) obox(pull, F, up - 0.015, up + 0.015, y0 + 0.35, y0 + 2.0, d, d + 0.03);
}

/**
 * Door screen filling the opening [u0, u1] × [y0, y0 + h] of wall frame F.
 *   bays     number of double doors side by side
 *   transom  door height; the strip above is fixed glazing
 *   inset    distance of the screen behind the outer wall face
 */
export function doorScreen(col, F, u0, u1, y0, h, { doors, entrance, bays = 3, level = 3, transom = 2.45, inset = 0.12 }) {
  const fr = col.geo('facade.doorFrame', { level, part: 'entrance door frames' });
  const glass = col.geo('facade.doorGlass', { level, part: 'entrance door glass' });
  const w = (u1 - u0) / bays;
  const yT = y0 + transom;
  const y1 = y0 + h;
  const D0 = -inset - 0.1;
  const D1 = -inset + 0.04;
  for (let i = 0; i <= bays; i++) {
    const u = u0 + i * w;
    const a = i === 0 ? u : i === bays ? u - 0.08 : u - 0.05;
    const b = i === 0 ? u + 0.08 : i === bays ? u : u + 0.05;
    obox(fr, F, a, b, y0, y1, D0, D1);
  }
  obox(fr, F, u0, u1, y1 - 0.08, y1, D0, D1, 'lr');
  if (y1 - yT > 0.2) {
    obox(fr, F, u0, u1, yT - 0.04, yT + 0.04, D0, D1, 'lr');
    slab(glass, F, rect(u0 + 0.08, yT + 0.04, u1 - 0.08, y1 - 0.08), { t: 0.012, off: -inset - 0.02, edge: false });
  }
  for (let i = 0; i < bays; i++) {
    const [x, y, z] = fpt(F, u0 + (i + 0.5) * w, y0, -inset - 0.03);
    doors.pairs.push({ entrance, x, y, z, u: F.U, n: F.N, half: w / 2 - 0.06,
      height: transom - 0.04, angle: 0, open: false, index: doors.pairs.length });
  }
}

// Work in each doorway's horizontal coordinates: u runs across the threshold, n faces outside.
// Both the rendered leaves and walking collision use the same hinge angle.
function touches(door, feet, radius, angle) {
  if (feet.y + 1.72 < door.y || feet.y > door.y + door.height) return false;
  const dx = feet.x - door.x, dz = feet.z - door.z;
  const u = dx * door.u[0] + dz * door.u[2], n = dx * door.n[0] + dz * door.n[2];
  if (Math.abs(u) > door.half + radius || Math.abs(n) > door.half + radius) return false;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  for (const side of [-1, 1]) {
    const du = u - side * door.half;
    const along = THREE.MathUtils.clamp(-side * cos * du - sin * n, 0, door.half);
    if ((du + side * cos * along) ** 2 + (n + sin * along) ** 2 < radius ** 2) return true;
  }
  return false;
}

export class EntranceDoors {
  constructor() {
    this.pairs = [];
    this.meshes = [];
    this.moving = new Set();
    this.pose = new THREE.Object3D();
    this.enabled = true;
  }

  build(group) {
    // All leaves share three draws (frame, glass and pull), even when opened independently.
    const template = new Collector();
    leaf(template, frame([0, 0, 0], [1, 0, 0], [0, 0, 1]), 0, 1, 0, 2.45, 3);
    const parts = new THREE.Group();
    template.build(parts);
    for (const part of parts.children) {
      const mesh = new THREE.InstancedMesh(part.geometry, part.material, this.pairs.length * 2);
      Object.assign(mesh, { name: part.name, castShadow: part.castShadow,
        receiveShadow: part.receiveShadow, renderOrder: part.renderOrder });
      mesh.userData = { ...part.userData };
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.meshes.push(mesh);
      group.add(mesh);
    }
    for (const pair of this.pairs) this.poseLeaves(pair);
    for (const mesh of this.meshes) {
      mesh.computeBoundingSphere();
      mesh.boundingSphere.radius += Math.max(...this.pairs.map(pair => pair.half)) * 2;
    }
  }

  poseLeaves(door) {
    const cos = Math.cos(door.angle), sin = Math.sin(door.angle);
    for (const side of [-1, 1]) {
      const x = -side * cos * door.u[0] - sin * door.n[0];
      const z = -side * cos * door.u[2] - sin * door.n[2];
      this.pose.position.set(door.x + side * door.half * door.u[0], door.y, door.z + side * door.half * door.u[2]);
      this.pose.rotation.y = Math.atan2(-z, x);
      this.pose.scale.set(door.half - 0.005, door.height / 2.45, 1);
      this.pose.updateMatrix();
      const index = door.index * 2 + (side > 0 ? 1 : 0);
      for (const mesh of this.meshes) {
        mesh.setMatrixAt(index, this.pose.matrix);
        mesh.instanceMatrix.needsUpdate = true;
      }
    }
  }

  target(eye, direction) {
    if (!this.enabled) return null;
    let nearest = null, reach = 3;
    for (const door of this.pairs) {
      const dx = eye.x - door.x, dz = eye.z - door.z;
      const facing = direction.x * door.n[0] + direction.z * door.n[2];
      if (Math.abs(facing) < 0.4 || Math.abs(eye.y - door.y - 1.6) > 1.2) continue;
      const distance = -(dx * door.n[0] + dz * door.n[2]) / facing;
      if (distance < 0 || distance >= reach) continue;
      const across = (dx + direction.x * distance) * door.u[0] + (dz + direction.z * distance) * door.u[2];
      const y = eye.y + direction.y * distance - door.y;
      if (Math.abs(across) > door.half || y < 0 || y > door.height) continue;
      nearest = door;
      reach = distance;
    }
    return nearest;
  }

  toggle(door) {
    door.open = !door.open;
    this.moving.add(door);
  }

  update(dt, feet, radius) {
    let changed = false;
    for (const door of this.moving) {
      const end = door.open ? Math.PI / 2 : 0;
      const next = THREE.MathUtils.clamp(door.angle + (door.open ? 1 : -1) * dt * 2.6, 0, Math.PI / 2);
      if (feet && this.enabled && touches(door, feet, radius + 0.03, next)) continue;
      door.angle = next;
      this.poseLeaves(door);
      changed = true;
      if (next === end) this.moving.delete(door);
    }
    return changed;
  }

  blocks(feet, radius) {
    return this.enabled && this.pairs.some(door => touches(door, feet, radius + 0.04, door.angle));
  }
}

import * as THREE from 'three';
import { Kit, frameXZ } from './kit.js';

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

export class GateDoors {
  constructor() {
    this.pairs = [];
    this.moving = new Set();
    this.pose = new THREE.Object3D();
    this.enabled = true;
  }

  build(group) {
    const batches = new Map();
    for (const door of this.pairs) {
      const key = [door.level, door.half, door.height].join('/');
      if (!batches.has(key)) batches.set(key, []);
      batches.get(key).push(door);
    }
    for (const batch of batches.values()) {
      const { level, half, height } = batch[0];
      const kit = new Kit();
      const box = (a, b, v0, v1, y0, y1, mat) => kit.box(frameXZ, a, b, v0, v1, y0, y1, mat, level);
      box(0, half - 0.004, -0.028, 0.028, 0.01, height - 0.01, 'gateDoor');
      box(0.02, half - 0.024, -0.032, 0.032, 0.01, 0.22, 'stainless');
      const handle = half - 0.14;
      for (const side of [-1, 1]) {
        box(handle - 0.018, handle + 0.018, side * 0.045, side * 0.075, 0.82, 1.42, 'stainless');
        for (const y of [0.86, 1.38]) box(handle - 0.012, handle + 0.012, 0, side * 0.075, y - 0.012, y + 0.012, 'stainless');
      }
      const template = new THREE.Group();
      kit.build(template);
      const meshes = template.children.map(part => {
        const mesh = new THREE.InstancedMesh(part.geometry, part.material, batch.length * 2);
        mesh.name = part.name + ' gate leaves';
        mesh.castShadow = mesh.receiveShadow = true;
        mesh.userData = { ...part.userData, noCollide: true }; // moving leaves use hinge collision
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        group.add(mesh);
        return mesh;
      });
      batch.forEach((door, index) => {
        door.index = index;
        door.meshes = meshes;
        this.poseLeaves(door);
      });
      for (const mesh of meshes) {
        mesh.computeBoundingSphere();
        mesh.boundingSphere.radius += half * 2;
      }
    }
  }

  poseLeaves(door) {
    const cos = Math.cos(door.angle), sin = Math.sin(door.angle);
    for (const side of [-1, 1]) {
      const x = -side * cos * door.u[0] - sin * door.n[0];
      const z = -side * cos * door.u[2] - sin * door.n[2];
      this.pose.position.set(door.x + side * door.half * door.u[0], door.y, door.z + side * door.half * door.u[2]);
      this.pose.rotation.y = Math.atan2(-z, x);
      this.pose.updateMatrix();
      const index = door.index * 2 + (side > 0 ? 1 : 0);
      for (const mesh of door.meshes) {
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

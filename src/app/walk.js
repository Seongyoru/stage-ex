// First-person walking with collision (three-mesh-bvh).
//
// Collider: the static meshes of the bowl, structure, hall, precinct and ground layers,
// merged into one position-only geometry with a bounds tree. Seats and the facade are
// not part of it (doors stay passable).
//
// Controller: a capsule that covers the body ABOVE step height handles walls, rails and
// ceilings; the feet follow the floor found by rays cast down from step height, so
// stairs and seating rows (risers up to 0.5 m) are walked without getting stuck.
import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';

export const COLLIDER_LAYERS = new Set(['bowl', 'structure', 'hall', 'precinct', 'ground']);

const EYE = 1.6;
const RADIUS = 0.3;
const HEIGHT = 1.72;
const STEP = 0.56; // highest riser that can be walked up
const GRAVITY = 22;
const WALK = 3.2;
const RUN = 8.5;
const FLY = 14;
const MAX_INSTANCED_TRIS = 400000;

/**
 * Merge the given mesh records into one collider geometry (world space) with a BVH.
 * Returns { geometry, bvh, triangles } or null when nothing collides.
 */
export function buildCollider(records) {
  let total = 0;
  const parts = [];
  for (const r of records) {
    const o = r.obj;
    const g = o.geometry;
    const pos = g?.attributes?.position;
    if (!pos || o.userData.noCollide) continue;
    const tris = (g.index ? g.index.count : pos.count) / 3;
    if (o.isInstancedMesh) {
      if (tris * o.count > MAX_INSTANCED_TRIS) continue;
      parts.push({ o, g, tris: tris * o.count });
      total += tris * o.count;
    } else {
      parts.push({ o, g, tris });
      total += tris;
    }
  }
  if (total === 0) return null;
  const out = new Float32Array(Math.round(total) * 9);
  let k = 0;
  const v = new THREE.Vector3();
  const m = new THREE.Matrix4();
  const im = new THREE.Matrix4();
  const emit = (g, matrix) => {
    const pos = g.attributes.position;
    const idx = g.index;
    const n = idx ? idx.count : pos.count;
    for (let i = 0; i < n; i++) {
      v.fromBufferAttribute(pos, idx ? idx.getX(i) : i).applyMatrix4(matrix);
      out[k++] = v.x;
      out[k++] = v.y;
      out[k++] = v.z;
    }
  };
  for (const { o, g } of parts) {
    o.updateWorldMatrix(true, false);
    if (o.isInstancedMesh) {
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, im);
        m.multiplyMatrices(o.matrixWorld, im);
        emit(g, m);
      }
    } else emit(g, o.matrixWorld);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(out, 3));
  const bvh = new MeshBVH(geometry);
  geometry.boundsTree = bvh;
  return { geometry, bvh, triangles: Math.round(total) };
}

export class Walker {
  /**
   * @param {import('./rig.js').CameraRig} rig
   */
  constructor(rig) {
    this.rig = rig;
    this.active = false;
    this.collider = null;
    this.pos = new THREE.Vector3(); // feet
    this.vy = 0;
    this.grounded = false;
    this.fly = false;
    this.keys = new Set();
    this.joy = new THREE.Vector2(); // touch joystick: x = strafe, y = forward
    this.spawn = new THREE.Vector3();
    this.moving = false;
    this._seg = new THREE.Line3();
    this._box = new THREE.Box3();
    this._tri = new THREE.Vector3();
    this._cap = new THREE.Vector3();
    this._ray = new THREE.Ray(new THREE.Vector3(), new THREE.Vector3(0, -1, 0));
    this._fwd = new THREE.Vector3();
    this._right = new THREE.Vector3();
    this._move = new THREE.Vector3();

    const isTyping = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName || '');
    addEventListener('keydown', (e) => {
      if (!this.active || isTyping(e) || e.ctrlKey || e.metaKey || e.altKey) return;
      const c = e.code;
      if (/^(Key[WASDQEFC]|Arrow(Up|Down|Left|Right)|Space|Shift(Left|Right))$/.test(c)) {
        this.keys.add(c);
        if (c === 'KeyF' && !e.repeat) this.toggleFly();
        if (c === 'Space' && this.grounded && !this.fly) this.vy = 6.2;
        if (c.startsWith('Arrow') || c === 'Space') e.preventDefault();
      }
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
  }

  toggleFly(on = !this.fly) {
    this.fly = on;
    this.vy = 0;
    this.onFlyChange?.(this.fly);
  }

  setCollider(collider) {
    this.collider = collider;
  }

  /** True when the collider blocks the straight line between two points (with some slack at the end). */
  blocked(from, to, slack = 1.2) {
    if (!this.collider) return false;
    const ray = (this._sight ||= new THREE.Ray());
    ray.origin.copy(from);
    ray.direction.copy(to).sub(from);
    const dist = ray.direction.length();
    if (dist <= slack) return false;
    ray.direction.multiplyScalar(1 / dist);
    return !!this.collider.bvh.raycastFirst(ray, THREE.DoubleSide, 0.05, dist - slack);
  }

  /** Height of the walkable floor under (x, z), searching from yTop downward; null when none. */
  floorBelow(x, yTop, z, maxDrop = 60) {
    if (!this.collider) return null;
    this._ray.origin.set(x, yTop, z);
    const hit = this.collider.bvh.raycastFirst(this._ray, THREE.DoubleSide, 0, maxDrop);
    return hit ? hit.point.y : null;
  }

  /** Put the walker at a start point; its feet snap to the floor found below. */
  start(pos, faceXZ) {
    this.active = true;
    this.fly = false;
    this.vy = 0;
    this.keys.clear();
    const y = this.floorBelow(pos[0], pos[1] + 1.2, pos[2], 8);
    this.pos.set(pos[0], y !== null && Math.abs(y - pos[1]) < 4 ? y : pos[1], pos[2]);
    this.spawn.copy(this.pos);
    this.grounded = y !== null;
    this._face = faceXZ;
    return this.eye();
  }

  stop() {
    this.active = false;
    this.moving = false;
    this.keys.clear();
    this.joy.set(0, 0);
    this.lift = 0;
  }

  startFlight(eye) {
    this.stop();
    this.pos.fromArray(eye);
    this.pos.y -= EYE;
    this.grounded = false;
    this.vy = 0;
    this.fly = this.active = true;
    this._face = null;
  }

  eye(target = new THREE.Vector3()) {
    return target.set(this.pos.x, this.pos.y + EYE, this.pos.z);
  }

  _collide() {
    // capsule above step height
    const seg = this._seg;
    seg.start.set(this.pos.x, this.pos.y + STEP + RADIUS, this.pos.z);
    seg.end.set(this.pos.x, this.pos.y + HEIGHT - RADIUS, this.pos.z);
    const box = this._box;
    box.makeEmpty().expandByPoint(seg.start).expandByPoint(seg.end);
    box.min.addScalar(-RADIUS);
    box.max.addScalar(RADIUS);
    const sx = seg.start.x;
    const sy = seg.start.y;
    const sz = seg.start.z;
    this.collider.bvh.shapecast({
      intersectsBounds: (b) => b.intersectsBox(box),
      intersectsTriangle: (tri) => {
        const d = tri.closestPointToSegment(seg, this._tri, this._cap);
        if (d < RADIUS) {
          const depth = RADIUS - d;
          const dir = this._cap.sub(this._tri).normalize();
          seg.start.addScaledVector(dir, depth);
          seg.end.addScaledVector(dir, depth);
        }
      },
    });
    const dx = seg.start.x - sx;
    const dy = seg.start.y - sy;
    const dz = seg.start.z - sz;
    this.pos.x += dx;
    this.pos.z += dz;
    // a ceiling pushes down; never let wall contacts lift the walker
    if (dy < 0) {
      this.pos.y += dy;
      if (this.vy > 0) this.vy = 0;
    }
  }

  _ground(dt) {
    // highest floor within step reach under the feet (centre + 4 rays around it)
    const top = this.pos.y + STEP;
    let best = null;
    const offs = [
      [0, 0],
      [RADIUS * 0.7, 0],
      [-RADIUS * 0.7, 0],
      [0, RADIUS * 0.7],
      [0, -RADIUS * 0.7],
    ];
    for (let i = 0; i < offs.length; i++) {
      const y = this.floorBelow(this.pos.x + offs[i][0], top, this.pos.z + offs[i][1], STEP + 0.55);
      if (y !== null && (best === null || y > best)) best = y;
      if (i === 0 && y === null && !this.grounded) break; // falling: one ray is enough
    }
    if (best !== null && this.vy <= 0.01 && best >= this.pos.y - 0.52) {
      // on the floor: follow it (smoothly on stairs)
      const k = 1 - Math.exp(-dt * 22);
      this.pos.y += (best - this.pos.y) * k;
      if (Math.abs(best - this.pos.y) < 0.005) this.pos.y = best;
      this.vy = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
      this.vy -= GRAVITY * dt;
      const before = this.pos.y;
      this.pos.y += this.vy * dt;
      // do not tunnel through a floor while falling
      if (this.vy < 0) {
        const y = this.floorBelow(this.pos.x, before + 0.2, this.pos.z, before - this.pos.y + 0.25);
        if (y !== null && y >= this.pos.y) {
          this.pos.y = y;
          this.vy = 0;
          this.grounded = true;
        }
      }
      if (this.pos.y < -40) {
        this.pos.copy(this.spawn);
        this.vy = 0;
      }
    }
  }

  /** Advance the walker and move the camera. Returns true when it moved. */
  update(dt) {
    if (!this.active) return false;
    const look = this.rig.look;
    if (this._face) {
      look.setDirection(new THREE.Vector3(this._face[0], 0, this._face[1]));
      this._face = null;
    }
    const K = this.keys;
    let f = this.joy.y;
    let s = this.joy.x;
    if (K.has('KeyW') || K.has('ArrowUp')) f += 1;
    if (K.has('KeyS') || K.has('ArrowDown')) f -= 1;
    if (K.has('KeyD') || K.has('ArrowRight')) s += 1;
    if (K.has('KeyA') || K.has('ArrowLeft')) s -= 1;
    const run = K.has('ShiftLeft') || K.has('ShiftRight');
    const len = Math.hypot(f, s);
    if (len > 1) {
      f /= len;
      s /= len;
    }
    const before = this._move.copy(this.pos);
    const yaw = look.yaw;
    this._fwd.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    this._right.set(Math.cos(yaw), 0, -Math.sin(yaw));

    if (this.fly || !this.collider) {
      const speed = FLY * (run ? 3 : 1);
      look.getDirection(this._fwd);
      this.pos.addScaledVector(this._fwd, f * speed * dt).addScaledVector(this._right, s * speed * dt);
      if (K.has('Space') || K.has('KeyE')) this.pos.y += speed * 0.7 * dt;
      if (K.has('KeyC') || K.has('KeyQ')) this.pos.y -= speed * 0.7 * dt;
      if (this.lift) this.pos.y += this.lift * speed * 0.7 * dt;
      this.vy = 0;
    } else {
      const speed = run ? RUN : WALK;
      const steps = Math.max(1, Math.min(6, Math.ceil((speed * dt) / (RADIUS * 0.5))));
      const h = dt / steps;
      for (let i = 0; i < steps; i++) {
        this.pos.addScaledVector(this._fwd, f * speed * h).addScaledVector(this._right, s * speed * h);
        this._collide();
        this._ground(h);
      }
    }
    this.eye(this.rig.camera.position);
    const moved = before.distanceToSquared(this.pos) > 1e-10;
    this.moving = moved;
    if (moved) this.rig.moved = true;
    return moved;
  }
}

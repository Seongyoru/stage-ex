// Camera rig: one perspective camera driven by either
//   'orbit'  OrbitControls around a target (exterior overview), or
//   'look'   stand still and look around (seat view, interior viewpoints, walking),
// plus smooth fly-to transitions between any two poses.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DIORAMA } from '../core/envelope.js';

const V = () => new THREE.Vector3();
const clamp = THREE.MathUtils.clamp;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Drag-to-look controls (yaw / pitch), wheel and pinch change the field of view. */
export class LookControls {
  constructor(camera, dom) {
    this.camera = camera;
    this.dom = dom;
    this.enabled = false;
    this.yaw = 0;
    this.pitch = 0;
    this.minPitch = -1.45;
    this.maxPitch = 1.45;
    this.minFov = 16;
    this.maxFov = 96;
    this.vYaw = 0;
    this.vPitch = 0;
    this.locked = false; // pointer lock (walk mode)
    this.allowLock = false;
    this.onChange = null;
    this._pointers = new Map();
    this._pinch = 0;
    this._euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this._moved = false;

    dom.addEventListener('pointerdown', (e) => this._down(e));
    dom.addEventListener('pointermove', (e) => this._move(e));
    dom.addEventListener('pointerup', (e) => this._up(e));
    dom.addEventListener('pointercancel', (e) => this._up(e));
    dom.addEventListener('wheel', (e) => this._wheel(e), { passive: false });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.dom;
      this.onLockChange?.(this.locked);
    });
    document.addEventListener('mousemove', (e) => {
      if (!this.enabled || !this.locked) return;
      const k = (this.camera.fov * Math.PI) / 180 / this.dom.clientHeight;
      this.yaw -= e.movementX * k * 1.15;
      this.pitch = clamp(this.pitch - e.movementY * k * 1.15, this.minPitch, this.maxPitch);
      this._changed();
    });
  }

  setDirection(dir) {
    const d = dir.clone().normalize();
    this.yaw = Math.atan2(-d.x, -d.z);
    this.pitch = clamp(Math.asin(clamp(d.y, -1, 1)), this.minPitch, this.maxPitch);
    this.vYaw = this.vPitch = 0;
    this.apply();
  }

  getDirection(target = V()) {
    return target.set(0, 0, -1).applyEuler(this._euler.set(this.pitch, this.yaw, 0));
  }

  apply() {
    this.camera.quaternion.setFromEuler(this._euler.set(this.pitch, this.yaw, 0));
  }

  _changed() {
    this._moved = true;
    this.apply();
    this.onChange?.();
  }

  _down(e) {
    if (!this.enabled || this.locked) return;
    this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      this.dom.setPointerCapture(e.pointerId);
    } catch {}
    this.vYaw = this.vPitch = 0;
    if (this._pointers.size === 2) this._pinch = this._pinchDist();
  }

  _pinchDist() {
    const [a, b] = [...this._pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  _move(e) {
    if (!this.enabled || this.locked) return;
    const p = this._pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    if (this._pointers.size >= 2) {
      const d = this._pinchDist();
      if (this._pinch > 0 && d > 0) this.setFov(this.camera.fov * (this._pinch / d));
      this._pinch = d;
      return;
    }
    // "grab the scene": the picture follows the finger
    const k = (this.camera.fov * Math.PI) / 180 / this.dom.clientHeight;
    this.yaw += dx * k;
    this.pitch = clamp(this.pitch + dy * k, this.minPitch, this.maxPitch);
    this.vYaw = dx * k * 60;
    this.vPitch = dy * k * 60;
    this._changed();
  }

  _up(e) {
    this._pointers.delete(e.pointerId);
    if (this._pointers.size < 2) this._pinch = 0;
  }

  _wheel(e) {
    if (!this.enabled) return;
    e.preventDefault();
    this.setFov(this.camera.fov * Math.exp(clamp(e.deltaY, -240, 240) * 0.0011));
  }

  setFov(fov) {
    const f = clamp(fov, this.minFov, this.maxFov);
    if (f === this.camera.fov) return;
    this.camera.fov = f;
    this.camera.updateProjectionMatrix();
    this.onChange?.();
  }

  /** Inertia after a drag. Returns true while still moving. */
  update(dt) {
    if (!this.enabled) return false;
    if (this._pointers.size > 0 || this.locked) return this._consume();
    if (Math.abs(this.vYaw) + Math.abs(this.vPitch) < 0.002) return this._consume();
    this.yaw += this.vYaw * dt;
    this.pitch = clamp(this.pitch + this.vPitch * dt, this.minPitch, this.maxPitch);
    const damp = Math.exp(-dt * 7);
    this.vYaw *= damp;
    this.vPitch *= damp;
    this.apply();
    this.onChange?.();
    return true;
  }

  _consume() {
    const m = this._moved;
    this._moved = false;
    return m;
  }

  requestLock() {
    if (!this.allowLock || this.locked || !this.dom.requestPointerLock) return;
    try {
      const p = this.dom.requestPointerLock();
      if (p && p.catch) p.catch(() => {});
    } catch {}
  }

  exitLock() {
    if (document.pointerLockElement === this.dom) document.exitPointerLock();
  }
}

export class CameraRig {
  constructor(dom) {
    this.dom = dom;
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.5, 3200);
    this.camera.position.set(-78, 96, 384);
    this.kind = 'orbit';
    this.flying = null;
    this.onUserMove = null; // called when the user (not a fly-to) moves the camera
    this.moved = true;

    const orbit = new OrbitControls(this.camera, dom);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.09;
    orbit.rotateSpeed = 0.55;
    orbit.zoomSpeed = 1.1;
    orbit.panSpeed = 0.9;
    orbit.screenSpacePanning = false;
    orbit.zoomToCursor = true;
    orbit.minDistance = 6;
    orbit.maxDistance = 950;
    orbit.maxPolarAngle = Math.PI / 2 - 0.035;
    orbit.target.set(0, 14, 42);
    orbit.addEventListener('start', () => {
      this._userActive = true;
    });
    orbit.addEventListener('end', () => {
      this._userActive = false;
      this.onUserMove?.('end');
    });
    orbit.addEventListener('change', () => {
      this.moved = true;
      if (!this.flying && (this._userActive || this._wheeling)) this.onUserMove?.('change');
    });
    dom.addEventListener(
      'wheel',
      () => {
        if (this.kind !== 'orbit' || this.flying) return;
        this._wheeling = true;
        clearTimeout(this._wheelT);
        this._wheelT = setTimeout(() => {
          this._wheeling = false;
          this.onUserMove?.('end');
        }, 250);
      },
      { passive: true },
    );
    this.orbit = orbit;

    this.look = new LookControls(this.camera, dom);
    this.look.onChange = () => {
      this.moved = true;
      if (!this.flying) this.onUserMove?.('change');
    };
    orbit.update();
  }

  setAspect(aspect) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.moved = true;
  }

  /** Current pose: { pos, target, fov, kind }. */
  pose() {
    const pos = this.camera.position.toArray();
    let target;
    if (this.kind === 'orbit') target = this.orbit.target.toArray();
    else target = this.camera.position.clone().addScaledVector(this.look.getDirection(), 40).toArray();
    return { pos, target, fov: this.camera.fov, kind: this.kind };
  }

  _setKind(kind) {
    this.kind = kind;
    this.orbit.enabled = kind === 'orbit' && !this.flying;
    this.look.enabled = kind === 'look' && !this.flying;
  }

  /** Jump to a pose without animation. */
  jump(pose) {
    this.flying = null;
    this._place(V().fromArray(pose.pos), V().fromArray(pose.target), pose.fov ?? this.camera.fov);
    this._finish(pose);
  }

  _place(pos, target, fov) {
    this.camera.position.copy(pos);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(target);
    if (fov !== this.camera.fov) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
    this.moved = true;
  }

  _finish(pose) {
    const kind = pose.kind || 'orbit';
    const pos = V().fromArray(pose.pos);
    const target = V().fromArray(pose.target);
    if (kind === 'orbit') {
      this.orbit.target.copy(target);
      this._setKind('orbit');
      this.orbit.update();
    } else {
      this._setKind('look');
      this.look.setDirection(target.clone().sub(pos));
    }
  }

  /**
   * Fly smoothly to a pose. The target point is interpolated linearly and the camera
   * offset from it in spherical coordinates, so the camera swings around the building
   * instead of cutting through it. Resolves when the flight ends (false if interrupted).
   */
  flyTo(pose, { duration = null, instant = false } = {}) {
    if (this.flying) this.flying.resolve(false);
    const from = this.pose();
    const p0 = V().fromArray(from.pos);
    const t0 = V().fromArray(from.target);
    const p1 = V().fromArray(pose.pos);
    const t1 = V().fromArray(pose.target);
    const fov1 = pose.fov ?? (pose.kind === 'look' ? 62 : 50);
    const dist = p0.distanceTo(p1) + t0.distanceTo(t1) * 0.5;
    if (!instant && typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) instant = true;
    if (instant || dist < 0.01) {
      this.jump({ ...pose, fov: fov1 });
      return Promise.resolve(true);
    }
    const s0 = new THREE.Spherical().setFromVector3(p0.clone().sub(t0));
    const s1 = new THREE.Spherical().setFromVector3(p1.clone().sub(t1));
    let dTheta = s1.theta - s0.theta;
    dTheta = ((((dTheta + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
    const dur = duration ?? clamp(0.55 + Math.sqrt(dist) * 0.11, 0.35, 2.6);
    this.orbit.enabled = false;
    this.look.enabled = false;
    return new Promise((resolve) => {
      this.flying = {
        t: 0,
        dur,
        resolve,
        step: (k) => {
          const e = ease(k);
          const tgt = t0.clone().lerp(t1, e);
          const sph = new THREE.Spherical(
            Math.exp(THREE.MathUtils.lerp(Math.log(Math.max(s0.radius, 0.05)), Math.log(Math.max(s1.radius, 0.05)), e)),
            THREE.MathUtils.lerp(s0.phi, s1.phi, e),
            s0.theta + dTheta * e,
          );
          sph.makeSafe();
          const pos = V().setFromSpherical(sph).add(tgt);
          this._place(pos, tgt, THREE.MathUtils.lerp(from.fov, fov1, e));
        },
        end: () => {
          this._place(p1, t1, fov1);
          this._finish({ ...pose, fov: fov1 });
        },
      };
    });
  }

  cancelFlight() {
    if (!this.flying) return;
    const f = this.flying;
    this.flying = null;
    this._setKind(this.kind);
    if (this.kind === 'orbit') {
      // keep orbiting around a point in front of the camera
      const dir = this.camera.getWorldDirection(V());
      this.orbit.target.copy(this.camera.position).addScaledVector(dir, 60);
    } else this.look.setDirection(this.camera.getWorldDirection(V()));
    f.resolve(false);
  }

  /** Advance controls / flights. Returns true when the camera moved this frame. */
  update(dt) {
    if (this.flying) {
      const f = this.flying;
      f.t += dt;
      const k = clamp(f.t / f.dur, 0, 1);
      if (k >= 1) {
        this.flying = null;
        f.end();
        f.resolve(true);
        this.onArrive?.();
      } else f.step(k);
    } else if (this.kind === 'orbit') {
      this.orbit.update(dt);
      this._limitOrbit();
    } else if (this.look.update(dt)) this.moved = true;
    // near plane: tight when close to things, generous in aerial views (depth precision)
    const d = this.kind === 'orbit' && !this.flying ? this.camera.position.distanceTo(this.orbit.target) : 0;
    const near = clamp(d * 0.012, 0.12, 2.5);
    if (Math.abs(near - this.camera.near) > this.camera.near * 0.2) {
      this.camera.near = near;
      this.camera.updateProjectionMatrix();
    }
    const m = this.moved;
    this.moved = false;
    return m;
  }

  _limitOrbit() {
    const t = this.orbit.target;
    const dx = t.x - DIORAMA.cx;
    const dz = t.z - DIORAMA.cz;
    const r = Math.hypot(dx, dz);
    const max = DIORAMA.radius * 0.8;
    if (r > max) {
      const k = max / r;
      const nx = DIORAMA.cx + dx * k;
      const nz = DIORAMA.cz + dz * k;
      this.camera.position.x += nx - t.x;
      this.camera.position.z += nz - t.z;
      t.x = nx;
      t.z = nz;
    }
    if (t.y < 0) {
      this.camera.position.y -= t.y;
      t.y = 0;
    } else if (t.y > 70) {
      this.camera.position.y -= t.y - 70;
      t.y = 70;
    }
    if (this.camera.position.y < 0.6) this.camera.position.y = 0.6;
  }
}

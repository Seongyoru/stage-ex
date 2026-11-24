// Section cut: one movable clipping plane along (x), across (z) or level with (y) the hall
// axis. The plane is set on every model material (local clipping with clipShadows), so the
// sun also falls into the cut building; closed solids are drawn double-sided while a cut
// is active so their cut faces read as material instead of holes.
import * as THREE from 'three';

export class Section {
  constructor(scene) {
    this.scene = scene;
    this.plane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
    this.planes = [this.plane];
    this.active = false;
    this._touched = new Map(); // material → { side, clippingPlanes, clipShadows }
    // thin frame that shows where the plane is
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(15), 3));
    const mat = new THREE.LineBasicMaterial({ color: '#f0b35a', transparent: true, opacity: 0.9, depthTest: false, fog: false });
    mat.userData.appOwned = true;
    this.frame = new THREE.Line(geo, mat);
    this.frame.name = 'app.sectionFrame';
    this.frame.userData.appOwned = true;
    this.frame.renderOrder = 999;
    this.frame.visible = false;
    this.frame.frustumCulled = false;
    scene.add(this.frame);
  }

  /** axis 'x' | 'z' | 'y'; pos in metres; flip keeps the other half. */
  set(axis, pos, flip) {
    const n = this.plane.normal;
    const s = flip ? 1 : -1; // default keeps the side below `pos` (three keeps n·p + c ≥ 0)
    n.set(axis === 'x' ? s : 0, axis === 'y' ? s : 0, axis === 'z' ? s : 0);
    if (axis === 'y') n.set(0, -1, 0); // a plan cut always removes what is above
    this.plane.constant = -n.x * pos - n.y * pos - n.z * pos;
    this._frame(axis, pos);
  }

  _frame(axis, pos) {
    const a = this.frame.geometry.attributes.position;
    let pts;
    if (axis === 'x') pts = [[pos, 0, -36], [pos, 47, -36], [pos, 47, 105], [pos, 0, 105], [pos, 0, -36]];
    else if (axis === 'z') pts = [[-93, 0, pos], [-93, 47, pos], [93, 47, pos], [93, 0, pos], [-93, 0, pos]];
    else pts = [[-93, pos, -36], [93, pos, -36], [93, pos, 105], [-93, pos, 105], [-93, pos, -36]];
    pts.forEach((p, i) => a.setXYZ(i, p[0], p[1], p[2]));
    a.needsUpdate = true;
  }

  _materials() {
    const set = new Set();
    this.scene.traverse((o) => {
      if (o.userData.appOwned || !(o.isMesh || o.isLine || o.isPoints)) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (m && !m.userData.appOwned) set.add(m);
      }
    });
    return set;
  }

  /** Turn the cut on / off (also call again after modules or materials were added). */
  enable(on) {
    this.active = !!on;
    this.frame.visible = this.active;
    if (this.active) {
      for (const m of this._materials()) {
        if (this._touched.has(m)) continue;
        this._touched.set(m, { side: m.side, clippingPlanes: m.clippingPlanes, clipShadows: m.clipShadows });
        m.clippingPlanes = this.planes;
        m.clipShadows = true;
        if (!m.transparent && m.side === THREE.FrontSide) m.side = THREE.DoubleSide;
        m.needsUpdate = true;
      }
    } else {
      for (const [m, old] of this._touched) {
        m.clippingPlanes = old.clippingPlanes;
        m.clipShadows = old.clipShadows;
        m.side = old.side;
        m.needsUpdate = true;
      }
      this._touched.clear();
    }
  }
}

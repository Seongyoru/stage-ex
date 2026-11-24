// Central handrails of the radial aisles: one black tubular loop per row (photos show a
// loop of two posts with a sloping top rail and a mid rail over the intermediate steps,
// leaving the row level free for crossing). Instanced per tier.
import * as THREE from 'three';
import { metricUV } from '../../core/geom.js';
import { Soup, tube } from './soup.js';

function loopGeometry(d, rise, n) {
  const s = new Soup();
  const bk = s.get({ name: 'x' });
  const slope = rise / d;
  const stepY = (z) => (Math.min(n - 1, Math.floor((z / d) * n + 1e-6)) * rise) / n;
  // posts stand on the intermediate steps; the first third / half of the row stays free
  const z0 = d / n + 0.06;
  const z1 = d - 0.07;
  const h = 0.92;
  const top = (z) => z * slope + h;
  const r = 0.021;
  const a0 = [0, stepY(z0), z0];
  const a1 = [0, top(z0), z0];
  const b0 = [0, stepY(z1), z1];
  const b1 = [0, top(z1), z1];
  tube(bk, a0, a1, r, 6);
  tube(bk, b0, b1, r, 6);
  tube(bk, a1, b1, r, 6);
  const m = 0.5;
  tube(bk, [0, top(z0) - h * m, z0], [0, top(z1) - h * m, z1], 0.016, 5);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(bk.pos, 3));
  g.computeVertexNormals();
  return metricUV(g);
}

/** rails: [{ F, x, z, y, d, rise, n, tier }] → instanced meshes. */
export function buildAisleRails(rails, material) {
  const groups = new Map();
  for (const r of rails) {
    const key = `${r.tier}|${r.n}|${r.d.toFixed(1)}|${r.rise.toFixed(2)}`;
    if (!groups.has(key)) groups.set(key, { ...r, list: [] });
    groups.get(key).list.push(r);
  }
  const out = [];
  const m4 = new THREE.Matrix4();
  const X = new THREE.Vector3();
  const Y = new THREE.Vector3(0, 1, 0);
  const Z = new THREE.Vector3();
  for (const g of groups.values()) {
    const geo = loopGeometry(g.d, g.rise, g.n);
    const mesh = new THREE.InstancedMesh(geo, material, g.list.length);
    g.list.forEach((r, i) => {
      X.set(r.F.ux, 0, r.F.uz);
      Z.set(r.F.vx, 0, r.F.vz);
      m4.makeBasis(X, Y, Z);
      m4.setPosition(r.x, r.y, r.z);
      mesh.setMatrixAt(i, m4);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.name = `bowl:aisleRails:L${g.tier}`;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.userData.layer = 'bowl';
    mesh.userData.level = g.tier;
    mesh.frustumCulled = false;
    out.push(mesh);
  }
  return out;
}

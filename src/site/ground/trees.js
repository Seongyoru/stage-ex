// Trees: surveyed positions (OpenStreetMap natural=tree, 300 m around the arena) plus the
// procedural street and park trees baked by tools/bake-ground.mjs. Three low-poly species,
// instanced: 0 zelkova-like street tree (vase crown), 1 round evergreen, 2 conifer.
import * as THREE from 'three';
import { metricUV, merge } from '../../core/geom.js';
import { GROUND } from '../data/ground-data.js';
import { DISC, liftAt, rng, discR, Y } from './util.js';

const SITE = 'site';

function blob(rand, rx, ry, rz, cy, detail, jitter) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const p = g.attributes.position;
  // jitter per unique direction so that the faceted crown stays closed
  const seen = new Map();
  for (let i = 0; i < p.count; i++) {
    const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
    let s = seen.get(k);
    if (s === undefined) seen.set(k, (s = 1 + (rand() - 0.5) * jitter));
    // flatten the underside a little
    const y = p.getY(i);
    const f = y < -0.3 ? 0.82 : 1;
    p.setXYZ(i, p.getX(i) * rx * s * f, y * ry * s + cy, p.getZ(i) * rz * s * f);
  }
  return metricUV(g);
}
function trunk(r0, r1, h, sides = 6) {
  const g = new THREE.CylinderGeometry(r1, r0, h, sides, 1, true);
  g.translate(0, h / 2, 0);
  return metricUV(g);
}
function cone(r, h, y0, sides = 8) {
  const g = new THREE.ConeGeometry(r, h, sides, 1, false);
  g.translate(0, y0 + h / 2, 0);
  return metricUV(g);
}

export function buildTrees(M, quality = 'high') {
  const group = new THREE.Group();
  group.name = 'trees';
  const rand = rng(8151);
  const detail = quality === 'low' ? 0 : 1;
  const species = [
    {
      name: 'zelkova',
      trunk: trunk(0.17, 0.1, 3.0),
      crown: merge([blob(rand, 2.1, 1.9, 2.1, 4.6, detail, 0.3), blob(rand, 1.5, 1.3, 1.5, 5.9, 0, 0.25)]),
      material: M.crownA,
      tint: ['#6C9A45', '#7BA650', '#5F8E3F', '#84A84E'],
    },
    {
      name: 'evergreen',
      trunk: trunk(0.2, 0.13, 2.2),
      crown: blob(rand, 2.5, 2.1, 2.5, 3.9, detail, 0.28),
      material: M.crownB,
      tint: ['#467A3A', '#3F6F35', '#52853F'],
    },
    {
      name: 'conifer',
      trunk: trunk(0.16, 0.1, 1.5),
      crown: merge([cone(1.55, 3.6, 1.2), cone(1.05, 3.0, 3.6)]),
      material: M.crownC,
      tint: ['#33603C', '#2C5636', '#3B6A42'],
    },
  ];
  const lists = [[], [], []];
  const t = GROUND.trees;
  for (let i = 0; i < t.length; i += 4) {
    if (discR(t[i], t[i + 1]) > DISC.radius - 2.5) continue;
    lists[t[i + 2]].push([t[i], t[i + 1], t[i + 3]]);
  }
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const col = new THREE.Color();
  species.forEach((sp, k) => {
    const list = lists[k];
    if (!list.length) return;
    const trunks = new THREE.InstancedMesh(sp.trunk, M.trunk, list.length);
    const crowns = new THREE.InstancedMesh(sp.crown, sp.material, list.length);
    list.forEach(([x, z, s], i) => {
      const lift = liftAt(x, z);
      q.setFromAxisAngle(up, rand() * Math.PI * 2);
      pos.set(x, lift > 0 ? lift + Y.walk : 0, z);
      const sy = s * (0.9 + rand() * 0.25);
      scl.set(s, sy, s);
      m4.compose(pos, q, scl);
      trunks.setMatrixAt(i, m4);
      crowns.setMatrixAt(i, m4);
      col.set(sp.tint[Math.floor(rand() * sp.tint.length)]);
      col.offsetHSL(0, (rand() - 0.5) * 0.06, (rand() - 0.5) * 0.05);
      // instance colours multiply the material colour: express the tint relative to it
      const base = sp.material.color;
      crowns.setColorAt(i, new THREE.Color(col.r / Math.max(base.r, 1e-3), col.g / Math.max(base.g, 1e-3), col.b / Math.max(base.b, 1e-3)));
    });
    for (const [m, name] of [[trunks, `tree trunks (${sp.name})`], [crowns, `tree crowns (${sp.name})`]]) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.name = name;
      m.userData.layer = SITE;
      m.castShadow = true;
      m.receiveShadow = true;
      group.add(m);
    }
  });
  return group;
}

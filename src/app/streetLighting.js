// Static fixtures share one small irradiance map per outdoor layer. Its green channel
// stores the height of the paving so the light cannot leak onto a deck above a lamp.
import * as THREE from 'three';
import { getMaterial } from '../core/materials.js';

const surfaces = {
  lamp_post: ['precinct.paver', 'precinct.paverBand', 'precinct.bigSteps', 'precinct.granite', 'precinct.tactile', 'precinct.forecourt', 'precinct.groundPaving'],
  street_light: ['site.asphalt', 'site.sidewalk', 'site.roadMarking', 'site.footpath', 'site.bridgeDeck', 'site.bridgeParapet', 'site.kerb', 'site.lotPaving'],
};

function floorMap(positions) {
  const radius = 5;
  const box = new THREE.Box3().setFromPoints(positions).expandByScalar(radius + 1);
  const extent = box.getSize(new THREE.Vector3());
  const width = Math.ceil(extent.x * 2), height = Math.ceil(extent.z * 2);
  const pixels = new Uint8Array(width * height * 4);
  for (const p of positions) {
    const cx = (p.x - box.min.x) * 2, cz = (p.z - box.min.z) * 2;
    const ground = Math.round((p.y - box.min.y) / extent.y * 255);
    for (let z = Math.floor(cz - radius * 2); z <= Math.ceil(cz + radius * 2); z++) {
      for (let x = Math.floor(cx - radius * 2); x <= Math.ceil(cx + radius * 2); x++) {
        const d = Math.hypot(x + .5 - cx, z + .5 - cz) / (radius * 2);
        if (d >= 1) continue;
        const strength = Math.round(255 * (1 - d * d) ** 3);
        const i = (z * width + x) * 4;
        if (strength <= pixels[i]) continue;
        pixels[i] = strength;
        pixels[i + 1] = ground;
      }
    }
  }
  const map = new THREE.DataTexture(pixels, width, height);
  map.minFilter = map.magFilter = THREE.LinearFilter;
  map.needsUpdate = true;
  return { map: { value: map }, bounds: { value: new THREE.Vector4(box.min.x, box.min.z, width / 2, height / 2) },
    heights: { value: new THREE.Vector2(box.min.y, extent.y) } };
}

function shade(material, kind, uniforms, vertex, fragment, declarations) {
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = 'varying vec3 vLampPosition;\n' + shader.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n' + vertex);
    shader.fragmentShader = 'varying vec3 vLampPosition;\nuniform float uNight;\n' + declarations + '\n' +
      shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + fragment);
  };
  material.customProgramCacheKey = () => 'stage-ex-lamp-' + kind;
  material.needsUpdate = true;
}

export function installStreetLighting(props, slots, night) {
  const power = { value: Number(night) };
  for (const [type, names] of Object.entries(surfaces)) {
    const holder = props.getObjectByName('prop:' + type);
    const positions = slots[type]?.map(slot => new THREE.Vector3(...slot.pos));
    if (!holder || !positions?.length) continue;
    const data = floorMap(positions);
    for (const name of names) {
      const material = getMaterial(name);
      if (!material?.isMeshStandardMaterial) continue;
      shade(material, 'paving', { uNight: power, uPool: data.map, uBounds: data.bounds, uHeights: data.heights },
        'vLampPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;',
        `if (uNight > 0.5) {
          vec2 pool = texture2D(uPool, (vLampPosition.xz - uBounds.xy) / uBounds.zw).rg;
          float h = uHeights.x + uHeights.y * pool.g;
          float falloff = 1.0 - smoothstep(0.35, 1.4, abs(vLampPosition.y - h));
          totalEmissiveRadiance += diffuseColor.rgb * vec3(0.72, 0.45, 0.20) * pool.r * falloff;
        }`, 'uniform sampler2D uPool; uniform vec4 uBounds; uniform vec2 uHeights;');
    }
    for (const mesh of holder.children) {
      const material = mesh.material;
      if (!material?.isMeshStandardMaterial) continue;
      mesh.geometry.computeBoundingBox();
      const bounds = mesh.geometry.boundingBox;
      const h = bounds.max.y - bounds.min.y;
      shade(material, 'bulb', { uNight: power, uBulb: { value: new THREE.Vector2(bounds.min.y + .90 * h, h) } },
        'vLampPosition = position;', `float lens = smoothstep(0.0, 0.025, (vLampPosition.y-uBulb.x)/uBulb.y);
        totalEmissiveRadiance += uNight * lens * vec3(1.8, 1.2, 0.64);`, 'uniform vec2 uBulb;');
    }
  }
  return power;
}

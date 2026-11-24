// Sky, sun, lighting states and the horizon fade of the diorama.
//
// Lighting states (blended smoothly):
//   day / night            outdoor sun or moon with one shadow map fitted to the precinct
//   interior (house light) even, shadowless work light once the camera is inside the building
//   show                   house lights down; the modules' own emissive show kit takes over
//
// The map is a local diorama disc (DIORAMA in core/envelope.js). Its rim dissolves into
// the horizon colour of the sky: the fog shader chunks of three.js are replaced once, so
// every fog-enabled material fades by radial distance from the diorama centre in
// addition to a light aerial perspective.
import * as THREE from 'three';
import { DIORAMA, L3_WALL_RING, ROOF_OUTLINE, roofY } from '../core/envelope.js';
import { lonLatToWorld } from '../core/frame.js';
import { SPEC } from '../core/spec.js';

const FADE_START = DIORAMA.radius * 0.8;
const FADE_END = DIORAMA.radius * 0.99;

let chunksPatched = false;
/** Replace the fog chunks (must run before the first material is compiled). */
export function patchFogChunks() {
  if (chunksPatched) return;
  chunksPatched = true;
  const C = THREE.ShaderChunk;
  C.fog_pars_vertex = /* glsl */ `
#ifdef USE_FOG
	varying float vFogDepth;
	varying vec2 vFogWorldXZ;
#endif
`;
  // mvPosition is the view-space position in every built-in shader (also with instancing
  // and batching); the view matrix is rigid, so world = cameraPosition + Rᵀ · mv.
  C.fog_vertex = /* glsl */ `
#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
	vFogWorldXZ = ( cameraPosition + transpose( mat3( viewMatrix ) ) * mvPosition.xyz ).xz;
#endif
`;
  C.fog_pars_fragment = /* glsl */ `
#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	varying vec2 vFogWorldXZ;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif
`;
  C.fog_fragment = /* glsl */ `
#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	float dioramaRim = smoothstep( ${FADE_START.toFixed(1)}, ${FADE_END.toFixed(1)}, length( vFogWorldXZ - vec2( ${DIORAMA.cx.toFixed(2)}, ${DIORAMA.cz.toFixed(2)} ) ) );
	fogFactor = max( fogFactor, dioramaRim );
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif
`;
}

// --- sky dome ----------------------------------------------------------------------------
const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
	vDir = position;
	vec4 p = modelViewMatrix * vec4( position, 1.0 );
	gl_Position = projectionMatrix * p;
	gl_Position.z = gl_Position.w; // always at the far plane
}
`;
const SKY_FRAG = /* glsl */ `
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uStars;
uniform float uGlow;
varying vec3 vDir;
const vec3 GLOW = vec3( 0.022, 0.016, 0.012 );

float hash( vec3 p ) {
	p = fract( p * 0.3183099 + 0.1 );
	p *= 17.0;
	return fract( p.x * p.y * p.z * ( p.x + p.y + p.z ) );
}

void main() {
	vec3 d = normalize( vDir );
	float h = max( d.y, 0.0 );
	// zenith → horizon; everything below the horizon is the haze the diorama dissolves into
	vec3 col = mix( uHorizon, uZenith, pow( h, 0.42 ) );
	float s = max( dot( d, uSunDir ), 0.0 );
	float above = smoothstep( -0.03, 0.02, d.y );
	col += uSunColor * ( pow( s, 900.0 ) * 6.0 + pow( s, 40.0 ) * 0.22 + pow( s, 6.0 ) * 0.07 ) * above;
	// faint warm glow low over the city at night (constant below the horizon, like the fog colour)
	col += GLOW * uGlow * pow( 1.0 - h, 10.0 );
	if ( uStars > 0.0 && d.y > 0.0 ) {
		vec3 p = d * 190.0;
		vec3 ip = floor( p );
		float r = hash( ip );
		float m = smoothstep( 0.45, 0.0, length( fract( p ) - 0.5 ) );
		col += vec3( 0.85, 0.9, 1.0 ) * step( 0.9965, r ) * m * uStars * smoothstep( 0.02, 0.35, d.y ) * ( 0.4 + 0.6 * fract( r * 91.7 ) );
	}
	gl_FragColor = vec4( col, 1.0 );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

function makeSky() {
  const mat = new THREE.ShaderMaterial({
    name: 'app.sky',
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    uniforms: {
      uZenith: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uSunColor: { value: new THREE.Color() },
      uStars: { value: 0 },
      uGlow: { value: 0 },
    },
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: true,
    fog: false,
  });
  mat.userData.appOwned = true;
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), mat);
  mesh.name = 'app.sky';
  mesh.frustumCulled = false;
  mesh.renderOrder = -1000;
  mesh.userData.appOwned = true;
  return mesh;
}

// --- helpers -----------------------------------------------------------------------------
function pointInRing(ring, x, z) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i];
    const [xj, zj] = ring[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

function distToRing(ring, x, z) {
  let best = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, az] = ring[j];
    const [bx, bz] = ring[i];
    const dx = bx - ax;
    const dz = bz - az;
    const t = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
    best = Math.min(best, Math.hypot(x - ax - t * dx, z - az - t * dz));
  }
  return best;
}

/**
 * 0 outside the building … 1 well inside it (2 m blend across the wall line). The wall
 * line is the LEVEL 3 outer wall ring; under the eave counts as outside.
 */
export function insideFactor(x, y, z) {
  if (y > roofY(x, z) + 0.5 || y < -1) return 0;
  const d = distToRing(L3_WALL_RING, x, z);
  const signed = pointInRing(L3_WALL_RING, x, z) ? d : -d;
  return THREE.MathUtils.smoothstep(signed, -1.0, 1.5);
}

const lerp = THREE.MathUtils.lerp;

// Reference lighting = the module preview (src/dev/preview.js), which the model colours
// were tuned against: hemisphere 1.6 + sun 3.0 by day, hemisphere 1.5 + three work
// lights inside.
const LOOKS = {
  day: {
    zenith: '#3f78c8', horizon: '#c4d6e8', sunColor: '#fff0d8', skySun: '#fff3d6', sun: 3.0, hemiSky: '#dbe9ff', hemiGround: '#8a8578', hemi: 1.32,
    env: 0.42, exposure: 1.0, stars: 0, glow: 0, fog: 0.00042,
  },
  night: {
    zenith: '#05070d', horizon: '#161c2c', sunColor: '#9fb6ff', skySun: '#aebcdf', sun: 0.5, hemiSky: '#3f4f78', hemiGround: '#1b1c21', hemi: 0.5,
    env: 0.5, exposure: 1.0, stars: 1, glow: 1, fog: 0.0005,
  },
};

export class Environment {
  /**
   * @param {THREE.Scene} scene
   * @param {THREE.WebGLRenderer} renderer
   * @param {{ quality: 'high' | 'low' }} opts
   */
  constructor(scene, renderer, { quality = 'high' } = {}) {
    patchFogChunks();
    this.scene = scene;
    this.renderer = renderer;
    this.quality = quality;
    this.group = new THREE.Group();
    this.group.name = 'app.environment';
    this.group.userData.appOwned = true;
    scene.add(this.group);

    this.sky = makeSky();
    this.group.add(this.sky);

    scene.fog = new THREE.FogExp2('#c4d6e8', LOOKS.day.fog);
    scene.background = null;

    this.hemi = new THREE.HemisphereLight('#dbe9ff', '#8a8578', 1.3);
    this.group.add(this.hemi);

    // Sun / moon: one directional light with a shadow map fitted to the precinct.
    this.sun = new THREE.DirectionalLight('#fff0d8', 3);
    this.sun.castShadow = true;
    const size = quality === 'high' ? 4096 : 2048;
    this.sun.shadow.mapSize.set(size, size);
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.3;
    this.group.add(this.sun, this.sun.target);

    // Interior work light (house lights): three shadowless directionals + the hemisphere.
    this.fill = [
      [40, 90, 70, 1.05],
      [-50, 70, -40, 0.6],
      [0, 20, -120, 0.35],
    ].map(([x, y, z, k]) => {
      const d = new THREE.DirectionalLight('#fff6ea', 0);
      d.position.set(x, y, z);
      d.userData.k = k;
      this.group.add(d);
      return d;
    });

    this.night = false;
    this.show = false;
    this.open = false; // roof open or a section cut: daylight reaches the hall
    this.forceInside = null; // number 0..1 while a fly-to should pre-set the interior state
    this.inside = 0;
    this.nightT = 0;
    this.showT = 0;
    this.openT = 0;
    this._envKey = '';
    this._pmrem = null;
    this._envRT = null;
    this._tmp = { a: new THREE.Color(), b: new THREE.Color() };
    this.sunDir = new THREE.Vector3();
    this.setSun(this._defaultSunDir());
    this.apply(1, true);
  }

  _defaultSunDir() {
    // Same direction as the module preview: an afternoon sun in the west (about 50° high)
    // that lights the Main Entrance facets and the south-west flank.
    return new THREE.Vector3(180, 260, 120).normalize();
  }

  /** Fit the shadow frustum to the precinct (arena roof outline + Hilton, K Tower, annex, decks). */
  setSun(dir) {
    this.sunDir.copy(dir).normalize();
    const pts = [];
    for (const [x, z] of ROOF_OUTLINE) pts.push([x, 0, z], [x, 47, z]);
    for (const n of SPEC.neighbours || []) {
      const hgt = Math.min(n.height_m || 6, 100);
      if (!Array.isArray(n.footprint) || /Deck \(/.test(n.name)) continue;
      for (const [lon, lat] of n.footprint) {
        const [x, z] = lonLatToWorld(lon, lat);
        pts.push([x, 0, z], [x, hgt, z]);
      }
    }
    // a margin of ground around the precinct so long shadows land somewhere
    for (const [x, z] of [[-150, -80], [200, -80], [-150, 230], [200, 230]]) pts.push([x, 0, z]);
    const center = new THREE.Vector3(20, 0, 70);
    const lightPos = center.clone().addScaledVector(this.sunDir, 420);
    this.sun.position.copy(lightPos);
    this.sun.target.position.copy(center);
    this.sun.updateMatrixWorld(true);
    this.sun.target.updateMatrixWorld(true);
    // Light space = the shadow camera's frame: Matrix4.lookAt gives its rotation, the
    // light position its origin; the camera looks along −Z.
    const inv = new THREE.Matrix4().lookAt(lightPos, center, new THREE.Vector3(0, 1, 0)).invert();
    const v = new THREE.Vector3();
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const p of pts) {
      v.set(p[0] - lightPos.x, p[1] - lightPos.y, p[2] - lightPos.z).applyMatrix4(inv);
      minX = Math.min(minX, v.x);
      maxX = Math.max(maxX, v.x);
      minY = Math.min(minY, v.y);
      maxY = Math.max(maxY, v.y);
      minZ = Math.min(minZ, v.z);
      maxZ = Math.max(maxZ, v.z);
    }
    const cam = this.sun.shadow.camera;
    const pad = 6;
    cam.left = minX - pad;
    cam.right = maxX + pad;
    cam.bottom = minY - pad;
    cam.top = maxY + pad;
    cam.near = Math.max(1, -maxZ - 30);
    cam.far = -minZ + 30;
    cam.updateProjectionMatrix();
    this.shadowDirty = true;
  }

  setState({ night, show, open }) {
    if (night !== undefined) this.night = !!night;
    if (show !== undefined) this.show = !!show;
    if (open !== undefined) this.open = !!open;
  }

  /** Blend the lighting toward the current state. k = blend amount this frame (1 = jump). */
  apply(k, force = false) {
    const nT = this.night ? 1 : 0;
    const sT = this.show ? 1 : 0;
    const oT = this.open ? 1 : 0;
    const prev = this.nightT;
    this.nightT = lerp(this.nightT, nT, k);
    this.showT = lerp(this.showT, sT, k);
    this.openT = lerp(this.openT, oT, k);
    if (Math.abs(this.nightT - nT) < 0.002) this.nightT = nT;
    if (Math.abs(this.showT - sT) < 0.002) this.showT = sT;
    if (Math.abs(this.openT - oT) < 0.002) this.openT = oT;
    const n = this.nightT;
    const D = LOOKS.day;
    const N = LOOKS.night;
    const { a, b } = this._tmp;
    const mixc = (target, c0, c1) => target.copy(a.set(c0)).lerp(b.set(c1), n);

    const u = this.sky.material.uniforms;
    mixc(u.uZenith.value, D.zenith, N.zenith);
    mixc(u.uHorizon.value, D.horizon, N.horizon);
    mixc(u.uSunColor.value, D.skySun, N.skySun);
    u.uSunDir.value.copy(this.sunDir);
    u.uStars.value = lerp(D.stars, N.stars, n);
    u.uGlow.value = lerp(D.glow, N.glow, n);
    // the fog colour is exactly what the sky shows at and below the horizon
    const glow = u.uGlow.value;
    this.scene.fog.color.copy(u.uHorizon.value);
    this.scene.fog.color.r += 0.022 * glow;
    this.scene.fog.color.g += 0.016 * glow;
    this.scene.fog.color.b += 0.012 * glow;

    const inside = this.inside;
    const show = this.showT;
    // Daylight reaching the hall through an open roof or a cut makes the work light redundant.
    const house = inside * (1 - 0.94 * show) * (1 - 0.7 * this.openT * (1 - n));

    this.scene.fog.density = lerp(lerp(D.fog, N.fog, n), 0.00008, inside);

    mixc(this.sun.color, D.sunColor, N.sunColor);
    this.sun.intensity = lerp(D.sun, N.sun, n);

    // hemisphere: outdoor sky ↔ neutral house light ↔ dim blue show ambience
    mixc(this.hemi.color, D.hemiSky, N.hemiSky);
    mixc(this.hemi.groundColor, D.hemiGround, N.hemiGround);
    const hemiOut = lerp(D.hemi, N.hemi, n);
    this.hemi.color.lerp(a.set('#ffffff'), house).lerp(a.set('#7f8fd0'), inside * show * 0.8);
    this.hemi.groundColor.lerp(a.set('#a9a39b'), house);
    this.hemi.intensity = lerp(lerp(hemiOut, 1.8, inside * (1 - this.openT * (1 - n) * 0.5)), 0.16, inside * show);

    for (const d of this.fill) d.intensity = d.userData.k * house;

    this.scene.environmentIntensity = lerp(lerp(D.env, N.env, n), 0.1, inside) * (1 - 0.8 * inside * show);
    this.renderer.toneMappingExposure = lerp(lerp(D.exposure, N.exposure, n), 1.0, inside);

    const key = n < 0.5 ? 'day' : 'night';
    if (force || key !== this._envKey || (prev !== n && (n === 0 || n === 1))) this._bakeEnvironment(key);
    if (prev !== n) this.shadowDirty = true;
  }

  /** Image-based light from the procedural sky (reflections on glass and metal). */
  _bakeEnvironment(key) {
    this._envKey = key;
    if (!this._pmrem) this._pmrem = new THREE.PMREMGenerator(this.renderer);
    const envScene = new THREE.Scene();
    const sky = new THREE.Mesh(this.sky.geometry, this.sky.material);
    sky.scale.setScalar(50);
    sky.frustumCulled = false;
    envScene.add(sky);
    const rt = this._pmrem.fromScene(envScene, 0.02, 0.1, 100);
    this.scene.environment = rt.texture;
    if (this._envRT) this._envRT.dispose();
    this._envRT = rt;
  }

  /**
   * Per frame: follow the camera with the sky, track whether the camera is inside the
   * building and blend the lights. Returns true while a blend is still running.
   */
  update(dt, camera) {
    this.sky.position.copy(camera.position);
    this.sky.scale.setScalar(camera.far * 0.9);
    const p = camera.position;
    const target = this.forceInside !== null ? this.forceInside : insideFactor(p.x, p.y, p.z);
    const before = this.inside;
    this.inside = lerp(this.inside, target, 1 - Math.exp(-dt * 5));
    if (Math.abs(this.inside - target) < 0.003) this.inside = target;
    const blending =
      before !== this.inside || this.nightT !== (this.night ? 1 : 0) || this.showT !== (this.show ? 1 : 0) || this.openT !== (this.open ? 1 : 0);
    this.apply(1 - Math.exp(-dt * 4));
    return blending;
  }
}

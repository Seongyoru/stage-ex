// Renderer, optional bloom pipeline, adaptive pixel ratio and resize handling.
import * as THREE from 'three';

export class Gfx {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{ quality: 'high' | 'low', fixedDpr?: number | null }} opts
   */
  constructor(canvas, { quality = 'high', fixedDpr = null } = {}) {
    this.canvas = canvas;
    this.quality = quality;
    this.fixedDpr = fixedDpr;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      alpha: false,
    });
    this.renderer = renderer;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap; // soft since r182
    renderer.shadowMap.autoUpdate = false; // the model is static: re-render on demand
    renderer.localClippingEnabled = true; // section cuts are per-material planes (they also clip shadows)
    renderer.setClearColor('#0b0d11', 1);
    renderer.info.autoReset = false;

    this.scale = 1; // adaptive factor on top of the device pixel ratio
    this._acc = 0;
    this._frames = 0;
    this._cool = 0;
    this.bloomEnabled = false;
    this.composer = null;
    this.bloomPass = null;
    this._composerPromise = null;
    this.width = 1;
    this.height = 1;
    this.resize();
  }

  get maxDpr() {
    if (this.fixedDpr) return this.fixedDpr;
    return Math.min(window.devicePixelRatio || 1, this.quality === 'high' ? 2 : 1.25);
  }

  get pixelRatio() {
    return Math.max(0.5, this.maxDpr * this.scale);
  }

  /** Size the drawing buffer to the canvas' CSS box. Returns true when it changed. */
  resize() {
    const w = Math.max(1, this.canvas.clientWidth || window.innerWidth);
    const h = Math.max(1, this.canvas.clientHeight || window.innerHeight);
    const pr = this.pixelRatio;
    if (w === this.width && h === this.height && pr === this._pr) return false;
    this.width = w;
    this.height = h;
    this._pr = pr;
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h, false);
    if (this.composer) {
      this.composer.setPixelRatio(pr);
      this.composer.setSize(w, h);
    }
    return true;
  }

  /**
   * Adaptive resolution: lower the pixel ratio when frames are slow, raise it again
   * when there is headroom. Call once per rendered frame with the frame time in seconds.
   */
  adapt(dt) {
    if (this.fixedDpr) return;
    this._acc += dt;
    this._frames++;
    this._cool -= dt;
    if (this._frames < 30) return;
    const avg = (this._acc / this._frames) * 1000;
    this._acc = 0;
    this._frames = 0;
    if (this._cool > 0) return;
    const before = this.scale;
    if (avg > 26 && this.scale > 0.55) this.scale = Math.max(0.55, this.scale * 0.85);
    else if (avg < 12.5 && this.scale < 1) this.scale = Math.min(1, this.scale * 1.12);
    if (this.scale !== before) {
      this._cool = 1.5;
      this.resize();
    }
  }

  /** Bloom for night / show at high quality. The post-processing code is loaded on first use. */
  async setBloom(on, scene, camera) {
    this.bloomEnabled = !!on && this.quality === 'high';
    if (!this.bloomEnabled || this.composer) return;
    if (!this._composerPromise) {
      this._composerPromise = (async () => {
        const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
          import('three/addons/postprocessing/EffectComposer.js'),
          import('three/addons/postprocessing/RenderPass.js'),
          import('three/addons/postprocessing/UnrealBloomPass.js'),
          import('three/addons/postprocessing/OutputPass.js'),
        ]);
        const rt = new THREE.WebGLRenderTarget(this.width, this.height, { type: THREE.HalfFloatType, samples: 4 });
        const composer = new EffectComposer(this.renderer, rt);
        composer.setPixelRatio(this.pixelRatio);
        composer.setSize(this.width, this.height);
        composer.addPass(new RenderPass(scene, camera));
        // threshold is in linear HDR: only emissive sources and specular glints bloom
        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(this.width, this.height), 0.42, 0.55, 0.92);
        composer.addPass(this.bloomPass);
        composer.addPass(new OutputPass());
        this.composer = composer;
      })().catch((e) => {
        console.warn('[gfx] bloom unavailable:', e);
        this.bloomEnabled = false;
      });
    }
    await this._composerPromise;
  }

  render(scene, camera) {
    this.renderer.info.reset();
    if (this.bloomEnabled && this.composer) this.composer.render();
    else this.renderer.render(scene, camera);
  }
}

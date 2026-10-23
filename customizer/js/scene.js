/* =============================================================
   Redheart Customizer — 3D viewer (simplified, Coohom-style)
   -------------------------------------------------------------
   Clean studio, soft shadow, smooth orbit with gentle auto-spin,
   smooth model swap, view presets, reset, full screen, PNG export.
   No dimension guides / exploded view / measurements.
   ============================================================= */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildModel } from './geometry/index.js';
import { buildFrameMaterial, buildHardwareMaterial, buildGlassMaterial, buildPanelMaterial } from './materials.js';

const BG = {
  studio: { bg: '#eef1f4', ground: '#dfe3e8' },
  light:  { bg: '#ffffff', ground: '#eceef0' },
  dark:   { bg: '#15171b', ground: '#101216' }
};

export class Viewer {
  constructor(container) {
    this.container = container;
    this.autoRotate = true;
    this._idleTimer = null;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envMap;

    this.camera = new THREE.PerspectiveCamera(40, 1, 0.01, 100);
    this.camera.position.set(2.0, 1.2, 3.0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 0.8;
    this.controls.maxDistance = 14;
    this.controls.maxPolarAngle = Math.PI * 0.92;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.9;
    this.controls.addEventListener('start', () => this._onInteract());

    this.key = new THREE.DirectionalLight(0xffffff, 2.0);
    this.key.position.set(3, 5, 4);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(2048, 2048);
    this.key.shadow.camera.near = 0.5; this.key.shadow.camera.far = 30;
    this.key.shadow.camera.left = -4; this.key.shadow.camera.right = 4;
    this.key.shadow.camera.top = 4; this.key.shadow.camera.bottom = -4;
    this.key.shadow.bias = -0.0003;
    this.scene.add(this.key);
    this.fill = new THREE.DirectionalLight(0xffffff, 0.45);
    this.fill.position.set(-4, 2, -2);
    this.scene.add(this.fill);

    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: 0xdfe3e8, roughness: 0.96, metalness: 0 })
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    this.modelRoot = new THREE.Group();
    this.scene.add(this.modelRoot);
    this.materials = { frame: null, hardware: buildHardwareMaterial(), glass: null, panel: null };
    this.model = null;
    this._swapT = 1;

    this.setBackground('studio');

    this.ro = new ResizeObserver(() => this._resize());
    this.ro.observe(container);
    this._resize();
    this.renderer.setAnimationLoop(() => this._tick());
  }

  _resize() {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }

  _onInteract() {
    this.controls.autoRotate = false;
    clearTimeout(this._idleTimer);
    if (this.autoRotate) {
      this._idleTimer = setTimeout(() => { this.controls.autoRotate = true; }, 3500);
    }
  }

  _tick() {
    if (this._swapT < 1) {
      this._swapT = Math.min(this._swapT + 0.06, 1);
      const s = 0.97 + 0.03 * this._swapT;
      if (this.model) this.model.scale.setScalar(s);
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  rebuild(cfg) {
    this._disposeModel();
    this.materials.frame = buildFrameMaterial(cfg); this.materials.frame.envMap = this.envMap;
    this.materials.glass = buildGlassMaterial(cfg);
    this.materials.panel = buildPanelMaterial(cfg);
    const m = buildModel(cfg, this.materials);
    this.model = m;
    this.modelRoot.add(m);
    this._ground(m);
    this._swapT = 0; m.scale.setScalar(0.97);
  }

  updateFrame(cfg) {
    const f = buildFrameMaterial(cfg); f.envMap = this.envMap;
    const p = buildPanelMaterial(cfg);
    const of = this.materials.frame, op = this.materials.panel;
    this.materials.frame = f; this.materials.panel = p;
    this.model.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      if (o.material.name === 'frame') o.material = f;
      else if (o.material.name === 'panel') o.material = p;
    });
    of && of.dispose(); op && op.dispose();
  }

  updateGlass(cfg) {
    const g = buildGlassMaterial(cfg); const og = this.materials.glass;
    this.materials.glass = g;
    this.model.traverse((o) => { if (o.isMesh && o.material && o.material.name === 'glass') o.material = g; });
    og && og.dispose();
  }

  _ground(m) {
    const box = new THREE.Box3().setFromObject(m);
    m.position.y -= box.min.y;
    this._bbox = new THREE.Box3().setFromObject(m);
  }

  frame(view = 'perspective', animate = true) {
    const box = this._bbox || new THREE.Box3().setFromObject(this.modelRoot);
    const size = new THREE.Vector3(); box.getSize(size);
    const center = new THREE.Vector3(); box.getCenter(center);
    const radius = Math.max(size.x, size.y, size.z) * 0.6 + 0.25;
    const dist = radius / Math.sin((this.camera.fov * Math.PI / 180) / 2);
    const dirs = {
      front: new THREE.Vector3(0, 0, 1), side: new THREE.Vector3(1, 0, 0.001),
      top: new THREE.Vector3(0, 1, 0.001), perspective: new THREE.Vector3(0.6, 0.45, 1)
    };
    const dir = (dirs[view] || dirs.perspective).clone().normalize();
    const pos = center.clone().add(dir.multiplyScalar(dist));
    if (!animate) { this.camera.position.copy(pos); this.controls.target.copy(center); this.controls.update(); return; }
    this._animateCam(pos, center, 520);
  }

  _animateCam(toPos, toTarget, ms) {
    const fromPos = this.camera.position.clone(), fromT = this.controls.target.clone();
    const start = performance.now(), ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const t = Math.min((now - start) / ms, 1), e = ease(t);
      this.camera.position.lerpVectors(fromPos, toPos, e);
      this.controls.target.lerpVectors(fromT, toTarget, e);
      this.controls.update();
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  resetCamera() { this.frame('perspective', true); }

  setAutoRotate(on) {
    this.autoRotate = on;
    this.controls.autoRotate = on;
    clearTimeout(this._idleTimer);
  }

  setBackground(key) {
    const c = BG[key] || BG.studio;
    this.scene.background = new THREE.Color(c.bg);
    this.ground.material.color = new THREE.Color(c.ground);
  }

  snapshot(width = 1600) {
    const aspect = this.camera.aspect, h = Math.round(width / aspect);
    const prev = new THREE.Vector2(); this.renderer.getSize(prev);
    this.renderer.setSize(width, h, false);
    this.camera.aspect = width / h; this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
    const url = this.renderer.domElement.toDataURL('image/png');
    this.renderer.setSize(prev.x, prev.y, false);
    this.camera.aspect = prev.x / prev.y; this.camera.updateProjectionMatrix();
    return url;
  }

  _disposeModel() {
    if (this.model) {
      this.model.traverse((o) => { if (o.isMesh) o.geometry && o.geometry.dispose(); });
      this.modelRoot.remove(this.model);
      this.model = null;
    }
  }
}

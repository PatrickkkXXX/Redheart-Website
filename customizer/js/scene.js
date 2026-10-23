/* =============================================================
   Redheart Customizer — 3D viewer
   -------------------------------------------------------------
   Owns the renderer, environment lighting, shadows, camera and
   OrbitControls. Rebuilds geometry / swaps materials on demand,
   draws dimension guides, handles view presets, reset, fullscreen,
   exploded view, backgrounds, real mirror reflections and PNG export.
   ============================================================= */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { buildModel } from './geometry/index.js';
import { buildFrameMaterial, buildHardwareMaterial, buildGlassMaterial, surfaceIsMirror } from './materials.js';
import { UNITS, byId, mirror as mirrorDef } from './config.js';

const BG = {
  studio: { top: '#eef1f4', bottom: '#cfd5dc', ground: '#d7dde3' },
  light:  { top: '#ffffff', bottom: '#eef0f2', ground: '#e8eaed' },
  dark:   { top: '#1b1d22', bottom: '#0c0d10', ground: '#17191e' }
};

export class Viewer {
  constructor(container) {
    this.container = container;
    this.explodeT = 0;
    this.explodeTarget = 0;
    this.reflectors = [];

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    // Label renderer (dimension guides)
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.domElement.className = 'cz-labels';
    container.appendChild(this.labelRenderer.domElement);

    // Scene + environment
    this.scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envMap;

    // Camera
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.01, 100);
    this.camera.position.set(2.2, 1.4, 3.2);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 0.6;
    this.controls.maxDistance = 18;
    this.controls.maxPolarAngle = Math.PI * 0.92;

    // Lights (environment gives ambient/reflections; add a key light for shadows)
    this.key = new THREE.DirectionalLight(0xffffff, 2.1);
    this.key.position.set(3, 5, 4);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(2048, 2048);
    this.key.shadow.camera.near = 0.5;
    this.key.shadow.camera.far = 30;
    this.key.shadow.camera.left = -4; this.key.shadow.camera.right = 4;
    this.key.shadow.camera.top = 4; this.key.shadow.camera.bottom = -4;
    this.key.shadow.bias = -0.0003;
    this.scene.add(this.key);
    this.fill = new THREE.DirectionalLight(0xffffff, 0.5);
    this.fill.position.set(-4, 2, -2);
    this.scene.add(this.fill);

    // Ground (shadow catcher)
    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: 0xd7dde3, roughness: 0.95, metalness: 0 })
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    // Model container + shared materials
    this.modelRoot = new THREE.Group();
    this.scene.add(this.modelRoot);
    this.materials = { frame: null, hardware: buildHardwareMaterial(), glass: null };
    this.model = null;

    // Guides
    this.guides = new THREE.Group();
    this.scene.add(this.guides);

    this.setBackground('studio');

    // Resize handling
    this._resize = this._resize.bind(this);
    this.ro = new ResizeObserver(this._resize);
    this.ro.observe(container);
    this._resize();

    // Render loop
    this._tick = this._tick.bind(this);
    this.renderer.setAnimationLoop(this._tick);
  }

  /* ---------- Lifecycle ---------- */
  _resize() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.labelRenderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  _tick() {
    // Ease exploded state.
    if (Math.abs(this.explodeT - this.explodeTarget) > 0.001) {
      this.explodeT += (this.explodeTarget - this.explodeT) * 0.14;
      this._applyExplode();
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  }

  /* ---------- Build / update ---------- */
  rebuild(cfg) {
    this._disposeModel();
    this.materials.frame = buildFrameMaterial(cfg);
    this.materials.frame.envMap = this.envMap;
    this.materials.glass = buildGlassMaterial(cfg);

    const group = buildModel(cfg, this.materials);
    this.model = group;
    this.modelRoot.add(group);

    // Sit the model on the ground.
    this._ground(group);
    this._applyMirror(cfg);
    this._buildGuides(cfg);
    this._applyExplode();
  }

  updateFrame(cfg) {
    const old = this.materials.frame;
    const next = buildFrameMaterial(cfg);
    next.envMap = this.envMap;
    this.materials.frame = next;
    this.model.traverse((o) => { if (o.isMesh && o.material && o.material.name === 'frame') o.material = next; });
    if (old) old.dispose();
  }

  updateGlass(cfg) {
    // Mirror vs glass is handled by _applyMirror; here we refresh the glass mat.
    const old = this.materials.glass;
    const next = buildGlassMaterial(cfg);
    this.materials.glass = next;
    this.model.traverse((o) => { if (o.isMesh && o.material && o.material.name === 'glass') o.material = next; });
    if (old) old.dispose();
    this._applyMirror(cfg);
  }

  /* ---------- Mirror reflectors ---------- */
  _clearReflectors() {
    for (const r of this.reflectors) {
      r.parent && r.parent.remove(r);
      r.geometry && r.geometry.dispose();
      if (r.getRenderTarget) { const t = r.getRenderTarget && r.getRenderTarget(); }
    }
    this.reflectors = [];
  }

  _applyMirror(cfg) {
    this._clearReflectors();
    const panes = (this.model && this.model.userData.panes) || [];
    const useMirror = surfaceIsMirror(cfg);
    // Show/hide glass panes accordingly.
    panes.forEach((p) => { if (p.mesh) p.mesh.visible = !useMirror; });
    if (!useMirror) return;

    const m = mirrorDef(cfg.mirror) || mirrorDef('mirror-silver');
    for (const p of panes) {
      const geo = new THREE.PlaneGeometry(p.width, p.height);
      const res = cfg.quality === 'low' ? 256 : 512;
      const ref = new Reflector(geo, {
        clipBias: 0.003,
        textureWidth: res,
        textureHeight: res,
        color: new THREE.Color(m.tint).multiplyScalar(m.reflectivity)
      });
      ref.position.copy(p.position);
      ref.position.z += 0.001;
      ref.userData.basePos = ref.position.clone();
      ref.userData.explodeDir = new THREE.Vector3(0, 0, 1);
      ref.userData.explodeMag = 0.12;
      this.model.add(ref);
      this.reflectors.push(ref);
    }
  }

  /* ---------- Ground placement ---------- */
  _ground(group) {
    const box = new THREE.Box3().setFromObject(group);
    const minY = box.min.y;
    group.position.y -= minY; // feet on the floor
    this._bbox = new THREE.Box3().setFromObject(group);
  }

  /* ---------- Camera framing / views ---------- */
  frame(view = 'perspective', animate = true) {
    const box = this._bbox || new THREE.Box3().setFromObject(this.modelRoot);
    const size = new THREE.Vector3(); box.getSize(size);
    const center = new THREE.Vector3(); box.getCenter(center);
    const radius = Math.max(size.x, size.y, size.z) * 0.62 + 0.3;
    const fov = this.camera.fov * Math.PI / 180;
    const dist = radius / Math.sin(fov / 2);

    const dirs = {
      front:       new THREE.Vector3(0, 0, 1),
      side:        new THREE.Vector3(1, 0, 0.001),
      top:         new THREE.Vector3(0, 1, 0.001),
      perspective: new THREE.Vector3(0.7, 0.5, 1)
    };
    const dir = (dirs[view] || dirs.perspective).clone().normalize();
    const target = center.clone();
    const pos = center.clone().add(dir.multiplyScalar(dist));

    if (!animate) {
      this.camera.position.copy(pos); this.controls.target.copy(target); this.controls.update(); return;
    }
    this._animateCamera(pos, target, 520);
  }

  _animateCamera(toPos, toTarget, ms) {
    const fromPos = this.camera.position.clone();
    const fromTarget = this.controls.target.clone();
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const t = Math.min((now - start) / ms, 1);
      const e = ease(t);
      this.camera.position.lerpVectors(fromPos, toPos, e);
      this.controls.target.lerpVectors(fromTarget, toTarget, e);
      this.controls.update();
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  resetCamera() { this.frame('perspective', true); }

  /* ---------- Exploded view ---------- */
  setExploded(on) { this.explodeTarget = on ? 1 : 0; }
  toggleExploded() { this.explodeTarget = this.explodeTarget > 0.5 ? 0 : 1; return this.explodeTarget > 0.5; }

  _applyExplode() {
    if (!this.model) return;
    const t = this.explodeT;
    this.model.traverse((o) => {
      if (o.userData && o.userData.basePos && o.userData.explodeDir) {
        const mag = o.userData.explodeMag || 0;
        o.position.copy(o.userData.basePos).addScaledVector(o.userData.explodeDir, mag * t);
      }
    });
  }

  /* ---------- Dimension guides ---------- */
  _clearGuides() {
    while (this.guides.children.length) {
      const c = this.guides.children.pop();
      if (c.element && c.element.remove) c.element.remove();
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
      this.guides.remove(c);
    }
  }

  _buildGuides(cfg) {
    this._clearGuides();
    const W = cfg.width / 1000, H = cfg.height / 1000;
    const yFloor = this.model.position.y;
    const z = (this.model.userData.depth || 0.1) / 2 + 0.02;
    const col = this._bgKey === 'dark' ? 0x9aa0ab : 0x6a7079;
    const lineMat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.9 });

    const mkLine = (pts) => {
      const g = new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(...p)));
      return new THREE.Line(g, lineMat);
    };
    // Width guide (below)
    const wy = yFloor - 0.10;
    this.guides.add(mkLine([[-W / 2, wy, z], [W / 2, wy, z]]));
    this.guides.add(mkLine([[-W / 2, wy + 0.04, z], [-W / 2, wy - 0.04, z]]));
    this.guides.add(mkLine([[W / 2, wy + 0.04, z], [W / 2, wy - 0.04, z]]));
    // Height guide (left)
    const hx = -W / 2 - 0.12;
    this.guides.add(mkLine([[hx, yFloor, z], [hx, yFloor + H, z]]));
    this.guides.add(mkLine([[hx - 0.04, yFloor, z], [hx + 0.04, yFloor, z]]));
    this.guides.add(mkLine([[hx - 0.04, yFloor + H, z], [hx + 0.04, yFloor + H, z]]));

    this.guides.add(this._label(fmt(cfg.width, cfg.units), [0, wy - 0.06, z]));
    this.guides.add(this._label(fmt(cfg.height, cfg.units), [hx - 0.12, yFloor + H / 2, z]));
    this.guides.visible = this._guidesVisible !== false;
  }

  _label(text, pos) {
    const div = document.createElement('div');
    div.className = 'cz-dim';
    div.textContent = text;
    const obj = new CSS2DObject(div);
    obj.position.set(...pos);
    return obj;
  }

  setGuidesVisible(v) { this._guidesVisible = v; this.guides.visible = v; }
  refreshGuideUnits(cfg) { this._buildGuides(cfg); }

  /* ---------- Background ---------- */
  setBackground(key) {
    this._bgKey = key;
    const c = BG[key] || BG.studio;
    this.scene.background = new THREE.Color(c.bottom);
    // gradient via fog-free vertical: emulate with a large sphere? keep solid + ground tint.
    this.ground.material.color = new THREE.Color(c.ground);
    this.container.style.setProperty('--cz-bg-top', c.top);
    this.container.style.setProperty('--cz-bg-bottom', c.bottom);
  }

  /* ---------- Export ---------- */
  snapshot(width = 1600) {
    // Render at the current aspect, scaled up.
    const aspect = this.camera.aspect;
    const h = Math.round(width / aspect);
    const prevSize = new THREE.Vector2(); this.renderer.getSize(prevSize);
    this.renderer.setSize(width, h, false);
    this.camera.aspect = width / h; this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
    const url = this.renderer.domElement.toDataURL('image/png');
    this.renderer.setSize(prevSize.x, prevSize.y, false);
    this.camera.aspect = prevSize.x / prevSize.y; this.camera.updateProjectionMatrix();
    return url;
  }

  /* ---------- Cleanup ---------- */
  _disposeModel() {
    this._clearReflectors();
    if (this.model) {
      this.model.traverse((o) => {
        if (o.isMesh) { o.geometry && o.geometry.dispose(); }
      });
      this.modelRoot.remove(this.model);
      this.model = null;
    }
  }
}

/* Format a mm value in the chosen unit. */
function fmt(mmVal, unitId) {
  const u = byId(UNITS, unitId) || UNITS[0];
  const v = mmVal * u.factor;
  return v.toFixed(u.digits) + ' ' + u.name;
}

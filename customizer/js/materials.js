/* =============================================================
   Redheart Customizer — materials (simplified)
   -------------------------------------------------------------
   Frame colour + baked-in finish, and glass. Frame and glass are
   independent so changing one never affects the other.
   ============================================================= */
import * as THREE from 'three';
import { frameColor, glass as glassDef } from './config.js';

const FINISH = {
  matte:    { roughness: 0.6,  metalness: 0.15, clearcoat: 0.0 },
  glossy:   { roughness: 0.12, metalness: 0.25, clearcoat: 1.0 },
  brushed:  { roughness: 0.42, metalness: 0.95, clearcoat: 0.1 },
  metallic: { roughness: 0.22, metalness: 1.0,  clearcoat: 0.4 }
};

/* ---- Wood-grain procedural texture ---- */
let woodTex = null;
function wood() {
  if (woodTex) return woodTex;
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#6b4423'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 90; i++) {
    const y = Math.random() * 256;
    x.strokeStyle = `rgba(${40 + Math.random() * 60},${25 + Math.random() * 35},${10 + Math.random() * 20},${0.15 + Math.random() * 0.3})`;
    x.lineWidth = 0.5 + Math.random() * 2; x.beginPath(); x.moveTo(0, y);
    for (let px = 0; px <= 256; px += 16) x.lineTo(px, y + Math.sin(px * 0.05 + i) * 4);
    x.stroke();
  }
  woodTex = new THREE.CanvasTexture(c);
  woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
  woodTex.repeat.set(1, 3); woodTex.colorSpace = THREE.SRGBColorSpace;
  return woodTex;
}

export function buildFrameMaterial(cfg) {
  const col = frameColor(cfg.frameColor);
  const fin = FINISH[col.finish] || FINISH.matte;
  const hex = col.custom ? (cfg.customColor || col.color) : (col.colorHex || col.color);
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(hex),
    metalness: fin.metalness, roughness: fin.roughness,
    clearcoat: fin.clearcoat, clearcoatRoughness: 0.25,
    envMapIntensity: fin.metalness > 0.5 ? 1.25 : 0.9
  });
  if (col.wood) { mat.map = wood(); mat.metalness = 0; mat.roughness = 0.65; mat.clearcoat = 0.3; }
  mat.name = 'frame';
  return mat;
}

export function buildHardwareMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#2a2c30'), metalness: 0.9, roughness: 0.35, name: 'hardware'
  });
}

/* Opaque panel material (cabinet carcass / door rails). */
export function buildPanelMaterial(cfg) {
  const col = frameColor(cfg.frameColor);
  const hex = col.custom ? (cfg.customColor || col.color) : (col.colorHex || col.color);
  const c = new THREE.Color(hex);
  const mat = new THREE.MeshPhysicalMaterial({ color: c, metalness: 0.2, roughness: 0.6, name: 'panel' });
  return mat;
}

export function buildGlassMaterial(cfg) {
  const g = glassDef(cfg.glass) || glassDef('clear');
  const tint = new THREE.Color(g.tint);
  const hq = cfg.quality !== 'low';

  if (g.kind === 'reflective') {
    const mat = new THREE.MeshPhysicalMaterial({
      color: tint, metalness: 0.9, roughness: g.roughness,
      transparent: true, opacity: hq ? 0.8 : g.opacityFallback,
      envMapIntensity: 1.6, side: THREE.DoubleSide, name: 'glass'
    });
    return mat;
  }
  if (hq) {
    const mat = new THREE.MeshPhysicalMaterial({
      color: tint, metalness: 0, roughness: g.roughness,
      transmission: g.kind === 'diffuse' ? 0.72 : 1.0,
      thickness: 0.4, ior: 1.5, transparent: true, opacity: 1,
      attenuationColor: tint, attenuationDistance: g.kind === 'diffuse' ? 0.3 : 1.4,
      envMapIntensity: 1.0, side: THREE.DoubleSide, name: 'glass'
    });
    return mat;
  }
  return new THREE.MeshPhysicalMaterial({
    color: tint, metalness: 0, roughness: g.roughness,
    transparent: true, opacity: g.opacityFallback,
    envMapIntensity: 0.8, side: THREE.DoubleSide, name: 'glass'
  });
}

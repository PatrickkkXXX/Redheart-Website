/* =============================================================
   Redheart Customizer — material system
   -------------------------------------------------------------
   Builds Three.js PBR materials from the catalog data. Frame, glass
   and mirror are independent so changing one never touches another.
   Glass has two paths:
     - high quality  → MeshPhysicalMaterial with transmission
     - low quality   → cheap transparent material (mobile fallback)
   Mirror uses a real-time planar Reflector (built in geometry code).
   ============================================================= */
import * as THREE from 'three';
import { frameColor, finish, glass as glassDef } from './config.js';

/* ---------- Wood-grain procedural texture (for wood-grain frame) ---------- */
let woodTexture = null;
function getWoodTexture() {
  if (woodTexture) return woodTexture;
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#6b4423'; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 90; i++) {
    const y = Math.random() * 256;
    ctx.strokeStyle = `rgba(${40 + Math.random() * 60},${25 + Math.random() * 35},${10 + Math.random() * 20},${0.15 + Math.random() * 0.3})`;
    ctx.lineWidth = 0.5 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 256; x += 16) ctx.lineTo(x, y + Math.sin(x * 0.05 + i) * 4 + (Math.random() - 0.5) * 3);
    ctx.stroke();
  }
  woodTexture = new THREE.CanvasTexture(c);
  woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
  woodTexture.repeat.set(1, 3);
  woodTexture.colorSpace = THREE.SRGBColorSpace;
  return woodTexture;
}

/* ---------- Textured-glass procedural bump (for textured/patterned) ---------- */
let texturedBump = null;
function getTexturedBump() {
  if (texturedBump) return texturedBump;
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, 128, 128);
  for (let x = 0; x < 128; x += 8) {
    const g = ctx.createLinearGradient(x, 0, x + 8, 0);
    g.addColorStop(0, '#404040'); g.addColorStop(0.5, '#c0c0c0'); g.addColorStop(1, '#404040');
    ctx.fillStyle = g; ctx.fillRect(x, 0, 8, 128);
  }
  texturedBump = new THREE.CanvasTexture(c);
  texturedBump.wrapS = texturedBump.wrapT = THREE.RepeatWrapping;
  texturedBump.repeat.set(3, 3);
  return texturedBump;
}

/* ---------- Frame material ---------- */
export function buildFrameMaterial(cfg) {
  const col = frameColor(cfg.frameColor);
  const finId = col.forceFinish || cfg.finish;
  const fin = finish(finId) || finish('matte');
  const colorHex = col.custom ? (cfg.customColor || col.color) : col.color;

  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colorHex),
    metalness: col.metallic ? Math.max(fin.metalness, 0.85) : fin.metalness,
    roughness: fin.roughness,
    clearcoat: fin.clearcoat,
    clearcoatRoughness: 0.25,
    envMapIntensity: col.metallic ? 1.25 : 0.9
  });

  if (col.wood) {
    const tex = getWoodTexture();
    mat.map = tex;
    mat.metalness = 0.0;
    mat.roughness = 0.65;
    mat.clearcoat = 0.3;
  }
  if (fin.anisotropy && 'anisotropy' in mat) {
    mat.anisotropy = 0.6;
    mat.anisotropyRotation = Math.PI / 2;
  }
  mat.name = 'frame';
  return mat;
}

/* Lightweight hardware material (handles, rails). */
export function buildHardwareMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#2a2c30'),
    metalness: 0.9, roughness: 0.35, envMapIntensity: 1.0, name: 'hardware'
  });
}

/* ---------- Glass material ---------- */
export function buildGlassMaterial(cfg) {
  const g = glassDef(cfg.glass) || glassDef('clear');
  const tint = new THREE.Color(g.tint);
  const highQuality = cfg.quality !== 'low';

  if (highQuality && g.kind !== 'reflective') {
    // Physical transmission — realistic refraction and tint.
    const mat = new THREE.MeshPhysicalMaterial({
      color: tint,
      metalness: 0,
      roughness: g.roughness,
      transmission: g.kind === 'diffuse' ? 0.6 : 1.0,
      thickness: Math.max(2, cfg.glassThick / 4),
      ior: 1.5,
      transparent: true,
      opacity: 1,
      envMapIntensity: 1.0,
      attenuationColor: tint,
      attenuationDistance: g.kind === 'diffuse' ? 0.4 : 1.6,
      side: THREE.DoubleSide
    });
    if (g.kind === 'diffuse') { mat.transmission = 0.7; mat.roughness = g.roughness; }
    if (g.textured) { mat.bumpMap = getTexturedBump(); mat.bumpScale = 0.4; }
    mat.name = 'glass';
    return mat;
  }

  if (g.kind === 'reflective') {
    // Mirror-like solar glass: metallic sheen off the environment.
    const mat = new THREE.MeshPhysicalMaterial({
      color: tint, metalness: 0.9, roughness: g.roughness,
      transparent: true, opacity: highQuality ? 0.78 : g.opacityFallback,
      envMapIntensity: 1.6, side: THREE.DoubleSide
    });
    mat.name = 'glass';
    return mat;
  }

  // Low-quality fallback: cheap transparent material, no transmission.
  const mat = new THREE.MeshPhysicalMaterial({
    color: tint, metalness: 0.0, roughness: g.roughness,
    transparent: true, opacity: g.opacityFallback,
    envMapIntensity: 0.8, side: THREE.DoubleSide
  });
  if (g.textured) { mat.bumpMap = getTexturedBump(); mat.bumpScale = 0.4; }
  mat.name = 'glass';
  return mat;
}

/* Whether the current surface selection needs a real planar reflector. */
export function surfaceIsMirror(cfg) { return cfg.surfaceFamily === 'mirror'; }

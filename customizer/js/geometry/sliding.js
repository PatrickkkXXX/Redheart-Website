/* =============================================================
   Parametric builder — sliding / fixed windows & sliding doors
   -------------------------------------------------------------
   Produces a genuine THREE.Group built from the current config:
   outer frame, sill/head tracks, N sashes (sliding) or mullioned
   cells (fixed), glass panes, meeting rails and handles. Geometry
   adapts to width / height / frame thickness / panel count.
   Every part records basePos + explodeDir for the exploded view,
   and glass panes expose a descriptor so the scene can swap them
   for real mirror reflectors.
   All inputs are mm; Three.js units are metres.
   ============================================================= */
import * as THREE from 'three';
import { product } from '../config.js';

const mm = (v) => v / 1000;

function bar(w, h, d, mat) {
  const g = new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

function tagExplode(mesh, dir, mag) {
  mesh.userData.basePos = mesh.position.clone();
  mesh.userData.explodeDir = dir.clone().normalize();
  mesh.userData.explodeMag = mag;
}

export function buildSliding(cfg, materials) {
  const p = product(cfg.product) || {};
  const fixed = !!p.fixed;

  const W = mm(cfg.width);
  const H = mm(cfg.height);
  const prof = mm(cfg.frameThick);
  const depth = Math.max(0.07, prof * 1.5);
  const stile = Math.max(mm(34), prof * 0.78);
  const glassT = Math.max(mm(cfg.glassThick), 0.004);
  const N = Math.max(1, cfg.panels | 0);

  const frameMat = materials.frame;
  const hwMat = materials.hardware;
  const glassMat = materials.glass;

  const group = new THREE.Group();
  group.name = 'window';
  const panes = []; // { position, width, height } for mirror swapping

  /* ---------- Outer frame (4 bars) ---------- */
  const halfW = W / 2, halfH = H / 2;
  const topBar = bar(W, prof, depth, frameMat); topBar.position.set(0, halfH - prof / 2, 0);
  const botBar = bar(W, prof, depth, frameMat); botBar.position.set(0, -halfH + prof / 2, 0);
  const innerH = H - prof * 2;
  const leftBar = bar(prof, innerH, depth, frameMat); leftBar.position.set(-halfW + prof / 2, 0, 0);
  const rightBar = bar(prof, innerH, depth, frameMat); rightBar.position.set(halfW - prof / 2, 0, 0);
  tagExplode(topBar, new THREE.Vector3(0, 1, 0), 0.14);
  tagExplode(botBar, new THREE.Vector3(0, -1, 0), 0.14);
  tagExplode(leftBar, new THREE.Vector3(-1, 0, 0), 0.14);
  tagExplode(rightBar, new THREE.Vector3(1, 0, 0), 0.14);
  const frameGrp = new THREE.Group(); frameGrp.name = 'frame';
  frameGrp.add(topBar, botBar, leftBar, rightBar);
  group.add(frameGrp);

  const openW = W - prof * 2;
  const openH = H - prof * 2;

  /* ---------- Sill & head tracks (sliding only) ---------- */
  if (!fixed) {
    const railD = depth * 0.12;
    const tracksGrp = new THREE.Group(); tracksGrp.name = 'tracks';
    const zPositions = [depth * 0.18, -depth * 0.18];
    for (const z of zPositions) {
      const sill = bar(openW, prof * 0.18, railD, hwMat);
      sill.position.set(0, -halfH + prof + prof * 0.09, z);
      tracksGrp.add(sill);
      const head = bar(openW, prof * 0.14, railD, hwMat);
      head.position.set(0, halfH - prof - prof * 0.07, z);
      tracksGrp.add(head);
    }
    tracksGrp.children.forEach((c) => tagExplode(c, new THREE.Vector3(0, -1, 0), 0.05));
    group.add(tracksGrp);
  }

  /* ---------- Panels ---------- */
  const panelsGrp = new THREE.Group(); panelsGrp.name = 'panels';
  const panelW = openW / N;

  if (fixed && N > 1) {
    // Fixed: shared mullions, coplanar glass cells.
    for (let i = 1; i < N; i++) {
      const x = -openW / 2 + panelW * i;
      const mull = bar(stile, openH, depth * 0.9, frameMat);
      mull.position.set(x, 0, 0);
      tagExplode(mull, new THREE.Vector3(0, 1, 0), 0.0);
      panelsGrp.add(mull);
    }
    for (let i = 0; i < N; i++) {
      const cx = -openW / 2 + panelW * (i + 0.5);
      const gw = panelW - (i === 0 || i === N - 1 ? stile * 1.5 : stile * 2);
      const gh = openH - stile * 0.6;
      addPane(panelsGrp, panes, glassMat, glassT, cx, 0, 0, gw, gh, new THREE.Vector3(0, 0, 1), 0.10 + i * 0.04);
    }
  } else {
    // Sliding (or single fixed): individual sashes, alternating tracks.
    for (let i = 0; i < N; i++) {
      const cx = -openW / 2 + panelW * (i + 0.5);
      const zOff = fixed ? 0 : (i % 2 === 0 ? depth * 0.18 : -depth * 0.18);
      const sash = buildSash(panelW, openH, stile, depth, zOff, frameMat, hwMat, glassMat, glassT,
        cx, panes, i, N, fixed, !!p.door);
      panelsGrp.add(sash);
    }
  }
  group.add(panelsGrp);

  /* ---------- Centre the group vertically on the ground ---------- */
  group.userData.height = H;
  group.userData.width = W;
  group.userData.depth = depth;
  group.userData.panes = panes;
  return group;
}

function buildSash(panelW, openH, stile, depth, zOff, frameMat, hwMat, glassMat, glassT, cx, panes, i, N, fixed, isDoor) {
  const sash = new THREE.Group();
  sash.name = 'sash-' + i;
  const sashD = depth * 0.5;
  const w = panelW;
  const h = openH;

  const top = bar(w, stile, sashD, frameMat); top.position.set(0, h / 2 - stile / 2, 0);
  const bot = bar(w, stile, sashD, frameMat); bot.position.set(0, -h / 2 + stile / 2, 0);
  const lft = bar(stile, h - stile * 2, sashD, frameMat); lft.position.set(-w / 2 + stile / 2, 0, 0);
  const rgt = bar(stile, h - stile * 2, sashD, frameMat); rgt.position.set(w / 2 - stile / 2, 0, 0);
  sash.add(top, bot, lft, rgt);

  // Glass pane within the sash.
  const gw = w - stile * 2;
  const gh = h - stile * 2;
  addPane(sash, panes, glassMat, glassT, cx, 0, zOff, gw, gh, new THREE.Vector3(0, 0, 1), 0.12 + i * 0.05);

  // Handle on operable sliding sashes (vertical bar + grip).
  if (!fixed) {
    const onLeft = i % 2 === 0; // handle on the meeting stile
    const hx = onLeft ? (w / 2 - stile * 0.5) : (-w / 2 + stile * 0.5);
    const handleH = isDoor ? Math.min(h * 0.4, 0.9) : Math.min(h * 0.3, 0.45);
    const handle = bar(stile * 0.35, handleH, sashD * 0.9, hwMat);
    handle.position.set(hx, 0, sashD * 0.55);
    tagExplode(handle, new THREE.Vector3(0, 0, 1), 0.22 + i * 0.05);
    sash.add(handle);
  }

  sash.position.set(cx, 0, zOff);
  // Explode: fan the sashes apart along X and push forward in Z.
  const dir = new THREE.Vector3((i - (N - 1) / 2) * 0.4, 0, 1).normalize();
  sash.userData.basePos = sash.position.clone();
  sash.userData.explodeDir = dir;
  sash.userData.explodeMag = fixed ? 0.0 : 0.10 + i * 0.05;

  // Tag sash frame bars for a subtle explode too.
  [top, bot, lft, rgt].forEach((b) => tagExplode(b, new THREE.Vector3(0, 0, 1), 0.02));
  return sash;
}

function addPane(parent, panes, glassMat, glassT, x, y, z, w, h, explodeDir, explodeMag) {
  const geo = new THREE.BoxGeometry(Math.max(w, 0.05), Math.max(h, 0.05), glassT);
  const mesh = new THREE.Mesh(geo, glassMat);
  mesh.position.set(x, y, z);
  mesh.name = 'glassPane';
  mesh.renderOrder = 2;
  mesh.castShadow = false;
  mesh.userData.basePos = mesh.position.clone();
  mesh.userData.explodeDir = explodeDir.clone().normalize();
  mesh.userData.explodeMag = explodeMag;
  parent.add(mesh);
  panes.push({ position: new THREE.Vector3(x, y, z), width: Math.max(w, 0.05), height: Math.max(h, 0.05), mesh });
  return mesh;
}

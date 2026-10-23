/* =============================================================
   Parametric builder — aluminium & glass cabinets
   -------------------------------------------------------------
   Carcass (sides / top / bottom / back) + shelves + glass doors
   (hinged ajar or sliding). Fixed proportions; panels = door count.
   ============================================================= */
import * as THREE from 'three';

function bar(w, h, d, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(Math.max(w, 0.004), Math.max(h, 0.004), Math.max(d, 0.004)), mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

function makeDoor(w, h, stile, t, frameMat, glassMat, hwMat, handleSide) {
  const g = new THREE.Group();
  const top = bar(w, stile, t, frameMat); top.position.set(0, h / 2 - stile / 2, 0);
  const bot = bar(w, stile, t, frameMat); bot.position.set(0, -h / 2 + stile / 2, 0);
  const lft = bar(stile, h - stile * 2, t, frameMat); lft.position.set(-w / 2 + stile / 2, 0, 0);
  const rgt = bar(stile, h - stile * 2, t, frameMat); rgt.position.set(w / 2 - stile / 2, 0, 0);
  g.add(top, bot, lft, rgt);
  const glass = bar(w - stile * 2, h - stile * 2, 0.006, glassMat);
  glass.name = 'glassPane'; glass.castShadow = false; g.add(glass);
  const hx = handleSide === 'right' ? (w / 2 - stile * 0.7) : (-w / 2 + stile * 0.7);
  const handle = bar(stile * 0.35, h * 0.16, t * 1.6, hwMat);
  handle.position.set(hx, 0, t); g.add(handle);
  return g;
}

function hinge(door, pivot, angle) {
  const p = new THREE.Group();
  p.position.copy(pivot);
  door.position.sub(pivot);
  p.add(door);
  p.rotation.y = angle;
  return p;
}

export function buildCabinet(cfg, style, materials) {
  const panels = style.panels;
  const tall = !!style.tall;
  const stacked = !!style.stacked;

  const W = stacked ? 1.1 : 0.95;
  const H = tall ? 1.85 : 1.15;
  const D = 0.38;
  const t = 0.02;            // carcass thickness
  const stile = 0.04;

  const carcassMat = materials.panel;
  const frameMat = materials.frame;
  const glassMat = materials.glass;
  const hwMat = materials.hardware;

  const group = new THREE.Group();
  group.name = 'cabinet';
  const halfW = W / 2, halfH = H / 2, halfD = D / 2;

  // Carcass
  const addAt = (mesh, x, y, z) => { mesh.position.set(x, y, z); group.add(mesh); };
  addAt(bar(t, H, D, carcassMat), -halfW + t / 2, 0, 0);
  addAt(bar(t, H, D, carcassMat), halfW - t / 2, 0, 0);
  addAt(bar(W, t, D, carcassMat), 0, halfH - t / 2, 0);
  addAt(bar(W, t, D, carcassMat), 0, -halfH + t / 2, 0);
  addAt(bar(W - t * 2, H - t * 2, t, carcassMat), 0, 0, -halfD + t / 2);

  // Shelves
  const shelfCount = tall ? 4 : 2;
  for (let i = 1; i <= shelfCount; i++) {
    const y = -halfH + (H * i) / (shelfCount + 1);
    const sh = bar(W - t * 2, t * 0.7, D - t * 2, carcassMat);
    sh.position.set(0, y, 0); group.add(sh);
  }

  // Feet
  const footH = 0.05;
  [[-halfW + t, -halfD + t], [halfW - t, -halfD + t], [-halfW + t, halfD - t], [halfW - t, halfD - t]].forEach(([x, z]) => {
    const f = bar(t * 1.4, footH, t * 1.4, hwMat);
    f.position.set(x, -halfH - footH / 2, z); group.add(f);
  });

  // Doors on the front
  const frontZ = halfD + 0.004;
  const openW = W - t * 2;

  if (style.opening === 'sliding') {
    const pw = openW / 2 + 0.04;
    for (let i = 0; i < 2; i++) {
      const door = makeDoor(pw, H - t * 2, stile, 0.016, frameMat, glassMat, hwMat, i === 0 ? 'right' : 'left');
      door.position.set(-openW / 4 + (openW / 2) * i, 0, frontZ - (i % 2 === 0 ? 0 : 0.02));
      group.add(door);
    }
  } else if (stacked) {
    // 2 columns × 2 rows, hinged ajar
    const colW = openW / 2;
    const rowH = (H - t * 2) / 2;
    for (let c = 0; c < 2; c++) {
      for (let r = 0; r < 2; r++) {
        const door = makeDoor(colW - 0.004, rowH - 0.004, stile, 0.016, frameMat, glassMat, hwMat, c === 0 ? 'right' : 'left');
        const cx = -openW / 4 + colW * c;
        const cy = -((H - t * 2) / 4) + rowH * r;
        door.position.set(cx, cy, frontZ);
        const pivotX = c === 0 ? -openW / 2 : openW / 2;
        const ang = c === 0 ? 0.28 : -0.28;
        group.add(hinge(door, new THREE.Vector3(pivotX, cy, frontZ), ang));
      }
    }
  } else {
    // 2 hinged doors ajar
    const colW = openW / 2;
    for (let c = 0; c < 2; c++) {
      const door = makeDoor(colW - 0.004, H - t * 2 - 0.004, stile, 0.016, frameMat, glassMat, hwMat, c === 0 ? 'right' : 'left');
      door.position.set(-openW / 4 + colW * c, 0, frontZ);
      const pivotX = c === 0 ? -openW / 2 : openW / 2;
      const ang = c === 0 ? 0.3 : -0.3;
      group.add(hinge(door, new THREE.Vector3(pivotX, 0, frontZ), ang));
    }
  }

  group.userData.size = { W, H: H + footH, depth: D };
  return group;
}

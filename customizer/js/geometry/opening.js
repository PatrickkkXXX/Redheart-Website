/* =============================================================
   Parametric builder — windows & doors
   -------------------------------------------------------------
   Fixed, tasteful proportions (no user dimensions). The style's
   `opening` decides how the sashes sit:
     sliding · fixed · casement · butterfly · french · swing · awning
   Returns a centred THREE.Group (feet on y=0 handled by the scene).
   Units: metres.
   ============================================================= */
import * as THREE from 'three';

function bar(w, h, d, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(Math.max(w, 0.004), Math.max(h, 0.004), Math.max(d, 0.004)), mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

/* A sash: frame of `stile` width enclosing a glass pane, centred at origin. */
function makeSash(w, h, stile, depth, frameMat, glassMat, hwMat, handleSide) {
  const g = new THREE.Group();
  const d = depth * 0.55;
  const top = bar(w, stile, d, frameMat); top.position.set(0, h / 2 - stile / 2, 0);
  const bot = bar(w, stile, d, frameMat); bot.position.set(0, -h / 2 + stile / 2, 0);
  const lft = bar(stile, h - stile * 2, d, frameMat); lft.position.set(-w / 2 + stile / 2, 0, 0);
  const rgt = bar(stile, h - stile * 2, d, frameMat); rgt.position.set(w / 2 - stile / 2, 0, 0);
  g.add(top, bot, lft, rgt);

  const glass = bar(w - stile * 2, h - stile * 2, Math.max(depth * 0.08, 0.006), glassMat);
  glass.castShadow = false; glass.name = 'glassPane';
  g.add(glass);

  if (handleSide) {
    const hx = handleSide === 'right' ? (w / 2 - stile * 0.6) : (-w / 2 + stile * 0.6);
    const handle = bar(stile * 0.4, Math.min(h * 0.28, 0.4), d * 1.1, hwMat);
    handle.position.set(hx, 0, d * 0.7);
    g.add(handle);
  }
  return g;
}

/* Wrap a sash in a hinge pivot and rotate it open. */
function hinge(sash, pivot, axis, angle) {
  const p = new THREE.Group();
  p.position.copy(pivot);
  sash.position.sub(pivot);
  p.add(sash);
  p.rotation[axis] = angle;
  return p;
}

export function buildOpening(cfg, style, materials) {
  const cat = style.cat;
  const panels = style.panels;
  const opening = style.opening;

  const H = cat === 'door' ? 2.1 : 1.25;
  const profile = cat === 'door' ? 0.055 : 0.05;
  const depth = cat === 'door' ? 0.13 : 0.12;
  const stile = cat === 'door' ? 0.05 : 0.045;
  let W = 0.45 * panels + 0.6;
  if (cat === 'door') W = 0.5 * panels + 0.45;
  if (opening === 'casement' || opening === 'butterfly' || opening === 'french') W = cat === 'door' ? 1.5 : 1.45;
  if (opening === 'swing') W = 0.95;
  if (opening === 'awning') W = 1.1;

  const frameMat = materials.frame, glassMat = materials.glass, hwMat = materials.hardware;
  const group = new THREE.Group();
  group.name = 'opening';

  // Outer frame
  const halfW = W / 2, halfH = H / 2;
  const fg = new THREE.Group(); fg.name = 'frame';
  const fTop = bar(W, profile, depth, frameMat); fTop.position.set(0, halfH - profile / 2, 0);
  const fBot = bar(W, profile, depth, frameMat); fBot.position.set(0, -halfH + profile / 2, 0);
  const fLft = bar(profile, H - profile * 2, depth, frameMat); fLft.position.set(-halfW + profile / 2, 0, 0);
  const fRgt = bar(profile, H - profile * 2, depth, frameMat); fRgt.position.set(halfW - profile / 2, 0, 0);
  fg.add(fTop, fBot, fLft, fRgt);
  group.add(fg);

  const openW = W - profile * 2, openH = H - profile * 2;

  if (opening === 'fixed') {
    const glass = bar(openW - 0.01, openH - 0.01, Math.max(depth * 0.08, 0.006), glassMat);
    glass.name = 'glassPane'; group.add(glass);

  } else if (opening === 'sliding') {
    const panelW = openW / panels;
    for (let i = 0; i < panels; i++) {
      const cx = -openW / 2 + panelW * (i + 0.5);
      const z = (i % 2 === 0 ? 1 : -1) * depth * 0.15;
      const sash = makeSash(panelW, openH, stile, depth, frameMat, glassMat, hwMat, i % 2 === 0 ? 'right' : 'left');
      sash.position.set(cx, 0, z);
      group.add(sash);
    }
    // sill + head tracks
    [depth * 0.15, -depth * 0.15].forEach((z) => {
      const sill = bar(openW, profile * 0.16, depth * 0.1, hwMat);
      sill.position.set(0, -halfH + profile + profile * 0.08, z); group.add(sill);
    });

  } else if (opening === 'casement' || opening === 'french') {
    const ang = opening === 'french' ? 0.5 : 0.33;
    const pw = openW / 2;
    const left = makeSash(pw, openH, stile, depth, frameMat, glassMat, hwMat, 'right');
    left.position.set(-pw / 2, 0, 0);
    group.add(hinge(left, new THREE.Vector3(-openW / 2, 0, 0), 'y', ang));
    const right = makeSash(pw, openH, stile, depth, frameMat, glassMat, hwMat, 'left');
    right.position.set(pw / 2, 0, 0);
    group.add(hinge(right, new THREE.Vector3(openW / 2, 0, 0), 'y', -ang));

  } else if (opening === 'butterfly') {
    const pw = openW / 2;
    const left = makeSash(pw, openH, stile, depth, frameMat, glassMat, hwMat, 'left');
    left.position.set(-pw / 2, 0, 0);
    group.add(hinge(left, new THREE.Vector3(0, 0, 0), 'y', -0.33));
    const right = makeSash(pw, openH, stile, depth, frameMat, glassMat, hwMat, 'right');
    right.position.set(pw / 2, 0, 0);
    group.add(hinge(right, new THREE.Vector3(0, 0, 0), 'y', 0.33));

  } else if (opening === 'swing') {
    const sash = makeSash(openW, openH, stile, depth, frameMat, glassMat, hwMat, 'right');
    sash.position.set(0, 0, 0);
    group.add(hinge(sash, new THREE.Vector3(-openW / 2, 0, 0), 'y', 0.6));

  } else if (opening === 'awning') {
    const sash = makeSash(openW, openH, stile, depth, frameMat, glassMat, hwMat, null);
    sash.position.set(0, 0, 0);
    group.add(hinge(sash, new THREE.Vector3(0, openH / 2, 0), 'x', 0.33));
  }

  group.userData.size = { W, H, depth };
  return group;
}

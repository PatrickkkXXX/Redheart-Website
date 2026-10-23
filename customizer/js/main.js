/* =============================================================
   Redheart Customizer — application wiring
   ============================================================= */
import { ConfigStore } from './state.js';
import { Viewer } from './scene.js';
import { UI } from './ui.js';
import { computeEstimate, money } from './pricing.js';
import { product, frameColor, finish, glass as glassDef, mirror as mirrorDef, byId, UNITS, ACCESSORIES } from './config.js';

const MESSENGER = 'https://m.me/RedHeart24';

const GEOMETRY_KEYS = ['product', 'width', 'height', 'frameThick', 'panels', 'glassThick', 'depth'];
const FRAME_KEYS = ['frameColor', 'customColor', 'finish'];
const GLASS_KEYS = ['glass', 'quality', 'surfaceFamily', 'mirror'];

function boot() {
  const stage = document.getElementById('cz-viewer');
  const left = document.getElementById('cz-left');
  const right = document.getElementById('cz-right');
  const loading = document.getElementById('cz-loading');

  // Initial config: URL → localStorage → default
  const initial = ConfigStore.fromURL() || ConfigStore.load() || null;
  const store = new ConfigStore(initial || undefined);

  let viewer;
  try {
    viewer = new Viewer(stage);
  } catch (err) {
    loading.innerHTML = '<div class="cz-error"><strong>3D viewer could not start.</strong><br>' +
      'Your browser may not support WebGL. ' + String(err && err.message || err) + '</div>';
    return;
  }

  const ui = new UI(store, left, right);

  // First build
  viewer.rebuild(store.get());
  viewer.frame('perspective', false);
  ui.renderState(store.get());
  ui.showValidation(store.validate());
  requestAnimationFrame(() => loading.classList.add('is-hidden'));

  // React to changes
  store.subscribe((cfg, changed) => {
    const hit = (keys) => keys.some((k) => changed.includes(k));
    if (hit(GEOMETRY_KEYS)) {
      viewer.rebuild(cfg);
      if (changed.includes('product')) viewer.frame('perspective', true);
    } else {
      if (hit(FRAME_KEYS)) viewer.updateFrame(cfg);
      if (hit(GLASS_KEYS)) viewer.updateGlass(cfg);
    }
    if (changed.includes('background')) viewer.setBackground(cfg.background);
    if (changed.includes('units')) viewer.refreshGuideUnits(cfg);
    ui.renderState(cfg);
    ui.showValidation(store.validate());
  });

  wireToolbar(store, viewer);
  wireActions(store, viewer, ui);
  wireQuote(store);
}

/* ---------------- Toolbar (views, reset, explode, fullscreen, bg, quality, units) ---------------- */
function wireToolbar(store, viewer) {
  document.querySelectorAll('[data-view]').forEach((b) =>
    b.addEventListener('click', () => viewer.frame(b.dataset.view, true)));

  const reset = document.querySelector('[data-action="reset-cam"]');
  reset && reset.addEventListener('click', () => viewer.resetCamera());

  const explode = document.querySelector('[data-action="explode"]');
  explode && explode.addEventListener('click', () => {
    const on = viewer.toggleExploded();
    explode.classList.toggle('is-active', on);
    explode.setAttribute('aria-pressed', String(on));
  });

  const full = document.querySelector('[data-action="fullscreen"]');
  full && full.addEventListener('click', () => {
    const app = document.getElementById('cz-stage');
    if (!document.fullscreenElement) app.requestFullscreen && app.requestFullscreen();
    else document.exitFullscreen && document.exitFullscreen();
  });

  const guides = document.querySelector('[data-action="guides"]');
  guides && guides.addEventListener('click', () => {
    const visNow = viewer._guidesVisible !== false;
    viewer.setGuidesVisible(!visNow);
    guides.classList.toggle('is-active', !visNow);
  });

  document.querySelectorAll('[data-bg]').forEach((b) =>
    b.addEventListener('click', () => {
      store.patch({ background: b.dataset.bg });
      document.querySelectorAll('[data-bg]').forEach((x) => x.classList.toggle('is-active', x === b));
    }));

  document.querySelectorAll('[data-unit]').forEach((b) =>
    b.addEventListener('click', () => {
      store.patch({ units: b.dataset.unit });
      document.querySelectorAll('[data-unit]').forEach((x) => x.classList.toggle('is-active', x.dataset.unit === b.dataset.unit));
    }));

  document.querySelectorAll('[data-quality]').forEach((b) =>
    b.addEventListener('click', () => {
      store.patch({ quality: b.dataset.quality });
      document.querySelectorAll('[data-quality]').forEach((x) => x.classList.toggle('is-active', x.dataset.quality === b.dataset.quality));
    }));
}

/* ---------------- Right-panel actions ---------------- */
function wireActions(store, viewer, ui) {
  const on = (act, fn) => {
    const b = document.querySelector(`[data-act="${act}"]`);
    b && b.addEventListener('click', fn);
  };

  on('save', () => {
    const ok = store.save();
    toast(ok ? 'Configuration saved to this browser.' : 'Could not save (storage blocked).');
  });

  on('share', async () => {
    const url = store.toURL();
    try {
      await navigator.clipboard.writeText(url);
      toast('Shareable link copied to clipboard.');
    } catch (e) {
      modal('Shareable link', el('input', { class: 'cz-input', value: url, readonly: 'readonly',
        onclick: (ev) => ev.target.select() }));
    }
    history.replaceState(null, '', url);
  });

  on('export', () => {
    const data = viewer.snapshot(1800);
    downloadData(data, fileName(store.get(), 'png'));
    toast('Preview image exported.');
  });

  on('spec', () => {
    const txt = specSheet(store.get());
    downloadData('data:text/plain;charset=utf-8,' + encodeURIComponent(txt), fileName(store.get(), 'txt'));
    toast('Specification sheet downloaded.');
  });

  let compareA = null;
  on('setcompare', () => {
    compareA = { img: viewer.snapshot(1000), summary: shortSummary(store.get()) };
    toast('Current design saved as "A". Change something, then press Compare.');
  });
  on('compare', () => {
    const b = { img: viewer.snapshot(1000), summary: shortSummary(store.get()) };
    const wrap = el('div', { class: 'cz-compare' }, [
      compareA ? compareCol('A', compareA) : el('div', { class: 'cz-compare-col cz-compare-empty', text: 'Press "Set A/B" first to capture a design to compare against.' }),
      compareCol(compareA ? 'B (current)' : 'Current', b)
    ]);
    modal('Compare configurations', wrap, 'wide');
  });
}

function compareCol(label, data) {
  return el('div', { class: 'cz-compare-col' }, [
    el('div', { class: 'cz-compare-label', text: label }),
    el('img', { class: 'cz-compare-img', src: data.img, alt: label + ' preview' }),
    el('p', { class: 'cz-compare-sum', text: data.summary })
  ]);
}

/* ---------------- Quote form ---------------- */
function wireQuote(store) {
  const form = document.getElementById('czQuote');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.elements.name.value.trim();
    const phone = form.elements.phone.value.trim();
    const note = form.elements.message.value.trim();
    if (name.length < 2 || phone.replace(/\D/g, '').length < 7) {
      toast('Please add your name and a contact number.');
      return;
    }
    const cfg = store.get();
    const est = computeEstimate(cfg);
    const body = [
      'Product customizer enquiry — Redheart website.',
      '',
      'Name: ' + name,
      'Contact: ' + phone,
      note ? 'Notes: ' + note : null,
      '',
      '— Configuration —',
      specSheet(cfg, true),
      est ? '\nIndicative estimate: ' + money(est.total, cfg) + ' (not final)' : '',
      '',
      'Saved design link:',
      store.toURL()
    ].filter((l) => l !== null).join('\n');
    window.open(MESSENGER + '?text=' + encodeURIComponent(body), '_blank', 'noopener');
    toast('Opening Messenger with your configuration…');
  });
}

/* ---------------- Helpers ---------------- */
function el(tag, props = {}, kids = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (v != null) n.setAttribute(k, v);
  }
  (Array.isArray(kids) ? kids : [kids]).forEach((c) => c && n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
  return n;
}

function fmtDim(mmVal, unitId) {
  const u = byId(UNITS, unitId) || UNITS[0];
  return (mmVal * u.factor).toFixed(u.digits) + ' ' + u.name;
}

function shortSummary(cfg) {
  const p = product(cfg.product);
  const surf = cfg.surfaceFamily === 'mirror' ? mirrorDef(cfg.mirror) : glassDef(cfg.glass);
  return `${p ? p.name : cfg.product} · ${fmtDim(cfg.width, cfg.units)} × ${fmtDim(cfg.height, cfg.units)} · ${frameColor(cfg.frameColor).name} · ${surf ? surf.name : ''} · ${cfg.panels}-panel`;
}

function specSheet(cfg, compact = false) {
  const p = product(cfg.product);
  const fc = frameColor(cfg.frameColor);
  const fin = finish(fc.forceFinish || cfg.finish);
  const isMirror = cfg.surfaceFamily === 'mirror';
  const surf = isMirror ? mirrorDef(cfg.mirror) : glassDef(cfg.glass);
  const acc = (cfg.accessories || []).map((id) => (byId(ACCESSORIES, id) || {}).name).filter(Boolean);
  const lines = [
    'REDHEART GLASS & ALUMINUM — PRODUCT SPECIFICATION',
    compact ? '' : '================================================',
    'Product: ' + (p ? p.name : cfg.product),
    'Opening: ' + (p && p.fixed ? 'Fixed' : (p && p.door ? 'Sliding door' : 'Sliding')),
    'Dimensions: ' + fmtDim(cfg.width, cfg.units) + ' W × ' + fmtDim(cfg.height, cfg.units) + ' H',
    'Panels: ' + cfg.panels,
    'Frame colour: ' + fc.name + (fc.custom ? ' (' + cfg.customColor + ')' : ''),
    'Frame finish: ' + (fin ? fin.name : '—'),
    'Frame thickness: ' + cfg.frameThick + ' mm',
    (isMirror ? 'Mirror: ' : 'Glass: ') + (surf ? surf.name : '—'),
    'Specification: ' + (surf ? surf.spec : '—'),
    'Glass thickness: ' + cfg.glassThick + ' mm',
    'Accessories: ' + (acc.length ? acc.join(', ') : 'None')
  ];
  return lines.filter((l) => l !== '').join('\n');
}

function fileName(cfg, ext) {
  const p = product(cfg.product);
  const base = (p ? p.id : 'redheart') + '-' + cfg.width + 'x' + cfg.height;
  return 'redheart-' + base + '.' + ext;
}

function downloadData(dataUrl, name) {
  const a = document.createElement('a');
  a.href = dataUrl; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
}

let toastTimer = null;
function toast(msg) {
  let t = document.getElementById('cz-toast');
  if (!t) { t = el('div', { id: 'cz-toast', class: 'cz-toast' }); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('is-show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-show'), 2600);
}

function modal(title, bodyNode, size) {
  const close = () => overlay.remove();
  const overlay = el('div', { class: 'cz-modal' + (size === 'wide' ? ' cz-modal-wide' : ''),
    onclick: (e) => { if (e.target === overlay) close(); } }, [
    el('div', { class: 'cz-modal-box' }, [
      el('div', { class: 'cz-modal-head' }, [
        el('h3', { text: title }),
        el('button', { class: 'cz-modal-close', type: 'button', 'aria-label': 'Close', text: '✕', onclick: close })
      ]),
      el('div', { class: 'cz-modal-body' }, bodyNode)
    ])
  ]);
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
  document.body.appendChild(overlay);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

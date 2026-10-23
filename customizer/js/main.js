/* =============================================================
   Redheart Customizer — wiring (simplified)
   ============================================================= */
import { ConfigStore } from './state.js';
import { Viewer } from './scene.js';
import { UI } from './ui.js';
import { style as styleDef, frameColor, glass as glassDef, CATEGORIES, byId } from './config.js';

const MESSENGER = 'https://m.me/RedHeart24';
const GEOMETRY_KEYS = ['style'];
const FRAME_KEYS = ['frameColor', 'customColor'];
const GLASS_KEYS = ['glass', 'quality'];

function boot() {
  const stage = document.getElementById('cz-viewer');
  const left = document.getElementById('cz-left');
  const right = document.getElementById('cz-right');
  const loading = document.getElementById('cz-loading');

  const initial = ConfigStore.fromURL() || ConfigStore.load() || null;
  const store = new ConfigStore(initial || undefined);

  let viewer;
  try { viewer = new Viewer(stage); }
  catch (err) {
    console.error('Viewer init failed:', err);
    loading.innerHTML = '<div class="cz-error"><strong>3D viewer could not start.</strong><br>' +
      String((err && err.message) || err) + '</div>';
    return;
  }

  const ui = new UI(store, left, right);
  viewer.rebuild(store.get());
  viewer.frame('perspective', false);
  viewer.setAutoRotate(store.get().autoRotate);
  ui.renderState(store.get());
  requestAnimationFrame(() => loading.classList.add('is-hidden'));

  store.subscribe((cfg, changed) => {
    const hit = (ks) => ks.some((k) => changed.includes(k));
    if (hit(GEOMETRY_KEYS)) { viewer.rebuild(cfg); viewer.frame('perspective', true); }
    else {
      if (hit(FRAME_KEYS)) viewer.updateFrame(cfg);
      if (hit(GLASS_KEYS)) viewer.updateGlass(cfg);
    }
    if (changed.includes('background')) viewer.setBackground(cfg.background);
    ui.renderState(cfg);
  });

  wireToolbar(store, viewer);
  wireActions(store, viewer);
  wireQuote(store);
}

function wireToolbar(store, viewer) {
  document.querySelectorAll('[data-view]').forEach((b) =>
    b.addEventListener('click', () => viewer.frame(b.dataset.view, true)));
  const reset = document.querySelector('[data-action="reset-cam"]');
  reset && reset.addEventListener('click', () => viewer.resetCamera());

  const spin = document.querySelector('[data-action="spin"]');
  spin && spin.addEventListener('click', () => {
    const on = !(viewer.autoRotate);
    viewer.setAutoRotate(on);
    store.patch({ autoRotate: on });
    spin.classList.toggle('is-active', on);
  });

  const full = document.querySelector('[data-action="fullscreen"]');
  full && full.addEventListener('click', () => {
    const app = document.getElementById('cz-stage');
    if (!document.fullscreenElement) app.requestFullscreen && app.requestFullscreen();
    else document.exitFullscreen && document.exitFullscreen();
  });

  document.querySelectorAll('[data-bg]').forEach((b) =>
    b.addEventListener('click', () => {
      store.patch({ background: b.dataset.bg });
      document.querySelectorAll('[data-bg]').forEach((x) => x.classList.toggle('is-active', x === b));
    }));
}

function wireActions(store, viewer) {
  const on = (act, fn) => { const b = document.querySelector(`[data-act="${act}"]`); b && b.addEventListener('click', fn); };
  on('save', () => toast(store.save() ? 'Design saved to this browser.' : 'Could not save (storage blocked).'));
  on('share', async () => {
    const url = store.toURL();
    try { await navigator.clipboard.writeText(url); toast('Shareable link copied.'); }
    catch (e) { modal('Shareable link', el('input', { class: 'cz-input', value: url, readonly: 'readonly', onclick: (ev) => ev.target.select() })); }
    history.replaceState(null, '', url);
  });
  on('export', () => { downloadData(viewer.snapshot(1800), fileName(store.get())); toast('Preview image exported.'); });
}

function wireQuote(store) {
  const form = document.getElementById('czQuote');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.elements.name.value.trim(), phone = form.elements.phone.value.trim(), note = form.elements.message.value.trim();
    if (name.length < 2 || phone.replace(/\D/g, '').length < 7) { toast('Please add your name and a contact number.'); return; }
    const body = [
      'Design enquiry — Redheart 3D customizer.', '',
      'Name: ' + name, 'Contact: ' + phone, note ? 'Notes: ' + note : null, '',
      summaryText(store.get()), '', 'Saved design:', store.toURL()
    ].filter((l) => l !== null).join('\n');
    window.open(MESSENGER + '?text=' + encodeURIComponent(body), '_blank', 'noopener');
    toast('Opening Messenger with your design…');
  });
}

/* helpers */
function summaryText(cfg) {
  const st = styleDef(cfg.style), fc = frameColor(cfg.frameColor), g = glassDef(cfg.glass);
  const cat = byId(CATEGORIES, st ? st.cat : '');
  return ['— Design —',
    'Product: ' + (cat ? cat.name : ''),
    'Style: ' + (st ? st.name : ''),
    'Aluminium: ' + fc.name + (fc.custom ? ' (' + cfg.customColor + ')' : ''),
    'Glass: ' + (g ? g.name : '')].join('\n');
}
function fileName(cfg) { const st = styleDef(cfg.style); return 'redheart-' + (st ? st.id : 'design') + '.png'; }
function downloadData(url, name) { const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }

let toastTimer = null;
function toast(msg) {
  let t = document.getElementById('cz-toast');
  if (!t) { t = el('div', { id: 'cz-toast', class: 'cz-toast' }); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('is-show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('is-show'), 2600);
}
function modal(title, body) {
  const close = () => ov.remove();
  const ov = el('div', { class: 'cz-modal', onclick: (e) => { if (e.target === ov) close(); } }, [
    el('div', { class: 'cz-modal-box' }, [
      el('div', { class: 'cz-modal-head' }, [el('h3', { text: title }), el('button', { class: 'cz-modal-close', type: 'button', text: '✕', onclick: close })]),
      el('div', { class: 'cz-modal-body' }, body)
    ])
  ]);
  document.body.appendChild(ov);
}
function el(tag, props = {}, kids = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (v != null) n.setAttribute(k, v);
  }
  (Array.isArray(kids) ? kids : [kids]).forEach((c) => c != null && n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
  return n;
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

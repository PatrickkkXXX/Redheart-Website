/* =============================================================
   Redheart Customizer — UI panels (simplified)
   Product (window/door/cabinet) · aluminium colour · glass.
   ============================================================= */
import {
  CATEGORIES, STYLES, FRAME_COLORS, GLASS, stylesIn,
  style as styleDef, frameColor, glass as glassDef, byId
} from './config.js';

function el(tag, props = {}, kids = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(n.dataset, v);
    else if (v != null) n.setAttribute(k, v);
  }
  (Array.isArray(kids) ? kids : [kids]).forEach((c) => c != null && n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
  return n;
}

export class UI {
  constructor(store, left, right) {
    this.store = store; this.left = left; this.right = right; this.refs = {};
    this._buildLeft(); this._buildRight();
  }

  section(title, body) {
    return el('div', { class: 'cz-section' }, [
      el('h3', { class: 'cz-section-title', text: title }),
      el('div', { class: 'cz-section-body' }, body)
    ]);
  }

  _buildLeft() {
    const s = this.store;

    // Category tabs
    const cats = el('div', { class: 'cz-tabs' },
      CATEGORIES.map((c) => el('button', {
        class: 'cz-tab', type: 'button', dataset: { cat: c.id }, text: c.name,
        onclick: () => this._pickCategory(c.id)
      })));
    this.refs.cats = cats;

    const styleGrid = el('div', { class: 'cz-styles' });
    this.refs.styleGrid = styleGrid;

    // Colours
    const swatches = el('div', { class: 'cz-swatches' },
      FRAME_COLORS.map((c) => {
        const b = el('button', { class: 'cz-swatch', type: 'button', title: c.name, dataset: { color: c.id }, 'aria-label': c.name,
          onclick: () => s.patch({ frameColor: c.id }) });
        if (c.swatch === 'picker') { b.classList.add('cz-swatch-picker'); b.textContent = '+'; }
        else b.style.background = c.swatch;
        return b;
      }));
    this.refs.swatches = swatches;
    const picker = el('input', { class: 'cz-color', type: 'color', 'aria-label': 'Custom colour',
      oninput: (e) => s.patch({ customColor: e.target.value, frameColor: 'custom' }) });
    this.refs.picker = picker;
    const pickerWrap = el('div', { class: 'cz-picker-wrap', hidden: 'hidden' }, [el('span', { class: 'cz-mini', text: 'Pick colour' }), picker]);
    this.refs.pickerWrap = pickerWrap;

    // Glass
    const glassGrid = el('div', { class: 'cz-materials' },
      GLASS.map((g) => {
        const sw = el('span', { class: 'cz-mat-sw' });
        if (g.kind === 'reflective') sw.style.background = `linear-gradient(135deg, ${g.tint}, #eef2f5 55%, ${g.tint})`;
        else if (g.kind === 'diffuse') { sw.style.background = g.tint; sw.classList.add('is-frost'); }
        else { sw.style.background = g.tint; sw.classList.add('is-glass'); }
        return el('button', { class: 'cz-mat', type: 'button', dataset: { glass: g.id },
          onclick: () => s.patch({ glass: g.id }) }, [sw, el('span', { class: 'cz-mat-name', text: g.name })]);
      }));
    this.refs.glassGrid = glassGrid;

    this.left.append(
      this.section('Product', [cats, styleGrid]),
      this.section('Aluminium colour', [swatches, pickerWrap]),
      this.section('Glass', [glassGrid])
    );
  }

  _pickCategory(cat) {
    // Switch to the first style of the chosen category.
    const first = stylesIn(cat)[0];
    if (first) this.store.patch({ style: first.id });
  }

  _renderStyles(cfg) {
    const cat = (styleDef(cfg.style) || {}).cat || 'window';
    const grid = this.refs.styleGrid; grid.innerHTML = '';
    stylesIn(cat).forEach((st) => {
      grid.appendChild(el('button', {
        class: 'cz-style' + (cfg.style === st.id ? ' is-active' : ''), type: 'button',
        text: st.name, onclick: () => this.store.patch({ style: st.id })
      }));
    });
  }

  _buildRight() {
    const sum = el('dl', { class: 'cz-summary' }); this.refs.summary = sum;
    const actions = el('div', { class: 'cz-actions' }, [
      el('button', { class: 'cz-btn', type: 'button', dataset: { act: 'save' }, text: 'Save' }),
      el('button', { class: 'cz-btn', type: 'button', dataset: { act: 'share' }, text: 'Share link' }),
      el('button', { class: 'cz-btn', type: 'button', dataset: { act: 'export' }, text: 'Export image' })
    ]);
    const f = el('form', { class: 'cz-quote', id: 'czQuote', novalidate: 'novalidate' }, [
      el('div', { class: 'cz-quote-row' }, el('input', { class: 'cz-input', name: 'name', placeholder: 'Your name', required: 'required' })),
      el('div', { class: 'cz-quote-row' }, el('input', { class: 'cz-input', name: 'phone', placeholder: 'Contact number', required: 'required' })),
      el('div', { class: 'cz-quote-row' }, el('textarea', { class: 'cz-input', name: 'message', rows: '3', placeholder: 'Notes (location, quantity…)' })),
      el('button', { class: 'cz-btn cz-btn-solid', type: 'submit', text: 'Request quote via Messenger' }),
      el('p', { class: 'cz-quote-note', text: 'Sends your design to our Messenger. Nothing is stored here.' })
    ]);
    this.refs.quote = f;
    this.right.append(
      el('h3', { class: 'cz-section-title', text: 'Your design' }), sum, actions,
      el('h3', { class: 'cz-section-title', text: 'Request a quote' }), f
    );
  }

  _renderSummary(cfg) {
    const st = styleDef(cfg.style), fc = frameColor(cfg.frameColor), g = glassDef(cfg.glass);
    const cat = byId(CATEGORIES, st ? st.cat : 'window');
    const rows = [
      ['Product', cat ? cat.name : '—'],
      ['Style', st ? st.name : '—'],
      ['Aluminium', fc.name + (fc.custom ? ` (${cfg.customColor})` : '')],
      ['Glass', g ? g.name : '—']
    ];
    this.refs.summary.innerHTML = '';
    rows.forEach(([k, v]) => this.refs.summary.append(el('div', { class: 'cz-sumrow' }, [el('dt', { text: k }), el('dd', { text: v })])));
  }

  renderState(cfg) {
    const cat = (styleDef(cfg.style) || {}).cat || 'window';
    this.refs.cats.querySelectorAll('.cz-tab').forEach((t) => t.classList.toggle('is-active', t.dataset.cat === cat));
    this._renderStyles(cfg);
    this.refs.swatches.querySelectorAll('.cz-swatch').forEach((b) => b.classList.toggle('is-active', b.dataset.color === cfg.frameColor));
    const fc = frameColor(cfg.frameColor);
    this.refs.pickerWrap.hidden = !(fc && fc.custom);
    if (fc && fc.custom) this.refs.picker.value = cfg.customColor;
    this.refs.glassGrid.querySelectorAll('.cz-mat').forEach((b) => b.classList.toggle('is-active', b.dataset.glass === cfg.glass));
    this._renderSummary(cfg);
  }
}

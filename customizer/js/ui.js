/* =============================================================
   Redheart Customizer — UI panels
   -------------------------------------------------------------
   Builds the left configuration panel and the right summary/quote
   panel from the catalogs, binds every control to the store, and
   renders summary + estimate. Toolbar/header buttons are wired in
   main.js. Nothing here is a dead control.
   ============================================================= */
import {
  PRODUCTS, FRAME_COLORS, FINISHES, SURFACE_FAMILIES, GLASS, MIRRORS,
  ACCESSORIES, DIMENSIONS, SIZE_PRESETS, GLASS_THICKNESS, UNITS,
  product, frameColor, finish, glass as glassDef, mirror as mirrorDef, byId
} from './config.js';
import { computeEstimate, money } from './pricing.js';

/* Small DOM helper. */
function el(tag, props = {}, kids = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(n.dataset, v);
    else if (v !== null && v !== undefined) n.setAttribute(k, v);
  }
  (Array.isArray(kids) ? kids : [kids]).forEach((c) => {
    if (c == null) return;
    n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return n;
}

function fmtDim(mmVal, unitId) {
  const u = byId(UNITS, unitId) || UNITS[0];
  return (mmVal * u.factor).toFixed(u.digits) + ' ' + u.name;
}

export class UI {
  constructor(store, left, right) {
    this.store = store;
    this.left = left;
    this.right = right;
    this.refs = {};
    this._buildLeft();
    this._buildRight();
  }

  section(title, bodyNodes) {
    return el('div', { class: 'cz-section' }, [
      el('h3', { class: 'cz-section-title', text: title }),
      el('div', { class: 'cz-section-body' }, bodyNodes)
    ]);
  }

  /* ---------------- LEFT: configuration ---------------- */
  _buildLeft() {
    const s = this.store;

    /* Product type */
    const select = el('select', { class: 'cz-select', 'aria-label': 'Product type',
      onchange: (e) => s.patch({ product: e.target.value }) });
    const groups = {};
    for (const p of PRODUCTS) { (groups[p.group] ||= []).push(p); }
    for (const [grp, items] of Object.entries(groups)) {
      const og = el('optgroup', { label: grp });
      for (const p of items) {
        const soon = p.status !== 'live';
        og.appendChild(el('option', {
          value: p.id, disabled: soon ? 'disabled' : null,
          text: p.name + (soon ? ' — coming soon' : '')
        }));
      }
      select.appendChild(og);
    }
    this.refs.product = select;
    const prodNote = el('p', { class: 'cz-note' });
    this.refs.prodNote = prodNote;

    /* Dimensions */
    const presets = el('div', { class: 'cz-chips' },
      SIZE_PRESETS.map((p) => el('button', {
        class: 'cz-chip', type: 'button', dataset: { preset: p.id },
        text: p.name, onclick: () => s.patch({ width: p.width, height: p.height }, { keepSize: true })
      })));
    this.refs.presets = presets;

    const mkRange = (key, label) => {
      const rule = DIMENSIONS[key];
      const num = el('input', { class: 'cz-num', type: 'number', min: rule.min, max: rule.max, step: rule.step,
        'aria-label': label, oninput: (e) => s.patch({ [key]: e.target.value }) });
      const rng = el('input', { class: 'cz-range', type: 'range', min: rule.min, max: rule.max, step: rule.step,
        'aria-label': label + ' slider', oninput: (e) => s.patch({ [key]: e.target.value }) });
      const err = el('span', { class: 'cz-field-err' });
      this.refs[key] = { num, rng, err };
      return el('div', { class: 'cz-dimrow' }, [
        el('div', { class: 'cz-dimhead' }, [ el('label', { text: label }), num, el('span', { class: 'cz-unit', text: 'mm' }) ]),
        rng, err
      ]);
    };

    const panelSeg = el('div', { class: 'cz-seg', dataset: { seg: 'panels' } });
    this.refs.panels = panelSeg;

    const glassThickSeg = el('div', { class: 'cz-seg', dataset: { seg: 'glassThick' } },
      GLASS_THICKNESS.map((t) => el('button', { class: 'cz-seg-btn', type: 'button', dataset: { val: t },
        text: t + ' mm', onclick: () => s.patch({ glassThick: t }) })));
    this.refs.glassThick = glassThickSeg;

    /* Frame colours */
    const swatches = el('div', { class: 'cz-swatches' },
      FRAME_COLORS.map((c) => {
        const chip = el('button', { class: 'cz-swatch', type: 'button', title: c.name, dataset: { color: c.id },
          'aria-label': c.name, onclick: () => s.patch({ frameColor: c.id }) });
        if (c.swatch === 'picker') { chip.classList.add('cz-swatch-picker'); chip.innerHTML = '<span>+</span>'; }
        else chip.style.background = c.swatch;
        return chip;
      }));
    this.refs.swatches = swatches;
    const picker = el('input', { class: 'cz-color', type: 'color', 'aria-label': 'Custom colour',
      oninput: (e) => s.patch({ customColor: e.target.value, frameColor: 'custom' }) });
    this.refs.picker = picker;
    const pickerWrap = el('div', { class: 'cz-picker-wrap', hidden: 'hidden' }, [
      el('label', { class: 'cz-mini', text: 'Pick a colour' }), picker ]);
    this.refs.pickerWrap = pickerWrap;

    /* Finish */
    const finishSeg = el('div', { class: 'cz-seg' },
      FINISHES.map((f) => el('button', { class: 'cz-seg-btn', type: 'button', dataset: { val: f.id },
        text: f.name, onclick: () => s.patch({ finish: f.id }) })));
    this.refs.finish = finishSeg;

    /* Surface family tabs + material grid */
    const tabs = el('div', { class: 'cz-tabs' },
      SURFACE_FAMILIES.map((fam) => el('button', { class: 'cz-tab', type: 'button', dataset: { fam: fam.id },
        text: fam.name, onclick: () => s.patch({ surfaceFamily: fam.id }) })));
    this.refs.surfaceTabs = tabs;
    const matGrid = el('div', { class: 'cz-materials' });
    this.refs.matGrid = matGrid;

    /* Accessories */
    const acc = el('div', { class: 'cz-checks' },
      ACCESSORIES.map((a) => {
        const cb = el('input', { type: 'checkbox', id: 'acc-' + a.id, dataset: { acc: a.id },
          onchange: (e) => this._toggleAccessory(a.id, e.target.checked) });
        this.refs['acc-' + a.id] = cb;
        return el('label', { class: 'cz-check', for: 'acc-' + a.id }, [ cb, el('span', { text: a.name }) ]);
      }));
    this.refs.acc = acc;

    this.left.append(
      this.section('Product', [select, prodNote]),
      this.section('Dimensions', [
        presets,
        mkRange('width', 'Width'),
        mkRange('height', 'Height'),
        mkRange('frameThick', 'Frame thickness'),
        el('div', { class: 'cz-sub', text: 'Panels' }), panelSeg,
        el('div', { class: 'cz-sub', text: 'Glass thickness' }), glassThickSeg
      ]),
      this.section('Aluminium frame', [ swatches, pickerWrap, el('div', { class: 'cz-sub', text: 'Finish' }), finishSeg ]),
      this.section('Glass & mirror', [ tabs, matGrid ]),
      this.section('Accessories', [ acc ])
    );
  }

  _toggleAccessory(id, on) {
    const cur = new Set(this.store.get().accessories || []);
    if (on) cur.add(id); else cur.delete(id);
    this.store.patch({ accessories: [...cur] });
  }

  _renderMaterials(cfg) {
    const fam = byId(SURFACE_FAMILIES, cfg.surfaceFamily) || SURFACE_FAMILIES[0];
    const grid = this.refs.matGrid;
    grid.innerHTML = '';
    for (const item of fam.items) {
      const selected = (fam.id === 'glass' ? cfg.glass : cfg.mirror) === item.id;
      const sw = el('span', { class: 'cz-mat-sw' });
      if (fam.id === 'glass') {
        const g = item;
        if (g.kind === 'diffuse') { sw.style.background = g.tint; sw.style.opacity = '0.9'; sw.classList.add('is-frost'); }
        else if (g.kind === 'reflective') { sw.style.background = `linear-gradient(135deg, ${g.tint}, #e9eef2 60%, ${g.tint})`; }
        else { sw.style.background = g.tint; sw.classList.add('is-glass'); }
      } else {
        sw.style.background = `linear-gradient(135deg, #ffffff 0%, ${item.tint} 45%, #b9c0c6 100%)`;
        sw.classList.add('is-mirror');
      }
      const card = el('button', {
        class: 'cz-mat' + (selected ? ' is-active' : ''), type: 'button',
        onclick: () => this.store.patch(fam.id === 'glass' ? { glass: item.id } : { mirror: item.id })
      }, [ sw, el('span', { class: 'cz-mat-name', text: item.name }), el('span', { class: 'cz-mat-spec', text: item.spec }) ]);
      grid.appendChild(card);
    }
  }

  _renderPanels(cfg) {
    const p = product(cfg.product) || {};
    const seg = this.refs.panels;
    seg.innerHTML = '';
    const opts = p.panels || [cfg.panels];
    for (const n of opts) {
      seg.appendChild(el('button', {
        class: 'cz-seg-btn' + (cfg.panels === n ? ' is-active' : ''), type: 'button',
        text: n + '-panel', onclick: () => this.store.patch({ panels: n })
      }));
    }
  }

  /* ---------------- RIGHT: summary / quote ---------------- */
  _buildRight() {
    const sum = el('dl', { class: 'cz-summary' });
    this.refs.summary = sum;

    const priceBox = el('div', { class: 'cz-price' });
    this.refs.price = priceBox;

    const actions = el('div', { class: 'cz-actions' }, [
      el('button', { class: 'cz-btn', type: 'button', dataset: { act: 'save' }, text: 'Save' }),
      el('button', { class: 'cz-btn', type: 'button', dataset: { act: 'share' }, text: 'Share link' }),
      el('button', { class: 'cz-btn', type: 'button', dataset: { act: 'export' }, text: 'Export image' }),
      el('button', { class: 'cz-btn', type: 'button', dataset: { act: 'spec' }, text: 'Spec sheet' }),
      el('button', { class: 'cz-btn', type: 'button', dataset: { act: 'setcompare' }, text: 'Set A/B' }),
      el('button', { class: 'cz-btn', type: 'button', dataset: { act: 'compare' }, text: 'Compare' })
    ]);
    this.refs.actions = actions;

    /* Quote form */
    const f = el('form', { class: 'cz-quote', id: 'czQuote', novalidate: 'novalidate' }, [
      el('div', { class: 'cz-quote-row' }, [
        el('input', { class: 'cz-input', name: 'name', placeholder: 'Your name', 'aria-label': 'Your name', required: 'required' })
      ]),
      el('div', { class: 'cz-quote-row' }, [
        el('input', { class: 'cz-input', name: 'phone', placeholder: 'Contact number', 'aria-label': 'Contact number', required: 'required' })
      ]),
      el('div', { class: 'cz-quote-row' }, [
        el('textarea', { class: 'cz-input', name: 'message', rows: '3', placeholder: 'Notes for us (location, target date…)', 'aria-label': 'Notes' })
      ]),
      el('button', { class: 'cz-btn cz-btn-solid', type: 'submit', text: 'Request quotation via Messenger' }),
      el('p', { class: 'cz-quote-note', text: 'Sends your configuration to our Messenger. Nothing is stored here.' })
    ]);
    this.refs.quote = f;

    this.right.append(
      el('h3', { class: 'cz-section-title', text: 'Your configuration' }), sum,
      priceBox, actions,
      el('h3', { class: 'cz-section-title', text: 'Request a quotation' }), f
    );
  }

  _renderSummary(cfg) {
    const p = product(cfg.product);
    const fc = frameColor(cfg.frameColor);
    const fin = finish(fc.forceFinish || cfg.finish);
    const isMirror = cfg.surfaceFamily === 'mirror';
    const surf = isMirror ? mirrorDef(cfg.mirror) : glassDef(cfg.glass);
    const accNames = (cfg.accessories || []).map((id) => (byId(ACCESSORIES, id) || {}).name).filter(Boolean);

    const rows = [
      ['Product', p ? p.name : cfg.product],
      ['Dimensions', `${fmtDim(cfg.width, cfg.units)} × ${fmtDim(cfg.height, cfg.units)}`],
      ['Panels', String(cfg.panels)],
      ['Opening', p && p.fixed ? 'Fixed' : (p && p.door ? 'Sliding door' : 'Sliding')],
      ['Frame colour', fc.name + (fc.custom ? ` (${cfg.customColor})` : '')],
      ['Finish', fin ? fin.name : '—'],
      [isMirror ? 'Mirror' : 'Glass', surf ? surf.name : '—'],
      ['Specification', surf ? surf.spec : '—'],
      ['Glass thickness', cfg.glassThick + ' mm'],
      ['Accessories', accNames.length ? accNames.join(', ') : 'None']
    ];
    this.refs.summary.innerHTML = '';
    for (const [k, v] of rows) {
      this.refs.summary.append(el('div', { class: 'cz-sumrow' }, [
        el('dt', { text: k }), el('dd', { text: v }) ]));
    }
  }

  _renderPrice(cfg) {
    const est = computeEstimate(cfg);
    const box = this.refs.price;
    box.innerHTML = '';
    if (!est) return;
    box.append(
      el('div', { class: 'cz-price-head' }, [
        el('span', { class: 'cz-price-label', text: 'Estimated price' }),
        el('span', { class: 'cz-price-total', text: money(est.total, cfg) })
      ]),
      el('details', { class: 'cz-price-break' }, [
        el('summary', { text: 'Breakdown' }),
        el('ul', {}, est.lines.map((l) => el('li', {}, [
          el('span', { text: l.name }), el('span', { text: money(l.price, cfg) }) ])))
      ]),
      el('p', { class: 'cz-price-disc', text: est.disclaimer })
    );
  }

  /* ---------------- Full render ---------------- */
  renderState(cfg) {
    const p = product(cfg.product) || {};
    this.refs.product.value = cfg.product;
    this.refs.prodNote.textContent = p.notes || '';

    // dimensions
    for (const key of ['width', 'height', 'frameThick']) {
      const r = this.refs[key];
      if (document.activeElement !== r.num) r.num.value = cfg[key];
      r.rng.value = cfg[key];
    }
    // presets active
    this.refs.presets.querySelectorAll('.cz-chip').forEach((c) => {
      const pr = byId(SIZE_PRESETS, c.dataset.preset);
      c.classList.toggle('is-active', pr && pr.width === cfg.width && pr.height === cfg.height);
    });
    this._renderPanels(cfg);
    this.refs.glassThick.querySelectorAll('.cz-seg-btn').forEach((b) =>
      b.classList.toggle('is-active', Number(b.dataset.val) === cfg.glassThick));

    // frame
    this.refs.swatches.querySelectorAll('.cz-swatch').forEach((c) =>
      c.classList.toggle('is-active', c.dataset.color === cfg.frameColor));
    const fc = frameColor(cfg.frameColor);
    this.refs.pickerWrap.hidden = !(fc && fc.custom);
    if (fc && fc.custom) this.refs.picker.value = cfg.customColor;
    // finish (respect forced finish)
    const effFinish = (fc && fc.forceFinish) || cfg.finish;
    this.refs.finish.querySelectorAll('.cz-seg-btn').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.val === effFinish);
      b.disabled = !!(fc && fc.forceFinish);
    });

    // surface
    this.refs.surfaceTabs.querySelectorAll('.cz-tab').forEach((t) =>
      t.classList.toggle('is-active', t.dataset.fam === cfg.surfaceFamily));
    this._renderMaterials(cfg);

    // accessories
    for (const a of ACCESSORIES) {
      const cb = this.refs['acc-' + a.id];
      if (cb) cb.checked = (cfg.accessories || []).includes(a.id);
    }

    this._renderSummary(cfg);
    this._renderPrice(cfg);
  }

  /* Validation display. */
  showValidation(issues) {
    for (const key of ['width', 'height', 'frameThick', 'glassThick']) {
      const r = this.refs[key];
      if (r && r.err) { r.err.textContent = ''; r.num && r.num.classList.remove('is-err'); }
    }
    for (const iss of issues) {
      const r = this.refs[iss.key];
      if (r && r.err) { r.err.textContent = iss.msg; r.num && r.num.classList.add('is-err'); }
    }
  }
}

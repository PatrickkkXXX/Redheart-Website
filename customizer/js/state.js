/* =============================================================
   Redheart Customizer — configuration state
   -------------------------------------------------------------
   A tiny observable store. The config object is the single source
   of truth for the UI, the 3D model, saved designs and the quote.
   Supports: subscribe, patch (preserving other valid selections),
   validation, URL (?c=) encoding and localStorage save/restore.
   ============================================================= */
import { DEFAULT_CONFIG, DIMENSIONS, PRODUCTS, PRODUCT_DEFAULT_SIZE, product, byId } from './config.js';

const STORAGE_KEY = 'redheart.customizer.v1';

function clampDim(key, value) {
  const rule = DIMENSIONS[key];
  if (!rule) return value;
  let v = Number(value);
  if (Number.isNaN(v)) return rule.default;
  v = Math.min(rule.max, Math.max(rule.min, v));
  return v;
}

export class ConfigStore {
  constructor(initial) {
    this.state = Object.assign({}, DEFAULT_CONFIG, initial || {});
    this.listeners = new Set();
    this.lastChanged = null;
  }

  get() { return this.state; }

  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }

  emit(changedKeys) {
    this.lastChanged = changedKeys;
    this.listeners.forEach((fn) => fn(this.state, changedKeys));
  }

  /* Patch one or more keys. Every unrelated selection is preserved. */
  patch(partial, meta = {}) {
    const changed = [];
    const next = Object.assign({}, this.state);

    for (const [k, v] of Object.entries(partial)) {
      let value = v;
      if (['width', 'height', 'depth', 'frameThick', 'glassThick'].includes(k)) {
        value = clampDim(k, v);
      }
      if (next[k] !== value) { next[k] = value; changed.push(k); }
    }

    // When the product changes, keep valid selections but fix panel count
    // and apply any product-specific default size.
    if (changed.includes('product')) {
      const p = product(next.product);
      if (p && p.panels && !p.panels.includes(next.panels)) {
        next.panels = p.defaultPanels || p.panels[0];
        changed.push('panels');
      }
      const size = PRODUCT_DEFAULT_SIZE[next.product];
      if (size && !meta.keepSize) {
        if (next.width !== size.width) { next.width = clampDim('width', size.width); changed.push('width'); }
        if (next.height !== size.height) { next.height = clampDim('height', size.height); changed.push('height'); }
      }
    }

    this.state = next;
    if (changed.length) this.emit(changed);
    return changed;
  }

  reset() {
    this.state = Object.assign({}, DEFAULT_CONFIG);
    this.emit(Object.keys(this.state));
  }

  /* ---------- Validation ---------- */
  validate(cfg = this.state) {
    const issues = [];
    for (const key of ['width', 'height', 'frameThick', 'glassThick']) {
      const rule = DIMENSIONS[key];
      const v = Number(cfg[key]);
      if (Number.isNaN(v)) issues.push({ key, msg: `${key} must be a number` });
      else if (v < rule.min) issues.push({ key, msg: `Minimum ${rule.min} mm` });
      else if (v > rule.max) issues.push({ key, msg: `Maximum ${rule.max} mm` });
    }
    // Frame must not eat the whole opening.
    if (cfg.width <= cfg.frameThick * 2 + 50) issues.push({ key: 'width', msg: 'Too narrow for this frame' });
    if (cfg.height <= cfg.frameThick * 2 + 50) issues.push({ key: 'height', msg: 'Too short for this frame' });
    return issues;
  }

  /* ---------- Serialisation ---------- */
  serialize(cfg = this.state) { return JSON.stringify(cfg); }

  toURL(cfg = this.state) {
    try {
      const json = JSON.stringify(cfg);
      const b64 = btoa(unescape(encodeURIComponent(json)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const url = new URL(window.location.href);
      url.searchParams.set('c', b64);
      return url.toString();
    } catch (e) { return window.location.href; }
  }

  static fromURL() {
    try {
      const b64 = new URL(window.location.href).searchParams.get('c');
      if (!b64) return null;
      const json = decodeURIComponent(escape(atob(b64.replace(/-/g, '+').replace(/_/g, '/'))));
      return ConfigStore.sanitize(JSON.parse(json));
    } catch (e) { return null; }
  }

  save() {
    try { localStorage.setItem(STORAGE_KEY, this.serialize()); return true; }
    catch (e) { return false; }
  }

  static load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? ConfigStore.sanitize(JSON.parse(raw)) : null;
    } catch (e) { return null; }
  }

  /* Keep only known keys / valid ids so a tampered URL can't break the app. */
  static sanitize(obj) {
    if (!obj || typeof obj !== 'object') return null;
    const clean = {};
    for (const key of Object.keys(DEFAULT_CONFIG)) {
      if (key in obj) clean[key] = obj[key];
    }
    if (!byId(PRODUCTS, clean.product)) clean.product = DEFAULT_CONFIG.product;
    if (!Array.isArray(clean.accessories)) clean.accessories = DEFAULT_CONFIG.accessories.slice();
    for (const key of ['width', 'height', 'depth', 'frameThick', 'glassThick', 'panels']) {
      if (key in clean) clean[key] = Number(clean[key]) || DEFAULT_CONFIG[key];
    }
    return clean;
  }
}

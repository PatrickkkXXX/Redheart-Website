/* =============================================================
   Redheart Customizer — configuration state (simplified)
   -------------------------------------------------------------
   Single source of truth: style, frameColor, glass, background.
   Observable, with URL (?c=) + localStorage save/restore.
   ============================================================= */
import { DEFAULT_CONFIG, STYLES, FRAME_COLORS, GLASS, byId } from './config.js';

const STORAGE_KEY = 'redheart.customizer.v2';

export class ConfigStore {
  constructor(initial) {
    this.state = Object.assign({}, DEFAULT_CONFIG, initial || {});
    this.listeners = new Set();
  }
  get() { return this.state; }
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(changed) { this.listeners.forEach((fn) => fn(this.state, changed)); }

  patch(partial) {
    const changed = [];
    const next = Object.assign({}, this.state);
    for (const [k, v] of Object.entries(partial)) {
      if (next[k] !== v) { next[k] = v; changed.push(k); }
    }
    this.state = next;
    if (changed.length) this.emit(changed);
    return changed;
  }
  reset() { this.state = Object.assign({}, DEFAULT_CONFIG); this.emit(Object.keys(this.state)); }

  serialize(cfg = this.state) { return JSON.stringify(cfg); }

  toURL(cfg = this.state) {
    try {
      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(cfg))))
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
  save() { try { localStorage.setItem(STORAGE_KEY, this.serialize()); return true; } catch (e) { return false; } }
  static load() {
    try { const r = localStorage.getItem(STORAGE_KEY); return r ? ConfigStore.sanitize(JSON.parse(r)) : null; }
    catch (e) { return null; }
  }
  static sanitize(obj) {
    if (!obj || typeof obj !== 'object') return null;
    const clean = {};
    for (const k of Object.keys(DEFAULT_CONFIG)) if (k in obj) clean[k] = obj[k];
    if (!byId(STYLES, clean.style)) clean.style = DEFAULT_CONFIG.style;
    if (!byId(FRAME_COLORS, clean.frameColor)) clean.frameColor = DEFAULT_CONFIG.frameColor;
    if (!byId(GLASS, clean.glass)) clean.glass = DEFAULT_CONFIG.glass;
    return clean;
  }
}

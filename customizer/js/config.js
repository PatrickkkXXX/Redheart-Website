/* =============================================================
   Redheart Customizer — simplified catalog (Coohom-style)
   -------------------------------------------------------------
   Only three things the customer changes:
     1. Product  (window / door / cabinet)  → with style & panel variants
     2. Aluminium colour
     3. Glass type
   No measurements, units, pricing or finishes — kept intentionally
   simple. Dimensions are fixed, sensible proportions per style.
   ============================================================= */

/* Top-level product categories (the main toggle). */
export const CATEGORIES = [
  { id: 'window',  name: 'Window' },
  { id: 'door',    name: 'Door' },
  { id: 'cabinet', name: 'Cabinet' }
];

/* Styles within each category. `opening` drives how sashes/doors sit:
   sliding · casement · awning · butterfly · french · swing · hinged · fixed.
   `panels` is the number of panes/doors. No user dimensions. */
export const STYLES = [
  // Windows
  { id: 'win-2',        cat: 'window',  name: '2-panel sliding',  builder: 'window', opening: 'sliding',  panels: 2 },
  { id: 'win-3',        cat: 'window',  name: '3-panel sliding',  builder: 'window', opening: 'sliding',  panels: 3 },
  { id: 'win-4',        cat: 'window',  name: '4-panel sliding',  builder: 'window', opening: 'sliding',  panels: 4 },
  { id: 'win-6',        cat: 'window',  name: '6-panel sliding',  builder: 'window', opening: 'sliding',  panels: 6 },
  { id: 'win-casement', cat: 'window',  name: 'Casement',         builder: 'window', opening: 'casement', panels: 2 },
  { id: 'win-awning',   cat: 'window',  name: 'Awning',           builder: 'window', opening: 'awning',   panels: 1 },
  { id: 'win-butterfly',cat: 'window',  name: 'Butterfly',        builder: 'window', opening: 'butterfly',panels: 2 },
  { id: 'win-fixed',    cat: 'window',  name: 'Fixed picture',    builder: 'window', opening: 'fixed',    panels: 1 },

  // Doors
  { id: 'door-2',       cat: 'door',    name: '2-panel sliding',  builder: 'door',   opening: 'sliding',  panels: 2 },
  { id: 'door-3',       cat: 'door',    name: '3-panel sliding',  builder: 'door',   opening: 'sliding',  panels: 3 },
  { id: 'door-french',  cat: 'door',    name: 'French (double)',  builder: 'door',   opening: 'french',   panels: 2 },
  { id: 'door-swing',   cat: 'door',    name: 'Single swing',     builder: 'door',   opening: 'swing',    panels: 1 },

  // Cabinets
  { id: 'cab-2',        cat: 'cabinet', name: '2-door display',   builder: 'cabinet', opening: 'hinged',  panels: 2 },
  { id: 'cab-4',        cat: 'cabinet', name: '4-door display',   builder: 'cabinet', opening: 'hinged',  panels: 4, stacked: true },
  { id: 'cab-slide',    cat: 'cabinet', name: 'Sliding-door',     builder: 'cabinet', opening: 'sliding', panels: 2 },
  { id: 'cab-tall',     cat: 'cabinet', name: 'Tall display',     builder: 'cabinet', opening: 'hinged',  panels: 2, tall: true }
];

/* ---------- Aluminium frame colours ----------
   Finish is baked in per colour (no separate finish control).
   finish ∈ matte | glossy | brushed | metallic ; wood uses a texture. */
export const FRAME_COLORS = [
  { id: 'matte-black',  name: 'Matte black',       color: '#1a1b1d', swatch: '#232428', finish: 'matte' },
  { id: 'glossy-black', name: 'Glossy black',      color: '#0e0f11', swatch: '#111214', finish: 'glossy' },
  { id: 'white',        name: 'White',             color: '#eceef0', swatch: '#eceef0', finish: 'matte' },
  { id: 'silver',       name: 'Silver',            color: '#c7ccd2', swatch: '#c7ccd2', finish: 'metallic' },
  { id: 'natural',      name: 'Natural aluminium', color: '#b8bcc2', swatch: '#b8bcc2', finish: 'brushed' },
  { id: 'champagne',    name: 'Champagne',         color: '#d8c7a4', swatch: '#d8c7a4', finish: 'metallic' },
  { id: 'bronze',       name: 'Bronze',            color: '#8c6a43', swatch: '#8c6a43', finish: 'metallic' },
  { id: 'dark-bronze',  name: 'Dark bronze',       color: '#43342576', swatch: '#4a3a2a', finish: 'metallic', colorHex: '#433425' },
  { id: 'gold',         name: 'Gold',              color: '#c9a44c', swatch: '#c9a44c', finish: 'metallic' },
  { id: 'wood-grain',   name: 'Wood-grain',        color: '#7a4e28', swatch: '#7a4e28', finish: 'matte', wood: true },
  { id: 'custom',       name: 'Custom colour',     color: '#a51226', swatch: 'picker',  finish: 'glossy', custom: true }
];

/* ---------- Glass ----------
   Visually distinct options only. kind: transparent | diffuse | reflective. */
export const GLASS = [
  { id: 'clear',       name: 'Clear',          kind: 'transparent', tint: '#ffffff', roughness: 0.02, opacityFallback: 0.14 },
  { id: 'tint-lgray',  name: 'Light grey',     kind: 'transparent', tint: '#c3c6c9', roughness: 0.03, opacityFallback: 0.32 },
  { id: 'tint-dgray',  name: 'Dark grey',      kind: 'transparent', tint: '#6d7175', roughness: 0.03, opacityFallback: 0.5 },
  { id: 'tint-bronze', name: 'Bronze',         kind: 'transparent', tint: '#9c7b4e', roughness: 0.03, opacityFallback: 0.42 },
  { id: 'tint-blue',   name: 'Blue',           kind: 'transparent', tint: '#8fb4c9', roughness: 0.03, opacityFallback: 0.36 },
  { id: 'tint-green',  name: 'Green',          kind: 'transparent', tint: '#9ec3a7', roughness: 0.03, opacityFallback: 0.36 },
  { id: 'frosted',     name: 'Frosted',        kind: 'diffuse',     tint: '#eef1f3', roughness: 0.9,  opacityFallback: 0.82 },
  { id: 'reflective',  name: 'Reflective',     kind: 'reflective',  tint: '#8aa0ad', roughness: 0.05, opacityFallback: 0.55 }
];

export const BACKGROUNDS = [
  { id: 'studio', name: 'Studio' },
  { id: 'light',  name: 'Light' },
  { id: 'dark',   name: 'Dark' }
];

export const DEFAULT_CONFIG = {
  style: 'win-2',
  frameColor: 'matte-black',
  customColor: '#a51226',
  glass: 'clear',
  background: 'studio',
  quality: 'high',
  autoRotate: true
};

/* Lookups. */
export const byId = (list, id) => list.find((x) => x.id === id);
export const style = (id) => byId(STYLES, id);
export const frameColor = (id) => byId(FRAME_COLORS, id);
export const glass = (id) => byId(GLASS, id);
export const stylesIn = (cat) => STYLES.filter((s) => s.cat === cat);

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
/* Aluminium colours commonly used in the Philippines (powder-coat / anodised). */
export const FRAME_COLORS = [
  { id: 'white',       name: 'White',          color: '#eceef0', swatch: '#eceef0', finish: 'matte' },
  { id: 'black',       name: 'Black',          color: '#1a1b1d', swatch: '#232428', finish: 'matte' },
  { id: 'brown',       name: 'Brown (coffee)', color: '#5a4433', swatch: '#5a4433', finish: 'matte' },
  { id: 'bronze',      name: 'Bronze',         color: '#8c6a43', swatch: '#8c6a43', finish: 'metallic' },
  { id: 'dark-bronze', name: 'Dark bronze',    color: '#433425', swatch: '#433425', finish: 'metallic' },
  { id: 'grey',        name: 'Grey',           color: '#6e7276', swatch: '#6e7276', finish: 'matte' },
  { id: 'natural',     name: 'Natural (mill)', color: '#b8bcc2', swatch: '#b8bcc2', finish: 'brushed' },
  { id: 'wood',        name: 'Wood-grain',     color: '#7a4e28', swatch: '#7a4e28', finish: 'matte', wood: true }
];

/* ---------- Glass ----------
   Types commonly used in PH windows, doors and cabinets.
   kind: transparent | diffuse | reflective. */
export const GLASS = [
  { id: 'clear',      name: 'Clear',           kind: 'transparent', tint: '#eaf1f5', opacityFallback: 0.14 },
  { id: 'bronze',     name: 'Bronze tint',     kind: 'transparent', tint: '#9c7b4e', opacityFallback: 0.42 },
  { id: 'grey',       name: 'Grey tint',       kind: 'transparent', tint: '#6d7175', opacityFallback: 0.5 },
  { id: 'blue',       name: 'Blue tint',       kind: 'transparent', tint: '#8fb4c9', opacityFallback: 0.36 },
  { id: 'green',      name: 'Green tint',      kind: 'transparent', tint: '#9ec3a7', opacityFallback: 0.36 },
  { id: 'refl-blue',  name: 'Reflective blue', kind: 'reflective',  tint: '#6f9cc4' },
  { id: 'refl-green', name: 'Reflective green',kind: 'reflective',  tint: '#79b495' },
  { id: 'refl-grey',  name: 'Reflective grey', kind: 'reflective',  tint: '#9aa6ad' },
  { id: 'frosted',    name: 'Frosted',         kind: 'diffuse',     tint: '#eef1f3', opacityFallback: 0.82 }
];

export const BACKGROUNDS = [
  { id: 'studio', name: 'Studio' },
  { id: 'light',  name: 'Light' },
  { id: 'dark',   name: 'Dark' }
];

export const DEFAULT_CONFIG = {
  style: 'win-2',
  frameColor: 'black',
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

/* =============================================================
   Redheart Customizer — catalogs, dimension rules & pricing
   -------------------------------------------------------------
   This file is the data layer. Everything the customer can pick
   lives here, so new colours, glass types or pricing rules can be
   added without touching the 3D or UI code.
   All measurements are stored internally in MILLIMETRES.
   ============================================================= */

/* ---------- Product types ----------
   `builder` maps to a geometry builder in geometry/index.js.
   `status: 'live'` controls are fully functional; anything else is
   shown as a clearly-labelled "coming soon" option (no dead controls). */
export const PRODUCTS = [
  { id: 'sliding-window', name: 'Sliding window', group: 'Windows', builder: 'sliding', status: 'live',
    panels: [2, 3, 4], defaultPanels: 2, hasDepth: false,
    opening: 'sliding',
    notes: 'Panels slide horizontally on tracks.' },
  { id: 'fixed-window', name: 'Fixed window', group: 'Windows', builder: 'sliding', status: 'live',
    panels: [1, 2, 3], defaultPanels: 1, hasDepth: false,
    opening: 'fixed', fixed: true,
    notes: 'Non-opening picture window.' },
  { id: 'sliding-door', name: 'Sliding glass door', group: 'Windows', builder: 'sliding', status: 'live',
    panels: [2, 3, 4], defaultPanels: 2, hasDepth: false,
    opening: 'sliding', door: true,
    notes: 'Full-height sliding door assembly.' },

  // Registered for the roadmap — shown disabled with a "coming soon" tag.
  { id: 'awning-window', name: 'Awning window', group: 'Windows', builder: 'sliding', status: 'soon' },
  { id: 'casement-window', name: 'Casement window', group: 'Windows', builder: 'sliding', status: 'soon' },
  { id: 'glass-cabinet', name: 'Aluminium glass cabinet', group: 'Cabinets', builder: 'cabinet', status: 'soon' },
  { id: 'kitchen-cabinet', name: 'Kitchen cabinet', group: 'Cabinets', builder: 'cabinet', status: 'soon' },
  { id: 'display-cabinet', name: 'Display cabinet', group: 'Cabinets', builder: 'cabinet', status: 'soon' },
  { id: 'mirror-cabinet', name: 'Mirror cabinet', group: 'Cabinets', builder: 'cabinet', status: 'soon' }
];

/* ---------- Aluminium frame colours ----------
   `color` is the base albedo. Finish is chosen separately (see FINISHES)
   and modulates metalness/roughness/clearcoat. `swatch` is for the UI chip. */
export const FRAME_COLORS = [
  { id: 'matte-black',   name: 'Matte black',      color: '#1a1b1d', swatch: '#232428', metallic: false },
  { id: 'glossy-black',  name: 'Glossy black',     color: '#111214', swatch: '#111214', metallic: false, forceFinish: 'glossy' },
  { id: 'white',         name: 'White',            color: '#eef0f1', swatch: '#eef0f1', metallic: false },
  { id: 'silver',        name: 'Silver',           color: '#c7ccd2', swatch: '#c7ccd2', metallic: true },
  { id: 'natural',       name: 'Natural aluminium', color: '#b8bcc2', swatch: '#b8bcc2', metallic: true },
  { id: 'champagne',     name: 'Champagne',        color: '#d8c7a4', swatch: '#d8c7a4', metallic: true },
  { id: 'bronze',        name: 'Bronze',           color: '#8c6a43', swatch: '#8c6a43', metallic: true },
  { id: 'dark-bronze',   name: 'Dark bronze',      color: '#4a3a2a', swatch: '#4a3a2a', metallic: true },
  { id: 'gold',          name: 'Gold',             color: '#c9a44c', swatch: '#c9a44c', metallic: true, forceFinish: 'metallic' },
  { id: 'wood-grain',    name: 'Wood-grain',       color: '#7a4e28', swatch: '#7a4e28', metallic: false, wood: true },
  { id: 'custom',        name: 'Custom colour',    color: '#a51226', swatch: 'picker', metallic: false, custom: true }
];

/* ---------- Frame finishes ---------- */
export const FINISHES = [
  { id: 'matte',    name: 'Matte',         roughness: 0.62, metalness: 0.15, clearcoat: 0.0 },
  { id: 'glossy',   name: 'Glossy',        roughness: 0.12, metalness: 0.25, clearcoat: 1.0 },
  { id: 'brushed',  name: 'Brushed metal', roughness: 0.42, metalness: 0.95, clearcoat: 0.1, anisotropy: true },
  { id: 'metallic', name: 'Metallic',      roughness: 0.22, metalness: 1.0,  clearcoat: 0.4 }
];

/* ---------- Glass ----------
   kind: 'transparent' uses physical transmission; 'diffuse' is frosted/satin;
   'reflective' leans on the environment map. `tint` colours the glass,
   `roughness` controls frost, `opacityFallback` is used on the low-quality path.
   `spec` is shown in the summary so visually-similar glasses stay distinct. */
export const GLASS = [
  { id: 'clear',       name: 'Clear glass',        kind: 'transparent', tint: '#ffffff', roughness: 0.02, opacityFallback: 0.14, spec: '5 mm float glass' },
  { id: 'tint-lgray',  name: 'Light grey tint',    kind: 'transparent', tint: '#c3c6c9', roughness: 0.03, opacityFallback: 0.30, spec: 'Light grey tinted' },
  { id: 'tint-dgray',  name: 'Dark grey tint',     kind: 'transparent', tint: '#6d7175', roughness: 0.03, opacityFallback: 0.46, spec: 'Dark grey tinted' },
  { id: 'tint-bronze', name: 'Bronze tint',        kind: 'transparent', tint: '#9c7b4e', roughness: 0.03, opacityFallback: 0.40, spec: 'Bronze tinted' },
  { id: 'tint-blue',   name: 'Blue tint',          kind: 'transparent', tint: '#8fb4c9', roughness: 0.03, opacityFallback: 0.34, spec: 'Blue tinted' },
  { id: 'tint-green',  name: 'Green tint',         kind: 'transparent', tint: '#9ec3a7', roughness: 0.03, opacityFallback: 0.34, spec: 'Green tinted' },
  { id: 'frosted',     name: 'Frosted glass',      kind: 'diffuse',     tint: '#eef1f3', roughness: 0.92, opacityFallback: 0.82, spec: 'Acid-etched, obscured' },
  { id: 'satin',       name: 'Satin glass',        kind: 'diffuse',     tint: '#e7ecef', roughness: 0.70, opacityFallback: 0.70, spec: 'Satin / translucent' },
  { id: 'reflective',  name: 'Reflective glass',   kind: 'reflective',  tint: '#8aa0ad', roughness: 0.05, opacityFallback: 0.55, spec: 'Solar-reflective coat' },
  { id: 'tempered',    name: 'Tempered glass',     kind: 'transparent', tint: '#ffffff', roughness: 0.02, opacityFallback: 0.15, spec: 'Toughened, safety-rated' },
  { id: 'laminated',   name: 'Laminated glass',    kind: 'transparent', tint: '#f3f6f8', roughness: 0.03, opacityFallback: 0.18, spec: 'PVB interlayer, security' },
  { id: 'textured',    name: 'Textured / patterned', kind: 'diffuse',   tint: '#e9eef0', roughness: 0.80, opacityFallback: 0.72, spec: 'Patterned / obscured', textured: true }
];

/* ---------- Mirror ----------
   Rendered with a real-time planar reflection (Reflector) tinted per option. */
export const MIRRORS = [
  { id: 'mirror-silver',    name: 'Silver mirror',    tint: '#f4f6f7', reflectivity: 1.0,  spec: 'Standard silver mirror' },
  { id: 'mirror-bronze',    name: 'Bronze mirror',    tint: '#caa981', reflectivity: 0.92, spec: 'Bronze-toned mirror' },
  { id: 'mirror-gray',      name: 'Grey mirror',      tint: '#aeb3b7', reflectivity: 0.90, spec: 'Grey smoked mirror' },
  { id: 'mirror-antique',   name: 'Antique mirror',   tint: '#b9a98a', reflectivity: 0.70, spec: 'Antiqued / distressed', rough: 0.25 },
  { id: 'mirror-tinted',    name: 'Tinted mirror',    tint: '#9fb1bd', reflectivity: 0.85, spec: 'Colour-tinted mirror' },
  { id: 'mirror-decorative', name: 'Decorative mirror', tint: '#d4c2cf', reflectivity: 0.80, spec: 'Decorative patterned' }
];

/* Surface families offered in the material panel. */
export const SURFACE_FAMILIES = [
  { id: 'glass',  name: 'Glass',  items: GLASS },
  { id: 'mirror', name: 'Mirror', items: MIRRORS }
];

/* ---------- Glass thickness options (mm) ---------- */
export const GLASS_THICKNESS = [5, 6, 8, 10, 12];

/* ---------- Accessories ---------- */
export const ACCESSORIES = [
  { id: 'handles',   name: 'Lever handles',     price: 450,  default: true },
  { id: 'lock',      name: 'Multi-point lock',  price: 1200, default: false },
  { id: 'flyscreen', name: 'Insect screen',     price: 900,  default: false },
  { id: 'lowe',      name: 'Low-E coating',     price: 1500, default: false }
];

/* ---------- Dimension rules (mm) ---------- */
export const DIMENSIONS = {
  width:        { min: 400,  max: 4000, step: 10, default: 1500 },
  height:       { min: 400,  max: 2800, step: 10, default: 1200 },
  depth:        { min: 150,  max: 700,  step: 10, default: 350 },   // cabinets only
  frameThick:   { min: 30,   max: 90,   step: 5,  default: 50 },
  glassThick:   { min: 5,    max: 12,   step: 1,  default: 6 }
};

/* Taller defaults for door-type products. */
export const PRODUCT_DEFAULT_SIZE = {
  'sliding-door': { width: 1800, height: 2100 }
};

export const SIZE_PRESETS = [
  { id: 'small',  name: 'Small',  width: 900,  height: 900 },
  { id: 'medium', name: 'Medium', width: 1500, height: 1200 },
  { id: 'large',  name: 'Large',  width: 2400, height: 1500 },
  { id: 'door',   name: 'Door',   width: 1800, height: 2100 }
];

export const UNITS = [
  { id: 'mm', name: 'mm', factor: 1,       digits: 0 },
  { id: 'cm', name: 'cm', factor: 0.1,     digits: 1 },
  { id: 'in', name: 'in', factor: 0.03937, digits: 1 }
];

/* ---------- Pricing rules ----------
   ESTIMATE ONLY. These are placeholder figures in PHP so the summary is
   functional; replace with the business's real numbers. The estimate is
   always labelled as such in the UI and never presented as a final quote.
   Formula: area(m²) × base[product] × frameFactor × glassFactor
            + thickness surcharge + accessories. */
export const PRICING = {
  enabled: true,
  currency: '₱',
  locale: 'en-PH',
  disclaimer: 'Indicative estimate only — not a final quotation. Replace the figures in js/config.js (PRICING) with your own rates.',
  basePerSqm: {
    'sliding-window': 4200, 'fixed-window': 3200, 'sliding-door': 4800,
    'awning-window': 4600, 'casement-window': 4600,
    'glass-cabinet': 5200, 'kitchen-cabinet': 6000, 'display-cabinet': 5200, 'mirror-cabinet': 5600
  },
  frameFactor: {
    'matte-black': 1.0, 'glossy-black': 1.08, 'white': 1.0, 'silver': 1.0,
    'natural': 1.0, 'champagne': 1.12, 'bronze': 1.12, 'dark-bronze': 1.14,
    'gold': 1.25, 'wood-grain': 1.18, 'custom': 1.15
  },
  glassFactor: {
    'clear': 1.0, 'tint-lgray': 1.08, 'tint-dgray': 1.08, 'tint-bronze': 1.1,
    'tint-blue': 1.1, 'tint-green': 1.1, 'frosted': 1.12, 'satin': 1.12,
    'reflective': 1.25, 'tempered': 1.3, 'laminated': 1.4, 'textured': 1.15,
    // mirrors
    'mirror-silver': 1.2, 'mirror-bronze': 1.3, 'mirror-gray': 1.28,
    'mirror-antique': 1.45, 'mirror-tinted': 1.32, 'mirror-decorative': 1.5
  },
  thicknessSurchargePerMm: 60,   // × area × (thickness − 5)
  panelSurcharge: 350            // × (panels − 1) × area
};

/* ---------- Default configuration (single source of truth seed) ---------- */
export const DEFAULT_CONFIG = {
  product: 'sliding-window',
  width: 1500,
  height: 1200,
  depth: 350,
  frameThick: 50,
  glassThick: 6,
  panels: 2,
  frameColor: 'matte-black',
  customColor: '#a51226',
  finish: 'matte',
  surfaceFamily: 'glass',
  glass: 'clear',
  mirror: 'mirror-silver',
  accessories: ['handles'],
  units: 'mm',
  background: 'studio',
  quality: 'high'
};

/* Lookup helpers. */
export const byId = (list, id) => list.find((x) => x.id === id);
export const product = (id) => byId(PRODUCTS, id);
export const frameColor = (id) => byId(FRAME_COLORS, id);
export const finish = (id) => byId(FINISHES, id);
export const glass = (id) => byId(GLASS, id);
export const mirror = (id) => byId(MIRRORS, id);

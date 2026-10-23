/* =============================================================
   Redheart Customizer — estimate calculator
   -------------------------------------------------------------
   Pure function over the config + PRICING rules. Returns an
   itemised, clearly-labelled ESTIMATE (never a binding quote).
   ============================================================= */
import { PRICING, ACCESSORIES, byId } from './config.js';

export function computeEstimate(cfg) {
  if (!PRICING.enabled) return null;
  const areaM2 = Math.max((cfg.width / 1000) * (cfg.height / 1000), 0.1);
  const base = PRICING.basePerSqm[cfg.product] || 4000;
  const frameF = PRICING.frameFactor[cfg.frameColor] ?? 1;
  const matId = cfg.surfaceFamily === 'mirror' ? cfg.mirror : cfg.glass;
  const glassF = PRICING.glassFactor[matId] ?? 1;

  const panelsCost = PRICING.panelSurcharge * Math.max(0, cfg.panels - 1) * areaM2;
  const thicknessCost = PRICING.thicknessSurchargePerMm * Math.max(0, cfg.glassThick - 5) * areaM2;

  const core = areaM2 * base * frameF * glassF;
  let accessories = 0;
  const accLines = [];
  for (const id of cfg.accessories || []) {
    const a = byId(ACCESSORIES, id);
    if (a) { accessories += a.price; accLines.push({ name: a.name, price: a.price }); }
  }

  const subtotal = core + panelsCost + thicknessCost + accessories;
  return {
    currency: PRICING.currency,
    locale: PRICING.locale,
    areaM2,
    lines: [
      { name: `Base (${areaM2.toFixed(2)} m² × frame × glass)`, price: core },
      ...(panelsCost > 0 ? [{ name: `Extra panels (${cfg.panels})`, price: panelsCost }] : []),
      ...(thicknessCost > 0 ? [{ name: `Glass thickness (${cfg.glassThick} mm)`, price: thicknessCost }] : []),
      ...accLines
    ],
    total: subtotal,
    disclaimer: PRICING.disclaimer
  };
}

export function money(n, cfg) {
  try {
    return (PRICING.currency || '') + Math.round(n).toLocaleString(PRICING.locale || 'en-US');
  } catch (e) {
    return (PRICING.currency || '') + Math.round(n);
  }
}

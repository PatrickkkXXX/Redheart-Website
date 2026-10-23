/* =============================================================
   Geometry registry
   -------------------------------------------------------------
   Maps a product's `builder` to a geometry function. New builders
   (e.g. cabinets) slot in here without touching the rest of the app.
   ============================================================= */
import { buildSliding } from './sliding.js';
import { product } from '../config.js';

const BUILDERS = {
  sliding: buildSliding
  // cabinet: buildCabinet   // roadmap
};

export function buildModel(cfg, materials) {
  const p = product(cfg.product);
  const builder = p && BUILDERS[p.builder];
  if (!builder) {
    throw new Error('No geometry builder for product: ' + cfg.product);
  }
  return builder(cfg, materials);
}

export function builderExists(cfg) {
  const p = product(cfg.product);
  return !!(p && BUILDERS[p.builder]);
}

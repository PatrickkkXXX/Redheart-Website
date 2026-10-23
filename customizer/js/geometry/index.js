/* Geometry registry — maps a style's builder to a function. */
import { buildOpening } from './opening.js';
import { buildCabinet } from './cabinet.js';
import { style as styleDef } from '../config.js';

export function buildModel(cfg, materials) {
  const s = styleDef(cfg.style);
  if (!s) throw new Error('Unknown style: ' + cfg.style);
  if (s.builder === 'cabinet') return buildCabinet(cfg, s, materials);
  return buildOpening(cfg, s, materials); // window & door
}

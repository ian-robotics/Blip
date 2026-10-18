import { BLIP_ART, getBlipImage } from '../config/art.js';

/** Render PNG stage art; keep the streak flame as a theme-aware SVG. */
export function sprite(name, _legacyScale, colors = {}, color = null) {
  const art = BLIP_ART[name];
  if (art) {
    return `<img class="blip-art" src="${getBlipImage(name, color)}" alt="${art.label}" width="48" height="48" draggable="false">`;
  }
  if (name !== 'flame') throw new Error(`Unknown sprite: ${name}`);
  const rows = ['..X..', '.XX..', '.XXX.', 'XXoXX', 'XoooX', '.XXX.'];
  const palette = { X: 'var(--blip)', o: 'var(--gold)', ...colors };
  const scale = _legacyScale || 3;
  const rects = rows.flatMap((row, y) => [...row].map((char, x) => char === '.' ? ''
    : `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${palette[char]}"/>`)).join('');
  return `<svg viewBox="0 0 5 6" width="${5 * scale}" height="${6 * scale}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}

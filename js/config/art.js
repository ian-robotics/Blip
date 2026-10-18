/** Color IDs match the PNG filenames in every stage directory. */
export const BLIP_COLORS = ['blue', 'pink', 'white', 'yellow'];
export const isBlipColor = color => BLIP_COLORS.includes(color);

// Retain form keys to keep existing level rules and saved progress compatible.
export const BLIP_ART = {
  pod: { stage: 0, label: 'Blip pod' },
  baby: { stage: 1, label: 'Blip hatchling' },
  hat: { stage: 2, label: 'Evolved Blip' },
  king: { stage: 3, label: 'Mature Blip' }
};

export function getBlipImage(form, color) {
  const art = BLIP_ART[form];
  if (!art) throw new Error(`Unknown Blip form: ${form}`);
  // Blue is only a display fallback; null still means no choice has been saved.
  const selected = isBlipColor(color) ? color : 'blue';
  return new URL(
    `../../assets/blip/stage${art.stage}/${selected}.png`,
    import.meta.url
  ).href;
}

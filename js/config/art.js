/** Stage artwork. Numbered PNGs are alternate designs, not animation frames. */
export const BLIP_COLORS = ['blue', 'pink', 'white', 'yellow'];

export function isBlipColor(color) {
  return BLIP_COLORS.includes(color);
}
const image = stage => new URL(
  `../../assets/blip/stage${stage}/blue.png`,
  import.meta.url
).href;

const STAGES = {
  pod: 0,
  baby: 1,
  hat: 2,
  king: 3
}

export function getBlipImage(form, color = 'blue') {
  const stage = STAGES[form];
  if (stage === undefined) throw new Error(`Unknown Blip form: ${form}`);
  const selectedColor = isBlipColor(color) ? color : 'blue';
  return new URL(
    `../../assets/blip/stage${stage}/${selectedColor}.png`,
    import.meta.url
  ).href;
}

// Keep existing form keys so saved progress and level rules remain compatible.
export const BLIP_ART = {
  pod: { src: image(0), label: 'Blip pod' },
  baby: { src: image(1), label: 'Blip hatchling' },
  hat: { src: image(2), label: 'Evolved Blip' },
  king: { src: image(3), label: 'Mature Blip' }
};

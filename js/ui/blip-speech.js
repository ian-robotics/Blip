import { BLIP_WORDS } from '../config/blip-words.js';

/** Shuffle bags exhaust each tier before reuse; avoid repeats across bag boundaries. */
export function createBlipSpeech(random = Math.random) {
  const bags = new Map();
  let last = '';
  let key = '';
  let current;
  return (day, completed, { reroll = false, readOnly = false } = {}) => {
    const nextKey = `${day}:${completed}:${readOnly}`;
    if (nextKey === key && !reroll) return current;
    const tier = BLIP_WORDS.find(tier => completed >= tier.min && completed <= tier.max);
    let bag = bags.get(tier);
    if (!bag?.length) {
      bag = [...tier.words];
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      if (bag.at(-1) === last) [bag[0], bag[bag.length - 1]] = [bag.at(-1), bag[0]];
      bags.set(tier, bag);
    }
    last = bag.pop();
    key = nextKey;
    current = { text: last, mood: tier.mood };
    return current;
  };
}

export const DAILY_FULLNESS_GOAL = 5;

/** Only feeding increases daily fullness; food inventory persists across days. */
export function fullnessOf(state) {
  const count = state.fullness ?? 0;
  const tier = count >= 8 ? 4 : count >= 5 ? 3 : count >= 3 ? 2 : count >= 1 ? 1 : 0;
  return { count, tier, progress: Math.min(count / DAILY_FULLNESS_GOAL, 1) * 100 };
}

export function feedPet(state) {
  if (!(state.food > 0)) return [];
  state.food--;
  state.fullness = (state.fullness ?? 0) + 1;
  return [{ type: 'pet-fed' }];
}

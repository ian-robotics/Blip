import { STORAGE_KEY, XP, BADGES } from '../config/game.js';
import { fresh } from '../state/initial-state.js';

/** Validate the existing v1 shape before it reaches rendering or domain code. */
export function isValidState(state) {
  if (!state || typeof state !== 'object') return false;
  const nonnegative = value => Number.isSafeInteger(value) && value >= 0;
  if (!['xp', 'streak', 'doneTotal', 'sample'].every(key => nonnegative(state[key]))) return false;
  if (!Number.isSafeInteger(state.day) || state.day < 1) return false;
  if (!Number.isSafeInteger(state.nextId) || state.nextId < 1) return false;
  if (!Array.isArray(state.week) || state.week.length !== 7 || !state.week.every(day => typeof day === 'boolean')) return false;
  if (!Array.isArray(state.badges) || !state.badges.every(id => BADGES.some(badge => badge.id === id))) return false;
  if (new Set(state.badges).size !== state.badges.length) return false;
  if (!Array.isArray(state.tasks)) return false;
  const ids = new Set();
  return state.tasks.every(task => {
    if (!task || !Number.isSafeInteger(task.id) || task.id < 1 || task.id >= state.nextId || ids.has(task.id)) return false;
    ids.add(task.id);
    return typeof task.title === 'string' && typeof task.time === 'string'
      && Object.hasOwn(XP, task.prio) && typeof task.done === 'boolean';
  });
}

/** Storage access is deferred so denied localStorage still permits in-memory use. */
export function createStorage(getStorage = () => window.localStorage) {
  return {
    load() {
      try {
        const state = JSON.parse(getStorage().getItem(STORAGE_KEY));
        return isValidState(state) ? state : fresh();
      } catch {
        return fresh();
      }
    },
    save(state) {
      try {
        getStorage().setItem(STORAGE_KEY, JSON.stringify(state));
        return true;
      } catch {
        return false;
      }
    }
  };
}

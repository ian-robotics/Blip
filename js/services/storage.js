import { isBlipColor } from '../config/art.js';
import { STORAGE_KEY, XP, BADGES } from '../config/game.js?v=daily-demo-1';
import { fresh } from '../state/initial-state.js?v=daily-demo-1';

const nonnegative = value => Number.isSafeInteger(value) && value >= 0;

export function getProgressError(state) {
  if (!state || typeof state !== 'object') return 'progress is missing';
  if (state.color !== null && !isBlipColor(state.color)) return 'color is invalid';
  for (const key of ['xp', 'streak', 'doneTotal']) {
    if (!nonnegative(state[key])) return `${key} is invalid`;
  }
  if (!Number.isSafeInteger(state.day) || state.day < 1 || state.day > 7) return 'day is outside 1–7';
  if (!Array.isArray(state.week) || state.week.length !== 7 || !state.week.every(day => typeof day === 'boolean')) return 'week is invalid';
  if (!Array.isArray(state.badges) || !state.badges.every(id => BADGES.some(badge => badge.id === id))) return 'badges are invalid';
  if (new Set(state.badges).size !== state.badges.length) return 'badges contain duplicates';
  if (!Array.isArray(state.tasks)) return 'tasks are missing';
  const ids = new Set();
  for (const task of state.tasks) {
    if (!task || !Number.isSafeInteger(task.id) || task.id < 1 || ids.has(task.id)) return 'task IDs are invalid';
    ids.add(task.id);
    if (Object.hasOwn(task, 'xp') && task.xp !== XP[task.prio]) return 'task reward is invalid';
    if (typeof task.title !== 'string' || typeof task.time !== 'string'
      || !Object.hasOwn(XP, task.prio) || typeof task.done !== 'boolean') return 'task fields are invalid';
  }
  return null;
}

export const isValidProgress = state => getProgressError(state) === null;

/** Return the exact failing invariant without including personal task text. */
export function getStateError(state) {
  const error = getProgressError(state);
  if (error) return error;
  if (!nonnegative(state.sample)) return 'sample is invalid';
  if (!Number.isSafeInteger(state.nextId) || state.nextId < 1) return 'nextId is invalid';
  if (!Array.isArray(state.history)) return 'history is missing';
  if (state.history.length !== state.day - 1) {
    return `Day ${state.day} needs ${state.day - 1} snapshots, found ${state.history.length}`;
  }
  for (let index = 0; index < state.history.length; index++) {
    const snapshot = state.history[index];
    const snapshotError = getProgressError(snapshot);
    if (snapshotError) return `snapshot ${index + 1}: ${snapshotError}`;
    if (snapshot.day !== index + 1) return `snapshot ${index + 1}: wrong day`;
    if (Object.hasOwn(snapshot, 'history')) return `snapshot ${index + 1}: nested history`;
  }
  if (![state, ...state.history].every(progress => progress.tasks.every(task => task.id < state.nextId))) return 'nextId does not exceed task IDs';
  return null;
}

export const isValidState = state => getStateError(state) === null;

/** Storage access is deferred so denied localStorage still permits in-memory use. */
export function createStorage(getStorage = () => window.localStorage) {
  return {
    load() {
      try {
        const raw = getStorage().getItem(STORAGE_KEY);
        const state = JSON.parse(raw);
        // Migrate pre-color v1 saves without resetting XP, tasks, or badges.
        if (state && typeof state === 'object' && !Object.hasOwn(state, 'color')) {
          state.color = null;
        }
        // Old demos had an arbitrary day counter but no snapshots. Start a new
        // seven-day timeline while retaining tasks, XP, color and earned badges.
        if (state && typeof state === 'object' && !Object.hasOwn(state, 'history')) {
          state.day = 1;
          state.history = [];
          if (Array.isArray(state.tasks)) {
            state.week = [state.tasks.some(task => task?.done), false, false, false, false, false, false];
          }
        }
        // A previously loaded old rollover script could advance the date while
        // leaving history empty. Preserve earned progress, never invent history.
        if (isValidProgress(state) && state.day > 1
          && Array.isArray(state.history) && state.history.length === 0) {
          const repaired = {
            ...state, day: 1,
            week: [state.tasks.some(task => task.done), false, false, false, false, false, false]
          };
          if (isValidState(repaired)) {
            try {
              const storage = getStorage();
              const backupKey = `${STORAGE_KEY}:before-history-repair`;
              if (!storage.getItem(backupKey)) storage.setItem(backupKey, raw);
              storage.setItem(STORAGE_KEY, JSON.stringify(repaired));
            } catch { /* Preserve progress in memory even when persistence fails. */ }
            return repaired;
          }
        }
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

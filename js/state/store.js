import { getStateError } from '../services/storage.js?v=weekly-history-2';
import { isBlipColor } from '../config/art.js';
import { SAMPLES } from '../config/game.js?v=daily-demo-1';
import { fresh } from './initial-state.js?v=daily-demo-1';
import { completeTask, addTasks, advanceDay } from '../domain/progression.js?v=daily-demo-1';

/** Single state owner. Subscribers receive a snapshot after persistence. */
export function createStore(storage) {
  let state = storage.load();
  const listeners = new Set();
  const snapshot = () => structuredClone(state);
  function commit(events = []) {
    const saved = storage.save(state);
    const current = snapshot();
    for (const listener of listeners) listener(current, events, { saved });
  }
  return {
    getState: snapshot,
    chooseColor(color) {
      if (!isBlipColor(color)) return false;
      state.color = color;
      commit([{ type: 'color-chosen', color }]);
      return true;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    completeTask(id) { commit(completeTask(state, id)); },
    deleteTask(id) {
      state.tasks = state.tasks.filter(task => task.id !== id);
      commit();
    },
    addTasks(drafts) { commit(addTasks(state, drafts)); },
    advanceDay() {
      if (state.day >= 7) return;
      // Roll over a draft: never commit a new day without its complete snapshot.
      const draft = snapshot();
      const events = advanceDay(draft);
      const error = getStateError(draft);
      if (error) throw new Error(`Day rollover failed: ${error}`);
      state = draft;
      commit(events);
    },
    reset() { state = fresh(); commit([{ type: 'reset' }]); },
    nextSample() {
      const phrase = SAMPLES[state.sample % SAMPLES.length];
      state.sample++;
      commit();
      return phrase;
    }
  };
}

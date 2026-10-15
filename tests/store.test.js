import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorage, isValidState } from '../js/services/storage.js';
import { createStore } from '../js/state/store.js';
import { fresh } from '../js/state/initial-state.js';
import { STORAGE_KEY } from '../js/config/game.js';

function memoryStorage(initial = null) {
  let data = initial;
  return { getItem: () => data, setItem: (key, value) => { assert.equal(key, STORAGE_KEY); data = value; } };
}

test('existing v1 data survives load and store updates', () => {
  const previous = fresh();
  previous.xp = 150;
  const memory = memoryStorage(JSON.stringify(previous));
  const storage = createStorage(() => memory);
  const store = createStore(storage);
  assert.equal(store.getState().xp, 150);
  store.completeTask(1);
  assert.equal(storage.load().xp, 180);
});

test('malformed JSON, invalid shapes and denied storage recover safely', () => {
  for (const data of ['{', '{}', 'null', JSON.stringify({ ...fresh(), tasks: [{ id: 1 }] })]) {
    assert.deepEqual(createStorage(() => memoryStorage(data)).load(), fresh());
  }
  assert.equal(isValidState({ ...fresh(), nextId: 1 }), false);
  assert.equal(isValidState({ ...fresh(), badges: ['unknown'] }), false);
  const storage = createStorage(() => { throw new Error('denied'); });
  const store = createStore(storage);
  store.completeTask(1);
  assert.equal(store.getState().xp, 70);
  assert.equal(storage.save(fresh()), false);
});

test('store snapshots cannot mutate internal state; reset persists and notifies', () => {
  const memory = memoryStorage();
  const storage = createStorage(() => memory);
  const store = createStore(storage);
  const copy = store.getState();
  copy.tasks[0].done = true;
  assert.equal(store.getState().tasks[0].done, false);
  const events = [];
  const unsubscribe = store.subscribe((state, emitted) => events.push(...emitted));
  store.completeTask(1);
  store.reset();
  assert.deepEqual(store.getState(), fresh());
  assert.deepEqual(storage.load(), fresh());
  assert.ok(events.some(event => event.type === 'reset'));
  unsubscribe();
  const length = events.length;
  store.advanceDay();
  assert.equal(events.length, length);
});

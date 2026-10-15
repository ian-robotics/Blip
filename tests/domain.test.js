import test from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../js/domain/parser.js';
import { fresh } from '../js/state/initial-state.js';
import { levelOf, nextOf, completeTask, addTasks, advanceDay } from '../js/domain/progression.js';

test('parser keeps grocery conjunctions and extracts priority/time', () => {
  const tasks = parse('Submit the 151 prototype by 11pm tonight, and buy milk and eggs, also call mom this weekend');
  assert.equal(tasks.length, 3);
  assert.equal(tasks[0].prio, 'high');
  assert.match(tasks[0].time, /11pm/i);
  assert.equal(tasks[1].title, 'Buy milk and eggs');
  assert.match(tasks[2].time, /weekend/i);
  assert.equal(parse('maybe clean my desk on Sunday')[0].prio, 'low');
  assert.deepEqual(parse(''), []);
});

test('level thresholds and final level have correct boundaries', () => {
  assert.equal(levelOf(59).lv, 1);
  assert.equal(levelOf(60).lv, 2);
  assert.equal(levelOf(400).lv, 5);
  assert.equal(nextOf(levelOf(400)), undefined);
});

test('completion grants XP and evolution only once', () => {
  const state = fresh();
  const events = completeTask(state, 1);
  assert.equal(state.xp, 70);
  assert.equal(state.doneTotal, 12);
  assert.equal(state.week[4], true);
  assert.ok(events.some(event => event.type === 'level-up' && event.to.lv === 2));
  assert.deepEqual(state.badges, ['hatch']);
  assert.deepEqual(completeTask(state, 1), []);
  assert.deepEqual(completeTask(state, 999), []);
  assert.equal(state.xp, 70);
});

test('clean sweep, busy bee and batch badges are awarded without duplicates', () => {
  const state = fresh();
  state.doneTotal = 14;
  state.tasks = [state.tasks[0]];
  completeTask(state, 1);
  assert.ok(state.badges.includes('sweep'));
  assert.ok(state.badges.includes('fifteen'));
  const drafts = parse('Buy milk, email the TA, clean my desk');
  addTasks(state, drafts);
  addTasks(state, drafts);
  assert.equal(state.badges.filter(id => id === 'chat').length, 1);
  assert.equal(new Set(state.tasks.map(task => task.id)).size, state.tasks.length);
  assert.equal(state.tasks.at(-1).done, true);
});

test('day advance preserves unfinished tasks and resets streak on missed days', () => {
  const state = fresh();
  completeTask(state, 1);
  advanceDay(state);
  assert.equal(state.streak, 5);
  assert.equal(state.day, 6);
  assert.equal(state.tasks.length, 2);
  assert.ok(state.badges.includes('roll'));
  advanceDay(state);
  assert.equal(state.streak, 0);
  advanceDay(state);
  assert.equal(state.day, 8);
  assert.deepEqual(state.week, Array(7).fill(false));
});

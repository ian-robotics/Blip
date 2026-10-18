import { LEVELS, XP, DEMO_TASKS_BY_DAY } from '../config/game.js?v=daily-demo-1';

export function levelOf(xp) {
  return LEVELS.reduce((current, level) => xp >= level.xp ? level : current, LEVELS[0]);
}

export function nextOf(level) {
  return LEVELS.find(candidate => candidate.lv === level.lv + 1);
}

export function todayIdx(state) {
  return (state.day - 1) % 7;
}

function award(state, id, events) {
  if (state.badges.includes(id)) return;
  state.badges.push(id);
  events.push({ type: 'badge', id });
}

/** Domain operations mutate only the supplied state and return UI-neutral events. */
export function completeTask(state, id) {
  const task = state.tasks.find(task => task.id === id);
  if (!task || task.done) return [];
  const before = levelOf(state.xp);
  task.done = true;
  state.xp += XP[task.prio];
  state.doneTotal++;
  state.week[todayIdx(state)] = true;
  const events = [{ type: 'task-completed', id, xp: XP[task.prio] }];
  if (state.tasks.every(task => task.done)) award(state, 'sweep', events);
  if (state.doneTotal >= 15) award(state, 'fifteen', events);
  const after = levelOf(state.xp);
  if (after.lv >= 2) award(state, 'hatch', events);
  if (after.lv >= 4) award(state, 'king', events);
  if (after.lv > before.lv) events.push({ type: 'level-up', from: before, to: after });
  return events;
}

export function addTasks(state, drafts) {
  const events = [];
  if (drafts.length >= 3) award(state, 'chat', events);
  for (const task of drafts) {
    state.tasks.push({ title: task.title, time: task.time, prio: task.prio, id: state.nextId++, done: false });
  }
  state.tasks.sort((a, b) => a.done - b.done);
  return events;
}

export function createDaySnapshot(state) {
  const { day, color, xp, streak, doneTotal, badges, week, tasks } = state;
  return structuredClone({ day, color, xp, streak, doneTotal, badges, week, tasks });
}

export function advanceDay(state) {
  if (state.day >= 7) return [];
  state.history.push(createDaySnapshot(state));
  const did = state.tasks.some(task => task.done);
  state.streak = did ? state.streak + 1 : 0;
  state.day++;
  state.tasks = state.tasks.filter(task => !task.done);

  const demoTasks = DEMO_TASKS_BY_DAY[state.day] ?? [];

  for (const task of demoTasks) {
    state.tasks.push({
      ...task,
      id: state.nextId++,
      done: false
    });
  }

  const events = [];
  if (state.streak >= 5) {
    award(state, 'roll', events);
  }
  events.push({
    type: 'day-advanced',
    did,
    streak: state.streak
  });
  return events;
}

import { DEMO_TASKS_BY_DAY } from '../config/game.js?v=daily-demo-1';

export function fresh() {
  const tasks = DEMO_TASKS_BY_DAY[1].map((task, index) => ({
    ...task, id: index + 1, done: false
  }));
  return {
    color: null,
    xp: 40, streak: 4, day: 1, doneTotal: 11, sample: 0, badges: [],
    history: [],
    week: [false, false, false, false, false, false, false],
    tasks,
    nextId: tasks.length + 1
  };
}

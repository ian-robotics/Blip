import { XP, DIFFICULTY_XP } from '../config/game.js';

/** Legacy tasks retain their original priority-based rewards. */
export function isValidTaskReward(task) {
  if (!task || !Object.hasOwn(XP, task.prio)) return false;
  if (task.rewardVersion === 'dev') {
    return task.title === 'dev' && Number.isSafeInteger(task.xp) && task.xp >= 0 && task.xp <= 100000;
  }
  if (!Object.hasOwn(task, 'rewardVersion')) {
    return !Object.hasOwn(task, 'difficulty') &&
      (!Object.hasOwn(task, 'xp') || task.xp === XP[task.prio]);
  }
  return task.rewardVersion === 2 &&
    Object.hasOwn(DIFFICULTY_XP, task.difficulty) &&
    task.xp === DIFFICULTY_XP[task.difficulty] &&
    typeof task.difficultyReason === 'string' && task.difficultyReason.length <= 300 &&
    typeof task.urgencyReason === 'string' && task.urgencyReason.length <= 300;
}

export function taskReward(task) {
  if (!isValidTaskReward(task)) throw new Error('Invalid task reward');
  return task.xp ?? XP[task.prio];
}

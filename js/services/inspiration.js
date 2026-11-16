import { taskApiUrl } from '../config/api.js';
import { isValidTaskReward } from '../domain/rewards.js';

export const titleKey = title => title.trim().toLocaleLowerCase().replace(/[\s\p{P}]+/gu, '');

export function localInspirations(state) {
  const suggestions = [];
  const reminder = state.tasks.find(task => !task.done && (task.scheduledDay ?? state.day) === state.day);
  if (reminder) suggestions.push({...reminder, kind:'reminder',
    message:`Before you skip today, remember: ${reminder.title}.`, source:'local'});
  const seen = new Map();
  for (const snapshot of state.history.slice(-5)) {
    for (const task of snapshot.tasks.filter(task => task.done)) {
      const key = titleKey(task.title);
      const item = seen.get(key) ?? {task, days:new Set()};
      item.days.add(snapshot.day);
      seen.set(key, item);
    }
  }
  const repeated = [...seen.values()].find(item => item.days.size >= 2 &&
    !state.tasks.some(task => titleKey(task.title) === titleKey(item.task.title)));
  const title = repeated?.task.title ?? 'Plan one small next step for today';
  if (!state.tasks.some(task => titleKey(task.title) === titleKey(title))) {
    suggestions.push({title, time:'', prio:'normal', difficulty:'easy', xp:10,
      difficultyReason:'A small suggested action; adjust your task description for a new assessment.',
      urgencyReason:'Optional suggestion.', rewardVersion:2, scheduledDay:state.day,
      kind:repeated ? 'pattern' : 'inspiration',
      message:repeated ? `You’ve done “${title}” on several days. Add it for today?` : 'What’s one small next step? Tap to add a short planning task.', source:'local'});
  }
  return suggestions;
}

export async function fetchInspirations(state, signal) {
  const compact = (task, day) => ({title:task.title, day:task.scheduledDay ?? day, done:task.done});
  const response = await fetch(taskApiUrl().replace(/\/parse$/, '/inspiration'), {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({currentDay:state.day,
      tasks:state.tasks.slice(0,40).map(task => compact(task,state.day)),
      recent:state.history.slice(-5).flatMap(snapshot => snapshot.tasks.map(task => compact(task,snapshot.day))).slice(-40)}),
    signal:AbortSignal.any([signal, AbortSignal.timeout(15000)])
  });
  if (!response.ok) throw new Error('inspiration_unavailable');
  const result = await response.json();
  if (!Array.isArray(result.tasks) || result.tasks.length > 2 || result.tasks.some(task =>
    !task || typeof task.title !== 'string' || !task.title.trim() || task.title.length > 300 ||
    typeof task.time !== 'string' || task.time.length > 200 ||
    !isValidTaskReward(task) || task.rewardVersion !== 2 ||
    !['pattern','inspiration','reminder'].includes(task.kind) ||
    typeof task.message !== 'string' || !task.message.trim() || task.message.length > 180)) throw new Error('invalid_inspiration');
  return result.tasks.map(task => ({...task, scheduledDay:state.day, source:'groq'}));
}

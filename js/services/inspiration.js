import { taskApiUrl } from '../config/api.js';
import { isValidTaskReward } from '../domain/rewards.js';

export const titleKey = title => title.trim().toLocaleLowerCase().replace(/[\s\p{P}]+/gu, '');
export const isNotice = task => task.kind === 'notice' || /\bplan(?:ning)?\b.*\b(?:tomorrow|tmr|today|task|next step)\b|\b(?:review|organize)\b.*\b(?:tomorrow|tmr|tasks?)\b|规划.*(?:明天|任务)|安排.*明天|计划.*(?:明天|任务)/i.test(task.title);
export const canAddInspiration = task => task?.source === 'groq' && task.kind === 'inspiration' && !isNotice(task);

export function historicalCandidates(state) {
  const current = new Set(state.tasks.map(task => titleKey(task.title)));
  const candidates = new Map();
  for (const snapshot of state.history) {
    for (const task of snapshot.tasks) {
      const key = titleKey(task.title);
      if (current.has(key) || isNotice(task) || (task.scheduledDay ?? snapshot.day) > snapshot.day) continue;
      const entry = candidates.get(key) ?? {task, days:new Set(), last:0};
      entry.days.add(snapshot.day);
      entry.last = Math.max(entry.last,snapshot.day);
      candidates.set(key,entry);
    }
  }
  return [...candidates.values()].sort((a,b)=>b.days.size-a.days.size || b.last-a.last).map(entry=>entry.task);
}

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
      kind:repeated ? 'pattern' : 'notice',
      message:repeated ? `You’ve done “${title}” on several days. Add it for today?` : 'Take a moment to think about tomorrow’s tasks. You can add them when you’re ready.', source:'local'});
  }
  return suggestions;
}

export async function fetchInspirations(state, signal) {
  const compact = (task, day) => ({title:task.title, day:task.scheduledDay ?? day, done:task.done});
  const candidates = historicalCandidates(state);
  const ranks = new Map(candidates.map((task,index)=>[task.title,index]));
  const response = await fetch(taskApiUrl().replace(/\/parse$/, '/inspiration'), {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({currentDay:state.day,
      tasks:state.tasks.slice(0,40).map(task => compact(task,state.day)),
      recent:state.history.flatMap(snapshot => snapshot.tasks
        .filter(task => (task.scheduledDay ?? snapshot.day) <= snapshot.day)
        .map(task => ({title:task.title, day:snapshot.day, done:task.done})))
        .filter(task => ranks.has(task.title))
        .sort((a,b)=>ranks.get(a.title)-ranks.get(b.title)).slice(0,40)}),
    signal:AbortSignal.any([signal, AbortSignal.timeout(15000)])
  });
  if (!response.ok) throw new Error('inspiration_unavailable');
  const result = await response.json();
  if (!Array.isArray(result.tasks) || result.tasks.length > 3 || result.tasks.some(task =>
    !task || typeof task.title !== 'string' || !task.title.trim() || task.title.length > 300 ||
    typeof task.time !== 'string' || task.time.length > 200 ||
    !isValidTaskReward(task) || task.rewardVersion !== 2 ||
    !['pattern','inspiration','reminder','notice'].includes(task.kind) ||
    typeof task.message !== 'string' || !task.message.trim() || task.message.length > 180)) throw new Error('invalid_inspiration');
  return result.tasks.map(task => ({...task, scheduledDay:state.day,
    source:task.selectionSource === 'history-rule' ? 'local' : 'groq'}));
}

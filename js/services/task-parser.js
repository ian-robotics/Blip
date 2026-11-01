import { taskApiUrl } from '../config/api.js';
import { DIFFICULTY_XP } from '../config/game.js';
import { parse } from '../domain/parser.js';

const PRIORITIES = ['low', 'normal', 'high'];

function localResult(text) {
  let tasks = parse(text);
  // Preserve custom names that the rule-based parser cannot interpret.
  if (!tasks.length){
    tasks = [{title: text, time: '', prio: 'normal'}];
  }
  return {
    source: 'local',
    tasks: tasks.map(task => ({
      ...task,
      difficulty: 'easy',
      xp: DIFFICULTY_XP.easy,
      rewardVersion: 2,
      difficultyReason:
        'Default estimate. Add more detail and retry AI for assessment.',
      urgencyReason: 'Suggested by local rules.',
      needsConfirmation: true
    }))
  };
}

export async function parseTasks(text, { signal } = {}) {
  text = text.trim();
  if (!text) return { tasks: [], source: 'local' };
  if (signal?.aborted) throw signal.reason;
  if (text === 'dev') return {
    source: 'dev',
    tasks: [{ title: 'dev', time: '', prio: 'normal', xp: 20,
      rewardVersion: 'dev', reason: 'Debug task. Click its XP after adding to customize it.' }]
  };
  try {
    const response = await fetch(taskApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, now: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, language: navigator.language }),
      signal: AbortSignal.any([signal || new AbortController().signal, AbortSignal.timeout(90000)])
    });
    if (!response.ok) {
      const failure = await response.json().catch(() => ({}));
      throw new Error(failure.error || 'unavailable');
    }
    const data = await response.json();
    if (!data || !Array.isArray(data.tasks) || data.tasks.length > 20 ||
      data.tasks.some(task => !task ||
        typeof task.title !== 'string' || !task.title.trim() || task.title.length > 300 ||
        typeof task.time !== 'string' || task.time.length > 200 ||
        !PRIORITIES.includes(task.prio) ||
        !Object.hasOwn(DIFFICULTY_XP, task.difficulty) ||
        task.xp !== DIFFICULTY_XP[task.difficulty] || task.rewardVersion !== 2 ||
        typeof task.difficultyReason !== 'string' || task.difficultyReason.length > 300 ||
        typeof task.urgencyReason !== 'string' || task.urgencyReason.length > 300 ||
        typeof task.needsConfirmation !== 'boolean')) {
      throw new Error('invalid_result');
    }
    return data.tasks.length
      ? { tasks: data.tasks, source: 'groq' }
      : localResult(text);
  } catch (error) {
    if (signal?.aborted) throw error;
    return localResult(text);
  }
}


export function summarize(tasks) {
  if (!tasks.length) return 'Invalid task or no tasks found. Try another description or voice input.';
  const totalXp = tasks.reduce((sum, task) => sum + task.xp, 0);

  return `${tasks.length} task${tasks.length === 1 ? '' : 's'} · ${totalXp} XP`;
}

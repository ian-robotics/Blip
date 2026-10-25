import { taskApiUrl } from '../config/api.js';
import { XP } from '../config/game.js';

export async function parseTasks(text, { signal } = {}) {
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
    if (!Array.isArray(data.tasks) || data.tasks.some(task =>
      typeof task.title !== 'string' || !task.title.trim() || typeof task.time !== 'string'
      || !Object.hasOwn(XP, task.prio) || task.xp !== XP[task.prio])) throw new Error('invalid_result');
    return { tasks: data.tasks, source: 'groq' };
  } catch (error) {
    if (signal?.aborted) throw error;
    throw error;
  }
}

export function summarize(tasks) {
  if (!tasks.length) return 'Invalid task or no tasks found. Try another description or voice input.';
  const high = tasks.filter(task => task.prio === 'high').length;
  return `${tasks.length} task${tasks.length === 1 ? '' : 's'} · ${high} high priority · Priority and XP assigned by AI.`;
}

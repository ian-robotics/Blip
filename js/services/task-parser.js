import { taskApiUrl } from '../config/api.js';
import { XP } from '../config/game.js';
import { parse } from '../domain/parser.js';

function localResult(text) {
  let tasks = parse(text);
  // Preserve custom names that the rule-based parser cannot interpret.
  if (!tasks.length) tasks = [{ title: text, time: '', prio: 'normal' }];
  return {
    source: 'local',
    tasks: tasks.map(task => ({ ...task, xp: XP[task.prio],
      reason: 'Suggested locally. Review the title, deadline and priority before adding.',
      needsConfirmation: true }))
  };
}

export async function parseTasks(text, { signal } = {}) {
  text = text.trim();
  if (!text) return { tasks: [], source: 'local' };
  if (signal?.aborted) throw signal.reason;
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
      !task || typeof task.title !== 'string' || !task.title.trim() || typeof task.time !== 'string'
      || !Object.hasOwn(XP, task.prio) || task.xp !== XP[task.prio])) throw new Error('invalid_result');
    return data.tasks.length ? { tasks: data.tasks, source: 'groq' } : localResult(text);
  } catch (error) {
    if (signal?.aborted) throw error;
    return localResult(text);
  }
}

export function summarize(tasks) {
  if (!tasks.length) return 'Invalid task or no tasks found. Try another description or voice input.';
  const high = tasks.filter(task => task.prio === 'high').length;
  return `${tasks.length} task${tasks.length === 1 ? '' : 's'} · ${high} high priority · Tap a priority to change it.`;
}

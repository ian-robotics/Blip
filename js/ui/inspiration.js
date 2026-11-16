import { fetchInspirations, localInspirations, titleKey, isNotice, canAddInspiration, historicalCandidates } from '../services/inspiration.js';
import { $ } from './dom.js';

/** Each new simulated day owns its requests, timers and three notification slots. */
export function initInspiration(store, { canShow, onOpen, notify,
  request = fetchInspirations, schedule = setTimeout, cancel = clearTimeout } = {}) {
  let generation = 0;
  let controller;
  let timers = [];
  let suggestions = [];
  let active = null;
  let shown = new Set();
  let day;
  let pending = 0;
  let polling = false;
  let lastShown = 0;
  let requestSettled = true;
  const cacheKey = 'blip-inspiration-days-v2';
  let days = {};
  try { days = JSON.parse(globalThis.localStorage?.getItem(cacheKey) || '{}'); } catch {}
  if (!days || typeof days !== 'object' || Array.isArray(days)) days = {};
  const save = () => { try { globalThis.localStorage?.setItem(cacheKey, JSON.stringify(days)); } catch {} };

  function stop() {
    generation++;
    controller?.abort();
    timers.forEach(cancel);
    timers = [];
    active = null;
    pending = 0;
    polling = false;
    lastShown = 0;
    $('inspirationNotice').hidden = true;
  }
  function eligible(task, state) {
    if (isNotice(task)) return true;
    const existing = state.tasks.find(item => titleKey(item.title) === titleKey(task.title));
    return task.kind === 'reminder'
      ? existing && !existing.done && (existing.scheduledDay ?? state.day) === state.day
      : !existing;
  }
  function show() {
    const state = store.getState();
    const record = days[day];
    if (!record || record.count >= 3) return;
    if (state.day !== day || !canShow()) { $('inspirationNotice').hidden = true; return; }
    const candidates = [...suggestions, ...localInspirations(state)];
    const historical = historicalCandidates(state);
    if (state.day >= 3 && record.count === 0 && historical.length) {
      const exact = suggestions.find(task => canAddInspiration(task) && historical.some(item=>item.title===task.title) && eligible(task,state));
      if (!exact && !requestSettled) return false;
      const fallback = historical[0];
      candidates.splice(0,candidates.length,exact ?? {...fallback,kind:'pattern',source:'local',
        message:`You previously had “${fallback.title}”. Would you like to do it again today?`});
    }
    const hasTodayTasks = state.tasks.some(task => !task.done && (task.scheduledDay ?? state.day) <= state.day);
    if (!hasTodayTasks) candidates.sort((a,b) => Number(canAddInspiration(b)) - Number(canAddInspiration(a)));
    active = candidates.find(task =>
      !shown.has(titleKey(task.title)) && eligible(task,state));
    if (!active) { $('inspirationNotice').hidden = true; return; }
    shown.add(titleKey(active.title));
    record.count++;
    record.shown = [...shown];
    save();
    $('inspirationType').textContent = `${active.source === 'groq' ? 'Groq' : 'Blip'} · ${active.kind === 'pattern' ? 'Your routine' : active.kind === 'reminder' ? 'Today’s reminder' : 'Task inspiration'}`;
    $('inspirationMessage').textContent = active.message;
    $('inspirationAction').textContent = 'Tap to add task';
    $('inspirationAccept').hidden = !canAddInspiration(active);
    $('inspirationNotice').hidden = false;
    return true;
  }
  function start(state) {
    stop();
    const token = generation;
    day = state.day;
    const record = days[day] ??= {count:0, requested:false, suggestions:[], shown:[]};
    shown = new Set(record.shown || []);
    suggestions = Array.isArray(record.suggestions) ? record.suggestions : [];
    if (record.count >= 3) return;
    controller = new AbortController();
    requestSettled = true;
    if (!record.requested) {
      requestSettled = false;
      record.requested = true;
      save();
      request(state, controller.signal).then(items => {
        if (token === generation) {
          suggestions = items;
          record.suggestions = items;
          save();
        }
      }).catch(() => { /* No retry this day; use dismiss-only historical prompts. */ })
        .finally(() => { if (token === generation) requestSettled = true; });
    }
    function pump() {
      polling = false;
      if (token !== generation || !pending) return;
      if (!canShow() || Date.now() - lastShown < 7000) {
        polling = true;
        timers.push(schedule(pump,1000));
        return;
      }
      if (show() === false) {
        polling = true;
        timers.push(schedule(pump,1000));
        return;
      }
      pending--;
      lastShown = Date.now();
      if (pending) {
        polling = true;
        timers.push(schedule(pump,7000));
      }
    }
    const due = () => { pending++; if (!polling) pump(); };
    timers = [schedule(due,7000), schedule(due,14000), schedule(due,21000)];
  }
  $('inspirationDismiss').onclick = () => { active = null; $('inspirationNotice').hidden = true; };
  $('inspirationAccept').onclick = () => {
    const task = active;
    if (!canAddInspiration(task)) return;
    const state = store.getState();
    if (!task || state.day !== day || !canShow() || !eligible(task,state)) {
      $('inspirationNotice').hidden = true;
      return;
    }
    active = null;
    $('inspirationNotice').hidden = true;
    store.addTasks([{...task, scheduledDay:state.day}]);
    notify('Suggested task added.');
    onOpen();
    const row = [...$('taskList').querySelectorAll('.task')].find(row =>
      row.querySelector('.t-title')?.textContent === task.title);
    row?.scrollIntoView({block:'nearest', behavior:'smooth'});
  };
  store.subscribe((state, events) => {
    if (events.some(event => event.type === 'reset')) { stop(); days = {}; save(); }
    else if (events.some(event => event.type === 'day-advanced')) start(state);
    else if (active && !eligible(active,state)) {
      active = null;
      $('inspirationNotice').hidden = true;
    }
  });
  return {stop, start};
}

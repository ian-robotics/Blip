import { fetchInspirations, localInspirations, titleKey } from '../services/inspiration.js';
import { $ } from './dom.js';

/** Each new simulated day owns its requests, timers and two notification slots. */
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
    const existing = state.tasks.find(item => titleKey(item.title) === titleKey(task.title));
    return task.kind === 'reminder'
      ? existing && !existing.done && (existing.scheduledDay ?? state.day) === state.day
      : !existing;
  }
  function show() {
    const state = store.getState();
    if (state.day !== day || !canShow()) { $('inspirationNotice').hidden = true; return; }
    active = [...suggestions, ...localInspirations(state)].find(task =>
      !shown.has(titleKey(task.title)) && eligible(task,state));
    if (!active) { $('inspirationNotice').hidden = true; return; }
    shown.add(titleKey(active.title));
    $('inspirationType').textContent = `${active.source === 'groq' ? 'Groq' : 'Blip'} · ${active.kind === 'pattern' ? 'Your routine' : active.kind === 'reminder' ? 'Today’s reminder' : 'Task inspiration'}`;
    $('inspirationMessage').textContent = active.message;
    $('inspirationAction').textContent = active.kind === 'reminder' ? 'View task' : 'Tap to add task';
    $('inspirationNotice').hidden = false;
  }
  function start(state) {
    stop();
    const token = generation;
    day = state.day;
    shown = new Set();
    suggestions = [];
    controller = new AbortController();
    request(state, controller.signal).then(items => {
      if (token === generation) suggestions = items;
    }).catch(() => { /* Timed local suggestions remain available. */ });
    function pump() {
      polling = false;
      if (token !== generation || !pending) return;
      if (!canShow() || Date.now() - lastShown < 5000) {
        polling = true;
        timers.push(schedule(pump,1000));
        return;
      }
      pending--;
      show();
      lastShown = Date.now();
      if (pending) {
        polling = true;
        timers.push(schedule(pump,5000));
      }
    }
    const due = () => { pending++; if (!polling) pump(); };
    timers = [schedule(due,5000), schedule(due,10000)];
  }
  $('inspirationDismiss').onclick = () => { active = null; $('inspirationNotice').hidden = true; };
  $('inspirationAccept').onclick = () => {
    const task = active;
    const state = store.getState();
    if (!task || state.day !== day || !canShow() || !eligible(task,state)) {
      $('inspirationNotice').hidden = true;
      return;
    }
    active = null;
    $('inspirationNotice').hidden = true;
    if (task.kind !== 'reminder') {
      store.addTasks([{...task, scheduledDay:state.day}]);
      notify('Suggested task added.');
    }
    onOpen();
    const row = [...$('taskList').querySelectorAll('.task')].find(row =>
      row.querySelector('.t-title')?.textContent === task.title);
    row?.scrollIntoView({block:'nearest', behavior:'smooth'});
  };
  store.subscribe((state, events) => {
    if (events.some(event => event.type === 'reset')) stop();
    else if (events.some(event => event.type === 'day-advanced')) start(state);
    else if (active && !eligible(active,state)) {
      active = null;
      $('inspirationNotice').hidden = true;
    }
  });
  return {stop, start};
}

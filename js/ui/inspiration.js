import { fetchInspirations, localInspirations, titleKey, isNotice, canAddInspiration, historicalCandidates } from '../services/inspiration.js';
import { BLIP_WORDS } from '../config/blip-words.js';
import { levelOf, petName } from '../domain/progression.js?v=daily-demo-1';
import { sprite } from './sprites.js';
import { $ } from './dom.js';

const SWIPE_DISTANCE = 80;
const GAP_AFTER_DECISION = 1500;
const KIND_LABELS = { inspiration: 'Task idea', pattern: 'Your routine', reminder: 'Today’s reminder', notice: 'Heads-up' };

/**
 * Each simulated day owns its request, timers and three notification slots.
 * A card stays until the player keeps it (swipe right / ✓) or skips it
 * (swipe left / ✕); later cards wait in line instead of replacing it.
 */
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
  let lastDecision = 0;
  let requestSettled = true;
  let leaving = false;
  const cacheKey = 'blip-inspiration-days-v2';
  const rejectedKey = 'blip-inspiration-rejected-v1';
  const read = (key, fallback) => {
    try { return JSON.parse(globalThis.localStorage?.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
  };
  const write = (key, value) => { try { globalThis.localStorage?.setItem(key, JSON.stringify(value)); } catch {} };
  let days = read(cacheKey, {});
  if (!days || typeof days !== 'object' || Array.isArray(days)) days = {};
  let rejected = new Set(Array.isArray(read(rejectedKey, [])) ? read(rejectedKey, []) : []);
  const save = () => write(cacheKey, days);
  const notice = $('inspirationNotice');

  function stop() {
    generation++;
    controller?.abort();
    timers.forEach(cancel);
    timers = [];
    active = null;
    pending = 0;
    polling = false;
    lastDecision = 0;
    leaving = false;
    resetCard();
    notice.hidden = true;
  }
  function eligible(task, state) {
    if (isNotice(task)) return true;
    if (task.kind !== 'reminder' && rejected.has(titleKey(task.title))) return false;
    const existing = state.tasks.find(item => titleKey(item.title) === titleKey(task.title));
    return task.kind === 'reminder'
      ? existing && !existing.done && (existing.scheduledDay ?? state.day) === state.day
      : !existing;
  }
  function draw(task, state) {
    const completed = state.tasks.filter(item => item.done).length;
    const mood = BLIP_WORDS.find(tier => completed >= tier.min && completed <= tier.max)?.mood ?? '';
    const addable = canAddInspiration(task);
    $('inspirationAvatar').innerHTML = sprite(levelOf(state.xp).form, 0, {}, state.color);
    $('inspirationFrom').textContent = mood ? `${petName(state)} · ${mood}` : petName(state);
    $('inspirationType').textContent = KIND_LABELS[task.kind] ?? KIND_LABELS.notice;
    $('inspirationMessage').textContent = task.message;
    $('inspirationAccept').textContent = addable ? '✓ Add task' : '✓ Got it';
    $('inspirationAccept').setAttribute('aria-label', addable ? `Add ${task.title} to today` : 'Got it');
    $('inspirationDismiss').textContent = addable ? '✕ Skip' : '✕ Dismiss';
    $('inspirationDismiss').setAttribute('aria-label', addable ? 'Skip this suggestion' : 'Dismiss');
    $('inspirationHint').textContent = addable ? '← skip · swipe · keep →' : '← dismiss · swipe · got it →';
  }
  /** Keep an undecided card on screen whenever showing it is allowed. */
  function sync() {
    if (!active) return;
    const visible = store.getState().day === day && canShow();
    if (visible && notice.hidden) draw(active, store.getState());
    notice.hidden = !visible;
  }
  function show() {
    const state = store.getState();
    const record = days[day];
    if (!record || record.count >= 3) return;
    if (state.day !== day || !canShow()) return false;
    const candidates = [...suggestions, ...localInspirations(state)];
    const historical = historicalCandidates(state).filter(task => !rejected.has(titleKey(task.title)));
    if (state.day >= 3 && record.count === 0 && historical.length) {
      const exact = suggestions.find(task => canAddInspiration(task) && historical.some(item=>item.title===task.title) && eligible(task,state));
      if (!exact && !requestSettled) return false;
      const fallback = historical[0];
      candidates.splice(0,candidates.length,exact ?? {...fallback,kind:'pattern',source:'local',
        message:`You had “${fallback.title}” on an earlier day. Doing it again today?`});
    }
    const hasTodayTasks = state.tasks.some(task => !task.done && (task.scheduledDay ?? state.day) <= state.day);
    if (!hasTodayTasks) candidates.sort((a,b) => Number(canAddInspiration(b)) - Number(canAddInspiration(a)));
    const next = candidates.find(task => !shown.has(titleKey(task.title)) && eligible(task,state));
    if (!next) return;
    active = next;
    shown.add(titleKey(active.title));
    record.count++;
    record.shown = [...shown];
    record.active = active;
    save();
    resetCard();
    draw(active, state);
    notice.hidden = false;
    return true;
  }
  function watch(token) {
    // Re-show a card hidden by a dialog, without spending another slot.
    if (token !== generation || !active) return;
    sync();
    timers.push(schedule(() => watch(token), 1000));
  }
  function start(state) {
    stop();
    const token = generation;
    day = state.day;
    const record = days[day] ??= {count:0, requested:false, suggestions:[], shown:[]};
    shown = new Set(record.shown || []);
    suggestions = Array.isArray(record.suggestions) ? record.suggestions : [];
    if (record.active && eligible(record.active, state)) {
      active = record.active;
      watch(token);
    }
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
      if (active || !canShow() || Date.now() - lastDecision < GAP_AFTER_DECISION) {
        polling = true;
        timers.push(schedule(pump,1000));
        return;
      }
      const result = show();
      if (result === false) {
        polling = true;
        timers.push(schedule(pump,1000));
        return;
      }
      pending--;
      if (result) watch(token);
      if (pending) {
        polling = true;
        timers.push(schedule(pump,1000));
      }
    }
    const due = () => { pending++; if (!polling) pump(); };
    timers.push(schedule(due,7000), schedule(due,14000), schedule(due,21000));
  }

  function resetCard() {
    notice.classList.remove('swiping', 'leave-keep', 'leave-skip');
    notice.style.transform = '';
    delete notice.dataset.dir;
  }
  /** Close the current card; the next queued card may follow shortly. */
  function finish(direction) {
    const record = days[day];
    if (record) { record.active = null; save(); }
    active = null;
    lastDecision = Date.now();
    leaving = true;
    notice.classList.remove('swiping');
    notice.style.transform = '';
    notice.classList.add(direction === 'keep' ? 'leave-keep' : 'leave-skip');
    setTimeout(() => {
      leaving = false;
      if (!active) notice.hidden = true;
      resetCard();
    }, 220);
  }
  function scrollToTask(title) {
    onOpen();
    const row = [...$('taskList').querySelectorAll('.task')].find(row =>
      row.querySelector('.t-title')?.textContent === title);
    row?.scrollIntoView({block:'nearest', behavior:'smooth'});
  }
  function keep() {
    const task = active;
    if (!task || leaving) return;
    const state = store.getState();
    if (state.day !== day || !eligible(task,state)) { finish('skip'); return; }
    finish('keep');
    if (canAddInspiration(task)) {
      store.addTasks([{...task, scheduledDay:state.day}]);
      notify('Added to today.');
      scrollToTask(task.title);
    } else if (task.kind === 'reminder') {
      scrollToTask(task.title);
    }
  }
  function skip() {
    const task = active;
    if (!task || leaving) return;
    // Remember skipped ideas so Blip stops suggesting them; reminders and notices are just closed.
    if (!isNotice(task) && (task.kind === 'inspiration' || task.kind === 'pattern')) {
      rejected.add(titleKey(task.title));
      write(rejectedKey, [...rejected]);
    }
    finish('skip');
  }

  $('inspirationAccept').onclick = keep;
  $('inspirationDismiss').onclick = skip;
  notice.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); keep(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); skip(); }
  });

  let drag = null;
  notice.addEventListener('pointerdown', event => {
    if (!active || leaving || event.button > 0 || event.target.closest('button')) return;
    drag = { id: event.pointerId, x: event.clientX, dx: 0 };
    notice.setPointerCapture(event.pointerId);
    notice.classList.add('swiping');
  });
  notice.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    drag.dx = event.clientX - drag.x;
    notice.style.transform = `translateX(${drag.dx}px) rotate(${drag.dx / 24}deg)`;
    notice.dataset.dir = drag.dx > 30 ? 'keep' : drag.dx < -30 ? 'skip' : '';
  });
  const release = event => {
    if (!drag || event.pointerId !== drag.id) return;
    const { dx } = drag;
    drag = null;
    if (dx > SWIPE_DISTANCE) keep();
    else if (dx < -SWIPE_DISTANCE) skip();
    else resetCard();
  };
  notice.addEventListener('pointerup', release);
  notice.addEventListener('pointercancel', release);

  store.subscribe((state, events) => {
    if (events.some(event => event.type === 'reset')) {
      stop();
      days = {};
      save();
      rejected = new Set();
      write(rejectedKey, []);
    }
    else if (events.some(event => event.type === 'day-advanced')) start(state);
    else if (active && !eligible(active,state)) {
      // The player handled it elsewhere, e.g. added or finished the task by hand.
      const record = days[day];
      if (record) { record.active = null; save(); }
      active = null;
      resetCard();
      notice.hidden = true;
    }
  });

  // Bring back a card that was still waiting when the page was closed.
  const current = store.getState();
  if (days[current.day]?.active) start(current);
  return {stop, start};
}

import { $ } from './dom.js';
import { isValidProgress } from '../services/storage.js?v=weekly-history-2';

/** The week grid selects read-only snapshots without changing live progress. */
export function initHistory(store, onSelect) {
  let selectedDay = store.getState().day;
  let selectionError = '';

  function getView(state) {
    if (selectedDay === state.day) return { displayed: state, reviewing: false };
    const snapshot = state.history?.find(day => day?.day === selectedDay);
    if (isValidProgress(snapshot)) return { displayed: snapshot, reviewing: true };
    selectionError = `Day ${selectedDay} has no readable snapshot. Showing the current day.`;
    selectedDay = state.day;
    return { displayed: state, reviewing: false };
  }

  function select(day) {
    const state = store.getState();
    const requested = Number(day);
    if (!Number.isInteger(requested) || requested < 1 || requested > state.day) return;
    selectionError = '';
    selectedDay = requested;
    getView(state);
    onSelect();
  }

  $('week').addEventListener('click', event => {
    const button = event.target.closest('button[data-day]');
    if (!button || button.disabled) return;
    select(button.dataset.day);
  });
  $('returnToday').addEventListener('click', () => select(store.getState().day));

  return {
    reset(state) { selectedDay = state.day; selectionError = ''; },
    getView,
    isReviewing() { return selectedDay !== store.getState().day; },
    render(state) {
      const { displayed, reviewing } = getView(state);
      $('reviewBanner').hidden = !reviewing && !selectionError;
      $('reviewLabel').textContent = `Day ${selectedDay} · ${reviewing ? 'Saved snapshot' : 'Current progress'}`;
      $('returnToday').hidden = !reviewing;
      const done = displayed.tasks.filter(task => task.done).length;
      $('reviewNotice').textContent = selectionError
        || `Read-only · ${done}/${displayed.tasks.length} tasks completed · ${displayed.xp} XP`;
      $('taskHeading').textContent = reviewing ? `Day ${selectedDay} tasks` : 'Today';
      $('taskHint').hidden = reviewing;
      $('nextDay').disabled = reviewing || state.day >= 7;
      $('nextDay').textContent = state.day >= 7 ? 'Final day reached' : 'Skip to tomorrow';
      $('micBtn').disabled = reviewing;
      return { displayed, reviewing };
    }
  };
}

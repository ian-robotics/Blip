import { BADGES } from './config/game.js?v=daily-demo-1';
import { createStorage } from './services/storage.js?v=weekly-history-2';
import { playSound, isSoundOn, setSoundOn } from './services/sound.js';
import { createStore } from './state/store.js?v=daily-demo-1';
import { $, esc } from './ui/dom.js';
import { render } from './ui/render.js?v=week-grid-1';
import { petName } from './domain/progression.js?v=daily-demo-1';
import { toast, levelUp } from './ui/feedback.js';
import { initNavigation, showView } from './ui/navigation.js';
import { initIntro } from './ui/intro.js';
import { initTalk } from './ui/talk.js';
import { initColorPicker } from './ui/color-picker.js';
import { initHistory } from './ui/history.js?v=week-grid-1';
import { initLogin } from './ui/login.js';

// Composition root: connect domain state to browser UI and bind page actions once.
const store = createStore(createStorage());
const timers = new Set();
function later(callback, delay) {
  const timer = setTimeout(() => { timers.delete(timer); callback(); }, delay);
  timers.add(timer);
}
function cancelFeedback() {
  timers.forEach(clearTimeout);
  timers.clear();
}

initNavigation();
const intro = initIntro(() => store.getState().color, () => petName(store.getState()));
const talk = initTalk(store);
const colorPicker = initColorPicker(store, () => intro.open());
const history = initHistory(store, () => {
  talk.close();
  cancelFeedback();
  $('lvlUp').hidden = true;
  $('toast').hidden = true;
  refresh(store.getState());
  showView('today');
  $('vToday').scrollTop = 0;
});
function refresh(state) {
  // Resolve and render the page before announcing the selected snapshot.
  // A failed page render must not leave a misleading historical title.
  const { displayed, reviewing } = history.getView(state);
  render(displayed, { readOnly: reviewing, currentState: state });
  history.render(state);
}
store.subscribe((state, events) => {
  if (events.some(event => event.type === 'day-advanced' || event.type === 'reset')) {
    history.reset(state);
    cancelFeedback();
    talk.close();
    $('lvlUp').hidden = true;
  }
  refresh(state);
  for (const event of events) {
    switch (event.type) {
      case 'badge': {
        const badge = BADGES.find(badge => badge.id === event.id);
        // A level-up fanfare follows right after, so let it play alone.
        const quiet = events.some(other => other.type === 'level-up');
        later(() => {
          toast(`<span class="pixel">BADGE</span> ${badge.name}: ${badge.desc}`);
          if (!quiet) playSound('badge');
        }, 400);
        break;
      }
      case 'task-completed': {
        playSound('complete');
        const row = $('taskList').querySelector(`[data-id="${event.id}"]`);
        if (row) {
          const label = document.createElement('span');
          label.className = 'floatxp';
          label.textContent = `+${event.xp} XP`;
          row.appendChild(label);
        }
        break;
      }
      case 'task-undone': {
        // Drop any pending level-up or badge popup from the completion being undone.
        cancelFeedback();
        $('lvlUp').hidden = true;
        playSound('remove');
        const row = $('taskList').querySelector(`[data-id="${event.id}"]`);
        if (row) {
          const label = document.createElement('span');
          label.className = 'floatxp';
          label.textContent = `-${event.xp} XP`;
          row.appendChild(label);
        }
        break;
      }
      case 'level-up':
        later(() => {
          levelUp(event.from, event.to, state.color, petName(state));
          playSound('levelUp');
        }, 650);
        break;
      case 'day-advanced':
        playSound('newDay');
        showView('today');
        toast(event.did ? `New day. Streak is now ${event.streak} days.`
          : `New day. You missed yesterday, so the streak reset. ${esc(petName(state))} kept its level.`);
        break;
      case 'reset':
        cancelFeedback();
        talk.close();
        showView('today');
        $('lvlUp').hidden = true;
        $('intro').hidden = true;
        colorPicker.open();
        toast('Demo reset to the starting state.');
        break;
    }
  }
});

$('taskList').addEventListener('click', event => {
  if (history.isReviewing()) return;
  const button = event.target.closest('button[data-act]');
  const row = button?.closest('.task');
  if (!row) return;
  const id = Number(row.dataset.id);
  if (button.dataset.act === 'del') {
    store.deleteTask(id);
    playSound('remove');
  }
  if (button.dataset.act === 'done') {
    if (row.classList.contains('done')) store.uncompleteTask(id);
    else store.completeTask(id);
  }
});
$('renameBtn').onclick = () => {
  $('renameInput').value = store.getState().name ?? '';
  $('renameForm').hidden = false;
  $('renameBtn').hidden = true;
  $('renameInput').focus();
};
$('renameForm').addEventListener('submit', event => {
  event.preventDefault();
  $('renameForm').hidden = true;
  store.renamePet($('renameInput').value);
  playSound('tap');
});
$('lvlOk').onclick = () => { $('lvlUp').hidden = true; };
$('nextDay').onclick = () => {
  if (!history.isReviewing()) store.advanceDay();
};
$('reset').onclick = () => store.reset();
function drawSoundToggle() {
  $('soundToggle').textContent = isSoundOn() ? 'Sound: on' : 'Sound: off';
  $('soundToggle').setAttribute('aria-pressed', String(isSoundOn()));
}
$('soundToggle').onclick = () => {
  setSoundOn(!isSoundOn());
  drawSoundToggle();
  playSound('tap');
};
drawSoundToggle();
const now = new Date();
$('clock').textContent = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
refresh(store.getState());

initLogin(() => {
  if (store.getState().color === null) colorPicker.open();
});

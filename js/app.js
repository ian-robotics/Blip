import { fullnessOf, DAILY_FULLNESS_GOAL } from './domain/fullness.js';
import { BADGES } from './config/game.js?v=daily-demo-1';
import { createStorage } from './services/storage.js?v=weekly-history-2';
import { playSound, isSoundOn, setSoundOn } from './services/sound.js';
import { createStore } from './state/store.js?v=daily-demo-1';
import { $ } from './ui/dom.js';
import { render } from './ui/render.js?v=week-grid-1';
import { petName } from './domain/progression.js?v=daily-demo-1';
import { initNavigation, showView } from './ui/navigation.js';
import { initIntro } from './ui/intro.js';
import { initTalk } from './ui/talk.js';
import { initColorPicker } from './ui/color-picker.js';
import { initHistory } from './ui/history.js?v=week-grid-1';
import { initLogin } from './ui/login.js';
import { toast, levelUp, showDayPenalty, showLevelDown } from './ui/feedback.js';

// Composition root: connect domain state to browser UI and bind page actions once.
const store = createStore(createStorage());
const timers = new Set();
const celebratedFullnessDays = new Set();
if (fullnessOf(store.getState()).count >= DAILY_FULLNESS_GOAL) {
  celebratedFullnessDays.add(store.getState().day);
}
function later(callback, delay) {
  const timer = setTimeout(() => { timers.delete(timer); callback(); }, delay);
  timers.add(timer);
}
function cancelFeedback() {
  $('levelDown').hidden = true;
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
  $('dayPenalty').hidden = true;
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
    $('dayPenalty').hidden = true;
    $('toast').hidden = true;
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
        if (event.foodEarned) toast('🍗 +1 drumstick! Visit Blip and tap Feed.');
        const row = $('taskList').querySelector(`[data-id="${event.id}"]`);
        if (row) {
          const label = document.createElement('span');
          label.className = 'floatxp';
          label.textContent = `+${event.xp} XP`;
          row.appendChild(label);
        }
        break;
      }
      case 'pet-fed': {
        const energy = $('bigPet').querySelector('.energy-pet');
        energy?.classList.add('energy-fed');
        const hud = $('hudPet').querySelector('.energy-pet');
        hud?.classList.add('energy-fed');
        if (fullnessOf(state).count >= DAILY_FULLNESS_GOAL && !celebratedFullnessDays.has(state.day)) {
          celebratedFullnessDays.add(state.day);
          energy?.classList.add('energy-goal');
          hud?.classList.add('energy-goal');
        }
        playSound('add');
        break;
      }
      case 'task-undone': {
        // Drop any pending level-up or badge popup from the completion being undone.
        cancelFeedback();
        $('lvlUp').hidden = true;
        if (event.to.lv < event.from.lv) {
          showLevelDown(event, state.color, petName(state));
          playSound('levelDown');
        } else {
          playSound('remove');
        }
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

        showView('today');
        if (event.penalty.missedDays > 0) {
          showDayPenalty(event, state.color, petName(state));
          playSound(event.currentLevel.lv < event.previousLevel.lv ? 'levelDown' : 'penalty');
        } else {
          playSound('newDay');
          toast(`New day. Streak is now ${event.streak} days.`);
        }
        break;
      case 'reset':
        celebratedFullnessDays.clear();
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
  if (button.dataset.act === 'xp') {
    const task = store.getState().tasks.find(task => task.id === id);
    if (task?.done) { toast('Undo completion before changing this debug reward.'); return; }
    const input = window.prompt('Debug task XP (whole number, 0–100000):', String(task?.xp ?? 20));
    if (input === null) return;
    if (!input.trim() || !store.setDebugXp(id, Number(input))) toast('Enter a whole number from 0 to 100000.');
    return;
  }
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
$('levelDownOk').onclick = () => {
  $('levelDown').hidden = true;
  const row = $('taskList').querySelector('.task:not(.done) .chk');
  (row || $('reset')).focus();
};
$('levelDown').addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    event.preventDefault();
    $('levelDownOk').click();
  } else if (event.key === 'Tab') {
    event.preventDefault();
    $('levelDownOk').focus();
  }
});
$('penaltyOk').onclick = () => {
  $('dayPenalty').hidden = true;
  // The last day's Skip control is disabled, so focus the live view instead.
  if (!$('nextDay').disabled) $('nextDay').focus();
  else $('reset').focus();
};
$('dayPenalty').addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    event.preventDefault();
    $('penaltyOk').click();
  } else if (event.key === 'Tab') {
    event.preventDefault();
    $('penaltyOk').focus();
  }
});
$('nextDay').onclick = () => {
  if (history.isReviewing() || !$('levelDown').hidden || !$('dayPenalty').hidden || !$('login').hidden) return;
  store.advanceDay();
};
$('feedPet').onclick = () => {
  if (!history.isReviewing() && $('login').hidden) store.feedPet();
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

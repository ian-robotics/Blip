import { fullnessOf, DAILY_FULLNESS_GOAL } from './domain/fullness.js';
import { BADGES, STORAGE_KEY } from './config/game.js?v=daily-demo-1';
import { scopedKey } from './services/account.js';
import { createStorage } from './services/storage.js?v=weekly-history-2';
import { playSound, isSoundOn, setSoundOn } from './services/sound.js';
import { alertPermission, requestAlerts } from './services/alerts.js';
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
import { initInspiration } from './ui/inspiration.js';
import { toast, levelUp, showDayPenalty, showLevelDown } from './ui/feedback.js';

// Composition root: connect domain state to browser UI and bind page actions once.
// Guests share the original save; each Google account gets its own save in this browser.
const store = createStore(createStorage(undefined, scopedKey(STORAGE_KEY)));
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

const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
/** Blip hops on the Today header when a task is finished. */
function hopPet() {
  const pet = $('hudPet');
  pet.classList.remove('hop');
  void pet.offsetWidth; // restart the animation on quick repeats
  pet.classList.add('hop');
  later(() => pet.classList.remove('hop'), 700);
}
/** "+XP" flies from the finished task into the XP bar, which then pulses. */
function flyXp(row, xp) {
  const screen = $('screen');
  const bar = $('hudBar').parentElement;
  const from = row.querySelector('.xpv') ?? row;
  const s = screen.getBoundingClientRect(), a = from.getBoundingClientRect(), b = bar.getBoundingClientRect();
  const visible = b.bottom > s.top && b.top < s.bottom;
  if (reducedMotion() || !visible || !document.body.animate) {
    const label = document.createElement('span');
    label.className = 'floatxp';
    label.textContent = `+${xp} XP`;
    row.appendChild(label);
    return;
  }
  const label = document.createElement('span');
  label.className = 'flyxp';
  label.textContent = `+${xp} XP`;
  label.setAttribute('aria-hidden', 'true');
  screen.appendChild(label);
  const x0 = a.left - s.left + a.width / 2, y0 = a.top - s.top + a.height / 2;
  const x1 = b.left - s.left + b.width / 2, y1 = b.top - s.top + b.height / 2;
  const at = (x, y, scale, opacity) => ({ transform: `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`, opacity });
  label.animate([
    at(x0, y0, 1, 0),
    { ...at(x0, y0 - 24, 1.25, 1), offset: .25 },
    { ...at(x1, y1, .8, 1), offset: .9 },
    at(x1, y1, .5, 0)
  ], { duration: 900, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'forwards' });
  // Clean up on a timer too: a throttled background tab may never finish the animation.
  setTimeout(() => {
    label.remove();
    bar.classList.remove('bar-pulse');
    void bar.offsetWidth;
    bar.classList.add('bar-pulse');
  }, 950);
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
        if (row) flyXp(row, event.xp);
        hopPet();
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
          toast(`New day. Streak is now ${event.streak} ${event.streak === 1 ? 'day' : 'days'}.`);
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
// Like Skip, Reset only works once someone has entered the app.
$('reset').onclick = () => { if ($('login').hidden) store.reset(); };
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
function drawAlertsToggle() {
  const permission = alertPermission();
  $('alertsToggle').hidden = permission === 'unsupported';
  $('alertsToggle').textContent = permission === 'granted' ? 'Alerts: on'
    : permission === 'denied' ? 'Alerts: blocked' : 'Alerts: off';
  $('alertsToggle').setAttribute('aria-pressed', String(permission === 'granted'));
}
$('alertsToggle').onclick = async () => {
  const permission = alertPermission();
  if (permission === 'default') {
    await requestAlerts();
    drawAlertsToggle();
    if (alertPermission() === 'granted') toast('Blip will alert you when a card arrives while this tab is in the background.');
  } else if (permission === 'granted') {
    toast('To turn alerts off, change notifications for this site in your browser settings.');
  } else {
    toast('Alerts are blocked. Allow notifications for this site in your browser settings.');
  }
};
drawAlertsToggle();
const now = new Date();
$('clock').textContent = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
refresh(store.getState());

initInspiration(store, {
  // Cards also appear in a background tab, where they trigger a system notification.
  canShow: () => !history.isReviewing() &&
    ['login','intro','colorPicker','lvlUp','levelDown','dayPenalty','talkSheet'].every(id => $(id).hidden),
  onAlertsChange: drawAlertsToggle,
  onOpen: () => showView('today'),
  notify: toast
});

initLogin(() => {
  if (store.getState().color === null) colorPicker.open();
});

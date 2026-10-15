import { BADGES } from './config/game.js';
import { createStorage } from './services/storage.js';
import { createStore } from './state/store.js';
import { $ } from './ui/dom.js';
import { sprite } from './ui/sprites.js';
import { render } from './ui/render.js';
import { toast, levelUp } from './ui/feedback.js';
import { initNavigation, showView } from './ui/navigation.js';
import { initIntro } from './ui/intro.js';
import { initTalk } from './ui/talk.js';

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
initIntro();
const talk = initTalk(store);
store.subscribe((state, events) => {
  render(state);
  for (const event of events) {
    switch (event.type) {
      case 'badge': {
        const badge = BADGES.find(badge => badge.id === event.id);
        later(() => toast(`<span class="pixel">BADGE</span> ${badge.name}: ${badge.desc}`), 400);
        break;
      }
      case 'task-completed': {
        const row = $('taskList').querySelector(`[data-id="${event.id}"]`);
        if (row) {
          const label = document.createElement('span');
          label.className = 'floatxp';
          label.textContent = `+${event.xp} XP`;
          row.appendChild(label);
        }
        break;
      }
      case 'level-up':
        later(() => levelUp(event.from, event.to), 650);
        break;
      case 'day-advanced':
        showView('today');
        toast(event.did ? `New day. Streak is now ${event.streak} days.`
          : 'New day. You missed yesterday, so the streak reset. Blip kept its level.');
        break;
      case 'reset':
        cancelFeedback();
        talk.close();
        showView('today');
        $('lvlUp').hidden = true;
        $('intro').hidden = true;
        toast('Demo reset to the starting state.');
        break;
    }
  }
});

$('taskList').addEventListener('click', event => {
  const button = event.target.closest('button[data-act]');
  const row = button?.closest('.task');
  if (!row) return;
  const id = Number(row.dataset.id);
  if (button.dataset.act === 'del') store.deleteTask(id);
  if (button.dataset.act === 'done') store.completeTask(id);
});
$('lvlOk').onclick = () => { $('lvlUp').hidden = true; };
$('nextDay').onclick = () => store.advanceDay();
$('reset').onclick = () => store.reset();
$('logoSprite').innerHTML = sprite('baby', 5);
const now = new Date();
$('clock').textContent = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
render(store.getState());

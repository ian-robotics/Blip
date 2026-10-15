import { XP } from '../config/game.js';
import { parse } from '../domain/parser.js';
import { createSpeechService } from '../services/speech.js';
import { $, esc } from './dom.js';
import { showView } from './navigation.js';

/** Owns draft tasks and demo timers; commits confirmed tasks through the store. */
export function initTalk(store) {
  const speech = createSpeechService();
  let pending = [];
  let typer = null;
  let parseTimer = null;

  function clearTimers() {
    clearInterval(typer);
    clearTimeout(parseTimer);
  }

  function close() {
    clearTimers();
    speech.cancel();
    $('talkDone').hidden = true;
    $('talkSheet').hidden = true;
  }

  function drawPending() {
    $('parsedWrap').hidden = !pending.length;
    $('addAll').hidden = !pending.length;
    $('addAll').textContent = `Add ${pending.length} task${pending.length > 1 ? 's' : ''}`;
    $('parsed').innerHTML = pending.map((task, index) => `
      <li>
        <div class="t-body">
          <div class="t-title">${esc(task.title)}</div>
          <div class="chips">
            <button type="button" class="chip cycle ${task.prio}" data-i="${index}" data-act="prio">${task.prio}</button>
            ${task.time ? `<span class="chip">${esc(task.time)}</span>` : ''}
          </div>
        </div>
        <span class="xpv">+${XP[task.prio]}</span>
        <button type="button" class="del" data-i="${index}" data-act="rm" aria-label="Remove">×</button>
      </li>`).join('');
  }

  function showParsed(text) {
    clearTimers();
    speech.cancel();
    $('talkDone').hidden = true;
    $('transcript').textContent = `“${text}”`;
    $('wave').classList.add('off');
    pending = parse(text);
    $('talkTitle').textContent = pending.length
      ? `Blip heard ${pending.length} task${pending.length > 1 ? 's' : ''}`
      : "Blip didn't catch a task";
    drawPending();
  }

  function simulate(note) {
    clearTimers();
    $('talkDone').hidden = true;
    $('modeNote').textContent = note || 'Demo mode: playing a sample sentence. Real voice works when the page runs from localhost or https.';
    const phrase = store.nextSample();
    let index = 0;
    typer = setInterval(() => {
      index += 2;
      $('transcript').innerHTML = esc(phrase.slice(0, index)) + '<span class="caret"></span>';
      if (index >= phrase.length) {
        clearInterval(typer);
        parseTimer = setTimeout(() => showParsed(phrase), 350);
      }
    }, 38);
  }

  function startLive() {
    $('modeNote').textContent = 'Live voice: speak now, then tap Done.';
    $('talkDone').hidden = false;
    const started = speech.start({
      onTranscript(text) {
        $('transcript').innerHTML = esc(text) + '<span class="caret"></span>';
      },
      onEnd({ text, failed }) {
        $('talkDone').hidden = true;
        if ($('talkSheet').hidden) return;
        if (text) {
          $('typeInput').value = text;
          showParsed(text);
        } else if (failed) {
          simulate("The microphone isn't available on this page, so Blip is playing a sample sentence.");
        } else {
          $('talkTitle').textContent = "Blip didn't hear anything";
          $('wave').classList.add('off');
          $('transcript').textContent = '';
          $('modeNote').textContent = 'Tap the red button to try again, or type below.';
        }
      }
    });
    if (!started) simulate();
  }

  function open() {
    close();
    pending = [];
    $('talkSheet').hidden = false;
    $('parsedWrap').hidden = true;
    $('addAll').hidden = true;
    $('talkTitle').textContent = 'Listening…';
    $('wave').classList.remove('off');
    $('transcript').innerHTML = '<span class="caret"></span>';
    if (speech.available) startLive();
    else simulate();
  }

  $('parsed').addEventListener('click', event => {
    const button = event.target.closest('button[data-i]');
    if (!button) return;
    const index = Number(button.dataset.i);
    if (!pending[index]) return;
    if (button.dataset.act === 'rm') pending.splice(index, 1);
    else {
      const priorities = ['low', 'normal', 'high'];
      pending[index].prio = priorities[(priorities.indexOf(pending[index].prio) + 1) % 3];
    }
    if (!pending.length) $('talkTitle').textContent = 'Nothing to add';
    drawPending();
  });
  $('typeForm').addEventListener('submit', event => {
    event.preventDefault();
    const text = $('typeInput').value.trim();
    if (!text) return;
    $('typeInput').value = '';
    showParsed(text);
  });
  $('addAll').onclick = () => { store.addTasks(pending); pending = []; close(); };
  $('talkDone').onclick = () => speech.stop();
  $('talkClose').onclick = close;
  $('talkSheet').addEventListener('click', event => {
    if (event.target.id === 'talkSheet') close();
  });
  $('micBtn').onclick = () => { showView('today'); open(); };
  return { close };
}

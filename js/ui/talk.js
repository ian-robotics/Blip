import { XP } from '../config/game.js?v=daily-demo-1';
import { parseTasks, summarize } from '../services/task-parser.js';
import { createSpeechService } from '../services/speech.js';
import { playSound } from '../services/sound.js';
import { $, esc } from './dom.js';
import { showView } from './navigation.js';
import { petName } from '../domain/progression.js?v=daily-demo-1';

const PRIORITIES = ['low', 'normal', 'high'];

/** Owns draft tasks and demo timers; commits confirmed tasks through the store. */
export function initTalk(store) {
  const speech = createSpeechService();
  let pending = [];
  let parseRequest = null;
  let parseVersion = 0;
  let typer = null;
  let parseTimer = null;

  function clearTimers() {
    clearInterval(typer);
    clearTimeout(parseTimer);
  }

  function cancelParse() {
    parseVersion++;
    parseRequest?.abort();
    parseRequest = null;
    $('typeForm').querySelector('button').disabled = false;
  }

  function close() {
    cancelParse();
    clearTimers();
    speech.cancel();
    $('talkDone').hidden = true;
    $('talkSheet').hidden = true;
  }

  function drawPending() {
    $('parsedWrap').hidden = !pending.length;
    $('addAll').hidden = !pending.length;
    $('taskSummary').textContent = summarize(pending);
    $('taskSummary').hidden = false;
    $('addAll').textContent = `Confirm & add ${pending.length} task${pending.length > 1 ? 's' : ''}`;
    $('parsed').innerHTML = pending.map((task, index) => `
      <li>
        <div class="t-body draft-fields">
          <div class="t-title">${esc(task.title)}</div>
          <div class="chips"><button type="button" class="chip cycle ${task.prio}" data-i="${index}" data-act="prio" aria-label="Priority ${task.prio}. Tap to change.">${task.prio} ▾</button><span class="chip">${task.xp} XP</span></div>
          <p class="hint">Deadline: ${esc(task.time || 'None specified')}</p>
          <p class="hint">${esc(task.reason || 'Priority and XP assigned by AI.')}${task.needsConfirmation ? ' · Check ambiguous details in your description.' : ''}</p>
        </div>
        <span class="xpv">+${task.xp}</span>
        <button type="button" class="del" data-i="${index}" data-act="rm" aria-label="Remove">×</button>
      </li>`).join('');
  }

  async function showParsed(text) {
    cancelParse();
    const version = parseVersion;
    const controller = new AbortController();
    parseRequest = controller;
    clearTimers();
    speech.cancel();
    pending = [];
    $('parsedWrap').hidden = true;
    $('addAll').hidden = true;
    $('taskSummary').hidden = true;
    $('talkDone').hidden = true;
    $('wave').hidden = true;
    $('transcript').hidden = true;
    $('transcript').textContent = '';
    $('typeForm').hidden = false;
    $('typeInput').value = text;
    $('typeForm').querySelector('button').disabled = true;
    $('talkTitle').textContent = 'Parsing tasks…';
    $('modeNote').textContent = 'Preparing suggestions. You will confirm before anything is saved.';
    try {
      const result = await parseTasks(text, { signal: controller.signal });
      if (version !== parseVersion || $('talkSheet').hidden) return;
      pending = result.tasks;
      $('talkTitle').textContent = pending.length ? 'Confirm task details' : 'No tasks found';
      $('modeNote').textContent = result.source === 'local'
        ? 'AI could not produce tasks. Local suggestions are shown instead. Check the details and tap a priority to change it. Revise your input and choose Review to retry AI.'
        : 'Groq suggests priority and XP. Tap a priority to change it. To change other details, revise your description and choose Review again.';
      drawPending();
    } catch (error) {
      if (version !== parseVersion || controller.signal.aborted || $('talkSheet').hidden) return;
      pending = [];
      $('parsedWrap').hidden = true;
      $('addAll').hidden = true;
      $('talkTitle').textContent = 'Could not process tasks';
      const messages = {
        origin_rejected: 'This website is not allowed by the AI backend. Check ALLOWED_ORIGINS on Render.',
        backend_not_configured: 'The hosted AI backend URL has not been configured.',
        not_configured: 'The AI service is not configured.',
        key_invalid: 'The AI credentials need updating.',
        key_expired: 'The AI credentials have expired.',
        rate_limited: 'The AI service is busy. Please try again shortly.'
      };
      $('modeNote').textContent = (messages[error.message] || 'The AI service is unavailable.')
        + ' Your input is preserved. Choose Review to retry; no tasks were added.';
    } finally {
      if (version === parseVersion) {
        parseRequest = null;
        $('typeForm').querySelector('button').disabled = false;
      }
    }
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
            $('textMode').click();
            $('modeNote').textContent = 'The microphone is unavailable. Please type your tasks.';
        } else {
          $('talkTitle').textContent = `${petName(store.getState())} didn't hear anything`;
          $('wave').classList.add('off');

          $('wave').hidden = true;
          $('transcript').hidden = false;
          $('typeForm').hidden = false;
          $('typeInput').value = text;


          $('transcript').textContent = '';
          $('modeNote').textContent = 'Tap the red button to try again, or type below.';
        }
      }
    });
    if (!started) {
      $('textMode').click();
      $('modeNote').textContent = 'Voice input could not start. Please type your tasks.';
    }
  }
function open() {
  close();
  pending = [];
  // 选择输入方式
  $('talkSheet').hidden = false;
  $('inputChoices').hidden = false;
  $('taskSummary').hidden = true;
  // 初始状态就不显示录音功能
  $('wave').hidden = true;
  $('transcript').hidden = true;
  $('typeForm').hidden = true;
  $('talkDone').hidden = true;
  $('parsedWrap').hidden = true;
  $('addAll').hidden = true;
  // 清除上次输入
  $('typeInput').value = '';
  $('transcript').textContent = '';
  $('parsed').innerHTML = '';
  // 提示
  $('talkTitle').textContent = 'Add tasks';
  $('modeNote').textContent =
    'Choose voice or text input. Review task details before adding.';

  $('voiceMode').focus();
}
  $('parsed').addEventListener('click', event => {
    const button = event.target.closest('button[data-i]');
    if (!button) return;
    const index = Number(button.dataset.i);
    if (!pending[index]) return;
    if (button.dataset.act === 'prio') {
      const task = pending[index];
      task.prio = PRIORITIES[(PRIORITIES.indexOf(task.prio) + 1) % PRIORITIES.length];
      task.xp = XP[task.prio];
      task.reason = 'Priority set by you.';
      task.needsConfirmation = false;
      drawPending();
      playSound('tap');
      $('parsed').querySelector(`button[data-i="${index}"][data-act="prio"]`).focus();
      return;
    }
    if (button.dataset.act !== 'rm') return;
    pending.splice(index, 1);
    if (!pending.length) $('talkTitle').textContent = 'Nothing to add';
    drawPending();
  });
  $('typeInput').addEventListener('input', () => {
    cancelParse();
    pending = [];
    $('parsedWrap').hidden = true;
    $('taskSummary').hidden = true;
    $('addAll').hidden = true;
  });
  $('typeForm').addEventListener('submit', event => {
    event.preventDefault();
    const text = $('typeInput').value.trim();
    if (!text) return;
    $('typeInput').value = '';
    showParsed(text);
  });
  $('addAll').onclick = () => {
    if (!pending.length || parseRequest) return;
    store.addTasks(pending.map(task => ({ title: task.title, time: task.time, prio: task.prio, xp: task.xp })));
    playSound('add');
    pending = [];
    close();
  };

  // 10.25修改
  $('textMode').onclick = () => {
    cancelParse();
    speech.cancel();
    clearTimers();

  // 文字输入事件
  $('wave').hidden = true;
  $('transcript').hidden = true;
  $('talkDone').hidden = true;
  $('typeForm').hidden = false;

  $('talkTitle').textContent = 'Type your tasks';
  $('modeNote').textContent =
    'Describe your tasks, then choose Review. Groq suggests priority and XP.';

  $('typeInput').focus();
};

  $('voiceMode').onclick = () => {
    cancelParse();
    // 语音输入事件
    speech.cancel();
    clearTimers();

    if (!speech.available) {
      $('textMode').click();
      $('modeNote').textContent = "The microphone isn't available on this page, so Blip is using text input.";
      return;
    }

    // 切换到语音输入界面。
  $('wave').hidden = false;
  $('wave').classList.remove('off');
  $('transcript').hidden = false;
  $('transcript').textContent = '';
  $('typeForm').hidden = true;
  $('talkTitle').textContent = 'Listening…';

  pending = [];
  $('parsedWrap').hidden = true;
  $('taskSummary').hidden = true;
  $('addAll').hidden = true;
  startLive();
};

  $('talkDone').onclick = () => speech.stop();
  $('talkClose').onclick = close;
  $('talkSheet').addEventListener('click', event => {
    if (event.target.id === 'talkSheet') close();
  });
  $('micBtn').onclick = () => { showView('today'); open(); };
  return { close };
}

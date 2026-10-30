const STORAGE_KEY = 'blip-sound-on';
const MASTER_VOLUME = 0.12;

// Each note is [frequency in Hz, start offset in seconds, duration in seconds].
const SOUNDS = {
  tap: { wave: 'square', notes: [[880, 0, 0.05]] },
  add: { wave: 'triangle', notes: [[784, 0, 0.08], [1047, 0.07, 0.14]] },
  remove: { wave: 'triangle', notes: [[392, 0, 0.07], [262, 0.06, 0.12]] },
  complete: { wave: 'square', notes: [[880, 0, 0.07], [1319, 0.07, 0.2]] },
  badge: { wave: 'triangle', notes: [[1319, 0, 0.09], [1568, 0.09, 0.09], [1976, 0.18, 0.28]] },
  levelUp: { wave: 'square', notes: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1], [1047, 0.3, 0.45]] },
  newDay: { wave: 'triangle', notes: [[587, 0, 0.14], [880, 0.13, 0.26]] }
};

let context = null;
let enabled = readEnabled();

function readEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

function getContext() {
  const AudioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!AudioContextClass) return null;
  context ??= new AudioContextClass();
  // Browsers start audio suspended until a click, so resume on every play.
  if (context.state === 'suspended') context.resume();
  return context;
}

function playNote(audio, wave, [frequency, offset, duration]) {
  const start = audio.currentTime + offset;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = wave;
  oscillator.frequency.value = frequency;
  // Short fade in and out to avoid clicks at the note edges.
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(MASTER_VOLUME, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

/** Sound is decoration: a failure here must never interrupt the app. */
export function playSound(name) {
  if (!enabled) return;
  try {
    const audio = getContext();
    const sound = SOUNDS[name];
    if (!audio || !sound) return;
    for (const note of sound.notes) playNote(audio, sound.wave, note);
  } catch {
    // Ignore unsupported or blocked audio.
  }
}

export function isSoundOn() {
  return enabled;
}

export function setSoundOn(value) {
  enabled = value;
  try {
    localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off');
  } catch {
    // The choice still applies until the page is closed.
  }
}

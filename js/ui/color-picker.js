import { BLIP_COLORS } from '../config/art.js';
import { playSound } from '../services/sound.js';
import { $ } from './dom.js';
import { sprite } from './sprites.js';

const COLOR_LABELS = {
  blue: 'Blue',
  pink: 'Pink',
  white: 'White',
  yellow: 'Yellow'
};

export function initColorPicker(store, onConfirmed) {
  const panel = $('colorPicker');
  const options = $('colorOptions');
  const confirm = $('colorConfirm');
  const nameInput = $('petNameInput');

  let selected = null;

  function draw() {
    options.innerHTML = BLIP_COLORS.map(color => `
      <button
        class="color-option"
        type="button"
        data-color="${color}"
        aria-pressed="${selected === color}"
      >
        ${sprite('pod', 1, {}, color)}
        <span>${COLOR_LABELS[color]}</span>
      </button>
    `).join('');

    confirm.disabled = selected === null;
  }

  function open() {
    const state = store.getState();
    selected = state.color;
    nameInput.value = state.name ?? '';
    draw();
    panel.hidden = false;

    const firstButton = options.querySelector('button');
    firstButton.focus();
  }

  options.addEventListener('click', event => {
    const button = event.target.closest('button[data-color]');
    if (!button) return;

    selected = button.dataset.color;
    playSound('tap');

    // Update existing buttons to preserve keyboard focus.
    for (const option of options.querySelectorAll('button')) {
      option.setAttribute(
        'aria-pressed',
        String(option.dataset.color === selected)
      );
    }

    confirm.disabled = false;
  });

  confirm.addEventListener('click', () => {
    if (!store.chooseColor(selected)) return;
    store.renamePet(nameInput.value);

    playSound('add');
    panel.hidden = true;
    onConfirmed();
  });

  nameInput.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    confirm.click();
  });

  // Keep Tab focus inside the mandatory selection dialog.
  panel.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;

    const buttons = [...panel.querySelectorAll('button:not(:disabled), input')];
    const first = buttons[0];
    const last = buttons[buttons.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  return { open };
}
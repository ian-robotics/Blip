import { $, esc } from './dom.js';
import { toast } from './feedback.js';
import { GOOGLE_CLIENT_ID } from '../config/auth.js';
import { readAccount, writeAccount, accountFromCredential } from '../services/account.js';

const GUEST_KEY = 'blip-mock-user';
const WELCOME_KEY = 'blip-welcome-pending';

function readGuest() {
  try { return localStorage.getItem(GUEST_KEY); } catch { return null; }
}
function writeGuest(name) {
  try {
    if (name === null) localStorage.removeItem(GUEST_KEY);
    else localStorage.setItem(GUEST_KEY, name);
  } catch { /* The session still works until the page is closed. */ }
}

/**
 * Sign in with Google (Google Identity Services) or continue as a guest.
 * Each Google account loads its own save, so signing in or out reloads the page.
 */
export function initLogin(onEnter, { reload = () => location.reload() } = {}) {
  const panel = $('login');
  let initialized = false;
  let waiting = false;

  function label(name) {
    $('logout').textContent = `Log out (${name})`;
  }
  function onCredential(response) {
    try {
      const account = accountFromCredential(response.credential);
      writeAccount(account);
      writeGuest(null);
      try { sessionStorage.setItem(WELCOME_KEY, '1'); } catch {}
      reload();
    } catch {
      $('googleStatus').textContent = 'Google sign-in did not work. Please try again, or continue as a guest.';
    }
  }
  function renderGoogle() {
    const gis = globalThis.google?.accounts?.id;
    if (!gis) {
      if (waiting) return;
      waiting = true;
      let tries = 0;
      const timer = setInterval(() => {
        if (globalThis.google?.accounts?.id || ++tries > 40) {
          clearInterval(timer);
          waiting = false;
          if (globalThis.google?.accounts?.id) renderGoogle();
          else $('googleStatus').textContent = 'Google sign-in is unavailable right now. You can continue as a guest.';
        }
      }, 250);
      return;
    }
    if (!initialized) {
      gis.initialize({ client_id: GOOGLE_CLIENT_ID, callback: onCredential, auto_select: false, ux_mode: 'popup' });
      initialized = true;
    }
    $('googleSignIn').innerHTML = '';
    const width = Math.max(200, Math.min(300, $('googleSignIn').clientWidth || 260));
    gis.renderButton($('googleSignIn'), { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', width, locale: 'en' });
  }
  function enterGuest() {
    writeGuest('Guest');
    panel.hidden = true;
    label('Guest');
    toast('Welcome, Guest.');
    onEnter();
  }
  function open() {
    $('dayPenalty').hidden = true;
    $('levelDown').hidden = true;
    writeGuest(null);
    $('googleStatus').textContent = '';
    panel.hidden = false;
    renderGoogle();
    $('loginGuest').focus();
  }

  $('loginGuest').onclick = enterGuest;
  $('logout').onclick = () => {
    if (readAccount()) {
      // Switch back to the guest save.
      writeAccount(null);
      try { globalThis.google?.accounts?.id?.disableAutoSelect(); } catch {}
      reload();
      return;
    }
    open();
  };

  const account = readAccount();
  if (account) {
    label(account.name);
    let welcome = false;
    try { welcome = sessionStorage.getItem(WELCOME_KEY) === '1'; sessionStorage.removeItem(WELCOME_KEY); } catch {}
    if (welcome) toast(`Welcome, ${esc(account.name)}.`);
    onEnter();
  } else if (readGuest()) {
    label(readGuest());
    onEnter();
  } else {
    open();
  }
}

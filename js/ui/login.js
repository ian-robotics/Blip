import { $, esc } from './dom.js';
import { toast } from './feedback.js';

const USER_KEY = 'blip-mock-user';

function readUser() {
  try {
    return localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
}

function writeUser(user) {
  try {
    if (user === null) localStorage.removeItem(USER_KEY);
    else localStorage.setItem(USER_KEY, user);
  } catch {
    // The session still works until the page is closed.
  }
}

/** Mock login for playtests: any input works, and nothing leaves the browser. */
export function initLogin(onEnter) {
  const panel = $('login');

  function enter(user) {
    // Only the display name is kept. The password is never stored or sent.
    writeUser(user);
    $('loginPassword').value = '';
    panel.hidden = true;
    $('logout').textContent = `Log out (${user})`;
    toast(`Welcome, ${esc(user)}.`);
    onEnter();
  }
  function open() {
    writeUser(null);
    $('loginForm').reset();
    panel.hidden = false;
    $('loginName').focus();
  }

  $('loginForm').addEventListener('submit', event => {
    event.preventDefault();
    const user = $('loginName').value.trim();
    if (user) enter(user);
  });
  $('loginGuest').onclick = () => enter('Guest');
  $('logout').onclick = open;

  const user = readUser();
  if (user) {
    $('logout').textContent = `Log out (${user})`;
    onEnter();
  } else {
    open();
  }
}

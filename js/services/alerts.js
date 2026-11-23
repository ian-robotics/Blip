/**
 * System notifications while Blip is open in a background tab or window.
 * They only call the player back; the card itself waits in the app to be swiped.
 * (Notifications after the page is closed would need Web Push and a server.)
 */
const ASKED_KEY = 'blip-alerts-asked-v1';

export const alertsSupported = () => typeof globalThis.Notification === 'function';
export const alertPermission = () => alertsSupported() ? Notification.permission : 'unsupported';

export function alertsAsked() {
  try { return localStorage.getItem(ASKED_KEY) === '1'; } catch { return true; }
}

/** Must run from a click or swipe; browsers ignore or hide requests made without one. */
export async function requestAlerts() {
  if (alertPermission() !== 'default') return alertPermission();
  try { localStorage.setItem(ASKED_KEY, '1'); } catch {}
  try { return await Notification.requestPermission(); } catch { return alertPermission(); }
}

/** Show a notification only when the page is hidden; returns it so the caller can close it. */
export function systemAlert({ title, body, icon, onClick }) {
  if (alertPermission() !== 'granted' || document.visibilityState !== 'hidden') return null;
  try {
    const alert = new Notification(title, { body, icon, tag: 'blip-card' });
    alert.onclick = () => {
      window.focus();
      alert.close();
      onClick?.();
    };
    return alert;
  } catch {
    // Some mobile browsers only allow notifications from a service worker.
    return null;
  }
}

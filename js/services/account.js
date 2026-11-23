import { GOOGLE_CLIENT_ID } from '../config/auth.js';

const SESSION_KEY = 'blip-google-session-v1';
const ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

/** The signed-in Google account, or null for guests. Only a display name, avatar and Google's account ID are kept. */
export function readAccount() {
  try {
    const account = JSON.parse(globalThis.localStorage?.getItem(SESSION_KEY) || 'null');
    return account && typeof account.sub === 'string' && typeof account.name === 'string' ? account : null;
  } catch {
    return null;
  }
}

export function writeAccount(account) {
  try {
    if (account) globalThis.localStorage?.setItem(SESSION_KEY, JSON.stringify(account));
    else globalThis.localStorage?.removeItem(SESSION_KEY);
  } catch { /* Sign-in still works for this page. */ }
}

/** Each Google account keeps its own save in this browser; guests keep the original key. */
export function scopedKey(base, account = readAccount()) {
  return account ? `${base}:google:${account.sub}` : base;
}

/**
 * Read the ID token returned by Google Identity Services. Without a backend
 * this only identifies the player in their own browser; it is not used to
 * authorize anything on the server.
 */
export function accountFromCredential(credential, now = Date.now()) {
  const part = String(credential).split('.')[1];
  if (!part) throw new Error('invalid_credential');
  const base64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
  const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
  const payload = JSON.parse(new TextDecoder().decode(bytes));
  if (payload.aud !== GOOGLE_CLIENT_ID || !ISSUERS.includes(payload.iss) ||
      !(payload.exp * 1000 > now) || typeof payload.sub !== 'string' || !payload.sub) {
    throw new Error('invalid_credential');
  }
  const name = String(payload.given_name || payload.name || 'Friend').trim().slice(0, 24) || 'Friend';
  const picture = typeof payload.picture === 'string' && payload.picture.startsWith('https://') ? payload.picture : '';
  return { sub: payload.sub, name, picture };
}

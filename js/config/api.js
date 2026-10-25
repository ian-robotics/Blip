// Public configuration only. Never put an API key here.
// Set this to the Render service URL, without a trailing slash.
export const PRODUCTION_API_BASE = 'https://blip-api-x5wd.onrender.com';

export function taskApiUrl(location = globalThis.location) {
  if (!location || ['localhost', '127.0.0.1'].includes(location.hostname)) return '/api/parse';
  if (!PRODUCTION_API_BASE) {
    if (location.hostname.endsWith('.github.io')) throw new Error('backend_not_configured');
    return '/api/parse';
  }
  return `${PRODUCTION_API_BASE.replace(/\/$/, '')}/api/parse`;
}

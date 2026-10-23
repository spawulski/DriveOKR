// backend/src/config/oauthState.js
// passport-oauth2 state store for a sessionless (JWT) app. The random state is
// sent to the provider and set in an HttpOnly cookie scoped to the Google auth
// routes, binding the flow to the browser that started it (login CSRF
// protection). A server-side record makes each state single use and short lived.
const crypto = require('crypto');

const COOKIE = 'driveokr_google_state';
const COOKIE_PATH = '/api/auth/google';

const readCookie = (req, name) => {
  for (const part of (req.headers.cookie || '').split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return undefined;
};

const sameString = (a, b) => {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

const digest = state => crypto.createHash('sha256').update(state).digest('base64url');

const createOAuthStateStore = ({ ttlMs = 10 * 60 * 1000, maxEntries = 10000, now = Date.now, secure = false } = {}) => {
  const pending = new Map(); // sha256(state) -> expiresAt

  const prune = () => {
    const time = now();
    for (const [key, expiresAt] of pending) {
      if (expiresAt <= time) pending.delete(key);
    }
    // Map iteration is insertion ordered, so this evicts the oldest flows.
    for (const key of pending.keys()) {
      if (pending.size < maxEntries) break;
      pending.delete(key);
    }
  };

  const clear = req => req.res.clearCookie(COOKIE, { path: COOKIE_PATH, httpOnly: true, sameSite: 'lax', secure });

  // Removes the record for the presented state (if any) and the cookie.
  const consume = (req, state) => {
    const cookie = readCookie(req, COOKIE);
    clear(req);
    if (typeof state !== 'string' || !state || !cookie) return false;
    const key = digest(state);
    const expiresAt = pending.get(key);
    pending.delete(key);
    return sameString(state, cookie) && expiresAt !== undefined && expiresAt > now();
  };

  return {
    store(req, meta, callback) {
      prune();
      const state = crypto.randomBytes(32).toString('base64url');
      pending.set(digest(state), now() + ttlMs);
      req.res.cookie(COOKIE, state, { path: COOKIE_PATH, httpOnly: true, sameSite: 'lax', secure, maxAge: ttlMs });
      callback(null, state);
    },
    verify(req, state, meta, callback) {
      if (!consume(req, state)) {
        return callback(null, false, { message: 'Invalid or expired OAuth state', code: 'state_invalid' });
      }
      callback(null, true);
    },
    consume,
  };
};

module.exports = { createOAuthStateStore, STATE_COOKIE: COOKIE };

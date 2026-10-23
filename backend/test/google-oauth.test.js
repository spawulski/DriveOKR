const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { randomUUID } = require('node:crypto');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');

// Google is replaced by a local fake provider (authorization code -> token ->
// OpenID userinfo) so the real passport-google-oauth20 exchange runs without
// network access or real credentials. This is not a live Google sign-in.
const FRONTEND = 'http://localhost:3000';
const BACKEND = 'http://localhost:4000';
const GOOGLE_ENV = {
  JWT_SECRET: 'test-only-secret',
  GITHUB_CLIENT_ID: 'test-github-client',
  GITHUB_CLIENT_SECRET: 'test-github-secret',
  GOOGLE_CLIENT_ID: 'test-google-client.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: 'test-google-secret',
  FRONTEND_URL: FRONTEND,
  BACKEND_URL: BACKEND,
};

async function listen(app) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}

function fakeGoogle() {
  const app = express();
  app.use(express.urlencoded({ extended: false }));
  const codes = new Map();
  const tokens = new Map();
  const calls = { token: 0, userinfo: 0, tokenRequests: [] };
  app.post('/token', (req, res) => {
    calls.token++;
    calls.tokenRequests.push(req.body);
    const profile = codes.get(req.body.code);
    codes.delete(req.body.code);
    if (!profile || req.body.client_id !== GOOGLE_ENV.GOOGLE_CLIENT_ID
      || req.body.client_secret !== GOOGLE_ENV.GOOGLE_CLIENT_SECRET
      || req.body.grant_type !== 'authorization_code'
      || req.body.redirect_uri !== `${BACKEND}/api/auth/google/callback`) {
      return res.status(400).json({ error: 'invalid_grant' });
    }
    const accessToken = `fake-access-${randomUUID()}`;
    tokens.set(accessToken, profile);
    res.json({ access_token: accessToken, refresh_token: `fake-refresh-${randomUUID()}`, token_type: 'Bearer', expires_in: 3600 });
  });
  app.get('/userinfo', (req, res) => {
    calls.userinfo++;
    if (req.query.access_token) return res.status(400).json({ error: 'token_in_url' });
    const profile = tokens.get((req.headers.authorization || '').replace(/^Bearer /, ''));
    if (!profile) return res.status(401).json({ error: 'invalid_token' });
    res.json(profile);
  });
  return { app, calls, issueCode(profile) { const code = `code-${randomUUID()}`; codes.set(code, profile); return code; } };
}

function cookieFrom(response) {
  const header = response.headers.getSetCookie().find(c => c.startsWith('driveokr_google_state='));
  return header && header.split(';')[0];
}

test('Google OAuth sign-in against a controlled provider and disposable MongoDB', { timeout: 60000 }, async (t) => {
  assert.ok(process.env.TEST_MONGODB_URI, 'Set TEST_MONGODB_URI to a disposable MongoDB server (see README)');
  const uri = new URL(process.env.TEST_MONGODB_URI);
  uri.pathname = `/driveokr_test_${randomUUID().replaceAll('-', '')}`;
  const savedEnv = { ...process.env };
  Object.assign(process.env, GOOGLE_ENV);
  const servers = [];
  t.after(async () => {
    for (const s of servers) await new Promise(resolve => s.close(resolve));
    if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    process.env = savedEnv;
  });
  await mongoose.connect(uri.toString(), { serverSelectionTimeoutMS: 5000 });
  await User.init();

  const provider = fakeGoogle();
  const p = await listen(provider.app);
  servers.push(p.server);
  let clock = Date.now();
  const { createApp } = require('../src/app');
  const { createOAuthStateStore } = require('../src/config/oauthState');
  const stateStore = createOAuthStateStore({ now: () => clock });
  const app = createApp({
    google: {
      authorizationURL: `${p.url}/authorize`,
      tokenURL: `${p.url}/token`,
      userProfileURL: `${p.url}/userinfo`,
      stateStore,
    },
  });
  const a = await listen(app);
  servers.push(a.server);
  const api = `${a.url}/api`;
  const logs = [];
  for (const level of ['log', 'error', 'warn', 'info']) {
    const original = console[level];
    console[level] = (...args) => { logs.push(args.map(String).join(' ')); };
    t.after(() => { console[level] = original; });
  }

  async function start() {
    const response = await fetch(`${api}/auth/google`, { redirect: 'manual' });
    assert.equal(response.status, 302);
    const location = new URL(response.headers.get('location'));
    return { location, state: location.searchParams.get('state'), cookie: cookieFrom(response), response };
  }
  async function callback(query, cookie) {
    const response = await fetch(`${api}/auth/google/callback?${new URLSearchParams(query)}`, {
      redirect: 'manual', headers: cookie ? { cookie } : {},
    });
    assert.equal(response.status, 302);
    return new URL(response.headers.get('location'));
  }
  async function signIn(profile) {
    const { state, cookie } = await start();
    return callback({ code: provider.issueCode(profile), state }, cookie);
  }
  function tokenFrom(location) {
    assert.equal(location.origin + location.pathname, `${FRONTEND}/auth/callback`, location.href);
    return location.searchParams.get('token');
  }
  function errorFrom(location) {
    assert.equal(location.origin + location.pathname, `${FRONTEND}/`, location.href);
    return location.searchParams.get('auth_error');
  }
  const ada = { sub: '100000000000000000001', name: 'Ada Google', email: 'ada@example.test', email_verified: true };

  await t.test('authorization redirect uses narrow scopes, trusted callback and a browser-bound state', async () => {
    const { location, state, cookie, response } = await start();
    assert.equal(location.origin + location.pathname, `${p.url}/authorize`);
    assert.equal(location.searchParams.get('scope'), 'openid profile email');
    assert.equal(location.searchParams.get('redirect_uri'), `${BACKEND}/api/auth/google/callback`);
    assert.equal(location.searchParams.get('client_id'), GOOGLE_ENV.GOOGLE_CLIENT_ID);
    assert.equal(location.searchParams.get('response_type'), 'code');
    assert.equal(location.searchParams.get('access_type'), null);
    assert.ok(state && state.length >= 32);
    assert.equal(cookie, `driveokr_google_state=${state}`);
    const raw = response.headers.getSetCookie().find(c => c.startsWith('driveokr_google_state='));
    assert.match(raw, /HttpOnly/i);
    assert.match(raw, /SameSite=Lax/i);
    assert.match(raw, /Path=\/api\/auth\/google/i);
    assert.match(raw, /Max-Age=600/i);
    assert.doesNotMatch(raw, /Secure/i, 'plain-http local development keeps working');
    assert.doesNotMatch(location.href, /test-google-secret/);
  });

  let adaId;
  await t.test('new Google user is created with default role and a verifiable JWT', async () => {
    const token = tokenFrom(await signIn(ada));
    const payload = jwt.verify(token, GOOGLE_ENV.JWT_SECRET);
    const verify = await fetch(`${api}/auth/verify`, { headers: { authorization: `Bearer ${token}` } });
    assert.equal(verify.status, 200);
    const { user } = await verify.json();
    assert.equal(user.email, ada.email);
    assert.equal(user.name, ada.name);
    assert.equal(user.role, 'individual');
    assert.equal(user.isAdmin, false);
    const stored = await User.findById(payload.id).lean();
    assert.equal(stored.googleId, ada.sub);
    assert.equal(stored.githubId, undefined);
    assert.equal(Object.keys(stored).some(k => /token/i.test(k)), false, 'no provider tokens persisted');
    adaId = String(stored._id);
  });

  await t.test('repeat Google sign-in reuses the account and never escalates from profile fields', async () => {
    await User.updateOne({ _id: adaId }, { $set: { role: 'manager' } });
    const token = tokenFrom(await signIn({ ...ada, role: 'admin', isAdmin: true, name: 'Renamed' }));
    assert.equal(jwt.verify(token, GOOGLE_ENV.JWT_SECRET).id, adaId);
    const stored = await User.findById(adaId).lean();
    assert.equal(stored.role, 'manager', 'existing role preserved');
    assert.equal(stored.isAdmin, false);
    assert.ok(stored.lastLogin instanceof Date);
    assert.equal(await User.countDocuments({ googleId: ada.sub }), 1);
  });

  await t.test('multiple Google users get separate accounts', async () => {
    const grace = { sub: '100000000000000000002', name: 'Grace', email: 'grace@example.test', email_verified: true };
    const token = tokenFrom(await signIn(grace));
    const id = jwt.verify(token, GOOGLE_ENV.JWT_SECRET).id;
    assert.notEqual(id, adaId);
    assert.equal((await User.findById(id)).googleId, grace.sub);
  });

  await t.test('concurrent first sign-ins for the same subject create one user', async () => {
    const { findOrCreateGoogleUser } = require('../src/config/auth');
    const sub = '100000000000000000009';
    const profile = { id: sub, displayName: 'Racer', _json: { sub, email: 'racer@example.test', email_verified: true } };
    const results = await Promise.all([findOrCreateGoogleUser(profile), findOrCreateGoogleUser(profile)]);
    assert.equal(await User.countDocuments({ googleId: sub }), 1);
    assert.ok(results.every(r => r.user && r.user.googleId === sub));
    assert.equal(String(results[0].user._id), String(results[1].user._id));

    // Force the losing side of the race deterministically: the lookup misses,
    // then the insert hits the googleId unique index and must resolve to the
    // existing user rather than fail.
    const original = User.findOneAndUpdate;
    User.findOneAndUpdate = async () => null;
    try {
      const lost = await findOrCreateGoogleUser(profile);
      assert.equal(String(lost.user._id), String(results[0].user._id));
    } finally {
      User.findOneAndUpdate = original;
    }
    assert.equal(await User.countDocuments({ googleId: sub }), 1);
  });

  await t.test('matching email of an existing GitHub admin is not auto-linked or privileged', async () => {
    const githubAdmin = await User.create({ githubId: 'gh-admin', name: 'GitHub Admin', email: 'boss@example.test', role: 'admin', isAdmin: true });
    const token = tokenFrom(await signIn({ sub: '100000000000000000003', name: 'Impostor', email: 'boss@example.test', email_verified: true }));
    const id = jwt.verify(token, GOOGLE_ENV.JWT_SECRET).id;
    assert.notEqual(id, String(githubAdmin._id));
    const created = await User.findById(id).lean();
    assert.equal(created.isAdmin, false);
    assert.equal(created.role, 'individual');
    const admin = await User.findById(githubAdmin._id).lean();
    assert.equal(admin.googleId, undefined);
    assert.equal(admin.isAdmin, true);
    assert.equal(admin.name, 'GitHub Admin');
  });

  await t.test('unverified or missing email and invalid subjects are rejected without creating users', async () => {
    const before = await User.countDocuments();
    assert.equal(errorFrom(await signIn({ sub: '100000000000000000004', name: 'U', email: 'u@example.test', email_verified: false })), 'google_email_unverified');
    assert.equal(errorFrom(await signIn({ sub: '100000000000000000005', name: 'N' })), 'google_email_unverified');
    assert.equal(errorFrom(await signIn({ sub: '', name: 'S', email: 's@example.test', email_verified: true })), 'google_failed');
    assert.equal(await User.countDocuments(), before);
  });

  await t.test('state mismatch, missing state, missing cookie and replay are rejected before token exchange', async () => {
    const tokenCalls = provider.calls.token;
    const first = await start();
    const second = await start();
    const code = provider.issueCode(ada);
    assert.equal(errorFrom(await callback({ code, state: first.state }, second.cookie)), 'google_state_invalid');
    assert.equal(errorFrom(await callback({ code }, first.cookie)), 'google_state_invalid');
    assert.equal(errorFrom(await callback({ code, state: second.state })), 'google_state_invalid');
    assert.equal(errorFrom(await callback({ code, state: 'forged' }, 'driveokr_google_state=forged')), 'google_state_invalid');
    assert.equal(provider.calls.token, tokenCalls, 'no code exchange for invalid state');

    const fresh = await start();
    tokenFrom(await callback({ code: provider.issueCode(ada), state: fresh.state }, fresh.cookie));
    const exchanges = provider.calls.token;
    assert.equal(errorFrom(await callback({ code: provider.issueCode(ada), state: fresh.state }, fresh.cookie)), 'google_state_invalid');
    assert.equal(provider.calls.token, exchanges, 'replayed state is not exchanged');
  });

  await t.test('expired state is rejected', async () => {
    const { state, cookie } = await start();
    clock += 10 * 60 * 1000 + 1;
    assert.equal(errorFrom(await callback({ code: provider.issueCode(ada), state }, cookie)), 'google_state_invalid');
    clock = Date.now();
  });

  await t.test('user cancellation reports cancelled and consumes the state', async () => {
    const { state, cookie } = await start();
    assert.equal(errorFrom(await callback({ error: 'access_denied', state }, cookie)), 'google_cancelled');
    assert.equal(errorFrom(await callback({ code: provider.issueCode(ada), state }, cookie)), 'google_state_invalid');
    assert.equal(errorFrom(await callback({ error: 'server_error', state: 'x' })), 'google_failed');
  });

  await t.test('provider token-exchange failure is reported generically', async () => {
    const { state, cookie } = await start();
    assert.equal(errorFrom(await callback({ code: 'unknown-code', state }, cookie)), 'google_failed');
  });

  await t.test('the callback rejects attempts to choose a redirect target', async () => {
    const { state, cookie } = await start();
    const location = await callback({ code: provider.issueCode(ada), state, redirect: 'https://evil.example', returnTo: 'https://evil.example' }, cookie);
    assert.equal(location.origin, FRONTEND);
  });

  await t.test('GitHub sign-in redirect still works alongside Google', async () => {
    const response = await fetch(`${api}/auth/github`, { redirect: 'manual' });
    assert.equal(response.status, 302);
    const location = new URL(response.headers.get('location'));
    assert.equal(location.origin + location.pathname, 'https://github.com/login/oauth/authorize');
    assert.equal(location.searchParams.get('redirect_uri'), `${BACKEND}/api/auth/github/callback`);
  });

  await t.test('cancelled GitHub sign-in returns to the landing page with an error', async () => {
    const before = await User.countDocuments();
    const response = await fetch(`${api}/auth/github/callback?error=access_denied`, { redirect: 'manual' });
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), `${FRONTEND}/?auth_error=github_failed`);
    assert.equal(await User.countDocuments(), before);
  });

  await t.test('no secrets or provider tokens are logged', async () => {
    const all = logs.join('\n');
    assert.doesNotMatch(all, /test-google-secret|fake-access-|fake-refresh-|code-[0-9a-f]{8}-/);
  });
});

test('Google sign-in is optional when unconfigured', { timeout: 30000 }, async (t) => {
  const savedEnv = { ...process.env };
  Object.assign(process.env, GOOGLE_ENV);
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
  const { createApp } = require('../src/app');
  const a = await listen(createApp());
  t.after(async () => {
    await new Promise(resolve => a.server.close(resolve));
    process.env = savedEnv;
  });
  for (const path of ['/api/auth/google', '/api/auth/google/callback?code=x&state=y']) {
    const response = await fetch(a.url + path, { redirect: 'manual' });
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), `${FRONTEND}/?auth_error=google_unavailable`);
  }
  const github = await fetch(`${a.url}/api/auth/github`, { redirect: 'manual' });
  assert.equal(github.status, 302);
  assert.match(github.headers.get('location'), /^https:\/\/github\.com\/login\/oauth\/authorize\?/);
  const health = await fetch(`${a.url}/api/health`);
  assert.equal(health.status, 200);
});

test('the Google state cookie is Secure when the backend is served over https', { timeout: 30000 }, async (t) => {
  const savedEnv = { ...process.env };
  Object.assign(process.env, GOOGLE_ENV, { BACKEND_URL: 'https://api.okr.example' });
  const { createApp } = require('../src/app');
  const a = await listen(createApp());
  t.after(async () => {
    await new Promise(resolve => a.server.close(resolve));
    process.env = savedEnv;
  });
  const response = await fetch(`${a.url}/api/auth/google`, { redirect: 'manual' });
  assert.equal(response.status, 302);
  const location = new URL(response.headers.get('location'));
  assert.equal(location.searchParams.get('redirect_uri'), 'https://api.okr.example/api/auth/google/callback');
  const raw = response.headers.getSetCookie().find(c => c.startsWith('driveokr_google_state='));
  assert.match(raw, /;\s*Secure/i);
  assert.match(raw, /HttpOnly/i);
});

test('placeholder Google credentials are treated as unconfigured', () => {
  const { loadAuthConfig } = require('../src/config/oauth');
  assert.equal(loadAuthConfig({ ...GOOGLE_ENV, GOOGLE_CLIENT_ID: 'your_google_client_id', GOOGLE_CLIENT_SECRET: 'your_google_client_secret' }).google.enabled, false);
  assert.equal(loadAuthConfig({ ...GOOGLE_ENV, GOOGLE_CLIENT_SECRET: '' }).google.enabled, false);
  assert.equal(loadAuthConfig(GOOGLE_ENV).google.enabled, true);
});

test('auth URLs come only from trusted http(s) origins', () => {
  const { loadAuthConfig } = require('../src/config/oauth');
  const defaults = loadAuthConfig({});
  assert.equal(defaults.frontendUrl, 'http://localhost:3000');
  assert.equal(defaults.github.callbackURL, 'http://localhost:4000/api/auth/github/callback');
  assert.equal(defaults.google.callbackURL, 'http://localhost:4000/api/auth/google/callback');
  assert.equal(loadAuthConfig({ FRONTEND_URL: 'https://okr.example/' }).frontendUrl, 'https://okr.example');
  assert.throws(() => loadAuthConfig({ FRONTEND_URL: 'javascript:alert(1)' }), /FRONTEND_URL/);
  assert.throws(() => loadAuthConfig({ BACKEND_URL: 'https://api.example/path?x=1' }), /BACKEND_URL/);
});

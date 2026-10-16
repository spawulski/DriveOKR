const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { randomUUID } = require('node:crypto');
const net = require('node:net');
const path = require('node:path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');
const Department = require('../src/models/Department');

// Uses a new, randomly named database, never the database named in the URI.
// No real OAuth credentials or external OAuth requests are needed.
test('API regression: authentication, roles, organization and OKR lifecycle', { timeout: 60000 }, async (t) => {
  assert.ok(process.env.TEST_MONGODB_URI, 'Set TEST_MONGODB_URI to a disposable MongoDB server (see README)');
  const dbName = `driveokr_test_${randomUUID().replaceAll('-', '')}`;
  const uri = new URL(process.env.TEST_MONGODB_URI);
  uri.pathname = `/${dbName}`;
  let child;
  let logs = '';
  t.after(async () => {
    if (child && child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
    if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
  await mongoose.connect(uri.toString(), { serverSelectionTimeoutMS: 5000 });
  const admin = await User.create({ githubId: 'test-admin', name: 'Test Admin', email: 'admin@example.test', role: 'admin', isAdmin: true });
  const member = await User.create({ githubId: 'test-member', name: 'Test Member', email: 'member@example.test' });
  const dept = await Department.create({ name: 'Engineering' });
  const socket = net.createServer();
  socket.listen(0, '127.0.0.1');
  await once(socket, 'listening');
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  child = spawn(process.execPath, ['src/index.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, MONGODB_URI: uri.toString(), PORT: String(port), JWT_SECRET: 'test-only-secret', GITHUB_CLIENT_ID: 'test-client', GITHUB_CLIENT_SECRET: 'test-secret' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', x => { logs += x; });
  child.stderr.on('data', x => { logs += x; });
  const base = `http://127.0.0.1:${port}/api`;
  let ready = false;
  for (let i = 0; i < 100; i++) {
    assert.equal(child.exitCode, null, logs);
    try {
      if ((await fetch(`${base}/health`)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, `API health readiness timed out\n${logs}`);
  const token = user => jwt.sign({ id: user.id }, 'test-only-secret', { expiresIn: '1h' });
  const a = token(admin), m = token(member);
  async function request(method, endpoint, expectedStatus, auth, body) {
    const response = await fetch(base + endpoint, {
      method, redirect: 'manual',
      headers: { 'content-type': 'application/json', ...(auth ? { authorization: `Bearer ${auth}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    assert.equal(response.status, expectedStatus, `${method} ${endpoint}: ${text}\n${logs}`);
    if (response.status === 302) return response.headers.get('location');
    try { return JSON.parse(text); } catch { return text; }
  }
  await t.test('health and JWT authentication', async () => {
    assert.deepEqual(await request('GET', '/health', 200), { status: 'OK' });
    await request('GET', '/auth/verify', 401);
    await request('GET', '/auth/verify', 401, 'invalid');
    const result = await request('GET', '/auth/verify', 200, a);
    assert.equal(result.user.email, admin.email);
    assert.equal(result.user.isAdmin, true);
    assert.match(await request('GET', '/auth/github', 302), /^https:\/\/github.com\/login\/oauth\/authorize\?/);
  });
  await t.test('role restrictions and organization reads', async () => {
    await request('GET', '/admin/metrics', 403, m);
    assert.equal((await request('GET', '/admin/metrics', 200, a)).totalUsers, 2);
    assert.equal((await request('GET', '/departments', 200, a))[0].name, 'Engineering');
    assert.deepEqual(await request('GET', '/teams', 200, a), []);
    assert.equal((await request('GET', '/users', 200, a)).length, 2);
    assert.equal((await request('GET', `/users/${member.id}`, 200, a)).email, member.email);
    await request('POST', '/departments', 403, m, { name: 'Forbidden' });
    assert.equal((await request('POST', '/departments', 201, a, { name: 'Sales' })).name, 'Sales');
    await request('POST', '/departments', 400, a, {});
  });
  await t.test('objective and key-result CRUD, validation and progress', async () => {
    await request('GET', '/objectives', 401);
    assert.deepEqual(await request('GET', '/objectives', 200, a), []);
    await request('POST', '/objectives', 400, a, { title: 'Missing required fields' });
    const obj = await request('POST', '/objectives', 201, a, {
      title: 'Ship reliably', owner: admin.id, type: 'department', department: dept.id,
      timeframe: { quarter: 4, year: 2026 }, status: 'active',
    });
    assert.equal(obj.title, 'Ship reliably');
    assert.equal((await request('GET', '/objectives', 200, a)).length, 1);
    const kr = await request('POST', '/key-results', 201, a, {
      objective: obj._id, title: 'Test coverage', metricType: 'percentage', startValue: 0, currentValue: 0, targetValue: 100,
    });
    assert.equal(kr.progress, 0);
    assert.equal((await request('GET', `/key-results/objective/${obj._id}`, 200, a)).length, 1);
    await request('PUT', `/key-results/${kr._id}`, 403, m, { currentValue: 50 });
    assert.equal((await request('PUT', `/key-results/${kr._id}`, 200, a, { currentValue: 50 })).progress, 50);
    const confidence = await request('PATCH', `/key-results/${kr._id}/confidence`, 200, a, { confidenceLevel: 'high', note: 'On track' });
    assert.equal(confidence.confidenceLevel, 'high');
    assert.ok(confidence.confidenceHistory.some(entry => entry.level === 'high' && entry.note === 'On track'));
    const fetched = await request('GET', `/objectives/${obj._id}`, 200, a);
    assert.equal(fetched.keyResults[0].progress, 50);
    await request('PUT', `/objectives/${obj._id}`, 403, m, { title: 'Unauthorized' });
    assert.equal((await request('PUT', `/objectives/${obj._id}`, 200, a, { title: 'Updated' })).title, 'Updated');
    await request('DELETE', `/key-results/${kr._id}`, 200, a);
    assert.deepEqual(await request('GET', `/key-results/objective/${obj._id}`, 200, a), []);
    await request('DELETE', `/objectives/${obj._id}`, 200, a);
    assert.deepEqual(await request('GET', '/objectives', 200, a), []);
  });
});

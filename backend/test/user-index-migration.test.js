const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');

// Reproduces a pre-Google deployment: the users collection already carries the
// legacy unique, non-sparse githubId_1 index that Mongoose created before
// Google-only users (documents without githubId) existed. Runs only against a
// randomly named database on the disposable TEST_MONGODB_URI server.
test('legacy githubId_1 index migration is dry-run first, narrow and preserves users', { timeout: 30000 }, async (t) => {
  assert.ok(process.env.TEST_MONGODB_URI, 'Set TEST_MONGODB_URI to a disposable MongoDB server (see README)');
  const uri = new URL(process.env.TEST_MONGODB_URI);
  uri.pathname = `/driveokr_test_${randomUUID().replaceAll('-', '')}`;
  const client = new mongoose.mongo.MongoClient(uri.toString(), { serverSelectionTimeoutMS: 5000 });
  t.after(async () => {
    await client.db().dropDatabase();
    await client.close();
  });
  await client.connect();
  const db = client.db();
  const users = db.collection('users');
  await users.createIndex({ githubId: 1 }, { unique: true, name: 'githubId_1', background: true });
  await users.insertMany([
    { githubId: 'gh-1', email: 'admin@example.test', name: 'Admin', role: 'admin', isAdmin: true, department: new mongoose.Types.ObjectId() },
    { githubId: 'gh-2', email: 'lead@example.test', name: 'Lead', role: 'team_lead', isAdmin: false },
  ]);
  await db.collection('objectives').insertOne({ title: 'Draft objective', status: 'draft' });
  const snapshot = async () => ({
    users: await users.find().sort({ githubId: 1 }).toArray(),
    objectives: await db.collection('objectives').find().toArray(),
  });
  const before = await snapshot();

  // Demonstrates the deployment problem the migration solves.
  await users.insertOne({ googleId: 'g-1', email: 'g1@example.test', name: 'G1' });
  await assert.rejects(users.insertOne({ googleId: 'g-2', email: 'g2@example.test', name: 'G2' }), /E11000.*githubId_1/);
  await users.deleteOne({ googleId: 'g-1' });

  const { planUserIndexMigration, applyUserIndexMigration } = require('../src/scripts/migrateUserProviderIndexes');

  const plan = await planUserIndexMigration(db);
  assert.equal(plan.legacyGithubIndex, true);
  assert.deepEqual(plan.blockers, []);
  assert.deepEqual(plan.actions, ['drop legacy githubId_1', 'create githubId_1 (unique, partial: string githubId)', 'create googleId_1 (unique, partial: string googleId)']);
  const indexNames = async () => (await users.indexes()).map(i => i.name).sort();
  assert.deepEqual(await indexNames(), ['_id_', 'githubId_1'], 'dry run changes nothing');
  assert.deepEqual(await snapshot(), before);

  const result = await applyUserIndexMigration(db);
  assert.deepEqual(result.applied, plan.actions);
  const indexes = await users.indexes();
  const github = indexes.find(i => i.name === 'githubId_1');
  assert.equal(github.unique, true);
  assert.deepEqual(github.partialFilterExpression, { githubId: { $type: 'string' } });
  const google = indexes.find(i => i.name === 'googleId_1');
  assert.equal(google.unique, true);
  assert.deepEqual(google.partialFilterExpression, { googleId: { $type: 'string' } });
  assert.deepEqual(await snapshot(), before, 'users, roles, admin flags and drafts preserved');

  // Uniqueness is still enforced for real provider ids, and multiple
  // Google-only users can now coexist.
  await assert.rejects(users.insertOne({ githubId: 'gh-1', email: 'dupe@example.test', name: 'Dupe' }), /E11000/);
  await users.insertMany([{ googleId: 'g-1', email: 'g1@example.test', name: 'G1' }, { googleId: 'g-2', email: 'g2@example.test', name: 'G2' }]);
  await assert.rejects(users.insertOne({ googleId: 'g-1', email: 'x@example.test', name: 'X' }), /E11000/);

  // Idempotent: a second run plans and applies nothing.
  const again = await planUserIndexMigration(db);
  assert.equal(again.legacyGithubIndex, false);
  assert.deepEqual(again.actions, []);
  assert.deepEqual((await applyUserIndexMigration(db)).applied, []);

  // The schema the app declares matches what the migration created, so
  // Mongoose autoIndex has nothing to change.
  const User = require('../src/models/User');
  const declared = User.schema.indexes().map(([keys, options]) => [keys, options.unique, options.partialFilterExpression]);
  assert.deepEqual(declared, [
    [{ githubId: 1 }, true, { githubId: { $type: 'string' } }],
    [{ googleId: 1 }, true, { googleId: { $type: 'string' } }],
  ]);
});

test('before migration the app keeps working and reports a clear error for the second Google-only user', { timeout: 30000 }, async (t) => {
  const uri = new URL(process.env.TEST_MONGODB_URI);
  uri.pathname = `/driveokr_test_${randomUUID().replaceAll('-', '')}`;
  const client = new mongoose.mongo.MongoClient(uri.toString(), { serverSelectionTimeoutMS: 5000 });
  const errors = [];
  const originalError = console.error;
  console.error = (...args) => { errors.push(args.join(' ')); };
  t.after(async () => {
    console.error = originalError;
    await mongoose.disconnect();
    await client.db().dropDatabase();
    await client.close();
  });
  await client.connect();
  const users = client.db().collection('users');
  await users.createIndex({ githubId: 1 }, { unique: true, name: 'githubId_1' });
  await users.insertOne({ githubId: 'gh-1', email: 'admin@example.test', name: 'Admin', role: 'admin', isAdmin: true });

  const User = require('../src/models/User');
  const { findOrCreateGoogleUser } = require('../src/config/auth');
  await mongoose.connect(uri.toString(), { serverSelectionTimeoutMS: 5000 });
  // Mongoose cannot replace the conflicting legacy index itself (and must not).
  await assert.rejects(User.init(), /githubId_1/);
  assert.equal((await users.indexes()).find(i => i.name === 'githubId_1').partialFilterExpression, undefined);
  assert.deepEqual((await User.diffIndexes()).toDrop, ['githubId_1']);

  const profile = (sub) => ({ id: sub, displayName: sub, _json: { sub, email: `${sub}@example.test`, email_verified: true } });
  assert.equal((await findOrCreateGoogleUser(profile('g-1'))).user.googleId, 'g-1');
  const blocked = await findOrCreateGoogleUser(profile('g-2'));
  assert.equal(blocked.user, false);
  assert.equal(blocked.info.code, 'account_unavailable');
  assert.ok(errors.some(e => /migrateUserProviderIndexes/.test(e)));
  assert.equal((await User.findOne({ githubId: 'gh-1' })).isAdmin, true);

  const { applyUserIndexMigration } = require('../src/scripts/migrateUserProviderIndexes');
  await applyUserIndexMigration(client.db());
  // After migration Mongoose sees nothing to drop or create for the schema.
  assert.deepEqual(await User.diffIndexes(), { toDrop: [], toCreate: [] });
  assert.equal((await findOrCreateGoogleUser(profile('g-2'))).user.googleId, 'g-2');
  assert.equal((await findOrCreateGoogleUser(profile('g-1'))).user.googleId, 'g-1');
  assert.equal(await users.countDocuments(), 3);
});

test('migration refuses to apply when existing data would violate the new indexes', { timeout: 30000 }, async (t) => {
  const uri = new URL(process.env.TEST_MONGODB_URI);
  uri.pathname = `/driveokr_test_${randomUUID().replaceAll('-', '')}`;
  const client = new mongoose.mongo.MongoClient(uri.toString(), { serverSelectionTimeoutMS: 5000 });
  t.after(async () => {
    await client.db().dropDatabase();
    await client.close();
  });
  await client.connect();
  const users = client.db().collection('users');
  await users.insertMany([{ googleId: 'dup', email: 'a@example.test', name: 'A' }, { googleId: 'dup', email: 'b@example.test', name: 'B' }]);
  const { planUserIndexMigration, applyUserIndexMigration } = require('../src/scripts/migrateUserProviderIndexes');
  const plan = await planUserIndexMigration(client.db());
  assert.deepEqual(plan.blockers, ['1 duplicated googleId value(s)']);
  await assert.rejects(applyUserIndexMigration(client.db()), /blocked/);
  assert.deepEqual((await users.indexes()).map(i => i.name), ['_id_']);
});

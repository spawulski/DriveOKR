// backend/src/scripts/migrateUserProviderIndexes.js
//
// One-time migration for databases created before Google sign-in. It replaces
// the legacy unique, non-partial `githubId_1` index on `users` (which allows
// only one user without a githubId) with the partial unique indexes declared
// in models/User.js. It touches only these two indexes and never modifies
// documents.
//
//   node src/scripts/migrateUserProviderIndexes.js            # dry run (default)
//   node src/scripts/migrateUserProviderIndexes.js --apply    # make the change
//
// Uses MONGODB_URI. Back up first and stop the backend while applying: githubId
// uniqueness is not enforced between dropping and recreating githubId_1.
const mongoose = require('mongoose');

const TARGETS = [
  { field: 'githubId', name: 'githubId_1' },
  { field: 'googleId', name: 'googleId_1' },
];

const isTarget = (index, field) =>
  index.unique === true && index.partialFilterExpression &&
  JSON.stringify(index.partialFilterExpression) === JSON.stringify({ [field]: { $type: 'string' } });

const listIndexes = async (users) => {
  try {
    return await users.indexes();
  } catch (error) {
    if (error.codeName === 'NamespaceNotFound') return [];
    throw error;
  }
};

const planUserIndexMigration = async (db) => {
  const users = db.collection('users');
  const indexes = await listIndexes(users);
  const actions = [];
  const blockers = [];
  let legacyGithubIndex = false;

  for (const { field, name } of TARGETS) {
    const existing = indexes.find(index => index.name === name);
    if (existing && isTarget(existing, field)) continue;
    if (existing) {
      if (field === 'githubId') legacyGithubIndex = true;
      actions.push(`drop legacy ${name}`);
    }
    const duplicates = await users.aggregate([
      { $match: { [field]: { $type: 'string' } } },
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $count: 'values' },
    ]).toArray();
    if (duplicates.length) blockers.push(`${duplicates[0].values} duplicated ${field} value(s)`);
    actions.push(`create ${name} (unique, partial: string ${field})`);
  }
  return { legacyGithubIndex, actions, blockers };
};

const applyUserIndexMigration = async (db) => {
  const plan = await planUserIndexMigration(db);
  if (plan.blockers.length) {
    throw new Error(`Migration blocked: ${plan.blockers.join('; ')}. Resolve manually; no changes made.`);
  }
  const users = db.collection('users');
  const indexes = await listIndexes(users);
  const applied = [];
  for (const { field, name } of TARGETS) {
    const existing = indexes.find(index => index.name === name);
    if (existing && isTarget(existing, field)) continue;
    if (existing) {
      await users.dropIndex(name);
      applied.push(`drop legacy ${name}`);
    }
    await users.createIndex({ [field]: 1 }, { name, unique: true, partialFilterExpression: { [field]: { $type: 'string' } } });
    applied.push(`create ${name} (unique, partial: string ${field})`);
  }
  return { applied };
};

const main = async () => {
  require('dotenv').config();
  const apply = process.argv.includes('--apply');
  // autoIndex off: this script must not build any other indexes.
  const connection = await mongoose.createConnection(process.env.MONGODB_URI, { autoIndex: false }).asPromise();
  try {
    const plan = await planUserIndexMigration(connection.db);
    console.log(`Database: ${connection.db.databaseName}`);
    console.log(plan.actions.length ? `Planned:\n  ${plan.actions.join('\n  ')}` : 'Nothing to do; indexes already current.');
    if (plan.blockers.length) console.log(`Blocked:\n  ${plan.blockers.join('\n  ')}`);
    if (!apply) {
      console.log('Dry run only. Re-run with --apply to make these changes.');
      return;
    }
    const { applied } = await applyUserIndexMigration(connection.db);
    console.log(applied.length ? `Applied:\n  ${applied.join('\n  ')}` : 'No changes applied.');
  } finally {
    await connection.close();
  }
};

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { planUserIndexMigration, applyUserIndexMigration };

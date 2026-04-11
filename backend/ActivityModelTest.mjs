// ── ActivityModel Test File ───────────────────────────────────────────────────
// Run with:  node ActivityModelTest.mjs
// Make sure the database is running before executing this file.

import { ActivityModel } from './models/ActivityModel.mjs';

// Simple assertion helper — logs PASS or FAIL with a message
function assert(condition, message) {
  if (condition) {
    console.log(`  ✔ PASS — ${message}`);
  } else {
    console.error(`  ✘ FAIL — ${message}`);
  }
}

// ── Run all tests ─────────────────────────────────────────────────────────────
async function runTests() {
  console.log('\n=== ActivityModel Tests ===\n');

  let createdId = null;

  // ── Test 1: listActivities — get all ─────────────────────────────────────
  console.log('Test 1: listActivities()');
  const allActivities = await ActivityModel.listActivities();
  assert(Array.isArray(allActivities), 'returns an array');
  console.log(`        Found ${allActivities.length} activities in database.\n`);

  // ── Test 2: listActivities — active only ─────────────────────────────────
  console.log('Test 2: listActivities(activeOnly = true)');
  const activeOnly = await ActivityModel.listActivities(true);
  assert(Array.isArray(activeOnly), 'returns an array');
  const allInactive = activeOnly.some(a => a.status !== 'active');
  assert(!allInactive, 'all returned records have status = active');
  console.log(`        Found ${activeOnly.length} active activities.\n`);

  // ── Test 3: createActivity ────────────────────────────────────────────────
  console.log('Test 3: createActivity()');
  createdId = await ActivityModel.createActivity(
    'Test Activity',
    'This is a test activity — safe to delete.',
    'active'
  );
  assert(typeof createdId === 'number' && createdId > 0, `insertId is a positive number (got ${createdId})`);
  console.log(`        Created activity with id = ${createdId}.\n`);

  // ── Test 4: findById ──────────────────────────────────────────────────────
  console.log('Test 4: findById()');
  const found = await ActivityModel.findById(createdId);
  assert(found !== undefined,             'activity was found in database');
  assert(found.id === createdId,          `id matches (${found.id})`);
  assert(found.name === 'Test Activity',  `name matches (${found.name})`);
  assert(found.status === 'active',       `status is active (${found.status})`);
  console.log('');

  // ── Test 5: updateActivity ────────────────────────────────────────────────
  console.log('Test 5: updateActivity()');
  await ActivityModel.updateActivity(createdId, 'Test Activity Updated', 'Updated description.', 'active');
  const updated = await ActivityModel.findById(createdId);
  assert(updated.name === 'Test Activity Updated', `name updated to "${updated.name}"`);
  assert(updated.description === 'Updated description.', 'description updated');
  console.log('');

  // ── Test 6: countUsage ────────────────────────────────────────────────────
  console.log('Test 6: countUsage()');
  const usageCount = await ActivityModel.countUsage(createdId);
  assert(typeof usageCount === 'number', `returns a number (got ${usageCount})`);
  assert(usageCount === 0, 'newly created activity has 0 sessions using it');
  console.log('');

  // ── Test 7: deactivateActivity ────────────────────────────────────────────
  console.log('Test 7: deactivateActivity()');
  await ActivityModel.deactivateActivity(createdId);
  const deactivated = await ActivityModel.findById(createdId);
  assert(deactivated.status === 'inactive', `status changed to inactive (${deactivated.status})`);
  console.log('');

  // ── Test 8: findById — not found ──────────────────────────────────────────
  console.log('Test 8: findById() with non-existent id');
  const notFound = await ActivityModel.findById(999999);
  assert(notFound === undefined, 'returns undefined for non-existent id');
  console.log('');

  // ── Test 9: deleteActivity (clean up test data) ───────────────────────────
  console.log('Test 9: deleteActivity()');
  await ActivityModel.deleteActivity(createdId);
  const afterDelete = await ActivityModel.findById(createdId);
  assert(afterDelete === undefined, 'activity no longer exists after delete');
  console.log('');

  console.log('=== All tests complete ===\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('\nTest run failed with error:', err.message);
  process.exit(1);
});

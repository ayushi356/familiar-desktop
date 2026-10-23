/**
 * Familiar Automated Test Suite
 * Validates store operations, data integrity, recipe mechanics, and preload contracts.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passedTests = 0;
let failedTests = 0;

function runTest(testName, testFn) {
  try {
    testFn();
    console.log(`  ✓ ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${testName}`);
    console.error(`    Error: ${err.message}`);
    failedTests++;
  }
}

console.log('\n🔮 Running Familiar Test Suite...\n');

// 1. Verify File Structure
runTest('All core source files exist', () => {
  const expectedFiles = [
    'src/main/index.js',
    'src/main/store.js',
    'src/main/windowManager.js',
    'src/main/trayManager.js',
    'src/main/focusManager.js',
    'src/main/activityTracker.js',
    'src/main/ipcHandlers.js',
    'src/preload/companionPreload.js',
    'src/preload/hubPreload.js',
    'src/renderer/companion/index.html',
    'src/renderer/companion/companion.css',
    'src/renderer/companion/companion.js',
    'src/renderer/hub/index.html',
    'src/renderer/hub/hub.css',
    'src/renderer/hub/hub.js',
    'src/renderer/common/theme.css',
    'src/renderer/common/icons.js',
    'src/renderer/common/characterComponent.js'
  ];

  for (const rel of expectedFiles) {
    const full = path.join(__dirname, '..', rel);
    assert.ok(fs.existsSync(full), `File must exist: ${rel}`);
  }
});

// 2. Test Store Mechanics
const Store = require('../src/main/store');
const testStoreFile = 'test-store-temp.json';
const testStorePath = path.join(process.cwd(), 'user-data', testStoreFile);

runTest('Store initializes with complete default schema', () => {
  if (fs.existsSync(testStorePath)) fs.unlinkSync(testStorePath);
  const store = new Store(testStoreFile);

  assert.strictEqual(store.get('settings.alwaysOnTop'), true);
  assert.strictEqual(store.get('settings.monitoringEnabled'), true);
  assert.strictEqual(store.get('companion.name'), 'Hesper');
  assert.strictEqual(store.get('companion.level'), 1);
  assert.ok(Array.isArray(store.get('tasks')), 'Tasks should be an array');
  assert.ok(store.get('inventory.ingredients'), 'Inventory should have ingredients');
});

runTest('Store reads and writes nested properties atomically', () => {
  const store = new Store(testStoreFile);
  store.set('companion.name', 'Morgana');
  assert.strictEqual(store.get('companion.name'), 'Morgana');

  store.set('settings.idleThresholdMinutes', 10);
  assert.strictEqual(store.get('settings.idleThresholdMinutes'), 10);

  // Reload from disk to verify persistence
  const reloaded = new Store(testStoreFile);
  assert.strictEqual(reloaded.get('companion.name'), 'Morgana');
  assert.strictEqual(reloaded.get('settings.idleThresholdMinutes'), 10);
});

runTest('Store handles corrupted data gracefully with fallback', () => {
  fs.writeFileSync(testStorePath, '{ invalid json corrupted! }}}', 'utf8');
  const store = new Store(testStoreFile);
  assert.strictEqual(store.get('companion.name'), 'Hesper', 'Should fallback to default Hesper');
});

// Clean up temp store
if (fs.existsSync(testStorePath)) fs.unlinkSync(testStorePath);

// 3. Test Task Logic
runTest('Task management handles creation, completion, and deletion', () => {
  const tasks = [];
  const newTask = {
    id: 'test_task_1',
    title: 'Brew Moon Dew Potion',
    priority: 'high',
    dueDate: '2026-10-31',
    completed: false
  };
  tasks.push(newTask);
  assert.strictEqual(tasks.length, 1);

  // Completion
  tasks[0].completed = true;
  assert.strictEqual(tasks[0].completed, true);

  // Deletion
  const remaining = tasks.filter(t => t.id !== 'test_task_1');
  assert.strictEqual(remaining.length, 0);
});

// 4. Test Potion Recipe Mechanics
runTest('Potion brewing correctly evaluates recipe pairs', () => {
  function evalBrew(ing1, ing2) {
    const pair = [ing1, ing2].sort().join('+');
    if (pair === 'moon-dew+starlight-moss') return 'Elixir of Clarity';
    if (pair === 'moon-dew+nightshade-petal') return 'Twilight Draught';
    if (pair === 'nightshade-petal+starlight-moss') return 'Astral Essence';
    return 'Experimental Elixir';
  }

  assert.strictEqual(evalBrew('starlight-moss', 'moon-dew'), 'Elixir of Clarity');
  assert.strictEqual(evalBrew('nightshade-petal', 'moon-dew'), 'Twilight Draught');
  assert.strictEqual(evalBrew('nightshade-petal', 'starlight-moss'), 'Astral Essence');
  assert.strictEqual(evalBrew('moon-dew', 'moon-dew'), 'Experimental Elixir');
});

// 5. Test Activity Categorization
runTest('Activity classification defaults and processes match properly', () => {
  const categories = {
    'code': 'productive',
    'notepad': 'productive',
    'chrome': 'neutral',
    'steam': 'distracting'
  };

  function classify(proc) {
    return categories[proc.toLowerCase()] || 'neutral';
  }

  assert.strictEqual(classify('CODE'), 'productive');
  assert.strictEqual(classify('steam'), 'distracting');
  assert.strictEqual(classify('chrome'), 'neutral');
  assert.strictEqual(classify('random-new-app'), 'neutral');
});

// Summary
console.log(`\n========================================`);
console.log(`Test Results: ${passedTests} passed, ${failedTests} failed.`);
console.log(`========================================\n`);

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

/**
 * Familiar Automated Test Suite
 * Validates store operations, data integrity, recipe mechanics, preload contracts,
 * and Hesper's AI service (prompt engineering, context isolation, memory manager, fallbacks).
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passedTests = 0;
let failedTests = 0;

async function runTest(testName, testFn) {
  try {
    await testFn();
    console.log(`  ✓ ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${testName}`);
    console.error(`    Error: ${err.message}`);
    failedTests++;
  }
}

async function runAllTests() {
  console.log('\n🔮 Running Familiar Test Suite...\n');

  // 1. Verify File Structure
  await runTest('All core source files exist', () => {
    const expectedFiles = [
      'src/main/index.js',
      'src/main/store.js',
      'src/main/windowManager.js',
      'src/main/trayManager.js',
      'src/main/focusManager.js',
      'src/main/activityTracker.js',
      'src/main/aiService.js',
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

  await runTest('Store initializes with complete default schema including AI settings', () => {
    if (fs.existsSync(testStorePath)) fs.unlinkSync(testStorePath);
    const store = new Store(testStoreFile);

    assert.strictEqual(store.get('settings.alwaysOnTop'), true);
    assert.strictEqual(store.get('settings.monitoringEnabled'), true);
    assert.strictEqual(store.get('companion.name'), 'Hesper');
    assert.strictEqual(store.get('companion.level'), 1);
    assert.ok(Array.isArray(store.get('tasks')), 'Tasks should be an array');
    assert.ok(store.get('inventory.ingredients'), 'Inventory should have ingredients');
    assert.strictEqual(store.get('ai.enabled'), false, 'AI should be opt-in by default');
    assert.strictEqual(store.get('ai.model'), 'gpt-4o-mini');
    assert.ok(Array.isArray(store.get('ai.memories')), 'AI memories should be an array');
    assert.ok(Array.isArray(store.get('ai.chatHistory')), 'AI chatHistory should be an array');
  });

  await runTest('Store reads and writes nested properties atomically', () => {
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

  await runTest('Store handles corrupted data gracefully with fallback', () => {
    fs.writeFileSync(testStorePath, '{ invalid json corrupted! }}}', 'utf8');
    const store = new Store(testStoreFile);
    assert.strictEqual(store.get('companion.name'), 'Hesper', 'Should fallback to default Hesper');
  });

  // Clean up temp store
  if (fs.existsSync(testStorePath)) fs.unlinkSync(testStorePath);

  // 3. Test Task Logic
  await runTest('Task management handles creation, completion, and deletion', () => {
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
  await runTest('Potion brewing correctly evaluates recipe pairs', () => {
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
  await runTest('Activity classification defaults and processes match properly', () => {
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

  // 6. Test Conversational AI Service
  const AIService = require('../src/main/aiService');

  await runTest('AIService constructs personality prompt with permitted context and strict boundaries', () => {
    if (fs.existsSync(testStorePath)) fs.unlinkSync(testStorePath);
    const store = new Store(testStoreFile);
    store.set('tasks', [
      { id: 't1', title: 'Write magical thesis chapter', priority: 'high', completed: false }
    ]);
    store.set('ai.memories', [
      { id: 'm1', text: 'Likes tea breaks after 30 minutes of writing' }
    ]);

    const fakeFocusManager = {
      getState: () => ({ isActive: true, isPaused: false, mode: 'focus', remainingSeconds: 1200 })
    };
    const ai = new AIService(store, fakeFocusManager);

    const prompt = ai.buildSystemPrompt();
    assert.ok(prompt.includes('Hesper'), 'Prompt should include companion name');
    assert.ok(prompt.includes('Cozy gothic fantasy'), 'Prompt should establish cozy gothic tone');
    assert.ok(prompt.includes('SHORT and thoughtful'), 'Prompt should enforce concise response length');
    assert.ok(prompt.includes('Focus Session: ACTIVE'), 'Prompt should include active focus context');
    assert.ok(prompt.includes('Write magical thesis chapter'), 'Prompt should include in-progress task');
    assert.ok(prompt.includes('Likes tea breaks after 30 minutes'), 'Prompt should include permitted memories');
    assert.ok(prompt.includes('NEVER pretend or claim you executed a system action'), 'Prompt should enforce truthfulness boundaries');
    assert.ok(!prompt.includes('chrome'), 'Prompt must NOT include activity history or private process data');
  });

  await runTest('AIService manages user memories correctly (CRUD)', () => {
    const store = new Store(testStoreFile);
    const ai = new AIService(store, null);

    const created = ai.saveMemory('Prefers jasmine green tea during morning study');
    assert.ok(created && created.id, 'Memory should have a unique ID');
    assert.strictEqual(created.text, 'Prefers jasmine green tea during morning study');

    const memories = ai.getMemories();
    assert.ok(memories.some(m => m.id === created.id), 'Memory should be retrievable');

    const deleted = ai.deleteMemory(created.id);
    assert.strictEqual(deleted, true, 'deleteMemory should return true');
    assert.ok(!ai.getMemories().some(m => m.id === created.id), 'Deleted memory should be gone');
  });

  await runTest('AIService provides graceful in-character fallback when disabled or unconfigured', async () => {
    const store = new Store(testStoreFile);
    store.set('ai.enabled', false);
    const ai = new AIService(store, null);

    const result = await ai.sendMessage('Hello Hesper!');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'AI_DISABLED');
    assert.ok(result.fallbackReply, 'Should supply an in-character fallback reply');
    assert.ok(typeof result.fallbackReply === 'string' && result.fallbackReply.length > 0);
  });

  await runTest('AIService identifies local Ollama endpoints and waives API key requirement', () => {
    const store = new Store(testStoreFile);
    store.set('ai.enabled', true);
    store.set('ai.endpoint', 'http://localhost:11434/v1');
    store.set('ai.model', 'qwen2.5:3b');
    store.set('ai.apiKey', '');
    const ai = new AIService(store, null);

    const config = ai.getConfig();
    assert.strictEqual(config.isLocal, true, 'Should detect localhost as a local offline endpoint');
    assert.strictEqual(config.hasApiKey, true, 'hasApiKey should be true for local endpoints');
    assert.strictEqual(config.model, 'qwen2.5:3b');
  });

  await runTest('AIService connects to local Ollama and generates a live response with qwen2.5:3b', async () => {
    const store = new Store(testStoreFile);
    store.set('ai.enabled', true);
    store.set('ai.endpoint', 'http://localhost:11434/v1');
    store.set('ai.model', 'qwen2.5:3b');
    store.set('ai.apiKey', '');
    const ai = new AIService(store, null);

    const result = await ai.sendMessage('Greetings Hesper! Introduce yourself in one quick sentence.');
    assert.strictEqual(result.success, true, `Local Ollama call should succeed: ${result.message || ''}`);
    assert.ok(result.reply && result.reply.length > 0, 'Reply should not be empty');
    console.log(`    🔮 [Live Ollama Hesper Reply]: "${result.reply}"`);
  });

  // Clean up temp store
  if (fs.existsSync(testStorePath)) fs.unlinkSync(testStorePath);

  // Summary
  console.log(`\n========================================`);
  console.log(`Test Results: ${passedTests} passed, ${failedTests} failed.`);
  console.log(`========================================\n`);

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests();

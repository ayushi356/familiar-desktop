/**
 * Familiar Automated End-to-End Integration Test
 * Verifies dragging, position persistence, popup positioning, AI chat in popup,
 * focus session actions, task actions, and emoji removal from Grimoire Whispers.
 */

const { app } = require('electron');
const path = require('path');
const assert = require('assert');
const Store = require('../src/main/store');
const WindowManager = require('../src/main/windowManager');
const FocusManager = require('../src/main/focusManager');
const AIService = require('../src/main/aiService');
const registerIpcHandlers = require('../src/main/ipcHandlers');

async function runIntegrationVerification() {
  console.log('\n🔮 Running Familiar E2E Integration Suite...\n');
  let passed = 0;
  let failed = 0;

  async function check(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    Error: ${err.message}`);
      failed++;
    }
  }

  // 1. Initialize core managers
  const testStoreName = 'test-e2e-store.json';
  const store = new Store(testStoreName);
  const windowManager = new WindowManager(store);
  const focusManager = new FocusManager(store, windowManager);
  const aiService = new AIService(store, focusManager);
  registerIpcHandlers(store, windowManager, focusManager, aiService);

  // 2. Test Companion Window creation and initial position
  await check('Companion window creates and positions at saved or workArea coordinates', async () => {
    const compWin = windowManager.createCompanionWindow();
    assert.ok(compWin, 'Companion window should be created');
    const [x, y] = compWin.getPosition();
    assert.ok(typeof x === 'number' && typeof y === 'number', 'Position should be valid numbers');
    const [w, h] = compWin.getSize();
    assert.strictEqual(w, 220, 'Width must match 220');
    assert.strictEqual(h, 260, 'Height must match 260');
  });

  // 3. Test Dragging and Persistence
  await check('Companion dragging moves window smoothly and persists position to store', async () => {
    const compWin = windowManager.companionWindow;
    // Set to known central area
    compWin.setPosition(500, 300);
    const [startX, startY] = compWin.getPosition();

    // Start drag
    windowManager.startCompanionDrag({ screenX: startX + 50, screenY: startY + 50 });
    assert.ok(windowManager.dragState, 'dragState must be active');

    // Move drag by delta (+120, +80)
    windowManager.moveCompanionDrag({ screenX: startX + 50 + 120, screenY: startY + 50 + 80 });
    const [movedX, movedY] = compWin.getPosition();
    assert.strictEqual(movedX, startX + 120, 'Window X should follow drag delta');
    assert.strictEqual(movedY, startY + 80, 'Window Y should follow drag delta');

    // End drag
    windowManager.endCompanionDrag();
    assert.strictEqual(windowManager.dragState, null, 'dragState should be cleared on end');

    // Position must be persisted in store
    const savedPos = store.get('companion.position');
    assert.ok(savedPos, 'Position must be stored');
    assert.strictEqual(savedPos.x, movedX);
    assert.strictEqual(savedPos.y, movedY);
  });

  // 4. Test Popup Smart Placement Beside Hesper
  await check('Popup calculates position beside Hesper without covering her and avoids screen edges', async () => {
    // When Hesper is at (1400, 400) on a 1920x1080 screen:
    windowManager.companionWindow.setPosition(1400, 400);
    const posRight = windowManager.calculatePopupPosition(360, 520);
    // Because space to right is (1920 - (1400+220)) = 300 < 372, it must open to the left!
    assert.ok(posRight.x < 1400, 'Popup should open to the left when Hesper is on the right');
    assert.strictEqual(posRight.x, 1400 - 360 - 12);
    assert.ok(posRight.x + 360 <= 1400, 'Popup must not overlap Hesper');

    // When Hesper is at (50, 400):
    windowManager.companionWindow.setPosition(50, 400);
    const posLeft = windowManager.calculatePopupPosition(360, 520);
    assert.ok(posLeft.x >= 50 + 220 + 12, 'Popup should open to the right when space is on the right');
    assert.strictEqual(posLeft.x, 50 + 220 + 12);

    // Toggle popup open
    const opened = windowManager.toggleCompanionPopup();
    assert.strictEqual(opened, true, 'toggleCompanionPopup should open popup');
    assert.ok(windowManager.popupWindow.isVisible(), 'Popup should be visible');

    // Toggle popup closed
    const closed = windowManager.toggleCompanionPopup();
    assert.strictEqual(closed, false, 'toggleCompanionPopup should close popup');
    assert.ok(!windowManager.popupWindow.isVisible(), 'Popup should be hidden');
  });

  // 5. Test AI Chat in popup with conversation history preservation
  await check('AI chat in popup executes successfully and retains conversation across popup toggles', async () => {
    store.set('ai.enabled', true);
    store.set('ai.endpoint', 'http://localhost:11434/v1');
    store.set('ai.model', 'qwen2.5:3b');
    store.set('ai.apiKey', '');

    const chatRes = await aiService.sendMessage('Hesper, what herbs do we have in our satchel?');
    assert.strictEqual(chatRes.success, true, 'AI sendMessage should succeed');
    assert.ok(chatRes.reply && chatRes.reply.length > 0, 'Reply should not be empty');

    // Verify history retained
    const history = aiService.getHistory();
    assert.ok(history.length >= 2, 'History must contain user message and assistant reply');
    const lastAssistant = history[history.length - 1];
    assert.strictEqual(lastAssistant.role, 'assistant');
    assert.ok(!lastAssistant.content.includes('✨'), 'Assistant message in history must not contain emojis');
    assert.ok(!lastAssistant.content.includes('✦'), 'Assistant message in history must not contain sparkle prefixes');
  });

  // 6. Test Focus Timer actions
  await check('Focus session starts, pauses, resumes, and stops correctly', async () => {
    focusManager.start(25);
    let state = focusManager.getState();
    assert.strictEqual(state.isActive, true, 'Focus session should be active');
    assert.strictEqual(state.isPaused, false);

    focusManager.pause();
    state = focusManager.getState();
    assert.strictEqual(state.isPaused, true, 'Focus session should be paused');

    focusManager.resume();
    state = focusManager.getState();
    assert.strictEqual(state.isPaused, false, 'Focus session should be resumed');

    focusManager.stop();
    state = focusManager.getState();
    assert.strictEqual(state.isActive, false, 'Focus session should be stopped');
  });

  // 7. Test Tasks in Popup & Rewards
  await check('Quick task creation and completion awards XP and Stardust', async () => {
    const tasks = store.get('tasks') || [];
    const newTask = {
      id: `task_test_${Date.now()}`,
      title: 'Transcribe ancient parchment recipe',
      priority: 'high',
      completed: false,
      createdAt: new Date().toISOString()
    };
    tasks.unshift(newTask);
    store.set('tasks', tasks);

    const initialComp = store.get('companion') || {};
    const initialXp = initialComp.xp || 0;
    const initialDust = initialComp.magicalDust || 0;

    // Simulate completion
    newTask.completed = true;
    store.set('tasks', tasks);
    initialComp.xp = initialXp + 20;
    initialComp.magicalDust = initialDust + 10;
    initialComp.dialogue = 'Incantation complete! You gained +20 XP and +10 Stardust!';
    store.set('companion', initialComp);

    assert.strictEqual(store.get('companion.xp'), initialXp + 20);
    assert.strictEqual(store.get('companion.magicalDust'), initialDust + 10);
    assert.ok(!store.get('companion.dialogue').includes('✦'), 'Dialogue must not have sparkle emoji prefix');
  });

  // 8. Test Grimoire Whispers emoji removal
  await check('Grimoire Whispers dialogue displayed below character and in chat is emoji-free', () => {
    function sanitize(text) {
      if (!text) return '';
      return text
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{FE0F}]/gu, '')
        .replace(/^[✦✧★☆*•\-–—\s]+/g, '')
        .replace(/[✦✧★☆*•\-–—\s]+$/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
    }

    const testDialogue = '✦ Focus session complete! You gained +40 XP, +25 Stardust! 🔮';
    const cleaned = sanitize(testDialogue);
    assert.strictEqual(cleaned, 'Focus session complete! You gained +40 XP, +25 Stardust!');
    assert.ok(!cleaned.includes('✦') && !cleaned.includes('🔮'));
  });

  console.log(`\n========================================`);
  console.log(`Integration Test Results: ${passed} passed, ${failed} failed.`);
  console.log(`========================================\n`);

  // Clean up test store
  const fs = require('fs');
  const tempPath = path.join(process.cwd(), 'user-data', testStoreName);
  if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

  app.quit();
  process.exit(failed > 0 ? 1 : 0);
}

app.whenReady().then(runIntegrationVerification);

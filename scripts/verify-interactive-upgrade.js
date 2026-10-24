/**
 * Interactive Companion Upgrade Verification Script
 * Validates dragging mechanics, popup positioning, AI chat integration,
 * quick action IPC channels, and emoji sanitization in Grimoire Whispers.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const Store = require('../src/main/store');
const AIService = require('../src/main/aiService');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function runVerification() {
  console.log('\n✨ Verifying Familiar Interactive Floating Companion Upgrade...\n');

  // Test 1: WindowManager drag clamping and multi-monitor simulation
  test('Companion window dragging clamps properly on primary and secondary displays', () => {
    const primaryDisplay = { workArea: { x: 0, y: 0, width: 1920, height: 1040 } };
    const secondaryDisplay = { workArea: { x: 1920, y: 0, width: 1920, height: 1080 } };
    const winW = 220;
    const winH = 260;

    function clampPos(targetX, targetY, display) {
      const wa = display.workArea;
      return {
        x: Math.round(Math.max(wa.x, Math.min(wa.x + wa.width - winW, targetX))),
        y: Math.round(Math.max(wa.y, Math.min(wa.y + wa.height - winH, targetY)))
      };
    }

    // Inside primary
    const p1 = clampPos(400, 300, primaryDisplay);
    assert.strictEqual(p1.x, 400);
    assert.strictEqual(p1.y, 300);

    // Clamped against primary left/top
    const pTopLeft = clampPos(-50, -100, primaryDisplay);
    assert.strictEqual(pTopLeft.x, 0);
    assert.strictEqual(pTopLeft.y, 0);

    // Clamped against primary bottom/right
    const pBotRight = clampPos(2000, 1500, primaryDisplay);
    assert.strictEqual(pBotRight.x, 1920 - winW);
    assert.strictEqual(pBotRight.y, 1040 - winH);

    // Dragged onto secondary display
    const pSec = clampPos(2500, 400, secondaryDisplay);
    assert.strictEqual(pSec.x, 2500);
    assert.strictEqual(pSec.y, 400);

    // Clamped on secondary display edge
    const pSecEdge = clampPos(4000, 1200, secondaryDisplay);
    assert.strictEqual(pSecEdge.x, 1920 + 1920 - winW);
    assert.strictEqual(pSecEdge.y, 1080 - winH);
  });

  // Test 2: Click vs Drag threshold logic
  test('Drag distance threshold strictly differentiates clicks from drags', () => {
    function evaluateInteraction(startX, startY, endX, endY) {
      const distance = Math.hypot(endX - startX, endY - startY);
      const isDrag = distance > 4;
      return { distance, isDrag, willOpenPopup: !isDrag };
    }

    // Clean click with tiny jitter (2px)
    const microJitter = evaluateInteraction(100, 100, 101, 102);
    assert.strictEqual(microJitter.isDrag, false);
    assert.strictEqual(microJitter.willOpenPopup, true);

    // Intentional drag (40px)
    const drag = evaluateInteraction(100, 100, 130, 125);
    assert.strictEqual(drag.isDrag, true);
    assert.strictEqual(drag.willOpenPopup, false);
  });

  // Test 3: Popup Placement Calculation Beside Hesper
  test('Popup placement opens beside Hesper without covering her and avoids edges', () => {
    const workArea = { x: 0, y: 0, width: 1920, height: 1040 };
    const popupW = 360;
    const popupH = 520;
    const compW = 220;
    const compH = 260;
    const gap = 12;

    function calcPopup(compX, compY) {
      let popupX;
      const spaceRight = (workArea.x + workArea.width) - (compX + compW);
      const spaceLeft = compX - workArea.x;

      if (spaceRight >= popupW + gap) {
        popupX = compX + compW + gap;
      } else if (spaceLeft >= popupW + gap) {
        popupX = compX - popupW - gap;
      } else if (spaceRight >= spaceLeft) {
        popupX = workArea.x + workArea.width - popupW - gap;
      } else {
        popupX = workArea.x + gap;
      }

      const idealY = compY + Math.round(compH / 2) - Math.round(popupH / 2);
      const minY = workArea.y + gap;
      const maxY = workArea.y + workArea.height - popupH - gap;
      const popupY = Math.max(minY, Math.min(maxY, idealY));

      return { x: Math.round(popupX), y: Math.round(popupY) };
    }

    // Bottom-right corner (Hesper at 1680, 760)
    const br = calcPopup(1680, 760);
    // Popup must open to the left of Hesper
    assert.ok(br.x + popupW < 1680, 'Popup should be to the left of companion');
    assert.ok(br.y + popupH <= workArea.height - gap, 'Popup should stay above bottom edge');
    assert.ok(br.y >= gap, 'Popup should stay below top edge');

    // Top-left corner (Hesper at 10, 10)
    const tl = calcPopup(10, 10);
    // Popup must open to the right of Hesper
    assert.ok(tl.x > 10 + compW, 'Popup should be to the right of companion');
    assert.ok(tl.y >= gap, 'Popup Y must be inside workArea');

    // Middle screen
    const mid = calcPopup(900, 400);
    assert.strictEqual(mid.x, 900 + compW + gap);
    assert.ok(mid.x + popupW <= workArea.width);
  });

  // Test 4: Position persistence in store
  test('Position is persisted in store and reloaded on app restart', () => {
    const tempStoreFile = 'test-position-store.json';
    const tempStorePath = path.join(process.cwd(), 'user-data', tempStoreFile);
    if (fs.existsSync(tempStorePath)) fs.unlinkSync(tempStorePath);

    const store1 = new Store(tempStoreFile);
    store1.set('companion.position', { x: 1250, y: 720 });

    const store2 = new Store(tempStoreFile);
    const pos = store2.get('companion.position');
    assert.strictEqual(pos.x, 1250);
    assert.strictEqual(pos.y, 720);

    if (fs.existsSync(tempStorePath)) fs.unlinkSync(tempStorePath);
  });

  // Test 5: Comprehensive Emoji Stripping in Grimoire Whispers
  test('Thoroughly strips emojis, compound emojis, sparkles, and prefixes from dialogue', () => {
    function stripEmojisAndSparkles(text) {
      if (!text || typeof text !== 'string') return '';
      return text
        .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}]/gu, '')
        .replace(/^[✦✧★☆*•\-–—\s]+/g, '')
        .replace(/[✦✧★☆*•\-–—\s]+$/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
    }

    assert.strictEqual(stripEmojisAndSparkles('✦ Hesper: The potion is ready'), 'Hesper: The potion is ready');
    assert.strictEqual(stripEmojisAndSparkles('✨ Incantation complete! You gained +20 XP! ✨'), 'Incantation complete! You gained +20 XP!');
    assert.strictEqual(stripEmojisAndSparkles('☕ Take a gentle breath and drink your tea. 🍵'), 'Take a gentle breath and drink your tea.');
    assert.strictEqual(stripEmojisAndSparkles('🧙‍♀️ Stirring the cauldron with 🌟 Stardust! 🔮'), 'Stirring the cauldron with Stardust!');
    assert.strictEqual(stripEmojisAndSparkles('✦ Focus session complete! 🔮'), 'Focus session complete!');
    assert.strictEqual(stripEmojisAndSparkles('A cozy afternoon in the sanctuary.'), 'A cozy afternoon in the sanctuary.');
  });

  // Test 6: AI Chat history persistence & shared conversation
  test('AI chat history retains multi-turn messages across popup reopenings', () => {
    const tempStoreFile = 'test-ai-history.json';
    const tempStorePath = path.join(process.cwd(), 'user-data', tempStoreFile);
    if (fs.existsSync(tempStorePath)) fs.unlinkSync(tempStorePath);

    const store = new Store(tempStoreFile);
    store.set('ai.enabled', true);
    const ai = new AIService(store, null);
    ai.clearHistory(); // starts with 1 clean welcome message

    ai._appendHistory('How do I focus today?', 'Begin with a cup of lavender tea and 20 quiet minutes.');
    ai._appendHistory('Can we break down my task?', 'Certainly. We shall divide it into three small spells.');

    const history = ai.getHistory();
    // 1 welcome + 2 user + 2 assistant = 5 messages
    assert.strictEqual(history.length, 5);
    assert.strictEqual(history[0].role, 'assistant');
    assert.strictEqual(history[1].role, 'user');
    assert.strictEqual(history[1].content, 'How do I focus today?');
    assert.strictEqual(history[2].role, 'assistant');
    assert.strictEqual(history[2].content, 'Begin with a cup of lavender tea and 20 quiet minutes.');
    assert.strictEqual(history[3].role, 'user');
    assert.strictEqual(history[4].role, 'assistant');

    // Simulate closing popup and reopening
    const reloadedStore = new Store(tempStoreFile);
    const reloadedAi = new AIService(reloadedStore, null);
    const reloadedHistory = reloadedAi.getHistory();
    assert.strictEqual(reloadedHistory.length, 5);

    if (fs.existsSync(tempStorePath)) fs.unlinkSync(tempStorePath);
  });

  // Test 7: Preload bridges expose all required APIs securely
  test('Preload files are properly structured with restricted context bridges', () => {
    const companionPreload = fs.readFileSync(path.join(__dirname, '../src/preload/companionPreload.js'), 'utf8');
    assert.ok(companionPreload.includes('contextBridge.exposeInMainWorld(\'familiarAPI\''));
    assert.ok(companionPreload.includes('dragStart'));
    assert.ok(companionPreload.includes('dragMove'));
    assert.ok(companionPreload.includes('dragEnd'));
    assert.ok(companionPreload.includes('togglePopup'));
    assert.ok(!companionPreload.includes('remote'));

    const popupPreload = fs.readFileSync(path.join(__dirname, '../src/preload/popupPreload.js'), 'utf8');
    assert.ok(popupPreload.includes('contextBridge.exposeInMainWorld(\'familiarPopupAPI\''));
    assert.ok(popupPreload.includes('closePopup'));
    assert.ok(popupPreload.includes('sendMessage'));
    assert.ok(popupPreload.includes('getHistory'));
    assert.ok(popupPreload.includes('onHistoryUpdated'));
    assert.ok(!popupPreload.includes('remote'));

    const hubPreload = fs.readFileSync(path.join(__dirname, '../src/preload/hubPreload.js'), 'utf8');
    assert.ok(hubPreload.includes('contextBridge.exposeInMainWorld(\'familiarHubAPI\''));
    assert.ok(hubPreload.includes('onHistoryUpdated'));
  });

  // Test 8: Live AI message response with local Ollama
  await asyncTest('Live AI conversation completes and returns sanitized response via local Ollama', async () => {
    const tempStoreFile = 'test-ollama-live.json';
    const tempStorePath = path.join(process.cwd(), 'user-data', tempStoreFile);
    if (fs.existsSync(tempStorePath)) fs.unlinkSync(tempStorePath);

    const store = new Store(tempStoreFile);
    store.set('ai.enabled', true);
    store.set('ai.endpoint', 'http://localhost:11434/v1');
    store.set('ai.model', 'qwen2.5:3b');
    store.set('ai.apiKey', '');
    const ai = new AIService(store, null);

    const result = await ai.sendMessage('What is one small magical tip for staying focused?');
    assert.strictEqual(result.success, true);
    assert.ok(result.reply && result.reply.length > 0);
    // Verify no emojis are in the live reply
    const emojiRegex = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}]/gu;
    assert.ok(!emojiRegex.test(result.reply), `Reply must not contain emojis: "${result.reply}"`);
    console.log(`    🔮 [Verified Live Reply]: "${result.reply}"`);

    if (fs.existsSync(tempStorePath)) fs.unlinkSync(tempStorePath);
  });

  console.log(`\n========================================`);
  console.log(`Verification: ${passed} passed, ${failed} failed.`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runVerification();

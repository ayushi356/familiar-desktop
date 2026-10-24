/**
 * Familiar — Floating Companion Popup Interaction Panel Logic
 */

// Helper to strip emojis and decorative symbols from dialogue and chat
function stripEmojisAndSparkles(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}]/gu, '')
    .replace(/^[✦✧★☆*•\-–—\s]+/g, '')
    .replace(/[✦✧★☆*•\-–—\s]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatMessageTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatTimer(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// UI Elements Map
const elements = {
  avatar: document.getElementById('popup-avatar'),
  name: document.getElementById('popup-companion-name'),
  moodBadge: document.getElementById('popup-mood-badge'),
  bondSubtitle: document.getElementById('popup-bond-subtitle'),
  headerFocusPill: document.getElementById('header-focus-pill'),
  headerFocusTime: document.getElementById('header-focus-time'),
  btnOpenSanctuary: document.getElementById('btn-open-sanctuary'),
  btnClosePopup: document.getElementById('btn-close-popup'),

  // Tabs
  tabBtnChat: document.getElementById('tab-btn-chat'),
  tabBtnActions: document.getElementById('tab-btn-actions'),
  tabChat: document.getElementById('tab-chat'),
  tabActions: document.getElementById('tab-actions'),

  // Chat
  chatStream: document.getElementById('popup-chat-stream'),
  typingIndicator: document.getElementById('popup-typing-indicator'),
  errorBanner: document.getElementById('popup-error-banner'),
  errorText: document.getElementById('popup-error-text'),
  btnRetry: document.getElementById('btn-popup-retry'),
  chatInput: document.getElementById('popup-chat-input'),
  btnSend: document.getElementById('btn-popup-send'),
  promptChips: document.querySelectorAll('.prompt-chip'),

  // Focus
  focusBadge: document.getElementById('action-focus-badge'),
  focusTimer: document.getElementById('action-focus-timer'),
  focusSub: document.getElementById('action-focus-sub'),
  btnFocusStartResume: document.getElementById('btn-focus-start-resume'),
  textFocusStartResume: document.getElementById('text-focus-start-resume'),
  btnFocusPause: document.getElementById('btn-focus-pause'),
  btnFocusStop: document.getElementById('btn-focus-stop'),

  // Tasks
  taskCountBadge: document.getElementById('action-task-count-badge'),
  taskBox: document.getElementById('current-task-box'),
  taskTitle: document.getElementById('current-task-title'),
  taskPriority: document.getElementById('current-task-priority'),
  btnCompleteTask: document.getElementById('btn-complete-task'),
  quickTaskForm: document.getElementById('quick-task-form'),
  inputQuickTask: document.getElementById('input-quick-task'),

  // Care & Shortcuts
  btnActionTalk: document.getElementById('btn-action-talk'),
  btnActionRest: document.getElementById('btn-action-rest'),
  btnQuickSanctuary: document.getElementById('btn-quick-open-sanctuary'),
  btnQuickSettings: document.getElementById('btn-quick-open-settings')
};

let currentTasks = [];
let currentActiveTaskId = null;
let lastFailedMessage = '';
let currentFocusState = { isActive: false, isPaused: false, remainingSeconds: 25 * 60 };

/* ================= ICON INJECTION ================= */
function initPopupIcons() {
  const iconMappings = {
    'icon-header-sanctuary': 'companion',
    'icon-tab-chat': 'talk',
    'icon-tab-actions': 'focus',
    'icon-card-focus': 'focus',
    'icon-card-tasks': 'tasks',
    'icon-card-companion': 'companion',
    'icon-card-sanctuary': 'companion',
    'icon-focus-play': 'play',
    'icon-focus-pause': 'pause',
    'icon-focus-stop': 'stop',
    'icon-care-talk': 'talk',
    'icon-care-rest': 'rest',
    'icon-shortcut-hub': 'companion',
    'icon-shortcut-settings': 'settings'
  };

  for (const [id, iconName] of Object.entries(iconMappings)) {
    const el = document.getElementById(id);
    if (el && typeof getIconSvg === 'function') {
      el.innerHTML = getIconSvg(iconName);
    }
  }
}

/* ================= TAB NAVIGATION ================= */
function switchTab(tabId) {
  if (tabId === 'tab-chat') {
    elements.tabBtnChat.classList.add('active');
    elements.tabBtnActions.classList.remove('active');
    elements.tabChat.classList.add('active');
    elements.tabActions.classList.remove('active');
  } else {
    elements.tabBtnActions.classList.add('active');
    elements.tabBtnChat.classList.remove('active');
    elements.tabActions.classList.add('active');
    elements.tabChat.classList.remove('active');
  }
}

/* ================= COMPANION STATUS ================= */
function updateCompanionView(companion) {
  if (!companion) return;

  if (elements.name) elements.name.textContent = companion.name || 'Hesper';
  if (elements.moodBadge) elements.moodBadge.textContent = capitalize(companion.mood || 'Cozy');
  if (elements.bondSubtitle) {
    const level = companion.level || 1;
    const dust = companion.magicalDust || 0;
    elements.bondSubtitle.textContent = `Level ${level} • ${dust} Stardust`;
  }

  if (elements.avatar && typeof renderWitchCharacter === 'function') {
    renderWitchCharacter(elements.avatar, {
      state: companion.currentState || 'idle',
      size: 'compact'
    });
  }
}

/* ================= AI CHAT ================= */
function appendChatBubble(role, content, timestamp = Date.now(), isFallback = false) {
  if (!elements.chatStream) return;

  const clean = stripEmojisAndSparkles(content);
  if (!clean) return;

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role === 'user' ? 'bubble-user' : 'bubble-hesper'}`;

  const timeStr = formatMessageTime(timestamp);

  if (role === 'assistant') {
    const senderTag = isFallback ? 'Hesper (Resting)' : 'Hesper';
    bubble.innerHTML = `
      <div class="bubble-sender">${senderTag}</div>
      <div class="bubble-text">${escapeHtml(clean)}</div>
      <div class="bubble-time">${timeStr}</div>
    `;
  } else {
    bubble.innerHTML = `
      <div class="bubble-text">${escapeHtml(clean)}</div>
      <div class="bubble-time">${timeStr}</div>
    `;
  }

  elements.chatStream.appendChild(bubble);
  elements.chatStream.scrollTop = elements.chatStream.scrollHeight;
}

async function loadChatHistory() {
  if (!window.familiarPopupAPI?.ai || !elements.chatStream) return;
  try {
    const history = await window.familiarPopupAPI.ai.getHistory();
    elements.chatStream.innerHTML = '';
    if (Array.isArray(history) && history.length > 0) {
      history.forEach(msg => {
        appendChatBubble(msg.role, msg.content, msg.timestamp);
      });
    } else {
      appendChatBubble('assistant', 'Greetings, seeker of quiet magic. What spells or goals are we weaving today?', Date.now());
    }
  } catch (err) {
    console.error('Error loading popup chat history:', err);
  }
}

async function sendChatMessage(text) {
  if (!text || !text.trim() || !window.familiarPopupAPI?.ai) return;
  const clean = text.trim();

  // 1. Append user message
  appendChatBubble('user', clean, Date.now());
  if (elements.chatInput) {
    elements.chatInput.value = '';
    elements.chatInput.style.height = 'auto';
  }

  // 2. Show typing indicator
  if (elements.typingIndicator) elements.typingIndicator.style.display = 'flex';
  if (elements.errorBanner) elements.errorBanner.style.display = 'none';
  if (elements.btnSend) elements.btnSend.disabled = true;

  try {
    const result = await window.familiarPopupAPI.ai.sendMessage(clean);
    if (elements.typingIndicator) elements.typingIndicator.style.display = 'none';
    if (elements.btnSend) elements.btnSend.disabled = false;

    if (result.success) {
      appendChatBubble('assistant', result.reply, Date.now());
      const comp = await window.familiarPopupAPI.companion.getState();
      updateCompanionView(comp);
    } else {
      lastFailedMessage = clean;
      if (elements.errorBanner) {
        elements.errorBanner.style.display = 'flex';
        if (elements.errorText) elements.errorText.textContent = result.message || 'Error whispering to Hesper.';
      }
      if (result.fallbackReply) {
        appendChatBubble('assistant', result.fallbackReply, Date.now(), true);
      }
    }
  } catch (err) {
    if (elements.typingIndicator) elements.typingIndicator.style.display = 'none';
    if (elements.btnSend) elements.btnSend.disabled = false;
    lastFailedMessage = clean;
    if (elements.errorBanner) {
      elements.errorBanner.style.display = 'flex';
      if (elements.errorText) elements.errorText.textContent = `Connection error: ${err.message}`;
    }
  }
}

/* ================= FOCUS SESSION ================= */
function updateFocusUI(state) {
  if (!state) return;
  currentFocusState = state;

  const seconds = state.remainingSeconds || 0;
  const formatted = formatTimer(seconds);

  // Big Action Timer
  if (elements.focusTimer) elements.focusTimer.textContent = formatted;

  // Header Pill
  if (state.isActive) {
    elements.headerFocusPill.classList.remove('hidden');
    elements.headerFocusTime.textContent = formatted;
  } else {
    elements.headerFocusPill.classList.add('hidden');
  }

  // Action Status Tag & Buttons
  if (!state.isActive) {
    elements.focusBadge.className = 'status-tag tag-idle';
    elements.focusBadge.textContent = 'Idle';
    elements.focusSub.textContent = '25-minute study interval';
    elements.textFocusStartResume.textContent = 'Start (25m)';
    elements.btnFocusStartResume.disabled = false;
    elements.btnFocusPause.disabled = true;
    elements.btnFocusStop.disabled = true;
  } else if (state.isPaused) {
    elements.focusBadge.className = 'status-tag tag-paused';
    elements.focusBadge.textContent = 'Paused';
    elements.focusSub.textContent = 'Session paused';
    elements.textFocusStartResume.textContent = 'Resume';
    elements.btnFocusStartResume.disabled = false;
    elements.btnFocusPause.disabled = true;
    elements.btnFocusStop.disabled = false;
  } else {
    elements.focusBadge.className = 'status-tag tag-active';
    elements.focusBadge.textContent = 'Active';
    elements.focusSub.textContent = `${capitalize(state.mode || 'focus')} in progress`;
    elements.textFocusStartResume.textContent = 'Running';
    elements.btnFocusStartResume.disabled = true;
    elements.btnFocusPause.disabled = false;
    elements.btnFocusStop.disabled = false;
  }
}

async function loadFocusState() {
  if (!window.familiarPopupAPI?.focus) return;
  try {
    const state = await window.familiarPopupAPI.focus.getState();
    updateFocusUI(state);
  } catch (err) {
    console.error('Error loading focus state:', err);
  }
}

/* ================= GRIMOIRE TASKS ================= */
function renderTasksUI(tasks) {
  currentTasks = tasks || [];
  const incomplete = currentTasks.filter(t => !t.completed);

  elements.taskCountBadge.textContent = `${incomplete.length} pending`;

  if (incomplete.length > 0) {
    const current = incomplete[0];
    currentActiveTaskId = current.id;
    elements.taskTitle.textContent = current.title;
    elements.taskPriority.textContent = capitalize(current.priority || 'medium');
    elements.taskPriority.className = `priority-tag priority-${current.priority || 'medium'}`;
    elements.taskPriority.classList.remove('hidden');
    elements.btnCompleteTask.classList.remove('hidden');
  } else {
    currentActiveTaskId = null;
    elements.taskTitle.textContent = 'All incantations completed';
    elements.taskPriority.classList.add('hidden');
    elements.btnCompleteTask.classList.add('hidden');
  }
}

async function loadTasks() {
  if (!window.familiarPopupAPI?.tasks) return;
  try {
    const tasks = await window.familiarPopupAPI.tasks.getAll();
    renderTasksUI(tasks);
  } catch (err) {
    console.error('Error loading tasks in popup:', err);
  }
}

/* ================= INITIALIZATION & LISTENERS ================= */
async function initPopup() {
  initPopupIcons();

  // Escape key closes popup
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.familiarPopupAPI.closePopup();
    }
  });

  // Close button
  elements.btnClosePopup.addEventListener('click', () => {
    window.familiarPopupAPI.closePopup();
  });

  // Sanctuary buttons
  elements.btnOpenSanctuary.addEventListener('click', () => {
    window.familiarPopupAPI.hub.open('companion');
    window.familiarPopupAPI.closePopup();
  });

  elements.btnQuickSanctuary.addEventListener('click', () => {
    window.familiarPopupAPI.hub.open('companion');
    window.familiarPopupAPI.closePopup();
  });

  elements.btnQuickSettings.addEventListener('click', () => {
    window.familiarPopupAPI.hub.open('settings');
    window.familiarPopupAPI.closePopup();
  });

  // Tab switching
  elements.tabBtnChat.addEventListener('click', () => switchTab('tab-chat'));
  elements.tabBtnActions.addEventListener('click', () => switchTab('tab-actions'));

  // Chat Input Handling
  elements.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage(elements.chatInput.value);
    }
  });

  elements.btnSend.addEventListener('click', () => {
    sendChatMessage(elements.chatInput.value);
  });

  // Auto-resize chat textarea
  elements.chatInput.addEventListener('input', () => {
    elements.chatInput.style.height = 'auto';
    elements.chatInput.style.height = `${Math.min(80, elements.chatInput.scrollHeight)}px`;
  });

  // Prompt chips
  elements.promptChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.dataset.prompt;
      if (prompt) {
        switchTab('tab-chat');
        sendChatMessage(prompt);
      }
    });
  });

  // Retry failed message
  elements.btnRetry.addEventListener('click', () => {
    if (lastFailedMessage) {
      sendChatMessage(lastFailedMessage);
    }
  });

  // Focus Timer actions
  elements.btnFocusStartResume.addEventListener('click', async () => {
    if (currentFocusState.isPaused) {
      await window.familiarPopupAPI.focus.resume();
    } else if (!currentFocusState.isActive) {
      await window.familiarPopupAPI.focus.start(25);
    }
  });

  elements.btnFocusPause.addEventListener('click', async () => {
    await window.familiarPopupAPI.focus.pause();
  });

  elements.btnFocusStop.addEventListener('click', async () => {
    await window.familiarPopupAPI.focus.stop();
  });

  // Tasks actions
  elements.btnCompleteTask.addEventListener('click', async () => {
    if (!currentActiveTaskId) return;
    await window.familiarPopupAPI.tasks.update(currentActiveTaskId, { completed: true });
    await loadTasks();
    const comp = await window.familiarPopupAPI.companion.getState();
    updateCompanionView(comp);
  });

  elements.quickTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const val = elements.inputQuickTask.value.trim();
    if (!val) return;
    await window.familiarPopupAPI.tasks.create({ title: val, priority: 'medium' });
    elements.inputQuickTask.value = '';
    await loadTasks();
  });

  // Care actions
  elements.btnActionTalk.addEventListener('click', async () => {
    const updated = await window.familiarPopupAPI.companion.interact('talk');
    updateCompanionView(updated);
    switchTab('tab-chat');
    if (updated.dialogue) {
      appendChatBubble('assistant', updated.dialogue, Date.now());
    }
  });

  elements.btnActionRest.addEventListener('click', async () => {
    const updated = await window.familiarPopupAPI.companion.interact('rest');
    updateCompanionView(updated);
    if (updated.dialogue) {
      appendChatBubble('assistant', updated.dialogue, Date.now());
    }
  });

  // Event Listeners from Main Process
  window.familiarPopupAPI.focus.onTick((focusData) => {
    updateFocusUI(focusData);
  });

  window.familiarPopupAPI.tasks.onUpdate((tasks) => {
    renderTasksUI(tasks);
  });

  window.familiarPopupAPI.onCompanionUpdate((comp) => {
    updateCompanionView(comp);
  });

  if (window.familiarPopupAPI.ai?.onHistoryUpdated) {
    window.familiarPopupAPI.ai.onHistoryUpdated(() => {
      loadChatHistory();
    });
  }

  window.familiarPopupAPI.onPopupOpened(() => {
    refreshAllPopupData();
  });

  // Initial Data Load
  await refreshAllPopupData();
}

async function refreshAllPopupData() {
  try {
    const comp = await window.familiarPopupAPI.companion.getState();
    updateCompanionView(comp);
    await loadFocusState();
    await loadTasks();
    await loadChatHistory();
  } catch (err) {
    console.error('Error refreshing popup data:', err);
  }
}

document.addEventListener('DOMContentLoaded', initPopup);

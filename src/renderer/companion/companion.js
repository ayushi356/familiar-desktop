/**
 * Companion Floating Window Renderer Logic
 */

const elements = {
  container: document.getElementById('companion-root'),
  stage: document.getElementById('character-stage'),
  mount: document.getElementById('character-mount'),
  speechBubble: document.getElementById('speech-bubble'),
  speechText: document.getElementById('speech-text'),
  focusPill: document.getElementById('focus-pill'),
  focusTimer: document.getElementById('focus-pill-timer'),
  btnInteract: document.getElementById('btn-interact'),
  btnOpenHub: document.getElementById('btn-open-hub'),
  btnPin: document.getElementById('btn-pin-window')
};

let dialogueTimer = null;

// Speech Bubble Helper
function showDialogue(text, duration = 6000) {
  if (!text) return;
  elements.speechText.textContent = text;
  elements.speechBubble.classList.remove('hidden');

  if (dialogueTimer) clearTimeout(dialogueTimer);
  if (duration > 0) {
    dialogueTimer = setTimeout(() => {
      elements.speechBubble.classList.add('hidden');
    }, duration);
  }
}

function hideDialogue() {
  if (dialogueTimer) clearTimeout(dialogueTimer);
  elements.speechBubble.classList.add('hidden');
}

// State & Mood Manager
function applyCompanionState(data) {
  if (!data) return;

  const state = data.currentState || 'idle';
  renderWitchCharacter(elements.mount, { state, size: 'compact' });

  // If new dialogue is provided, display speech bubble
  if (data.dialogue) {
    showDialogue(data.dialogue);
  }
}

// Mini focus pill timer helper
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Event Listeners & IPC
async function initCompanion() {
  try {
    const initialState = await window.familiarAPI.getCompanionState();
    applyCompanionState(initialState);
  } catch (err) {
    console.error('Failed to load initial companion state:', err);
  }

  // Character stage click interaction
  elements.stage.addEventListener('click', async (e) => {
    // Avoid triggering drag or multiple clicks
    const res = await window.familiarAPI.interact('pet');
    if (res && res.dialogue) {
      showDialogue(res.dialogue);
    }
  });

  // Speech bubble dismiss on click
  elements.speechBubble.addEventListener('click', hideDialogue);

  // Quick buttons
  elements.btnInteract.addEventListener('click', async (e) => {
    e.stopPropagation();
    const res = await window.familiarAPI.interact('talk');
    if (res && res.dialogue) {
      showDialogue(res.dialogue);
    }
  });

  elements.btnOpenHub.addEventListener('click', (e) => {
    e.stopPropagation();
    window.familiarAPI.openHub('companion');
  });

  elements.btnPin.addEventListener('click', async (e) => {
    e.stopPropagation();
    const isPinned = await window.familiarAPI.toggleAlwaysOnTop();
    showDialogue(isPinned ? 'I shall stay in the front of your desktop.' : 'I shall rest behind your other windows now.', 3000);
  });

  // Focus pill click opens focus tab in hub
  elements.focusPill.addEventListener('click', (e) => {
    e.stopPropagation();
    window.familiarAPI.openHub('focus');
  });

  // Listen for updates from main process
  window.familiarAPI.onUpdate((updatedData) => {
    applyCompanionState(updatedData);
  });

  // Listen for focus timer events
  window.familiarAPI.onFocusUpdate((focusData) => {
    if (!focusData || !focusData.isActive) {
      elements.focusPill.classList.add('hidden');
    } else {
      elements.focusPill.classList.remove('hidden');
      elements.focusTimer.textContent = formatTime(focusData.remainingSeconds || 0);
    }
  });
}

document.addEventListener('DOMContentLoaded', initCompanion);

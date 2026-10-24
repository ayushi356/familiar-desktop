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
let lastPopupBlurTime = 0;
let isPopupOpen = false;

// Helper to strip emojis and decorative symbols from speech bubble
function stripEmojisAndSparkles(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}]/gu, '')
    .replace(/^[✦✧★☆*•\-–—\s]+/g, '')
    .replace(/[✦✧★☆*•\-–—\s]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Speech Bubble Helper
function showDialogue(text, duration = 6000) {
  if (!text) return;
  const clean = stripEmojisAndSparkles(text);
  elements.speechText.textContent = clean;
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

  // Pointer-based Dragging & Click Distinction
  let isPointerDown = false;
  let hasDragged = false;
  let startScreenX = 0;
  let startScreenY = 0;

  const handlePointerDown = (e) => {
    // Only drag on primary (left) button
    if (e.button !== 0) return;
    isPointerDown = true;
    hasDragged = false;
    startScreenX = e.screenX;
    startScreenY = e.screenY;

    try {
      elements.stage.setPointerCapture(e.pointerId);
    } catch {}

    window.familiarAPI.dragStart({ screenX: e.screenX, screenY: e.screenY });
  };

  const handlePointerMove = (e) => {
    if (!isPointerDown) return;
    const distance = Math.hypot(e.screenX - startScreenX, e.screenY - startScreenY);
    if (distance > 4) {
      if (!hasDragged) {
        hasDragged = true;
        elements.stage.classList.add('is-dragging');
        hideDialogue();
      }
      window.familiarAPI.dragMove({ screenX: e.screenX, screenY: e.screenY });
    }
  };

  const handlePointerUp = async (e) => {
    if (!isPointerDown) return;
    isPointerDown = false;
    elements.stage.classList.remove('is-dragging');

    try {
      elements.stage.releasePointerCapture(e.pointerId);
    } catch {}

    window.familiarAPI.dragEnd();

    // If dragged beyond threshold, do not treat as a click
    if (hasDragged) {
      return;
    }

    // Distinguish click from recent blur
    if (Date.now() - lastPopupBlurTime < 250) {
      return;
    }

    // Clean normal click: toggle interactive popup beside Hesper!
    try {
      await window.familiarAPI.togglePopup();
    } catch (err) {
      console.error('Failed to toggle popup:', err);
    }
  };

  const handlePointerCancel = (e) => {
    if (!isPointerDown) return;
    isPointerDown = false;
    elements.stage.classList.remove('is-dragging');
    try {
      elements.stage.releasePointerCapture(e.pointerId);
    } catch {}
    window.familiarAPI.dragEnd();
  };

  elements.stage.addEventListener('pointerdown', handlePointerDown);
  elements.stage.addEventListener('pointermove', handlePointerMove);
  elements.stage.addEventListener('pointerup', handlePointerUp);
  elements.stage.addEventListener('pointercancel', handlePointerCancel);

  // Backup listeners on window to ensure fast cursor motions never drop drag tracking
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);

  // Speech bubble dismiss on click
  elements.speechBubble.addEventListener('click', hideDialogue);

  // Quick buttons
  elements.btnInteract.addEventListener('click', async (e) => {
    e.stopPropagation();
    // Toggle popup directly when clicking talk button
    await window.familiarAPI.togglePopup();
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

  // Track popup visibility
  window.familiarAPI.onPopupVisibilityChanged((isOpen) => {
    isPopupOpen = isOpen;
    if (!isOpen) {
      lastPopupBlurTime = Date.now();
    }
  });
}

document.addEventListener('DOMContentLoaded', initCompanion);

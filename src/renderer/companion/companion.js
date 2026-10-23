/**
 * Companion Floating Window Renderer Logic
 */

const elements = {
  container: document.getElementById('companion-root'),
  stage: document.getElementById('character-stage'),
  character: document.getElementById('witch-character'),
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

  // Clear existing state-* classes
  const classes = Array.from(elements.character.classList).filter(c => !c.startsWith('state-'));
  elements.character.className = classes.join(' ');

  // Add active state class
  const state = data.currentState || 'idle';
  elements.character.classList.add(`state-${state}`);

  // Dynamic prop rendering for states
  const propContainer = document.getElementById('character-prop');
  if (propContainer) {
    if (state === 'reading') {
      propContainer.innerHTML = `
        <svg viewBox="0 0 40 30" width="36" height="26">
          <path d="M 5 22 Q 20 18 20 8 Q 20 18 35 22 Q 20 26 5 22" fill="#5c3826" stroke="#f6c177" stroke-width="1"/>
          <path d="M 6 20 Q 19 16 19 9 Q 19 16 34 20 Q 19 23 6 20" fill="#fdfbf7"/>
          <circle cx="20" cy="14" r="2" fill="#c4a7e7"/>
        </svg>
      `;
    } else if (state === 'brewing') {
      propContainer.innerHTML = `
        <svg viewBox="0 0 40 30" width="34" height="24">
          <ellipse cx="20" cy="22" rx="14" ry="7" fill="#1b1222" stroke="#9ccfd8" stroke-width="1.2"/>
          <ellipse cx="20" cy="17" rx="12" ry="4" fill="#9ccfd8" opacity="0.6"/>
        </svg>
      `;
    } else {
      propContainer.innerHTML = '';
    }
  }

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

/**
 * Familiar Hub — Sanctuary Renderer Controller
 */

// Tab Switching
const navItems = document.querySelectorAll('.nav-item');
const tabPanes = document.querySelectorAll('.tab-pane');

function switchTab(tabId) {
  navItems.forEach(item => {
    if (item.dataset.tab === tabId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  tabPanes.forEach(pane => {
    if (pane.id === tabId) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });
}

navItems.forEach(item => {
  item.addEventListener('click', () => {
    switchTab(item.dataset.tab);
  });
});

// Window Controls
document.getElementById('btn-win-min').addEventListener('click', () => {
  window.familiarHubAPI.window.minimize();
});

document.getElementById('btn-win-close').addEventListener('click', () => {
  window.familiarHubAPI.window.close();
});

// Listen for external tab switch requests (e.g. from companion floating window)
window.familiarHubAPI.onTabRequested((targetTab) => {
  const fullId = targetTab.startsWith('tab-') ? targetTab : `tab-${targetTab}`;
  switchTab(fullId);
});

/* ========================================================
   ICON INITIALIZATION
======================================================== */
function initStaticIcons() {
  const iconMappings = {
    'nav-icon-companion': 'companion',
    'nav-icon-focus': 'focus',
    'nav-icon-tasks': 'tasks',
    'nav-icon-activity': 'activity',
    'nav-icon-inventory': 'inventory',
    'nav-icon-minigames': 'minigames',
    'nav-icon-settings': 'settings',
    'sidebar-shield-icon': 'shield',
    'header-stardust-icon': 'stardust',
    'icon-btn-talk': 'talk',
    'icon-btn-tea': 'tea',
    'icon-btn-study': 'study',
    'icon-btn-rest': 'rest',
    'activity-shield-icon': 'shield',
    'cauldron-svg-mount': 'cauldron'
  };

  for (const [elementId, iconName] of Object.entries(iconMappings)) {
    const el = document.getElementById(elementId);
    if (el) {
      el.innerHTML = getIconSvg(iconName);
    }
  }
}

/* ========================================================
   COMPANION SECTION
======================================================== */
const companionElements = {
  name: document.getElementById('sidebar-companion-name'),
  sidebarMood: document.getElementById('sidebar-companion-mood'),
  stardust: document.getElementById('companion-stardust'),
  roomDialogue: document.getElementById('room-dialogue-text'),
  level: document.getElementById('companion-level'),
  xpText: document.getElementById('companion-xp-text'),
  xpBar: document.getElementById('companion-xp-bar'),
  moodDetail: document.getElementById('companion-mood-detail'),
  stateBadge: document.getElementById('companion-state-badge'),
  roomWitchAvatar: document.getElementById('room-witch-avatar'),
  sidebarWitchAvatar: document.getElementById('sidebar-witch-avatar'),
  btnTalk: document.getElementById('btn-action-talk'),
  btnTea: document.getElementById('btn-action-tea'),
  btnStudy: document.getElementById('btn-action-study'),
  btnRest: document.getElementById('btn-action-rest')
};

function renderCompanion(data) {
  if (!data) return;
  companionElements.name.textContent = data.name || 'Hesper';
  companionElements.sidebarMood.textContent = capitalize(data.mood || 'Cozy');
  companionElements.moodDetail.textContent = capitalize(data.mood || 'Cozy');
  companionElements.stardust.textContent = data.magicalDust || 0;
  companionElements.level.textContent = data.level || 1;
  companionElements.stateBadge.textContent = capitalize(data.currentState || 'Idle');

  const xp = data.xp || 0;
  const xpMax = (data.level || 1) * 100;
  companionElements.xpText.textContent = `${xp} / ${xpMax} XP`;
  companionElements.xpBar.style.width = `${Math.min(100, Math.floor((xp / xpMax) * 100))}%`;

  if (data.dialogue) {
    companionElements.roomDialogue.textContent = `"${data.dialogue}"`;
  }

  // Render character in Sanctuary Room Scene & Sidebar
  const state = data.currentState || 'idle';
  if (companionElements.roomWitchAvatar) {
    renderWitchCharacter(companionElements.roomWitchAvatar, { state, size: 'large' });
  }
  if (companionElements.sidebarWitchAvatar) {
    renderWitchCharacter(companionElements.sidebarWitchAvatar, { state, size: 'compact' });
  }
}

async function handleCompanionAction(action) {
  try {
    const updated = await window.familiarHubAPI.companion.interact(action);
    renderCompanion(updated);
  } catch (err) {
    console.error('Companion interaction error:', err);
  }
}

companionElements.btnTalk.addEventListener('click', () => handleCompanionAction('talk'));
companionElements.btnTea.addEventListener('click', () => handleCompanionAction('tea'));
companionElements.btnStudy.addEventListener('click', () => handleCompanionAction('study'));
companionElements.btnRest.addEventListener('click', () => handleCompanionAction('rest'));

/* ========================================================
   FOCUS TIMER SECTION
======================================================== */
let selectedFocusMinutes = 25;
const focusTimerText = document.getElementById('focus-timer-text');
const focusStateLabel = document.getElementById('focus-state-label');
const focusGoalInput = document.getElementById('focus-goal-input');
const btnFocusStart = document.getElementById('btn-focus-start');
const btnFocusPause = document.getElementById('btn-focus-pause');
const btnFocusStop = document.getElementById('btn-focus-stop');
const statFocusCompleted = document.getElementById('stat-focus-completed');
const statFocusTotalMinutes = document.getElementById('stat-focus-total-minutes');
const timerModeButtons = document.querySelectorAll('.timer-mode-btn');

function formatSeconds(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

timerModeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    timerModeButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedFocusMinutes = parseInt(btn.dataset.minutes, 10);
    focusTimerText.textContent = `${selectedFocusMinutes.toString().padStart(2, '0')}:00`;
  });
});

btnFocusStart.addEventListener('click', async () => {
  await window.familiarHubAPI.focus.start(selectedFocusMinutes);
  btnFocusStart.disabled = true;
  btnFocusPause.disabled = false;
  btnFocusStop.disabled = false;
  focusStateLabel.textContent = 'Focus in progress...';
});

btnFocusPause.addEventListener('click', async () => {
  if (btnFocusPause.textContent === 'Pause') {
    await window.familiarHubAPI.focus.pause();
    btnFocusPause.textContent = 'Resume';
    focusStateLabel.textContent = 'Session paused';
  } else {
    await window.familiarHubAPI.focus.resume();
    btnFocusPause.textContent = 'Pause';
    focusStateLabel.textContent = 'Focus in progress...';
  }
});

btnFocusStop.addEventListener('click', async () => {
  await window.familiarHubAPI.focus.stop();
  btnFocusStart.disabled = false;
  btnFocusPause.disabled = true;
  btnFocusPause.textContent = 'Pause';
  btnFocusStop.disabled = true;
  focusStateLabel.textContent = 'Ready to begin';
  focusTimerText.textContent = `${selectedFocusMinutes.toString().padStart(2, '0')}:00`;
});

window.familiarHubAPI.focus.onTick((data) => {
  if (!data) return;
  if (data.remainingSeconds !== undefined) {
    focusTimerText.textContent = formatSeconds(data.remainingSeconds);
  }
  if (!data.isActive) {
    btnFocusStart.disabled = false;
    btnFocusPause.disabled = true;
    btnFocusPause.textContent = 'Pause';
    btnFocusStop.disabled = true;
    focusStateLabel.textContent = 'Session completed!';
    refreshAllData();
  }
});

/* ========================================================
   TASKS SECTION
======================================================== */
const tasksContainer = document.getElementById('tasks-container');
const newTaskTitle = document.getElementById('new-task-title');
const newTaskPriority = document.getElementById('new-task-priority');
const newTaskDueDate = document.getElementById('new-task-duedate');
const btnAddTask = document.getElementById('btn-add-task');
const taskBadgeCount = document.getElementById('task-badge-count');
const taskFilterBtns = document.querySelectorAll('.filter-btn');

let currentTaskFilter = 'all';
let allTasksList = [];

taskFilterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    taskFilterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTaskFilter = btn.dataset.filter;
    renderTasksList();
  });
});

async function loadTasks() {
  allTasksList = await window.familiarHubAPI.tasks.getAll();
  renderTasksList();
}

function renderTasksList() {
  const activeCount = allTasksList.filter(t => !t.completed).length;
  taskBadgeCount.textContent = activeCount;

  let filtered = allTasksList;
  if (currentTaskFilter === 'active') {
    filtered = allTasksList.filter(t => !t.completed);
  } else if (currentTaskFilter === 'completed') {
    filtered = allTasksList.filter(t => t.completed);
  }

  if (filtered.length === 0) {
    tasksContainer.innerHTML = '<div class="empty-state">No tasks in this view. Write a new incantation above!</div>';
    return;
  }

  tasksContainer.innerHTML = filtered.map(task => `
    <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
      <input type="checkbox" class="task-check" ${task.completed ? 'checked' : ''}>
      <span class="task-title">${escapeHtml(task.title)}</span>
      <span class="task-priority-badge task-priority-${task.priority}">${capitalize(task.priority)}</span>
      ${task.dueDate ? `<span class="task-date">📅 ${task.dueDate}</span>` : ''}
      <button class="btn-delete-task" title="Delete Task">✕</button>
    </div>
  `).join('');

  // Attach event handlers
  tasksContainer.querySelectorAll('.task-item').forEach(item => {
    const id = item.dataset.id;
    const check = item.querySelector('.task-check');
    const delBtn = item.querySelector('.btn-delete-task');

    check.addEventListener('change', async () => {
      await window.familiarHubAPI.tasks.update(id, { completed: check.checked });
      await loadTasks();
      const comp = await window.familiarHubAPI.companion.getState();
      renderCompanion(comp);
    });

    delBtn.addEventListener('click', async () => {
      await window.familiarHubAPI.tasks.delete(id);
      await loadTasks();
    });
  });
}

btnAddTask.addEventListener('click', async () => {
  const title = newTaskTitle.value.trim();
  if (!title) return;

  await window.familiarHubAPI.tasks.create({
    title,
    priority: newTaskPriority.value,
    dueDate: newTaskDueDate.value || null
  });

  newTaskTitle.value = '';
  newTaskDueDate.value = '';
  await loadTasks();
});

newTaskTitle.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') btnAddTask.click();
});

/* ========================================================
   ACTIVITY MONITOR SECTION
======================================================== */
const toggleMonitoring = document.getElementById('toggle-monitoring');
const monitoringStatusLabel = document.getElementById('monitoring-status-label');
const timeProductive = document.getElementById('time-productive');
const timeNeutral = document.getElementById('time-neutral');
const timeDistracting = document.getElementById('time-distracting');
const timeIdle = document.getElementById('time-idle');
const appsBreakdownList = document.getElementById('apps-breakdown-list');

toggleMonitoring.addEventListener('change', async () => {
  const enabled = toggleMonitoring.checked;
  monitoringStatusLabel.textContent = enabled ? 'Monitoring: Active' : 'Monitoring: Paused';
  await window.familiarHubAPI.activity.setMonitoring(enabled);
});

function formatMinutes(seconds) {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m`;
}

function renderActivitySummary(activityData) {
  if (!activityData || !activityData.dailySummary) return;
  const s = activityData.dailySummary;

  timeProductive.textContent = formatMinutes(s.productiveSeconds || 0);
  timeNeutral.textContent = formatMinutes(s.neutralSeconds || 0);
  timeDistracting.textContent = formatMinutes(s.distractingSeconds || 0);
  timeIdle.textContent = formatMinutes(s.idleSeconds || 0);

  const apps = s.appBreakdown || {};
  const entries = Object.entries(apps).sort((a, b) => b[1].seconds - a[1].seconds);

  if (entries.length === 0) {
    appsBreakdownList.innerHTML = '<div class="empty-state">No application activity recorded yet today.</div>';
    return;
  }

  const maxSec = Math.max(...entries.map(e => e[1].seconds), 1);

  appsBreakdownList.innerHTML = entries.slice(0, 8).map(([name, data]) => {
    const pct = Math.min(100, Math.round((data.seconds / maxSec) * 100));
    return `
      <div class="app-row">
        <span class="app-name" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
        <div class="app-meter">
          <div class="app-fill ${data.category || 'neutral'}" style="width: ${pct}%;"></div>
        </div>
        <span class="app-duration">${formatMinutes(data.seconds)}</span>
      </div>
    `;
  }).join('');
}

window.familiarHubAPI.activity.onUpdate((data) => {
  renderActivitySummary(data);
});

/* ========================================================
   INVENTORY & POTION BREWING SECTION
======================================================== */
const ingredientsGrid = document.getElementById('inventory-ingredients-grid');
const sanctuaryCuriosGrid = document.getElementById('sanctuary-curios-grid');
const brewIngredientsSelector = document.getElementById('brew-ingredients-selector');
const brewSlot1 = document.getElementById('brew-slot-1');
const brewSlot2 = document.getElementById('brew-slot-2');
const btnBrewPotion = document.getElementById('btn-brew-potion');
const btnClearSlots = document.getElementById('btn-clear-slots');
const brewResultMessage = document.getElementById('brew-result-message');
const discoveredRecipesList = document.getElementById('discovered-recipes-list');

let selectedBrewSlots = [null, null];

const INGREDIENT_META = {
  'moon-dew': { name: 'Moon Dew', iconKey: 'moon-dew', desc: 'Distilled starlight moisture' },
  'starlight-moss': { name: 'Starlight Moss', iconKey: 'starlight-moss', desc: 'Glowing cave moss' },
  'nightshade-petal': { name: 'Nightshade Petal', iconKey: 'nightshade-petal', desc: 'Fragrant purple petal' },
  'crystal-amber': { name: 'Crystal Amber', iconKey: 'crystal-amber', desc: 'Fossilized magical resin' }
};

const CURIOS_META = [
  { id: 'candle-cluster', name: 'Candle Cluster', iconKey: 'curio-candle', desc: 'Soft, warm amber glow', unlocked: true },
  { id: 'amethyst-orb', name: 'Amethyst Orb', iconKey: 'curio-orb', desc: 'Unlocks at Level 3', unlocked: false },
  { id: 'shadow-cat', name: 'Shadow Cat', iconKey: 'curio-cat', desc: 'Unlocks at Level 5', unlocked: false }
];

function renderInventory(inv) {
  if (!inv) return;
  const ingredients = inv.ingredients || {};

  // Render satchel reagents with clean SVGs
  ingredientsGrid.innerHTML = Object.entries(ingredients).map(([id, qty]) => {
    const meta = INGREDIENT_META[id] || { name: id, iconKey: 'companion', desc: 'Reagent' };
    return `
      <div class="ingredient-card">
        <div class="ingredient-icon-slot">${getIconSvg(meta.iconKey)}</div>
        <span class="ingredient-name">${meta.name}</span>
        <span class="ingredient-qty">x${qty}</span>
      </div>
    `;
  }).join('');

  // Render curios with clean SVGs
  if (sanctuaryCuriosGrid) {
    sanctuaryCuriosGrid.innerHTML = CURIOS_META.map(curio => `
      <div class="curio-card ${curio.unlocked ? 'unlocked' : 'locked'}">
        <div class="curio-icon-slot">${getIconSvg(curio.iconKey)}</div>
        <span class="curio-name">${curio.name}</span>
        <span class="curio-desc">${curio.desc}</span>
      </div>
    `).join('');
  }

  // Render brewing ingredient picker
  brewIngredientsSelector.innerHTML = Object.entries(ingredients)
    .filter(([_, qty]) => qty > 0)
    .map(([id, qty]) => {
      const meta = INGREDIENT_META[id] || { name: id, iconKey: 'companion' };
      return `
        <button class="picker-item" data-id="${id}">
          <span style="width:16px;height:16px;display:inline-flex;">${getIconSvg(meta.iconKey)}</span>
          <span>${meta.name} (${qty})</span>
        </button>
      `;
    }).join('');

  brewIngredientsSelector.querySelectorAll('.picker-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const ingId = btn.dataset.id;
      if (!selectedBrewSlots[0]) {
        selectedBrewSlots[0] = ingId;
      } else if (!selectedBrewSlots[1]) {
        selectedBrewSlots[1] = ingId;
      } else {
        selectedBrewSlots[0] = ingId;
      }
      updateBrewSlots();
    });
  });

  // Render discovered recipes
  const recipes = inv.discoveredRecipes || [];
  if (recipes.length === 0) {
    discoveredRecipesList.innerHTML = '<div class="empty-state">No recipes discovered yet. Experiment with combinations!</div>';
  } else {
    discoveredRecipesList.innerHTML = recipes.map(r => `
      <div class="recipe-entry" style="padding: 7px 12px; background: rgba(26,16,34,0.65); border: 1px solid var(--border-card); border-radius: 6px; font-size: 0.8rem;">
        <strong style="color:var(--accent-gold-bright);">✦ ${escapeHtml(r.name)}</strong>: <span style="color:var(--text-secondary);">${escapeHtml(r.description || 'A magical elixir')}</span>
      </div>
    `).join('');
  }
}

function updateBrewSlots() {
  [brewSlot1, brewSlot2].forEach((slot, idx) => {
    const ingId = selectedBrewSlots[idx];
    if (ingId) {
      const meta = INGREDIENT_META[ingId] || { name: ingId, iconKey: 'companion' };
      slot.classList.add('filled');
      slot.innerHTML = `<span style="width:20px;height:20px;">${getIconSvg(meta.iconKey)}</span><span>${meta.name}</span>`;
    } else {
      slot.classList.remove('filled');
      slot.innerHTML = 'Empty';
    }
  });

  btnBrewPotion.disabled = !(selectedBrewSlots[0] && selectedBrewSlots[1]);
}

btnClearSlots.addEventListener('click', () => {
  selectedBrewSlots = [null, null];
  updateBrewSlots();
  brewResultMessage.textContent = '';
});

btnBrewPotion.addEventListener('click', async () => {
  if (!selectedBrewSlots[0] || !selectedBrewSlots[1]) return;

  btnBrewPotion.disabled = true;
  brewResultMessage.textContent = 'Stirring cauldron with lavender essence...';

  const result = await window.familiarHubAPI.inventory.craftPotion(selectedBrewSlots);
  brewResultMessage.innerHTML = `✦ <strong style="color:var(--accent-gold-bright);">${escapeHtml(result.name)}</strong>: ${escapeHtml(result.message)}`;

  selectedBrewSlots = [null, null];
  updateBrewSlots();
  refreshAllData();
});

/* ========================================================
   SETTINGS SECTION
======================================================== */
const settingAlwaysOnTop = document.getElementById('setting-always-on-top');
const settingCompanionName = document.getElementById('setting-companion-name');
const settingRemindersEnabled = document.getElementById('setting-reminders-enabled');
const settingIdleThreshold = document.getElementById('setting-idle-threshold');
const btnSaveSettings = document.getElementById('btn-save-settings');
const newRuleProcess = document.getElementById('new-rule-process');
const newRuleCategory = document.getElementById('new-rule-category');
const btnAddRule = document.getElementById('btn-add-rule');
const rulesTableContainer = document.getElementById('rules-table-container');

let activeCategories = {};

function renderRulesTable() {
  const entries = Object.entries(activeCategories);
  if (entries.length === 0) {
    rulesTableContainer.innerHTML = '<div class="empty-state">No category rules configured.</div>';
    return;
  }

  rulesTableContainer.innerHTML = entries.map(([proc, cat]) => `
    <div class="rule-row" data-process="${escapeHtml(proc)}">
      <code>${escapeHtml(proc)}</code>
      <span class="task-priority-badge task-priority-${cat === 'productive' ? 'low' : cat === 'distracting' ? 'high' : 'medium'}">
        ${capitalize(cat)}
      </span>
      <button class="btn-delete-rule" style="background:transparent;border:none;color:#eb6f92;cursor:pointer;">✕</button>
    </div>
  `).join('');

  rulesTableContainer.querySelectorAll('.rule-row').forEach(row => {
    const proc = row.dataset.process;
    row.querySelector('.btn-delete-rule').addEventListener('click', () => {
      delete activeCategories[proc];
      renderRulesTable();
    });
  });
}

btnAddRule.addEventListener('click', () => {
  const proc = newRuleProcess.value.trim().toLowerCase();
  if (!proc) return;
  activeCategories[proc] = newRuleCategory.value;
  newRuleProcess.value = '';
  renderRulesTable();
});

btnSaveSettings.addEventListener('click', async () => {
  const newSettings = {
    alwaysOnTop: settingAlwaysOnTop.checked,
    remindersEnabled: settingRemindersEnabled.checked,
    idleThresholdMinutes: parseInt(settingIdleThreshold.value, 10) || 5,
    categories: activeCategories
  };

  await window.familiarHubAPI.settings.update(newSettings);
  const newName = settingCompanionName.value.trim();
  if (newName) {
    await window.familiarHubAPI.companion.updateName(newName);
  }

  btnSaveSettings.textContent = 'Saved!';
  setTimeout(() => { btnSaveSettings.textContent = 'Save Settings'; }, 2000);
  refreshAllData();
});

/* ========================================================
   GLOBAL DATA REFRESH & INIT
======================================================== */
async function refreshAllData() {
  try {
    const comp = await window.familiarHubAPI.companion.getState();
    renderCompanion(comp);

    const sett = await window.familiarHubAPI.settings.get();
    if (sett) {
      settingAlwaysOnTop.checked = sett.alwaysOnTop ?? true;
      settingRemindersEnabled.checked = sett.remindersEnabled ?? true;
      settingIdleThreshold.value = sett.idleThresholdMinutes || 5;
      activeCategories = { ...(sett.categories || {}) };
      renderRulesTable();
    }

    const inv = await window.familiarHubAPI.inventory.get();
    renderInventory(inv);

    const act = await window.familiarHubAPI.activity.getSummary();
    renderActivitySummary(act);

    const focusState = await window.familiarHubAPI.focus.getState();
    if (focusState) {
      statFocusCompleted.textContent = focusState.completedSessions || 0;
      statFocusTotalMinutes.textContent = focusState.totalFocusMinutes || 0;
    }

    await loadTasks();
  } catch (err) {
    console.error('Error refreshing sanctuary data:', err);
  }
}

// Helpers
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
  initStaticIcons();
  refreshAllData();
});

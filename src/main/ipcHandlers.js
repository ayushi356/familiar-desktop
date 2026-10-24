const { ipcMain } = require('electron');

/**
 * Validated, Secure IPC Handlers
 * Sanitizes all arguments and enforces channel contracts between main and renderers.
 */
function registerIpcHandlers(store, windowManager, focusManager, aiService) {
  /* ================= COMPANION ================= */
  ipcMain.handle('companion:getState', async () => {
    return store.get('companion');
  });

  ipcMain.handle('companion:interact', async (event, action) => {
    const validActions = ['pet', 'talk', 'tea', 'study', 'rest'];
    const safeAction = validActions.includes(action) ? action : 'talk';

    const companion = store.get('companion') || {};
    let dialogue = '';
    let state = 'idle';
    let mood = companion.mood || 'cozy';
    let xpGained = 5;

    switch (safeAction) {
      case 'pet':
        mood = 'cozy';
        state = 'celebrating';
        dialogue = "You gently pet Hesper's hat. She purrs with a quiet, spark-filled warmth.";
        break;
      case 'tea':
        mood = 'cozy';
        state = 'resting';
        dialogue = "Steaming chamomile and lavender tea warms the room. 'Thank you, friend.'";
        break;
      case 'study':
        mood = 'focused';
        state = 'reading';
        dialogue = "Hesper pulls open a dusty grimoire. 'Let us seek deeper wisdom together.'";
        xpGained = 10;
        break;
      case 'rest':
        mood = 'sleepy';
        state = 'sleeping';
        dialogue = "Hesper curls beneath her oversized hat for a gentle slumber. Zzz...";
        break;
      case 'talk':
      default:
        mood = 'curious';
        state = 'idle';
        const dialogueList = [
          "The candlelight dances gracefully across your screen.",
          "Remember to stretch your fingers and take a deep breath.",
          "Every great incantation begins with a single line of focus.",
          "I prepared the herbs should you need an elixir later.",
          "It is a lovely day to make quiet, steady progress."
        ];
        dialogue = dialogueList[Math.floor(Math.random() * dialogueList.length)];
        break;
    }

    // Award XP and check level up
    let newXp = (companion.xp || 0) + xpGained;
    let newLevel = companion.level || 1;
    const xpNeeded = newLevel * 100;

    if (newXp >= xpNeeded) {
      newLevel++;
      newXp = newXp - xpNeeded;
      dialogue += ` Hesper reached Companion Level ${newLevel}!`;
      // Grant free stardust on level up
      store.set('companion.magicalDust', (companion.magicalDust || 0) + 50);
    }

    companion.xp = newXp;
    companion.level = newLevel;
    companion.mood = mood;
    companion.currentState = state;
    companion.dialogue = dialogue;
    companion.lastInteracted = Date.now();

    store.set('companion', companion);
    windowManager.sendToAll('companion:updated', companion);

    return companion;
  });

  ipcMain.handle('companion:updateName', async (event, newName) => {
    if (typeof newName !== 'string') return false;
    const sanitized = newName.trim().slice(0, 30);
    if (!sanitized) return false;

    store.set('companion.name', sanitized);
    windowManager.sendToAll('companion:updated', store.get('companion'));
    return true;
  });

  /* ================= COMPANION DRAG & POSITION ================= */
  ipcMain.handle('companion:dragStart', async (event, data) => {
    if (data && typeof data.screenX === 'number' && typeof data.screenY === 'number') {
      windowManager.startCompanionDrag(data);
    }
    return true;
  });

  ipcMain.handle('companion:dragMove', async (event, data) => {
    if (data && typeof data.screenX === 'number' && typeof data.screenY === 'number') {
      windowManager.moveCompanionDrag(data);
    }
    return true;
  });

  ipcMain.handle('companion:dragEnd', async () => {
    windowManager.endCompanionDrag();
    return true;
  });

  ipcMain.handle('companion:resetPosition', async () => {
    windowManager.resetCompanionPosition();
    return true;
  });

  /* ================= POPUP WINDOW CONTROLS ================= */
  ipcMain.handle('companion:togglePopup', async () => {
    return windowManager.toggleCompanionPopup();
  });

  ipcMain.handle('companion:closePopup', async () => {
    windowManager.hideCompanionPopup();
    return true;
  });

  ipcMain.handle('popup:close', async () => {
    windowManager.hideCompanionPopup();
    return true;
  });

  ipcMain.handle('companion:isPopupOpen', async () => {
    return !!(windowManager.popupWindow && !windowManager.popupWindow.isDestroyed() && windowManager.popupWindow.isVisible());
  });

  /* ================= WINDOW CONTROLS ================= */
  ipcMain.handle('hub:open', async (event, tab = 'companion') => {
    const validTabs = ['companion', 'focus', 'tasks', 'activity', 'inventory', 'minigames', 'settings'];
    const safeTab = validTabs.includes(tab) ? tab : 'companion';
    windowManager.showHub(safeTab);
    return true;
  });

  ipcMain.handle('window:toggleAlwaysOnTop', async () => {
    return windowManager.toggleAlwaysOnTop();
  });

  ipcMain.handle('window:minimizeHub', async () => {
    if (windowManager.hubWindow) windowManager.hubWindow.minimize();
    return true;
  });

  ipcMain.handle('window:closeHub', async () => {
    if (windowManager.hubWindow) windowManager.hubWindow.hide();
    return true;
  });

  /* ================= TASKS ================= */
  ipcMain.handle('tasks:getAll', async () => {
    return store.get('tasks') || [];
  });

  ipcMain.handle('tasks:create', async (event, taskData) => {
    if (!taskData || typeof taskData.title !== 'string') return null;
    const title = taskData.title.trim().slice(0, 120);
    if (!title) return null;

    const validPriorities = ['high', 'medium', 'low'];
    const priority = validPriorities.includes(taskData.priority) ? taskData.priority : 'medium';
    const dueDate = typeof taskData.dueDate === 'string' ? taskData.dueDate.slice(0, 10) : null;

    const newTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title,
      priority,
      dueDate,
      completed: false,
      createdAt: new Date().toISOString()
    };

    const tasks = store.get('tasks') || [];
    tasks.unshift(newTask);
    store.set('tasks', tasks);
    windowManager.sendToAll('tasks:updated', tasks);
    return newTask;
  });

  ipcMain.handle('tasks:update', async (event, { id, updates }) => {
    if (!id || typeof updates !== 'object') return false;

    const tasks = store.get('tasks') || [];
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return false;

    const task = tasks[index];
    const wasCompleted = task.completed;
    const isNowCompleted = !!updates.completed;

    tasks[index] = { ...task, ...updates };
    store.set('tasks', tasks);
    windowManager.sendToAll('tasks:updated', tasks);

    // Reward for completing a task!
    if (!wasCompleted && isNowCompleted) {
      const comp = store.get('companion');
      comp.xp = (comp.xp || 0) + 20;
      comp.magicalDust = (comp.magicalDust || 0) + 10;
      comp.currentState = 'celebrating';
      comp.dialogue = `Incantation complete! You gained +20 XP and +10 Stardust!`;
      store.set('companion', comp);
      windowManager.sendToAll('companion:updated', comp);
    }

    return true;
  });

  ipcMain.handle('tasks:delete', async (event, id) => {
    if (typeof id !== 'string') return false;
    let tasks = store.get('tasks') || [];
    tasks = tasks.filter(t => t.id !== id);
    store.set('tasks', tasks);
    windowManager.sendToAll('tasks:updated', tasks);
    return true;
  });

  /* ================= FOCUS TIMER ================= */
  ipcMain.handle('focus:getState', async () => {
    return focusManager.getState();
  });

  ipcMain.handle('focus:start', async (event, durationMinutes) => {
    const mins = Math.max(1, Math.min(180, parseInt(durationMinutes, 10) || 25));
    focusManager.start(mins);
    return true;
  });

  ipcMain.handle('focus:pause', async () => {
    focusManager.pause();
    return true;
  });

  ipcMain.handle('focus:resume', async () => {
    focusManager.resume();
    return true;
  });

  ipcMain.handle('focus:stop', async () => {
    focusManager.stop();
    return true;
  });

  /* ================= ACTIVITY ================= */
  ipcMain.handle('activity:getSummary', async () => {
    return store.get('activity');
  });

  ipcMain.handle('activity:setMonitoring', async (event, enabled) => {
    const isEnabled = !!enabled;
    store.set('settings.monitoringEnabled', isEnabled);
    return isEnabled;
  });

  /* ================= INVENTORY & POTION BREWING ================= */
  ipcMain.handle('inventory:get', async () => {
    return store.get('inventory');
  });

  ipcMain.handle('inventory:craftPotion', async (event, selectedIngredients) => {
    if (!Array.isArray(selectedIngredients) || selectedIngredients.length !== 2) {
      return { success: false, name: 'Failed Brew', message: 'Select exactly two ingredients.' };
    }

    const [ing1, ing2] = selectedIngredients;
    const inv = store.get('inventory') || {};
    const stock = inv.ingredients || {};

    if (!stock[ing1] || stock[ing1] < 1 || !stock[ing2] || stock[ing2] < 1) {
      return { success: false, name: 'Depleted Herbs', message: 'You do not have enough ingredients.' };
    }

    // Deduct ingredients
    stock[ing1] -= 1;
    stock[ing2] -= 1;

    // Determine recipe
    const pair = [ing1, ing2].sort().join('+');
    let potionName = 'Experimental Elixir';
    let rewardDust = 15;
    let message = 'A curious shimmering vapor rises. +15 Stardust!';

    if (pair === 'moon-dew+starlight-moss') {
      potionName = 'Elixir of Clarity';
      rewardDust = 40;
      message = 'A luminous sapphire brew that sharpens the intellect! +40 Stardust!';
    } else if (pair === 'moon-dew+nightshade-petal') {
      potionName = 'Twilight Draught';
      rewardDust = 45;
      message = 'A velvet purple draught soothing the weary soul. +45 Stardust!';
    } else if (pair === 'nightshade-petal+starlight-moss') {
      potionName = 'Astral Essence';
      rewardDust = 50;
      message = 'Golden constellations drift in the vial! +50 Stardust!';
    }

    // Record recipe if new
    if (!inv.discoveredRecipes) inv.discoveredRecipes = [];
    if (!inv.discoveredRecipes.some(r => r.name === potionName)) {
      inv.discoveredRecipes.push({
        name: potionName,
        ingredients: [ing1, ing2],
        description: message
      });
    }

    store.set('inventory', inv);

    // Reward companion
    const comp = store.get('companion');
    comp.magicalDust = (comp.magicalDust || 0) + rewardDust;
    comp.xp = (comp.xp || 0) + 25;
    comp.currentState = 'brewing';
    comp.dialogue = `Potion crafted: ${potionName}! ${message}`;
    store.set('companion', comp);
    windowManager.sendToAll('companion:updated', comp);

    return {
      success: true,
      name: potionName,
      message,
      rewardDust
    };
  });

  /* ================= SETTINGS ================= */
  ipcMain.handle('settings:get', async () => {
    return store.get('settings');
  });

  ipcMain.handle('settings:update', async (event, newSettings) => {
    if (!newSettings || typeof newSettings !== 'object') return false;

    const current = store.get('settings') || {};
    const updated = {
      ...current,
      alwaysOnTop: newSettings.alwaysOnTop !== undefined ? !!newSettings.alwaysOnTop : current.alwaysOnTop,
      remindersEnabled: newSettings.remindersEnabled !== undefined ? !!newSettings.remindersEnabled : current.remindersEnabled,
      idleThresholdMinutes: Math.max(1, Math.min(60, newSettings.idleThresholdMinutes || 5)),
      categories: newSettings.categories ? { ...newSettings.categories } : current.categories
    };

    store.set('settings', updated);
    if (windowManager.companionWindow && !windowManager.companionWindow.isDestroyed()) {
      windowManager.companionWindow.setAlwaysOnTop(updated.alwaysOnTop);
    }
    if (windowManager.popupWindow && !windowManager.popupWindow.isDestroyed()) {
      windowManager.popupWindow.setAlwaysOnTop(updated.alwaysOnTop);
    }
    return updated;
  });

  /* ================= CONVERSATIONAL AI & MEMORY ================= */
  ipcMain.handle('ai:getConfig', async () => {
    if (!aiService) return { enabled: false, hasApiKey: false };
    return aiService.getConfig();
  });

  ipcMain.handle('ai:updateConfig', async (event, updates) => {
    if (!aiService) return false;
    return aiService.updateConfig(updates);
  });

  ipcMain.handle('ai:getPermittedContext', async () => {
    if (!aiService) return {};
    return aiService.getPermittedContext();
  });

  ipcMain.handle('ai:sendMessage', async (event, text) => {
    if (!aiService) {
      return {
        success: false,
        error: 'SERVICE_UNAVAILABLE',
        message: 'The AI service is not initialized.'
      };
    }
    const result = await aiService.sendMessage(text);
    if (result.success) {
      // Sync dialogue update to companion window
      windowManager.sendToAll('companion:updated', store.get('companion'));
    }
    // Broadcast refreshed history to both Hub and Popup windows
    windowManager.sendToAll('ai:historyUpdated', aiService.getHistory());
    return result;
  });

  ipcMain.handle('ai:getHistory', async () => {
    if (!aiService) return [];
    return aiService.getHistory();
  });

  ipcMain.handle('ai:clearHistory', async () => {
    if (!aiService) return [];
    const cleared = aiService.clearHistory();
    windowManager.sendToAll('ai:historyUpdated', cleared);
    return cleared;
  });

  ipcMain.handle('ai:getMemories', async () => {
    if (!aiService) return [];
    return aiService.getMemories();
  });

  ipcMain.handle('ai:saveMemory', async (event, text) => {
    if (!aiService) return null;
    return aiService.saveMemory(text);
  });

  ipcMain.handle('ai:deleteMemory', async (event, id) => {
    if (!aiService) return false;
    return aiService.deleteMemory(id);
  });
}

module.exports = registerIpcHandlers;

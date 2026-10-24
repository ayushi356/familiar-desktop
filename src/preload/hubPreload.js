const { contextBridge, ipcRenderer } = require('electron');

/**
 * Restricted Preload Bridge for Main Expanded Hub Window
 * Implements fine-grained channels with input validation in main process.
 */
contextBridge.exposeInMainWorld('familiarHubAPI', {
  // Window management
  window: {
    minimize: () => ipcRenderer.invoke('window:minimizeHub'),
    close: () => ipcRenderer.invoke('window:closeHub'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximizedHub')
  },

  // Companion data and direct interactions
  companion: {
    getState: () => ipcRenderer.invoke('companion:getState'),
    interact: (action) => ipcRenderer.invoke('companion:interact', action),
    updateName: (name) => ipcRenderer.invoke('companion:updateName', name)
  },

  // Focus & productivity
  focus: {
    getState: () => ipcRenderer.invoke('focus:getState'),
    start: (durationMinutes) => ipcRenderer.invoke('focus:start', durationMinutes),
    pause: () => ipcRenderer.invoke('focus:pause'),
    resume: () => ipcRenderer.invoke('focus:resume'),
    stop: () => ipcRenderer.invoke('focus:stop'),
    onTick: (callback) => {
      const sub = (event, data) => callback(data);
      ipcRenderer.on('focus:tick', sub);
      return () => ipcRenderer.removeListener('focus:tick', sub);
    }
  },

  // Task management
  tasks: {
    getAll: () => ipcRenderer.invoke('tasks:getAll'),
    create: (task) => ipcRenderer.invoke('tasks:create', task),
    update: (id, updates) => ipcRenderer.invoke('tasks:update', { id, updates }),
    delete: (id) => ipcRenderer.invoke('tasks:delete', id),
    onUpdate: (callback) => {
      const sub = (event, data) => callback(data);
      ipcRenderer.on('tasks:updated', sub);
      return () => ipcRenderer.removeListener('tasks:updated', sub);
    }
  },

  // Activity tracking and summaries
  activity: {
    getSummary: () => ipcRenderer.invoke('activity:getSummary'),
    setMonitoring: (enabled) => ipcRenderer.invoke('activity:setMonitoring', enabled),
    onUpdate: (callback) => {
      const sub = (event, data) => callback(data);
      ipcRenderer.on('activity:updated', sub);
      return () => ipcRenderer.removeListener('activity:updated', sub);
    }
  },

  // Inventory and recipes
  inventory: {
    get: () => ipcRenderer.invoke('inventory:get'),
    craftPotion: (ingredients) => ipcRenderer.invoke('inventory:craftPotion', ingredients)
  },

  // Settings
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (newSettings) => ipcRenderer.invoke('settings:update', newSettings)
  },

  // Conversational AI & Memory
  ai: {
    getConfig: () => ipcRenderer.invoke('ai:getConfig'),
    updateConfig: (updates) => ipcRenderer.invoke('ai:updateConfig', updates),
    getPermittedContext: () => ipcRenderer.invoke('ai:getPermittedContext'),
    sendMessage: (text) => ipcRenderer.invoke('ai:sendMessage', text),
    getHistory: () => ipcRenderer.invoke('ai:getHistory'),
    clearHistory: () => ipcRenderer.invoke('ai:clearHistory'),
    onHistoryUpdated: (callback) => {
      const sub = (event, history) => callback(history);
      ipcRenderer.on('ai:historyUpdated', sub);
      return () => ipcRenderer.removeListener('ai:historyUpdated', sub);
    },
    getMemories: () => ipcRenderer.invoke('ai:getMemories'),
    saveMemory: (text) => ipcRenderer.invoke('ai:saveMemory', text),
    deleteMemory: (id) => ipcRenderer.invoke('ai:deleteMemory', id)
  },

  // Event listeners for global updates
  onTabRequested: (callback) => {
    const sub = (event, tab) => callback(tab);
    ipcRenderer.on('hub:switchTab', sub);
    return () => ipcRenderer.removeListener('hub:switchTab', sub);
  }
});

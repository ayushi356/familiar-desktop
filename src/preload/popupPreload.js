const { contextBridge, ipcRenderer } = require('electron');

/**
 * Restricted Preload Bridge for Floating Companion Popup Window
 * Gives secure access to AI chat, Focus Timer, Tasks, Companion Interactions, and Hub navigation.
 */
contextBridge.exposeInMainWorld('familiarPopupAPI', {
  // Close / hide popup
  closePopup: () => ipcRenderer.invoke('popup:close'),

  // Companion status and interactions
  companion: {
    getState: () => ipcRenderer.invoke('companion:getState'),
    interact: (action) => ipcRenderer.invoke('companion:interact', action)
  },

  // Focus Timer controls
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

  // Grimoire Task management
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

  // AI Conversational mind
  ai: {
    getConfig: () => ipcRenderer.invoke('ai:getConfig'),
    sendMessage: (text) => ipcRenderer.invoke('ai:sendMessage', text),
    getHistory: () => ipcRenderer.invoke('ai:getHistory'),
    clearHistory: () => ipcRenderer.invoke('ai:clearHistory'),
    onHistoryUpdated: (callback) => {
      const sub = (event, history) => callback(history);
      ipcRenderer.on('ai:historyUpdated', sub);
      return () => ipcRenderer.removeListener('ai:historyUpdated', sub);
    }
  },

  // Hub window navigation
  hub: {
    open: (tab = 'companion') => ipcRenderer.invoke('hub:open', tab)
  },

  // Window event listeners
  onPopupOpened: (callback) => {
    const sub = (event, data) => callback(data);
    ipcRenderer.on('popup:opened', sub);
    return () => ipcRenderer.removeListener('popup:opened', sub);
  },

  onCompanionUpdate: (callback) => {
    const sub = (event, data) => callback(data);
    ipcRenderer.on('companion:updated', sub);
    return () => ipcRenderer.removeListener('companion:updated', sub);
  }
});

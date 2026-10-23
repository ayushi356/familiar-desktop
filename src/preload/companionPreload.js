const { contextBridge, ipcRenderer } = require('electron');

/**
 * Restricted Preload Bridge for Floating Companion Window
 * Exposes only safe, strictly-defined IPC methods to the renderer.
 */
contextBridge.exposeInMainWorld('familiarAPI', {
  // Request current companion state
  getCompanionState: () => ipcRenderer.invoke('companion:getState'),

  // Open the main expanded hub window (optionally to a specific tab)
  openHub: (tab = 'companion') => ipcRenderer.invoke('hub:open', tab),

  // Interact with the companion (e.g., poke/pet/talk)
  interact: (action) => ipcRenderer.invoke('companion:interact', action),

  // Toggle or get always on top setting
  toggleAlwaysOnTop: () => ipcRenderer.invoke('window:toggleAlwaysOnTop'),

  // Listen for state/dialogue changes pushed from main process
  onUpdate: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('companion:updated', subscription);
    return () => ipcRenderer.removeListener('companion:updated', subscription);
  },

  // Focus timer tick/status updates for mini display
  onFocusUpdate: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('focus:tick', subscription);
    return () => ipcRenderer.removeListener('focus:tick', subscription);
  }
});

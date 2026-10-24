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

  // Dragging support (smooth positioning via main process)
  dragStart: (data) => ipcRenderer.invoke('companion:dragStart', data),
  dragMove: (data) => ipcRenderer.invoke('companion:dragMove', data),
  dragEnd: () => ipcRenderer.invoke('companion:dragEnd'),
  resetPosition: () => ipcRenderer.invoke('companion:resetPosition'),

  // Interactive Popup controls
  togglePopup: () => ipcRenderer.invoke('companion:togglePopup'),
  closePopup: () => ipcRenderer.invoke('companion:closePopup'),
  isPopupOpen: () => ipcRenderer.invoke('companion:isPopupOpen'),

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
  },

  // Popup visibility changes
  onPopupVisibilityChanged: (callback) => {
    const subscription = (event, isOpen) => callback(isOpen);
    ipcRenderer.on('popup:visibilityChanged', subscription);
    return () => ipcRenderer.removeListener('popup:visibilityChanged', subscription);
  }
});

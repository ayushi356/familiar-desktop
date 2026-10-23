const { app } = require('electron');
const Store = require('./store');
const WindowManager = require('./windowManager');
const TrayManager = require('./trayManager');
const FocusManager = require('./focusManager');
const ActivityTracker = require('./activityTracker');
const registerIpcHandlers = require('./ipcHandlers');

// Enforce single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('[Familiar] Notice: Familiar is already running in the background. Focusing the active window.');
  app.quit();
  process.exit(0);
}

let store;
let windowManager;
let trayManager;
let focusManager;
let activityTracker;

app.isQuitting = false;

app.whenReady().then(() => {
  // 1. Initialize persistent storage
  store = new Store();

  // 2. Initialize Window Manager
  windowManager = new WindowManager(store);

  // 3. Initialize Focus Manager
  focusManager = new FocusManager(store, windowManager);

  // 4. Initialize Activity Tracker
  activityTracker = new ActivityTracker(store, windowManager);
  activityTracker.start();

  // 5. Register secure IPC communication channels
  registerIpcHandlers(store, windowManager, focusManager);

  // 6. Create Windows (Floating Companion + Sanctuary Hub)
  windowManager.createCompanionWindow();
  windowManager.createHubWindow();
  windowManager.showHub('companion');

  // 7. Initialize System Tray
  trayManager = new TrayManager(windowManager, store);
  trayManager.createTray();

  console.log('[Familiar] Application started successfully. Desktop companion and Sanctuary Hub are visible.');
});

// Second instance launch handler: bring existing windows to front
app.on('second-instance', () => {
  console.log('[Familiar] Second instance launched; bringing Familiar windows to front.');
  if (windowManager) {
    windowManager.showHub('companion');
    if (windowManager.companionWindow) {
      windowManager.companionWindow.show();
      windowManager.companionWindow.focus();
    }
  }
});

// Keep application alive when windows are hidden/closed (running in tray & desktop companion)
app.on('window-all-closed', () => {
  // On Windows, keep running in background/tray
});

app.on('before-quit', () => {
  app.isQuitting = true;
  if (activityTracker) {
    activityTracker.dispose();
  }
  if (focusManager) {
    focusManager.stop();
  }
});

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

  // 6. Create Windows
  windowManager.createCompanionWindow();
  windowManager.createHubWindow();

  // 7. Initialize System Tray
  trayManager = new TrayManager(windowManager, store);
  trayManager.createTray();

  console.log('[Familiar] Application started successfully.');
});

// Second instance launch handler: bring existing companion to front
app.on('second-instance', () => {
  if (windowManager) {
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

const { BrowserWindow, screen, app } = require('electron');
const path = require('path');

class WindowManager {
  constructor(store) {
    this.store = store;
    this.companionWindow = null;
    this.hubWindow = null;
  }

  createCompanionWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const workArea = primaryDisplay.workArea;

    const winWidth = 220;
    const winHeight = 260;

    // Default to bottom right above taskbar
    const defaultX = Math.round(workArea.x + workArea.width - winWidth - 24);
    const defaultY = Math.round(workArea.y + workArea.height - winHeight - 24);

    const alwaysOnTop = this.store.get('settings.alwaysOnTop') ?? true;

    this.companionWindow = new BrowserWindow({
      width: winWidth,
      height: winHeight,
      x: defaultX,
      y: defaultY,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      hasShadow: false,
      resizable: false,
      alwaysOnTop: alwaysOnTop,
      skipTaskbar: true,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, '../preload/companionPreload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true
      }
    });

    this.companionWindow.loadFile(path.join(__dirname, '../renderer/companion/index.html'));

    this.companionWindow.once('ready-to-show', () => {
      this.companionWindow.show();
      console.log(`[Familiar] Floating companion window ready at (${defaultX}, ${defaultY}).`);
    });

    this.companionWindow.webContents.on('console-message', (event, ...rest) => {
      const msg = event?.message || rest[1] || rest[0] || '';
      console.log(`[Companion UI] ${msg}`);
    });

    // Prevent navigation away from the application
    this.companionWindow.webContents.on('will-navigate', (event) => event.preventDefault());

    this.companionWindow.on('closed', () => {
      this.companionWindow = null;
    });

    return this.companionWindow;
  }

  createHubWindow() {
    this.hubWindow = new BrowserWindow({
      width: 880,
      height: 640,
      minWidth: 760,
      minHeight: 520,
      center: true,
      frame: false,
      transparent: false,
      backgroundColor: '#141018',
      show: false,
      webPreferences: {
        preload: path.join(__dirname, '../preload/hubPreload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true
      }
    });

    this.hubWindow.loadFile(path.join(__dirname, '../renderer/hub/index.html'));

    this.hubWindow.once('ready-to-show', () => {
      this.hubWindow.show();
      this.hubWindow.focus();
      console.log('[Familiar] Sanctuary Hub window ready and visible on screen.');
    });

    this.hubWindow.webContents.on('console-message', (event, ...rest) => {
      const msg = event?.message || rest[1] || rest[0] || '';
      console.log(`[Hub UI] ${msg}`);
    });

    this.hubWindow.webContents.on('will-navigate', (event) => event.preventDefault());

    // When user closes hub window, hide it instead of quitting so companion remains
    this.hubWindow.on('close', (event) => {
      if (!app.isQuitting) {
        event.preventDefault();
        this.hubWindow.hide();
      }
    });

    return this.hubWindow;
  }

  showHub(targetTab = 'companion') {
    if (!this.hubWindow || this.hubWindow.isDestroyed()) {
      this.createHubWindow();
      return;
    }

    if (this.hubWindow.isMinimized()) {
      this.hubWindow.restore();
    }

    this.hubWindow.show();
    this.hubWindow.focus();

    const sendTab = () => {
      if (this.hubWindow && !this.hubWindow.isDestroyed()) {
        this.hubWindow.webContents.send('hub:switchTab', targetTab);
      }
    };

    if (this.hubWindow.webContents.isLoading()) {
      this.hubWindow.webContents.once('did-finish-load', sendTab);
    } else {
      sendTab();
    }
  }

  toggleHub() {
    if (this.hubWindow && this.hubWindow.isVisible()) {
      this.hubWindow.hide();
    } else {
      this.showHub();
    }
  }

  toggleAlwaysOnTop() {
    if (!this.companionWindow) return false;
    const current = this.companionWindow.isAlwaysOnTop();
    const nextState = !current;
    this.companionWindow.setAlwaysOnTop(nextState);
    this.store.set('settings.alwaysOnTop', nextState);
    return nextState;
  }

  sendToCompanion(channel, data) {
    if (this.companionWindow && !this.companionWindow.isDestroyed()) {
      this.companionWindow.webContents.send(channel, data);
    }
  }

  sendToHub(channel, data) {
    if (this.hubWindow && !this.hubWindow.isDestroyed()) {
      this.hubWindow.webContents.send(channel, data);
    }
  }

  sendToAll(channel, data) {
    this.sendToCompanion(channel, data);
    this.sendToHub(channel, data);
  }
}

module.exports = WindowManager;

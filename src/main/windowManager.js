const { BrowserWindow, screen, app } = require('electron');
const path = require('path');

class WindowManager {
  constructor(store) {
    this.store = store;
    this.companionWindow = null;
    this.popupWindow = null;
    this.hubWindow = null;
    this.dragState = null;
    this.lastPopupBlurTime = 0;
  }

  createCompanionWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const workArea = primaryDisplay.workArea;

    const winWidth = 220;
    const winHeight = 260;

    // Default to bottom right above taskbar
    const defaultX = Math.round(workArea.x + workArea.width - winWidth - 24);
    const defaultY = Math.round(workArea.y + workArea.height - winHeight - 24);

    // Retrieve saved position if available and validate display bounds
    let initialX = defaultX;
    let initialY = defaultY;
    const savedPos = this.store.get('companion.position');
    if (savedPos && typeof savedPos.x === 'number' && typeof savedPos.y === 'number') {
      const nearestDisplay = screen.getDisplayNearestPoint({
        x: savedPos.x + Math.round(winWidth / 2),
        y: savedPos.y + Math.round(winHeight / 2)
      });
      const dispArea = nearestDisplay.workArea;
      initialX = Math.round(Math.max(dispArea.x, Math.min(dispArea.x + dispArea.width - winWidth, savedPos.x)));
      initialY = Math.round(Math.max(dispArea.y, Math.min(dispArea.y + dispArea.height - winHeight, savedPos.y)));
    } else {
      this.store.set('companion.position', { x: defaultX, y: defaultY });
    }

    const alwaysOnTop = this.store.get('settings.alwaysOnTop') ?? true;

    this.companionWindow = new BrowserWindow({
      width: winWidth,
      height: winHeight,
      x: initialX,
      y: initialY,
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
      console.log(`[Familiar] Floating companion window ready at (${initialX}, ${initialY}).`);
      // Also pre-create popup window so it opens instantly when Hesper is clicked
      this.createPopupWindow();
    });

    this.companionWindow.webContents.on('console-message', (event, ...rest) => {
      const msg = event?.message || rest[1] || rest[0] || '';
      console.log(`[Companion UI] ${msg}`);
    });

    // Prevent navigation away from the application
    this.companionWindow.webContents.on('will-navigate', (event) => event.preventDefault());

    this.companionWindow.on('closed', () => {
      this.companionWindow = null;
      if (this.popupWindow && !this.popupWindow.isDestroyed()) {
        this.popupWindow.destroy();
        this.popupWindow = null;
      }
    });

    return this.companionWindow;
  }

  createPopupWindow() {
    if (this.popupWindow && !this.popupWindow.isDestroyed()) {
      return this.popupWindow;
    }

    const alwaysOnTop = this.store.get('settings.alwaysOnTop') ?? true;

    this.popupWindow = new BrowserWindow({
      width: 360,
      height: 520,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      hasShadow: true,
      resizable: false,
      alwaysOnTop: alwaysOnTop,
      skipTaskbar: true,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, '../preload/popupPreload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true
      }
    });

    this.popupWindow.loadFile(path.join(__dirname, '../renderer/companion/popup.html'));

    this.popupWindow.webContents.on('console-message', (event, ...rest) => {
      const msg = event?.message || rest[1] || rest[0] || '';
      console.log(`[Popup UI] ${msg}`);
    });

    this.popupWindow.webContents.on('will-navigate', (event) => event.preventDefault());

    // Hide popup when user clicks outside (window loses focus)
    this.popupWindow.on('blur', () => {
      this.lastPopupBlurTime = Date.now();
      if (this.popupWindow && !this.popupWindow.isDestroyed() && this.popupWindow.isVisible()) {
        this.popupWindow.hide();
        this.sendToCompanion('popup:visibilityChanged', false);
      }
    });

    this.popupWindow.on('closed', () => {
      this.popupWindow = null;
    });

    return this.popupWindow;
  }

  calculatePopupPosition(popupW = 360, popupH = 520) {
    if (!this.companionWindow || this.companionWindow.isDestroyed()) {
      return { x: 100, y: 100 };
    }

    const [compX, compY] = this.companionWindow.getPosition();
    const [compW, compH] = this.companionWindow.getSize();

    const display = screen.getDisplayNearestPoint({
      x: compX + Math.round(compW / 2),
      y: compY + Math.round(compH / 2)
    });
    const workArea = display.workArea;

    const gap = 12;
    let popupX;

    // Determine horizontal position: prefer opening to the left if Hesper is on right side
    const spaceRight = (workArea.x + workArea.width) - (compX + compW);
    const spaceLeft = compX - workArea.x;

    if (spaceRight >= popupW + gap) {
      popupX = compX + compW + gap;
    } else if (spaceLeft >= popupW + gap) {
      popupX = compX - popupW - gap;
    } else if (spaceRight >= spaceLeft) {
      popupX = workArea.x + workArea.width - popupW - gap;
    } else {
      popupX = workArea.x + gap;
    }

    // Determine vertical position: align near center of companion, clamped to workArea
    const idealY = compY + Math.round(compH / 2) - Math.round(popupH / 2);
    const minY = workArea.y + gap;
    const maxY = workArea.y + workArea.height - popupH - gap;
    const popupY = Math.max(minY, Math.min(maxY, idealY));

    return { x: Math.round(popupX), y: Math.round(popupY) };
  }

  toggleCompanionPopup() {
    if (!this.popupWindow || this.popupWindow.isDestroyed()) {
      this.createPopupWindow();
    }

    if (this.popupWindow.isVisible()) {
      this.popupWindow.hide();
      this.sendToCompanion('popup:visibilityChanged', false);
      return false;
    } else {
      const { x, y } = this.calculatePopupPosition(360, 520);
      this.popupWindow.setPosition(x, y);
      this.popupWindow.show();
      this.popupWindow.focus();
      this.sendToCompanion('popup:visibilityChanged', true);
      this.sendToPopup('popup:opened', { x, y });
      return true;
    }
  }

  hideCompanionPopup() {
    if (this.popupWindow && !this.popupWindow.isDestroyed() && this.popupWindow.isVisible()) {
      this.popupWindow.hide();
      this.sendToCompanion('popup:visibilityChanged', false);
    }
  }

  startCompanionDrag({ screenX, screenY }) {
    if (!this.companionWindow || this.companionWindow.isDestroyed()) return;
    const [winX, winY] = this.companionWindow.getPosition();
    this.dragState = {
      initialWinX: winX,
      initialWinY: winY,
      initialMouseX: screenX,
      initialMouseY: screenY
    };
    // Close popup during active drag for clean performance
    this.hideCompanionPopup();
  }

  moveCompanionDrag({ screenX, screenY }) {
    if (!this.dragState || !this.companionWindow || this.companionWindow.isDestroyed()) return;

    const targetX = this.dragState.initialWinX + (screenX - this.dragState.initialMouseX);
    const targetY = this.dragState.initialWinY + (screenY - this.dragState.initialMouseY);

    const [winW, winH] = this.companionWindow.getSize();
    const display = screen.getDisplayNearestPoint({
      x: targetX + Math.round(winW / 2),
      y: targetY + Math.round(winH / 2)
    });
    const workArea = display.workArea;

    const minX = workArea.x;
    const maxX = workArea.x + workArea.width - winW;
    const minY = workArea.y;
    const maxY = workArea.y + workArea.height - winH;

    const clampedX = Math.round(Math.max(minX, Math.min(maxX, targetX)));
    const clampedY = Math.round(Math.max(minY, Math.min(maxY, targetY)));

    this.companionWindow.setPosition(clampedX, clampedY);
  }

  endCompanionDrag() {
    if (!this.dragState || !this.companionWindow || this.companionWindow.isDestroyed()) {
      this.dragState = null;
      return;
    }
    const [finalX, finalY] = this.companionWindow.getPosition();
    this.store.set('companion.position', { x: finalX, y: finalY });
    this.dragState = null;
  }

  resetCompanionPosition() {
    if (!this.companionWindow || this.companionWindow.isDestroyed()) return;
    const primaryDisplay = screen.getPrimaryDisplay();
    const workArea = primaryDisplay.workArea;
    const [winW, winH] = this.companionWindow.getSize();
    const defX = Math.round(workArea.x + workArea.width - winW - 24);
    const defY = Math.round(workArea.y + workArea.height - winH - 24);
    this.companionWindow.setPosition(defX, defY);
    this.store.set('companion.position', { x: defX, y: defY });
    if (this.popupWindow && this.popupWindow.isVisible()) {
      const { x, y } = this.calculatePopupPosition(360, 520);
      this.popupWindow.setPosition(x, y);
    }
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
    const current = this.store.get('settings.alwaysOnTop') ?? true;
    const nextState = !current;
    if (this.companionWindow && !this.companionWindow.isDestroyed()) {
      this.companionWindow.setAlwaysOnTop(nextState);
    }
    if (this.popupWindow && !this.popupWindow.isDestroyed()) {
      this.popupWindow.setAlwaysOnTop(nextState);
    }
    this.store.set('settings.alwaysOnTop', nextState);
    return nextState;
  }

  sendToCompanion(channel, data) {
    if (this.companionWindow && !this.companionWindow.isDestroyed()) {
      this.companionWindow.webContents.send(channel, data);
    }
  }

  sendToPopup(channel, data) {
    if (this.popupWindow && !this.popupWindow.isDestroyed()) {
      this.popupWindow.webContents.send(channel, data);
    }
  }

  sendToHub(channel, data) {
    if (this.hubWindow && !this.hubWindow.isDestroyed()) {
      this.hubWindow.webContents.send(channel, data);
    }
  }

  sendToAll(channel, data) {
    this.sendToCompanion(channel, data);
    this.sendToPopup(channel, data);
    this.sendToHub(channel, data);
  }
}

module.exports = WindowManager;

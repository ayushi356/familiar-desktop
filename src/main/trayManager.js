const { Tray, Menu, nativeImage, app } = require('electron');

/**
 * Tray Manager
 * Provides quick desktop access to companion visibility, hub sanctuary, and monitoring controls.
 */
class TrayManager {
  constructor(windowManager, store) {
    this.windowManager = windowManager;
    this.store = store;
    this.tray = null;
  }

  createTray() {
    // Generate a clean 16x16 icon programmatically via 1x1 RGBA buffer or high-res data URL
    // This guarantees the icon is NEVER missing on any Windows machine
    const icon = this._getTrayIcon();
    this.tray = new Tray(icon);
    this.tray.setToolTip('Familiar — A Magical Desktop Companion');

    this.updateContextMenu();

    // Double clicking tray icon toggles hub sanctuary
    this.tray.on('double-click', () => {
      this.windowManager.toggleHub();
    });

    return this.tray;
  }

  _getTrayIcon() {
    // 16x16 purple and gold pixel icon in DataURL PNG format
    // A cute little witch hat icon
    const iconDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAZklEQVR42mNgwA/EGAZTAAwj0ABkO+5X2f/f1Xv8/7y4qP97Fbf+v6O1+f/f7t7/fxhG4YMYsB9I39v0//9lbfz/19X8/1932f9/ncf/v6sO8v8GhuEGvHqB+D4c9l8yGP1/oO0fAN+tT15h3ZjhAAAAAElFTkSuQmCC';
    return nativeImage.createFromDataURL(iconDataUrl);
  }

  updateContextMenu() {
    if (!this.tray) return;

    const monitoringEnabled = this.store.get('settings.monitoringEnabled') ?? true;
    const alwaysOnTop = this.store.get('settings.alwaysOnTop') ?? true;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Familiar — Desk Companion',
        enabled: false
      },
      { type: 'separator' },
      {
        label: 'Open Grimoire Sanctuary',
        click: () => this.windowManager.showHub('companion')
      },
      {
        label: 'Show / Hide Floating Companion',
        click: () => {
          const comp = this.windowManager.companionWindow;
          if (comp) {
            if (comp.isVisible()) {
              comp.hide();
              this.windowManager.hideCompanionPopup();
            } else {
              comp.show();
              comp.focus();
            }
          }
        }
      },
      {
        label: 'Reset Companion Position',
        click: () => {
          this.windowManager.resetCompanionPosition();
          const comp = this.windowManager.companionWindow;
          if (comp && !comp.isVisible()) {
            comp.show();
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Always on Top',
        type: 'checkbox',
        checked: alwaysOnTop,
        click: (menuItem) => {
          this.windowManager.toggleAlwaysOnTop();
          menuItem.checked = this.store.get('settings.alwaysOnTop');
        }
      },
      {
        label: 'Activity Monitoring Active',
        type: 'checkbox',
        checked: monitoringEnabled,
        click: (menuItem) => {
          const nextState = !this.store.get('settings.monitoringEnabled');
          this.store.set('settings.monitoringEnabled', nextState);
          menuItem.checked = nextState;
          this.windowManager.sendToHub('activity:updated', this.store.get('activity'));
        }
      },
      { type: 'separator' },
      {
        label: 'Quit Familiar',
        click: () => {
          app.isQuitting = true;
          app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }
}

module.exports = TrayManager;

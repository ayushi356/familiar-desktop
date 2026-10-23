const fs = require('fs');
const path = require('path');
const { app } = require('electron');

/**
 * Default data schema for Familiar
 * All user settings, progress, tasks, and companion state live here locally.
 */
const DEFAULT_DATA = {
  version: 1,
  settings: {
    alwaysOnTop: true,
    monitoringEnabled: true,
    idleThresholdMinutes: 5,
    soundEnabled: true,
    remindersEnabled: true,
    reminderFrequencyMinutes: 30,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    launchAtStartup: false,
    theme: 'gothic-plum',
    categories: {
      // Common Windows processes categorized responsibly; completely customizable by user
      'code': 'productive',
      'devenv': 'productive',
      'windowsterminal': 'productive',
      'powershell': 'productive',
      'cmd': 'productive',
      'notepad': 'productive',
      'obsidian': 'productive',
      'notion': 'productive',
      'chrome': 'neutral',
      'msedge': 'neutral',
      'firefox': 'neutral',
      'brave': 'neutral',
      'slack': 'neutral',
      'teams': 'neutral',
      'discord': 'neutral',
      'spotify': 'neutral',
      'steam': 'distracting',
      'epicgameslauncher': 'distracting'
    }
  },
  companion: {
    name: 'Hesper',
    level: 1,
    xp: 0,
    magicalDust: 50,
    mood: 'cozy', // 'cozy', 'curious', 'focused', 'sleepy', 'celebrating'
    currentState: 'idle', // 'idle', 'reading', 'working', 'sleeping', 'celebrating', 'brewing', 'resting'
    dialogue: 'Greetings, seeker of quiet magic. I am Hesper, your desk familiar.',
    lastInteracted: Date.now()
  },
  focus: {
    settings: {
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsBeforeLongBreak: 4
    },
    totalFocusMinutes: 0,
    completedSessions: 0,
    history: []
  },
  tasks: [],
  inventory: {
    ingredients: {
      'moon-dew': 3,
      'starlight-moss': 2,
      'nightshade-petal': 1
    },
    discoveredRecipes: [],
    craftedPotions: [],
    unlockedDecorations: ['candle-cluster']
  },
  activity: {
    lastTrackedDate: new Date().toISOString().split('T')[0],
    dailySummary: {
      productiveSeconds: 0,
      neutralSeconds: 0,
      distractingSeconds: 0,
      idleSeconds: 0,
      appBreakdown: {}
    },
    history: []
  },
  ai: {
    enabled: false,
    apiKey: '',
    endpoint: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    contextSharing: {
      shareCurrentTask: true,
      shareFocusStatus: true,
      shareFocusPreferences: true,
      shareSharedTasks: true,
      shareMemories: true
    },
    memories: [
      {
        id: 'mem_welcome_1',
        text: 'Prefers gentle, cozy encouragement over strict productivity rules.',
        createdAt: new Date().toISOString()
      }
    ],
    chatHistory: [
      {
        id: 'msg_welcome',
        role: 'assistant',
        content: 'Greetings, seeker of quiet magic. I am Hesper, your desk familiar. Tell me what spells or goals we are weaving today!',
        timestamp: Date.now()
      }
    ]
  }
};

class Store {
  constructor(filename = 'familiar-data.json') {
    // Determine user data directory
    const userDataPath = app ? app.getPath('userData') : path.join(process.cwd(), 'user-data');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    this.filepath = path.join(userDataPath, filename);
    this.data = this._loadData();
  }

  _loadData() {
    try {
      if (fs.existsSync(this.filepath)) {
        const raw = fs.readFileSync(this.filepath, 'utf8');
        const parsed = JSON.parse(raw);
        // Deep merge with DEFAULT_DATA to handle new schema keys smoothly
        return this._deepMerge(DEFAULT_DATA, parsed);
      }
    } catch (err) {
      console.error('[Store] Failed to load store file, falling back to defaults:', err);
      // Backup corrupted file for safety
      try {
        const backupPath = `${this.filepath}.backup.${Date.now()}`;
        if (fs.existsSync(this.filepath)) {
          fs.copyFileSync(this.filepath, backupPath);
          console.warn(`[Store] Backed up corrupted data to: ${backupPath}`);
        }
      } catch (backupErr) {
        console.error('[Store] Could not create backup:', backupErr);
      }
    }
    // Write defaults immediately
    this._saveData(DEFAULT_DATA);
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  _deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this._deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  _saveData(dataToSave) {
    try {
      const tempPath = `${this.filepath}.tmp`;
      const json = JSON.stringify(dataToSave, null, 2);
      fs.writeFileSync(tempPath, json, 'utf8');
      fs.renameSync(tempPath, this.filepath);
    } catch (err) {
      console.error('[Store] Error saving store atomically:', err);
    }
  }

  get(keyPath) {
    if (!keyPath) return this.data;
    const parts = keyPath.split('.');
    let curr = this.data;
    for (const part of parts) {
      if (curr === undefined || curr === null) return undefined;
      curr = curr[part];
    }
    return curr;
  }

  set(keyPath, value) {
    const parts = keyPath.split('.');
    let curr = this.data;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in curr) || typeof curr[part] !== 'object' || curr[part] === null) {
        curr[part] = {};
      }
      curr = curr[part];
    }
    curr[parts[parts.length - 1]] = value;
    this._saveData(this.data);
    return value;
  }

  update(keyPath, updaterFn) {
    const current = this.get(keyPath);
    const updated = updaterFn(current);
    this.set(keyPath, updated);
    return updated;
  }
}

module.exports = Store;

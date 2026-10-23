class FocusManager {
  constructor(store, windowManager) {
    this.store = store;
    this.windowManager = windowManager;
    this.timer = null;
    this.isActive = false;
    this.isPaused = false;
    this.totalSeconds = 25 * 60;
    this.remainingSeconds = 25 * 60;
    this.mode = 'focus'; // 'focus', 'shortBreak', 'longBreak'
  }

  getState() {
    const focusData = this.store.get('focus') || {};
    return {
      isActive: this.isActive,
      isPaused: this.isPaused,
      remainingSeconds: this.remainingSeconds,
      totalSeconds: this.totalSeconds,
      mode: this.mode,
      totalFocusMinutes: focusData.totalFocusMinutes || 0,
      completedSessions: focusData.completedSessions || 0
    };
  }

  start(durationMinutes = 25) {
    this.stop();

    this.totalSeconds = durationMinutes * 60;
    this.remainingSeconds = this.totalSeconds;
    this.isActive = true;
    this.isPaused = false;
    this.mode = durationMinutes <= 15 ? 'break' : 'focus';

    // Set companion state to working / reading alongside user
    const companion = this.store.get('companion');
    if (this.mode === 'focus') {
      companion.currentState = 'reading';
      companion.dialogue = "I have opened my grimoire. Let us immerse ourselves in deep study.";
    } else {
      companion.currentState = 'resting';
      companion.dialogue = "A peaceful break. Let your eyes rest and breathe in the quiet air.";
    }
    this.store.set('companion', companion);
    this.windowManager.sendToAll('companion:updated', companion);

    this.timer = setInterval(() => this._tick(), 1000);
    this._broadcastTick();
  }

  pause() {
    if (this.isActive && !this.isPaused) {
      this.isPaused = true;
      clearInterval(this.timer);
      this.timer = null;
      this._broadcastTick();
    }
  }

  resume() {
    if (this.isActive && this.isPaused) {
      this.isPaused = false;
      this.timer = setInterval(() => this._tick(), 1000);
      this._broadcastTick();
    }
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isActive = false;
    this.isPaused = false;
    this.remainingSeconds = this.totalSeconds;
    this._broadcastTick();
  }

  _tick() {
    if (this.remainingSeconds > 0) {
      this.remainingSeconds--;
      this._broadcastTick();
    } else {
      this._complete();
    }
  }

  _broadcastTick() {
    this.windowManager.sendToAll('focus:tick', {
      isActive: this.isActive,
      isPaused: this.isPaused,
      remainingSeconds: this.remainingSeconds,
      totalSeconds: this.totalSeconds,
      mode: this.mode
    });
  }

  _complete() {
    this.stop();

    if (this.mode === 'focus') {
      const minutesFocused = Math.round(this.totalSeconds / 60);

      // Update focus stats
      const focusData = this.store.get('focus') || {};
      focusData.totalFocusMinutes = (focusData.totalFocusMinutes || 0) + minutesFocused;
      focusData.completedSessions = (focusData.completedSessions || 0) + 1;
      this.store.set('focus', focusData);

      // Reward companion and player
      const companion = this.store.get('companion');
      companion.xp = (companion.xp || 0) + 40;
      companion.magicalDust = (companion.magicalDust || 0) + 25;
      companion.currentState = 'celebrating';

      // Drop random ingredient
      const ingredients = ['moon-dew', 'starlight-moss', 'nightshade-petal'];
      const dropped = ingredients[Math.floor(Math.random() * ingredients.length)];
      const inv = this.store.get('inventory') || {};
      if (!inv.ingredients) inv.ingredients = {};
      inv.ingredients[dropped] = (inv.ingredients[dropped] || 0) + 1;
      this.store.set('inventory', inv);

      companion.dialogue = `✦ Focus session complete! You gained +40 XP, +25 Stardust, and collected 1x ${dropped.replace('-', ' ')}!`;
      this.store.set('companion', companion);
      this.windowManager.sendToAll('companion:updated', companion);
    } else {
      const companion = this.store.get('companion');
      companion.currentState = 'idle';
      companion.dialogue = "Your break has concluded. Ready whenever you wish to begin another session!";
      this.store.set('companion', companion);
      this.windowManager.sendToAll('companion:updated', companion);
    }
  }
}

module.exports = FocusManager;

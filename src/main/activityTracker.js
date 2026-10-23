const { powerMonitor } = require('electron');
const { spawn } = require('child_process');

class ActivityTracker {
  constructor(store, windowManager) {
    this.store = store;
    this.windowManager = windowManager;
    this.timer = null;
    this.sampleIntervalMs = 5000; // sample every 5 seconds
    this.saveCounter = 0;
    this.psWorker = null;
    this.currentActiveApp = 'unknown';
    this.consecutiveDistractingSeconds = 0;
    this.wasIdle = false;

    this._initWorker();
  }

  _initWorker() {
    if (process.platform !== 'win32') return;

    try {
      const initScript = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class WinUtil {
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern int GetWindowThreadProcessId(IntPtr hWnd, out int processId);
}
"@ -ErrorAction SilentlyContinue

function Sample-Active {
    $hwnd = [WinUtil]::GetForegroundWindow()
    $pidVal = 0
    [void][WinUtil]::GetWindowThreadProcessId($hwnd, [ref]$pidVal)
    if ($pidVal -gt 0) {
        try {
            $p = [System.Diagnostics.Process]::GetProcessById($pidVal)
            return "$($p.ProcessName)|$($p.MainWindowTitle)"
        } catch {
            return "unknown|"
        }
    }
    return "unknown|"
}
Write-Output "READY"
`;
      this.psWorker = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', '-']);
      this.psWorker.stdin.write(initScript + '\n');

      this.psWorker.stdout.on('data', (data) => {
        const text = data.toString().trim();
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        for (const line of lines) {
          if (line.includes('|')) {
            const [procName] = line.split('|');
            if (procName) {
              this.currentActiveApp = procName.toLowerCase();
            }
          }
        }
      });

      this.psWorker.on('error', (err) => {
        console.warn('[ActivityTracker] PowerShell worker error, running in passive mode:', err.message);
        this.psWorker = null;
      });
    } catch (err) {
      console.warn('[ActivityTracker] Could not spawn worker:', err);
    }
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this._tick(), this.sampleIntervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  dispose() {
    this.stop();
    if (this.psWorker) {
      try {
        this.psWorker.kill();
      } catch (e) {
        // ignore
      }
    }
  }

  _tick() {
    const isMonitoring = this.store.get('settings.monitoringEnabled') ?? true;
    if (!isMonitoring) return;

    // Request active window sample from worker
    if (this.psWorker && this.psWorker.stdin.writable) {
      try {
        this.psWorker.stdin.write('Sample-Active\n');
      } catch (err) {
        // worker disconnected
      }
    }

    const elapsedSeconds = this.sampleIntervalMs / 1000;
    const idleSeconds = powerMonitor.getSystemIdleTime ? powerMonitor.getSystemIdleTime() : 0;
    const idleThreshold = (this.store.get('settings.idleThresholdMinutes') || 5) * 60;

    const activity = this.store.get('activity') || {};
    const summary = activity.dailySummary || {
      productiveSeconds: 0,
      neutralSeconds: 0,
      distractingSeconds: 0,
      idleSeconds: 0,
      appBreakdown: {}
    };

    // Idle Detection
    if (idleSeconds >= idleThreshold) {
      this.wasIdle = true;
      summary.idleSeconds = (summary.idleSeconds || 0) + elapsedSeconds;
    } else {
      if (this.wasIdle) {
        // User just returned after being away!
        this.wasIdle = false;
        this._notifyWelcomeBack();
      }

      // Categorize current app
      const appName = this.currentActiveApp || 'desktop';
      const categories = this.store.get('settings.categories') || {};
      const category = categories[appName] || 'neutral';

      if (category === 'productive') {
        summary.productiveSeconds = (summary.productiveSeconds || 0) + elapsedSeconds;
        this.consecutiveDistractingSeconds = 0;
      } else if (category === 'distracting') {
        summary.distractingSeconds = (summary.distractingSeconds || 0) + elapsedSeconds;
        this.consecutiveDistractingSeconds += elapsedSeconds;
        this._checkDistractionReminder();
      } else {
        summary.neutralSeconds = (summary.neutralSeconds || 0) + elapsedSeconds;
        this.consecutiveDistractingSeconds = 0;
      }

      // App breakdown
      if (!summary.appBreakdown) summary.appBreakdown = {};
      if (!summary.appBreakdown[appName]) {
        summary.appBreakdown[appName] = { seconds: 0, category };
      }
      summary.appBreakdown[appName].seconds += elapsedSeconds;
      summary.appBreakdown[appName].category = category;
    }

    // Save and push update periodically (every 10 ticks = 50 seconds)
    this.saveCounter++;
    if (this.saveCounter % 10 === 0) {
      activity.dailySummary = summary;
      this.store.set('activity', activity);
      this.windowManager.sendToHub('activity:updated', activity);
    }
  }

  _notifyWelcomeBack() {
    const companion = this.store.get('companion');
    if (companion) {
      const dialogue = "Welcome back, seeker. The desk was quiet without you.";
      this.store.set('companion.dialogue', dialogue);
      this.store.set('companion.currentState', 'idle');
      this.windowManager.sendToAll('companion:updated', this.store.get('companion'));
    }
  }

  _checkDistractionReminder() {
    const remindersEnabled = this.store.get('settings.remindersEnabled') ?? true;
    if (!remindersEnabled) return;

    // If user has been in a distracting app for 25 minutes straight
    if (this.consecutiveDistractingSeconds >= 1500) {
      this.consecutiveDistractingSeconds = 0; // reset reminder threshold
      const dialogue = "The stars whisper you've been wandering for a while. Shall we return to our tasks?";
      this.store.set('companion.dialogue', dialogue);
      this.store.set('companion.currentState', 'reading');
      this.windowManager.sendToAll('companion:updated', this.store.get('companion'));
    }
  }
}

module.exports = ActivityTracker;

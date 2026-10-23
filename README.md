# Familiar — A Magical Desktop Companion

**Familiar** is a personal Windows desktop companion combining a virtual witch character simulator, focus/productivity timer, potion-brewing mini-game, and an on-device local activity monitor.

---

## Overview & Aesthetics

- **Character:** Hesper, a cozy little witch who lives on your desktop.
- **Visual Aesthetic:** Dark academia, deep plum, charcoal, muted lavender, midnight blue, warm candlelight, subtle floating animations, and rich glassmorphic cards.
- **Architecture:** Electron desktop application built with clean, beginner-maintainable vanilla JavaScript, HTML5, and CSS3 tokens.
- **Privacy Guarantee:** 100% on-device monitoring. Zero analytics, zero external network requests, zero telemetry, no recording of keystrokes, clipboard, URLs, or screenshots.

---

## Project Architecture & Directory Structure

```
familiar-desktop/
├── package.json              # Scripts & dependencies
├── README.md                 # Setup, architecture & documentation
├── .gitignore                # Protects node_modules, logs, and local user data
├── scripts/
│   └── test-runner.js        # Automated test suite (npm test)
└── src/
    ├── main/                 # Electron Main Process (Node.js backend)
    │   ├── index.js          # App lifecycle, single-instance lock & initialization
    │   ├── store.js          # Atomic local JSON storage & schema recovery
    │   ├── windowManager.js  # Dual-window manager (Floating Companion + Sanctuary Hub)
    │   ├── trayManager.js    # Windows system tray menu & state controls
    │   ├── focusManager.js   # Focus & Pomodoro timer engine + companion reactions
    │   ├── activityTracker.js# Windows foreground process & idle time detector
    │   └── ipcHandlers.js    # Secure, validated IPC communication channels
    ├── preload/              # Sandboxed Context Bridges (Strictly Isolated)
    │   ├── companionPreload.js # Restricted bridge for floating companion window
    │   └── hubPreload.js       # Restricted bridge for main hub interface
    └── renderer/             # Frontend UI (HTML5, Vanilla CSS & JS)
        ├── common/
        │   └── theme.css     # Dark academia tokens, glows, buttons, typography
        ├── companion/        # Floating Compact Character Window
        │   ├── index.html    # SVG witch character, speech bubble, mini focus pill
        │   ├── companion.css # Floating animations, state-driven poses & quick bar
        │   └── companion.js  # Controller for character interactions & dialogues
        └── hub/              # Expanded Sanctuary Hub (7 Tabs)
            ├── index.html    # Grimoire layout with full tab structure
            ├── hub.css       # Cozy dark academia dashboard layout
            └── hub.js        # Controller for Tasks, Focus, Activity, Potions & Settings
```

---

## 🛠️ Security Architecture

Following secure Electron defaults:
- **`contextIsolation: true`** enabled on all windows.
- **`nodeIntegration: false`** enforced; no raw Node or OS APIs accessible from the DOM.
- **Strict Preload Bridges:** Only explicit, validated methods exposed via `window.familiarAPI` and `window.familiarHubAPI`.
- **Channel Validation:** All IPC handlers validate parameter types, boundaries, and string lengths before modifying the store.
- **Frameless Non-Stealing Companion Window:** Uses `-webkit-app-region: drag` for movement with `-webkit-app-region: no-drag` on interactive buttons.

---

## Getting Started

### Prerequisites
- Windows 10 or 11
- Node.js (v18+ recommended; tested on v24)
- npm (v9+)

### Installation
Clone or navigate to the directory and install dependencies:
```bash
npm install
```

### Running the Application
Start the desktop companion:
```bash
npm start
```

### Running Tests
Execute the automated test suite:
```bash
npm test
```

---

## Features Implemented in Milestone 1

1. **Floating Witch Companion (`Hesper`):**
   - Frameless, transparent desktop window floating in the bottom-right corner.
   - Draggable anywhere on your desktop.
   - Poses and animations for `idle`, `reading`, `sleeping`, `celebrating`, `brewing`, and `resting`.
   - Floating speech bubble with contextual witch dialogues.
   - Quick action bar (Pet/Talk, Open Grimoire, Toggle Pin).
   - Mini active focus countdown pill.

2. **Expanded Sanctuary Hub (`Grimoire`):**
   - **Companion Tab:** Stats, Level, XP bar, Stardust counter, active mood, and interactive actions (Talk, Offer Tea, Study Together, Rest).
   - **Focus Timer Tab:** Pomodoro intervals (25m Focus, 45m Deep, 5m Break, 15m Long Break), live digital timer, goal input, session history.
   - **Tasks Tab:** Task creation, priority badges (High, Medium, Low), due date pickers, completion checkboxes (awards XP & Stardust!), filters (All, Active, Done), and task deletion.
   - **Activity Tracker Tab:** Live privacy indicator, monitoring pause switch, daily time breakdown (Productive, Neutral, Distracting, Idle), and top application breakdown bars.
   - **Inventory Tab:** Witch satchel showing harvested ingredients (Moon Dew, Starlight Moss, Nightshade Petal) and room curios.
   - **Potion Brewing Mini-Game:** Interactive alchemical cauldron. Select ingredients, brew potions, unlock recipes, and collect Stardust!
   - **Settings Tab:** Always-on-top toggle, companion renaming, idle detection threshold, and custom process classification editor.

3. **System Tray Integration:**
   - Lives quietly in your Windows taskbar notification area.
   - Quick menu to toggle sanctuary, pause monitoring, pin window, or quit.

4. **Resilient Local Storage:**
   - Atomic disk writes (`.tmp` -> rename) prevent data corruption on sudden shutdowns.
   - Automatic schema validation and backup recovery.

---

## Privacy & Monitoring Disclosure

- **Operating System Calls:** Uses Windows API `user32.dll` (`GetForegroundWindow` / `GetWindowThreadProcessId`) and Electron `powerMonitor.getSystemIdleTime()`.
- **Scope:** Reads only the executable process name (e.g. `code.exe`, `chrome.exe`) and idle seconds.
- **Safety:** Does NOT access passwords, keystrokes, clipboard, browser URLs, files, or screen pixels.
- **Control:** You can pause or disable monitoring at any time directly from the Sanctuary or the System Tray.

# Familiar — A Magical Desktop Companion 🔮🕯️

**Familiar** is a Windows desktop application that combines a virtual pet / companion simulator with focus productivity tools, local activity tracking, and dark academia / cozy gothic fantasy charm.

At the center of your sanctuary sits **Hesper**, an enchanting, warm, and slightly mischievous little witch who keeps you company at your desk, brews potions with you, and helps you break overwhelming tasks into manageable spells.

---

## Features

- **Hesper Your Desk Familiar**: Multi-state animated companion with idle, study, brewing, resting, and celebrating animations.
- **Dual Window Architecture**:
  - **Floating Companion Window**: A compact, draggable desktop companion that can stay always-on-top.
  - **Sanctuary Hub**: An expanded sanctuary chamber featuring Hesper's oak work desk, brass candlestick, grimoires, potion alembics, and gothic arched window.
- **Conversational AI Personality (Opt-In)**: Talk naturally with Hesper. She offers gentle, thoughtful advice, breaks tasks down into manageable steps, and remembers user preferences without shaming or guilt.
- **Focus Timer**: Pomodoro intervals (25m Focus, 45m Deep Work, 5m / 15m Breaks) with stardust rewards upon completion.
- **Grimoire Tasks**: Prioritized task list tracking high, medium, and low urgency spells with XP rewards.
- **Local Activity Classification**: Local Windows process categorization (Productive, Neutral, Distracting) that runs completely on-device without telemetry.
- **Alchemical Satchel & Potion Brewing**: Gather magical reagents (*Moon Dew*, *Starlight Moss*, *Nightshade Petals*) to craft elixirs in the antique cauldron.

---

## Hesper's Conversational AI & Privacy Isolation

Hesper can be connected to conversational AI models (such as OpenAI's `gpt-4o-mini` or `gpt-4o`, Groq's `llama-3.1-8b-instant`, or completely local offline models via Ollama) while maintaining strict user privacy.

### Privacy & Security Guarantees
1. **Strictly Opt-In**: Conversational AI is disabled by default. Hesper only connects to an AI provider if you enable it in **Sanctuary Settings**.
2. **Context Isolation**: Only explicitly permitted items are included in prompts.
   - ✅ Current Focus status & duration (optional)
   - ✅ Primary in-progress task title (optional)
   - ✅ Incomplete task count (optional)
   - ✅ Saved memories & preferences (optional)
   - ❌ **NEVER shared**: Your open window titles, computer activity history, process lists, browser URLs, microphone, or local files.
3. **No Credentials in Renderer or Git**: Your API key is stored locally in your protected user profile (`user-data/familiar-data.json`, ignored by `.gitignore`). The key is never committed to Git and is never exposed in the browser/renderer process.
4. **No Middleman Servers**: Requests are made directly from your desktop to your chosen endpoint using native Node.js HTTP clients.
5. **Transparency Scrying Tool**: Click the **✦ Context** button in the Sanctuary Parlor or Settings at any time to inspect the exact JSON payload sent to the model.
6. **User-Controlled Memory**: View, create, and delete saved memories at any time under **Sanctuary Settings → Hesper's Memories**.

---

## AI Setup & Configuration

### Option A: OpenAI (Recommended Default)
1. Get an API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys).
2. Open Familiar, go to **Settings → Hesper's Mind & Conversational AI**.
3. Toggle **Enable AI Personality** to **ON**.
4. Click the **OpenAI (Default)** preset (`https://api.openai.com/v1`, model: `gpt-4o-mini`).
5. Paste your API key into the **API Secret Key** field and click **Save Settings**.
   - *Alternative*: Set the `OPENAI_API_KEY` environment variable in your system.

**Estimated Costs**:
`gpt-4o-mini` costs ~$0.15 per million input tokens and ~$0.60 per million output tokens. A typical conversation with Hesper costs less than $0.0001 per message (pennies for months of daily chats).

### Option B: Groq (Ultra-Fast)
1. Get a free API key from [console.groq.com](https://console.groq.com).
2. Click the **Groq (Ultra-Fast)** preset (`https://api.groq.com/openai/v1`, model: `llama-3.1-8b-instant`).
3. Enter your Groq API key and save.

### Option C: 100% Free & Offline (Ollama / Local LLM)
1. Install [Ollama](https://ollama.com/) on your computer and run `ollama run llama3`.
2. In Familiar's Settings, click the **Ollama / Local (Offline)** preset (`http://localhost:11434/v1`, model: `llama3`).
3. Leave the API key blank (not required for local Ollama). All conversations stay 100% on your machine with zero internet transmission!

---

## Predefined Fallback

If AI is disabled, offline, or your API key has not been configured, Hesper will gracefully fall back to her curated atmospheric dialogue and gentle reminders without throwing crashes or breaking application features.

---

## Running the Application

### Prerequisites
- Node.js (v18 or higher recommended; Node v24 tested)
- npm (v9 or higher)

### Installation
```powershell
npm install
```

### Running Automated Tests
```powershell
npm test
```
*Executes unit and integration tests for store schema, atomic persistence, task handling, potion brewing logic, process classification, AI prompt synthesis, context isolation, memory manager, and offline fallbacks.*

### Launching Familiar
```powershell
npm start
```
*Starts Electron and opens both the Floating Companion pet and the expanded Sanctuary Hub.*

---

## Architecture

```
familiar-desktop/
├── scripts/
│   └── test-runner.js             # Automated verification suite (10/10 tests)
├── src/
│   ├── assets/
│   │   └── icons/                 # 22 hand-crafted gothic fantasy SVG icons
│   ├── main/
│   │   ├── index.js               # Electron main process entry point & lifecycle
│   │   ├── windowManager.js       # Window positioning, dual-display coordinates, and styling
│   │   ├── store.js               # Atomic JSON store with corrupted-file fallback recovery
│   │   ├── focusManager.js        # Pomodoro timer ticks and session completion rewards
│   │   ├── activityTracker.js     # Window process classification (privacy-preserving)
│   │   ├── aiService.js           # Conversational AI engine, system prompt, context & memories
│   │   ├── ipcHandlers.js         # Validated Electron IPC communication channels
│   │   └── trayManager.js         # System tray icon and restore/quit context menu
│   ├── preload/
│   │   ├── companionPreload.js    # Secure preload bridge for floating companion pet
│   │   └── hubPreload.js          # Secure preload bridge for expanded sanctuary hub
│   └── renderer/
│       ├── common/
│       │   ├── theme.css          # Gothic fantasy design tokens, typography, colors, animations
│       │   ├── icons.js           # SVG icon registry and dynamic renderers
│       │   └── characterComponent.js # Reusable multi-state animated Hesper character SVG engine
│       ├── companion/
│       │   ├── index.html         # Compact desktop companion markup
│       │   ├── companion.css      # Floating window styles and draggable regions
│       │   └── companion.js       # Floating pet interaction controller
│       └── hub/
│           ├── index.html         # Expanded Sanctuary Hub with Grimoire Chat Parlor
│           ├── hub.css            # Gothic styles for room scene, chat bubbles, and settings
│           └── hub.js             # Sanctuary Hub controller, chat streamer, and memory manager
└── user-data/                     # Local user data (git-ignored for privacy)
```

---

## License

MIT

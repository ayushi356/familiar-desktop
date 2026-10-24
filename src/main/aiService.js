/**
 * AIService — Secured Conversational Integration for Hesper
 * 
 * Manages conversational interactions, system persona prompt synthesis,
 * privacy-enforced context filtering, memory persistence, and communication
 * with OpenAI-compatible endpoints using native Node.js fetch.
 */

function stripEmojisAndSparkles(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}]/gu, '')
    .replace(/^[✦✧★☆*•\-–—\s]+/g, '')
    .replace(/[✦✧★☆*•\-–—\s]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

class AIService {
  constructor(store, focusManager) {
    this.store = store;
    this.focusManager = focusManager;
  }

  /**
   * Returns current AI configuration, masking the API key for UI safety.
   */
  getConfig() {
    const ai = this.store.get('ai') || {};
    const key = this._resolveApiKey();
    const endpoint = ai.endpoint || 'https://api.openai.com/v1';
    const isLocal = this._isLocalEndpoint(endpoint);
    return {
      enabled: !!ai.enabled,
      isLocal,
      hasApiKey: isLocal ? true : !!key,
      maskedApiKey: key ? `${key.slice(0, 4)}...${key.slice(-4)}` : '',
      endpoint,
      model: ai.model || (isLocal ? 'qwen2.5:3b' : 'gpt-4o-mini'),
      contextSharing: ai.contextSharing || {
        shareCurrentTask: true,
        shareFocusStatus: true,
        shareFocusPreferences: true,
        shareSharedTasks: true,
        shareMemories: true
      }
    };
  }

  /**
   * Checks whether the endpoint points to a local machine instance (Ollama, LM Studio, etc.)
   */
  _isLocalEndpoint(endpoint) {
    if (!endpoint || typeof endpoint !== 'string') return false;
    const lower = endpoint.toLowerCase();
    return lower.includes('localhost') || lower.includes('127.0.0.1') || lower.includes('0.0.0.0') || lower.includes('::1');
  }

  /**
   * Resolves API key from local store or environment variables
   */
  _resolveApiKey() {
    const key = this.store.get('ai.apiKey');
    if (key && typeof key === 'string' && key.trim()) {
      return key.trim();
    }
    return process.env.OPENAI_API_KEY || process.env.FAMILIAR_AI_KEY || '';
  }

  /**
   * Updates AI configuration settings
   */
  updateConfig(updates = {}) {
    const current = this.store.get('ai') || {};
    
    if (typeof updates.enabled === 'boolean') {
      current.enabled = updates.enabled;
    }
    if (typeof updates.apiKey === 'string') {
      current.apiKey = updates.apiKey.trim();
    }
    if (typeof updates.endpoint === 'string' && updates.endpoint.trim()) {
      current.endpoint = updates.endpoint.trim().replace(/\/+$/, '');
    }
    if (typeof updates.model === 'string' && updates.model.trim()) {
      current.model = updates.model.trim();
    }
    if (updates.contextSharing && typeof updates.contextSharing === 'object') {
      current.contextSharing = {
        ...current.contextSharing,
        ...updates.contextSharing
      };
    }

    this.store.set('ai', current);
    return this.getConfig();
  }

  /**
   * Assembles the explicitly permitted context snippet for inspection and prompt synthesis.
   */
  getPermittedContext() {
    const ai = this.store.get('ai') || {};
    const sharing = ai.contextSharing || {};
    const companion = this.store.get('companion') || {};
    const focusState = this.focusManager ? this.focusManager.getState() : {};
    const tasks = this.store.get('tasks') || [];
    const memories = ai.memories || [];

    const context = {
      companionName: companion.name || 'Hesper',
      companionLevel: companion.level || 1,
      companionMood: companion.mood || 'cozy',
      stardust: companion.magicalDust || 0,
      timeOfDay: this._getTimeOfDayDescription()
    };

    if (sharing.shareFocusStatus) {
      context.focus = {
        isActive: !!focusState.isActive,
        isPaused: !!focusState.isPaused,
        mode: focusState.mode || 'idle',
        remainingSeconds: focusState.remainingSeconds || 0,
        remainingFormatted: focusState.remainingSeconds
          ? `${Math.floor(focusState.remainingSeconds / 60)}m ${focusState.remainingSeconds % 60}s`
          : 'None'
      };
    }

    if (sharing.shareFocusPreferences) {
      const focusSettings = this.store.get('focus.settings') || {};
      context.focusPreferences = {
        preferredFocusDurationMinutes: focusSettings.focusDuration || 25,
        shortBreakMinutes: focusSettings.shortBreakDuration || 5
      };
    }

    const incompleteTasks = tasks.filter(t => !t.completed);
    if (sharing.shareCurrentTask) {
      context.currentTask = incompleteTasks.length > 0 ? incompleteTasks[0].title : null;
    }

    if (sharing.shareSharedTasks) {
      context.incompleteTaskCount = incompleteTasks.length;
      context.tasks = incompleteTasks.slice(0, 5).map(t => ({
        title: t.title,
        priority: t.priority
      }));
    }

    if (sharing.shareMemories) {
      context.memories = memories.map(m => m.text);
    }

    return context;
  }

  /**
   * Synthesizes Hesper's rich system prompt and personality boundaries.
   */
  buildSystemPrompt() {
    const context = this.getPermittedContext();
    const companionName = context.companionName || 'Hesper';

    let prompt = `You are ${companionName}, an enchanting, clever, warm, and slightly mischievous witch who lives on the user's desktop as their personal magical companion.

YOUR PERSONALITY & TONE:
- Cozy gothic fantasy, dark academia charm, and gentle warmth.
- You love brewing herbal teas, consulting ancient grimoires, tending to glowing starlight moss, and helping your human companion find quiet focus.
- Speak in a natural, magical voice. Use light whimsical flourishes (references to incantations, herbal brews, starlight, parchment, hourglasses) without being cheesy or overly formal.
- Keep your responses SHORT and thoughtful by default (typically 1 to 3 sentences). You are a companion sitting beside them at their desk, not a distant essay generator.
- If the user asks for help breaking down a big or daunting task, give a structured, bite-sized list of small, actionable "spells" (steps) to get them started.
- Be deeply encouraging and compassionate. NEVER scold, shame, or guilt the user for being distracted, tired, or taking breaks.
- Respect quiet hours and encourage mindful rest and hydration.
- Do NOT use emoji characters or decorative emoji symbols (such as sparkles, smileys, stars, hearts, etc.) in your dialogue. Express warmth, whimsy, and magic through evocative language and natural prose alone.

IMPORTANT TRUTHFULNESS & TECHNICAL BOUNDARIES:
- You exist inside the Familiar desktop application.
- You do NOT have direct access to run shell commands, edit system files, or alter computer processes. NEVER pretend or claim you executed a system action on their machine unless it is confirmed in the application context below.
- You ONLY have access to the specific context items the user has explicitly chosen to share with you below. Do not assume or guess anything about their private files, browsing history, or personal identity.

USER'S CURRENT PERMITTED CONTEXT:
- Your Bond: Level ${context.companionLevel}, Mood: ${context.companionMood}, Stardust: ${context.stardust}
- Time of Day: ${context.timeOfDay}`;

    if (context.focus) {
      if (context.focus.isActive) {
        prompt += `\n- Focus Session: ACTIVE (${context.focus.mode} mode, ${context.focus.remainingFormatted} remaining)`;
      } else {
        prompt += `\n- Focus Session: No active timer running right now.`;
      }
    }

    if (context.focusPreferences) {
      prompt += `\n- Focus Duration Preference: ${context.focusPreferences.preferredFocusDurationMinutes} minutes per session.`;
    }

    if (context.currentTask) {
      prompt += `\n- Primary In-Progress Task: "${context.currentTask}"`;
    }

    if (context.tasks && context.tasks.length > 0) {
      const taskList = context.tasks.map(t => `"${t.title}" (${t.priority} priority)`).join(', ');
      prompt += `\n- Shared Grimoire Tasks (${context.incompleteTaskCount} total): ${taskList}`;
    }

    if (context.memories && context.memories.length > 0) {
      prompt += `\n- Things ${companionName} remembers about the user:\n` +
        context.memories.map(m => `  * ${m}`).join('\n');
    }

    return prompt;
  }

  _getTimeOfDayDescription() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Morning (fresh daylight & morning brew)';
    if (hour >= 12 && hour < 17) return 'Afternoon (warm study sunlight)';
    if (hour >= 17 && hour < 21) return 'Dusk (twilight & candle lighting)';
    return 'Night (quiet hours & moonlight)';
  }

  /**
   * Sends a user message to the conversational AI provider.
   */
  async sendMessage(userMessage) {
    if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
      return { success: false, error: 'EMPTY_MESSAGE', message: 'Whisper a message to Hesper.' };
    }

    const cleanInput = userMessage.trim().slice(0, 1000);
    const ai = this.store.get('ai') || {};
    
    // Check if AI is enabled
    if (!ai.enabled) {
      return {
        success: false,
        error: 'AI_DISABLED',
        message: 'AI conversation is currently paused. Enable Hesper\'s AI Mind in Sanctuary Settings to converse freely.',
        fallbackReply: this._getRandomFallbackReply()
      };
    }

    const endpoint = (ai.endpoint || 'https://api.openai.com/v1').replace(/\/+$/, '');
    const isLocal = this._isLocalEndpoint(endpoint);
    const model = ai.model || (isLocal ? 'qwen2.5:3b' : 'gpt-4o-mini');

    // Resolve API key (only required for remote cloud providers)
    const apiKey = this._resolveApiKey();
    if (!apiKey && !isLocal) {
      return {
        success: false,
        error: 'MISSING_KEY',
        message: 'No API key configured. Provide an OpenAI-compatible API key in Sanctuary Settings to awaken Hesper.',
        fallbackReply: this._getRandomFallbackReply()
      };
    }

    // Build system prompt with strictly permitted context
    const systemPrompt = this.buildSystemPrompt();

    // Prepare message history for multi-turn context (last 8 messages)
    const history = (ai.chatHistory || []).slice(-8).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }));

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: cleanInput }
    ];

    try {
      // Local models may need time to warm up into memory on the first request
      const timeoutMs = isLocal ? 90000 : 30000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const requestUrl = `${endpoint}/chat/completions`;
      const headers = {
        'Content-Type': 'application/json'
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      } else if (isLocal) {
        // Ollama OpenAI-compatible layer accepts Bearer tokens or omitted auth
        headers['Authorization'] = 'Bearer ollama';
      }

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.75,
          max_tokens: 450
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorDetail = '';
        try {
          const errJson = await response.json();
          errorDetail = errJson.error?.message || errJson.message || '';
        } catch {
          errorDetail = `HTTP ${response.status} ${response.statusText}`;
        }

        if (response.status === 401) {
          return {
            success: false,
            error: 'AUTH_FAILED',
            message: 'The API key was not recognized by the provider. Please verify your key in Settings.',
            detail: errorDetail
          };
        } else if (response.status === 429) {
          return {
            success: false,
            error: 'RATE_LIMITED',
            message: 'The scrying pool is overwhelmed with requests right now. Please wait a moment and try again.',
            detail: errorDetail
          };
        } else {
          return {
            success: false,
            error: 'API_ERROR',
            message: `The magical connection returned an error: ${errorDetail || 'Unknown API issue'}.`,
            detail: errorDetail
          };
        }
      }

      const data = await response.json();
      const rawReply = data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content.trim()
        : 'Hesper tilts her hat thoughtfully, but the message was lost in the ether.';
      const reply = stripEmojisAndSparkles(rawReply) || rawReply;

      // Save to chat history
      this._appendHistory(cleanInput, reply);

      // Reward interaction XP
      const comp = this.store.get('companion') || {};
      comp.xp = (comp.xp || 0) + 8;
      comp.lastInteracted = Date.now();
      comp.dialogue = reply.length > 120 ? `${reply.slice(0, 117)}...` : reply;
      comp.currentState = 'idle';
      this.store.set('companion', comp);

      return {
        success: true,
        reply,
        usage: data.usage || null
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        return {
          success: false,
          error: 'TIMEOUT',
          message: isLocal
            ? `Local model '${model}' timed out while generating a response. Ensure your computer has sufficient memory available.`
            : 'The mystical connection timed out. Check your network or try a smaller message.'
        };
      }
      return {
        success: false,
        error: isLocal ? 'LOCAL_OFFLINE' : 'NETWORK_ERROR',
        message: isLocal
          ? `Could not connect to local Ollama on ${endpoint}. Make sure the Ollama application is running and the '${model}' model is installed.`
          : `Could not connect to ${endpoint}. Verify your network connection or endpoint configuration.`,
        detail: err.message
      };
    }
  }

  /**
   * Appends user message and Hesper reply to local chat history
   */
  _appendHistory(userText, assistantText) {
    const ai = this.store.get('ai') || {};
    const history = ai.chatHistory || [];
    
    history.push({
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: Date.now()
    });

    history.push({
      id: `msg_a_${Date.now()}`,
      role: 'assistant',
      content: stripEmojisAndSparkles(assistantText) || assistantText,
      timestamp: Date.now()
    });

    // Retain up to 40 messages locally
    ai.chatHistory = history.slice(-40);
    this.store.set('ai', ai);
  }

  /**
   * Returns conversation history with emojis sanitized for Grimoire Whispers
   */
  getHistory() {
    const ai = this.store.get('ai') || {};
    const history = ai.chatHistory || [];
    return history.map(item => {
      if (item.role === 'assistant') {
        return {
          ...item,
          content: stripEmojisAndSparkles(item.content) || item.content
        };
      }
      return item;
    });
  }

  /**
   * Clears conversation history
   */
  clearHistory() {
    const ai = this.store.get('ai') || {};
    ai.chatHistory = [
      {
        id: `msg_welcome_${Date.now()}`,
        role: 'assistant',
        content: 'I have refreshed my grimoire parchment. What shall we focus on next?',
        timestamp: Date.now()
      }
    ];
    this.store.set('ai', ai);
    return ai.chatHistory;
  }

  /**
   * Returns list of saved user memories
   */
  getMemories() {
    const ai = this.store.get('ai') || {};
    return ai.memories || [];
  }

  /**
   * Adds a new memory/preference
   */
  saveMemory(text) {
    if (!text || typeof text !== 'string') return null;
    const cleanText = text.trim().slice(0, 240);
    if (!cleanText) return null;

    const ai = this.store.get('ai') || {};
    const memories = ai.memories || [];

    const newMemory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      text: cleanText,
      createdAt: new Date().toISOString()
    };

    memories.push(newMemory);
    ai.memories = memories;
    this.store.set('ai', ai);
    return newMemory;
  }

  /**
   * Deletes a memory by ID
   */
  deleteMemory(id) {
    if (!id || typeof id !== 'string') return false;
    const ai = this.store.get('ai') || {};
    let memories = ai.memories || [];
    const initialLength = memories.length;
    memories = memories.filter(m => m.id !== id);
    if (memories.length !== initialLength) {
      ai.memories = memories;
      this.store.set('ai', ai);
      return true;
    }
    return false;
  }

  /**
   * Predefined atmospheric fallback reply when AI is offline or disabled
   */
  _getRandomFallbackReply() {
    const fallbacks = [
      "The candlelight flickers softly. A single step forward is still magic.",
      "I have infused the kettle with lavender and chamomile. Take a gentle breath.",
      "Every grand incantation begins with quiet, steady dedication.",
      "The grimoire whispers of patience today. Focus on what is directly in front of you.",
      "Remember to stretch your wrists and shoulders. The magic will wait for you."
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

module.exports = AIService;

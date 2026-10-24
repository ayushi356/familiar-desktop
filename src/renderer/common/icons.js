/**
 * Familiar — Unified Gothic Fantasy SVG Icon Library
 * Consistent 24x24 viewBox, 1.75 stroke-width, antique gold & soft lavender accents.
 */

const FANTASY_ICONS = {
  // Navigation & Primary Sections
  companion: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="6" stroke="currentColor" fill="none"/>
      <path d="M12 2a10 10 0 0 1 10 10c0 4.14-2.52 7.7-6.14 9.17" stroke="currentColor"/>
      <path d="M12 2a10 10 0 0 0-10 10c0 4.14 2.52 7.7 6.14 9.17" stroke="currentColor"/>
      <polygon points="12,8 13.2,10.8 16,12 13.2,13.2 12,16 10.8,13.2 8,12 10.8,10.8" fill="currentColor"/>
    </svg>
  `,

  focus: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 2h14v2a4 4 0 0 1-4 4l-1 2 1 2a4 4 0 0 1 4 4v2H5v-2a4 4 0 0 1 4-4l1-2-1-2a4 4 0 0 1-4-4V2z"/>
      <path d="M9 18h6"/>
      <circle cx="12" cy="14" r="1" fill="currentColor"/>
    </svg>
  `,

  tasks: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  `,

  activity: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(30 12 12)"/>
      <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
      <circle cx="18" cy="8.5" r="1.5" fill="currentColor"/>
    </svg>
  `,

  inventory: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V7z"/>
      <path d="M9 5V3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
      <path d="M6 10h12"/>
      <rect x="10" y="9" width="4" height="4" rx="1" fill="currentColor"/>
    </svg>
  `,

  minigames: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 2v5.5L5 18a3 3 0 0 0 3 4h8a3 3 0 0 0 3-4l-5-10.5V2"/>
      <line x1="8.5" y1="2" x2="15.5" y2="2"/>
      <path d="M7 16h10" stroke-dasharray="1 2"/>
      <circle cx="10" cy="18" r="1" fill="currentColor"/>
      <circle cx="14" cy="17" r="1.5" fill="currentColor"/>
    </svg>
  `,

  settings: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  `,

  // Interaction Buttons
  talk: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      <circle cx="8" cy="10" r="1" fill="currentColor"/>
      <circle cx="12" cy="10" r="1" fill="currentColor"/>
      <circle cx="16" cy="10" r="1" fill="currentColor"/>
    </svg>
  `,

  tea: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 11h13a3 3 0 0 1 3 3v1a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-4z"/>
      <path d="M20 12h2a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-2"/>
      <path d="M2 21h20"/>
      <path d="M8 4c0 1.5-1 2-1 3s1 1.5 1 2"/>
      <path d="M12 3c0 1.5-1 2-1 3s1 1.5 1 2"/>
      <path d="M16 4c0 1.5-1 2-1 3s1 1.5 1 2"/>
    </svg>
  `,

  study: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      <path d="M12 7l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5z" fill="currentColor"/>
    </svg>
  `,

  rest: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      <circle cx="17" cy="8" r="0.8" fill="currentColor"/>
      <circle cx="19" cy="5" r="0.6" fill="currentColor"/>
    </svg>
  `,

  // Ingredients
  'moon-dew': `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2.5c0 0-6 7.5-6 11.5a6 6 0 0 0 12 0c0-4-6-11.5-6-11.5z" fill="rgba(156,207,216,0.15)"/>
      <path d="M12 8a4 4 0 0 0-4 4"/>
      <circle cx="12" cy="14" r="1.5" fill="currentColor"/>
    </svg>
  `,

  'starlight-moss': `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22V8"/>
      <path d="M12 18c3-1 6-5 6-9-3 0-5 3-6 5"/>
      <path d="M12 14c-3-1-6-5-6-9 3 0 5 3 6 5"/>
      <path d="M12 10c2-1 4-3 4-6-2 0-3 2-4 3"/>
      <circle cx="18" cy="8" r="1" fill="#f5c97a"/>
      <circle cx="6" cy="4" r="1" fill="#f5c97a"/>
    </svg>
  `,

  'nightshade-petal': `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
      <path d="M12 2c2 3 3 5 0 7.5-3-2.5-2-4.5 0-7.5z" fill="rgba(214,109,135,0.2)"/>
      <path d="M21.5 8c0 3.5-1.5 5.5-4.5 5.5 0-3.5 2-5 4.5-5.5z" fill="rgba(214,109,135,0.2)"/>
      <path d="M18 20.5c-3 1-5 0-6-3.5 3-1 5 0 6 3.5z" fill="rgba(214,109,135,0.2)"/>
      <path d="M6 20.5c1-3 3-4.5 6-3.5-1 3.5-3 4.5-6 3.5z" fill="rgba(214,109,135,0.2)"/>
      <path d="M2.5 8c2.5.5 4.5 2 4.5 5.5-3 0-4.5-2-4.5-5.5z" fill="rgba(214,109,135,0.2)"/>
    </svg>
  `,

  'crystal-amber': `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="6,4 18,4 22,10 12,21 2,10" fill="rgba(245,201,122,0.15)"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
      <line x1="6" y1="4" x2="12" y2="21"/>
      <line x1="18" y1="4" x2="12" y2="21"/>
    </svg>
  `,

  // Curios
  'curio-candle': `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="6" height="11" rx="1" fill="rgba(248,213,148,0.1)"/>
      <path d="M12 9V6"/>
      <path d="M12 2c1 1.5 1.5 2.5 0 4-1.5-1.5-1-2.5 0-4z" fill="#f5c97a" stroke="#e0ac59"/>
      <path d="M6 20h12"/>
      <ellipse cx="12" cy="20" rx="4" ry="1.5"/>
    </svg>
  `,

  'curio-orb': `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="10" r="7" fill="rgba(196,167,231,0.2)"/>
      <path d="M8 17l-1 4h10l-1-4"/>
      <path d="M6 21h12"/>
      <ellipse cx="12" cy="17" rx="5" ry="1.5"/>
      <circle cx="10" cy="8" r="1.5" fill="#fff" opacity="0.6"/>
    </svg>
  `,

  'curio-cat': `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 19c0-3.5 2.5-6 6.5-6s6.5 2.5 6.5 6H4z" fill="rgba(40,25,50,0.4)"/>
      <circle cx="12" cy="9" r="4.5" fill="rgba(40,25,50,0.6)"/>
      <polygon points="8.5,6 7,2 10.5,4.5" fill="currentColor"/>
      <polygon points="15.5,6 17,2 13.5,4.5" fill="currentColor"/>
      <circle cx="10.5" cy="8.5" r="1" fill="#f5c97a"/>
      <circle cx="13.5" cy="8.5" r="1" fill="#f5c97a"/>
      <path d="M17 17c2 0 4-1.5 4-4s-1.5-3-1.5-3"/>
    </svg>
  `,

  // General & Utility
  cauldron: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <ellipse cx="12" cy="7" rx="8" ry="2.5"/>
      <path d="M4 7c0 7 3.5 12 8 12s8-5 8-12"/>
      <path d="M6 19l-2 3"/>
      <path d="M18 19l2 3"/>
      <path d="M8 4c0 1-1 1.5-1 2"/>
      <path d="M12 3c0 1-1 1.5-1 2"/>
      <path d="M16 4c0 1-1 1.5-1 2"/>
    </svg>
  `,

  stardust: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12,2 14.5,8.5 21,11 14.5,13.5 12,20 9.5,13.5 3,11 9.5,8.5" fill="#f5c97a" stroke="#e0ac59"/>
      <circle cx="19" cy="4" r="1" fill="#f5c97a"/>
      <circle cx="4" cy="18" r="1" fill="#f5c97a"/>
    </svg>
  `,

  shield: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z"/>
      <circle cx="12" cy="10" r="2.5" fill="currentColor"/>
      <path d="M12 12.5v3"/>
    </svg>
  `,

  pin: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 9V4l1 0V2H7v2l1 0v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z" fill="currentColor"/>
    </svg>
  `,

  play: `
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="6,3 20,12 6,21"/>
    </svg>
  `,

  pause: `
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <rect x="6" y="4" width="4" height="16" rx="1"/>
      <rect x="14" y="4" width="4" height="16" rx="1"/>
    </svg>
  `,

  stop: `
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <rect x="5" y="5" width="14" height="14" rx="2"/>
    </svg>
  `,

  check: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  `,

  plus: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  `
};

/**
 * Helper to render an SVG icon by key with optional custom classes/dimensions
 */
function getIconSvg(name, extraClass = '') {
  const raw = FANTASY_ICONS[name] || FANTASY_ICONS.companion;
  if (!extraClass) return raw.trim();
  return raw.replace('<svg', `<svg class="${extraClass}"`).trim();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FANTASY_ICONS, getIconSvg };
}

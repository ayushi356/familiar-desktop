/**
 * Familiar — Reusable Character Component (Hesper the Witch)
 * Provides multi-state SVG illustration, props, facial expressions, and animation loops.
 * Supports: 'idle', 'study', 'sleep', 'brew', 'celebrate', 'react', 'rest'.
 */

function createWitchSvg({ state = 'idle', size = 'normal' }) {
  const isCompact = size === 'compact';
  const width = isCompact ? 110 : (size === 'large' ? 180 : 130);
  const height = isCompact ? 130 : (size === 'large' ? 210 : 155);

  // Determine prop layer based on state
  let propSvg = '';
  if (state === 'study' || state === 'reading') {
    propSvg = `
      <!-- Open Grimoire & Feather Quill -->
      <g class="prop-study">
        <path d="M 28 88 Q 50 82 50 72 Q 50 82 72 88 Q 50 94 28 88 Z" fill="#3a2218" stroke="#d49b42" stroke-width="1.2"/>
        <path d="M 30 86 Q 49 80 49 73 Q 49 80 70 86 Q 49 92 30 86 Z" fill="#f6edd9"/>
        <line x1="50" y1="73" x2="50" y2="92" stroke="#b88533" stroke-width="1"/>
        <!-- Golden Rune Sigils on pages -->
        <circle cx="40" cy="83" r="1.5" fill="#d49b42"/>
        <circle cx="60" cy="83" r="1.5" fill="#d49b42"/>
        <!-- Ink Feather Quill -->
        <path d="M 66 74 Q 74 65 72 58 Q 70 65 65 72" fill="#c4a7e7" stroke="#988bc7" stroke-width="0.8"/>
      </g>
    `;
  } else if (state === 'brew' || state === 'brewing') {
    propSvg = `
      <!-- Bubbling Mini Cauldron -->
      <g class="prop-brew">
        <ellipse cx="50" cy="95" rx="18" ry="8" fill="#181120" stroke="#82c4cc" stroke-width="1.2"/>
        <ellipse cx="50" cy="92" rx="15" ry="5" fill="#5e9c8f" opacity="0.8"/>
        <!-- Rising Magic Steam Bubbles -->
        <circle class="brew-steam s1" cx="44" cy="86" r="2" fill="#9ccfd8" opacity="0.8"/>
        <circle class="brew-steam s2" cx="54" cy="83" r="2.5" fill="#c4a7e7" opacity="0.8"/>
        <circle class="brew-steam s3" cx="49" cy="79" r="1.8" fill="#f5c97a" opacity="0.8"/>
        <!-- Stirring Wooden Ladle -->
        <line x1="56" y1="72" x2="48" y2="93" stroke="#8c6239" stroke-width="2" stroke-linecap="round"/>
      </g>
    `;
  } else if (state === 'rest' || state === 'resting') {
    propSvg = `
      <!-- Steaming Ceramic Tea Mug -->
      <g class="prop-rest">
        <rect x="44" y="80" width="12" height="11" rx="2" fill="#2d1d3a" stroke="#d49b42" stroke-width="1"/>
        <path d="M 56 82 Q 60 85 56 88" stroke="#d49b42" stroke-width="1" fill="none"/>
        <ellipse cx="50" cy="80" rx="6" ry="2" fill="#a47248"/>
        <!-- Steam swirls -->
        <path class="tea-steam" d="M 47 77 Q 45 74 48 71" stroke="#f6edd9" stroke-width="0.9" fill="none" opacity="0.75"/>
        <path class="tea-steam" d="M 52 76 Q 54 73 51 70" stroke="#f6edd9" stroke-width="0.9" fill="none" opacity="0.75"/>
      </g>
    `;
  } else if (state === 'celebrate' || state === 'celebrating') {
    propSvg = `
      <!-- Raised Crystal Star Vial -->
      <g class="prop-celebrate">
        <polygon points="70,62 76,62 78,72 68,72" fill="#f5c97a" stroke="#d49b42" stroke-width="1"/>
        <circle cx="73" cy="67" r="2" fill="#fff"/>
        <line x1="73" y1="60" x2="73" y2="62" stroke="#d49b42" stroke-width="1.5"/>
        <!-- Starburst -->
        <polygon class="celebrate-sparkle" points="73,50 75,54 79,55 75,57 73,61 71,57 67,55 71,54" fill="#f5c97a"/>
      </g>
    `;
  } else if (state === 'sleep' || state === 'sleeping') {
    propSvg = `
      <!-- Slumber Rune / Zzz -->
      <g class="prop-sleep">
        <text class="sleep-z z1" x="65" y="45" font-family="serif" font-size="9" fill="#c4a7e7" opacity="0.8">z</text>
        <text class="sleep-z z2" x="72" y="36" font-family="serif" font-size="11" fill="#f5c97a" opacity="0.9">Z</text>
      </g>
    `;
  }

  // Determine eyes based on state
  let eyesSvg = '';
  if (state === 'sleep' || state === 'sleeping') {
    eyesSvg = `
      <!-- Sleeping Happy Arcs -->
      <path d="M 40 54 Q 44 58 48 54" stroke="#2c1a35" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M 54 54 Q 58 58 62 54" stroke="#2c1a35" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    `;
  } else if (state === 'celebrate' || state === 'celebrating') {
    eyesSvg = `
      <!-- Joyful Arched Eyes -->
      <path d="M 39 55 Q 44 50 49 55" stroke="#2c1a35" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M 53 55 Q 58 50 63 55" stroke="#2c1a35" stroke-width="2" fill="none" stroke-linecap="round"/>
    `;
  } else if (state === 'react' || state === 'reacting') {
    eyesSvg = `
      <!-- Wide Curious Starry Eyes -->
      <ellipse cx="43" cy="52" rx="3.5" ry="4.5" fill="#2d1537"/>
      <ellipse cx="57" cy="52" rx="3.5" ry="4.5" fill="#2d1537"/>
      <polygon points="43,49 44,52 46,52 44,54 45,56 43,54 41,56 42,54 40,52 42,52" fill="#f5c97a"/>
      <polygon points="57,49 58,52 60,52 58,54 59,56 57,54 55,56 56,54 54,52 56,52" fill="#f5c97a"/>
    `;
  } else {
    // Normal blinking starry eyes
    eyesSvg = `
      <g class="witch-blinking-eyes">
        <ellipse cx="43" cy="52" rx="2.8" ry="3.8" fill="#2d1537"/>
        <ellipse cx="57" cy="52" rx="2.8" ry="3.8" fill="#2d1537"/>
        <circle cx="44.2" cy="50.8" r="1.3" fill="#ffffff"/>
        <circle cx="58.2" cy="50.8" r="1.3" fill="#ffffff"/>
        <circle cx="42.2" cy="53.5" r="0.7" fill="#f5c97a"/>
        <circle cx="56.2" cy="53.5" r="0.7" fill="#f5c97a"/>
      </g>
    `;
  }

  // Hat tilt for sleeping state
  const hatTransform = (state === 'sleep' || state === 'sleeping') ? 'transform="rotate(6 50 40) translate(0, 4)"' : '';

  return `
    <div class="hesper-avatar-wrap state-${state}">
      <svg class="hesper-character-svg" viewBox="0 0 100 120" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="auraGlowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#f5c97a" stop-opacity="0.25"/>
            <stop offset="60%" stop-color="#c4a7e7" stop-opacity="0.1"/>
            <stop offset="100%" stop-color="#c4a7e7" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="robeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2a1636"/>
            <stop offset="100%" stop-color="#150a1d"/>
          </linearGradient>
          <linearGradient id="hatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#381d48"/>
            <stop offset="65%" stop-color="#220e30"/>
            <stop offset="100%" stop-color="#14081c"/>
          </linearGradient>
          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#7a5a94"/>
            <stop offset="100%" stop-color="#4a305e"/>
          </linearGradient>
        </defs>

        <!-- Ambient Candlelight Aura Behind Character -->
        <circle cx="50" cy="60" r="46" fill="url(#auraGlowGrad)" class="ambient-aura"/>

        <!-- Back Hair -->
        <path class="hair-back" d="M 30 45 C 28 78 30 84 39 88 C 50 90 60 90 71 88 C 80 84 82 78 80 45 Z" fill="url(#hairGrad)" />

        <!-- Robe / Torso -->
        <path class="witch-robe" d="M 38 68 Q 28 104 22 110 Q 50 115 78 110 Q 72 104 62 68 Z" fill="url(#robeGrad)" stroke="#4e2759" stroke-width="1.3" />
        
        <!-- Robe Golden Hem Detail -->
        <path d="M 24 108 Q 50 114 76 108" stroke="#d49b42" stroke-width="1.2" fill="none" opacity="0.8"/>

        <!-- Velvet Scarf Collar & Glowing Amethyst Brooch -->
        <path d="M 40 66 Q 50 73 60 66 Q 50 80 40 66" fill="#4e2759" />
        <circle cx="50" cy="73" r="2.8" fill="#c4a7e7" stroke="#d49b42" stroke-width="0.8"/>

        <!-- Character Props Layer (Desk, Book, Potion, Tea) -->
        ${propSvg}

        <!-- Face Base -->
        <ellipse cx="50" cy="54" rx="16" ry="15" fill="#fde8d4" />
        
        <!-- Soft Blush Cheeks -->
        <ellipse cx="39" cy="58" rx="3.5" ry="2" fill="#d66d87" opacity="0.4" />
        <ellipse cx="61" cy="58" rx="3.5" ry="2" fill="#d66d87" opacity="0.4" />

        <!-- Eyes -->
        <g class="witch-eyes-layer">
          ${eyesSvg}
        </g>

        <!-- Front Bangs & Side Locks -->
        <path d="M 34 46 C 42 54 45 44 50 50 C 55 44 58 54 66 46 C 68 40 64 36 50 36 C 36 36 32 40 34 46 Z" fill="url(#hairGrad)" />
        <path d="M 32 45 C 31 56 34 62 36 65" stroke="#7a5a94" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <path d="M 68 45 C 69 56 66 62 64 65" stroke="#7a5a94" stroke-width="1.8" fill="none" stroke-linecap="round"/>

        <!-- Witch Hat Group with Optional Tilt -->
        <g class="witch-hat-group" ${hatTransform}>
          <!-- Hat Brim -->
          <ellipse cx="50" cy="40" rx="37" ry="9" fill="url(#hatGrad)" stroke="#4e2759" stroke-width="1.2" />

          <!-- Hat Velvet Ribbon -->
          <path d="M 32 39 Q 50 44 68 39 Q 67 34 65 32 Q 50 37 35 32 Z" fill="#b0798e" />
          
          <!-- Antique Crescent Moon Brooch on Hat Ribbon -->
          <path d="M 50 33 A 4.5 4.5 0 0 0 54.5 39 A 3.5 3.5 0 0 1 51 35.5 A 3.5 3.5 0 0 1 50 33 Z" fill="#f5c97a" stroke="#d49b42" stroke-width="0.6"/>

          <!-- Hat Cone with Subtle Curve -->
          <path d="M 35 35 Q 47 11 55 6 Q 58 4 60 7 Q 56 17 65 35 Z" fill="url(#hatGrad)" stroke="#4e2759" stroke-width="1.2" />

          <!-- Hat Star Tip with Golden Sparkle -->
          <polygon points="60,3 62,7 66,7 63,10 64,14 60,11 56,14 57,10 54,7 58,7" fill="#f5c97a" class="hat-star-sparkle"/>
        </g>
      </svg>
    </div>
  `;
}

function renderWitchCharacter(container, options = {}) {
  if (!container) return;
  container.innerHTML = createWitchSvg(options);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createWitchSvg, renderWitchCharacter };
}

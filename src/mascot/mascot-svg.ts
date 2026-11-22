/**
 * JESSiE-BOT — SVG mascot markup
 * Blue-white robot in a hoodie. Inspired by the reference image.
 * All parts are individually addressable via ID for animation.
 */

export function buildMascotHTML(): string {
  return /* html */ `
<div class="jessiebot-wrap" id="jessiebot-wrap">
  <!-- Speech bubble -->
  <div class="jessiebot-bubble" id="jessiebot-bubble" aria-live="polite">
    <span id="jessiebot-bubble-text"></span>
  </div>

  <!-- Main mascot SVG -->
  <svg
    class="jessiebot-svg"
    id="jessiebot-svg"
    viewBox="0 0 120 180"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="JESSiE-BOT, Jessie's AI mascot"
    role="img"
  >
    <defs>
      <!-- Hoodie body gradient -->
      <linearGradient id="bot-hoodie-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#5b9af5"/>
        <stop offset="100%" stop-color="#3a78d4"/>
      </linearGradient>
      <!-- White front plate gradient -->
      <linearGradient id="bot-front-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f0f6ff"/>
        <stop offset="100%" stop-color="#d8eaf7"/>
      </linearGradient>
      <!-- Visor glow gradient -->
      <radialGradient id="bot-visor-grad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#1a2540"/>
        <stop offset="100%" stop-color="#0d1628"/>
      </radialGradient>
      <!-- Eye glow filter -->
      <filter id="bot-eye-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.5" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <!-- Body drop shadow -->
      <filter id="bot-shadow">
        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="rgba(14,33,71,0.35)"/>
      </filter>
      <!-- Paw print filter -->
      <filter id="bot-paw-glow">
        <feGaussianBlur stdDeviation="0.8"/>
      </filter>
    </defs>

    <!-- ═══ SHADOW (ground) ═══ -->
    <ellipse class="bot-ground-shadow" cx="60" cy="176" rx="28" ry="5" fill="rgba(14,33,71,0.18)"/>

    <!-- ═══ LEGS GROUP ═══ -->
    <g id="bot-legs">
      <!-- Left leg -->
      <g id="bot-leg-left">
        <rect x="38" y="142" width="18" height="26" rx="8" fill="url(#bot-hoodie-grad)"/>
        <!-- Left boot/paw -->
        <ellipse cx="47" cy="167" rx="11" ry="6" fill="#3a78d4"/>
        <ellipse cx="47" cy="165" rx="9" ry="5" fill="#f0f6ff"/>
        <!-- Paw dots -->
        <circle cx="43" cy="163" r="2" fill="#5b9af5"/>
        <circle cx="47" cy="162" r="2" fill="#5b9af5"/>
        <circle cx="51" cy="163" r="2" fill="#5b9af5"/>
        <circle cx="45" cy="166" r="1.5" fill="#5b9af5"/>
        <circle cx="49" cy="166" r="1.5" fill="#5b9af5"/>
      </g>
      <!-- Right leg -->
      <g id="bot-leg-right">
        <rect x="64" y="142" width="18" height="26" rx="8" fill="url(#bot-hoodie-grad)"/>
        <!-- Right boot/paw -->
        <ellipse cx="73" cy="167" rx="11" ry="6" fill="#3a78d4"/>
        <ellipse cx="73" cy="165" rx="9" ry="5" fill="#f0f6ff"/>
        <!-- Paw dots -->
        <circle cx="69" cy="163" r="2" fill="#5b9af5"/>
        <circle cx="73" cy="162" r="2" fill="#5b9af5"/>
        <circle cx="77" cy="163" r="2" fill="#5b9af5"/>
        <circle cx="71" cy="166" r="1.5" fill="#5b9af5"/>
        <circle cx="75" cy="166" r="1.5" fill="#5b9af5"/>
      </g>
    </g>

    <!-- ═══ TAIL ═══ -->
    <g id="bot-tail">
      <path d="M 83 148 Q 105 130 100 118 Q 96 108 88 115 Q 98 112 97 122 Q 95 134 78 148 Z"
            fill="url(#bot-hoodie-grad)" opacity="0.9"/>
      <path d="M 90 118 Q 95 112 92 108 Q 89 118 85 122"
            fill="#f0f6ff" opacity="0.7"/>
    </g>

    <!-- ═══ BODY ═══ -->
    <g id="bot-body" filter="url(#bot-shadow)">
      <!-- Main hoodie body -->
      <rect x="28" y="90" width="64" height="58" rx="18" fill="url(#bot-hoodie-grad)"/>
      <!-- White front chest plate -->
      <rect x="38" y="96" width="44" height="40" rx="10" fill="url(#bot-front-grad)"/>
      <!-- Hoodie drawstrings -->
      <line x1="52" y1="136" x2="48" y2="150" stroke="#3a78d4" stroke-width="2" stroke-linecap="round"/>
      <line x1="68" y1="136" x2="72" y2="150" stroke="#3a78d4" stroke-width="2" stroke-linecap="round"/>
      <!-- Drawstring beads -->
      <circle cx="48" cy="151" r="2.5" fill="#2f5faa"/>
      <circle cx="72" cy="151" r="2.5" fill="#2f5faa"/>
      <!-- Badge/logo on chest -->
      <rect x="50" y="104" width="20" height="14" rx="3" fill="white" opacity="0.95"/>
      <text x="60" y="114" text-anchor="middle" font-size="5.5" font-weight="700"
            font-family="'Space Grotesk', sans-serif" fill="#3a78d4">JB</text>
      <!-- Accent line glows on body side -->
      <path d="M 29 110 Q 24 120 29 130" stroke="#7ab4ff" stroke-width="1.5"
            fill="none" opacity="0.6" stroke-linecap="round"/>
      <path d="M 91 110 Q 96 120 91 130" stroke="#7ab4ff" stroke-width="1.5"
            fill="none" opacity="0.6" stroke-linecap="round"/>
    </g>

    <!-- ═══ ARMS ═══ -->
    <g id="bot-arms">
      <!-- Left arm -->
      <g id="bot-arm-left" style="transform-origin: 30px 100px;">
        <path d="M 36 100 Q 16 108 14 128" stroke="url(#bot-hoodie-grad)"
              stroke-width="14" fill="none" stroke-linecap="round"/>
        <!-- Left paw -->
        <ellipse cx="14" cy="132" rx="10" ry="8" fill="#f0f6ff"/>
        <ellipse cx="14" cy="130" rx="8" ry="6" fill="url(#bot-hoodie-grad)"/>
        <circle cx="10" cy="128" r="2.5" fill="#f0f6ff"/>
        <circle cx="14" cy="126" r="2.5" fill="#f0f6ff"/>
        <circle cx="18" cy="128" r="2.5" fill="#f0f6ff"/>
      </g>
      <!-- Right arm -->
      <g id="bot-arm-right" style="transform-origin: 90px 100px;">
        <path d="M 84 100 Q 104 108 106 128" stroke="url(#bot-hoodie-grad)"
              stroke-width="14" fill="none" stroke-linecap="round"/>
        <!-- Right paw -->
        <ellipse cx="106" cy="132" rx="10" ry="8" fill="#f0f6ff"/>
        <ellipse cx="106" cy="130" rx="8" ry="6" fill="url(#bot-hoodie-grad)"/>
        <circle cx="102" cy="128" r="2.5" fill="#f0f6ff"/>
        <circle cx="106" cy="126" r="2.5" fill="#f0f6ff"/>
        <circle cx="110" cy="128" r="2.5" fill="#f0f6ff"/>
      </g>
    </g>

    <!-- ═══ NECK ═══ -->
    <rect x="48" y="82" width="24" height="12" rx="6" fill="#4a89e8"/>

    <!-- ═══ HEAD ═══ -->
    <g id="bot-head" style="transform-origin: 60px 65px;">
      <!-- Hoodie hood -->
      <path d="M 22 68 Q 20 40 60 36 Q 100 40 98 68 Q 92 56 60 54 Q 28 56 22 68 Z"
            fill="url(#bot-hoodie-grad)"/>
      <!-- Hood inner shadow -->
      <path d="M 28 68 Q 27 48 60 46 Q 93 48 92 68 Q 85 58 60 56 Q 35 58 28 68 Z"
            fill="#3a78d4" opacity="0.5"/>
      <!-- Ears -->
      <g id="bot-ear-left">
        <path d="M 22 52 Q 10 38 20 30 Q 30 22 32 40 Z" fill="url(#bot-hoodie-grad)"/>
        <path d="M 24 50 Q 16 40 22 34 Q 28 28 29 42 Z" fill="#f0f6ff" opacity="0.5"/>
      </g>
      <g id="bot-ear-right">
        <path d="M 98 52 Q 110 38 100 30 Q 90 22 88 40 Z" fill="url(#bot-hoodie-grad)"/>
        <path d="M 96 50 Q 104 40 98 34 Q 92 28 91 42 Z" fill="#f0f6ff" opacity="0.5"/>
      </g>
      <!-- Sound waves near right ear (active during listening) -->
      <g id="bot-sound-waves">
        <path d="M 108 38 Q 115 46 110 56" stroke="#4dabff" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M 114 32 Q 123 46 116 60" stroke="#79c5ff" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M 120 26 Q 131 46 122 64" stroke="#a6dbff" stroke-width="2" fill="none" stroke-linecap="round"/>
      </g>
      <!-- Robot face visor/screen -->
      <rect x="28" y="52" width="64" height="40" rx="14" fill="url(#bot-visor-grad)"/>
      <!-- Visor shine -->
      <path d="M 32 56 Q 60 50 88 56" stroke="rgba(255,255,255,0.08)"
            stroke-width="1" fill="none" stroke-linecap="round"/>
      <!-- Inner screen border glow -->
      <rect x="30" y="54" width="60" height="36" rx="12"
            fill="none" stroke="#2a4fa0" stroke-width="1.5"/>

      <!-- ═══ EYES ═══ -->
      <g id="bot-eyes" filter="url(#bot-eye-glow)">
        <!-- Left eye -->
        <g id="bot-eye-left">
          <rect x="35" y="62" width="20" height="12" rx="4" fill="#4dabff" opacity="0.9"/>
          <rect x="37" y="64" width="16" height="8" rx="3" fill="#79c5ff"/>
          <!-- Eye shine -->
          <rect x="38" y="65" width="4" height="2" rx="1" fill="white" opacity="0.7"/>
        </g>
        <!-- Right eye -->
        <g id="bot-eye-right">
          <rect x="65" y="62" width="20" height="12" rx="4" fill="#4dabff" opacity="0.9"/>
          <rect x="67" y="64" width="16" height="8" rx="3" fill="#79c5ff"/>
          <!-- Eye shine -->
          <rect x="68" y="65" width="4" height="2" rx="1" fill="white" opacity="0.7"/>
        </g>
      </g>

      <!-- ═══ MOUTH ═══ -->
      <g id="bot-mouth">
        <!-- Closed mouth (default) -->
        <path id="bot-mouth-closed" d="M 44 85 Q 60 89 76 85"
              stroke="#4dabff" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- Open mouth (talking) — hidden by default -->
        <ellipse id="bot-mouth-open" cx="60" cy="86" rx="10" ry="5"
                 fill="#1a3a6e" stroke="#4dabff" stroke-width="1.5" opacity="0"/>
        <!-- Teeth -->
        <rect id="bot-teeth" x="54" y="83" width="12" height="4" rx="1"
              fill="white" opacity="0"/>
      </g>

      <!-- Visor bottom glow line -->
      <line x1="34" y1="90" x2="86" y2="90" stroke="#4dabff"
            stroke-width="0.5" opacity="0.3"/>
    </g>

  </svg>

  <!-- Tap hint label -->
  <div class="jessiebot-hint" id="jessiebot-hint">
    <span>tap &amp; hold to talk</span>
  </div>

  <!-- Voice UI pill -->
  <div class="jessiebot-voice-ui" id="jessiebot-voice-ui" aria-live="polite">
    <div class="jessiebot-voice-dot" id="jessiebot-voice-dot"></div>
    <span id="jessiebot-voice-label">Listening...</span>
  </div>
</div>
`;
}

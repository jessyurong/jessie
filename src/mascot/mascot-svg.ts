/**
 * JESSiE-BOT — SVG mascot markup
 * Blue-white robot in a hoodie. Inspired by the reference image.
 * All parts are individually addressable via ID for animation.
 */

export function buildMascotHTML(): string {
  return /* html */ `
<div class="jessiebot-wrap" id="jessiebot-wrap" role="button" tabindex="0" aria-label="JESSiE-BOT: tap for a quote, hold to talk">
  <!-- Speech bubble (idle / tap quotes) -->
  <div class="jessiebot-bubble" id="jessiebot-bubble" aria-live="polite">
    <span id="jessiebot-bubble-text"></span>
  </div>

  <!-- Voice-chat bubble log (user + robot messages) -->
  <div class="jessiebot-chat" id="jessiebot-chat" aria-live="polite">
    <div class="jessiebot-chat-head">
      <span class="jessiebot-chat-title">JESSiE-BOT</span>
      <span class="jessiebot-chat-status"><i></i> online</span>
    </div>
    <div class="jessiebot-chat-log" id="jessiebot-chat-log"></div>
  </div>

  <!-- Main mascot SVG -->
  <div class="jessiebot-bot" id="jessiebot-bot">
  <svg
    class="jessiebot-svg"
    id="jessiebot-svg"
    viewBox="0 0 120 180"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="JESSiE-BOT, Jessie's AI mascot"
    role="img"
  >
    <defs>
      <!-- Hoodie fabric gradient - more realistic with subtle texture variation -->
      <linearGradient id="bot-hoodie-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#9cc4f5"/>
        <stop offset="22%" stop-color="#7aa3e8"/>
        <stop offset="45%" stop-color="#5a88d4"/>
        <stop offset="65%" stop-color="#3d6ab8"/>
        <stop offset="82%" stop-color="#2a5494"/>
        <stop offset="100%" stop-color="#1d4278"/>
      </linearGradient>
      <!-- Hoodie highlight for rim lighting -->
      <linearGradient id="bot-hoodie-highlight" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#b8d8fb" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="#5a88d4" stop-opacity="0.02"/>
      </linearGradient>

      <!-- Enamel chest plate - glass-like ceramic -->
      <linearGradient id="bot-front-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
        <stop offset="15%" stop-color="#f0f6fc" stop-opacity="0.9"/>
        <stop offset="40%" stop-color="#d8e8f8" stop-opacity="0.85"/>
        <stop offset="70%" stop-color="#b8d0e8" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#98b8d8" stop-opacity="0.75"/>
      </linearGradient>

      <!-- Metal parts - brushed aluminum with environmental reflection -->
      <linearGradient id="bot-metal-grad" x1="0" y1="0" x2="0.85" y2="1">
        <stop offset="0%" stop-color="#f8fbfd"/>
        <stop offset="18%" stop-color="#d8e4ed"/>
        <stop offset="35%" stop-color="#a8bcc8"/>
        <stop offset="52%" stop-color="#7a94a8"/>
        <stop offset="68%" stop-color="#5a7488"/>
        <stop offset="82%" stop-color="#405a73"/>
        <stop offset="100%" stop-color="#2d4258"/>
      </linearGradient>
      <!-- Metal highlight for catch lights -->
      <linearGradient id="bot-metal-highlight" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25"/>
        <stop offset="50%" stop-color="#b8d8fb" stop-opacity="0.08"/>
        <stop offset="100%" stop-color="#7a94a8" stop-opacity="0"/>
      </linearGradient>

      <!-- Dark metal for joints/accents -->
      <linearGradient id="bot-dark-metal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#3a5a78"/>
        <stop offset="100%" stop-color="#1a3248"/>
      </linearGradient>

      <!-- Glass visor - realistic glass with depth -->
      <radialGradient id="bot-visor-grad" cx="42%" cy="25%" r="85%">
        <stop offset="0%" stop-color="#1a2e46" stop-opacity="0.95"/>
        <stop offset="25%" stop-color="#14243a" stop-opacity="0.98"/>
        <stop offset="55%" stop-color="#0c1a2e" stop-opacity="1"/>
        <stop offset="80%" stop-color="#08121e" stop-opacity="1"/>
        <stop offset="100%" stop-color="#040a14" stop-opacity="1"/>
      </radialGradient>
      <!-- Visor reflection gradient (environment map) -->
      <linearGradient id="bot-visor-refl" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12"/>
        <stop offset="30%" stop-color="#88c0f0" stop-opacity="0.04"/>
        <stop offset="60%" stop-color="#3a7bd5" stop-opacity="0.02"/>
        <stop offset="100%" stop-color="#0a1f3a" stop-opacity="0"/>
      </linearGradient>
      <!-- Diagonal specular streak across the glass -->
      <linearGradient id="bot-visor-spec" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset="38%" stop-color="#dff3ff" stop-opacity="0.15"/>
        <stop offset="55%" stop-color="#ffffff" stop-opacity="0.06"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
      <!-- Metal bezel around the visor -->
      <linearGradient id="bot-bezel" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#d9e8f2" stop-opacity="0.85"/>
        <stop offset="42%" stop-color="#58768f" stop-opacity="0.5"/>
        <stop offset="72%" stop-color="#a9c1d2" stop-opacity="0.7"/>
        <stop offset="100%" stop-color="#2a435b" stop-opacity="0.65"/>
      </linearGradient>
      <!-- Soft contact shadow under the feet -->
      <radialGradient id="bot-contact-shadow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(8, 22, 48, 0.42)"/>
        <stop offset="55%" stop-color="rgba(8, 22, 48, 0.22)"/>
        <stop offset="100%" stop-color="rgba(8, 22, 48, 0)"/>
      </radialGradient>
      <clipPath id="bot-visor-clip">
        <rect x="28" y="50" width="64" height="42" rx="15"/>
      </clipPath>

      <!-- Eye glow filter -->
      <filter id="bot-eye-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="0.6" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <!-- Body drop shadow -->
      <filter id="bot-shadow">
        <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="rgba(10,25,55,0.3)"/>
      </filter>

      <!-- Subtle ambient occlusion for body crevices -->
      <filter id="bot-ao" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
        <feOffset dx="0" dy="2" result="offset"/>
        <feComposite in="offset" in2="SourceAlpha" operator="in" result="ao"/>
        <feColorMatrix in="ao" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.4 0"/>
      </filter>

      <!-- Paw/finger glow -->
      <filter id="bot-paw-glow">
        <feGaussianBlur stdDeviation="0.6"/>
      </filter>
    </defs>

    <!-- ═══ SHADOW (ground) ═══ -->
    <ellipse class="bot-ground-glow" cx="60" cy="177" rx="38" ry="10" fill="url(#bot-contact-shadow)"/>
    <ellipse class="bot-ground-shadow" cx="60" cy="176" rx="28" ry="5" fill="rgba(14,33,71,0.16)"/>

    <!-- ═══ LEGS GROUP ═══ -->
    <g id="bot-legs">
      <g id="bot-leg-left">
        <!-- Upper leg / thigh -->
        <rect x="39" y="138" width="17" height="25" rx="6" fill="url(#bot-hoodie-grad)" stroke="#234b7c" stroke-width="1"/>
        <!-- Knee joint -->
        <circle cx="47.5" cy="156" r="5.5" fill="url(#bot-metal-grad)" stroke="#284966" stroke-width="1.2"/>
        <circle cx="47.5" cy="156" r="3" fill="url(#bot-metal-highlight)"/>
        <!-- Lower leg -->
        <rect x="39" y="158" width="17" height="16" rx="5" fill="url(#bot-metal-grad)" stroke="#284966" stroke-width="1"/>
        <!-- Ankle joint -->
        <ellipse cx="47.5" cy="174" rx="7" ry="3.5" fill="url(#bot-dark-metal)" stroke="#1a3248" stroke-width="1"/>
        <!-- Foot -->
        <path d="M38 174h18v8c0 4-3 7-8 7h-6c-4 0-7-3-7-7v-5c0-2 1-4 3-5z" fill="url(#bot-metal-grad)" stroke="#284966" stroke-width="1"/>
        <!-- Tread detail -->
        <path d="M40 182h13m-11-2v2m5-2v2m5-2v2" stroke="#263f58" stroke-width="1" stroke-linecap="round"/>
        <!-- Highlight on thigh -->
        <rect x="39" y="138" width="17" height="8" rx="3" fill="url(#bot-hoodie-highlight)"/>
        <!-- Specular highlight on knee -->
        <circle cx="45" cy="154" r="1.2" fill="#e7f4ff" opacity=".9"/>
      </g>
      <g id="bot-leg-right">
        <rect x="64" y="138" width="17" height="25" rx="6" fill="url(#bot-hoodie-grad)" stroke="#234b7c" stroke-width="1"/>
        <circle cx="72.5" cy="156" r="5.5" fill="url(#bot-metal-grad)" stroke="#284966" stroke-width="1.2"/>
        <circle cx="72.5" cy="156" r="3" fill="url(#bot-metal-highlight)"/>
        <rect x="64" y="158" width="17" height="16" rx="5" fill="url(#bot-metal-grad)" stroke="#284966" stroke-width="1"/>
        <ellipse cx="72.5" cy="174" rx="7" ry="3.5" fill="url(#bot-dark-metal)" stroke="#1a3248" stroke-width="1"/>
        <path d="M64 174h18c2 1 3 3 3 5v3c0 3-2 6-6 6h-6c-5 0-9-3-9-8v-6z" fill="url(#bot-metal-grad)" stroke="#284966" stroke-width="1"/>
        <path d="M67 182h13m-11-2v2m5-2v2m5-2v2" stroke="#263f58" stroke-width="1" stroke-linecap="round"/>
        <rect x="64" y="138" width="17" height="8" rx="3" fill="url(#bot-hoodie-highlight)"/>
        <circle cx="75" cy="154" r="1.2" fill="#e7f4ff" opacity=".9"/>
      </g>
    </g>

    <!-- ═══ TAIL ═══ -->
    <g id="bot-tail">
      <path d="M82 143c11 1 20-3 22-10 2-6-3-10-8-7-4 2-4 7 0 9" fill="none" stroke="#234b7c" stroke-width="5" stroke-linecap="round"/>
      <path d="M82 142c10 1 17-3 19-9 1-3-1-5-3-5" fill="none" stroke="#91b8d7" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>
      <circle cx="96" cy="126" r="3" fill="url(#bot-metal-grad)" stroke="#284966" stroke-width=".8"/>
      <circle cx="96" cy="126" r="1.2" fill="#e7f4ff" opacity=".7"/>
    </g>

    <!-- ═══ BODY ═══ -->
    <g id="bot-body" filter="url(#bot-shadow)">
      <!-- Main body -->
      <rect x="28" y="88" width="64" height="62" rx="18" fill="url(#bot-hoodie-grad)" stroke="#234b7c" stroke-width="1.5"/>
      <!-- Subtle body highlight (rim light) -->
      <rect x="28" y="88" width="64" height="12" rx="10" fill="url(#bot-hoodie-highlight)"/>
      <!-- Right-side rim light: keeps the key light consistent with the face -->
      <path d="M87 96c4 10 6 22 4 34" stroke="rgba(214, 240, 255, 0.42)" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M33 94c-4 8-5 17-3 26" stroke="rgba(8, 28, 58, 0.22)" stroke-width="2" fill="none" stroke-linecap="round"/>
      <!-- Side panel lines -->
      <path d="M32 102c8 6 12 18 12 35M88 102c-8 6-12 18-12 35" fill="none" stroke="#c3e0fb" stroke-width="1" opacity=".18"/>
      <!-- White enamel chest plate with glass depth -->
      <rect x="38" y="96" width="44" height="42" rx="10" fill="url(#bot-front-grad)" stroke="#9eb8cc" stroke-width="1"/>
      <!-- Chest plate highlight -->
      <rect x="38" y="96" width="44" height="10" rx="6" fill="#ffffff" opacity="0.15"/>
      <!-- Glass-like diagonal sheen on the enamel plate -->
      <path d="M41 134l17-34h8l-15 34z" fill="rgba(255, 255, 255, 0.18)"/>
      <path d="M62 133l15-28" stroke="rgba(255, 255, 255, 0.24)" stroke-width="2" stroke-linecap="round"/>
      <!-- Chest plate seam -->
      <path d="M43 127h34" stroke="#8ba5ba" stroke-width=".8" opacity=".7"/>
      <!-- Chest screws/rivets -->
      <circle cx="43" cy="102" r="1.2" fill="#6c879c"/>
      <circle cx="77" cy="102" r="1.2" fill="#6c879c"/>
      <!-- Lower chest accent -->
      <circle cx="48" cy="132" r="1" fill="#5a88d4" opacity=".6"/>
      <circle cx="72" cy="132" r="1" fill="#5a88d4" opacity=".6"/>
      <!-- Hoodie drawstrings -->
      <line x1="52" y1="136" x2="48" y2="152" stroke="#234b7c" stroke-width="2" stroke-linecap="round"/>
      <line x1="68" y1="136" x2="72" y2="152" stroke="#234b7c" stroke-width="2" stroke-linecap="round"/>
      <circle cx="48" cy="153" r="2.5" fill="#1f426d"/>
      <circle cx="72" cy="153" r="2.5" fill="#1f426d"/>
      <circle cx="48" cy="153" r="0.8" fill="#7ab8ff" opacity=".5"/>
      <circle cx="72" cy="153" r="0.8" fill="#7ab8ff" opacity=".5"/>
      <!-- ID badge on chest -->
      <rect x="50" y="104" width="20" height="14" rx="3" fill="#fff" stroke="#9eb8cc" stroke-width=".7"/>
      <text x="60" y="114" text-anchor="middle" font-size="5.5" font-weight="700" font-family="'Space Grotesk', sans-serif" fill="#3569aa">JB</text>
      <!-- Subtle fabric texture lines -->
      <path d="M29 110 Q24 120 29 130" stroke="#a8d4f5" stroke-width="1.2" fill="none" opacity=".45" stroke-linecap="round"/>
      <path d="M91 110 Q96 120 91 130" stroke="#a8d4f5" stroke-width="1.2" fill="none" opacity=".45" stroke-linecap="round"/>
      <!-- Ambient occlusion at arm sockets -->
      <ellipse cx="30" cy="102" rx="4" ry="8" fill="rgba(14,33,71,0.12)"/>
      <ellipse cx="90" cy="102" rx="4" ry="8" fill="rgba(14,33,71,0.12)"/>
    </g>

    <!-- ═══ ARMS ═══ -->
    <g id="bot-arms">
      <!-- Left arm -->
      <g id="bot-arm-left" style="transform-origin: 30px 100px;">
        <!-- Upper arm sleeve -->
        <path d="M 36 100 Q 16 108 14 128" stroke="#234b7c" stroke-width="19" fill="none" stroke-linecap="round"/>
        <path d="M 36 100 Q 16 108 14 128" stroke="url(#bot-hoodie-grad)" stroke-width="15" fill="none" stroke-linecap="round"/>
        <!-- Elbow joint -->
        <ellipse cx="19" cy="118" rx="7" ry="5" fill="url(#bot-metal-grad)" stroke="#284966" stroke-width="1"/>
        <circle cx="17" cy="116" r="1.5" fill="#e7f4ff" opacity=".8"/>
        <!-- Forearm -->
        <path d="M 22 120 Q 14 130 10 140" stroke="url(#bot-metal-grad)" stroke-width="14" fill="none" stroke-linecap="round"/>
        <!-- Wrist joint -->
        <rect x="4" y="138" width="13" height="6" rx="2.5" fill="url(#bot-dark-metal)" stroke="#1a3248" stroke-width="1"/>
        <!-- Hand -->
        <path d="M2 142c0-7 4-12 9-12h4c5 0 9 3 9 8v7c0 4-3 7-7 7h-6c-4 0-7-4-7-10z" fill="url(#bot-metal-grad)" stroke="#284966" stroke-width="1"/>
        <!-- Finger segments -->
        <path d="M6 139v7m5-8v9m5-7v6" stroke="#405a73" stroke-width="1" stroke-linecap="round"/>
        <!-- Fingertip sensors -->
        <circle cx="6" cy="146" r="0.8" fill="#4dabff" opacity=".9"/>
        <circle cx="11" cy="148" r="0.8" fill="#4dabff" opacity=".9"/>
        <circle cx="16" cy="147" r="0.8" fill="#4dabff" opacity=".9"/>
      </g>
      <g id="bot-arm-right" style="transform-origin: 90px 100px;">
        <path d="M 84 100 Q 104 108 106 128" stroke="#234b7c" stroke-width="19" fill="none" stroke-linecap="round"/>
        <path d="M 84 100 Q 104 108 106 128" stroke="url(#bot-hoodie-grad)" stroke-width="15" fill="none" stroke-linecap="round"/>
        <ellipse cx="101" cy="118" rx="7" ry="5" fill="url(#bot-metal-grad)" stroke="#284966" stroke-width="1"/>
        <circle cx="103" cy="116" r="1.5" fill="#e7f4ff" opacity=".8"/>
        <path d="M 98 120 Q 106 130 110 140" stroke="url(#bot-metal-grad)" stroke-width="14" fill="none" stroke-linecap="round"/>
        <rect x="103" y="138" width="13" height="6" rx="2.5" fill="url(#bot-dark-metal)" stroke="#1a3248" stroke-width="1"/>
        <path d="M98 140c0-5 4-8 9-8h4c5 0 9 5 9 12v4c0 6-3 9-7 9h-6c-4 0-7-3-7-7z" fill="url(#bot-metal-grad)" stroke="#284966" stroke-width="1"/>
        <path d="M102 139v6m5-7v9m5-7v6" stroke="#405a73" stroke-width="1" stroke-linecap="round"/>
        <circle cx="102" cy="145" r="0.8" fill="#4dabff" opacity=".9"/>
        <circle cx="107" cy="148" r="0.8" fill="#4dabff" opacity=".9"/>
        <circle cx="112" cy="146" r="0.8" fill="#4dabff" opacity=".9"/>
      </g>
    </g>

    <!-- ═══ NECK ═══ -->
    <rect x="48" y="80" width="24" height="14" rx="7" fill="url(#bot-metal-grad)" stroke="#284966" stroke-width="1"/>
    <ellipse cx="60" cy="87" rx="8" ry="3" fill="url(#bot-metal-highlight)"/>

    <!-- ═══ HEAD ═══ -->
    <g id="bot-head" style="transform-origin: 60px 65px;">
      <g id="bot-head-inner">
      <!-- Hoodie hood -->
      <path d="M 22 68 Q 20 38 60 34 Q 100 38 98 68 Q 92 56 60 54 Q 28 56 22 68 Z"
            fill="url(#bot-hoodie-grad)"/>
      <!-- Hood inner shadow/depth -->
      <path d="M 28 68 Q 27 46 60 44 Q 93 46 92 68 Q 85 58 60 56 Q 35 58 28 68 Z"
            fill="#3a78d4" opacity="0.5"/>
      <!-- Hood rim highlight -->
      <path d="M 24 66 Q 23 42 60 39 Q 97 42 96 66" fill="none" stroke="#7ab8ff" stroke-width="0.8" opacity="0.3" stroke-linecap="round"/>
      <!-- Crisp rim light on the upper-right hood edge -->
      <path d="M 61 35 Q 88 36 96 58" fill="none" stroke="rgba(221, 244, 255, 0.55)" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M 30 58 Q 34 44 52 39" fill="none" stroke="rgba(8, 30, 64, 0.28)" stroke-width="1.6" stroke-linecap="round"/>

      <!-- Ears / antenna pods -->
      <g id="bot-ear-left">
        <!-- Outer housing -->
        <rect x="10" y="34" width="20" height="25" rx="8" fill="url(#bot-hoodie-grad)" stroke="#274b70" stroke-width="1.4"/>
        <!-- Inner sensor housing -->
        <rect x="13" y="38" width="14" height="17" rx="5" fill="url(#bot-metal-grad)" stroke="#284966" stroke-width="0.8"/>
        <!-- LED ring -->
        <circle cx="20" cy="46.5" r="4" fill="none" stroke="#3a7bd5" stroke-width="1.5" opacity=".7"/>
        <!-- Active sensor -->
        <circle cx="20" cy="46.5" r="2.5" fill="#58b7f2" stroke="#d8f2ff" stroke-width=".8"/>
        <circle cx="20" cy="46.5" r="0.9" fill="#fff" opacity=".9"/>
        <!-- Status indicator -->
        <circle cx="26" cy="38" r="1.5" fill="#ff4d4d" opacity=".3"/>
      </g>
      <g id="bot-ear-right">
        <rect x="90" y="34" width="20" height="25" rx="8" fill="url(#bot-hoodie-grad)" stroke="#274b70" stroke-width="1.4"/>
        <rect x="93" y="38" width="14" height="17" rx="5" fill="url(#bot-metal-grad)" stroke="#284966" stroke-width="0.8"/>
        <circle cx="100" cy="46.5" r="4" fill="none" stroke="#3a7bd5" stroke-width="1.5" opacity=".7"/>
        <circle cx="100" cy="46.5" r="2.5" fill="#58b7f2" stroke="#d8f2ff" stroke-width=".8"/>
        <circle cx="100" cy="46.5" r="0.9" fill="#fff" opacity=".9"/>
        <circle cx="106" cy="38" r="1.5" fill="#4dff4d" opacity=".3"/>
      </g>

      <!-- Sound waves near right ear (active during listening) -->
      <g id="bot-sound-waves" opacity="0">
        <path d="M 108 38 Q 115 46 110 56" stroke="#4dabff" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M 114 32 Q 123 46 116 60" stroke="#79c5ff" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M 120 26 Q 131 46 122 64" stroke="#a6dbff" stroke-width="2" fill="none" stroke-linecap="round"/>
      </g>

      <!-- Robot face visor/screen - realistic glass -->
      <rect x="28" y="50" width="64" height="42" rx="15" fill="url(#bot-visor-grad)"/>
      <!-- Visor reflection (environment) -->
      <rect x="28" y="50" width="64" height="42" rx="15" fill="url(#bot-visor-refl)"/>
      <!-- Diagonal glass sheen, clipped to the visor shape -->
      <g clip-path="url(#bot-visor-clip)">
        <path d="M22 80L58 38h18L38 96z" fill="url(#bot-visor-spec)"/>
        <path d="M70 40l-14 52" stroke="rgba(255, 255, 255, 0.14)" stroke-width="3" stroke-linecap="round"/>
        <path d="M29 88c12 4 44 4 62-2" stroke="rgba(2, 10, 24, 0.45)" stroke-width="5" fill="none" opacity=".5"/>
      </g>
      <!-- Metal bezel around the glass -->
      <rect x="28" y="50" width="64" height="42" rx="15" fill="none" stroke="url(#bot-bezel)" stroke-width="2"/>
      <!-- Visor highlight (fresnel) -->
      <path d="M 32 54 Q 60 48 88 54" stroke="rgba(255,255,255,0.14)" stroke-width="1" fill="none" stroke-linecap="round"/>
      <!-- Inner screen border glow -->
      <rect x="30" y="52" width="60" height="38" rx="13" fill="none" stroke="#2a4fa0" stroke-width="1.5"/>

      <!-- ═══ EYES ═══ -->
      <g id="bot-eyes" filter="url(#bot-eye-glow)">
        <!-- Left eye -->
        <g id="bot-eye-left">
          <!-- Eye socket/base -->
          <rect x="34" y="61" width="22" height="14" rx="5" fill="#0a1a2e"/>
          <!-- Glow layer -->
          <rect x="35" y="62" width="20" height="12" rx="4" fill="#4dabff" opacity="0.9"/>
          <!-- Core -->
          <rect x="37" y="64" width="16" height="8" rx="3" fill="#79c5ff"/>
          <!-- Pupil (dark center for depth) -->
          <rect x="41" y="66" width="8" height="4" rx="2" fill="#081426" opacity=".7"/>
          <!-- Eye shine / catch light -->
          <rect x="38" y="65" width="4" height="2" rx="1" fill="white" opacity="0.7"/>
          <circle cx="48" cy="69" r="1.2" fill="white" opacity="0.4"/>
        </g>
        <!-- Right eye -->
        <g id="bot-eye-right">
          <rect x="64" y="61" width="22" height="14" rx="5" fill="#0a1a2e"/>
          <rect x="65" y="62" width="20" height="12" rx="4" fill="#4dabff" opacity="0.9"/>
          <rect x="67" y="64" width="16" height="8" rx="3" fill="#79c5ff"/>
          <rect x="71" y="66" width="8" height="4" rx="2" fill="#081426" opacity=".7"/>
          <rect x="68" y="65" width="4" height="2" rx="1" fill="white" opacity="0.7"/>
          <circle cx="78" cy="69" r="1.2" fill="white" opacity="0.4"/>
        </g>
      </g>

      <!-- ═══ MOUTH ═══ -->
      <g id="bot-mouth">
        <!-- Closed mouth (default) - subtle LED line -->
        <path id="bot-mouth-closed" d="M 44 87 Q 60 91 76 87"
              stroke="#4dabff" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- Open mouth (talking) — hidden by default -->
        <ellipse id="bot-mouth-open" cx="60" cy="88" rx="12" ry="7"
                 fill="#0a182e" stroke="#4dabff" stroke-width="1.5" opacity="0"/>
        <!-- Teeth / grille -->
        <rect id="bot-teeth" x="53" y="84" width="14" height="5" rx="1"
              fill="url(#bot-metal-grad)" opacity="0"/>
      </g>

      <!-- Visor bottom glow line -->
      <line x1="34" y1="90" x2="86" y2="90" stroke="#4dabff" stroke-width="0.5" opacity="0.3"/>

      <!-- Forehead sensor strip -->
      <rect x="40" y="42" width="40" height="3" rx="1.5" fill="url(#bot-metal-grad)" opacity=".4"/>
      <circle cx="50" cy="43.5" r="1" fill="#4dabff" opacity=".5"/>
      <circle cx="70" cy="43.5" r="1" fill="#4dabff" opacity=".5"/>

      </g>
    </g>

  </svg>
    <!-- Robot-talk sound waves (shown while speaking) -->
    <div class="jessiebot-soundwave" id="jessiebot-soundwave" aria-hidden="true">
      <i></i><i></i><i></i><i></i><i></i>
    </div>
  </div>

  <!-- Tap hint label -->
  <div class="jessiebot-hint" id="jessiebot-hint">
    <span>tap & hold to talk</span>
  </div>

  <!-- Voice UI pill -->
  <div class="jessiebot-voice-ui" id="jessiebot-voice-ui" aria-live="polite">
    <div class="jessiebot-voice-dot" id="jessiebot-voice-dot"></div>
    <span id="jessiebot-voice-label">Listening...</span>
  </div>
</div>
`;
}

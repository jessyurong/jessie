/**
 * JESSiE-BOT — Main controller
 * Orchestrates movement, bubbles, interactions, and voice chat
 */

import './mascot.css';
import { buildMascotHTML } from './mascot-svg';
import { MascotAnimator } from './mascot-anims';
import { startVoiceChat, stopVoiceChat, stopListening, isSpeaking } from './mascot-ai';

// ── Random idle speech bubbles ──────────────────────────────────
const IDLE_QUOTES: string[] = [
  'Uy, check mo na yung projects ko below! 👇',
  'Need mo ba ng web app? Talk to me! 💻',
  'I built a full POS system. No cap. 🔥',
  'Cellphone repair din — I got you. 🔧',
  '3rd year BSIT pero senior-level ang builds. 😤',
  'Mabinay represent! 🌿',
  'Try mo i-tap at i-hold ako para makausap mo ako! 👆',
  'Busy ako pero lagi kang priority. 🫡',
  'May project ka ba? Let\'s collab! 🤝',
  'Gemini-powered ako bro, super smart. 🤖',
  'POS system? Org management? Web app? Kaya ko yan! 💪',
  'Ask me anything about Jessie! Just hold me. 🎙️',
  'FixMo PH — ang next level na repair shop system. ⚡',
  'Winter Arc ang pinaka-cool na habit tracker. 🏔️',
  'Nag-aaral pa lang pero nagtatrabaho na rin. Grind mode! ✨',
];

const TAP_QUOTES: string[] = [
  'Uy, ingat sa sarili! 😄',
  'Ayyyy! That tickles! 😂',
  'Heeey! 👋',
  'Ok ok ok, may tanong ka ba? 🤔',
  'Hala, tumingin ka ng projects ko ha! 👇',
  'Sus! Bat mo ko tinatap? 😆',
  'Busy ako bro pero sige na! 😅',
  'Hold me for 1 second para magsalita tayo! 🎙️',
];

// ── Movement system ──────────────────────────────────────────────
const WALK_SPEED_PX_PER_FRAME = 0.6;
const BOT_WIDTH_PX = 130;
const EDGE_MARGIN = 20;

export function initMascot(): void {
  // Only inject on hero (not sheet mode) — destroy handled by sheet observer
  const frame = document.getElementById('frame');
  if (!frame) return;

  // Inject HTML
  frame.insertAdjacentHTML('beforeend', buildMascotHTML());

  const wrap = document.getElementById('jessiebot-wrap') as HTMLElement;
  if (!wrap) return;

  const bubble = document.getElementById('jessiebot-bubble') as HTMLElement;
  const bubbleText = document.getElementById('jessiebot-bubble-text') as HTMLElement;
  const hintEl = document.getElementById('jessiebot-hint') as HTMLElement;
  const voiceUI = document.getElementById('jessiebot-voice-ui') as HTMLElement;
  const voiceLabel = document.getElementById('jessiebot-voice-label') as HTMLElement;

  const animator = new MascotAnimator(wrap);

  // ── Position + walking state ─────────────────────────────────
  let posX = EDGE_MARGIN;
  let direction: 1 | -1 = 1; // 1 = right, -1 = left
  let walking = true;
  let raf: number | null = null;

  function getMaxX(): number {
    return (window.innerWidth * 0.5) - BOT_WIDTH_PX - EDGE_MARGIN;
  }

  function walk(): void {
    if (!walking || isHolding || animator.getState() !== 'walk') {
      raf = requestAnimationFrame(walk);
      return;
    }

    posX += WALK_SPEED_PX_PER_FRAME * direction;

    const maxX = getMaxX();
    if (posX >= maxX) { posX = maxX; direction = -1; animator.setFacing('left'); }
    if (posX <= EDGE_MARGIN) { posX = EDGE_MARGIN; direction = 1; animator.setFacing('right'); }

    wrap.style.transform = `translateX(${posX}px)`;
    raf = requestAnimationFrame(walk);
  }

  animator.setState('walk');
  animator.setFacing('right');
  animator.startRandomActions();
  walk();

  // ── Bubble system ─────────────────────────────────────────────
  let bubbleTimer: ReturnType<typeof setTimeout> | null = null;
  let typewriterTimer: ReturnType<typeof setTimeout> | null = null;
  let hintHideTimer: ReturnType<typeof setTimeout> | null = null;

  // Hide hint after 6 seconds
  hintHideTimer = setTimeout(() => { hintEl.classList.add('hidden'); }, 6000);

  function showBubble(text: string, durationMs = 4500, isAI = false): void {
    // Clear previous
    if (bubbleTimer) { clearTimeout(bubbleTimer); bubbleTimer = null; }
    if (typewriterTimer) { clearTimeout(typewriterTimer); typewriterTimer = null; }

    bubble.classList.toggle('ai-response', isAI);
    bubbleText.textContent = '';
    bubble.classList.add('visible');

    // Typewriter effect
    let i = 0;
    function type(): void {
      if (i < text.length) {
        bubbleText.textContent += text[i];
        i++;
        typewriterTimer = setTimeout(type, 28);
      }
    }
    type();

    bubbleTimer = setTimeout(() => {
      bubble.classList.remove('visible');
      bubbleTimer = null;
    }, durationMs);
  }

  // Random idle bubbles every 12–24 seconds
  function scheduleIdleBubble(): void {
    const delay = 12000 + Math.random() * 12000;
    setTimeout(() => {
      if (animator.getState() === 'walk' || animator.getState() === 'idle') {
        const quote = IDLE_QUOTES[Math.floor(Math.random() * IDLE_QUOTES.length)];
        showBubble(quote, 5000);
      }
      scheduleIdleBubble();
    }, delay);
  }
  // First bubble after 4 seconds
  setTimeout(() => {
    showBubble('Uy! Tap and hold me to chat! 🎙️', 4000);
    scheduleIdleBubble();
  }, 4000);

  // ── Mouth sync while speaking ─────────────────────────────────
  setInterval(() => {
    const talking = isSpeaking();
    if (talking && animator.getState() !== 'talking') {
      animator.setState('talking');
      walking = false;
    } else if (!talking && animator.getState() === 'talking') {
      // Done speaking: only resume walking if user is not holding!
      if (!isHolding) {
        animator.setState('walk');
        walking = true;
      }
    }
  }, 80);

  // ── Tap / Long Press ──────────────────────────────────────────
  let pressTimer: ReturnType<typeof setTimeout> | null = null;
  let isLongPress = false;
  let isHolding = false;
  const LONG_PRESS_MS = 500;

  function onPressStart(): void {
    isHolding = true;
    isLongPress = false;
    walking = false; // Hihinto agad habang naka-hold

    pressTimer = setTimeout(() => {
      if (!isHolding) return;
      isLongPress = true;
      startListening();
    }, LONG_PRESS_MS);
  }

  function onPressEnd(): void {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }

    const wasLongPress = isLongPress;
    isHolding = false;

    if (!wasLongPress) {
      onTap();
      return;
    }

    // Binitawan na ang long press / hold:
    stopListening();

    // Lalakad lang sya ulit kapag binitawan ang hold
    if (!isSpeaking() && animator.getState() !== 'thinking') {
      voiceUI.classList.remove('visible');
      animator.setState('walk');
      animator.startRandomActions();
      walking = true;
    }
  }

  function onCancelHold(): void {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
    const wasLongPress = isLongPress;
    isHolding = false;

    if (wasLongPress) {
      stopListening();
    }

    if (!isSpeaking() && animator.getState() !== 'thinking') {
      voiceUI.classList.remove('visible');
      animator.setState('walk');
      animator.startRandomActions();
      walking = true;
    }
  }

  function onTap(): void {
    const quote = TAP_QUOTES[Math.floor(Math.random() * TAP_QUOTES.length)];
    showBubble(quote, 3000);
    walking = false;
    animator.setState('react', () => {
      if (!isHolding) {
        animator.setState('walk');
        walking = true;
      }
    });
  }

  function startListening(): void {
    walking = false;
    animator.stopRandomActions();
    animator.setState('listening'); // hahawak sa tainga at nakikinig
    voiceUI.classList.add('visible');
    voiceLabel.textContent = 'Listening... 🎙️';
    hintEl.classList.add('hidden');

    showBubble('Nakikinig ako sayo... 👂', 3000);

    startVoiceChat({
      onStateChange: (state) => {
        if (state === 'thinking') {
          voiceLabel.textContent = 'Thinking... 🧠';
          animator.setState('thinking');
          showBubble('...', 10000);
        } else if (state === 'talking') {
          voiceLabel.textContent = 'Talking... 💬';
          animator.setState('talking');
        } else if (state === 'idle') {
          voiceUI.classList.remove('visible');
          // Lalakad lang ulit kung binitawan na ang hold!
          if (!isHolding) {
            animator.setState('walk');
            animator.startRandomActions();
            walking = true;
          }
        }
      },
      onTranscript: (text) => {
        voiceLabel.textContent = `You: "${text.slice(0, 40)}${text.length > 40 ? '…' : ''}"`;
      },
      onResponse: (text) => {
        showBubble(text, Math.max(5000, text.length * 60), true);
      },
      onError: (msg) => {
        showBubble(msg, 4000);
        voiceUI.classList.remove('visible');
        // Lalakad lang ulit kung binitawan na ang hold!
        if (!isHolding) {
          animator.setState('walk');
          animator.startRandomActions();
          walking = true;
        }
      },
    });
  }

  // Touch events
  wrap.addEventListener('touchstart', (e) => { e.preventDefault(); onPressStart(); }, { passive: false });
  wrap.addEventListener('touchend', (e) => { e.preventDefault(); onPressEnd(); }, { passive: false });
  wrap.addEventListener('touchcancel', onCancelHold);

  // Mouse events (desktop)
  wrap.addEventListener('mousedown', onPressStart);
  wrap.addEventListener('mouseup', onPressEnd);
  wrap.addEventListener('mouseleave', onCancelHold);

  // ── Hide mascot when sheet opens ─────────────────────────────
  const observer = new MutationObserver(() => {
    const sheetOpen = document.body.classList.contains('sheet-open');
    if (sheetOpen) {
      stopVoiceChat();
      voiceUI.classList.remove('visible');
    }
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // ── Cleanup on page unload ───────────────────────────────────
  window.addEventListener('beforeunload', () => {
    animator.destroy();
    stopVoiceChat();
    if (raf) cancelAnimationFrame(raf);
    if (bubbleTimer) clearTimeout(bubbleTimer);
    if (typewriterTimer) clearTimeout(typewriterTimer);
    if (hintHideTimer) clearTimeout(hintHideTimer);
    observer.disconnect();
  });
}

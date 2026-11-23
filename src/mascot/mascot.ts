/**
 * JESSiE-BOT — Main controller
 * Orchestrates movement, bubbles, interactions, and voice chat.
 */

import './mascot.css';
import { buildMascotHTML } from './mascot-svg';
import { MascotAnimator } from './mascot-anims';
import { startVoiceChat, stopVoiceChat, stopListening, isSpeaking } from './mascot-ai';

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

const IDLE_QUOTES: string[] = [
  'Uy, check mo yung projects ko! 👇',
  'Need mo ba ng web app? Talk to me! 💻',
  'Full-stack dev ako — React, TypeScript, at PostgreSQL. ⚡',
  'Try mo i-hold ako para makapag-usap tayo. 🎙️',
  'May idea ka? Let’s build something. 🤝',
  'Mabinay represent! 🌿',
  'Tahimik lang ako dito, pero ready ako. 🫡',
  'Ask me anything about Jessie. 🤖',
];

// ── Movement system ──────────────────────────────────────────────
const WALK_SPEED_PX_PER_SECOND = 34;
const BOT_WIDTH_PX = 130;
const EDGE_MARGIN = 20;

export function initMascot(): void {
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = motionQuery.matches;

  // The robot lives in screen-space, not inside the scaled hero frame.
  // That keeps it visible and correctly sized on narrow screens.
  const stage = document.getElementById('stage');
  if (!stage) return;

  stage.insertAdjacentHTML('beforeend', buildMascotHTML());

  const wrap = document.getElementById('jessiebot-wrap') as HTMLElement | null;
  if (!wrap) return;
  const wrapEl: HTMLElement = wrap;

  const bubble = document.getElementById('jessiebot-bubble') as HTMLElement;
  const bubbleText = document.getElementById('jessiebot-bubble-text') as HTMLElement;
  const hintEl = document.getElementById('jessiebot-hint') as HTMLElement;
  const voiceUI = document.getElementById('jessiebot-voice-ui') as HTMLElement;
  const voiceLabel = document.getElementById('jessiebot-voice-label') as HTMLElement;
  const chatEl = document.getElementById('jessiebot-chat') as HTMLElement | null;
  const chatLog = document.getElementById('jessiebot-chat-log') as HTMLElement | null;
  const headInner = document.getElementById('bot-head-inner');

  const animator = new MascotAnimator(wrap);

  // ── Position + walking state ─────────────────────────────────
  let posX = EDGE_MARGIN;
  let direction: 1 | -1 = 1;
  let walking = !reducedMotion;
  let raf: number | null = null;
  let lastFrame = 0;

  // Interaction state must exist before walk() can inspect it.
  let pressTimer: ReturnType<typeof setTimeout> | null = null;
  let isLongPress = false;
  let isHolding = false;
  const LONG_PRESS_MS = 500;

  function getMaxX(): number {
    const width = wrapEl.offsetWidth || BOT_WIDTH_PX;
    return Math.max(EDGE_MARGIN, (window.innerWidth * 0.5) - width - EDGE_MARGIN);
  }

  /** Keep the chat bubble inside the viewport even when the bot hugs an edge. */
  function updateBubbleShift(): void {
    const rect = wrapEl.getBoundingClientRect();
    const mid = rect.left + rect.width / 2;
    const half = 134; // half of the chat panel width + a small gutter
    const min = half + 8;
    const max = window.innerWidth - half - 8;
    const clamped = max > min ? Math.min(max, Math.max(min, mid)) : mid;
    wrapEl.style.setProperty('--bubble-shift', `${(clamped - mid).toFixed(1)}px`);
  }

  function resumeWalk(): void {
    if (reducedMotion) {
      walking = false;
      animator.setState('idle');
      return;
    }
    walking = true;
    animator.setState('walk');
    animator.startRandomActions();
  }

  function walk(ts: number): void {
    raf = requestAnimationFrame(walk);

    if (!walking || isHolding || animator.getState() !== 'walk') {
      lastFrame = ts;
      return;
    }

    const dt = lastFrame ? Math.min(0.05, (ts - lastFrame) / 1000) : 1 / 60;
    lastFrame = ts;
    posX += WALK_SPEED_PX_PER_SECOND * dt * direction;

    const maxX = getMaxX();
    if (posX >= maxX) { posX = maxX; direction = -1; animator.setFacing('left'); applyLook(); }
    if (posX <= EDGE_MARGIN) { posX = EDGE_MARGIN; direction = 1; animator.setFacing('right'); applyLook(); }

    wrapEl.style.transform = `translate3d(${posX}px, 0, 0)`;
    updateBubbleShift();
  }

  // ── Cursor-aware head look ───────────────────────────────────
  let lookX = 0;
  let lookY = 0;
  let lookTargetX = 0;
  let lookTargetY = 0;
  let lookRaf: number | null = null;

  function applyLook(): void {
    if (!headInner) return;
    // The robot is mirrored while walking left, so mirror the look vector too.
    const flip = direction === 1 ? 1 : -1;
    const x = lookX * flip;
    headInner.style.transform =
      `translate(${x.toFixed(2)}px, ${lookY.toFixed(2)}px) rotate(${(x * 0.5).toFixed(2)}deg)`;
  }

  function renderLook(): void {
    lookX += (lookTargetX - lookX) * 0.14;
    lookY += (lookTargetY - lookY) * 0.14;
    applyLook();

    if (Math.abs(lookTargetX - lookX) > 0.01 || Math.abs(lookTargetY - lookY) > 0.01) {
      lookRaf = requestAnimationFrame(renderLook);
    } else {
      lookRaf = null;
    }
  }

  function resetLook(): void {
    lookTargetX = 0;
    lookTargetY = 0;
    lookX = 0;
    lookY = 0;
    if (lookRaf) {
      cancelAnimationFrame(lookRaf);
      lookRaf = null;
    }
    if (headInner) headInner.style.transform = '';
  }

  function onPointerMove(e: PointerEvent): void {
    if (reducedMotion || e.pointerType !== 'mouse' || !headInner) return;

    const rect = wrapEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.32;
    const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth * 0.5)));
    const ny = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight * 0.55)));

    lookTargetX = nx * 1.8;
    lookTargetY = ny * 1.2;

    if (!lookRaf) lookRaf = requestAnimationFrame(renderLook);
  }

  // ── Bubble system ─────────────────────────────────────────────
  let bubbleTimer: ReturnType<typeof setTimeout> | null = null;
  let typewriterTimer: ReturnType<typeof setTimeout> | null = null;
  let hintHideTimer: ReturnType<typeof setTimeout> | null = null;
  let idleBubbleTimer: ReturnType<typeof setTimeout> | null = null;
  let idleBubbleStart: ReturnType<typeof setTimeout> | null = null;
  let mouthSyncTimer: ReturnType<typeof setInterval> | null = null;

  function showBubble(text: string, durationMs = 4500, isAI = false): void {
    if (bubbleTimer) { clearTimeout(bubbleTimer); bubbleTimer = null; }
    if (typewriterTimer) { clearTimeout(typewriterTimer); typewriterTimer = null; }

    bubble.classList.toggle('ai-response', isAI);
    bubbleText.textContent = '';
    bubble.classList.add('visible');

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

  // ── Voice-chat bubble log ─────────────────────────────────────
  let chatHideTimer: ReturnType<typeof setTimeout> | null = null;
  let typingEl: HTMLElement | null = null;

  function openChat(): void {
    if (!chatEl || !chatLog) return;
    if (bubbleTimer) { clearTimeout(bubbleTimer); bubbleTimer = null; }
    bubble.classList.remove('visible');
    if (chatHideTimer) { clearTimeout(chatHideTimer); chatHideTimer = null; }
    chatLog.innerHTML = '';
    typingEl = null;
    chatEl.classList.add('visible');
  }

  function closeChatSoon(delay = 9000): void {
    if (!chatEl) return;
    if (chatHideTimer) clearTimeout(chatHideTimer);
    chatHideTimer = setTimeout(() => {
      chatEl?.classList.remove('visible');
      chatHideTimer = null;
    }, delay);
  }

  function chatPush(role: 'user' | 'bot', text: string): HTMLElement {
    const msg = document.createElement('div');
    msg.className = `jessiebot-chat-msg ${role}`;
    msg.textContent = text;
    if (chatLog) {
      chatLog.appendChild(msg);
      chatLog.scrollTop = chatLog.scrollHeight;
    }
    return msg;
  }

  function chatTyping(on: boolean): void {
    if (!chatLog) return;
    if (on && !typingEl) {
      typingEl = chatPush('bot', '');
      typingEl.classList.add('typing');
      typingEl.innerHTML = '<i></i><i></i><i></i>';
    } else if (!on && typingEl) {
      typingEl.remove();
      typingEl = null;
    }
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function scheduleIdleBubble(): void {
    idleBubbleTimer = setTimeout(() => {
      const state = animator.getState();
      const sheetOpen = document.body.classList.contains('sheet-open');
      if (!sheetOpen && !isHolding && !isSpeaking() &&
          !chatEl?.classList.contains('visible') &&
          (state === 'walk' || state === 'idle')) {
        const quote = IDLE_QUOTES[Math.floor(Math.random() * IDLE_QUOTES.length)];
        showBubble(quote, 5000);
      }
      scheduleIdleBubble();
    }, 14000 + Math.random() * 12000);
  }

  // ── Tap / Long Press ──────────────────────────────────────────
  function onPressStart(): void {
    isHolding = true;
    isLongPress = false;
    walking = false;
    if (animator.getState() === 'walk') animator.setState('idle');

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

    stopListening();

    if (!isSpeaking() && animator.getState() !== 'thinking') {
      voiceUI.classList.remove('visible');
      resumeWalk();
    }
  }

  function onCancelHold(): void {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
    const wasLongPress = isLongPress;
    isHolding = false;

    if (wasLongPress) stopListening();

    if (!isSpeaking() && animator.getState() !== 'thinking') {
      voiceUI.classList.remove('visible');
      resumeWalk();
    }
  }

  function onTap(): void {
    chatEl?.classList.remove('visible');
    const quote = TAP_QUOTES[Math.floor(Math.random() * TAP_QUOTES.length)];
    showBubble(quote, 3000);
    walking = false;
    animator.setState('react', () => {
      if (!isHolding) resumeWalk();
    });
  }

  function startListening(): void {
    walking = false;
    animator.stopRandomActions();
    animator.setState('listening');
    voiceUI.classList.add('visible');
    voiceLabel.textContent = 'Listening... 🎙️';
    hintEl.classList.add('hidden');

    openChat();
    chatPush('bot', 'Nakikinig ako sayo... 👂');

    startVoiceChat({
      onStateChange: (state) => {
        if (state === 'thinking') {
          voiceLabel.textContent = 'Thinking... 🧠';
          animator.setState('thinking');
          chatTyping(true);
        } else if (state === 'talking') {
          voiceLabel.textContent = 'Talking... 💬';
          animator.setState('talking');
          chatTyping(false);
        } else if (state === 'idle') {
          chatTyping(false);
          voiceUI.classList.remove('visible');
          closeChatSoon();
          if (!isHolding) resumeWalk();
        }
      },
      onTranscript: (text) => {
        chatTyping(false);
        chatPush('user', text);
        voiceLabel.textContent = `You: "${text.slice(0, 40)}${text.length > 40 ? '…' : ''}"`;
      },
      onResponse: (text) => {
        chatTyping(false);
        chatPush('bot', text);
        closeChatSoon(Math.max(9000, text.length * 80));
      },
      onError: (msg) => {
        chatTyping(false);
        chatPush('bot', msg);
        closeChatSoon(6000);
        voiceUI.classList.remove('visible');
        if (!isHolding) resumeWalk();
      },
    });
  }

  // ── Motion preference ─────────────────────────────────────────
  function onMotionPreferenceChange(): void {
    reducedMotion = motionQuery.matches;
    if (reducedMotion) {
      animator.stopRandomActions();
      walking = false;
      animator.setState('idle');
      resetLook();
    } else if (!document.body.classList.contains('sheet-open')) {
      resumeWalk();
    }
  }

  // ── Bind interaction ──────────────────────────────────────────
  wrap.addEventListener('touchstart', (e) => { e.preventDefault(); onPressStart(); }, { passive: false });
  wrap.addEventListener('touchend', (e) => { e.preventDefault(); onPressEnd(); }, { passive: false });
  wrap.addEventListener('touchcancel', onCancelHold);
  wrap.addEventListener('mousedown', onPressStart);
  wrap.addEventListener('mouseup', onPressEnd);
  wrap.addEventListener('mouseleave', onCancelHold);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('resize', updateBubbleShift);
  motionQuery.addEventListener('change', onMotionPreferenceChange);

  // Mouth sync while speaking
  mouthSyncTimer = setInterval(() => {
    const talking = isSpeaking();
    if (talking && animator.getState() !== 'talking') {
      animator.setState('talking');
      walking = false;
    } else if (!talking && animator.getState() === 'talking') {
      if (!isHolding) resumeWalk();
    }
  }, 80);

  // Hide the mascot while the detail sheet is open.
  let wasSheetOpen = document.body.classList.contains('sheet-open');
  const observer = new MutationObserver(() => {
    const sheetOpen = document.body.classList.contains('sheet-open');
    if (sheetOpen === wasSheetOpen) return;
    wasSheetOpen = sheetOpen;

    if (sheetOpen) {
      stopVoiceChat();
      voiceUI.classList.remove('visible');
      bubble.classList.remove('visible');
      chatEl?.classList.remove('visible');
      animator.stopRandomActions();
      walking = false;
      resetLook();
    } else if (!reducedMotion) {
      resumeWalk();
    }
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // ── Start ─────────────────────────────────────────────────────
  updateBubbleShift();
  hintHideTimer = setTimeout(() => { hintEl.classList.add('hidden'); }, 6000);

  if (reducedMotion) {
    animator.setState('idle');
    wrap.style.transform = `translate3d(${posX}px, 0, 0)`;
  } else {
    animator.setState('walk');
    animator.setFacing('right');
    animator.startRandomActions();
    raf = requestAnimationFrame(walk);
  }

  idleBubbleStart = setTimeout(() => {
    showBubble('Uy! Tap and hold me to chat! 🎙️', 4000);
    scheduleIdleBubble();
  }, 4000);

  // ── Cleanup on page unload ───────────────────────────────────
  window.addEventListener('beforeunload', () => {
    animator.destroy();
    stopVoiceChat();
    if (raf) cancelAnimationFrame(raf);
    if (lookRaf) cancelAnimationFrame(lookRaf);
    if (bubbleTimer) clearTimeout(bubbleTimer);
    if (typewriterTimer) clearTimeout(typewriterTimer);
    if (hintHideTimer) clearTimeout(hintHideTimer);
    if (idleBubbleTimer) clearTimeout(idleBubbleTimer);
    if (idleBubbleStart) clearTimeout(idleBubbleStart);
    if (chatHideTimer) clearTimeout(chatHideTimer);
    if (mouthSyncTimer) clearInterval(mouthSyncTimer);
    if (pressTimer) clearTimeout(pressTimer);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('resize', updateBubbleShift);
    motionQuery.removeEventListener('change', onMotionPreferenceChange);
    observer.disconnect();
  });
}

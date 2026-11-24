/**
 * JESSiE-BOT — Speech engine
 *
 * Speaks Gemini's replies with a natural, realistic voice.
 *  - iOS unlocks speech synthesis only from a real user gesture, so the press
 *    handler calls unlockSpeech() synchronously. The actual speak() happens
 *    later (after the API reply) and would otherwise be silent on iPhone.
 *  - Short Web Audio earcons still announce listening / thinking states.
 */

type AudioContextCtor = typeof AudioContext;

export type RobotSpeakCallbacks = {
  onStart?: () => void;
  onEnd?: () => void;
  /** Fired on every word boundary — useful for mouth sync / sound waves. */
  onBoundary?: () => void;
};

let audioCtx: AudioContext | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let speaking = false;
let speechUnlocked = false;

// ── Web Audio helpers (earcons only) ──────────────────────────────

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctor: AudioContextCtor | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  if (audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
}

/** One short, band-passed square-wave chirp — a UI state sound. */
function blip(ctx: AudioContext, freq: number, duration = 0.085, volume = 0.045): void {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(90, freq * 0.62), now + duration);

  filter.type = 'bandpass';
  filter.frequency.value = 1100;
  filter.Q.value = 1.1;

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.02);
}

/** UI "earcons" for non-verbal states. */
export function playEarcon(kind: 'wake' | 'listen' | 'think' | 'done'): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (kind === 'listen') {
    blip(ctx, 520, 0.09, 0.05);
    setTimeout(() => blip(ctx, 780, 0.11, 0.045), 90);
  } else if (kind === 'think') {
    blip(ctx, 300, 0.12, 0.04);
    setTimeout(() => blip(ctx, 240, 0.14, 0.035), 120);
  } else if (kind === 'wake') {
    blip(ctx, 330, 0.08, 0.04);
    setTimeout(() => blip(ctx, 494, 0.12, 0.04), 90);
  } else {
    blip(ctx, 660, 0.07, 0.04);
    setTimeout(() => blip(ctx, 880, 0.1, 0.04), 80);
  }
}

// ── Speech ────────────────────────────────────────────────────────

/**
 * Must be called synchronously from a tap/hold gesture. iOS Safari and
 * Chrome-on-iOS otherwise refuse to speak anything started after an async
 * network request. A silent utterance unlocks the speech queue for this page.
 */
export function unlockSpeech(): void {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  if (!synth) return;

  getAudioContext();
  try { synth.getVoices(); } catch { /* ignore */ }

  if (!speechUnlocked) {
    speechUnlocked = true;
    try {
      const warmup = new SpeechSynthesisUtterance(' ');
      warmup.volume = 0;
      warmup.rate = 10;
      synth.speak(warmup);
    } catch { /* ignore */ }
  }
  try { synth.resume(); } catch { /* ignore */ }
}

/** Prefer a natural / neural / high-quality English voice. */
function pickNaturalVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const english = voices.filter((v) => /^en([-_]|$)/i.test(v.lang));
  const pool = english.length ? english : voices;
  const score = (v: SpeechSynthesisVoice): number => {
    const name = v.name.toLowerCase();
    let s = 0;
    if (/natural|neural|premium|enhanced|siri|google/i.test(name)) s += 10;
    if (/samantha|alex|ava|daniel|david|george|guy|mark|zira|aria|jenny/i.test(name)) s += 6;
    if (v.localService) s += 2;
    return s;
  };
  return [...pool].sort((a, b) => score(b) - score(a))[0];
}

/** Voices can arrive asynchronously on first load; wait briefly if needed. */
function getVoicesAsync(): Promise<SpeechSynthesisVoice[]> {
  const synth = window.speechSynthesis;
  const immediate = synth.getVoices();
  if (immediate.length) return Promise.resolve(immediate);

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try { synth.removeEventListener('voiceschanged', finish); } catch { /* ignore */ }
      resolve(synth.getVoices());
    };
    try { synth.addEventListener('voiceschanged', finish); } catch { /* ignore */ }
    setTimeout(finish, 800);
  });
}

/** Speak a reply with a clear, natural voice. Returns immediately. */
export function speakRobot(text: string, callbacks: RobotSpeakCallbacks = {}): void {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  if (!synth) {
    callbacks.onEnd?.();
    return;
  }

  unlockSpeech();

  void getVoicesAsync().then((voices) => {
    // Cancel any previous reply, then speak at once — no timer between
    // cancel() and speak(), which can pause the queue on iOS.
    try { synth.cancel(); } catch { /* ignore */ }
    try { synth.resume(); } catch { /* ignore */ }

    const utter = new SpeechSynthesisUtterance(text);
    const voice = pickNaturalVoice(voices);
    // Some engines reject the voice assignment; never let that silence the reply.
    if (voice) {
      try { utter.voice = voice; } catch { /* use lang fallback below */ }
    }
    utter.lang = voice?.lang ?? 'en-US';
    utter.pitch = 1;     // natural, not mechanical
    utter.rate = 1;      // natural pace
    utter.volume = 1;

    let finished = false;
    let watchdog: ReturnType<typeof setTimeout> | null = null;

    const finish = () => {
      if (finished) return;
      finished = true;
      if (watchdog) { clearTimeout(watchdog); watchdog = null; }
      speaking = false;
      if (activeUtterance === utter) activeUtterance = null;
      callbacks.onEnd?.();
    };

    utter.onstart = () => {
      if (finished) return;
      if (watchdog) { clearTimeout(watchdog); watchdog = null; }
      speaking = true;
      callbacks.onStart?.();
    };
    utter.onboundary = () => callbacks.onBoundary?.();
    utter.onend = finish;
    utter.onerror = finish;

    activeUtterance = utter;
    try {
      synth.speak(utter);
    } catch {
      finish();
      return;
    }

    // If the engine silently refuses to start, still return the UI to idle.
    watchdog = setTimeout(() => {
      if (!speaking && !synth.speaking && !synth.pending) finish();
    }, 6000);
  }).catch(() => callbacks.onEnd?.());
}

export function stopRobotVoice(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  speaking = false;
  activeUtterance = null;
}

export function isRobotSpeaking(): boolean {
  return speaking;
}

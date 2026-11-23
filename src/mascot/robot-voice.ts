/**
 * JESSiE-BOT — Robotic voice engine
 *
 * Makes the mascot actually *sound* like a robot when it answers:
 *  1. SpeechSynthesis speaks the words (tuned low + slightly choppy = AI tone).
 *  2. Web Audio oscillator "blips" are layered on top for the classic robot-talk sound.
 *  3. Short earcon chirps announce listening / thinking states.
 *
 * The AudioContext is created lazily and resumed on a user gesture (the long-press),
 * which satisfies browser autoplay policies.
 */

type AudioContextCtor = typeof AudioContext;

export type RobotSpeakCallbacks = {
  onStart?: () => void;
  onEnd?: () => void;
  /** Fired on every word boundary — useful for mouth sync / sound waves. */
  onBoundary?: () => void;
};

let audioCtx: AudioContext | null = null;
let blipTimer: ReturnType<typeof setInterval> | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let speaking = false;

// ── Web Audio helpers ─────────────────────────────────────────────

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

/** One short, band-passed square-wave chirp — a "robot syllable". */
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

/** Robotic syllables used for the talking layer (pentatonic-ish, never random noise). */
const BLIP_NOTES = [196, 233, 262, 311, 349, 392, 466, 523];

function startBlips(): void {
  stopBlips();
  const ctx = getAudioContext();
  if (!ctx) return;
  let i = 0;
  blipTimer = setInterval(() => {
    if (!speaking) return;
    // Follow a loose melodic pattern so it reads as "talking", not static.
    const note = BLIP_NOTES[(i * 3 + Math.floor(Math.random() * 2)) % BLIP_NOTES.length];
    blip(ctx, note, 0.06 + Math.random() * 0.05, 0.03);
    i++;
  }, 105);
}

function stopBlips(): void {
  if (blipTimer) {
    clearInterval(blipTimer);
    blipTimer = null;
  }
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

function pickRobotVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  // Prefer a deep English voice; avoid the very bright "Natural"/female ones.
  return (
    voices.find(v => /en(-|_)/i.test(v.lang) && /david|daniel|george|google uk english male/i.test(v.name)) ??
    voices.find(v => /en(-|_)/i.test(v.lang) && /male/i.test(v.name)) ??
    voices.find(v => /en(-|_)/i.test(v.lang)) ??
    voices[0]
  );
}

/** Speak text with a robotic tone + blips. Returns immediately. */
export function speakRobot(text: string, callbacks: RobotSpeakCallbacks = {}): void {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  if (!synth) {
    callbacks.onEnd?.();
    return;
  }

  // Resume audio on this user-gesture-driven call.
  getAudioContext();
  synth.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  const voice = pickRobotVoice();
  if (voice) utter.voice = voice;
  utter.lang = voice?.lang ?? 'en-PH';
  utter.pitch = 0.55; // low = mechanical
  utter.rate = 0.98; // slightly deliberate
  utter.volume = 1;

  utter.onstart = () => {
    speaking = true;
    startBlips();
    callbacks.onStart?.();
  };

  utter.onboundary = () => {
    callbacks.onBoundary?.();
  };

  const finish = () => {
    speaking = false;
    stopBlips();
    if (activeUtterance === utter) activeUtterance = null;
    callbacks.onEnd?.();
  };
  utter.onend = finish;
  utter.onerror = finish;

  activeUtterance = utter;
  // Some browsers need a tiny delay after cancel() before speak().
  setTimeout(() => synth.speak(utter), 60);
}

export function stopRobotVoice(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  speaking = false;
  activeUtterance = null;
  stopBlips();
}

export function isRobotSpeaking(): boolean {
  return speaking || (typeof window !== 'undefined' && !!(window.speechSynthesis && window.speechSynthesis.speaking));
}

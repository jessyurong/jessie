/**
 * JESSiE-BOT — Gemini AI + Voice Chat integration
 * Uses @google/genai (already installed) + Web Speech API + the robot voice engine.
 *
 * Cross-browser notes:
 *  - Chrome / Edge / Opera / Samsung Internet expose SpeechRecognition.
 *  - Safari (desktop + iOS) only exposes webkitSpeechRecognition and requires a
 *    real user gesture for the microphone prompt, so we prime getUserMedia from
 *    the press handler and reuse the granted permission here.
 *  - Firefox has no Web Speech API; we surface a friendly message instead.
 */

const SYSTEM_PROMPT = `You are JESSiE-BOT, the AI mascot of Jessie M. Yurong Jr., a full-stack web developer from Mabinay, Negros Oriental, Philippines.

RULES:
- Reply in English only.
- Do not use emojis, emoticons, or decorative symbols.
- Use plain text only, no markdown or formatting.
- Keep responses short: 2-3 sentences maximum.
- Be friendly, energetic, and helpful.

About Jessie:
- Projects: FixMo PH (flagship POS with live repair status tracking), JEGZ Repair Pro (POS for a repair shop), PYAP Management System (organization management), Winter Arc (habit tracker PWA with Google Auth and Supabase), Anti-Stress Playground (stress relief web app with Gemini voice chat).
- Skills: React, TypeScript, Next.js, Tailwind, Supabase, PostgreSQL, Node.js, Express, TanStack Start, shadcn/ui, PWA, Firebase, Vercel, Neon, Gemini API, Arduino, ESP32.
- Education: 3rd-year BSIT at CPSU Main Campus, With High Honors (GWA 1.50).
- Also does: cellphone repair (100+ devices fixed), graphic design, writing, music, community work, content creation. Works part-time at Cynex Technology Corp on Saturdays.
- Awards: Service Awardee (Pasidungog 2026), Leadership Award, With High Honors (BSIT 1 and 2).
- Location: Mabinay, Negros Oriental, Philippines.

If asked about hiring or projects, encourage people to reach out.`;

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'talking';

export type VoiceCallbacks = {
  onStateChange: (state: VoiceState) => void;
  onTranscript: (text: string) => void;
  onResponse: (text: string) => void;
  onError: (msg: string) => void;
};

type GenAIModule = typeof import('@google/genai');

// Loose type for cross-browser SpeechRecognition.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any;

let genaiModule: GenAIModule | null = null;
let recognition: AnySpeechRecognition = null;
/** True when the current session was stopped on purpose (no error bubble). */
let intentionalStop = false;
/** Some engines reject tl-PH; fall back to en-US for the rest of the session. */
let forceEnglishLang = false;

async function loadGenAI(): Promise<GenAIModule> {
  if (!genaiModule) {
    genaiModule = await import('@google/genai') as GenAIModule;
  }
  return genaiModule;
}

function getClientApiKey(): string | null {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};
  return env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || null;
}

/** Ask the Express proxy (keeps the key server-side). Throws if unavailable. */
async function askProxy(message: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch('/api/mascot-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error('proxy unavailable');
    const data = await res.json() as { reply?: string };
    if (!data.reply) throw new Error('empty proxy reply');
    return data.reply;
  } finally {
    clearTimeout(timeout);
  }
}

/** Ask Gemini directly from the browser using a VITE_ key (static deployments). */
async function askClient(message: string, apiKey: string): Promise<string> {
  const { GoogleGenAI } = await loadGenAI();
  const ai = new GoogleGenAI({ apiKey });
  const result = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: [{ role: 'user', parts: [{ text: message }] }],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      maxOutputTokens: 150,
      temperature: 0.85,
    },
  });
  return result.text || 'Sorry, I did not catch that. Please try again.';
}

async function askGemini(userText: string): Promise<string> {
  // 1) Prefer the server proxy (secure, works where the key is injected server-side).
  try {
    return await askProxy(userText);
  } catch {
    // 2) Fall back to a client-side VITE_ key for static deployments.
  }

  const key = getClientApiKey();
  if (key) return askClient(userText, key);

  throw new Error('No Gemini API route configured');
}

function isAppleMobile(): boolean {
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isVoiceSupported(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return !!(w.SpeechRecognition ?? w.webkitSpeechRecognition);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSpeechRecognition(): any {
  // Safari exposes only the vendor-prefixed constructor.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  const SRCtor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!SRCtor) return null;
  const sr = new SRCtor();
  // Safari/iOS does not reliably support tl-PH for speech recognition.
  sr.lang = (isAppleMobile() || forceEnglishLang) ? 'en-US' : 'tl-PH';
  sr.interimResults = false;
  sr.maxAlternatives = 1;
  sr.continuous = false;
  return sr;
}

let micPrimed = false;
let micPrimePromise: Promise<void> | null = null;

/**
 * Safari only shows the microphone prompt when getUserMedia is called from a
 * real user gesture. Call this synchronously from a tap/hold handler so the
 * delayed SpeechRecognition.start() can reuse the granted permission.
 * Failures are not cached: the next press retries.
 */
export function primeMicrophone(): void {
  if (micPrimed || micPrimePromise) return;
  if (!navigator.mediaDevices?.getUserMedia) return;
  micPrimePromise = navigator.mediaDevices.getUserMedia({ audio: true })
    .then((stream) => {
      stream.getTracks().forEach((track) => track.stop());
      micPrimed = true;
    })
    .catch(() => {
      // Let SpeechRecognition surface its own error if permission is denied.
    })
    .finally(() => { micPrimePromise = null; });
}

/** Speak a reply and guarantee the UI returns to idle even if TTS fails. */
function speakReply(text: string, onStateChange: (s: VoiceState) => void): void {
  void import('./robot-voice').then((m) => {
    m.playEarcon('done');
    m.speakRobot(text, {
      onStart: () => onStateChange('talking'),
      onEnd: () => onStateChange('idle'),
    });
  }).catch(() => onStateChange('idle'));
}

export function startVoiceChat(callbacks: VoiceCallbacks): void {
  const { onStateChange, onTranscript, onResponse, onError } = callbacks;

  if (!isVoiceSupported()) {
    onError('Speech recognition is not supported in this browser. Try Chrome, Edge, or Safari.');
    onStateChange('idle');
    return;
  }

  // Prime the mic synchronously. iOS WebKit (Safari AND Chrome on iPhone) only
  // captures audio when start() runs inside the user-gesture call stack, so
  // nothing in this function may await before sr.start().
  primeMicrophone();

  // Tear down any previous session before starting a new one.
  if (recognition) {
    const old = recognition;
    recognition = null;
    try { old.abort(); } catch { /* already stopped */ }
  }

  const sr = getSpeechRecognition();
  if (!sr) {
    onError('Speech recognition is not supported in this browser. Try Chrome, Edge, or Safari.');
    onStateChange('idle');
    return;
  }

  recognition = sr;
  intentionalStop = false;
  let gotResult = false;
  let settled = false;

  // Safety net: never leave the robot stuck in "listening" forever.
  const watchdog = setTimeout(() => {
    if (recognition !== sr || gotResult) return;
    try { sr.stop(); } catch { /* ignore */ }
    // Some WebKit builds never fire onend after stop(); force a reset so the
    // UI always returns to idle even when the engine goes silent.
    setTimeout(() => {
      if (recognition === sr && !settled) {
        settle();
        onError('I did not hear you. Please try again.');
        onStateChange('idle');
      }
    }, 1200);
  }, 15000);

  const settle = () => {
    settled = true;
    clearTimeout(watchdog);
    if (recognition === sr) recognition = null;
  };

  sr.onresult = (e: SpeechRecognitionEvent) => {
    if (recognition !== sr || settled) return;
    const transcript = e.results?.[0]?.[0]?.transcript?.trim();
    if (!transcript) return;
    gotResult = true;
    settle();
    onTranscript(transcript);
    onStateChange('thinking');

    void import('./robot-voice').then(m => m.playEarcon('think')).catch(() => {});

    askGemini(transcript)
      .then((reply: string) => {
        onResponse(reply);
        speakReply(reply, onStateChange);
      })
      .catch(() => {
        const fallback = 'Something went wrong. Please check your connection and try again. In the meantime, check out my projects below.';
        onResponse(fallback);
        speakReply(fallback, onStateChange);
      });
  };

  sr.onerror = (e: SpeechRecognitionErrorEvent) => {
    if (recognition !== sr || settled) return;
    settle();
    if (e.error === 'aborted') {
      onStateChange('idle');
      return;
    }
    if (e.error === 'language-not-supported') {
      // Retry-friendly: next session uses en-US instead.
      forceEnglishLang = true;
    }
    const messages: Record<string, string> = {
      'not-allowed': 'Microphone access is blocked. Allow microphone access for this site in your browser settings, then try again.',
      'service-not-allowed': 'Speech recognition is not allowed. Check your browser settings and try again.',
      'audio-capture': 'No microphone was found. Please check your device and try again.',
      'network': 'Speech recognition is unavailable right now. Please try again.',
      'language-not-supported': 'This language is not supported on your device. Please try again.',
      'no-speech': 'I did not hear you. Please try again.',
    };
    onError(messages[e.error] ?? 'Voice chat failed. Please try again.');
    onStateChange('idle');
  };

  sr.onend = () => {
    if (recognition !== sr || settled) return;
    settle();
    // Ended without a result and without an error (common on Safari after a
    // silent timeout). Reset the UI instead of leaving it stuck in listening.
    if (!gotResult && !intentionalStop) {
      onError('I did not hear you. Please try again.');
    }
    onStateChange('idle');
  };

  try {
    sr.start();
    onStateChange('listening');
    // Load the Web Audio engine only after the microphone is running.
    void import('./robot-voice').then(m => m.playEarcon('listen')).catch(() => {});
  } catch {
    settle();
    onError('Could not start the microphone. Please try again.');
    onStateChange('idle');
  }
}

export function stopVoiceChat(): void {
  intentionalStop = true;
  if (recognition) {
    const old = recognition;
    recognition = null;
    try { old.abort(); } catch { /* ignore */ }
  }
  void import('./robot-voice').then(m => m.stopRobotVoice()).catch(() => {});
}

export function isSpeaking(): boolean {
  // Kept synchronous for the existing mouth-sync polling loop.
  return typeof window !== 'undefined' && !!(window.speechSynthesis && window.speechSynthesis.speaking);
}

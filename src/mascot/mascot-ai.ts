/**
 * JESSiE-BOT — Gemini AI + Voice Chat integration
 * Uses @google/genai (already installed) + Web Speech API + the robot voice engine.
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSpeechRecognition(): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  const SRCtor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!SRCtor) return null;
  const sr = new SRCtor();
  sr.lang = 'tl-PH'; // Filipino/Tagalog — also recognizes English
  sr.interimResults = false;
  sr.maxAlternatives = 1;
  sr.continuous = false;
  return sr;
}

export function startVoiceChat(callbacks: VoiceCallbacks): void {
  const { onStateChange, onTranscript, onResponse, onError } = callbacks;

  // Lazily import the robot voice engine (Web Audio) so it is not loaded eagerly.
  void import('./robot-voice').then(m => m.playEarcon('listen'));

  const sr = getSpeechRecognition();
  if (!sr) {
    onError('Speech recognition not supported in this browser. Try Chrome!');
    return;
  }

  recognition = sr;
  onStateChange('listening');

  sr.onresult = (e: SpeechRecognitionEvent) => {
    const transcript = e.results[0][0].transcript;
    onTranscript(transcript);
    onStateChange('thinking');

    void import('./robot-voice').then(m => m.playEarcon('think'));

    askGemini(transcript)
      .then((reply: string) => {
        onResponse(reply);
        void import('./robot-voice').then(m => {
          m.playEarcon('done');
          m.speakRobot(reply, {
            onStart: () => onStateChange('talking'),
            onEnd: () => onStateChange('idle'),
          });
        });
      })
      .catch(() => {
        const fallback = 'Something went wrong. Please check your connection and try again. In the meantime, check out my projects below.';
        onResponse(fallback);
        void import('./robot-voice').then(m => {
          m.speakRobot(fallback, {
            onStart: () => onStateChange('talking'),
            onEnd: () => onStateChange('idle'),
          });
        });
      });
  };

  sr.onerror = (e: SpeechRecognitionErrorEvent) => {
    if (e.error !== 'no-speech' && e.error !== 'aborted') {
      onError('I did not hear you. Please try again.');
    }
    onStateChange('idle');
  };

  sr.onend = () => {
    recognition = null;
  };

  sr.start();
}

export function stopListening(): void {
  if (recognition) {
    try {
      recognition.stop();
    } catch {
      // ignore
    }
  }
}

export function stopVoiceChat(): void {
  if (recognition) {
    try {
      recognition.stop();
    } catch {
      // ignore
    }
    recognition = null;
  }
  void import('./robot-voice').then(m => m.stopRobotVoice());
}

export function isSpeaking(): boolean {
  // Kept synchronous for the existing mouth-sync polling loop.
  return typeof window !== 'undefined' && !!(window.speechSynthesis && window.speechSynthesis.speaking);
}

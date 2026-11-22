/**
 * JESSiE-BOT — Gemini AI + Voice Chat integration
 * Uses @google/genai (already installed) + Web Speech API
 */

const SYSTEM_PROMPT = `You are JESSiE-BOT, the AI mascot of Jessie M. Yurong Jr., 
a full-stack web developer from Mabinay, Negros Oriental, Philippines.
You speak in a friendly, casual mix of Filipino and English (Taglish).
You know everything about Jessie:
- Projects: JEGZ Repair Pro (POS for repair shop, React+TypeScript+Express+PostgreSQL), 
  PYAP Management System (org management, React+TypeScript+TanStack Start+Tailwind+shadcn/ui+Supabase+Postgres+Auth+RLS+PWA),
  Winter Arc (social habit tracker PWA, React+TypeScript+Vite+Tailwind+Supabase+Google Auth+Vercel),
  Anti-Stress Playground (stress relief web app with Mochi mascot and Gemini voice chat, Next.js+Gemini API+Vercel),
  FixMo PH (flagship POS with live repair status tracking)
- Skills: React, TypeScript, Next.js, Tailwind, Supabase, PostgreSQL, Node.js, Express, TanStack Start, shadcn/ui, PWA, Firebase, Vercel, Neon, Gemini API, Arduino, ESP32
- Education: 3rd-year BSIT at CPSU Main Campus, With High Honors (GWA 1.50)
- Also does: cellphone repair (100+ devices fixed), graphic design, writing, music (guitarist/songwriter), community work (PYAP officer), content creation
- Awards: Service Awardee (Pasidungog 2026), Leadership Award, With High Honors (BSIT 1 & 2)
- Location: Mabinay, Negros Oriental, Philippines
- Works part-time at Cynex Technology Corp (formerly KERR IT Solutions) every Saturday
Keep responses SHORT (2-3 sentences max). Be energetic, funny, and helpful. 
If asked about hiring or projects, encourage them to reach out!`;

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'talking';

export type VoiceCallbacks = {
  onStateChange: (state: VoiceState) => void;
  onTranscript: (text: string) => void;
  onResponse: (text: string) => void;
  onError: (msg: string) => void;
};

type GenAIModule = typeof import('@google/genai');

// Use a loose type for cross-browser SpeechRecognition
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any;

let genaiModule: GenAIModule | null = null;
let recognition: AnySpeechRecognition = null;
let synth: SpeechSynthesis | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let mouthSyncInterval: ReturnType<typeof setInterval> | null = null;

async function loadGenAI(): Promise<GenAIModule> {
  if (!genaiModule) {
    genaiModule = await import('@google/genai') as GenAIModule;
  }
  return genaiModule;
}

function getApiKey(): string | null {
  // Try env first (Vite exposes VITE_ prefixed vars)
  const key = (import.meta as unknown as Record<string, Record<string, string>>).env?.VITE_GEMINI_API_KEY
    || (import.meta as unknown as Record<string, Record<string, string>>).env?.GEMINI_API_KEY
    || '';
  return key || null;
}

async function askGemini(userText: string): Promise<string> {
  const { GoogleGenAI } = await loadGenAI();
  const apiKey = getApiKey();

  if (!apiKey) {
    // Fallback: try proxying through the Express server
    const res = await fetch('/api/mascot-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userText }),
    });
    if (!res.ok) throw new Error('API proxy failed');
    const data = await res.json() as { reply: string };
    return data.reply;
  }

  const ai = new GoogleGenAI({ apiKey });
  const result = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      maxOutputTokens: 150,
      temperature: 0.85,
    },
  });
  return result.text ?? 'Ay sorry, hindi ko nagets! Try ulit?';
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
  return sr;
}

export function startVoiceChat(callbacks: VoiceCallbacks): void {
  const { onStateChange, onTranscript, onResponse, onError } = callbacks;

  // Stop any existing speech
  if (synth && synth.speaking) synth.cancel();

  const sr = getSpeechRecognition();
  if (!sr) {
    onError('Speech recognition not supported in this browser. Try Chrome!');
    return;
  }

  recognition = sr;
  synth = window.speechSynthesis;

  onStateChange('listening');

  sr.onresult = (e: SpeechRecognitionEvent) => {
    const transcript = e.results[0][0].transcript;
    onTranscript(transcript);
    onStateChange('thinking');

    askGemini(transcript)
      .then((reply: string) => {
        onResponse(reply);
        speak(reply, callbacks);
      })
      .catch(() => {
        const fallback = 'Ay error! Baka walang internet o API key. Pero uy, check mo na yung projects ko below! 👇';
        onResponse(fallback);
        speak(fallback, callbacks);
      });
  };

  sr.onerror = () => {
    onError('Hindi ko narinig. Subukan mo ulit!');
    onStateChange('idle');
  };

  sr.onend = () => {
    recognition = null;
  };

  sr.start();
}

function speak(text: string, callbacks: VoiceCallbacks): void {
  if (!synth) return;

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-PH';
  utter.rate = 1.05;
  utter.pitch = 1.1;

  // Pick a voice — prefer a local/Filipino accent if available
  const voices = synth.getVoices();
  const preferred = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('natural'))
    || voices.find(v => v.lang.startsWith('en'))
    || voices[0];
  if (preferred) utter.voice = preferred;

  utter.onstart = () => {
    callbacks.onStateChange('talking');
    // Start mouth sync
    mouthSyncInterval = setInterval(() => {
      // Callback re-checks speaking in mascot.ts
    }, 80);
  };

  utter.onend = () => {
    callbacks.onStateChange('idle');
    if (mouthSyncInterval) { clearInterval(mouthSyncInterval); mouthSyncInterval = null; }
  };

  currentUtterance = utter;
  synth.speak(utter);
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
  if (synth && synth.speaking) synth.cancel();
  if (mouthSyncInterval) { clearInterval(mouthSyncInterval); mouthSyncInterval = null; }
}

export function isSpeaking(): boolean {
  return !!(synth && synth.speaking);
}

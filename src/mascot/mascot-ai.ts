/**
 * JESSiE-BOT — Gemini AI + Voice Chat integration
 *
 * Voice input strategy:
 *  - Preferred everywhere: record a short audio message with getUserMedia +
 *    MediaRecorder, then let Gemini transcribe AND answer in one call. This is
 *    reliable on iOS (Safari + Chrome, which both use WebKit), Android, desktop
 *    Chrome/Edge/Firefox, because it avoids the broken Web Speech recognition
 *    engine (silent hangs / audio-session deadlocks on iOS).
 *  - Fallback: Web Speech API (SpeechRecognition / webkitSpeechRecognition)
 *    for browsers without MediaRecorder.
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

const AUDIO_INSTRUCTION = `The user sent a voice message. Return ONLY a JSON object with exactly two string fields: "transcript" (what the user said) and "reply" (your answer, following the rules above). No markdown, no code fences.`;

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'talking';

export type VoiceCallbacks = {
  onStateChange: (state: VoiceState) => void;
  onTranscript: (text: string) => void;
  onResponse: (text: string) => void;
  onError: (msg: string) => void;
};

type GenAIModule = typeof import('@google/genai');
type AudioPayload = { data: string; mimeType: string };
type AudioResult = { transcript: string; reply: string };

// Loose type for cross-browser SpeechRecognition / vendor prefixes.
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

const FALLBACK_REPLY = 'Something went wrong. Please check your connection and try again. In the meantime, check out my projects below.';

// ── Text API (used by the Web Speech fallback) ───────────────────

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
  try {
    return await askProxy(userText);
  } catch {
    // Fall back to a client-side VITE_ key for static deployments.
  }
  const key = getClientApiKey();
  if (key) return askClient(userText, key);
  throw new Error('No Gemini API route configured');
}

// ── Audio API (primary voice path) ───────────────────────────────

function parseAudioReply(raw: string): AudioResult {
  let text = (raw || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try {
    const parsed = JSON.parse(text) as { transcript?: unknown; reply?: unknown };
    if (typeof parsed.reply === 'string') {
      return {
        transcript: typeof parsed.transcript === 'string' ? parsed.transcript : 'Voice message',
        reply: parsed.reply,
      };
    }
  } catch {
    // Not JSON — fall through to the labelled-text format.
  }
  const transcript = text.match(/TRANSCRIPT:\s*(.*)/i)?.[1]?.trim() || 'Voice message';
  const reply = text.match(/REPLY:\s*([\s\S]*)/i)?.[1]?.trim() || text;
  return { transcript, reply: reply || FALLBACK_REPLY };
}

async function askProxyAudio(audio: AudioPayload, signal: AbortSignal): Promise<AudioResult> {
  const res = await fetch('/api/mascot-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio: audio.data, mimeType: audio.mimeType }),
    signal,
  });
  if (!res.ok) throw new Error('proxy unavailable');
  const data = await res.json() as { reply?: string; transcript?: string };
  if (!data.reply) throw new Error('empty proxy reply');
  return { transcript: data.transcript || 'Voice message', reply: data.reply };
}

async function askClientAudio(audio: AudioPayload, apiKey: string): Promise<AudioResult> {
  const { GoogleGenAI } = await loadGenAI();
  const ai = new GoogleGenAI({ apiKey });
  const result = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: audio.mimeType, data: audio.data } },
        { text: AUDIO_INSTRUCTION },
      ],
    }],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      maxOutputTokens: 200,
      temperature: 0.7,
      responseMimeType: 'application/json',
    },
  });
  return parseAudioReply(result.text || '');
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.includes(',') ? result.slice(result.indexOf(',') + 1) : result);
    };
    reader.onerror = () => reject(new Error('Could not read audio'));
    reader.readAsDataURL(blob);
  });
}

function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') return '';
  const candidates = [
    'audio/mp4',        // Safari / iOS
    'audio/m4a',
    'audio/webm;codecs=opus',
    'audio/webm',       // Chrome / Firefox / Edge
    'audio/ogg;codecs=opus',
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || '';
}

function canRecordAudio(): boolean {
  return typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
}

/** Speak a reply and guarantee the UI returns to idle even if TTS fails. */
function speakReply(text: string, onStateChange: (state: VoiceState) => void): void {
  void import('./robot-voice').then((m) => {
    m.playEarcon('done');
    m.speakRobot(text, {
      onStart: () => onStateChange('talking'),
      onEnd: () => onStateChange('idle'),
    });
  }).catch(() => onStateChange('idle'));
}

// ── Recorder state ───────────────────────────────────────────────

let audioRecorder: MediaRecorder | null = null;
let audioStream: MediaStream | null = null;
let audioSession: symbol | null = null;
let audioIntentionalStop = false;
let permissionTimer: ReturnType<typeof setTimeout> | null = null;
let maxTimer: ReturnType<typeof setTimeout> | null = null;
let silenceTimer: ReturnType<typeof setInterval> | null = null;
let audioContext: AudioContext | null = null;
let audioSource: MediaStreamAudioSourceNode | null = null;
let audioAnalyser: AnalyserNode | null = null;

function clearAudioTimers(): void {
  if (permissionTimer) { clearTimeout(permissionTimer); permissionTimer = null; }
  if (maxTimer) { clearTimeout(maxTimer); maxTimer = null; }
  if (silenceTimer) { clearInterval(silenceTimer); silenceTimer = null; }
}

function cleanupAudioResources(): void {
  clearAudioTimers();
  if (audioStream) {
    audioStream.getTracks().forEach((track) => track.stop());
    audioStream = null;
  }
  try { audioSource?.disconnect(); } catch { /* ignore */ }
  audioSource = null;
  audioAnalyser = null;
  if (audioContext) {
    void audioContext.close().catch(() => undefined);
    audioContext = null;
  }
}

function requestRecorderStop(): void {
  if (audioRecorder && audioRecorder.state !== 'inactive') {
    try { audioRecorder.stop(); } catch { /* ignore */ }
  }
}

async function handleRecordedAudio(blob: Blob, callbacks: VoiceCallbacks, session: symbol): Promise<void> {
  const { onStateChange, onTranscript, onResponse } = callbacks;
  onStateChange('thinking');
  void import('./robot-voice').then((m) => m.playEarcon('think')).catch(() => {});

  try {
    const audio: AudioPayload = {
      data: await blobToBase64(blob),
      mimeType: blob.type || pickMimeType() || 'audio/webm',
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    let result: AudioResult;
    try {
      result = await askProxyAudio(audio, controller.signal);
    } catch {
      const key = getClientApiKey();
      if (!key) throw new Error('No Gemini API route configured');
      result = await askClientAudio(audio, key);
    } finally {
      clearTimeout(timeout);
    }

    if (audioSession !== session) return; // cancelled while waiting
    onTranscript(result.transcript);
    onResponse(result.reply);
    speakReply(result.reply, onStateChange);
  } catch {
    if (audioSession !== session) return;
    onTranscript('Voice message');
    onResponse(FALLBACK_REPLY);
    speakReply(FALLBACK_REPLY, onStateChange);
  }
}

/**
 * Start recording synchronously from the release gesture. The UI is switched
 * to "listening" immediately; the mic permission prompt may appear a moment
 * later, which is fine — MediaRecorder does not need a gesture after getUserMedia.
 */
function startRecordedVoiceChat(callbacks: VoiceCallbacks): void {
  const { onStateChange, onError } = callbacks;
  const session = Symbol('voice');
  audioSession = session;
  audioIntentionalStop = false;
  cleanupAudioResources();
  onStateChange('listening');

  permissionTimer = setTimeout(() => {
    if (audioSession !== session || audioRecorder) return;
    onError('Microphone permission was not granted. Allow microphone access for this site, then try again.');
    onStateChange('idle');
    audioSession = null;
    cleanupAudioResources();
  }, 12000);

  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    if (audioSession !== session) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }
    if (permissionTimer) { clearTimeout(permissionTimer); permissionTimer = null; }
    audioStream = stream;

    const mimeType = pickMimeType();
    let rec: MediaRecorder;
    try {
      rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    } catch {
      try { rec = new MediaRecorder(stream); }
      catch {
        onError('Voice recording is not supported in this browser.');
        onStateChange('idle');
        audioSession = null;
        cleanupAudioResources();
        return;
      }
    }
    audioRecorder = rec;
    const chunks: Blob[] = [];

    rec.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) chunks.push(event.data);
    };

    rec.onstop = () => {
      const stoppedSession = session;
      const stoppedType = rec.mimeType || mimeType || 'audio/webm';
      cleanupAudioResources();
      audioRecorder = null;
      if (audioSession !== stoppedSession || audioIntentionalStop) return;
      if (!chunks.length) {
        onError('I did not hear you. Please try again.');
        onStateChange('idle');
        return;
      }
      void handleRecordedAudio(new Blob(chunks, { type: stoppedType }), callbacks, stoppedSession);
    };

    rec.start();
    void import('./robot-voice').then((m) => m.playEarcon('listen')).catch(() => {});

    // Stop automatically after a pause in speech (voice-note behaviour).
    let speechHeard = false;
    let lastSound = performance.now();
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) {
        audioContext = new Ctor();
        void audioContext.resume().catch(() => undefined);
        audioSource = audioContext.createMediaStreamSource(stream);
        audioAnalyser = audioContext.createAnalyser();
        audioAnalyser.fftSize = 1024;
        audioSource.connect(audioAnalyser);
        const buffer = new Uint8Array(audioAnalyser.fftSize);
        silenceTimer = setInterval(() => {
          if (audioSession !== session || audioRecorder !== rec) return;
          audioAnalyser?.getByteTimeDomainData(buffer);
          let sum = 0;
          for (let i = 0; i < buffer.length; i++) {
            const value = (buffer[i] - 128) / 128;
            sum += value * value;
          }
          const rms = Math.sqrt(sum / buffer.length);
          const now = performance.now();
          if (rms > 0.025) {
            speechHeard = true;
            lastSound = now;
          } else if (speechHeard && now - lastSound > 1400) {
            requestRecorderStop();
          }
        }, 60);
      }
    } catch {
      // Silence detection is an enhancement; the max timer still applies.
    }

    maxTimer = setTimeout(() => {
      if (audioSession === session) requestRecorderStop();
    }, 10000);
  }).catch(() => {
    if (audioSession !== session) return;
    onError('Microphone access is blocked. Allow microphone access for this site, then try again.');
    onStateChange('idle');
    audioSession = null;
    cleanupAudioResources();
  });
}

// ── Web Speech fallback (no MediaRecorder) ───────────────────────

function isAppleMobile(): boolean {
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isVoiceSupported(): boolean {
  return canRecordAudio() || !!(window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
    !!(window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSpeechRecognition(): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  const SRCtor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!SRCtor) return null;
  const sr = new SRCtor();
  sr.lang = (isAppleMobile() || forceEnglishLang) ? 'en-US' : 'tl-PH';
  sr.interimResults = false;
  sr.maxAlternatives = 1;
  sr.continuous = false;
  // Chrome 150+ defaults to "command" and silently drops free-form results.
  sr.quality = 'dictation';
  return sr;
}

function startWebSpeechVoiceChat(callbacks: VoiceCallbacks): void {
  const { onStateChange, onTranscript, onResponse, onError } = callbacks;

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

  const watchdog = setTimeout(() => {
    if (recognition !== sr || gotResult) return;
    try { sr.stop(); } catch { /* ignore */ }
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
      .then((reply) => { onResponse(reply); speakReply(reply, onStateChange); })
      .catch(() => { onResponse(FALLBACK_REPLY); speakReply(FALLBACK_REPLY, onStateChange); });
  };

  sr.onerror = (e: SpeechRecognitionErrorEvent) => {
    if (recognition !== sr || settled) return;
    settle();
    if (e.error === 'aborted') { onStateChange('idle'); return; }
    if (e.error === 'language-not-supported') forceEnglishLang = true;
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
    if (!gotResult && !intentionalStop) onError('I did not hear you. Please try again.');
    onStateChange('idle');
  };

  try {
    sr.start();
    onStateChange('listening');
    void import('./robot-voice').then(m => m.playEarcon('listen')).catch(() => {});
  } catch {
    settle();
    onError('Could not start the microphone. Please try again.');
    onStateChange('idle');
  }
}

export function startVoiceChat(callbacks: VoiceCallbacks): void {
  if (canRecordAudio()) {
    startRecordedVoiceChat(callbacks);
    return;
  }
  startWebSpeechVoiceChat(callbacks);
}

export function stopVoiceChat(): void {
  intentionalStop = true;

  if (recognition) {
    const old = recognition;
    recognition = null;
    try { old.abort(); } catch { /* ignore */ }
  }

  if (audioSession) {
    audioSession = null;
    audioIntentionalStop = true;
    requestRecorderStop();
    cleanupAudioResources();
  }

  void import('./robot-voice').then(m => m.stopRobotVoice()).catch(() => {});
}

export function isSpeaking(): boolean {
  // Kept synchronous for the existing mouth-sync polling loop.
  return typeof window !== 'undefined' && !!(window.speechSynthesis && window.speechSynthesis.speaking);
}

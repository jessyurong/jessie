/// <reference types="node" />
/**
 * Vercel serverless function — JESSiE-BOT Gemini proxy.
 * Reads GEMINI_API_KEY from Vercel Environment Variables (server-side only).
 * The client calls POST /api/mascot-chat, so the key never reaches the browser.
 */

import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT, AUDIO_INSTRUCTION } from '../shared/system-prompt';
import {
  MAX_AUDIO_BASE64_CHARS,
  MAX_TEXT_CHARS,
  audioMimeCandidates,
  checkRateLimit,
  getClientKey,
  isAudioFormatError,
} from '../shared/api-guards';

type AudioResult = { transcript: string; reply: string };

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
    // Not JSON — try labelled text instead.
  }
  const transcript = text.match(/TRANSCRIPT:\s*(.*)/i)?.[1]?.trim() || 'Voice message';
  const reply = text.match(/REPLY:\s*([\s\S]*)/i)?.[1]?.trim() || text;
  return { transcript, reply: reply || 'Sorry, I did not catch that. Please try again.' };
}

/** Recorders label audio with invalid combos like "audio/mp4;codecs=opus".
 *  Gemini accepts MP4/AAC and WebM/Opus bytes when labelled audio/m4a. */
function normalizeAudioMime(type: unknown): string {
  const base = (typeof type === 'string' ? type : '').split(';')[0].trim().toLowerCase();
  if (base.startsWith('audio/mp4') || base.startsWith('audio/m4a') ||
    base.startsWith('audio/webm') || base.startsWith('audio/ogg') ||
    base.startsWith('audio/opus') || base.startsWith('audio/x-m4a')) {
    return 'audio/m4a';
  }
  return base || 'audio/m4a';
}

// Minimal shapes — avoids requiring @vercel/node just for types.
type VercelLikeRequest = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | string[]>;
  headers?: Record<string, string | string[] | undefined>;
};

type VercelLikeResponse = {
  status: (code: number) => VercelLikeResponse;
  json: (payload: unknown) => void;
  setHeader?: (name: string, value: string) => void;
};

function parseMessage(body: unknown): string | null {
  if (!body) return null;
  if (typeof body === 'string') {
    try {
      return parseMessage(JSON.parse(body));
    } catch {
      return null;
    }
  }
  if (typeof body === 'object' && 'message' in body) {
    const value = (body as { message?: unknown }).message;
    return typeof value === 'string' && value.trim() ? value : null;
  }
  return null;
}

export default async function handler(
  req: VercelLikeRequest,
  res: VercelLikeResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Basic abuse protection. Per warm instance only — add Upstash/KV if the
  // bot ever gets enough traffic that this is not enough.
  const clientKey = getClientKey(req.headers?.['x-forwarded-for'], 'unknown');
  const limit = checkRateLimit(`chat:${clientKey}`);
  if (!limit.ok) {
    res.setHeader?.('Retry-After', String(limit.retryAfter));
    res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
    return;
  }

  // Voice message: Gemini transcribes the audio and answers in one call.
  const audioBody = req.body && typeof req.body === 'object' ? req.body as { audio?: unknown; mimeType?: unknown } : null;
  if (audioBody && typeof audioBody.audio === 'string' && audioBody.audio.length > 0) {
    if (audioBody.audio.length > MAX_AUDIO_BASE64_CHARS) {
      res.status(413).json({ error: 'Voice message is too long. Please keep it under 30 seconds.' });
      return;
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
      return;
    }
    const preferred = normalizeAudioMime(audioBody.mimeType);
    const ai = new GoogleGenAI({ apiKey });
    let lastError: unknown = null;

    for (const mimeType of audioMimeCandidates(preferred)) {
      try {
        const result = await ai.models.generateContent({
          model: 'gemini-3.5-flash-lite',
          contents: [{
            role: 'user',
            parts: [
              { inlineData: { mimeType, data: audioBody.audio } },
              { text: AUDIO_INSTRUCTION },
            ],
          }],
          config: {
            systemInstruction: SYSTEM_PROMPT,
            maxOutputTokens: 300,
            temperature: 0.7,
            responseMimeType: 'application/json',
          },
        });
        res.status(200).json(parseAudioReply(result.text ?? ''));
        return;
      } catch (err) {
        lastError = err;
        if (!isAudioFormatError(err)) break;
      }
    }

    console.error('[mascot-chat audio]', lastError);
    res.status(500).json({ error: 'Gemini API error' });
    return;
  }

  const message = parseMessage(req.body);
  if (!message) {
    res.status(400).json({ error: 'Missing message' });
    return;
  }
  if (message.length > MAX_TEXT_CHARS) {
    res.status(413).json({ error: 'Message is too long.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: [{ role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 200,
        temperature: 0.85,
      },
    });
    res.status(200).json({ reply: result.text || 'Sorry, I did not catch that. Please try again.' });
  } catch (err) {
    console.error('[mascot-chat]', err);
    res.status(500).json({ error: 'Gemini API error' });
  }
}

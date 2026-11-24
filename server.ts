/**
 * Express API server — Mascot AI proxy
 * Keeps the GEMINI_API_KEY out of the client bundle.
 * Run alongside Vite dev server or as a production middleware.
 */

import express, { type Request, type Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { SYSTEM_PROMPT, AUDIO_INSTRUCTION } from './shared/system-prompt';
import {
  MAX_AUDIO_BASE64_CHARS,
  MAX_TEXT_CHARS,
  audioMimeCandidates,
  checkRateLimit,
  getClientKey,
  isAudioFormatError,
} from './shared/api-guards';

// README tells people to use .env.local; accept both that and plain .env.
dotenv.config({ path: ['.env.local', '.env'] });

const app = express();
// Voice messages are sent as base64 audio; raise the default 100kb limit.
app.use(express.json({ limit: '8mb' }));

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

app.post('/api/mascot-chat', async (req: Request, res: Response): Promise<void> => {
  const body = req.body as { message?: string; audio?: string; mimeType?: string };

  // Basic abuse protection for this public endpoint.
  const clientKey = getClientKey(req.headers['x-forwarded-for'], req.ip || 'local');
  const limit = checkRateLimit(`chat:${clientKey}`);
  if (!limit.ok) {
    res.setHeader('Retry-After', String(limit.retryAfter));
    res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
    return;
  }

  // Voice message: Gemini transcribes the audio and answers in one call.
  if (typeof body.audio === 'string' && body.audio.length > 0) {
    if (body.audio.length > MAX_AUDIO_BASE64_CHARS) {
      res.status(413).json({ error: 'Voice message is too long. Please keep it under 30 seconds.' });
      return;
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
      return;
    }
    const preferred = normalizeAudioMime(body.mimeType);
    const ai = new GoogleGenAI({ apiKey });
    let lastError: unknown = null;

    for (const mimeType of audioMimeCandidates(preferred)) {
      try {
        const result = await ai.models.generateContent({
          model: 'gemini-3.5-flash-lite',
          contents: [{
            role: 'user',
            parts: [
              { inlineData: { mimeType, data: body.audio } },
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
        res.json(parseAudioReply(result.text ?? ''));
        return;
      } catch (err) {
        lastError = err;
        // Only a rejected format is worth retrying; auth/quota errors are not.
        if (!isAudioFormatError(err)) break;
      }
    }

    console.error('[mascot-chat audio]', lastError);
    res.status(500).json({ error: 'Gemini API error' });
    return;
  }

  const { message } = body;
  if (!message || typeof message !== 'string') {
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
    res.json({ reply: result.text ?? 'Sorry, I did not catch that. Please try again.' });
  } catch (err) {
    console.error('[mascot-chat]', err);
    res.status(500).json({ error: 'Gemini API error' });
  }
});

// Health check
app.get('/api/health', (_req, res) => { res.json({ ok: true }); });

const PORT = parseInt(process.env.PORT ?? '3001', 10);
app.listen(PORT, () => {
  console.log(`[JESSiE-BOT API] running on http://localhost:${PORT}`);
});

export default app;

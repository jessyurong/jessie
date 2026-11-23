/**
 * Express API server — Mascot AI proxy
 * Keeps the GEMINI_API_KEY out of the client bundle.
 * Run alongside Vite dev server or as a production middleware.
 */

import express, { type Request, type Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
// Voice messages are sent as base64 audio; raise the default 100kb limit.
app.use(express.json({ limit: '8mb' }));

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

app.post('/api/mascot-chat', async (req: Request, res: Response): Promise<void> => {
  const body = req.body as { message?: string; audio?: string; mimeType?: string };

  // Voice message: Gemini transcribes the audio and answers in one call.
  if (typeof body.audio === 'string' && body.audio.length > 0) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
      return;
    }
    const mimeType = typeof body.mimeType === 'string' && body.mimeType.startsWith('audio/')
      ? body.mimeType
      : 'audio/webm';
    try {
      const ai = new GoogleGenAI({ apiKey });
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
          maxOutputTokens: 200,
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      });
      res.json(parseAudioReply(result.text ?? ''));
    } catch (err) {
      console.error('[mascot-chat audio]', err);
      res.status(500).json({ error: 'Gemini API error' });
    }
    return;
  }

  const { message } = body;
  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'Missing message' });
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
        maxOutputTokens: 150,
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

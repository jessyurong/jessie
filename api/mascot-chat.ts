/// <reference types="node" />
/**
 * Vercel serverless function — JESSiE-BOT Gemini proxy.
 * Reads GEMINI_API_KEY from Vercel Environment Variables (server-side only).
 * The client calls POST /api/mascot-chat, so the key never reaches the browser.
 */

import { GoogleGenAI } from '@google/genai';

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
- 21 years old.
- kalaban ni jessie si cassie sa business, si cassie ay isang biology 3rd year student. ayaw ni cassie naging employee nya si jessie in the future.

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

// Minimal shapes — avoids requiring @vercel/node just for types.
type VercelLikeRequest = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | string[]>;
};

type VercelLikeResponse = {
  status: (code: number) => VercelLikeResponse;
  json: (payload: unknown) => void;
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

  // Voice message: Gemini transcribes the audio and answers in one call.
  const audioBody = req.body && typeof req.body === 'object' ? req.body as { audio?: unknown; mimeType?: unknown } : null;
  if (audioBody && typeof audioBody.audio === 'string' && audioBody.audio.length > 0) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
      return;
    }
    const mimeType = typeof audioBody.mimeType === 'string' && audioBody.mimeType.startsWith('audio/')
      ? audioBody.mimeType
      : 'audio/webm';
    try {
      const ai = new GoogleGenAI({ apiKey });
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
          maxOutputTokens: 200,
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      });
      res.status(200).json(parseAudioReply(result.text ?? ''));
    } catch (err) {
      console.error('[mascot-chat audio]', err);
      res.status(500).json({ error: 'Gemini API error' });
    }
    return;
  }

  const message = parseMessage(req.body);
  if (!message) {
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
    res.status(200).json({ reply: result.text || 'Sorry, I did not catch that. Please try again.' });
  } catch (err) {
    console.error('[mascot-chat]', err);
    res.status(500).json({ error: 'Gemini API error' });
  }
}

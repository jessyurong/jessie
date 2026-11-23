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

If asked about hiring or projects, encourage people to reach out.`;

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

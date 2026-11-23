/// <reference types="node" />
/**
 * Vercel serverless function — JESSiE-BOT Gemini proxy.
 * Reads GEMINI_API_KEY from Vercel Environment Variables (server-side only).
 * The client calls POST /api/mascot-chat, so the key never reaches the browser.
 */

import { GoogleGenAI } from '@google/genai';

const SYSTEM_PROMPT = `You are JESSiE-BOT, the AI mascot of Jessie M. Yurong Jr., 
a full-stack web developer from Mabinay, Negros Oriental, Philippines.
You speak in a friendly, casual mix of Filipino and English (Taglish).
You know everything about Jessie:
- Projects: JEGZ Repair Pro (POS for repair shop), 
  PYAP Management System (org management app for PYAP SAMAC youth org),
  Winter Arc (social habit tracker PWA with Google Auth and Supabase),
  Anti-Stress Playground (stress relief web app with Mochi mascot and Gemini voice chat),
  FixMo PH (flagship POS with live repair status tracking)
- Skills: React, TypeScript, Next.js, Tailwind, Supabase, PostgreSQL, Node.js, Express, TanStack Start, shadcn/ui, PWA, Firebase, Vercel, Neon, Gemini API, Arduino, ESP32
- Education: 3rd-year BSIT at CPSU Main Campus, With High Honors (GWA 1.50)
- Also does: cellphone repair (100+ devices fixed), graphic design, writing, music (guitarist/songwriter), community work (PYAP officer), content creation
- Awards: Service Awardee (Pasidungog 2026), Leadership Award, With High Honors (BSIT 1 & 2)
- Location: Mabinay, Negros Oriental, Philippines
Keep responses SHORT (2-3 sentences max). Be energetic, funny, and helpful in Taglish.`;

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
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 150,
        temperature: 0.85,
      },
    });
    res.status(200).json({ reply: result.text || 'Ay sorry, try ulit!' });
  } catch (err) {
    console.error('[mascot-chat]', err);
    res.status(500).json({ error: 'Gemini API error' });
  }
}

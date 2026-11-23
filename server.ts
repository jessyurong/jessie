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
app.use(express.json());

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

app.post('/api/mascot-chat', async (req: Request, res: Response): Promise<void> => {
  const { message } = req.body as { message?: string };
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
    res.json({ reply: result.text ?? 'Ay sorry, try ulit!' });
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

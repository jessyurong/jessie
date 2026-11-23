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

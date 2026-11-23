<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ad4ea64b-88e7-4a2a-b3a1-1fa1a6daccb9

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set `GEMINI_API_KEY` in `.env.local` (copy `.env.example`). This is read by the
   Express proxy in `server.ts` and never reaches the browser bundle.
3. Start the AI proxy:
   `npm run server`  (terminal 1 — keeps the API key server-side)
4. Start the site:
   `npm run dev`  (terminal 2 — http://localhost:3000)

Vite proxies `/api/*` to the Express server on port 3001.

## Deploy on Vercel (recommended)

No Express server needed — `api/mascot-chat.ts` is a serverless function.

1. In **Vercel → Project → Settings → Environment Variables**, add exactly:
   - Name: `GEMINI_API_KEY`
   - Value: your Gemini API key
2. **Redeploy** (Vercel does not apply new env vars to existing deployments).
3. That's it. The site calls `/api/mascot-chat`, the function reads the key
   server-side, and the key is **never** exposed in the browser bundle.

Only use `VITE_GEMINI_API_KEY` if you are deploying a purely static build with
no `/api` functions — and remember Vite embeds that value in the client JS.

## Talk to JESSiE-BOT

- **Tap and hold** the robot (mouse or touch) and speak — it uses the browser's
  Web Speech API, so use Chrome/Edge for the best Tagalog recognition.
- Your question appears as a **chat bubble**, then Gemini's reply appears in the
  same bubble thread.
- The reply is **spoken out loud with a robot voice**: a low-pitched speech voice
  layered with Web Audio "blip" synthesis, plus sound-wave bars near the head.
- The Gemini key is resolved in this order:
  1. `POST /api/mascot-chat` → Express proxy using server-side `GEMINI_API_KEY`
  2. `VITE_GEMINI_API_KEY` → optional browser-side fallback for static-only deploys

> Note: a purely static deploy (no Express proxy) needs `VITE_GEMINI_API_KEY` set
> at build time. Be aware that Vite embeds `VITE_` variables in the client bundle.

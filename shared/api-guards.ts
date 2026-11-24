/**
 * Lightweight protection for the public mascot API.
 *
 * The rate limit is per warm serverless instance. That is intentionally a
 * cheap first line of defence, not a replacement for a shared store
 * (Upstash/Vercel KV) if the bot gets popular.
 */

/** ~3 MB of binary audio after base64 decoding. */
export const MAX_AUDIO_BASE64_CHARS = 4_000_000;
export const MAX_TEXT_CHARS = 2_000;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 1_000;

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfter: number };

export function checkRateLimit(key: string, limit = 20, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      // Drop expired entries before giving up on new keys.
      for (const [k, v] of buckets) {
        if (v.resetAt <= now) buckets.delete(k);
      }
      if (buckets.size >= MAX_BUCKETS) buckets.clear();
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }

  bucket.count += 1;
  return { ok: true };
}

/** Best-effort client key for Vercel/Express without trusting a raw body field. */
export function getClientKey(forwardedFor: unknown, fallback: string): string {
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }
  if (Array.isArray(forwardedFor) && forwardedFor.length) {
    return String(forwardedFor[0]).split(',')[0].trim();
  }
  return fallback;
}

/** Only retry a different audio label when the rejection is about the format. */
export function isAudioFormatError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err ?? '');
  return /mime|media type|unsupported.*audio|audio.*unsupported|invalid.*audio|audio.*invalid/i.test(message);
}

/** Two attempts at most: the preferred label, then the known-good fallback. */
export function audioMimeCandidates(preferred: string): string[] {
  return preferred === 'audio/m4a' ? ['audio/m4a'] : [preferred, 'audio/m4a'];
}

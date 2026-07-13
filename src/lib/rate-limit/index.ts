import 'server-only';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { rateLimitHits } from '@/lib/db/schema';
import { requireEnv } from '@/lib/env';

/**
 * Postgres-backed fixed-window rate limiting (plan §14). No new paid infra — an atomic
 * INSERT ... ON CONFLICT DO UPDATE increments a per-(action, ip-hash, window) counter.
 * Raw IPs are never stored; they are hashed with a server-only pepper.
 */
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export type RateLimitAction =
  | 'submit_email'
  | 'submit_role'
  | 'submit_preferences'
  | 'submit_phone'
  | 'resume_lookup';

const LIMITS: Record<RateLimitAction, number> = {
  submit_email: 5,
  submit_role: 30,
  submit_preferences: 30,
  submit_phone: 30,
  resume_lookup: 10,
};

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return h.get('x-real-ip')?.trim() || 'unknown';
}

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
}

export async function checkRateLimit(
  action: RateLimitAction,
  ip: string,
): Promise<RateLimitResult> {
  const pepper = requireEnv('RATE_LIMIT_IP_PEPPER');
  const ipHash = createHash('sha256').update(`${ip}:${pepper}`).digest('hex');
  const bucketKey = `${action}:${ipHash}`;
  const windowStart = new Date(Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS);
  const limit = LIMITS[action];

  const db = getDb();
  const rows = await db
    .insert(rateLimitHits)
    .values({ bucketKey, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimitHits.bucketKey, rateLimitHits.windowStart],
      set: { count: sql`${rateLimitHits.count} + 1` },
    })
    .returning({ count: rateLimitHits.count });

  const count = rows[0]?.count ?? 1;
  return { allowed: count <= limit, count, limit };
}

import 'server-only';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { rateLimitHits } from '@/lib/db/schema';
import { requireEnv } from '@/lib/env';

/**
 * Postgres-backed fixed-window rate limiting. Verification can provide additional scoped
 * subjects (lead and normalized email); every subject is pepper-hashed before storage, so
 * raw IPs and addresses never enter the rate-limit table.
 */
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export type RateLimitAction =
  | 'submit_email'
  | 'submit_role'
  | 'submit_preferences'
  | 'submit_phone'
  | 'resume_lookup'
  | 'verify_request'
  | 'verify_submit';

const LIMITS: Record<RateLimitAction, number> = {
  submit_email: 5,
  submit_role: 30,
  submit_preferences: 30,
  submit_phone: 30,
  resume_lookup: 10,
  verify_request: 8, // code sends / 10 min / IP (cooldown adds per-lead throttling)
  verify_submit: 25, // code checks / 10 min / IP
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
  additionalSubjects: string[] = [],
): Promise<RateLimitResult> {
  // Test-only bypass (double-guarded against production) so e2e runs aren't throttled.
  if (
    process.env.RATE_LIMIT_DISABLED === 'true' &&
    process.env.NODE_ENV !== 'production'
  ) {
    return { allowed: true, count: 0, limit: LIMITS[action] };
  }

  const pepper = requireEnv('RATE_LIMIT_IP_PEPPER');
  const windowStart = new Date(Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS);
  const limit = LIMITS[action];
  let highestCount = 0;

  for (const subject of [`ip:${ip}`, ...additionalSubjects]) {
    const subjectHash = createHash('sha256')
      .update(`${subject}:${pepper}`)
      .digest('hex');
    const bucketKey = `${action}:${subjectHash}`;
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
    highestCount = Math.max(highestCount, count);
    if (count > limit) return { allowed: false, count, limit };
  }

  return { allowed: true, count: highestCount, limit };
}

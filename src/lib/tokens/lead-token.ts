import 'server-only';
import { randomBytes, createHash } from 'node:crypto';
import { requireEnv } from '@/lib/env';

/**
 * Resume-token mechanism (plan §12).
 *
 * A 256-bit random token is returned to the client exactly once (stored in localStorage).
 * Only the SHA-256 hash (peppered with a server-only secret) is persisted, so a database
 * leak cannot reconstruct usable tokens. Every mutating action re-verifies the hash and
 * expiry, so a stale/expired/tampered token can never mutate a lead.
 */
export const RESUME_TOKEN_TTL_DAYS = 30;

export function generateResumeToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashResumeToken(token: string): string {
  const pepper = requireEnv('RESUME_TOKEN_SECRET');
  return createHash('sha256').update(`${token}:${pepper}`).digest('hex');
}

export function resumeTokenExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + RESUME_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

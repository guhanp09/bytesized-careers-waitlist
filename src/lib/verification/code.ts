import 'server-only';
import { randomInt, randomUUID, createHmac, timingSafeEqual } from 'node:crypto';
import { requireEnv } from '@/lib/env';

/**
 * Verification code helpers (v2). Codes are 6-digit; only their SHA-256 hash (peppered
 * with a server-only secret) is ever persisted — the raw code is never stored.
 */
export const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds between sends
export const MAX_VERIFY_ATTEMPTS = 5; // wrong-code attempts before lockout

export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export interface CodeContext {
  leadId: string;
  channel: 'email' | 'phone';
}

export function generateChallengeId(): string {
  return randomUUID();
}

export function hashCode(code: string, context: CodeContext): string {
  const pepper = requireEnv('RESUME_TOKEN_SECRET');
  return createHmac('sha256', pepper)
    .update(`vcode:v2:${context.channel}:${context.leadId}:${code}`)
    .digest('hex');
}

export function codeHashMatches(candidateHash: string, storedHash: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(candidateHash) || !/^[a-f0-9]{64}$/i.test(storedHash)) {
    return false;
  }
  return timingSafeEqual(Buffer.from(candidateHash, 'hex'), Buffer.from(storedHash, 'hex'));
}

export function codeExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + CODE_TTL_MS);
}

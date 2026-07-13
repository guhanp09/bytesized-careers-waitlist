import { describe, it, expect } from 'vitest';
import {
  generateResumeToken,
  hashResumeToken,
  resumeTokenExpiry,
  RESUME_TOKEN_TTL_DAYS,
} from '@/lib/tokens/lead-token';

describe('resume tokens', () => {
  it('generates unique high-entropy tokens', () => {
    const a = generateResumeToken();
    const b = generateResumeToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(40);
  });

  it('hashes deterministically (same token -> same hash)', () => {
    const token = generateResumeToken();
    expect(hashResumeToken(token)).toBe(hashResumeToken(token));
  });

  it('produces different hashes for different tokens', () => {
    expect(hashResumeToken('a')).not.toBe(hashResumeToken('b'));
  });

  it('never stores the raw token in the hash', () => {
    const token = generateResumeToken();
    expect(hashResumeToken(token)).not.toContain(token);
  });

  it('sets expiry TTL days in the future', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const exp = resumeTokenExpiry(now);
    const days = (exp.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
    expect(days).toBe(RESUME_TOKEN_TTL_DAYS);
  });
});

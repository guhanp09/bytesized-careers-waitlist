import { describe, it, expect } from 'vitest';
import {
  generateCode,
  hashCode,
  codeHashMatches,
  codeExpiry,
  CODE_TTL_MS,
} from '@/lib/verification/code';

const emailContext = { leadId: 'lead-1', channel: 'email' as const };

describe('verification code', () => {
  it('generates a 6-digit numeric code', () => {
    for (let i = 0; i < 25; i++) {
      expect(generateCode()).toMatch(/^\d{6}$/);
    }
  });

  it('hashes deterministically and never contains the raw code', () => {
    expect(hashCode('123456', emailContext)).toBe(hashCode('123456', emailContext));
    expect(hashCode('123456', emailContext)).not.toContain('123456');
    expect(hashCode('123456', emailContext)).not.toBe(hashCode('654321', emailContext));
    expect(
      hashCode('123456', emailContext),
    ).not.toBe(hashCode('123456', { leadId: 'lead-2', channel: 'email' }));
    expect(codeHashMatches(hashCode('123456', emailContext), hashCode('123456', emailContext))).toBe(true);
  });

  it('expiry is the TTL in the future', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    expect(codeExpiry(now).getTime() - now.getTime()).toBe(CODE_TTL_MS);
  });
});

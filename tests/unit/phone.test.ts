import { describe, it, expect } from 'vitest';
import { normalizePhone } from '@/lib/validation/phone';

describe('normalizePhone', () => {
  it('normalizes a valid national number to E.164', () => {
    const result = normalizePhone('7400123456', 'GB');
    expect(result).not.toBeNull();
    expect(result?.e164).toBe('+447400123456');
    expect(result?.countryIso).toBe('GB');
  });

  it('accepts a number already in international form', () => {
    const result = normalizePhone('+14155552671', 'US');
    expect(result?.e164).toBe('+14155552671');
  });

  it('returns null for an invalid number', () => {
    expect(normalizePhone('abc', 'GB')).toBeNull();
    expect(normalizePhone('123', 'GB')).toBeNull();
  });
});

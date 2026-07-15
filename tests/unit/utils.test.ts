import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { normalizeEmail, normalizeFullName, emailStepSchema } from '@/lib/validation/email';
import { maskEmail } from '@/lib/utils/mask';
import { fieldErrorsOf } from '@/lib/validation/utils';

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Foo.Bar@Example.COM ')).toBe('foo.bar@example.com');
  });
});

describe('full name capture', () => {
  it('collapses pasted whitespace without changing case or Unicode', () => {
    expect(normalizeFullName('  Zoë   O’Connor\t-李  ')).toBe('Zoë O’Connor -李');
  });

  it('requires a non-empty name and rejects control characters', () => {
    expect(emailStepSchema.safeParse({ fullName: '   ', email: 'a@example.com' }).success).toBe(false);
    expect(emailStepSchema.safeParse({ fullName: 'A\u0000B', email: 'a@example.com' }).success).toBe(false);
  });

  it('returns the normalized name in parsed data', () => {
    const result = emailStepSchema.safeParse({ fullName: '  Taylor   Morgan ', email: 'a@example.com' });
    expect(result.success && result.data.fullName).toBe('Taylor Morgan');
  });
});

describe('maskEmail', () => {
  it('reveals only the first character of the local part', () => {
    expect(maskEmail('guhanp09@gmail.com')).toBe('g*******@gmail.com');
  });
  it('handles single-character local parts', () => {
    expect(maskEmail('a@b.com')).toBe('a*@b.com');
  });
  it('is safe for malformed input', () => {
    expect(maskEmail('notanemail')).toBe('***');
  });
});

describe('fieldErrorsOf', () => {
  it('maps zod issues to a field->messages record', () => {
    const schema = z.object({ email: z.email() });
    const result = schema.safeParse({ email: 'nope' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = fieldErrorsOf(result.error);
      expect(errors.email).toBeDefined();
      expect(errors.email!.length).toBeGreaterThan(0);
    }
  });
});

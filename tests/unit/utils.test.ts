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

describe('emailStepSchema email format (whitespace tolerance)', () => {
  const parseEmail = (email: unknown) =>
    emailStepSchema.safeParse({ fullName: 'Taylor Morgan', email });

  it('accepts an ordinary valid address', () => {
    const result = parseEmail('a@example.com');
    expect(result.success && result.data.email).toBe('a@example.com');
  });

  it.each([
    ['leading spaces', '  a@example.com'],
    ['trailing spaces', 'a@example.com  '],
    ['leading and trailing spaces', '  a@example.com  '],
  ])('trims %s before checking format', (_label, email) => {
    const result = parseEmail(email);
    expect(result.success && result.data.email).toBe('a@example.com');
  });

  it('trims surrounding whitespace from a pasted address', () => {
    const pastedEmail = '\ta@example.com\r\n';
    const result = parseEmail(pastedEmail);
    expect(result.success && result.data.email).toBe('a@example.com');
  });

  it('trims non-breaking spaces introduced by autofill or paste', () => {
    const result = parseEmail('\u00a0a@example.com\u00a0');
    expect(result.success && result.data.email).toBe('a@example.com');
  });

  it('preserves input casing for display while server normalization lowercases identity', () => {
    const result = emailStepSchema.safeParse({
      fullName: 'Taylor Morgan',
      email: '  Person@Example.COM  ',
    });
    expect(result.success && result.data.email).toBe('Person@Example.COM');
    expect(result.success && normalizeEmail(result.data.email)).toBe('person@example.com');
  });

  it('still rejects a genuinely malformed address after trimming', () => {
    expect(parseEmail('  not-an-email  ').success).toBe(false);
    expect(parseEmail('person @example.com').success).toBe(false);
  });

  it('still enforces the max-length bound on the trimmed value', () => {
    const long = `${'a'.repeat(321)}@b.co`; // 326 chars, > 320
    const result = parseEmail(`  ${long}  `);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('That email address is too long.');
    }
  });

  it('rejects empty input and non-string server-side bypass attempts', () => {
    expect(parseEmail('').success).toBe(false);
    expect(parseEmail('   ').success).toBe(false);
    expect(parseEmail({ address: 'a@example.com' }).success).toBe(false);
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

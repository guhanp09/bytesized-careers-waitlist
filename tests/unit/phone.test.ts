import { describe, it, expect } from 'vitest';
import {
  normalizePhone,
  normalizePhoneInput,
  phoneNormalizationErrorMessage,
} from '@/lib/validation/phone';

describe('normalizePhone', () => {
  it.each([
    ['9876543210', 'IN', '+919876543210', '9876543210'],
    ['919876543210', 'IN', '+919876543210', '9876543210'],
    ['+91 98765 43210', 'IN', '+919876543210', '9876543210'],
    ['98765-43210', 'IN', '+919876543210', '9876543210'],
    ['4155552671', 'US', '+14155552671', '4155552671'],
    ['14155552671', 'US', '+14155552671', '4155552671'],
    ['+1 (415) 555-2671', 'US', '+14155552671', '4155552671'],
    ['(415) 555-2671', 'US', '+14155552671', '4155552671'],
  ])(
    'normalizes %s for %s without duplicating its calling code',
    (input, country, e164, nationalNumber) => {
      expect(normalizePhoneInput(input, country)).toEqual({
        ok: true,
        e164,
        countryIso: country,
        nationalNumber,
      });
    },
  );

  it('uses country metadata for domestic trunk prefixes', () => {
    expect(normalizePhoneInput('020 7946 0018', 'GB')).toEqual({
      ok: true,
      e164: '+442079460018',
      countryIso: 'GB',
      nationalNumber: '2079460018',
    });
  });

  it('rejects a complete international number that conflicts with the selection', () => {
    expect(normalizePhoneInput('+44 7400 123456', 'US')).toEqual({
      ok: false,
      reason: 'country_mismatch',
    });
    expect(phoneNormalizationErrorMessage('country_mismatch')).toBe(
      'This number does not match the selected country. Change the country or enter the number without its country code.',
    );
  });

  it.each([
    '4155552671abc',
    '415.555.2671',
    '415/555/2671',
    '4155552671 x123',
    '++14155552671',
    '1415+5552671',
    '(415 555-2671',
  ])('rejects unsupported content instead of silently stripping it: %s', (input) => {
    expect(normalizePhoneInput(input, 'US')).toEqual({
      ok: false,
      reason: 'invalid_characters',
    });
  });

  it('uses metadata validity rather than a universal digit count', () => {
    expect(normalizePhoneInput('1234567890', 'US')).toEqual({
      ok: false,
      reason: 'invalid_number',
    });
    expect(normalizePhoneInput('987654321', 'IN')).toEqual({
      ok: false,
      reason: 'invalid_number',
    });
    expect(normalizePhone('123', 'GB')).toBeNull();
  });

  it('rejects unsupported countries and keeps the compatibility helper nullable', () => {
    expect(normalizePhoneInput('4155552671', 'ZZ')).toEqual({
      ok: false,
      reason: 'unsupported_country',
    });
    expect(normalizePhone('4155552671abc', 'US')).toBeNull();
  });
});

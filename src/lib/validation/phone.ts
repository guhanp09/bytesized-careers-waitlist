import { z } from 'zod';
import {
  getCountryCallingCode,
  isSupportedCountry,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';

/**
 * A discriminated union keeps the phone genuinely optional. Channel choices are accepted
 * only alongside a supplied number; skipped submissions are always stored as all-false.
 */
export const phoneStepSchema = z.discriminatedUnion('skipped', [
  z.object({
    leadId: z.uuid({ message: 'Invalid session.' }),
    resumeToken: z.string().min(1, { message: 'Invalid session.' }),
    skipped: z.literal(true),
  }),
  z.object({
    leadId: z.uuid({ message: 'Invalid session.' }),
    resumeToken: z.string().min(1, { message: 'Invalid session.' }),
    skipped: z.literal(false),
    countryIso: z.string().length(2),
    phoneNumber: z.string().trim().min(1).max(40),
    whatsappConsent: z.boolean(),
    smsConsent: z.boolean(),
    voiceConsent: z.boolean(),
  }),
]);

export type PhoneStepInput = z.infer<typeof phoneStepSchema>;

export interface NormalizedPhone {
  e164: string;
  countryIso: string;
  nationalNumber: string;
}

export type PhoneNormalizationFailureReason =
  | 'empty'
  | 'invalid_characters'
  | 'country_mismatch'
  | 'invalid_number'
  | 'unsupported_country';

export type PhoneNormalizationResult =
  | ({ ok: true } & NormalizedPhone)
  | { ok: false; reason: PhoneNormalizationFailureReason };

const SAFE_PHONE_CHARACTERS = /^[0-9\s()+-]+$/u;

export function phoneNormalizationErrorMessage(
  reason: PhoneNormalizationFailureReason,
): string {
  if (reason === 'country_mismatch') {
    return 'This number does not match the selected country. Change the country or enter the number without its country code.';
  }
  if (reason === 'invalid_characters') {
    return 'Use digits only, with optional spaces, hyphens, parentheses, or one leading +.';
  }
  if (reason === 'unsupported_country') return 'Select a supported country.';
  if (reason === 'empty') return 'Enter a phone number.';
  return 'Enter a valid phone number for the selected country.';
}

function hasBalancedParentheses(value: string): boolean {
  let depth = 0;
  for (const character of value) {
    if (character === '(') {
      depth += 1;
      if (depth > 1) return false;
    } else if (character === ')') {
      depth -= 1;
      if (depth < 0) return false;
    }
  }
  return depth === 0;
}

function validSelectedCountryPhone(
  digits: string,
  iso: CountryCode,
): ReturnType<typeof parsePhoneNumberFromString> {
  const parsedAsEntered = parsePhoneNumberFromString(digits, iso);
  const callingCode = getCountryCallingCode(iso);

  if (digits.startsWith(callingCode) && digits.length > callingCode.length) {
    const parsedWithoutDuplicateCode = parsePhoneNumberFromString(
      digits.slice(callingCode.length),
      iso,
    );
    if (
      parsedWithoutDuplicateCode?.isValid() &&
      parsedWithoutDuplicateCode.country === iso &&
      (!parsedAsEntered?.isValid() ||
        parsedAsEntered.country !== iso ||
        parsedAsEntered.number === parsedWithoutDuplicateCode.number)
    ) {
      return parsedWithoutDuplicateCode;
    }
  }

  return parsedAsEntered;
}

/**
 * Validate human-entered phone text against the explicitly selected country.
 * Numbering rules and domestic trunk prefixes remain entirely metadata-driven.
 */
export function normalizePhoneInput(
  phoneNumber: string,
  countryIso: string,
): PhoneNormalizationResult {
  const selectedCountry = countryIso.toUpperCase();
  if (!isSupportedCountry(selectedCountry)) {
    return { ok: false, reason: 'unsupported_country' };
  }
  const iso = selectedCountry as CountryCode;
  const trimmed = phoneNumber.trim();
  if (!trimmed) return { ok: false, reason: 'empty' };

  if (!SAFE_PHONE_CHARACTERS.test(trimmed) || !hasBalancedParentheses(trimmed)) {
    return { ok: false, reason: 'invalid_characters' };
  }

  const plusCount = [...trimmed].filter((character) => character === '+').length;
  if (plusCount > 1 || (plusCount === 1 && !trimmed.startsWith('+'))) {
    return { ok: false, reason: 'invalid_characters' };
  }

  const compact = trimmed.replace(/[\s()-]/gu, '');
  if (!/^\+?\d+$/u.test(compact)) {
    return { ok: false, reason: 'invalid_characters' };
  }

  const parsed = compact.startsWith('+')
    ? parsePhoneNumberFromString(compact)
    : validSelectedCountryPhone(compact, iso);

  if (compact.startsWith('+') && parsed?.country !== iso) {
    return { ok: false, reason: 'country_mismatch' };
  }
  if (!parsed || parsed.country !== iso || !parsed.isValid()) {
    return { ok: false, reason: 'invalid_number' };
  }

  return {
    ok: true,
    e164: parsed.number,
    countryIso: iso,
    nationalNumber: parsed.nationalNumber,
  };
}

/** Compatibility helper for callers that only need the normalized value. */
export function normalizePhone(
  phoneNumber: string,
  countryIso: string,
): NormalizedPhone | null {
  const result = normalizePhoneInput(phoneNumber, countryIso);
  if (!result.ok) return null;
  return {
    e164: result.e164,
    countryIso: result.countryIso,
    nationalNumber: result.nationalNumber,
  };
}

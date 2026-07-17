import { z } from 'zod';
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

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
    phoneNumber: z.string().min(3).max(30),
    whatsappConsent: z.boolean(),
    smsConsent: z.boolean(),
    voiceConsent: z.boolean(),
  }),
]);

export type PhoneStepInput = z.infer<typeof phoneStepSchema>;

export interface NormalizedPhone {
  e164: string;
  countryIso: string;
}

/** Parse + validate a phone number for a country, returning E.164, or null if invalid. */
export function normalizePhone(
  phoneNumber: string,
  countryIso: string,
): NormalizedPhone | null {
  const iso = countryIso.toUpperCase() as CountryCode;
  const parsed = parsePhoneNumberFromString(phoneNumber, iso);
  if (!parsed || !parsed.isValid()) return null;
  return { e164: parsed.number, countryIso: parsed.country ?? iso };
}

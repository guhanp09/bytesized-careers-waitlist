import { z } from 'zod';

/**
 * Email validation + normalization (plan §13).
 *
 * We can validate that an email is correctly FORMATTED without owning a domain; what we
 * cannot yet do (until a branded verification email exists) is prove the visitor controls
 * the address. Normalization lowercases the whole address — a documented simplification
 * that is universal real-world practice, slightly looser than RFC 5321 local-part rules.
 */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export const FULL_NAME_MAX_LENGTH = 120;

/** Preserve the visitor's casing and Unicode while making pasted spacing predictable. */
export function normalizeFullName(raw: string): string {
  return raw.trim().replace(/\s+/gu, ' ');
}

const fullName = z
  .string()
  .refine((value) => !/[\p{Cc}\p{Cf}]/u.test(value), {
    message: 'Please use letters, spaces, apostrophes, or hyphens in your name.',
  })
  .transform(normalizeFullName)
  .refine((value) => value.length > 0, { message: 'Please enter your name.' })
  .refine((value) => value.length <= FULL_NAME_MAX_LENGTH, {
    message: `Your name must be ${FULL_NAME_MAX_LENGTH} characters or fewer.`,
  });

export const emailStepSchema = z.object({
  fullName,
  email: z
    .email({ message: 'Please enter a valid email address.' })
    .max(320, { message: 'That email address is too long.' }),
  // Honeypot: any non-empty value indicates a bot (checked in the action).
  honeypot: z.string().optional().default(''),
  // First-touch attribution (all optional, bounded).
  source: z.string().max(120).optional(),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  referrer: z.string().max(2048).optional(),
});

/** Changing an address may omit a legacy/null name; an existing valid name is preserved. */
export const changeEmailStepSchema = emailStepSchema
  .omit({ fullName: true })
  .extend({ fullName: z.union([fullName, z.literal('')]).optional() });

export type EmailStepInput = z.input<typeof emailStepSchema>;

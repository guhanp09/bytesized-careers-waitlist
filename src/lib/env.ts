import { z } from 'zod';

/**
 * Environment access (plan §17, §19).
 *
 * Every field is optional at parse time so that `next build` and local tooling never
 * crash when secrets are absent — in particular, missing email-provider credentials
 * must never break contact collection. Presence of genuinely-required values (e.g.
 * DATABASE_URL) is enforced lazily, at the point of use, with a clear error message.
 *
 * Feature flags default to OFF: the waitlist is fully functional with no domain and no
 * email provider configured.
 */
const rawEnvSchema = z.object({
  DATABASE_URL: z.string().optional(),

  RESUME_TOKEN_SECRET: z.string().optional(),
  RATE_LIMIT_IP_PEPPER: z.string().optional(),

  AUTH_SECRET: z.string().optional(),
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),
  ADMIN_ALLOWED_GITHUB_LOGINS: z.string().optional(),

  EMAIL_DELIVERY_ENABLED: z.string().optional(),
  EMAIL_VERIFICATION_ENABLED: z.string().optional(),

  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .optional()
    .default('development'),
});

const parsed = rawEnvSchema.parse(process.env);

function asFlag(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}

export const env = {
  ...parsed,
  emailDeliveryEnabled: asFlag(parsed.EMAIL_DELIVERY_ENABLED),
  emailVerificationEnabled: asFlag(parsed.EMAIL_VERIFICATION_ENABLED),
  adminAllowedGithubLogins: (parsed.ADMIN_ALLOWED_GITHUB_LOGINS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  isProduction: parsed.NODE_ENV === 'production',
  isTest: parsed.NODE_ENV === 'test',
} as const;

/** Read a required server secret, throwing a clear error if it is missing at runtime. */
export function requireEnv(
  key: 'DATABASE_URL' | 'RESUME_TOKEN_SECRET' | 'RATE_LIMIT_IP_PEPPER',
): string {
  const value = env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${key}. See .env.example for setup.`,
    );
  }
  return value;
}

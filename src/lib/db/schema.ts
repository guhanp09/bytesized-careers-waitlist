import { sql } from 'drizzle-orm';
import {
  pgTable,
  pgEnum,
  text,
  boolean,
  integer,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

/**
 * ByteSized Careers — waitlist data model (§9 of the implementation plan).
 *
 * Design notes:
 * - Multi-select preferences are stored as Postgres text[] (arrays), not join tables
 *   or jsonb: the vocabulary is a small fixed enum owned by code (lib/validation/constants),
 *   arrays support @>/&& operators + GIN indexes for admin filtering, and unnest() gives
 *   trivial breakdown queries.
 * - `normalizedEmail` carries a UNIQUE constraint and is the idempotency key for the
 *   upsert on Step 1 — repeated submissions UPDATE the existing row, never duplicate.
 * - Four distinct concepts are kept separate and MUST NOT collapse into one boolean:
 *   (1) contact collection, (2) email ownership verification, (3) transactional delivery
 *   status, (4) promotional consent (WhatsApp consent + unsubscribe status).
 */

export const roleEnum = pgEnum('lead_role', ['seeker', 'recruiter', 'both']);

export const completionStatusEnum = pgEnum('completion_status', [
  'email_only',
  'partial',
  'completed',
]);

export const emailVerificationStatusEnum = pgEnum('email_verification_status', [
  'unverified',
  'pending',
  'verified',
  'bounced',
]);

export const transactionalEmailStatusEnum = pgEnum('transactional_email_status', [
  'not_attempted',
  'sent',
  'failed',
  'skipped_disabled',
]);

export const unsubscribeStatusEnum = pgEnum('unsubscribe_status', [
  'subscribed',
  'unsubscribed',
]);

export const waitlistLeads = pgTable(
  'waitlist_leads',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // ── Contact collection ──────────────────────────────────────────────
    originalEmail: text('original_email').notNull(),
    normalizedEmail: text('normalized_email').notNull(), // UNIQUE — idempotency key

    // ── Segmentation ────────────────────────────────────────────────────
    role: roleEnum('role'), // null until Step 2

    jobCategories: text('job_categories')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    talentCategories: text('talent_categories')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    workFormats: text('work_formats')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    organisationTypes: text('organisation_types')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),

    // ── Phone + WhatsApp promotional consent (concept 4) ────────────────
    phoneE164: text('phone_e164'),
    phoneCountryIso: text('phone_country_iso'),
    whatsappConsent: boolean('whatsapp_consent').notNull().default(false),
    whatsappConsentAt: timestamp('whatsapp_consent_at', { withTimezone: true }),
    whatsappConsentCopyVersion: text('whatsapp_consent_copy_version'),

    // ── Email ownership verification (concept 2) ────────────────────────
    emailVerificationStatus: emailVerificationStatusEnum('email_verification_status')
      .notNull()
      .default('unverified'),
    emailVerificationSentAt: timestamp('email_verification_sent_at', {
      withTimezone: true,
    }),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    // NOTE: email_verification_token_hash / _expires_at are intentionally added by a
    // LATER migration, only when EMAIL_VERIFICATION_ENABLED ships (see plan §17).

    // ── Transactional email delivery status (concept 3) ─────────────────
    lastTransactionalEmailStatus: transactionalEmailStatusEnum(
      'last_transactional_email_status',
    )
      .notNull()
      .default('not_attempted'),
    lastTransactionalEmailAt: timestamp('last_transactional_email_at', {
      withTimezone: true,
    }),

    // ── Promotional email unsubscribe (concept 4, future email channel) ─
    unsubscribeStatus: unsubscribeStatusEnum('unsubscribe_status')
      .notNull()
      .default('subscribed'),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),

    // ── Progress / completion ───────────────────────────────────────────
    completionStatus: completionStatusEnum('completion_status')
      .notNull()
      .default('email_only'),
    lastCompletedStep: integer('last_completed_step').notNull().default(1),

    // ── Attribution (first-touch, preserved on upsert) ──────────────────
    source: text('source'),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    referrer: text('referrer'),

    // ── Resume token (hash only; raw token never persisted) ─────────────
    resumeTokenHash: text('resume_token_hash'),
    resumeTokenExpiresAt: timestamp('resume_token_expires_at', {
      withTimezone: true,
    }),

    // ── Timestamps ──────────────────────────────────────────────────────
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('waitlist_leads_normalized_email_key').on(t.normalizedEmail),
    uniqueIndex('waitlist_leads_resume_token_hash_key').on(t.resumeTokenHash),
    index('waitlist_leads_role_idx').on(t.role),
    index('waitlist_leads_completion_status_idx').on(t.completionStatus),
    index('waitlist_leads_created_at_idx').on(t.createdAt),
    index('waitlist_leads_email_verification_status_idx').on(
      t.emailVerificationStatus,
    ),
    index('waitlist_leads_job_categories_gin_idx').using('gin', t.jobCategories),
    index('waitlist_leads_talent_categories_gin_idx').using(
      'gin',
      t.talentCategories,
    ),
  ],
);

/**
 * Fixed-window rate-limit counter (§14). Atomic INSERT ... ON CONFLICT DO UPDATE.
 * `bucketKey` is `${action}:${sha256(ip + pepper)}` — raw IPs are never stored.
 */
export const rateLimitHits = pgTable(
  'rate_limit_hits',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    bucketKey: text('bucket_key').notNull(),
    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
    count: integer('count').notNull().default(1),
  },
  (t) => [
    uniqueIndex('rate_limit_bucket_window_idx').on(t.bucketKey, t.windowStart),
  ],
);

export type WaitlistLead = typeof waitlistLeads.$inferSelect;
export type NewWaitlistLead = typeof waitlistLeads.$inferInsert;

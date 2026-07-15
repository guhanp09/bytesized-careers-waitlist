import { sql } from 'drizzle-orm';
import {
  pgTable,
  pgEnum,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import type { NeedProfileV1 } from '@/types/lead-domain';

/**
 * ByteSized Careers — waitlist data model (§9 of the implementation plan).
 *
 * Design notes:
 * - Current seeker and recruiter needs are stored as separate, versioned JSONB documents.
 *   Legacy flat arrays remain temporarily for compatibility but receive no new writes.
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

export const phoneVerificationStatusEnum = pgEnum('phone_verification_status', [
  'unverified',
  'pending',
  'verified',
]);

export const waitlistLeads = pgTable(
  'waitlist_leads',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // ── Contact collection ──────────────────────────────────────────────
    // Nullable for legacy leads captured before the name field was introduced.
    fullName: text('full_name'),
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

    // ── Current structured intent model (v2 source of truth) ────────────
    seekerNeeds: jsonb('seeker_needs')
      .$type<NeedProfileV1>()
      .notNull()
      .default(sql`'{"version":1,"groups":[]}'::jsonb`),
    recruiterNeeds: jsonb('recruiter_needs')
      .$type<NeedProfileV1>()
      .notNull()
      .default(sql`'{"version":1,"groups":[]}'::jsonb`),
    leadDataVersion: integer('lead_data_version').notNull().default(2),

    // ── Custom "Other" free-text responses (validated, length-bounded) ──
    // Section-specific category "Other" answers, keyed by group id → text.
    jobCategoryOthers: jsonb('job_category_others')
      .$type<Record<string, string>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    talentCategoryOthers: jsonb('talent_category_others')
      .$type<Record<string, string>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    // Legacy single-value "Other" columns (kept for old records; no longer written).
    jobInterestOther: text('job_interest_other'),
    talentNeedOther: text('talent_need_other'),
    platformOther: text('platform_other'),
    nicheOther: text('niche_other'),

    // ── Richer optional context (shared + seeker + recruiter) ───────────
    platforms: text('platforms').array().notNull().default(sql`'{}'::text[]`),
    niches: text('niches').array().notNull().default(sql`'{}'::text[]`),
    experienceLevel: text('experience_level'), // seeker
    availabilityToStart: text('availability_to_start'), // seeker
    portfolioUrl: text('portfolio_url'), // seeker
    hiringFrequency: text('hiring_frequency'), // recruiter
    talentSeniority: text('talent_seniority'), // recruiter
    hiringTimeline: text('hiring_timeline'), // recruiter
    teamSize: text('team_size'), // recruiter
    companyUrl: text('company_url'), // recruiter

    // ── Final open-text ("anything else") — role-aware free response ────
    additionalNotes: text('additional_notes'),

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
    // Verification code metadata (SHA-256 hash only — never store the raw code).
    emailVerificationTokenHash: text('email_verification_token_hash'),
    emailVerificationExpiresAt: timestamp('email_verification_expires_at', {
      withTimezone: true,
    }),
    emailVerificationAttempts: integer('email_verification_attempts')
      .notNull()
      .default(0),
    emailVerificationLastSentAt: timestamp('email_verification_last_sent_at', {
      withTimezone: true,
    }),
    emailVerificationRequestId: text('email_verification_request_id'),
    emailVerificationRequestedAt: timestamp('email_verification_requested_at', {
      withTimezone: true,
    }),
    emailVerificationProviderMessageId: text(
      'email_verification_provider_message_id',
    ),
    emailVerificationFailureAt: timestamp('email_verification_failure_at', {
      withTimezone: true,
    }),
    // Stable internal category only; never persist raw provider responses.
    emailVerificationFailureCode: text('email_verification_failure_code'),

    // ── Phone ownership verification (distinct from WhatsApp consent) ────
    phoneVerificationStatus: phoneVerificationStatusEnum('phone_verification_status')
      .notNull()
      .default('unverified'),
    phoneVerificationTokenHash: text('phone_verification_token_hash'),
    phoneVerificationRequestedAt: timestamp('phone_verification_requested_at', {
      withTimezone: true,
    }),
    phoneVerificationExpiresAt: timestamp('phone_verification_expires_at', {
      withTimezone: true,
    }),
    phoneVerifiedAt: timestamp('phone_verified_at', { withTimezone: true }),
    phoneVerificationAttempts: integer('phone_verification_attempts')
      .notNull()
      .default(0),
    phoneVerificationLastSentAt: timestamp('phone_verification_last_sent_at', {
      withTimezone: true,
    }),

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
    lastMeaningfulStep: text('last_meaningful_step').notNull().default('email'),

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
    index('waitlist_leads_phone_verification_status_idx').on(
      t.phoneVerificationStatus,
    ),
    index('waitlist_leads_job_categories_gin_idx').using('gin', t.jobCategories),
    index('waitlist_leads_talent_categories_gin_idx').using(
      'gin',
      t.talentCategories,
    ),
    index('waitlist_leads_seeker_needs_gin_idx').using('gin', t.seekerNeeds),
    index('waitlist_leads_recruiter_needs_gin_idx').using('gin', t.recruiterNeeds),
    index('waitlist_leads_platforms_gin_idx').using('gin', t.platforms),
    index('waitlist_leads_niches_gin_idx').using('gin', t.niches),
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

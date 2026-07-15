import 'server-only';
import { sql, and, eq, gt, type SQL } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { waitlistLeads } from '@/lib/db/schema';
import { hashResumeToken } from '@/lib/tokens/lead-token';
import { maskEmail } from '@/lib/utils/mask';
import {
  buildNeedProfile,
  needProfileToFormState,
  normalizeNeedProfile,
} from '@/lib/leads/needs';
import { LEAD_DATA_VERSION, type NeedProfileV1 } from '@/types/lead-domain';
import type { Role } from '@/types/waitlist';
import { normalizeFullName } from '@/lib/validation/email';

/**
 * Idempotent upsert for Step 1 (plan §9). Keyed on the UNIQUE normalized_email, so
 * repeated/retried submissions UPDATE the existing row rather than creating a duplicate,
 * and the operation is atomic under concurrency by construction of the unique constraint.
 *
 * First-touch attribution is preserved: source / UTM / referrer are only filled if they
 * were previously null (coalesce existing, incoming). The resume token is rotated so a
 * returning visitor who lost their localStorage token can obtain a fresh, usable one.
 */
export interface UpsertLeadByEmailInput {
  fullName?: string | null;
  originalEmail: string;
  normalizedEmail: string;
  resumeTokenHash: string;
  resumeTokenExpiresAt: Date;
  source?: string | undefined;
  utmSource?: string | undefined;
  utmMedium?: string | undefined;
  utmCampaign?: string | undefined;
  referrer?: string | undefined;
}

export async function upsertLeadByEmail(
  input: UpsertLeadByEmailInput,
): Promise<{ id: string }> {
  const db = getDb();
  const normalizedFullName = input.fullName ? normalizeFullName(input.fullName) : null;
  const rows = await db
    .insert(waitlistLeads)
    .values({
      fullName: normalizedFullName || null,
      originalEmail: input.originalEmail,
      normalizedEmail: input.normalizedEmail,
      source: input.source,
      utmSource: input.utmSource,
      utmMedium: input.utmMedium,
      utmCampaign: input.utmCampaign,
      referrer: input.referrer,
      resumeTokenHash: input.resumeTokenHash,
      resumeTokenExpiresAt: input.resumeTokenExpiresAt,
      completionStatus: 'email_only',
      lastCompletedStep: 1,
      lastMeaningfulStep: 'email',
      leadDataVersion: LEAD_DATA_VERSION,
    })
    .onConflictDoUpdate({
      target: waitlistLeads.normalizedEmail,
      set: {
        originalEmail: sql`excluded.original_email`,
        // A blank/legacy submission must never erase a captured name.
        fullName: sql`case when nullif(trim(excluded.full_name), '') is not null then excluded.full_name else ${waitlistLeads.fullName} end`,
        // First-touch: keep the earliest known attribution.
        source: sql`coalesce(${waitlistLeads.source}, excluded.source)`,
        utmSource: sql`coalesce(${waitlistLeads.utmSource}, excluded.utm_source)`,
        utmMedium: sql`coalesce(${waitlistLeads.utmMedium}, excluded.utm_medium)`,
        utmCampaign: sql`coalesce(${waitlistLeads.utmCampaign}, excluded.utm_campaign)`,
        referrer: sql`coalesce(${waitlistLeads.referrer}, excluded.referrer)`,
        // Rotate the resume token so a returning visitor can continue.
        resumeTokenHash: sql`excluded.resume_token_hash`,
        resumeTokenExpiresAt: sql`excluded.resume_token_expires_at`,
        // Never regress a lead that is already further along.
        lastCompletedStep: sql`greatest(${waitlistLeads.lastCompletedStep}, 1)`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ id: waitlistLeads.id });

  const row = rows[0];
  if (!row) {
    throw new Error('upsertLeadByEmail returned no row');
  }
  return row;
}

/**
 * Change the address on the same authenticated lead. All ownership and delivery state is
 * reset atomically; preferences and progress remain attached to the lead. The unique email
 * index rejects collisions without exposing any other lead's data.
 */
export async function updateLeadEmail(input: {
  leadId: string;
  resumeToken: string;
  fullName?: string | null;
  originalEmail: string;
  normalizedEmail: string;
}): Promise<{ ok: boolean }> {
  const set: LeadSet = {
    originalEmail: input.originalEmail,
    normalizedEmail: input.normalizedEmail,
    emailVerificationStatus: 'unverified',
    emailVerificationSentAt: null,
    emailVerifiedAt: null,
    emailVerificationTokenHash: null,
    emailVerificationExpiresAt: null,
    emailVerificationAttempts: 0,
    emailVerificationLastSentAt: null,
    emailVerificationRequestId: null,
    emailVerificationRequestedAt: null,
    emailVerificationProviderMessageId: null,
    emailVerificationFailureAt: null,
    emailVerificationFailureCode: null,
    lastTransactionalEmailStatus: 'not_attempted',
    lastTransactionalEmailAt: null,
  };
  if (input.fullName && input.fullName.trim() !== '') {
    const normalizedFullName = normalizeFullName(input.fullName);
    if (normalizedFullName) set.fullName = normalizedFullName;
  }
  return updateLeadScoped(input.leadId, input.resumeToken, set);
}

/**
 * Apply a token-scoped update to a lead (plan §9). The resume-token hash and expiry are
 * folded into the WHERE clause, so verification and mutation are a single atomic statement
 * (no fetch-then-write TOCTOU gap). Returns `{ ok: false }` when the token is invalid or
 * expired — the row simply does not match and nothing is written.
 */
type LeadSet = Record<
  string,
  | SQL
  | string
  | number
  | boolean
  | Date
  | null
  | string[]
  | Record<string, string>
  | NeedProfileV1
>;

async function updateLeadScoped(
  leadId: string,
  resumeToken: string,
  set: LeadSet,
): Promise<{ ok: boolean }> {
  const db = getDb();
  const tokenHash = hashResumeToken(resumeToken);
  const rows = await db
    .update(waitlistLeads)
    .set({ ...set, updatedAt: sql`now()` })
    .where(
      and(
        eq(waitlistLeads.id, leadId),
        eq(waitlistLeads.resumeTokenHash, tokenHash),
        gt(waitlistLeads.resumeTokenExpiresAt, sql`now()`),
      ),
    )
    .returning({ id: waitlistLeads.id });
  return { ok: rows.length > 0 };
}

/** Step 2 — save role; email_only -> partial; never regress lastCompletedStep. */
export async function updateLeadRole(input: {
  leadId: string;
  resumeToken: string;
  role: Role;
}): Promise<{ ok: boolean }> {
  return updateLeadScoped(input.leadId, input.resumeToken, {
    role: input.role,
    lastCompletedStep: sql`greatest(${waitlistLeads.lastCompletedStep}, 2)`,
    lastMeaningfulStep: 'role',
    leadDataVersion: LEAD_DATA_VERSION,
    completionStatus: sql`case when ${waitlistLeads.completionStatus} = 'email_only' then 'partial'::completion_status else ${waitlistLeads.completionStatus} end`,
  });
}

/**
 * Step 3 — write current form state into the versioned, side-specific need profiles.
 * Legacy flat arrays/maps remain compatibility-only and receive no new writes.
 */
export async function updateLeadPreferences(input: {
  leadId: string;
  resumeToken: string;
  jobCategories?: string[];
  talentCategories?: string[];
  jobCategoryOthers?: Record<string, string>;
  talentCategoryOthers?: Record<string, string>;
}): Promise<{ ok: boolean }> {
  const set: LeadSet = {
    lastCompletedStep: sql`greatest(${waitlistLeads.lastCompletedStep}, 3)`,
    lastMeaningfulStep: 'needs',
    leadDataVersion: LEAD_DATA_VERSION,
    completionStatus: sql`case when ${waitlistLeads.completionStatus} = 'email_only' then 'partial'::completion_status else ${waitlistLeads.completionStatus} end`,
  };
  if (input.jobCategories !== undefined || input.jobCategoryOthers !== undefined) {
    const profile = buildNeedProfile(
      'seeker',
      input.jobCategories ?? [],
      input.jobCategoryOthers ?? {},
    );
    set.seekerNeeds = sql`case when ${waitlistLeads.role} in ('seeker', 'both') then ${JSON.stringify(profile)}::jsonb else ${waitlistLeads.seekerNeeds} end`;
  }
  if (input.talentCategories !== undefined || input.talentCategoryOthers !== undefined) {
    const profile = buildNeedProfile(
      'recruiter',
      input.talentCategories ?? [],
      input.talentCategoryOthers ?? {},
    );
    set.recruiterNeeds = sql`case when ${waitlistLeads.role} in ('recruiter', 'both') then ${JSON.stringify(profile)}::jsonb else ${waitlistLeads.recruiterNeeds} end`;
  }
  return updateLeadScoped(input.leadId, input.resumeToken, set);
}

/** Step 5 — richer context (partial update; keeps lead at least `partial`). */
export async function updateLeadContext(input: {
  leadId: string;
  resumeToken: string;
  workFormats?: string[];
  organisationTypes?: string[];
  platforms?: string[];
  niches?: string[];
  platformOther?: string | null;
  nicheOther?: string | null;
  experienceLevel?: string | null;
  availabilityToStart?: string | null;
  portfolioUrl?: string | null;
  hiringTimeline?: string | null;
  teamSize?: string | null;
  companyUrl?: string | null;
}): Promise<{ ok: boolean }> {
  const set: LeadSet = {
    lastCompletedStep: sql`greatest(${waitlistLeads.lastCompletedStep}, 5)`,
    lastMeaningfulStep: 'context',
    leadDataVersion: LEAD_DATA_VERSION,
    completionStatus: sql`case when ${waitlistLeads.completionStatus} = 'email_only' then 'partial'::completion_status else ${waitlistLeads.completionStatus} end`,
  };
  // Shared context.
  for (const field of ['platforms', 'niches', 'platformOther', 'nicheOther'] as const) {
    if (input[field] !== undefined) set[field] = input[field] as never;
  }
  // The current UI shows work formats to seeker/both and organisation type to
  // recruiter/both. Role-aware CASE expressions prevent a forged payload crossing sides.
  if (input.workFormats !== undefined) {
    set.workFormats = sql`case when ${waitlistLeads.role} in ('seeker', 'both') then ${sql.param(input.workFormats, waitlistLeads.workFormats)} else ${waitlistLeads.workFormats} end`;
  }
  if (input.organisationTypes !== undefined) {
    set.organisationTypes = sql`case when ${waitlistLeads.role} in ('recruiter', 'both') then ${sql.param(input.organisationTypes, waitlistLeads.organisationTypes)} else ${waitlistLeads.organisationTypes} end`;
  }
  // These detailed blocks are shown only on their single-role paths in the live form.
  for (const [field, column] of [
    ['experienceLevel', waitlistLeads.experienceLevel],
    ['availabilityToStart', waitlistLeads.availabilityToStart],
    ['portfolioUrl', waitlistLeads.portfolioUrl],
  ] as const) {
    if (input[field] !== undefined) {
      set[field] = sql`case when ${waitlistLeads.role} = 'seeker' then ${input[field]} else ${column} end`;
    }
  }
  for (const [field, column] of [
    ['hiringTimeline', waitlistLeads.hiringTimeline],
    ['teamSize', waitlistLeads.teamSize],
    ['companyUrl', waitlistLeads.companyUrl],
  ] as const) {
    if (input[field] !== undefined) {
      set[field] = sql`case when ${waitlistLeads.role} = 'recruiter' then ${input[field]} else ${column} end`;
    }
  }
  return updateLeadScoped(input.leadId, input.resumeToken, set);
}

/** Final step — save optional context and mark the current eight-step form complete. */
export async function updateLeadNote(input: {
  leadId: string;
  resumeToken: string;
  additionalNotes: string | null;
}): Promise<{ ok: boolean }> {
  return updateLeadScoped(input.leadId, input.resumeToken, {
    additionalNotes: input.additionalNotes,
    lastCompletedStep: sql`greatest(${waitlistLeads.lastCompletedStep}, 8)`,
    lastMeaningfulStep: 'completed',
    leadDataVersion: LEAD_DATA_VERSION,
    completionStatus: 'completed',
    completedAt: sql`coalesce(${waitlistLeads.completedAt}, now())`,
  });
}

/**
 * Step 6 — save or skip optional phone capture. Completion belongs to the final note step;
 * the removed promotional-consent columns are retained but never updated here.
 */
export async function updateLeadPhone(
  input:
    | { leadId: string; resumeToken: string; skipped: true }
    | {
        leadId: string;
        resumeToken: string;
        skipped: false;
        phoneE164: string;
        phoneCountryIso: string;
      },
): Promise<{ ok: boolean }> {
  const set: LeadSet = {
    lastCompletedStep: sql`greatest(${waitlistLeads.lastCompletedStep}, 6)`,
    lastMeaningfulStep: 'phone',
    leadDataVersion: LEAD_DATA_VERSION,
    completionStatus: sql`case when ${waitlistLeads.completionStatus} = 'email_only' then 'partial'::completion_status else ${waitlistLeads.completionStatus} end`,
  };

  if (!input.skipped) {
    set.phoneE164 = input.phoneE164;
    set.phoneCountryIso = input.phoneCountryIso;
    set.phoneVerificationStatus = 'unverified';
    set.phoneVerifiedAt = null;
    set.phoneVerificationTokenHash = null;
    set.phoneVerificationExpiresAt = null;
    set.phoneVerificationAttempts = 0;
  }

  return updateLeadScoped(input.leadId, input.resumeToken, set);
}

export interface ResumeState {
  leadId: string;
  fullName: string | null;
  emailMasked: string;
  role: Role | null;
  lastCompletedStep: number;
  hasPhone: boolean;
  jobCategories: string[];
  workFormats: string[];
  talentCategories: string[];
  organisationTypes: string[];
  jobCategoryOthers: Record<string, string>;
  talentCategoryOthers: Record<string, string>;
  platforms: string[];
  niches: string[];
  platformOther: string;
  nicheOther: string;
  experienceLevel: string | null;
  availabilityToStart: string | null;
  portfolioUrl: string;
  hiringTimeline: string | null;
  teamSize: string | null;
  companyUrl: string;
  additionalNotes: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastMeaningfulStep: string;
}

/**
 * Fetch just enough to resume a session (plan §12), scoped by the resume-token hash +
 * expiry. Returns a MASKED email only — never the raw email or phone number. Used by the
 * public resume action, so PII must not leak here.
 */
export async function selectResumeState(input: {
  leadId: string;
  resumeToken: string;
}): Promise<ResumeState | null> {
  const db = getDb();
  const tokenHash = hashResumeToken(input.resumeToken);
  const rows = await db
    .select({
      fullName: waitlistLeads.fullName,
      normalizedEmail: waitlistLeads.normalizedEmail,
      role: waitlistLeads.role,
      lastCompletedStep: waitlistLeads.lastCompletedStep,
      phoneE164: waitlistLeads.phoneE164,
      jobCategories: waitlistLeads.jobCategories,
      workFormats: waitlistLeads.workFormats,
      talentCategories: waitlistLeads.talentCategories,
      organisationTypes: waitlistLeads.organisationTypes,
      jobCategoryOthers: waitlistLeads.jobCategoryOthers,
      talentCategoryOthers: waitlistLeads.talentCategoryOthers,
      seekerNeeds: waitlistLeads.seekerNeeds,
      recruiterNeeds: waitlistLeads.recruiterNeeds,
      platforms: waitlistLeads.platforms,
      niches: waitlistLeads.niches,
      platformOther: waitlistLeads.platformOther,
      nicheOther: waitlistLeads.nicheOther,
      experienceLevel: waitlistLeads.experienceLevel,
      availabilityToStart: waitlistLeads.availabilityToStart,
      portfolioUrl: waitlistLeads.portfolioUrl,
      hiringTimeline: waitlistLeads.hiringTimeline,
      teamSize: waitlistLeads.teamSize,
      companyUrl: waitlistLeads.companyUrl,
      additionalNotes: waitlistLeads.additionalNotes,
      emailVerificationStatus: waitlistLeads.emailVerificationStatus,
      phoneVerificationStatus: waitlistLeads.phoneVerificationStatus,
      lastMeaningfulStep: waitlistLeads.lastMeaningfulStep,
    })
    .from(waitlistLeads)
    .where(
      and(
        eq(waitlistLeads.id, input.leadId),
        eq(waitlistLeads.resumeTokenHash, tokenHash),
        gt(waitlistLeads.resumeTokenExpiresAt, sql`now()`),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const seeker = needProfileToFormState(
    normalizeNeedProfile(
      row.seekerNeeds,
      'seeker',
      row.jobCategories,
      row.jobCategoryOthers ?? {},
    ),
  );
  const recruiter = needProfileToFormState(
    normalizeNeedProfile(
      row.recruiterNeeds,
      'recruiter',
      row.talentCategories,
      row.talentCategoryOthers ?? {},
    ),
  );

  return {
    leadId: input.leadId,
    fullName: row.fullName,
    emailMasked: maskEmail(row.normalizedEmail),
    role: row.role,
    lastCompletedStep: row.lastCompletedStep,
    hasPhone: row.phoneE164 !== null && row.phoneE164 !== '',
    jobCategories: seeker.selections,
    workFormats: row.workFormats,
    talentCategories: recruiter.selections,
    organisationTypes: row.organisationTypes,
    jobCategoryOthers: seeker.customResponses,
    talentCategoryOthers: recruiter.customResponses,
    platforms: row.platforms,
    niches: row.niches,
    platformOther: row.platformOther ?? '',
    nicheOther: row.nicheOther ?? '',
    experienceLevel: row.experienceLevel,
    availabilityToStart: row.availabilityToStart,
    portfolioUrl: row.portfolioUrl ?? '',
    hiringTimeline: row.hiringTimeline,
    teamSize: row.teamSize,
    companyUrl: row.companyUrl ?? '',
    additionalNotes: row.additionalNotes ?? '',
    emailVerified: row.emailVerificationStatus === 'verified',
    phoneVerified: row.phoneVerificationStatus === 'verified',
    lastMeaningfulStep: row.lastMeaningfulStep,
  };
}

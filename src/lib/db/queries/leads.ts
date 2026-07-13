import 'server-only';
import { sql, and, eq, gt, type SQL } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { waitlistLeads } from '@/lib/db/schema';
import { hashResumeToken } from '@/lib/tokens/lead-token';
import { maskEmail } from '@/lib/utils/mask';
import type { Role } from '@/types/waitlist';

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
  const rows = await db
    .insert(waitlistLeads)
    .values({
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
    })
    .onConflictDoUpdate({
      target: waitlistLeads.normalizedEmail,
      set: {
        originalEmail: sql`excluded.original_email`,
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
 * Apply a token-scoped update to a lead (plan §9). The resume-token hash and expiry are
 * folded into the WHERE clause, so verification and mutation are a single atomic statement
 * (no fetch-then-write TOCTOU gap). Returns `{ ok: false }` when the token is invalid or
 * expired — the row simply does not match and nothing is written.
 */
type LeadSet = Record<string, SQL | string | number | boolean | Date | null | string[]>;

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
    completionStatus: sql`case when ${waitlistLeads.completionStatus} = 'email_only' then 'partial'::completion_status else ${waitlistLeads.completionStatus} end`,
  });
}

/**
 * Step 3 — save interest selections (plan §11). Partial: only the fields provided are
 * written, so a debounced save of one field never clears another. Reaching step 3 keeps
 * the lead at least `partial`.
 */
export async function updateLeadPreferences(input: {
  leadId: string;
  resumeToken: string;
  jobCategories?: string[];
  workFormats?: string[];
  talentCategories?: string[];
  organisationTypes?: string[];
}): Promise<{ ok: boolean }> {
  const set: LeadSet = {
    lastCompletedStep: sql`greatest(${waitlistLeads.lastCompletedStep}, 3)`,
    completionStatus: sql`case when ${waitlistLeads.completionStatus} = 'email_only' then 'partial'::completion_status else ${waitlistLeads.completionStatus} end`,
  };
  if (input.jobCategories !== undefined) set.jobCategories = input.jobCategories;
  if (input.workFormats !== undefined) set.workFormats = input.workFormats;
  if (input.talentCategories !== undefined) set.talentCategories = input.talentCategories;
  if (input.organisationTypes !== undefined) {
    set.organisationTypes = input.organisationTypes;
  }
  return updateLeadScoped(input.leadId, input.resumeToken, set);
}

/**
 * Step 4 — save phone + WhatsApp consent, or skip (plan §11, §16). Either path marks the
 * lead `completed` (phone is optional). Consent is stored separately from the phone number;
 * the consent timestamp + copy version are stamped ONLY when consent is explicitly true.
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
        whatsappConsent: boolean;
        consentCopyVersion: string;
      },
): Promise<{ ok: boolean }> {
  const set: LeadSet = {
    lastCompletedStep: sql`greatest(${waitlistLeads.lastCompletedStep}, 4)`,
    completionStatus: 'completed',
    completedAt: sql`coalesce(${waitlistLeads.completedAt}, now())`,
  };

  if (!input.skipped) {
    set.phoneE164 = input.phoneE164;
    set.phoneCountryIso = input.phoneCountryIso;
    set.whatsappConsent = input.whatsappConsent;
    if (input.whatsappConsent) {
      set.whatsappConsentAt = sql`now()`;
      set.whatsappConsentCopyVersion = input.consentCopyVersion;
    }
  }

  return updateLeadScoped(input.leadId, input.resumeToken, set);
}

export interface ResumeState {
  leadId: string;
  emailMasked: string;
  role: Role | null;
  lastCompletedStep: number;
  hasPhone: boolean;
  jobCategories: string[];
  workFormats: string[];
  talentCategories: string[];
  organisationTypes: string[];
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
      normalizedEmail: waitlistLeads.normalizedEmail,
      role: waitlistLeads.role,
      lastCompletedStep: waitlistLeads.lastCompletedStep,
      phoneE164: waitlistLeads.phoneE164,
      jobCategories: waitlistLeads.jobCategories,
      workFormats: waitlistLeads.workFormats,
      talentCategories: waitlistLeads.talentCategories,
      organisationTypes: waitlistLeads.organisationTypes,
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

  return {
    leadId: input.leadId,
    emailMasked: maskEmail(row.normalizedEmail),
    role: row.role,
    lastCompletedStep: row.lastCompletedStep,
    hasPhone: row.phoneE164 !== null && row.phoneE164 !== '',
    jobCategories: row.jobCategories,
    workFormats: row.workFormats,
    talentCategories: row.talentCategories,
    organisationTypes: row.organisationTypes,
  };
}

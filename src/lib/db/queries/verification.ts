import 'server-only';
import { and, eq, gt, isNull, lt, lte, ne, or, sql, type SQL } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { waitlistLeads } from '@/lib/db/schema';
import { hashResumeToken } from '@/lib/tokens/lead-token';
import {
  codeHashMatches,
  hashCode,
  MAX_VERIFY_ATTEMPTS,
  RESEND_COOLDOWN_MS,
} from '@/lib/verification/code';

/** Token-scoped verification writes. A failed challenge never deletes its saved lead. */
type LeadSet = Record<string, SQL | string | number | boolean | Date | null>;

async function scopedUpdate(
  leadId: string,
  resumeToken: string,
  set: LeadSet,
  extraWhere: SQL[] = [],
): Promise<{ ok: boolean }> {
  const db = getDb();
  const rows = await db
    .update(waitlistLeads)
    .set({ ...set, updatedAt: sql`now()` })
    .where(
      and(
        eq(waitlistLeads.id, leadId),
        eq(waitlistLeads.resumeTokenHash, hashResumeToken(resumeToken)),
        gt(waitlistLeads.resumeTokenExpiresAt, sql`now()`),
        ...extraWhere,
      ),
    )
    .returning({ id: waitlistLeads.id });
  return { ok: rows.length > 0 };
}

export interface VerificationSnapshot {
  fullName: string | null;
  normalizedEmail: string;
  phoneE164: string | null;
  emailVerificationStatus: string;
  emailVerificationTokenHash: string | null;
  emailVerificationExpiresAt: Date | null;
  emailVerificationLastSentAt: Date | null;
  emailVerificationRequestedAt: Date | null;
  emailVerificationFailureCode: string | null;
  emailVerificationAttempts: number;
  lastTransactionalEmailStatus: string;
  phoneVerificationStatus: string;
  phoneVerificationTokenHash: string | null;
  phoneVerificationExpiresAt: Date | null;
  phoneVerificationLastSentAt: Date | null;
  phoneVerificationAttempts: number;
}

export async function getVerificationSnapshot(
  leadId: string,
  resumeToken: string,
): Promise<VerificationSnapshot | null> {
  const db = getDb();
  const rows = await db
    .select({
      fullName: waitlistLeads.fullName,
      normalizedEmail: waitlistLeads.normalizedEmail,
      phoneE164: waitlistLeads.phoneE164,
      emailVerificationStatus: waitlistLeads.emailVerificationStatus,
      emailVerificationTokenHash: waitlistLeads.emailVerificationTokenHash,
      emailVerificationExpiresAt: waitlistLeads.emailVerificationExpiresAt,
      emailVerificationLastSentAt: waitlistLeads.emailVerificationLastSentAt,
      emailVerificationRequestedAt: waitlistLeads.emailVerificationRequestedAt,
      emailVerificationFailureCode: waitlistLeads.emailVerificationFailureCode,
      emailVerificationAttempts: waitlistLeads.emailVerificationAttempts,
      lastTransactionalEmailStatus: waitlistLeads.lastTransactionalEmailStatus,
      phoneVerificationStatus: waitlistLeads.phoneVerificationStatus,
      phoneVerificationTokenHash: waitlistLeads.phoneVerificationTokenHash,
      phoneVerificationExpiresAt: waitlistLeads.phoneVerificationExpiresAt,
      phoneVerificationLastSentAt: waitlistLeads.phoneVerificationLastSentAt,
      phoneVerificationAttempts: waitlistLeads.phoneVerificationAttempts,
    })
    .from(waitlistLeads)
    .where(
      and(
        eq(waitlistLeads.id, leadId),
        eq(waitlistLeads.resumeTokenHash, hashResumeToken(resumeToken)),
        gt(waitlistLeads.resumeTokenExpiresAt, sql`now()`),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

// ── Email delivery lifecycle ────────────────────────────────────────────────

/**
 * Reserve one challenge before the provider call. The conditional request timestamp makes
 * duplicate/concurrent submissions collapse into one logical send.
 */
export function reserveEmailCode(input: {
  leadId: string;
  resumeToken: string;
  challengeId: string;
  codeHash: string;
  expiresAt: Date;
}) {
  const cooldownBoundary = new Date(Date.now() - RESEND_COOLDOWN_MS);
  const cooldownReady = or(
    isNull(waitlistLeads.emailVerificationRequestedAt),
    lte(waitlistLeads.emailVerificationRequestedAt, cooldownBoundary),
  );
  return scopedUpdate(
    input.leadId,
    input.resumeToken,
    {
      emailVerificationStatus: 'pending',
      emailVerificationTokenHash: input.codeHash,
      emailVerificationExpiresAt: input.expiresAt,
      emailVerificationAttempts: 0,
      emailVerificationRequestId: input.challengeId,
      emailVerificationRequestedAt: sql`now()`,
      emailVerificationProviderMessageId: null,
      emailVerificationFailureAt: null,
      emailVerificationFailureCode: null,
    },
    [
      ne(waitlistLeads.emailVerificationStatus, 'verified'),
      ...(cooldownReady ? [cooldownReady] : []),
    ],
  );
}

export function confirmEmailCodeDelivery(input: {
  leadId: string;
  resumeToken: string;
  challengeId: string;
  mode: 'accepted' | 'dev_logged' | 'uncertain';
  providerMessageId?: string;
  failureCode?: string;
}) {
  const accepted = input.mode === 'accepted';
  const uncertain = input.mode === 'uncertain';
  const set: LeadSet = {
    emailVerificationStatus: 'pending',
    emailVerificationLastSentAt: sql`now()`,
    emailVerificationProviderMessageId: input.providerMessageId ?? null,
    emailVerificationFailureAt: uncertain ? sql`now()` : null,
    emailVerificationFailureCode: input.failureCode ?? null,
    lastTransactionalEmailStatus: accepted
      ? 'sent'
      : uncertain
        ? 'failed'
        : 'skipped_disabled',
    lastTransactionalEmailAt: sql`now()`,
  };
  if (accepted) {
    set.emailVerificationSentAt = sql`coalesce(${waitlistLeads.emailVerificationSentAt}, now())`;
  }
  return scopedUpdate(
    input.leadId,
    input.resumeToken,
    set,
    [eq(waitlistLeads.emailVerificationRequestId, input.challengeId)],
  );
}

/** Known provider rejection: clear the unusable code and allow a deliberate retry. */
export function failEmailCodeDelivery(input: {
  leadId: string;
  resumeToken: string;
  challengeId: string;
  failureCode: string;
}) {
  return scopedUpdate(
    input.leadId,
    input.resumeToken,
    {
      emailVerificationStatus: 'unverified',
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
      emailVerificationAttempts: 0,
      emailVerificationRequestedAt: null,
      emailVerificationFailureAt: sql`now()`,
      emailVerificationFailureCode: input.failureCode,
      lastTransactionalEmailStatus: 'failed',
      lastTransactionalEmailAt: sql`now()`,
    },
    [eq(waitlistLeads.emailVerificationRequestId, input.challengeId)],
  );
}

export type VerifyResult =
  | 'verified'
  | 'invalid_code'
  | 'expired'
  | 'too_many_attempts'
  | 'not_pending'
  | 'invalid_token';

async function invalidateEmailChallenge(
  leadId: string,
  resumeToken: string,
  failureCode: 'expired' | 'too_many_attempts',
) {
  await scopedUpdate(
    leadId,
    resumeToken,
    {
      emailVerificationStatus: 'unverified',
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
      emailVerificationFailureAt: sql`now()`,
      emailVerificationFailureCode: failureCode,
    },
    [eq(waitlistLeads.emailVerificationStatus, 'pending')],
  );
}

export async function verifyEmailCode(
  leadId: string,
  resumeToken: string,
  code: string,
): Promise<VerifyResult> {
  const snapshot = await getVerificationSnapshot(leadId, resumeToken);
  if (!snapshot) return 'invalid_token';
  if (snapshot.emailVerificationStatus === 'verified') return 'verified';
  if (
    snapshot.emailVerificationStatus !== 'pending' ||
    !snapshot.emailVerificationTokenHash ||
    !snapshot.emailVerificationExpiresAt
  ) {
    return 'not_pending';
  }
  if (snapshot.emailVerificationExpiresAt.getTime() <= Date.now()) {
    await invalidateEmailChallenge(leadId, resumeToken, 'expired');
    return 'expired';
  }
  if (snapshot.emailVerificationAttempts >= MAX_VERIFY_ATTEMPTS) {
    await invalidateEmailChallenge(leadId, resumeToken, 'too_many_attempts');
    return 'too_many_attempts';
  }

  const candidate = hashCode(code, { leadId, channel: 'email' });
  if (codeHashMatches(candidate, snapshot.emailVerificationTokenHash)) {
    const db = getDb();
    const rows = await db
      .update(waitlistLeads)
      .set({
        emailVerificationStatus: 'verified',
        emailVerifiedAt: sql`coalesce(${waitlistLeads.emailVerifiedAt}, now())`,
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
        emailVerificationFailureAt: null,
        emailVerificationFailureCode: null,
        lastCompletedStep: sql`greatest(${waitlistLeads.lastCompletedStep}, 4)`,
        lastMeaningfulStep: sql`case when ${waitlistLeads.lastCompletedStep} < 4 then 'email_verification' else ${waitlistLeads.lastMeaningfulStep} end`,
        leadDataVersion: 2,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(waitlistLeads.id, leadId),
          eq(waitlistLeads.resumeTokenHash, hashResumeToken(resumeToken)),
          gt(waitlistLeads.resumeTokenExpiresAt, sql`now()`),
          eq(waitlistLeads.emailVerificationStatus, 'pending'),
          eq(waitlistLeads.emailVerificationTokenHash, snapshot.emailVerificationTokenHash),
          gt(waitlistLeads.emailVerificationExpiresAt, sql`now()`),
          lt(waitlistLeads.emailVerificationAttempts, MAX_VERIFY_ATTEMPTS),
        ),
      )
      .returning({ id: waitlistLeads.id });
    if (rows.length > 0) return 'verified';
    const latest = await getVerificationSnapshot(leadId, resumeToken);
    return latest?.emailVerificationStatus === 'verified' ? 'verified' : 'not_pending';
  }

  const db = getDb();
  const bumped = await db
    .update(waitlistLeads)
    .set({
      emailVerificationAttempts: sql`${waitlistLeads.emailVerificationAttempts} + 1`,
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(waitlistLeads.id, leadId),
        eq(waitlistLeads.resumeTokenHash, hashResumeToken(resumeToken)),
        gt(waitlistLeads.resumeTokenExpiresAt, sql`now()`),
        eq(waitlistLeads.emailVerificationStatus, 'pending'),
        eq(waitlistLeads.emailVerificationTokenHash, snapshot.emailVerificationTokenHash),
        lt(waitlistLeads.emailVerificationAttempts, MAX_VERIFY_ATTEMPTS),
      ),
    )
    .returning({ attempts: waitlistLeads.emailVerificationAttempts });
  const attempts = bumped[0]?.attempts;
  if (attempts === undefined) return 'not_pending';
  if (attempts >= MAX_VERIFY_ATTEMPTS) {
    await invalidateEmailChallenge(leadId, resumeToken, 'too_many_attempts');
    return 'too_many_attempts';
  }
  return 'invalid_code';
}

// ── Local/mock phone verification (no paid provider in this phase) ─────────

export function storePhoneCode(
  leadId: string,
  resumeToken: string,
  codeHash: string,
  expiresAt: Date,
) {
  return scopedUpdate(leadId, resumeToken, {
    phoneVerificationStatus: 'pending',
    phoneVerificationTokenHash: codeHash,
    phoneVerificationExpiresAt: expiresAt,
    phoneVerificationRequestedAt: sql`coalesce(${waitlistLeads.phoneVerificationRequestedAt}, now())`,
    phoneVerificationLastSentAt: sql`now()`,
    phoneVerificationAttempts: 0,
  });
}

async function invalidatePhoneChallenge(
  leadId: string,
  resumeToken: string,
) {
  await scopedUpdate(leadId, resumeToken, {
    phoneVerificationStatus: 'unverified',
    phoneVerificationTokenHash: null,
    phoneVerificationExpiresAt: null,
  });
}

export async function verifyPhoneCode(
  leadId: string,
  resumeToken: string,
  code: string,
): Promise<VerifyResult> {
  const snapshot = await getVerificationSnapshot(leadId, resumeToken);
  if (!snapshot) return 'invalid_token';
  if (snapshot.phoneVerificationStatus === 'verified') return 'verified';
  if (
    snapshot.phoneVerificationStatus !== 'pending' ||
    !snapshot.phoneVerificationTokenHash ||
    !snapshot.phoneVerificationExpiresAt
  ) {
    return 'not_pending';
  }
  if (snapshot.phoneVerificationExpiresAt.getTime() <= Date.now()) {
    await invalidatePhoneChallenge(leadId, resumeToken);
    return 'expired';
  }
  if (snapshot.phoneVerificationAttempts >= MAX_VERIFY_ATTEMPTS) {
    await invalidatePhoneChallenge(leadId, resumeToken);
    return 'too_many_attempts';
  }

  const candidate = hashCode(code, { leadId, channel: 'phone' });
  if (codeHashMatches(candidate, snapshot.phoneVerificationTokenHash)) {
    const result = await scopedUpdate(
      leadId,
      resumeToken,
      {
        phoneVerificationStatus: 'verified',
        phoneVerifiedAt: sql`coalesce(${waitlistLeads.phoneVerifiedAt}, now())`,
        phoneVerificationTokenHash: null,
        phoneVerificationExpiresAt: null,
        lastCompletedStep: sql`greatest(${waitlistLeads.lastCompletedStep}, 7)`,
        lastMeaningfulStep: sql`case when ${waitlistLeads.lastCompletedStep} < 7 then 'phone_verification' else ${waitlistLeads.lastMeaningfulStep} end`,
        leadDataVersion: 2,
      },
      [
        eq(waitlistLeads.phoneVerificationStatus, 'pending'),
        eq(waitlistLeads.phoneVerificationTokenHash, snapshot.phoneVerificationTokenHash),
      ],
    );
    return result.ok ? 'verified' : 'not_pending';
  }

  const db = getDb();
  const bumped = await db
    .update(waitlistLeads)
    .set({
      phoneVerificationAttempts: sql`${waitlistLeads.phoneVerificationAttempts} + 1`,
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(waitlistLeads.id, leadId),
        eq(waitlistLeads.resumeTokenHash, hashResumeToken(resumeToken)),
        eq(waitlistLeads.phoneVerificationStatus, 'pending'),
        eq(waitlistLeads.phoneVerificationTokenHash, snapshot.phoneVerificationTokenHash),
        lt(waitlistLeads.phoneVerificationAttempts, MAX_VERIFY_ATTEMPTS),
      ),
    )
    .returning({ attempts: waitlistLeads.phoneVerificationAttempts });
  if ((bumped[0]?.attempts ?? 0) >= MAX_VERIFY_ATTEMPTS) {
    await invalidatePhoneChallenge(leadId, resumeToken);
    return 'too_many_attempts';
  }
  return bumped.length > 0 ? 'invalid_code' : 'not_pending';
}

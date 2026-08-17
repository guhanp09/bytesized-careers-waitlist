import { afterAll, beforeEach, describe, it, expect } from 'vitest';
import { eq, like } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { waitlistLeads } from '@/lib/db/schema';
import {
  upsertLeadByEmail,
  updateLeadRole,
  updateLeadPreferences,
  updateLeadPhone,
  updateLeadEmail,
  updateLeadContext,
  updateLeadNote,
  selectResumeState,
  updateLeadLastTouch,
} from '@/lib/db/queries/leads';
import {
  getWaitlistSummary,
  getNeedBreakdown,
  getDashboardAnalytics,
  listLeads,
  listLeadsForExport,
  deleteLeadById,
} from '@/lib/db/queries/admin';
import { toCsv } from '@/lib/admin/csv';
import {
  reserveEmailCode,
  confirmEmailCodeDelivery,
  failEmailCodeDelivery,
  verifyEmailCode,
  storePhoneCode,
  verifyPhoneCode,
} from '@/lib/db/queries/verification';
import {
  generateChallengeId,
  generateCode,
  hashCode,
  codeExpiry,
  MAX_VERIFY_ATTEMPTS,
} from '@/lib/verification/code';
import {
  generateResumeToken,
  hashResumeToken,
  resumeTokenExpiry,
} from '@/lib/tokens/lead-token';
import { normalizeEmail } from '@/lib/validation/email';
import type { AttributionTouchV1 } from '@/lib/attribution/campaign';

const db = getDb();
const RUN_ID = crypto.randomUUID().slice(0, 8);

function emailFor(email: string): string {
  const at = email.lastIndexOf('@');
  return `${email.slice(0, at)}+${RUN_ID}${email.slice(at)}`;
}

async function createLead(
  email: string,
  attribution: { utmSource?: string; source?: string } = {},
  fullName?: string | null,
) {
  const scopedEmail = emailFor(email);
  const token = generateResumeToken();
  const { id } = await upsertLeadByEmail({
    fullName,
    originalEmail: scopedEmail,
    normalizedEmail: normalizeEmail(scopedEmail),
    resumeTokenHash: hashResumeToken(token),
    resumeTokenExpiresAt: resumeTokenExpiry(),
    utmSource: attribution.utmSource,
    source: attribution.source,
  });
  return { id, token, email: scopedEmail };
}

async function getLead(id: string) {
  const rows = await db.select().from(waitlistLeads).where(eq(waitlistLeads.id, id));
  return rows[0]!;
}

function campaignTouch(
  source: string,
  campaign: string,
  capturedAt: string,
): AttributionTouchV1 {
  return {
    version: 1,
    kind: 'campaign',
    source,
    medium: 'paid-social',
    campaign,
    landingPath: '/early-access',
    capturedAt,
  };
}

async function stageEmailCode(
  id: string,
  token: string,
  code: string,
  expiresAt = codeExpiry(),
) {
  const challengeId = generateChallengeId();
  await reserveEmailCode({
    leadId: id,
    resumeToken: token,
    challengeId,
    codeHash: hashCode(code, { leadId: id, channel: 'email' }),
    expiresAt,
  });
  await confirmEmailCodeDelivery({
    leadId: id,
    resumeToken: token,
    challengeId,
    mode: 'dev_logged',
  });
}

async function removeCurrentRunRows() {
  await db
    .delete(waitlistLeads)
    .where(like(waitlistLeads.normalizedEmail, `%+${RUN_ID}@%`));
}

beforeEach(removeCurrentRunRows);
afterAll(async () => {
  // Remove only rows created by this test process. Pre-existing local test data is never
  // truncated or touched.
  await removeCurrentRunRows();
});

describe('upsertLeadByEmail — idempotency', () => {
  it('updates the existing row on repeat submissions (no duplicate)', async () => {
    const first = await createLead('dup@example.com', { utmSource: 'first' });
    const second = await createLead('dup@example.com', { utmSource: 'second' });

    expect(second.id).toBe(first.id);

    const rows = await db
      .select()
      .from(waitlistLeads)
      .where(eq(waitlistLeads.normalizedEmail, emailFor('dup@example.com')));
    expect(rows).toHaveLength(1);
  });

  it('preserves first-touch attribution', async () => {
    const { id } = await createLead('attrib@example.com', { utmSource: 'first' });
    await createLead('attrib@example.com', { utmSource: 'second' });
    const lead = await getLead(id);
    expect(lead.utmSource).toBe('first');
  });

  it('keeps structured first touch immutable and updates last touch only from current explicit attribution', async () => {
    const scopedEmail = emailFor('structured-attrib@example.com');
    const firstToken = generateResumeToken();
    const reddit = campaignTouch('reddit', 'editor-feedback', '2026-07-17T09:00:00.000Z');
    const first = await upsertLeadByEmail({
      originalEmail: scopedEmail,
      normalizedEmail: scopedEmail,
      resumeTokenHash: hashResumeToken(firstToken),
      resumeTokenExpiresAt: resumeTokenExpiry(),
      attribution: { version: 1, firstTouch: reddit, lastTouch: reddit, currentTouch: reddit },
    });

    const meta = campaignTouch('meta', 'talent-india', '2026-07-17T10:00:00.000Z');
    const secondToken = generateResumeToken();
    const second = await upsertLeadByEmail({
      originalEmail: scopedEmail,
      normalizedEmail: scopedEmail,
      resumeTokenHash: hashResumeToken(secondToken),
      resumeTokenExpiresAt: resumeTokenExpiry(),
      attribution: { version: 1, firstTouch: meta, lastTouch: meta, currentTouch: meta },
    });
    expect(second.id).toBe(first.id);

    let lead = await getLead(first.id);
    expect(lead.firstTouchAttribution).toEqual(reddit);
    expect(lead.lastTouchAttribution).toEqual(meta);

    const direct = {
      version: 1 as const,
      kind: 'direct' as const,
      source: 'direct',
      landingPath: '/early-access' as const,
      capturedAt: '2026-07-17T11:00:00.000Z',
    };
    const thirdToken = generateResumeToken();
    await upsertLeadByEmail({
      originalEmail: scopedEmail,
      normalizedEmail: scopedEmail,
      resumeTokenHash: hashResumeToken(thirdToken),
      resumeTokenExpiresAt: resumeTokenExpiry(),
      attribution: { version: 1, firstTouch: direct, lastTouch: direct },
    });
    lead = await getLead(first.id);
    expect(lead.firstTouchAttribution).toEqual(reddit);
    expect(lead.lastTouchAttribution).toEqual(meta);

    const linkedin = campaignTouch('linkedin', 'hirer-outbound', '2026-07-17T12:00:00.000Z');
    expect(
      await updateLeadLastTouch({ leadId: first.id, resumeToken: thirdToken, touch: linkedin }),
    ).toEqual({ ok: true });
    lead = await getLead(first.id);
    expect(lead.firstTouchAttribution).toEqual(reddit);
    expect(lead.lastTouchAttribution).toEqual(linkedin);

    await stageEmailCode(first.id, thirdToken, '456789');
    expect(await verifyEmailCode(first.id, thirdToken, '456789')).toBe('verified');
    lead = await getLead(first.id);
    expect(lead.firstTouchAttribution).toEqual(reddit);
    expect(lead.lastTouchAttribution).toEqual(linkedin);
  });

  it('keeps historical rows valid with null structured attribution', async () => {
    const { id } = await createLead('legacy-attribution@example.com');
    const lead = await getLead(id);
    expect(lead.firstTouchAttribution).toBeNull();
    expect(lead.lastTouchAttribution).toBeNull();
  });

  it('stores new leads as unverified and email_only', async () => {
    const { id } = await createLead('fresh@example.com');
    const lead = await getLead(id);
    expect(lead.emailVerificationStatus).toBe('unverified');
    expect(lead.completionStatus).toBe('email_only');
    expect(lead.lastCompletedStep).toBe(1);
    expect(lead.phoneWhatsappConsent).toBe(false);
    expect(lead.phoneSmsConsent).toBe(false);
    expect(lead.phoneVoiceConsent).toBe(false);
    expect(lead.phoneConsentRecordedAt).toBeNull();
  });

  it('normalizes names and never lets a blank repeat erase one', async () => {
    const first = await createLead('named@example.com', {}, '  Zoë   O’Connor  ');
    await createLead('named@example.com', {}, '   ');
    const lead = await getLead(first.id);
    expect(lead.fullName).toBe('Zoë O’Connor');
  });
});

describe('token-scoped updates', () => {
  it('updateLeadRole succeeds with a valid token and moves to partial', async () => {
    const { id, token } = await createLead('role@example.com');
    const res = await updateLeadRole({ leadId: id, resumeToken: token, role: 'both' });
    expect(res.ok).toBe(true);
    const lead = await getLead(id);
    expect(lead.role).toBe('both');
    expect(lead.completionStatus).toBe('partial');
    expect(lead.lastCompletedStep).toBe(2);
  });

  it('updateLeadRole fails and writes nothing with an invalid token', async () => {
    const { id } = await createLead('role2@example.com');
    const res = await updateLeadRole({
      leadId: id,
      resumeToken: 'wrong-token',
      role: 'seeker',
    });
    expect(res.ok).toBe(false);
    const lead = await getLead(id);
    expect(lead.role).toBeNull();
  });

  it('updateLeadPreferences performs a partial update (does not clear other fields)', async () => {
    const { id, token } = await createLead('prefs@example.com');
    await updateLeadRole({ leadId: id, resumeToken: token, role: 'both' });
    await updateLeadPreferences({
      leadId: id,
      resumeToken: token,
      jobCategories: ['video_editing'],
    });
    await updateLeadPreferences({
      leadId: id,
      resumeToken: token,
      talentCategories: ['content_strategists'],
    });
    const lead = await getLead(id);
    expect(lead.seekerNeeds.groups[0]?.selections).toEqual(['video_editing']);
    expect(lead.recruiterNeeds.groups[0]?.selections).toEqual(['content_strategists']);
    expect(lead.jobCategories).toEqual([]); // compatibility column is no longer written
    expect(lead.talentCategories).toEqual([]);
    expect(lead.lastCompletedStep).toBe(3);
  });

  it('persists current seeker, recruiter, shared context, and final free text', async () => {
    const seeker = await createLead('context-seeker@example.com');
    await updateLeadRole({ leadId: seeker.id, resumeToken: seeker.token, role: 'seeker' });
    await updateLeadContext({
      leadId: seeker.id,
      resumeToken: seeker.token,
      workFormats: ['remote', 'freelance'],
      platforms: ['youtube', 'other'],
      platformOther: 'Nebula',
      niches: ['tech', 'other'],
      nicheOther: 'Science documentaries',
      experienceLevel: 'mid',
      availabilityToStart: 'within_2_weeks',
      portfolioUrl: 'https://example.com/portfolio',
    });
    await updateLeadNote({
      leadId: seeker.id,
      resumeToken: seeker.token,
      additionalNotes: 'Interested in research-heavy long-form work.',
    });
    const seekerRow = await getLead(seeker.id);
    expect(seekerRow.workFormats).toEqual(['remote', 'freelance']);
    expect(seekerRow.platformOther).toBe('Nebula');
    expect(seekerRow.nicheOther).toBe('Science documentaries');
    expect(seekerRow.experienceLevel).toBe('mid');
    expect(seekerRow.availabilityToStart).toBe('within_2_weeks');
    expect(seekerRow.portfolioUrl).toBe('https://example.com/portfolio');
    expect(seekerRow.additionalNotes).toBe('Interested in research-heavy long-form work.');
    expect(seekerRow.completionStatus).toBe('completed');

    const recruiter = await createLead('context-recruiter@example.com');
    await updateLeadRole({ leadId: recruiter.id, resumeToken: recruiter.token, role: 'recruiter' });
    await updateLeadContext({
      leadId: recruiter.id,
      resumeToken: recruiter.token,
      organisationTypes: ['creator_agency'],
      platforms: ['youtube'],
      niches: ['finance'],
      hiringTimeline: 'this_month',
      teamSize: 'small',
      companyUrl: 'https://example.com/company',
    });
    const recruiterRow = await getLead(recruiter.id);
    expect(recruiterRow.organisationTypes).toEqual(['creator_agency']);
    expect(recruiterRow.hiringTimeline).toBe('this_month');
    expect(recruiterRow.teamSize).toBe('small');
    expect(recruiterRow.companyUrl).toBe('https://example.com/company');
  });
});

describe('current funnel completion', () => {
  it('phone skip stays partial until the final step succeeds', async () => {
    const { id, token } = await createLead('skip@example.com');
    const res = await updateLeadPhone({ leadId: id, resumeToken: token, skipped: true });
    expect(res.ok).toBe(true);
    let lead = await getLead(id);
    expect(lead.completionStatus).toBe('partial');
    expect(lead.completedAt).toBeNull();
    expect(lead.lastCompletedStep).toBe(6);
    expect(lead.phoneE164).toBeNull();
    expect(lead.phoneWhatsappConsent).toBe(false);
    expect(lead.phoneSmsConsent).toBe(false);
    expect(lead.phoneVoiceConsent).toBe(false);
    expect(lead.phoneConsentSource).toBe('waitlist_phone_step');
    await updateLeadNote({ leadId: id, resumeToken: token, additionalNotes: null });
    lead = await getLead(id);
    expect(lead.completionStatus).toBe('completed');
    expect(lead.completedAt).not.toBeNull();
    expect(lead.lastMeaningfulStep).toBe('completed');
  });

  it('stores independent channel choices without writing obsolete WhatsApp consent', async () => {
    const { id, token } = await createLead('phone@example.com');
    await updateLeadPhone({
      leadId: id,
      resumeToken: token,
      skipped: false,
      phoneE164: '+447400123456',
      phoneCountryIso: 'GB',
      whatsappConsent: true,
      smsConsent: false,
      voiceConsent: true,
    });
    const lead = await getLead(id);
    expect(lead.phoneE164).toBe('+447400123456');
    expect(lead.phoneWhatsappConsent).toBe(true);
    expect(lead.phoneSmsConsent).toBe(false);
    expect(lead.phoneVoiceConsent).toBe(true);
    expect(lead.phoneConsentVersion).toBe('2026-07-17.v1');
    expect(lead.phoneConsentRecordedAt).not.toBeNull();
    expect(lead.phoneConsentSource).toBe('waitlist_phone_step');
    expect(lead.whatsappConsent).toBe(false);
    expect(lead.whatsappConsentAt).toBeNull();
    expect(lead.whatsappConsentCopyVersion).toBeNull();

    for (const choices of [
      { whatsappConsent: true, smsConsent: false, voiceConsent: false },
      { whatsappConsent: false, smsConsent: true, voiceConsent: false },
      { whatsappConsent: false, smsConsent: false, voiceConsent: true },
      { whatsappConsent: true, smsConsent: true, voiceConsent: true },
      { whatsappConsent: false, smsConsent: false, voiceConsent: false },
    ]) {
      await updateLeadPhone({
        leadId: id,
        resumeToken: token,
        skipped: false,
        phoneE164: '+447400123456',
        phoneCountryIso: 'GB',
        ...choices,
      });
      const updated = await getLead(id);
      expect(updated.id).toBe(id);
      expect(updated.phoneWhatsappConsent).toBe(choices.whatsappConsent);
      expect(updated.phoneSmsConsent).toBe(choices.smsConsent);
      expect(updated.phoneVoiceConsent).toBe(choices.voiceConsent);
      expect(updated.phoneConsentVersion).toBe('2026-07-17.v1');
      expect(updated.phoneConsentSource).toBe('waitlist_phone_step');
    }

    await updateLeadPhone({ leadId: id, resumeToken: token, skipped: true });
    const cleared = await getLead(id);
    expect(cleared.phoneE164).toBeNull();
    expect(cleared.phoneWhatsappConsent).toBe(false);
    expect(cleared.phoneSmsConsent).toBe(false);
    expect(cleared.phoneVoiceConsent).toBe(false);
  });
});

describe('selectResumeState', () => {
  it('returns masked email and accurately restores token-authorized phone choices', async () => {
    const { id, token } = await createLead('resume@example.com', {}, 'Rina Das');
    await updateLeadRole({ leadId: id, resumeToken: token, role: 'seeker' });
    await updateLeadPreferences({
      leadId: id,
      resumeToken: token,
      jobCategories: ['content_strategy'],
    });
    await updateLeadPhone({
      leadId: id,
      resumeToken: token,
      skipped: false,
      phoneE164: '+919900000001',
      phoneCountryIso: 'IN',
      whatsappConsent: false,
      smsConsent: true,
      voiceConsent: false,
    });
    const state = await selectResumeState({ leadId: id, resumeToken: token });
    expect(state).not.toBeNull();
    expect(state?.emailMasked).not.toContain(emailFor('resume@example.com'));
    expect(state?.fullName).toBe('Rina Das');
    expect(state?.role).toBe('seeker');
    expect(state?.jobCategories).toEqual(['content_strategy']);
    expect(state?.lastCompletedStep).toBe(6);
    expect(state?.phoneE164).toBe('+919900000001');
    expect(state?.phoneCountryIso).toBe('IN');
    expect(state?.whatsappConsent).toBe(false);
    expect(state?.smsConsent).toBe(true);
    expect(state?.voiceConsent).toBe(false);
  });

  it('returns null for an invalid token', async () => {
    const { id } = await createLead('resume2@example.com');
    const state = await selectResumeState({ leadId: id, resumeToken: 'nope' });
    expect(state).toBeNull();
  });
});

describe('admin queries', () => {
  async function seed() {
    const a = await createLead('a@example.com', { utmSource: 'twitter' }, 'Asha Kapoor');
    await updateLeadRole({ leadId: a.id, resumeToken: a.token, role: 'seeker' });
    await updateLeadPreferences({
      leadId: a.id,
      resumeToken: a.token,
      jobCategories: ['video_editing', 'content_strategy', 'writing_research_other'],
      jobCategoryOthers: { writing_research: 'Documentary fact-checking' },
    });
    await updateLeadPhone({
      leadId: a.id,
      resumeToken: a.token,
      skipped: false,
      phoneE164: '+447400123456',
      phoneCountryIso: 'GB',
      whatsappConsent: false,
      smsConsent: false,
      voiceConsent: false,
    });
    await updateLeadNote({
      leadId: a.id,
      resumeToken: a.token,
      additionalNotes: 'Looking for ongoing creator work.',
    });

    const b = await createLead('b@example.com', { utmSource: 'twitter' }, 'Basil Wong');
    await updateLeadRole({ leadId: b.id, resumeToken: b.token, role: 'recruiter' });
    await updateLeadPreferences({
      leadId: b.id,
      resumeToken: b.token,
      talentCategories: ['video_editors'],
    });

    await createLead('c@example.com', { utmSource: 'newsletter' }, 'Cleo Martins'); // email_only
  }

  it('summary counts reflect the data', async () => {
    const before = await getWaitlistSummary();
    await seed();
    const summary = await getWaitlistSummary();
    expect(summary.total - before.total).toBe(3);
    expect(summary.emailOnly - before.emailOnly).toBe(1);
    expect(summary.completed - before.completed).toBe(1);
    expect(summary.seekers - before.seekers).toBe(1);
    expect(summary.recruiters - before.recruiters).toBe(1);
    expect(summary.verified - before.verified).toBe(0);
    expect(summary.phonePresent - before.phonePresent).toBe(1);
    expect(summary.withAdditionalContext - before.withAdditionalContext).toBe(1);
    expect(summary.new7Days - before.new7Days).toBe(3);
  });

  it('overview analytics match role, funnel, demand, source, and IST trend data', async () => {
    const before = await getDashboardAnalytics('30');
    await seed();
    const after = await getDashboardAnalytics('30');
    const counts = (rows: { key: string; count: number }[]) => Object.fromEntries(rows.map((row) => [row.key, row.count]));
    const beforeRoles = counts(before.roleDistribution);
    const afterRoles = counts(after.roleDistribution);
    expect((afterRoles.seeker ?? 0) - (beforeRoles.seeker ?? 0)).toBe(1);
    expect((afterRoles.recruiter ?? 0) - (beforeRoles.recruiter ?? 0)).toBe(1);

    const beforeFunnel = counts(before.completionFunnel);
    const afterFunnel = counts(after.completionFunnel);
    expect((afterFunnel.email_captured ?? 0) - (beforeFunnel.email_captured ?? 0)).toBe(3);
    expect((afterFunnel.core_preferences ?? 0) - (beforeFunnel.core_preferences ?? 0)).toBe(2);
    expect((afterFunnel.completed ?? 0) - (beforeFunnel.completed ?? 0)).toBe(1);

    const beforeSeeker = counts(before.seekerSelections);
    const afterSeeker = counts(after.seekerSelections);
    const beforeRecruiter = counts(before.recruiterSelections);
    const afterRecruiter = counts(after.recruiterSelections);
    expect((afterSeeker.video_editing ?? 0) - (beforeSeeker.video_editing ?? 0)).toBe(1);
    expect((afterRecruiter.video_editors ?? 0) - (beforeRecruiter.video_editors ?? 0)).toBe(1);

    const beforeSources = counts(before.sources);
    const afterSources = counts(after.sources);
    expect((afterSources.twitter ?? 0) - (beforeSources.twitter ?? 0)).toBe(2);
    const performance = (rows: { source: string; savedEmailCount: number }[]) =>
      Object.fromEntries(rows.map((row) => [row.source, row.savedEmailCount]));
    const beforeFirstPerformance = performance(before.firstTouchPerformance);
    const afterFirstPerformance = performance(after.firstTouchPerformance);
    expect((afterFirstPerformance.twitter ?? 0) - (beforeFirstPerformance.twitter ?? 0)).toBe(2);
    const beforeLastPerformance = performance(before.lastTouchPerformance);
    const afterLastPerformance = performance(after.lastTouchPerformance);
    expect(
      (afterLastPerformance['Legacy / Unknown'] ?? 0) -
        (beforeLastPerformance['Legacy / Unknown'] ?? 0),
    ).toBe(3);
    expect(after.trend.reduce((sum, row) => sum + row.total, 0) - before.trend.reduce((sum, row) => sum + row.total, 0)).toBe(3);
  }, 15_000);

  it('need breakdowns keep seeker and recruiter selections separate', async () => {
    const beforeSeeker = Object.fromEntries((await getNeedBreakdown('seeker')).map((r) => [r.key, r.count]));
    const beforeRecruiter = Object.fromEntries((await getNeedBreakdown('recruiter')).map((r) => [r.key, r.count]));
    await seed();
    const seeker = Object.fromEntries((await getNeedBreakdown('seeker')).map((r) => [r.key, r.count]));
    const recruiter = Object.fromEntries((await getNeedBreakdown('recruiter')).map((r) => [r.key, r.count]));
    expect((seeker.video_editing ?? 0) - (beforeSeeker.video_editing ?? 0)).toBe(1);
    expect((seeker.content_strategy ?? 0) - (beforeSeeker.content_strategy ?? 0)).toBe(1);
    expect((recruiter.video_editors ?? 0) - (beforeRecruiter.video_editors ?? 0)).toBe(1);
    expect((recruiter.video_editing ?? 0) - (beforeRecruiter.video_editing ?? 0)).toBe(0);
  });

  it('listLeads applies the role filter', async () => {
    await seed();
    const { rows, total } = await listLeads({ role: 'seeker', q: RUN_ID });
    expect(total).toBe(1);
    expect(rows[0]?.originalEmail).toBe(emailFor('a@example.com'));
  });

  it('listLeads applies separate seeker and recruiter need filters', async () => {
    await seed();
    expect((await listLeads({ seekerNeed: 'video_editing', q: RUN_ID })).total).toBe(1);
    expect((await listLeads({ recruiterNeed: 'video_editors', q: RUN_ID })).total).toBe(1);
  });

  it('searches structured needs, custom responses, comments, and phone locally', async () => {
    await seed();
    expect((await listLeads({ q: 'video_editing', source: 'twitter' })).total).toBeGreaterThanOrEqual(1);
    expect((await listLeads({ q: 'Documentary fact-checking', source: 'twitter' })).total).toBeGreaterThanOrEqual(1);
    expect((await listLeads({ q: 'ongoing creator work', source: 'twitter' })).total).toBeGreaterThanOrEqual(1);
    expect((await listLeads({ q: '+447400123456', source: 'twitter' })).total).toBeGreaterThanOrEqual(1);
    expect((await listLeads({ q: 'asha', source: 'twitter' })).total).toBeGreaterThanOrEqual(1);
  });

  it('sorts named leads alphabetically while keeping legacy names at the end', async () => {
    await seed();
    const asc = await listLeads({ q: RUN_ID, sort: 'name_asc' });
    expect(asc.rows.map((row) => row.fullName)).toEqual(['Asha Kapoor', 'Basil Wong', 'Cleo Martins']);
    const desc = await listLeads({ q: RUN_ID, sort: 'name_desc' });
    expect(desc.rows.map((row) => row.fullName)).toEqual(['Cleo Martins', 'Basil Wong', 'Asha Kapoor']);
  });

  it('applies joined and updated date filters at IST boundaries', async () => {
    const beforeMidnight = await createLead('before-ist-midnight@example.com');
    const atMidnight = await createLead('at-ist-midnight@example.com');
    await db.update(waitlistLeads).set({
      createdAt: new Date('2026-07-14T18:29:59Z'),
      updatedAt: new Date('2026-07-16T18:29:59Z'),
    }).where(eq(waitlistLeads.id, beforeMidnight.id));
    await db.update(waitlistLeads).set({
      createdAt: new Date('2026-07-14T18:30:00Z'),
      updatedAt: new Date('2026-07-16T18:30:00Z'),
    }).where(eq(waitlistLeads.id, atMidnight.id));

    const joined = await listLeads({ q: RUN_ID, dateFrom: '2026-07-15', dateTo: '2026-07-15' });
    expect(joined.rows.some((row) => row.id === atMidnight.id)).toBe(true);
    expect(joined.rows.some((row) => row.id === beforeMidnight.id)).toBe(false);

    const updated = await listLeads({ q: RUN_ID, updatedFrom: '2026-07-17' });
    expect(updated.rows.some((row) => row.id === atMidnight.id)).toBe(true);
    expect(updated.rows.some((row) => row.id === beforeMidnight.id)).toBe(false);
  });

  it('combines contactability, custom-context, source, and funnel filters', async () => {
    await seed();
    const custom = await listLeads({
      role: 'seeker',
      completion: 'completed',
      phonePresent: true,
      hasCustomResponse: true,
      hasAdditionalContext: true,
      source: 'twitter',
      q: RUN_ID,
    });
    expect(custom.total).toBe(1);
    expect(custom.rows[0]?.seekerNeeds.groups.find((group) => group.id === 'writing_research')?.customResponse).toBe('Documentary fact-checking');

    const absentPhone = await listLeads({ phonePresent: false, q: RUN_ID });
    expect(absentPhone.total).toBe(2);
  });

  it('filters structured first and last touch without confusing the two models', async () => {
    const scopedEmail = emailFor('attribution-filter@example.com');
    const token = generateResumeToken();
    const reddit = campaignTouch('reddit', 'community-feedback', '2026-07-17T09:00:00.000Z');
    const meta = campaignTouch('meta', 'paid-talent', '2026-07-17T10:00:00.000Z');
    const { id } = await upsertLeadByEmail({
      originalEmail: scopedEmail,
      normalizedEmail: scopedEmail,
      resumeTokenHash: hashResumeToken(token),
      resumeTokenExpiresAt: resumeTokenExpiry(),
      attribution: { version: 1, firstTouch: reddit, lastTouch: reddit, currentTouch: reddit },
    });
    await updateLeadLastTouch({ leadId: id, resumeToken: token, touch: meta });

    const first = await listLeads({
      attributionModel: 'first',
      source: 'reddit',
      medium: 'paid-social',
      utmCampaign: 'community-feedback',
    });
    const last = await listLeads({
      attributionModel: 'last',
      source: 'meta',
      medium: 'paid-social',
      utmCampaign: 'paid-talent',
    });
    const wrongModel = await listLeads({ attributionModel: 'first', source: 'meta' });
    expect(first.rows.some((row) => row.id === id)).toBe(true);
    expect(last.rows.some((row) => row.id === id)).toBe(true);
    expect(wrongModel.rows.some((row) => row.id === id)).toBe(false);
  });

  it('CSV export reflects filters and includes verification status', async () => {
    await seed();
    const rows = await listLeadsForExport({ completion: 'completed', q: RUN_ID });
    const csv = toCsv(rows);
    expect(csv).toContain('Email Verification Status');
    expect(csv).toContain(emailFor('a@example.com'));
    expect(csv).not.toContain(emailFor('c@example.com')); // filtered out (email_only)
    expect(csv).toContain('unverified');
  });
});

describe('verification (local mock, save-first)', () => {
  it('email stays unverified until a valid code; abandoning keeps the lead', async () => {
    const { id, token } = await createLead('verify@example.com');
    let lead = await getLead(id);
    expect(lead.emailVerificationStatus).toBe('unverified');

    const code = generateCode();
    await stageEmailCode(id, token, code);
    lead = await getLead(id);
    expect(lead.emailVerificationStatus).toBe('pending');
    expect(lead.emailVerificationTokenHash).not.toBe(code);
    expect(lead.emailVerificationTokenHash).not.toContain(code);
    // Abandoning here must not erase the lead or its email.
    expect(lead.normalizedEmail).toBe(emailFor('verify@example.com'));

    expect(await verifyEmailCode(id, token, '000000')).toBe('invalid_code');
    lead = await getLead(id);
    expect(lead.emailVerificationAttempts).toBe(1);
    expect(lead.emailVerificationStatus).toBe('pending'); // still saved, still unverified

    expect(await verifyEmailCode(id, token, code)).toBe('verified');
    lead = await getLead(id);
    expect(lead.emailVerificationStatus).toBe('verified');
    expect(lead.emailVerifiedAt).not.toBeNull();
    expect(lead.emailVerificationTokenHash).toBeNull(); // hash cleared on success
  });

  it('provider failure clears the challenge but never removes the saved lead', async () => {
    const { id, token } = await createLead('delivery-failure@example.com');
    const challengeId = generateChallengeId();
    await reserveEmailCode({
      leadId: id,
      resumeToken: token,
      challengeId,
      codeHash: hashCode('123456', { leadId: id, channel: 'email' }),
      expiresAt: codeExpiry(),
    });
    await failEmailCodeDelivery({
      leadId: id,
      resumeToken: token,
      challengeId,
      failureCode: 'provider_rejected',
    });
    const lead = await getLead(id);
    expect(lead.normalizedEmail).toBe(emailFor('delivery-failure@example.com'));
    expect(lead.emailVerificationStatus).toBe('unverified');
    expect(lead.emailVerificationTokenHash).toBeNull();
    expect(lead.lastTransactionalEmailStatus).toBe('failed');
  });

  it('a resend supersedes the prior code and the old code cannot verify', async () => {
    const { id, token } = await createLead('resend@example.com');
    await stageEmailCode(id, token, '111111');
    await db
      .update(waitlistLeads)
      .set({ emailVerificationRequestedAt: new Date(Date.now() - 60_000) })
      .where(eq(waitlistLeads.id, id));
    await stageEmailCode(id, token, '222222');
    expect(await verifyEmailCode(id, token, '111111')).toBe('invalid_code');
    expect(await verifyEmailCode(id, token, '222222')).toBe('verified');
  });

  it('one lead code cannot verify another lead', async () => {
    const first = await createLead('first-code@example.com');
    const second = await createLead('second-code@example.com');
    await stageEmailCode(first.id, first.token, '123456');
    await stageEmailCode(second.id, second.token, '654321');
    expect(await verifyEmailCode(second.id, second.token, '123456')).toBe('invalid_code');
    expect(await verifyEmailCode(first.id, first.token, '123456')).toBe('verified');
  });

  it('rejects an expired code', async () => {
    const { id, token } = await createLead('expired@example.com');
    const code = generateCode();
    await stageEmailCode(id, token, code, new Date(Date.now() - 1000));
    expect(await verifyEmailCode(id, token, code)).toBe('expired');
    const lead = await getLead(id);
    expect(lead.emailVerificationStatus).toBe('unverified');
    expect(lead.emailVerificationTokenHash).toBeNull();
  });

  it('enforces the attempt limit and invalidates the exhausted challenge', async () => {
    const { id, token } = await createLead('attempts@example.com');
    await stageEmailCode(id, token, '123456');
    for (let i = 1; i < MAX_VERIFY_ATTEMPTS; i++) {
      expect(await verifyEmailCode(id, token, '654321')).toBe('invalid_code');
    }
    expect(await verifyEmailCode(id, token, '654321')).toBe('too_many_attempts');
    const lead = await getLead(id);
    expect(lead.emailVerificationStatus).toBe('unverified');
    expect(lead.emailVerificationTokenHash).toBeNull();
  });

  it('verification success is idempotent and the consumed hash cannot be reused', async () => {
    const { id, token } = await createLead('idempotent-verify@example.com');
    await stageEmailCode(id, token, '123456');
    expect(await verifyEmailCode(id, token, '123456')).toBe('verified');
    expect(await verifyEmailCode(id, token, '123456')).toBe('verified');
    expect((await getLead(id)).emailVerificationTokenHash).toBeNull();
  });

  it('changing email stays on the same lead and resets verification state', async () => {
    const { id, token } = await createLead('before@example.com');
    await stageEmailCode(id, token, '123456');
    expect(await verifyEmailCode(id, token, '123456')).toBe('verified');
    const changed = await updateLeadEmail({
      leadId: id,
      resumeToken: token,
      fullName: 'Asha After',
      originalEmail: emailFor('After@example.com'),
      normalizedEmail: emailFor('after@example.com'),
    });
    expect(changed.ok).toBe(true);
    const lead = await getLead(id);
    expect(lead.normalizedEmail).toBe(emailFor('after@example.com'));
    expect(lead.fullName).toBe('Asha After');
    expect(lead.emailVerificationStatus).toBe('unverified');
    expect(lead.emailVerifiedAt).toBeNull();
    expect(lead.emailVerificationTokenHash).toBeNull();
  });

  it('phone verification is independent of WhatsApp consent', async () => {
    const { id, token } = await createLead('phoneverify@example.com');
    await updateLeadPhone({
      leadId: id, resumeToken: token, skipped: false,
      phoneE164: '+447400123456', phoneCountryIso: 'GB',
      whatsappConsent: false, smsConsent: false, voiceConsent: false,
    });
    const code = generateCode();
    await storePhoneCode(
      id,
      token,
      hashCode(code, { leadId: id, channel: 'phone' }),
      codeExpiry(),
    );
    expect(await verifyPhoneCode(id, token, code)).toBe('verified');
    const lead = await getLead(id);
    expect(lead.phoneVerificationStatus).toBe('verified');
    expect(lead.whatsappConsent).toBe(false); // compatibility field remains untouched
  });
});

describe('section-specific "Other" responses', () => {
  it('persist per group and clear coherently', async () => {
    const { id, token } = await createLead('other@example.com');
    await updateLeadRole({ leadId: id, resumeToken: token, role: 'seeker' });
    // Two different sections each with their own Other answer.
    await updateLeadPreferences({
      leadId: id,
      resumeToken: token,
      jobCategories: ['writing_research_other', 'creative_production_other'],
      jobCategoryOthers: {
        writing_research: 'Grant writing for creators',
        creative_production: 'Set design',
      },
    });
    let lead = await getLead(id);
    expect(lead.jobCategories).toEqual([]);
    expect(lead.jobCategoryOthers).toEqual({});
    expect(lead.seekerNeeds.groups).toEqual([
      { id: 'creative_production', selections: [], otherSelected: true, customResponse: 'Set design' },
      { id: 'writing_research', selections: [], otherSelected: true, customResponse: 'Grant writing for creators' },
    ]);

    // Deselecting one section's Other removes only that key.
    await updateLeadPreferences({
      leadId: id,
      resumeToken: token,
      jobCategories: ['creative_production_other'],
      jobCategoryOthers: { creative_production: 'Set design' },
    });
    lead = await getLead(id);
    expect(lead.seekerNeeds.groups).toEqual([
      { id: 'creative_production', selections: [], otherSelected: true, customResponse: 'Set design' },
    ]);
  });
});

describe('deleteLeadById — admin erasure', () => {
  it('removes the whole registration and reports the address that was deleted', async () => {
    const lead = await createLead('erase.me@example.com', {}, 'Test Signup');
    await updateLeadRole({ leadId: lead.id, resumeToken: lead.token, role: 'seeker' });

    const result = await deleteLeadById(lead.id);
    expect(result.deleted).toBe(true);
    expect(result.normalizedEmail).toBe(normalizeEmail(lead.email));

    const rows = await db.select().from(waitlistLeads).where(eq(waitlistLeads.id, lead.id));
    expect(rows).toHaveLength(0);
  });

  it('is idempotent — deleting an already-deleted id reports no deletion, throws nothing', async () => {
    const lead = await createLead('erase.twice@example.com');
    expect((await deleteLeadById(lead.id)).deleted).toBe(true);
    const second = await deleteLeadById(lead.id);
    expect(second.deleted).toBe(false);
    expect(second.normalizedEmail).toBeNull();
  });

  it('leaves every other registration untouched', async () => {
    const doomed = await createLead('erase.target@example.com');
    const keeper = await createLead('erase.keeper@example.com');

    await deleteLeadById(doomed.id);

    const survivors = await db.select().from(waitlistLeads).where(eq(waitlistLeads.id, keeper.id));
    expect(survivors).toHaveLength(1);
  });

  it('frees the email so the same person can register again afterwards', async () => {
    const lead = await createLead('erase.rejoin@example.com');
    await deleteLeadById(lead.id);
    const again = await createLead('erase.rejoin@example.com');
    expect(again.id).not.toBe(lead.id);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { sql, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { waitlistLeads } from '@/lib/db/schema';
import {
  upsertLeadByEmail,
  updateLeadRole,
  updateLeadPreferences,
  updateLeadPhone,
  selectResumeState,
} from '@/lib/db/queries/leads';
import {
  getWaitlistSummary,
  getCategoryBreakdown,
  listLeads,
  listLeadsForExport,
} from '@/lib/db/queries/admin';
import { toCsv } from '@/lib/admin/csv';
import {
  generateResumeToken,
  hashResumeToken,
  resumeTokenExpiry,
} from '@/lib/tokens/lead-token';
import { normalizeEmail } from '@/lib/validation/email';

const db = getDb();

async function createLead(
  email: string,
  attribution: { utmSource?: string; source?: string } = {},
) {
  const token = generateResumeToken();
  const { id } = await upsertLeadByEmail({
    originalEmail: email,
    normalizedEmail: normalizeEmail(email),
    resumeTokenHash: hashResumeToken(token),
    resumeTokenExpiresAt: resumeTokenExpiry(),
    utmSource: attribution.utmSource,
    source: attribution.source,
  });
  return { id, token };
}

async function getLead(id: string) {
  const rows = await db.select().from(waitlistLeads).where(eq(waitlistLeads.id, id));
  return rows[0]!;
}

beforeEach(async () => {
  await db.execute(sql`truncate table waitlist_leads restart identity cascade`);
});

describe('upsertLeadByEmail — idempotency', () => {
  it('updates the existing row on repeat submissions (no duplicate)', async () => {
    const first = await createLead('dup@example.com', { utmSource: 'first' });
    const second = await createLead('dup@example.com', { utmSource: 'second' });

    expect(second.id).toBe(first.id);

    const rows = await db
      .select()
      .from(waitlistLeads)
      .where(eq(waitlistLeads.normalizedEmail, 'dup@example.com'));
    expect(rows).toHaveLength(1);
  });

  it('preserves first-touch attribution', async () => {
    const { id } = await createLead('attrib@example.com', { utmSource: 'first' });
    await createLead('attrib@example.com', { utmSource: 'second' });
    const lead = await getLead(id);
    expect(lead.utmSource).toBe('first');
  });

  it('stores new leads as unverified and email_only', async () => {
    const { id } = await createLead('fresh@example.com');
    const lead = await getLead(id);
    expect(lead.emailVerificationStatus).toBe('unverified');
    expect(lead.completionStatus).toBe('email_only');
    expect(lead.lastCompletedStep).toBe(1);
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
      talentCategories: ['content_strategy'],
    });
    const lead = await getLead(id);
    expect(lead.jobCategories).toEqual(['video_editing']);
    expect(lead.talentCategories).toEqual(['content_strategy']);
    expect(lead.lastCompletedStep).toBe(3);
  });
});

describe('updateLeadPhone', () => {
  it('skip marks the lead completed with no phone', async () => {
    const { id, token } = await createLead('skip@example.com');
    const res = await updateLeadPhone({ leadId: id, resumeToken: token, skipped: true });
    expect(res.ok).toBe(true);
    const lead = await getLead(id);
    expect(lead.completionStatus).toBe('completed');
    expect(lead.completedAt).not.toBeNull();
    expect(lead.phoneE164).toBeNull();
    expect(lead.whatsappConsent).toBe(false);
  });

  it('stores phone + consent when consent is given', async () => {
    const { id, token } = await createLead('consent@example.com');
    await updateLeadPhone({
      leadId: id,
      resumeToken: token,
      skipped: false,
      phoneE164: '+447400123456',
      phoneCountryIso: 'GB',
      whatsappConsent: true,
      consentCopyVersion: 'wa-v1',
    });
    const lead = await getLead(id);
    expect(lead.phoneE164).toBe('+447400123456');
    expect(lead.whatsappConsent).toBe(true);
    expect(lead.whatsappConsentAt).not.toBeNull();
    expect(lead.whatsappConsentCopyVersion).toBe('wa-v1');
  });

  it('never implies consent when a phone is provided without consent', async () => {
    const { id, token } = await createLead('noconsent@example.com');
    await updateLeadPhone({
      leadId: id,
      resumeToken: token,
      skipped: false,
      phoneE164: '+447400123457',
      phoneCountryIso: 'GB',
      whatsappConsent: false,
      consentCopyVersion: 'wa-v1',
    });
    const lead = await getLead(id);
    expect(lead.phoneE164).toBe('+447400123457');
    expect(lead.whatsappConsent).toBe(false);
    expect(lead.whatsappConsentAt).toBeNull();
    expect(lead.whatsappConsentCopyVersion).toBeNull();
  });
});

describe('selectResumeState', () => {
  it('returns masked email + selections for a valid token, never raw PII', async () => {
    const { id, token } = await createLead('resume@example.com');
    await updateLeadRole({ leadId: id, resumeToken: token, role: 'seeker' });
    await updateLeadPreferences({
      leadId: id,
      resumeToken: token,
      jobCategories: ['growth_analytics'],
    });
    const state = await selectResumeState({ leadId: id, resumeToken: token });
    expect(state).not.toBeNull();
    expect(state?.emailMasked).toBe('r*****@example.com');
    expect(state?.emailMasked).not.toContain('resume@example.com');
    expect(state?.role).toBe('seeker');
    expect(state?.jobCategories).toEqual(['growth_analytics']);
    expect(state?.lastCompletedStep).toBe(3);
  });

  it('returns null for an invalid token', async () => {
    const { id } = await createLead('resume2@example.com');
    const state = await selectResumeState({ leadId: id, resumeToken: 'nope' });
    expect(state).toBeNull();
  });
});

describe('admin queries', () => {
  async function seed() {
    const a = await createLead('a@example.com', { utmSource: 'twitter' });
    await updateLeadRole({ leadId: a.id, resumeToken: a.token, role: 'seeker' });
    await updateLeadPreferences({
      leadId: a.id,
      resumeToken: a.token,
      jobCategories: ['video_editing', 'content_strategy'],
    });
    await updateLeadPhone({
      leadId: a.id,
      resumeToken: a.token,
      skipped: false,
      phoneE164: '+447400123456',
      phoneCountryIso: 'GB',
      whatsappConsent: true,
      consentCopyVersion: 'wa-v1',
    });

    const b = await createLead('b@example.com', { utmSource: 'twitter' });
    await updateLeadRole({ leadId: b.id, resumeToken: b.token, role: 'recruiter' });
    await updateLeadPreferences({
      leadId: b.id,
      resumeToken: b.token,
      talentCategories: ['video_editing'],
    });

    await createLead('c@example.com', { utmSource: 'newsletter' }); // email_only
  }

  it('summary counts reflect the data', async () => {
    await seed();
    const summary = await getWaitlistSummary();
    expect(summary.total).toBe(3);
    expect(summary.emailOnly).toBe(1);
    expect(summary.completed).toBe(1);
    expect(summary.seekers).toBe(1);
    expect(summary.recruiters).toBe(1);
    expect(summary.whatsappConsented).toBe(1);
    expect(summary.unverified).toBe(3);
  });

  it('category breakdown aggregates job + talent selections', async () => {
    await seed();
    const breakdown = await getCategoryBreakdown();
    const map = Object.fromEntries(breakdown.map((r) => [r.key, r.count]));
    expect(map.video_editing).toBe(2); // a (job) + b (talent)
    expect(map.content_strategy).toBe(1);
  });

  it('listLeads applies the role filter', async () => {
    await seed();
    const { rows, total } = await listLeads({ role: 'seeker' });
    expect(total).toBe(1);
    expect(rows[0]?.originalEmail).toBe('a@example.com');
  });

  it('listLeads applies the category filter across job + talent', async () => {
    await seed();
    const { total } = await listLeads({ category: 'video_editing' });
    expect(total).toBe(2);
  });

  it('CSV export reflects filters and includes verification status', async () => {
    await seed();
    const rows = await listLeadsForExport({ completion: 'completed' });
    const csv = toCsv(rows);
    expect(csv).toContain('email_verification_status');
    expect(csv).toContain('a@example.com');
    expect(csv).not.toContain('c@example.com'); // filtered out (email_only)
    expect(csv).toContain('unverified');
  });
});

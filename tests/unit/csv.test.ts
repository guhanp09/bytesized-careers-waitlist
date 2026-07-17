import { describe, it, expect } from 'vitest';
import { escapeCsvCell, toCsv, CSV_HEADERS } from '@/lib/admin/csv';
import { buildNeedProfile } from '@/lib/leads/needs';
import type { AdminLeadRow } from '@/lib/db/queries/admin';

describe('escapeCsvCell', () => {
  it('leaves simple values untouched', () => expect(escapeCsvCell('hello')).toBe('hello'));
  it('quotes commas, quotes, and newlines', () => {
    expect(escapeCsvCell('a,b')).toBe('"a,b"');
    expect(escapeCsvCell('a"b')).toBe('"a""b"');
    expect(escapeCsvCell('a\nb')).toBe('"a\nb"');
  });
  it('neutralizes spreadsheet formula starters', () => {
    expect(escapeCsvCell('=HYPERLINK("https://bad")')).toBe(`"'=HYPERLINK(""https://bad"")"`);
    expect(escapeCsvCell('+447400123456')).toBe("'+447400123456");
    expect(escapeCsvCell('@SUM(A1)')).toBe("'@SUM(A1)");
  });
});

describe('operator CSV', () => {
  const row: AdminLeadRow = {
    id: 'id-1',
    fullName: 'Taylor Morgan',
    originalEmail: 'user@example.com',
    role: 'both',
    completionStatus: 'completed',
    lastCompletedStep: 8,
    lastMeaningfulStep: 'completed',
    leadDataVersion: 2,
    emailVerificationStatus: 'verified',
    emailVerificationRequestedAt: new Date('2026-07-13T08:59:00Z'),
    emailVerificationSentAt: new Date('2026-07-13T09:00:00Z'),
    emailVerifiedAt: new Date('2026-07-13T09:05:00Z'),
    emailVerificationFailureCode: null,
    lastTransactionalEmailStatus: 'sent',
    lastTransactionalEmailAt: new Date('2026-07-13T09:00:00Z'),
    phoneE164: '+447400123456',
    phoneCountryIso: 'GB',
    phoneWhatsappConsent: true,
    phoneSmsConsent: false,
    phoneVoiceConsent: true,
    phoneConsentVersion: '2026-07-17.v1',
    phoneConsentRecordedAt: new Date('2026-07-13T09:02:00Z'),
    phoneConsentSource: 'waitlist_phone_step',
    phoneVerificationStatus: 'unverified',
    phoneVerificationRequestedAt: null,
    phoneVerificationLastSentAt: null,
    phoneVerifiedAt: null,
    seekerNeeds: buildNeedProfile(
      'seeker',
      ['video_editing', 'writing_research_other'],
      { writing_research: 'Long-form documentary fact-checking' },
    ),
    recruiterNeeds: buildNeedProfile('recruiter', ['thumbnail_designers'], {}),
    workFormats: ['remote'],
    organisationTypes: ['creator_agency'],
    platforms: ['youtube'],
    niches: ['tech'],
    platformOther: null,
    nicheOther: null,
    experienceLevel: null,
    availabilityToStart: null,
    portfolioUrl: null,
    hiringFrequency: null,
    talentSeniority: null,
    hiringTimeline: null,
    teamSize: null,
    companyUrl: null,
    additionalNotes: 'Looking for work and hiring a thumbnail designer.',
    source: 'waitlist',
    utmSource: 'linkedin',
    utmMedium: 'social',
    utmCampaign: 'launch',
    referrer: 'https://example.com',
    firstTouchAttribution: {
      version: 1,
      kind: 'campaign',
      source: 'reddit',
      medium: 'community',
      campaign: 'editor-feedback',
      landingPath: '/',
      capturedAt: '2026-07-13T08:00:00.000Z',
    },
    lastTouchAttribution: {
      version: 1,
      kind: 'campaign',
      source: 'meta',
      medium: 'paid-social',
      campaign: 'talent-india',
      content: '=formula-attempt',
      landingPath: '/early-access',
      capturedAt: '2026-07-13T09:00:00.000Z',
    },
    createdAt: new Date('2026-07-13T10:00:00Z'),
    updatedAt: new Date('2026-07-13T10:05:00Z'),
    completedAt: new Date('2026-07-13T10:05:00Z'),
  };

  it('uses the stable reconstructed model columns', () => {
    expect(CSV_HEADERS).toContain('Seeker Selections');
    expect(CSV_HEADERS).toContain('Recruiter Selections');
    expect(CSV_HEADERS).toContain('Additional Comments');
    expect(CSV_HEADERS.slice(0, 4)).toEqual(['Lead ID', 'Full Name', 'Email', 'Role']);
    expect(CSV_HEADERS).toContain('Joined At IST');
    expect(CSV_HEADERS).toContain('WhatsApp Channel Choice');
    expect(CSV_HEADERS).toContain('SMS Channel Choice');
    expect(CSV_HEADERS).toContain('Phone Call Channel Choice');
    expect(CSV_HEADERS).toContain('first_touch_source');
    expect(CSV_HEADERS).toContain('last_touch_campaign');
    expect(CSV_HEADERS.join(' ')).not.toMatch(/token|hash|challenge|provider/i);
  });

  it('keeps both pathways and category-specific custom text readable', () => {
    const csv = toCsv([row]);
    expect(csv).toContain('13 Jul 2026, 3:30 PM IST');
    expect(csv).toContain('Taylor Morgan');
    expect(csv).toContain('Video editing');
    expect(csv).toContain('Thumbnail designers');
    expect(csv).toContain('Writing & research: Long-form documentary fact-checking');
    expect(csv).not.toContain('video_editing');
    expect(csv).not.toContain('thumbnail_designers');
    expect(csv).toContain('Opted in');
    expect(csv).toContain('Not opted in');
    expect(csv).toContain('waitlist_phone_step');
    expect(csv).toContain("'+447400123456");
    expect(csv).toContain('linkedin');
    expect(csv).toContain('editor-feedback');
    expect(csv).toContain('talent-india');
    expect(csv).toContain("'=formula-attempt");
  });

  it('preserves long context and active filters can supply an already-filtered row set', () => {
    const csv = toCsv([row]);
    expect(csv).toContain('Looking for work and hiring a thumbnail designer.');
    expect(csv.split('\r\n')).toHaveLength(2);
  });
});

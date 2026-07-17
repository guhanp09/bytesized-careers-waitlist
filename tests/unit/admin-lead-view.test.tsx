import { beforeAll, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WaitlistTable } from '@/app/admin/waitlist/waitlist-table';
import { buildNeedProfile } from '@/lib/leads/needs';
import type { AdminLeadRow } from '@/lib/db/queries/admin';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
});

function lead(overrides: Partial<AdminLeadRow> = {}): AdminLeadRow {
  return {
    id: 'lead-1',
    originalEmail: 'operator-view@example.com',
    role: 'both',
    completionStatus: 'completed',
    lastCompletedStep: 8,
    lastMeaningfulStep: 'completed',
    leadDataVersion: 2,
    emailVerificationStatus: 'verified',
    emailVerificationRequestedAt: new Date('2026-07-15T09:55:00Z'),
    emailVerificationSentAt: new Date('2026-07-15T09:56:00Z'),
    emailVerifiedAt: new Date('2026-07-15T10:00:00Z'),
    emailVerificationFailureCode: null,
    lastTransactionalEmailStatus: 'sent',
    lastTransactionalEmailAt: new Date('2026-07-15T09:59:00Z'),
    phoneE164: '+919900000001',
    phoneCountryIso: 'IN',
    phoneWhatsappConsent: true,
    phoneSmsConsent: false,
    phoneVoiceConsent: true,
    phoneConsentVersion: '2026-07-17.v1',
    phoneConsentRecordedAt: new Date('2026-07-15T10:00:30Z'),
    phoneConsentSource: 'waitlist_phone_step',
    phoneVerificationStatus: 'verified',
    phoneVerificationRequestedAt: new Date('2026-07-15T10:01:00Z'),
    phoneVerificationLastSentAt: new Date('2026-07-15T10:01:00Z'),
    phoneVerifiedAt: new Date('2026-07-15T10:02:00Z'),
    seekerNeeds: buildNeedProfile(
      'seeker',
      ['content_strategy', 'writing_research_other'],
      { writing_research: 'Documentary source verification' },
    ),
    recruiterNeeds: buildNeedProfile('recruiter', ['video_editors', 'researchers']),
    workFormats: ['remote'],
    organisationTypes: ['creator_agency'],
    platforms: ['youtube'],
    niches: ['finance'],
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
    additionalNotes: 'A long, specific note that must remain fully readable in the detail view without line clamping or destructive truncation.',
    source: 'waitlist',
    utmSource: 'linkedin',
    utmMedium: null,
    utmCampaign: null,
    referrer: null,
    createdAt: new Date('2026-07-15T09:00:00Z'),
    updatedAt: new Date('2026-07-15T10:00:00Z'),
    completedAt: new Date('2026-07-15T10:00:00Z'),
    ...overrides,
    fullName: overrides.fullName === undefined ? 'Asha Kapoor' : overrides.fullName,
  };
}

describe('admin lead presentation', () => {
  it('keeps both pathways unambiguous in the scan view', () => {
    render(<WaitlistTable rows={[lead()]} />);
    expect(screen.getAllByText(/Looking for:/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Hiring:/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Email verified').length).toBeGreaterThan(0);
    expect(screen.getAllByText('completed').length).toBeGreaterThan(0);
  });

  it('groups custom responses and preserves the full final note in detail', async () => {
    const user = userEvent.setup();
    render(<WaitlistTable rows={[lead()]} />);
    await user.click(screen.getAllByRole('button', { name: 'View' })[0]!);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('What they want to do')).toBeInTheDocument();
    expect(screen.getByText('Who they want to hire')).toBeInTheDocument();
    expect(screen.getByText('Documentary source verification')).toBeInTheDocument();
    expect(screen.getByText(/A long, specific note that must remain fully readable/)).toBeInTheDocument();
    expect(screen.getByText('Looking for work and hiring talent')).toBeInTheDocument();
    expect(screen.getByText('Email verification requested')).toBeInTheDocument();
    expect(screen.getAllByText('Phone verified (legacy)').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/IST/).length).toBeGreaterThan(0);
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('SMS')).toBeInTheDocument();
    expect(screen.getByText('Phone calls')).toBeInTheDocument();
    expect(screen.getAllByText('Opted in')).toHaveLength(2);
    expect(screen.getByText('Not opted in')).toBeInTheDocument();
    expect(screen.getByText('waitlist_phone_step')).toBeInTheDocument();
    expect(screen.queryByText(/token|hash|provider message/i)).not.toBeInTheDocument();
  });

  it('shows a partial-completion warning independently of verification', () => {
    render(<WaitlistTable rows={[lead({ completionStatus: 'partial', lastMeaningfulStep: 'needs' })]} />);
    expect(screen.getAllByText('partial').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Email verified').length).toBeGreaterThan(0);
  });

  it('uses an explicit legacy fallback instead of inferring a name from email', () => {
    render(<WaitlistTable rows={[lead({ fullName: null })]} />);
    expect(screen.getAllByText('Name not captured').length).toBeGreaterThan(0);
    expect(screen.getAllByText('operator-view@example.com').length).toBeGreaterThan(0);
  });
});

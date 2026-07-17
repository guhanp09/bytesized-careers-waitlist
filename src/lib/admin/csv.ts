import type { AdminLeadRow } from '@/lib/db/queries/admin';
import { formatIstDateTime } from '@/lib/admin/time';
import { displayNeedGroups, formatCustomResponses, formatNeedSelections } from '@/lib/leads/needs';
import { labelFor } from '@/lib/validation/constants';
import { legacyReferrerHostname, type AttributionTouchV1 } from '@/lib/attribution/campaign';

/** Stable, operator-readable export contract. Verification secrets are intentionally absent. */
export const CSV_HEADERS = [
  // Lead identity
  'Lead ID', 'Full Name', 'Email', 'Role', 'Completion Status', 'Last Completed Step',
  'Last Meaningful Step', 'Data Schema Version',
  'Joined At IST', 'Updated At IST', 'Completed At IST',
  'Joined At UTC ISO', 'Updated At UTC ISO', 'Completed At UTC ISO',
  // Contact and ownership events
  'Email Verification Status', 'Email Verification Requested At IST',
  'Email Delivery Accepted At IST', 'Email Verified At IST',
  'Phone', 'Phone Present', 'Phone Verification Status',
  'WhatsApp Channel Choice', 'SMS Channel Choice', 'Phone Call Channel Choice',
  'Phone Consent Version', 'Phone Consent Recorded At IST', 'Phone Consent Source',
  'Phone Verification Requested At IST', 'Phone Code Last Sent At IST',
  'Phone Verified At IST',
  // Job seeker
  'Seeker Categories', 'Seeker Selections', 'Seeker Custom Responses',
  'Work Formats', 'Experience Level', 'Availability To Start', 'Portfolio URL',
  // Recruiter
  'Recruiter Categories', 'Recruiter Selections', 'Recruiter Custom Responses',
  'Organisation Type', 'Hiring Timeline', 'Team Size', 'Company URL',
  // Shared context
  'Platforms', 'Platform Other', 'Niches', 'Niche Other', 'Additional Comments',
  // Attribution
  'Source', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Referrer',
  'first_touch_source', 'first_touch_medium', 'first_touch_campaign',
  'first_touch_content', 'first_touch_term', 'first_touch_geo',
  'first_touch_placement', 'first_touch_referral', 'first_touch_referrer_host',
  'first_touch_landing_path', 'first_touch_captured_at',
  'last_touch_source', 'last_touch_medium', 'last_touch_campaign',
  'last_touch_content', 'last_touch_term', 'last_touch_geo',
  'last_touch_placement', 'last_touch_referral', 'last_touch_referrer_host',
  'last_touch_landing_path', 'last_touch_captured_at',
] as const;

export function escapeCsvCell(value: string): string {
  // Prefix spreadsheet-formula starters before applying normal RFC 4180 quoting.
  const safe = /^\s*[=+\-@]/u.test(value) ? `'${value}` : value;
  if (/[",\n\r]/.test(safe)) return `"${safe.replace(/"/g, '""')}"`;
  return safe;
}

function labels(values: string[]): string { return values.map(labelFor).join(' | '); }

function categories(row: AdminLeadRow, side: 'seeker' | 'recruiter'): string {
  const profile = side === 'seeker' ? row.seekerNeeds : row.recruiterNeeds;
  return displayNeedGroups(profile, side).map((group) => group.label).join(' | ');
}

function ist(value: Date | null): string { return value ? formatIstDateTime(value) : ''; }

function touchCells(touch: AttributionTouchV1 | null): string[] {
  return [
    touch?.source ?? '',
    touch?.medium ?? '',
    touch?.campaign ?? '',
    touch?.content ?? '',
    touch?.term ?? '',
    touch?.geo ?? '',
    touch?.placement ?? '',
    touch?.referral ?? '',
    touch?.referrerHost ?? '',
    touch?.landingPath ?? '',
    touch?.capturedAt ?? '',
  ];
}

export function toCsv(rows: AdminLeadRow[]): string {
  const lines = [CSV_HEADERS.map(escapeCsvCell).join(',')];
  for (const row of rows) {
    const firstTouchCells = row.firstTouchAttribution
      ? touchCells(row.firstTouchAttribution)
      : [
          row.utmSource ?? row.source ?? '',
          row.utmMedium ?? '',
          row.utmCampaign ?? '',
          '', '', '', '', '',
          legacyReferrerHostname(row.referrer) ?? '',
          '', '',
        ];
    const cells = [
      row.id, row.fullName ?? '', row.originalEmail, row.role ?? '', row.completionStatus, String(row.lastCompletedStep),
      row.lastMeaningfulStep, String(row.leadDataVersion),
      ist(row.createdAt), ist(row.updatedAt), ist(row.completedAt),
      row.createdAt.toISOString(), row.updatedAt.toISOString(), row.completedAt?.toISOString() ?? '',
      row.emailVerificationStatus, ist(row.emailVerificationRequestedAt),
      ist(row.emailVerificationSentAt), ist(row.emailVerifiedAt),
      row.phoneE164 ?? '', row.phoneE164 ? 'Yes' : 'No', row.phoneVerificationStatus,
      row.phoneWhatsappConsent ? 'Opted in' : 'Not opted in',
      row.phoneSmsConsent ? 'Opted in' : 'Not opted in',
      row.phoneVoiceConsent ? 'Opted in' : 'Not opted in',
      row.phoneConsentVersion ?? '', ist(row.phoneConsentRecordedAt), row.phoneConsentSource ?? '',
      ist(row.phoneVerificationRequestedAt), ist(row.phoneVerificationLastSentAt),
      ist(row.phoneVerifiedAt),
      categories(row, 'seeker'), formatNeedSelections(row.seekerNeeds, 'seeker'),
      formatCustomResponses(row.seekerNeeds, 'seeker'), labels(row.workFormats),
      row.experienceLevel ? labelFor(row.experienceLevel) : '',
      row.availabilityToStart ? labelFor(row.availabilityToStart) : '', row.portfolioUrl ?? '',
      categories(row, 'recruiter'), formatNeedSelections(row.recruiterNeeds, 'recruiter'),
      formatCustomResponses(row.recruiterNeeds, 'recruiter'), labels(row.organisationTypes),
      row.hiringTimeline ? labelFor(row.hiringTimeline) : '',
      row.teamSize ? labelFor(row.teamSize) : '', row.companyUrl ?? '',
      labels(row.platforms), row.platformOther ?? '', labels(row.niches), row.nicheOther ?? '',
      row.additionalNotes ?? '', row.source ?? '', row.utmSource ?? '', row.utmMedium ?? '',
      row.utmCampaign ?? '', row.referrer ?? '',
      ...firstTouchCells,
      ...touchCells(row.lastTouchAttribution),
    ];
    lines.push(cells.map((cell) => escapeCsvCell(String(cell))).join(','));
  }
  return lines.join('\r\n');
}

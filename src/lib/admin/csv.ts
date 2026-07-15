import type { AdminLeadRow } from '@/lib/db/queries/admin';
import { formatIstDateTime } from '@/lib/admin/time';
import { displayNeedGroups, formatCustomResponses, formatNeedSelections } from '@/lib/leads/needs';
import { labelFor } from '@/lib/validation/constants';

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
] as const;

export function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function labels(values: string[]): string { return values.map(labelFor).join(' | '); }

function categories(row: AdminLeadRow, side: 'seeker' | 'recruiter'): string {
  const profile = side === 'seeker' ? row.seekerNeeds : row.recruiterNeeds;
  return displayNeedGroups(profile, side).map((group) => group.label).join(' | ');
}

function ist(value: Date | null): string { return value ? formatIstDateTime(value) : ''; }

export function toCsv(rows: AdminLeadRow[]): string {
  const lines = [CSV_HEADERS.map(escapeCsvCell).join(',')];
  for (const row of rows) {
    const cells = [
      row.id, row.fullName ?? '', row.originalEmail, row.role ?? '', row.completionStatus, String(row.lastCompletedStep),
      row.lastMeaningfulStep, String(row.leadDataVersion),
      ist(row.createdAt), ist(row.updatedAt), ist(row.completedAt),
      row.createdAt.toISOString(), row.updatedAt.toISOString(), row.completedAt?.toISOString() ?? '',
      row.emailVerificationStatus, ist(row.emailVerificationRequestedAt),
      ist(row.emailVerificationSentAt), ist(row.emailVerifiedAt),
      row.phoneE164 ?? '', row.phoneE164 ? 'Yes' : 'No', row.phoneVerificationStatus,
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
    ];
    lines.push(cells.map((cell) => escapeCsvCell(String(cell))).join(','));
  }
  return lines.join('\r\n');
}

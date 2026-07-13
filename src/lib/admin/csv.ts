import type { AdminLeadRow } from '@/lib/db/queries/admin';

/**
 * CSV serialization for the admin export (plan §15). Pure + dependency-free so it is unit
 * testable. Includes verification status; arrays are joined with '|'.
 */
export const CSV_HEADERS = [
  'id',
  'email',
  'role',
  'completion_status',
  'email_verification_status',
  'job_categories',
  'talent_categories',
  'work_formats',
  'organisation_types',
  'phone_e164',
  'whatsapp_consent',
  'utm_source',
  'created_at',
] as const;

export function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(rows: AdminLeadRow[]): string {
  const lines = [CSV_HEADERS.join(',')];
  for (const row of rows) {
    const cells = [
      row.id,
      row.originalEmail,
      row.role ?? '',
      row.completionStatus,
      row.emailVerificationStatus,
      row.jobCategories.join('|'),
      row.talentCategories.join('|'),
      row.workFormats.join('|'),
      row.organisationTypes.join('|'),
      row.phoneE164 ?? '',
      String(row.whatsappConsent),
      row.utmSource ?? '',
      row.createdAt.toISOString(),
    ];
    lines.push(cells.map((c) => escapeCsvCell(String(c))).join(','));
  }
  return lines.join('\r\n');
}

import { describe, it, expect } from 'vitest';
import { escapeCsvCell, toCsv, CSV_HEADERS } from '@/lib/admin/csv';
import type { AdminLeadRow } from '@/lib/db/queries/admin';

describe('escapeCsvCell', () => {
  it('leaves simple values untouched', () => {
    expect(escapeCsvCell('hello')).toBe('hello');
  });
  it('quotes and escapes values with commas, quotes, or newlines', () => {
    expect(escapeCsvCell('a,b')).toBe('"a,b"');
    expect(escapeCsvCell('a"b')).toBe('"a""b"');
    expect(escapeCsvCell('a\nb')).toBe('"a\nb"');
  });
});

describe('toCsv', () => {
  const row: AdminLeadRow = {
    id: 'id-1',
    originalEmail: 'user@example.com',
    role: 'seeker',
    completionStatus: 'completed',
    emailVerificationStatus: 'unverified',
    jobCategories: ['video_editing', 'content_strategy'],
    talentCategories: [],
    workFormats: ['remote'],
    organisationTypes: [],
    phoneE164: '+447400123456',
    whatsappConsent: true,
    utmSource: 'twitter',
    createdAt: new Date('2026-07-13T10:00:00Z'),
  };

  it('includes the header row with verification status', () => {
    const csv = toCsv([row]);
    const [header] = csv.split('\r\n');
    expect(header).toBe(CSV_HEADERS.join(','));
    expect(header).toContain('email_verification_status');
  });

  it('serializes a row with arrays joined by |', () => {
    const csv = toCsv([row]);
    const lines = csv.split('\r\n');
    expect(lines[1]).toContain('video_editing|content_strategy');
    expect(lines[1]).toContain('user@example.com');
    expect(lines[1]).toContain('true');
  });
});

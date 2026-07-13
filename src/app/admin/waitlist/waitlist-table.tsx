import type { AdminLeadRow } from '@/lib/db/queries/admin';
import { CATEGORY_LABELS, type Category } from '@/lib/validation/constants';

interface WaitlistTableProps {
  rows: AdminLeadRow[];
}

function labelCategories(values: string[]): string {
  if (values.length === 0) return '—';
  return values
    .map((v) => CATEGORY_LABELS[v as Category] ?? v)
    .join(', ');
}

const th = 'px-3 py-2 text-left text-xs font-medium text-muted whitespace-nowrap';
const td = 'px-3 py-2 text-sm text-ink align-top';

export function WaitlistTable({ rows }: WaitlistTableProps) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-[color:var(--color-line)] bg-surface p-6 text-sm text-muted">
        No leads match these filters.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[color:var(--color-line)]">
      <table className="w-full min-w-[900px] border-collapse">
        <thead className="border-b border-[color:var(--color-line)] bg-surface">
          <tr>
            <th className={th}>Email</th>
            <th className={th}>Role</th>
            <th className={th}>Status</th>
            <th className={th}>Verify</th>
            <th className={th}>Interests</th>
            <th className={th}>WhatsApp</th>
            <th className={th}>Source</th>
            <th className={th}>Created</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-[color:var(--color-line)] last:border-0"
            >
              <td className={td}>{row.originalEmail}</td>
              <td className={td}>{row.role ?? '—'}</td>
              <td className={td}>{row.completionStatus}</td>
              <td className={td}>{row.emailVerificationStatus}</td>
              <td className={`${td} max-w-xs text-muted`}>
                {labelCategories([...row.jobCategories, ...row.talentCategories])}
              </td>
              <td className={td}>
                {row.whatsappConsent ? 'yes' : row.phoneE164 ? 'phone only' : '—'}
              </td>
              <td className={`${td} text-muted`}>{row.utmSource ?? 'direct'}</td>
              <td className={`${td} whitespace-nowrap text-muted`}>
                {row.createdAt.toISOString().slice(0, 10)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

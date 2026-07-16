'use client';

import { useState } from 'react';
import type { AdminLeadRow } from '@/lib/db/queries/admin';
import { buildNeedSummary, hasCustomResponse } from '@/lib/leads/needs';
import { formatIstDateTime } from '@/lib/admin/time';
import { LeadDetailDialog } from './lead-detail-dialog';

interface WaitlistTableProps {
  rows: AdminLeadRow[];
}

const roleLabels = { seeker: 'Job seeker', recruiter: 'Recruiter', both: 'Both' } as const;
const th = 'px-4 py-3 text-left text-xs font-medium text-faint whitespace-nowrap';
const td = 'px-4 py-3 align-top text-sm';

function Badge({ children, good = false }: { children: React.ReactNode; good?: boolean }) {
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${good ? 'border-success/25 bg-success/10 text-success' : 'border-[color:var(--color-line)] bg-surface text-muted'}`}>{children}</span>;
}

function NeedSummary({ row }: { row: AdminLeadRow }) {
  const summary = buildNeedSummary({ role: row.role, seekerNeeds: row.seekerNeeds, recruiterNeeds: row.recruiterNeeds });
  if (summary.total === 0) return <span className="text-faint">No selections yet</span>;
  if (row.role === 'both') {
    return (
      <div className="space-y-1 text-sm leading-snug">
        <p><span className="font-medium text-ink">Looking for:</span> <span className="text-muted">{summary.seeker.slice(0, 2).join(', ') || '—'}</span></p>
        <p><span className="font-medium text-ink">Hiring:</span> <span className="text-muted">{summary.recruiter.slice(0, 2).join(', ') || '—'}</span></p>
        {summary.remaining > 0 ? <p className="text-xs text-faint">+ {summary.remaining} more</p> : null}
      </div>
    );
  }
  return (
    <p className="max-w-md leading-snug text-muted">
      {summary.visible.join(', ')}
      {summary.remaining > 0 ? <span className="text-faint"> · + {summary.remaining} more</span> : null}
    </p>
  );
}

function Contactability({ row }: { row: AdminLeadRow }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge good={row.emailVerificationStatus === 'verified'}>Email {row.emailVerificationStatus}</Badge>
      {row.phoneE164 ? <Badge good>{row.phoneVerificationStatus === 'verified' ? 'Phone verified (legacy)' : 'Phone supplied'}</Badge> : <Badge>No phone</Badge>}
    </div>
  );
}

function LeadSignals({ row }: { row: AdminLeadRow }) {
  const custom = hasCustomResponse(row.seekerNeeds) || hasCustomResponse(row.recruiterNeeds) || Boolean(row.platformOther || row.nicheOther);
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {row.additionalNotes ? <Badge>Has comments</Badge> : null}
      {custom ? <Badge>Custom request</Badge> : null}
    </div>
  );
}

export function WaitlistTable({ rows }: WaitlistTableProps) {
  const [selected, setSelected] = useState<AdminLeadRow | null>(null);
  if (rows.length === 0) {
    return <p className="rounded-xl border border-[color:var(--color-line)] bg-surface p-6 text-sm text-muted">No leads match these filters.</p>;
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-[color:var(--color-line)] md:block">
        <table className="w-full border-collapse">
          <thead className="border-b border-[color:var(--color-line)] bg-surface"><tr>
            <th className={th}>Contact</th><th className={th}>Intent & signals</th><th className={th}>What they need</th><th className={th}>Contactability</th><th className={th}>Funnel</th><th className={th}>Activity (IST)</th><th className={th}><span className="sr-only">Action</span></th>
          </tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[color:var(--color-line)] transition-colors last:border-0 hover:bg-white/[0.025]">
                <td className={`${td} max-w-[15rem]`}><p className="break-words font-medium text-ink">{row.fullName || 'Name not captured'}</p><p className="mt-1 break-all text-xs text-muted">{row.originalEmail}</p>{row.phoneE164 ? <p className="mt-1.5 whitespace-nowrap text-xs text-muted">{row.phoneE164}</p> : <p className="mt-1.5 text-xs text-faint">No phone</p>}</td>
                <td className={td}><Badge>{row.role ? roleLabels[row.role] : 'Not selected'}</Badge><LeadSignals row={row} /></td>
                <td className={`${td} min-w-[19rem]`}><NeedSummary row={row} /></td>
                <td className={td}><Contactability row={row} /></td>
                <td className={td}><Badge good={row.completionStatus === 'completed'}>{row.completionStatus.replace('_', ' ')}</Badge><p className="mt-1 text-xs text-faint">{row.lastMeaningfulStep.replaceAll('_', ' ')}</p></td>
                <td className={`${td} min-w-[11rem] text-muted`}><p className="whitespace-nowrap text-xs"><span className="text-faint">Joined</span> {formatIstDateTime(row.createdAt)}</p><p className="mt-1 whitespace-nowrap text-xs"><span className="text-faint">Updated</span> {formatIstDateTime(row.updatedAt)}</p><p className="mt-1.5 text-xs text-faint">{row.utmSource ?? row.source ?? 'Direct / Unknown'}</p></td>
                <td className={td}><button type="button" onClick={() => setSelected(row)} className="rounded-lg border border-[color:var(--color-line)] px-3 py-2 text-sm text-ink hover:border-[color:var(--color-line-strong)]">View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <article key={row.id} className="rounded-xl border border-[color:var(--color-line)] bg-surface p-4">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words text-sm font-medium text-ink">{row.fullName || 'Name not captured'}</p><p className="mt-1 break-all text-xs text-muted">{row.originalEmail}</p>{row.phoneE164 ? <p className="mt-1 text-xs text-muted">{row.phoneE164}</p> : null}<div className="mt-2 flex flex-wrap gap-1.5"><Badge>{row.role ? roleLabels[row.role] : 'Not selected'}</Badge><Badge good={row.completionStatus === 'completed'}>{row.completionStatus.replace('_', ' ')}</Badge></div><LeadSignals row={row} /></div><button type="button" onClick={() => setSelected(row)} className="shrink-0 rounded-lg border border-[color:var(--color-line)] px-3 py-2 text-sm text-ink">View</button></div>
            <div className="mt-3"><NeedSummary row={row} /></div>
            <div className="mt-3"><Contactability row={row} /></div>
            <p className="mt-3 text-xs leading-relaxed text-faint">Joined {formatIstDateTime(row.createdAt)}<br />Updated {formatIstDateTime(row.updatedAt)} · {row.utmSource ?? row.source ?? 'Direct / Unknown'}</p>
          </article>
        ))}
      </div>

      {selected ? <LeadDetailDialog lead={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}

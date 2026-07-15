import Link from 'next/link';
import type {
  AdminLeadRow,
  CountWithPercent,
  DashboardAnalytics,
  WaitlistSummary,
} from '@/lib/db/queries/admin';
import { CATEGORY_GROUP_LABELS, labelFor } from '@/lib/validation/constants';
import { formatIstDateTime, readablePercent } from '@/lib/admin/time';
import { buildNeedSummary } from '@/lib/leads/needs';
import { SummaryCards } from './summary-cards';
import {
  FunnelChart,
  HorizontalBars,
  Panel,
  RoleChart,
  SignupTrend,
  VerificationTable,
} from './analytics-visuals';

function DemandTable({ rows }: { rows: CountWithPercent[] }) {
  if (rows.length === 0) return <p className="admin-empty">No category demand yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="admin-data-table w-full">
        <thead><tr><th>Category</th><th>Leads</th><th>Share</th><th>Custom answers</th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td>{CATEGORY_GROUP_LABELS[row.key as keyof typeof CATEGORY_GROUP_LABELS] ?? row.key}</td>
              <td>{row.count}</td>
              <td>{row.percentage}%</td>
              <td>{row.customCount ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AttributionTable({ title, rows }: { title: string; rows: CountWithPercent[] }) {
  return (
    <Panel title={title} description="Completion is shown against each source or campaign cohort.">
      {rows.length === 0 ? <p className="admin-empty">No attribution data yet.</p> : (
        <div className="overflow-x-auto">
          <table className="admin-data-table w-full">
            <thead><tr><th>{title === 'Source performance' ? 'Source' : 'Campaign'}</th><th>Leads</th><th>Share</th><th>Completed</th><th>Conversion</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td className="font-medium text-ink">{row.key}</td>
                  <td>{row.count}</td><td>{row.percentage}%</td><td>{row.completed ?? 0}</td>
                  <td>{readablePercent(row.completed ?? 0, row.count)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function RecentSignups({ rows }: { rows: AdminLeadRow[] }) {
  const roleLabel = { seeker: 'Seeker', recruiter: 'Recruiter', both: 'Both' } as const;
  if (rows.length === 0) return <p className="admin-empty">No signups yet.</p>;
  return (
    <div className="divide-y divide-[color:var(--color-line)]">
      {rows.map((row) => {
        const need = buildNeedSummary({ role: row.role, seekerNeeds: row.seekerNeeds, recruiterNeeds: row.recruiterNeeds });
        return (
          <article key={row.id} className="grid gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <Link href={`/admin/waitlist?view=leads&q=${encodeURIComponent(row.fullName || row.originalEmail)}`} className="break-words text-sm font-medium text-ink hover:text-accent">
                {row.fullName || 'Name not captured'}
              </Link>
              <p className="mt-1 break-all text-xs text-muted">{row.originalEmail}</p>
              <p className="mt-1 truncate text-xs text-muted">{need.visible.join(', ') || 'No structured needs yet'}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-muted">{row.role ? roleLabel[row.role] : 'Email only'} · {row.completionStatus.replace('_', ' ')}</p>
              <p className="mt-1 text-[11px] text-faint">{formatIstDateTime(row.createdAt)}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function OverviewDashboard({
  summary,
  analytics,
  recentLeads,
}: {
  summary: WaitlistSummary;
  analytics: DashboardAnalytics;
  recentLeads: AdminLeadRow[];
}) {
  return (
    <div className="space-y-4">
      <SummaryCards summary={summary} />

      <Panel
        title="Signup momentum"
        description="Daily lead creation by IST calendar date. Completed and verified series describe the present status of each signup cohort. Units: leads."
      >
        <SignupTrend rows={analytics.trend} period={analytics.trendPeriod} />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel title="Role distribution" description="Actual count and share of every captured email.">
          <RoleChart rows={analytics.roleDistribution} />
        </Panel>
        <Panel title="Completion journey" description="Share of captured emails reaching each stage. Email verification is independent of profile completion.">
          <FunnelChart rows={analytics.completionFunnel} />
        </Panel>
      </div>

      <Panel title="Verification & contactability" description="Ownership verification is distinct from whether contact information was supplied.">
        <VerificationTable rows={analytics.verification} />
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Job-seeker demand"
          description={`Ranked against ${analytics.seekerRelevantLeads} seeker or Both leads. Bars show individual standardized selections.`}
        >
          <HorizontalBars rows={analytics.seekerSelections} labelFor={labelFor} />
          <div className="mt-6 border-t border-[color:var(--color-line)] pt-5">
            <h3 className="mb-3 text-xs font-semibold tracking-wide text-faint uppercase">Category reach & custom demand</h3>
            <DemandTable rows={analytics.seekerGroups} />
          </div>
        </Panel>
        <Panel
          title="Recruiter demand"
          description={`Ranked against ${analytics.recruiterRelevantLeads} recruiter or Both leads. Seeker and recruiter taxonomies stay separate.`}
        >
          <HorizontalBars rows={analytics.recruiterSelections} labelFor={labelFor} />
          <div className="mt-6 border-t border-[color:var(--color-line)] pt-5">
            <h3 className="mb-3 text-xs font-semibold tracking-wide text-faint uppercase">Category reach & custom requests</h3>
            <DemandTable rows={analytics.recruiterGroups} />
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AttributionTable title="Source performance" rows={analytics.sources} />
        <AttributionTable title="Campaign performance" rows={analytics.campaigns} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel
          title="Recent additional comments"
          description={`${summary.withAdditionalContext} leads (${readablePercent(summary.withAdditionalContext, summary.total)}%) left a final comment; ${summary.completedWithAdditionalContext} completed leads include one. No automated classification is applied.`}
        >
          {analytics.recentComments.length === 0 ? <p className="admin-empty">No additional comments yet.</p> : (
            <div className="space-y-3">
              {analytics.recentComments.map((row) => (
                <article key={row.id} className="rounded-xl border border-[color:var(--color-line)] bg-black/10 p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link href={`/admin/waitlist?view=leads&q=${encodeURIComponent(row.fullName || row.email)}`} className="break-words text-xs font-medium text-accent hover:underline">{row.fullName || 'Name not captured'}</Link>
                    <span className="basis-full break-all text-[11px] text-muted">{row.email}</span>
                    <time className="text-[11px] text-faint">{formatIstDateTime(row.createdAt)}</time>
                  </div>
                  <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-muted">{row.comment}</p>
                </article>
              ))}
            </div>
          )}
          <p className="mt-4 text-xs text-faint">{summary.withCustomResponse} leads also supplied section-specific custom requirements.</p>
        </Panel>

        <Panel title="Most recent signups" description="Latest captured leads, ordered by joined time in IST.">
          <RecentSignups rows={recentLeads} />
          <Link href="/admin/waitlist?view=leads" className="mt-5 inline-flex text-xs font-medium text-accent hover:underline">Open all leads →</Link>
        </Panel>
      </div>
    </div>
  );
}

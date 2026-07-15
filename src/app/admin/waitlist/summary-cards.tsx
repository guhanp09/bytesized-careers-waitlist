import type { WaitlistSummary } from '@/lib/db/queries/admin';
import { readablePercent } from '@/lib/admin/time';

interface SummaryCardsProps {
  summary: WaitlistSummary;
}

function Stat({ label, value, detail }: { label: string; value: number; detail?: string }) {
  return (
    <div className="admin-kpi">
      <div className="text-2xl font-semibold tracking-tight text-ink tabular-nums sm:text-[1.65rem]">
        {value.toLocaleString()}
      </div>
      <div className="mt-1 text-xs font-medium text-muted">{label}</div>
      {detail ? <div className="mt-2 text-[11px] text-faint">{detail}</div> : null}
    </div>
  );
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
      <Stat label="Total leads" value={summary.total} />
      <Stat label="New · 7 days" value={summary.new7Days} detail="IST calendar days" />
      <Stat label="New · 30 days" value={summary.new30Days} detail="IST calendar days" />
      <Stat label="Completed" value={summary.completed} detail={`${readablePercent(summary.completed, summary.total)}% of leads`} />
      <Stat label="Partial" value={summary.partial} detail={`${readablePercent(summary.partial, summary.total)}% of leads`} />
      <Stat label="Email only" value={summary.emailOnly} detail={`${readablePercent(summary.emailOnly, summary.total)}% of leads`} />
      <Stat label="Verified email" value={summary.verified} detail={`${readablePercent(summary.verified, summary.total)}% contactable`} />
      <Stat label="Unverified email" value={summary.unverified} detail="Includes pending / bounced" />
      <Stat label="Phone supplied" value={summary.phonePresent} detail={`${readablePercent(summary.phonePresent, summary.total)}% of leads`} />
      <Stat label="Verified phone" value={summary.phoneVerified} />
      <Stat label="Job seekers" value={summary.seekers} />
      <Stat label="Recruiters" value={summary.recruiters} />
      <Stat label="Both" value={summary.both} />
      <Stat label="With comments" value={summary.withAdditionalContext} detail={`${summary.completedWithAdditionalContext} completed · ${readablePercent(summary.withAdditionalContext, summary.total)}% total`} />
      <Stat label="Custom requirements" value={summary.withCustomResponse} detail="Section-specific Other" />
    </div>
  );
}

import type { WaitlistSummary } from '@/lib/db/queries/admin';

interface SummaryCardsProps {
  summary: WaitlistSummary;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[color:var(--color-line)] bg-surface p-4">
      <div className="text-2xl font-semibold tracking-tight text-ink tabular-nums">
        {value.toLocaleString()}
      </div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </div>
  );
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Stat label="Total leads" value={summary.total} />
      <Stat label="Email only" value={summary.emailOnly} />
      <Stat label="Partial" value={summary.partial} />
      <Stat label="Completed" value={summary.completed} />
      <Stat label="WhatsApp consented" value={summary.whatsappConsented} />
      <Stat label="Job seekers" value={summary.seekers} />
      <Stat label="Recruiters" value={summary.recruiters} />
      <Stat label="Both" value={summary.both} />
      <Stat label="Verified" value={summary.verified} />
      <Stat label="Unverified" value={summary.unverified} />
    </div>
  );
}

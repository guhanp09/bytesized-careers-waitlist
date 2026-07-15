import Link from 'next/link';
import type {
  CountWithPercent,
  FunnelStage,
  TrendPeriod,
  TrendPoint,
  VerificationMetric,
} from '@/lib/db/queries/admin';
import { formatIstShortDate, istStartOfDay } from '@/lib/admin/time';

const roleLabels: Record<string, string> = {
  seeker: 'Job seekers',
  recruiter: 'Recruiters',
  both: 'Both',
};

export function Panel({
  title,
  description,
  children,
  className = '',
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`admin-panel min-w-0 ${className}`}>
      <div>
        <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>
        {description ? <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">{description}</p> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function HorizontalBars({
  rows,
  labelFor = (key) => key,
  empty = 'No data in this segment yet.',
}: {
  rows: CountWithPercent[];
  labelFor?: (key: string) => string;
  empty?: string;
}) {
  if (rows.length === 0) return <p className="admin-empty">{empty}</p>;
  const max = Math.max(...rows.map((row) => row.count), 1);
  return (
    <ol className="space-y-3" aria-label="Ranked values">
      {rows.map((row) => (
        <li key={row.key} title={`${labelFor(row.key)}: ${row.count} leads (${row.percentage}%)`}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs">
            <span className="min-w-0 truncate font-medium text-ink">{labelFor(row.key)}</span>
            <span className="shrink-0 tabular-nums text-muted">
              {row.count} <span className="text-faint">· {row.percentage}%</span>
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.055]">
            <div
              className="admin-bar h-full rounded-full bg-accent"
              style={{ width: `${Math.max((row.count / max) * 100, row.count > 0 ? 3 : 0)}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

export function RoleChart({ rows }: { rows: CountWithPercent[] }) {
  return <HorizontalBars rows={rows} labelFor={(key) => roleLabels[key] ?? key} />;
}

function pointsFor(rows: TrendPoint[], key: keyof Pick<TrendPoint, 'total' | 'completed' | 'verified'>, max: number) {
  if (rows.length === 0) return '';
  return rows
    .map((row, index) => {
      const x = rows.length === 1 ? 400 : 48 + (index / (rows.length - 1)) * 720;
      const y = 216 - (row[key] / max) * 176;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

const series = [
  { key: 'total' as const, label: 'All signups', color: '#6f98ff' },
  { key: 'completed' as const, label: 'Completed', color: '#7cd4b2' },
  { key: 'verified' as const, label: 'Email verified', color: '#b0a2ff' },
];

export function SignupTrend({ rows, period }: { rows: TrendPoint[]; period: TrendPeriod }) {
  const maxValue = Math.max(1, ...rows.flatMap((row) => [row.total, row.completed, row.verified]));
  const yMax = maxValue <= 4 ? 4 : Math.ceil(maxValue / 5) * 5;
  const labelEvery = Math.max(1, Math.ceil(rows.length / 5));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-4 text-xs text-muted" aria-label="Chart legend">
          {series.map((item) => (
            <span key={item.key} className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
              {item.label}
            </span>
          ))}
        </div>
        <nav aria-label="Signup trend period" className="flex rounded-lg border border-[color:var(--color-line)] p-0.5 text-xs">
          {(['7', '30', 'all'] as const).map((value) => (
            <Link
              key={value}
              href={`/admin/waitlist?view=overview&period=${value}`}
              aria-current={period === value ? 'page' : undefined}
              className={`rounded-md px-2.5 py-1.5 ${period === value ? 'bg-white/[0.08] text-ink' : 'text-muted hover:text-ink'}`}
            >
              {value === 'all' ? 'All' : `${value}d`}
            </Link>
          ))}
        </nav>
      </div>

      <div className="overflow-x-auto" role="img" aria-label={`Daily signup trend for ${period === 'all' ? 'all time' : `${period} days`}, grouped by Indian Standard Time calendar date`}>
        <svg viewBox="0 0 800 250" className="min-w-[620px]" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((tick) => {
            const y = 216 - (tick / 4) * 176;
            const value = Math.round((tick / 4) * yMax);
            return (
              <g key={tick}>
                <line x1="48" x2="768" y1={y} y2={y} stroke="rgba(255,255,255,.075)" />
                <text x="38" y={y + 4} textAnchor="end" fill="rgba(242,241,237,.48)" fontSize="10">{value}</text>
              </g>
            );
          })}
          <text x="12" y="128" transform="rotate(-90 12 128)" textAnchor="middle" fill="rgba(242,241,237,.42)" fontSize="10">Signups (leads)</text>
          {series.map((item) => (
            <polyline
              key={item.key}
              points={pointsFor(rows, item.key, yMax)}
              fill="none"
              stroke={item.color}
              strokeWidth={item.key === 'total' ? 2.5 : 1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="admin-chart-line"
            />
          ))}
          {rows.map((row, index) => {
            const x = rows.length === 1 ? 400 : 48 + (index / Math.max(1, rows.length - 1)) * 720;
            return (
              <g key={row.date}>
                {(index % labelEvery === 0 || index === rows.length - 1) ? (
                  <text x={x} y="239" textAnchor="middle" fill="rgba(242,241,237,.48)" fontSize="10">
                    {formatIstShortDate(istStartOfDay(row.date))}
                  </text>
                ) : null}
                {series.map((item) => {
                  const y = 216 - (row[item.key] / yMax) * 176;
                  return (
                    <circle key={item.key} cx={x} cy={y} r="8" fill="transparent">
                      <title>{`${row.date} IST — ${item.label}: ${row[item.key]} leads`}</title>
                    </circle>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <details className="admin-data-details">
        <summary>View accessible data table</summary>
        <div className="mt-3 overflow-x-auto">
          <table className="admin-data-table">
            <thead><tr><th>Date (IST)</th><th>All</th><th>Completed</th><th>Verified</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.date}><td>{row.date}</td><td>{row.total}</td><td>{row.completed}</td><td>{row.verified}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export function FunnelChart({ rows }: { rows: FunnelStage[] }) {
  if (rows.every((row) => row.count === 0)) return <p className="admin-empty">No funnel activity yet.</p>;
  return (
    <ol className="space-y-2" aria-label="Waitlist completion funnel">
      {rows.map((row, index) => (
        <li key={row.key} className="grid grid-cols-[1.4rem_minmax(0,1fr)_auto] items-center gap-3">
          <span className="text-center text-[10px] tabular-nums text-faint">{String(index + 1).padStart(2, '0')}</span>
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2 text-xs">
              <span className="font-medium text-ink">{row.label}{row.note ? <span className="ml-1 font-normal text-faint">({row.note})</span> : null}</span>
              <span className="tabular-nums text-muted">{row.count} · {row.percentage}%</span>
            </div>
            <div className="h-5 overflow-hidden rounded-md bg-white/[0.045]">
              <div className="admin-bar h-full rounded-md border-r border-accent/50 bg-accent/15" style={{ width: `${row.percentage}%` }} />
            </div>
          </div>
          <span className="sr-only">{row.count} leads, {row.percentage}% of captured emails</span>
        </li>
      ))}
    </ol>
  );
}

export function VerificationTable({ rows }: { rows: VerificationMetric[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="admin-data-table w-full">
        <thead><tr><th>Contactability signal</th><th>Leads</th><th>Share</th></tr></thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.key}-${index}`}>
              <td>{row.label}</td><td>{row.count}</td><td>{row.percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

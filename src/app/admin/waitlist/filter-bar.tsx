import Link from 'next/link';
import type { LeadFilters } from '@/lib/db/queries/admin';
import { filtersToQuery } from '@/lib/admin/filters';
import { CATEGORY_VALUES, CATEGORY_LABELS } from '@/lib/validation/constants';

interface FilterBarProps {
  filters: LeadFilters;
}

const selectClass =
  'h-10 rounded-lg border border-[color:var(--color-line)] bg-surface px-3 text-sm text-ink focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/**
 * Server-rendered filter form (plan §15). Uses a GET form so filters sync to the URL with
 * no client JS; the same query string powers the CSV export link, so export always reflects
 * the active filters.
 */
export function FilterBar({ filters }: FilterBarProps) {
  const exportHref = `/api/admin/waitlist/export?${filtersToQuery(filters)}`;

  return (
    <form
      method="get"
      action="/admin/waitlist"
      className="flex flex-wrap items-end gap-3 rounded-xl border border-[color:var(--color-line)] bg-surface/50 p-4"
    >
      <label className="flex flex-col gap-1 text-xs text-muted">
        Search email
        <input
          type="search"
          name="q"
          defaultValue={filters.q ?? ''}
          placeholder="email contains…"
          className={selectClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-muted">
        Role
        <select name="role" defaultValue={filters.role ?? ''} className={selectClass}>
          <option value="">Any</option>
          <option value="seeker">Job seeker</option>
          <option value="recruiter">Recruiter</option>
          <option value="both">Both</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-muted">
        Completion
        <select
          name="completion"
          defaultValue={filters.completion ?? ''}
          className={selectClass}
        >
          <option value="">Any</option>
          <option value="email_only">Email only</option>
          <option value="partial">Partial</option>
          <option value="completed">Completed</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-muted">
        Verification
        <select
          name="verification"
          defaultValue={filters.verification ?? ''}
          className={selectClass}
        >
          <option value="">Any</option>
          <option value="unverified">Unverified</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="bounced">Bounced</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-muted">
        WhatsApp
        <select
          name="whatsappConsent"
          defaultValue={
            typeof filters.whatsappConsent === 'boolean'
              ? String(filters.whatsappConsent)
              : ''
          }
          className={selectClass}
        >
          <option value="">Any</option>
          <option value="true">Consented</option>
          <option value="false">Not consented</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-muted">
        Interest
        <select
          name="category"
          defaultValue={filters.category ?? ''}
          className={selectClass}
        >
          <option value="">Any</option>
          {CATEGORY_VALUES.map((value) => (
            <option key={value} value={value}>
              {CATEGORY_LABELS[value]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-muted">
        From
        <input
          type="date"
          name="dateFrom"
          defaultValue={filters.dateFrom ?? ''}
          className={selectClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-muted">
        To
        <input
          type="date"
          name="dateTo"
          defaultValue={filters.dateTo ?? ''}
          className={selectClass}
        />
      </label>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="h-10 rounded-lg bg-accent px-4 text-sm font-medium text-accent-contrast hover:bg-accent-strong"
        >
          Apply
        </button>
        <Link
          href="/admin/waitlist"
          className="h-10 rounded-lg px-3 text-sm leading-10 text-muted hover:text-ink"
        >
          Clear
        </Link>
        <a
          href={exportHref}
          className="h-10 rounded-lg border border-[color:var(--color-line)] px-4 text-sm leading-10 text-ink hover:border-[color:var(--color-line-strong)]"
        >
          Export CSV
        </a>
      </div>
    </form>
  );
}

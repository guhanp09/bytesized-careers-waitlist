import Link from 'next/link';
import type { LeadFilters } from '@/lib/db/queries/admin';
import { filtersToQuery } from '@/lib/admin/filters';
import {
  CATEGORY_GROUP_IDS,
  CATEGORY_GROUP_LABELS,
  JOB_CATEGORY_GROUPS,
  JOB_CATEGORY_LABELS,
  TALENT_CATEGORY_GROUPS,
  TALENT_CATEGORY_LABELS,
} from '@/lib/validation/constants';
import { FilterSearch } from './filter-search';

interface FilterBarProps {
  filters: LeadFilters;
  sources: string[];
  campaigns: string[];
}

const controlClass =
  'h-10 w-full rounded-lg border border-[color:var(--color-line)] bg-surface px-3 text-sm text-ink focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const fieldClass = 'flex min-w-0 flex-col gap-1 text-xs text-muted';

function BooleanOptions({ yes, no }: { yes: string; no: string }) {
  return (
    <>
      <option value="">Any</option>
      <option value="true">{yes}</option>
      <option value="false">{no}</option>
    </>
  );
}

export function FilterBar({ filters, sources, campaigns }: FilterBarProps) {
  const exportHref = `/api/admin/waitlist/export?${filtersToQuery(filters)}`;
  const activeFilters = [
    filters.role && `Intent: ${filters.role}`,
    filters.completion && `Funnel: ${filters.completion.replace('_', ' ')}`,
    filters.verification && `Email: ${filters.verification}`,
    filters.phonePresent !== undefined && `Phone: ${filters.phonePresent ? 'present' : 'absent'}`,
    filters.phoneVerified !== undefined && `Phone verification (legacy): ${filters.phoneVerified ? "verified" : "not verified"}`,
    filters.seekerGroup && `Seeker: ${CATEGORY_GROUP_LABELS[filters.seekerGroup as keyof typeof CATEGORY_GROUP_LABELS] ?? filters.seekerGroup}`,
    filters.seekerNeed && `Seeker work: ${JOB_CATEGORY_LABELS[filters.seekerNeed as keyof typeof JOB_CATEGORY_LABELS] ?? filters.seekerNeed}`,
    filters.recruiterGroup && `Recruiter: ${CATEGORY_GROUP_LABELS[filters.recruiterGroup as keyof typeof CATEGORY_GROUP_LABELS] ?? filters.recruiterGroup}`,
    filters.recruiterNeed && `Talent: ${TALENT_CATEGORY_LABELS[filters.recruiterNeed as keyof typeof TALENT_CATEGORY_LABELS] ?? filters.recruiterNeed}`,
    filters.hasCustomResponse !== undefined && (filters.hasCustomResponse ? 'Has custom requirement' : 'No custom requirement'),
    filters.hasAdditionalContext !== undefined && (filters.hasAdditionalContext ? 'Has comments' : 'No comments'),
    filters.source && `Source: ${filters.source}`,
    filters.utmCampaign && `Campaign: ${filters.utmCampaign}`,
    filters.dateFrom && `Joined from ${filters.dateFrom} IST`,
    filters.dateTo && `Joined through ${filters.dateTo} IST`,
    filters.updatedFrom && `Updated from ${filters.updatedFrom} IST`,
    filters.updatedTo && `Updated through ${filters.updatedTo} IST`,
    filters.q && `Search: “${filters.q}”`,
  ].filter((value): value is string => Boolean(value));

  return (
    <form
      method="get"
      action="/admin/waitlist"
      className="rounded-xl border border-[color:var(--color-line)] bg-surface/55 p-4"
    >
      <input type="hidden" name="view" value="leads" />
      {activeFilters.length > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-1.5" aria-label="Active filters">
          <span className="mr-1 text-[11px] font-medium tracking-wide text-faint uppercase">Active</span>
          {activeFilters.map((filter) => <span key={filter} className="admin-filter-chip">{filter}</span>)}
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className={fieldClass}>
          Search all submitted data
          <FilterSearch defaultValue={filters.q ?? ''} className={controlClass} />
        </label>
        <label className={fieldClass}>
          Intent
          <select name="role" defaultValue={filters.role ?? ''} className={controlClass}>
            <option value="">Any</option>
            <option value="seeker">Job seeker</option>
            <option value="recruiter">Recruiter</option>
            <option value="both">Both</option>
          </select>
        </label>
        <label className={fieldClass}>
          Funnel
          <select name="completion" defaultValue={filters.completion ?? ''} className={controlClass}>
            <option value="">Any</option>
            <option value="email_only">Email only</option>
            <option value="partial">Partial</option>
            <option value="completed">Completed</option>
          </select>
        </label>
        <label className={fieldClass}>
          Email verification
          <select name="verification" defaultValue={filters.verification ?? ''} className={controlClass}>
            <option value="">Any</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="unverified">Unverified</option>
            <option value="bounced">Bounced</option>
          </select>
        </label>
        <label className={fieldClass}>
          Sort leads
          <select name="sort" defaultValue={filters.sort ?? 'newest'} className={controlClass}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name_asc">Name A–Z</option>
            <option value="name_desc">Name Z–A</option>
          </select>
        </label>

        <label className={fieldClass}>
          Seeker category
          <select name="seekerGroup" defaultValue={filters.seekerGroup ?? ''} className={controlClass}>
            <option value="">Any</option>
            {CATEGORY_GROUP_IDS.map((id) => (
              <option key={id} value={id}>{CATEGORY_GROUP_LABELS[id]}</option>
            ))}
          </select>
        </label>
        <label className={fieldClass}>
          Seeker work
          <select name="seekerNeed" defaultValue={filters.seekerNeed ?? ''} className={controlClass}>
            <option value="">Any</option>
            {JOB_CATEGORY_GROUPS.map((group) => (
              <optgroup key={group.id} label={group.label}>
                {group.values.map((value) => (
                  <option key={value} value={value}>{JOB_CATEGORY_LABELS[value]}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className={fieldClass}>
          Talent category
          <select name="recruiterGroup" defaultValue={filters.recruiterGroup ?? ''} className={controlClass}>
            <option value="">Any</option>
            {CATEGORY_GROUP_IDS.map((id) => (
              <option key={id} value={id}>{CATEGORY_GROUP_LABELS[id]}</option>
            ))}
          </select>
        </label>
        <label className={fieldClass}>
          Talent type
          <select name="recruiterNeed" defaultValue={filters.recruiterNeed ?? ''} className={controlClass}>
            <option value="">Any</option>
            {TALENT_CATEGORY_GROUPS.map((group) => (
              <optgroup key={group.id} label={group.label}>
                {group.values.map((value) => (
                  <option key={value} value={value}>{TALENT_CATEGORY_LABELS[value]}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

      <details className="mt-3 rounded-lg border border-[color:var(--color-line)] px-3 py-2">
        <summary className="text-sm font-medium text-muted">More segmentation</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className={fieldClass}>
            Phone supplied
            <select name="phonePresent" defaultValue={filters.phonePresent === undefined ? '' : String(filters.phonePresent)} className={controlClass}>
              <BooleanOptions yes="Present" no="Absent" />
            </select>
          </label>
          <label className={fieldClass}>
            Phone verification (legacy)
            <select name="phoneVerified" defaultValue={filters.phoneVerified === undefined ? '' : String(filters.phoneVerified)} className={controlClass}>
              <BooleanOptions yes="Verified" no="Not verified" />
            </select>
          </label>
          <label className={fieldClass}>
            Custom response
            <select name="hasCustomResponse" defaultValue={filters.hasCustomResponse === undefined ? '' : String(filters.hasCustomResponse)} className={controlClass}>
              <BooleanOptions yes="Has custom detail" no="No custom detail" />
            </select>
          </label>
          <label className={fieldClass}>
            Final context
            <select name="hasAdditionalContext" defaultValue={filters.hasAdditionalContext === undefined ? '' : String(filters.hasAdditionalContext)} className={controlClass}>
              <BooleanOptions yes="Has context" no="No context" />
            </select>
          </label>
          <label className={fieldClass}>
            Source
            <select name="source" defaultValue={filters.source ?? ''} className={controlClass}>
              <option value="">Any</option>
              {sources.map((source) => <option key={source} value={source}>{source}</option>)}
            </select>
          </label>
          <label className={fieldClass}>
            UTM campaign
            <select name="utmCampaign" defaultValue={filters.utmCampaign ?? ''} className={controlClass}>
              <option value="">Any</option>
              {campaigns.map((campaign) => <option key={campaign} value={campaign}>{campaign}</option>)}
            </select>
          </label>
          <label className={fieldClass}>
            Joined from (IST)
            <input type="date" name="dateFrom" defaultValue={filters.dateFrom ?? ''} className={controlClass} />
          </label>
          <label className={fieldClass}>
            Joined through (IST)
            <input type="date" name="dateTo" defaultValue={filters.dateTo ?? ''} className={controlClass} />
          </label>
          <label className={fieldClass}>
            Updated from (IST)
            <input type="date" name="updatedFrom" defaultValue={filters.updatedFrom ?? ''} className={controlClass} />
          </label>
          <label className={fieldClass}>
            Updated through (IST)
            <input type="date" name="updatedTo" defaultValue={filters.updatedTo ?? ''} className={controlClass} />
          </label>
        </div>
      </details>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="submit" className="h-10 rounded-lg bg-accent px-4 text-sm font-medium text-accent-contrast hover:bg-accent-strong">
          Apply filters
        </button>
        <Link href="/admin/waitlist?view=leads" className="h-10 rounded-lg px-3 text-sm leading-10 text-muted hover:text-ink">
          Reset filters
        </Link>
        <a href={exportHref} className="ml-auto h-10 rounded-lg border border-[color:var(--color-line)] px-4 text-sm leading-10 text-ink hover:border-[color:var(--color-line-strong)]">
          Export filtered CSV
        </a>
      </div>
    </form>
  );
}

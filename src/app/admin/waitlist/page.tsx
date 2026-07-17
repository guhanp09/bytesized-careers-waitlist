import Link from 'next/link';
import { auth, isAllowedAdmin, signOut } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { localAdminPreviewAllowed } from '@/lib/auth/local-preview';
import {
  getAdminFilterOptions,
  getDashboardAnalytics,
  getWaitlistSummary,
  listLeads,
  type TrendPeriod,
} from '@/lib/db/queries/admin';
import { parseLeadFilters, filtersToQuery } from '@/lib/admin/filters';
import { FilterBar } from './filter-bar';
import { OverviewDashboard } from './overview-dashboard';
import { WaitlistTable } from './waitlist-table';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminWaitlistPage({ searchParams }: PageProps) {
  const session = await auth();
  const preview = localAdminPreviewAllowed((await headers()).get('host'));
  if (!isAllowedAdmin(session) && !preview) redirect('/admin/login');

  const sp = await searchParams;
  const view = first(sp.view) === 'leads' ? 'leads' : 'overview';
  const periodValue = first(sp.period);
  const period: TrendPeriod = periodValue === '7' || periodValue === 'all' ? periodValue : '30';
  const login = (session?.user as { login?: string } | undefined)?.login;

  let content: React.ReactNode;
  if (view === 'overview') {
    const [summary, analytics, recent] = await Promise.all([
      getWaitlistSummary(),
      getDashboardAnalytics(period),
      listLeads({}, 6, 0),
    ]);
    content = <OverviewDashboard summary={summary} analytics={analytics} recentLeads={recent.rows} />;
  } else {
    const filters = parseLeadFilters(sp);
    const pageParam = first(sp.page);
    const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);
    const offset = (page - 1) * PAGE_SIZE;
    const [list, options] = await Promise.all([
      listLeads(filters, PAGE_SIZE, offset),
      getAdminFilterOptions(filters.attributionModel ?? 'first'),
    ]);
    const totalPages = Math.max(1, Math.ceil(list.total / PAGE_SIZE));
    const query = filtersToQuery(filters);
    const pageHref = (value: number) =>
      `/admin/waitlist?view=leads${query ? `&${query}` : ''}&page=${value}`;

    content = (
      <div>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">Individual leads</h2>
            <p className="mt-1 text-xs text-muted">Search submitted needs and contact details, then open a lead for the full story.</p>
          </div>
          <p className="text-sm tabular-nums text-muted">{list.total.toLocaleString()} matching lead{list.total === 1 ? '' : 's'}</p>
        </div>
        <FilterBar
          filters={filters}
          sources={options.sources}
          mediums={options.mediums}
          campaigns={options.campaigns}
        />

        <div className="mt-4 flex items-center justify-between text-xs text-faint">
          <p>Times shown in Asia/Kolkata (IST)</p>
          <p>Page {page} of {totalPages}</p>
        </div>
        <div className="mt-2"><WaitlistTable rows={list.rows} /></div>

        {totalPages > 1 ? (
          <nav aria-label="Lead list pagination" className="mt-4 flex items-center justify-center gap-2">
            {page > 1 ? <Link href={pageHref(page - 1)} className="admin-secondary-button">← Previous</Link> : null}
            {page < totalPages ? <Link href={pageHref(page + 1)} className="admin-secondary-button">Next →</Link> : null}
          </nav>
        ) : null}
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-5 border-b border-[color:var(--color-line)] pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-accent uppercase">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
            ByteSized Careers · Admin
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-ink sm:text-3xl">Waitlist intelligence</h1>
          <p className="mt-1.5 text-sm text-muted">Launch planning, demand signals, and every lead in one calm operating view.</p>
        </div>
        <div className="flex items-center gap-3">
          {login ? <span className="hidden text-xs text-faint sm:inline">Signed in as {login}</span> : preview ? <span className="hidden text-xs text-faint sm:inline">Local preview · development only</span> : null}
          {login ? (
            <form action={async () => { 'use server'; await signOut({ redirectTo: '/admin/login' }); }}>
              <button type="submit" className="admin-secondary-button">Sign out</button>
            </form>
          ) : null}
        </div>
      </header>

      <nav aria-label="Waitlist dashboard views" className="my-5 flex w-fit rounded-xl border border-[color:var(--color-line)] bg-surface/60 p-1" role="tablist">
        <Link
          href="/admin/waitlist?view=overview"
          role="tab"
          aria-selected={view === 'overview'}
          className={`admin-view-tab ${view === 'overview' ? 'admin-view-tab-active' : ''}`}
        >Overview</Link>
        <Link
          href="/admin/waitlist?view=leads"
          role="tab"
          aria-selected={view === 'leads'}
          className={`admin-view-tab ${view === 'leads' ? 'admin-view-tab-active' : ''}`}
        >Leads</Link>
      </nav>

      {content}
    </main>
  );
}

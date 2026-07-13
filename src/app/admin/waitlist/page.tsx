import Link from 'next/link';
import { auth, isAllowedAdmin, signOut } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import {
  getWaitlistSummary,
  getCategoryBreakdown,
  getSourceBreakdown,
  listLeads,
} from '@/lib/db/queries/admin';
import { parseLeadFilters, filtersToQuery } from '@/lib/admin/filters';
import { CATEGORY_LABELS, type Category } from '@/lib/validation/constants';
import { SummaryCards } from './summary-cards';
import { FilterBar } from './filter-bar';
import { WaitlistTable } from './waitlist-table';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function Breakdown({
  title,
  rows,
  labeler,
}: {
  title: string;
  rows: { key: string; count: number }[];
  labeler?: (key: string) => string;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--color-line)] bg-surface p-4">
      <h2 className="text-xs font-medium tracking-wide text-muted uppercase">
        {title}
      </h2>
      <ul className="mt-3 flex flex-col gap-1.5">
        {rows.slice(0, 6).map((row) => (
          <li key={row.key} className="flex justify-between text-sm">
            <span className="text-ink">
              {labeler ? labeler(row.key) : row.key}
            </span>
            <span className="tabular-nums text-muted">{row.count}</span>
          </li>
        ))}
        {rows.length === 0 && <li className="text-sm text-muted">No data yet</li>}
      </ul>
    </div>
  );
}

export default async function AdminWaitlistPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!isAllowedAdmin(session)) {
    redirect('/admin/login');
  }

  const sp = await searchParams;
  const filters = parseLeadFilters(sp);
  const pageParam = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [summary, categories, sources, list] = await Promise.all([
    getWaitlistSummary(),
    getCategoryBreakdown(),
    getSourceBreakdown(),
    listLeads(filters, PAGE_SIZE, offset),
  ]);

  const totalPages = Math.max(1, Math.ceil(list.total / PAGE_SIZE));
  const query = filtersToQuery(filters);
  const pageHref = (p: number) =>
    `/admin/waitlist?${query}${query ? '&' : ''}page=${p}`;

  const login = (session?.user as { login?: string } | undefined)?.login;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Waitlist
          </h1>
          {login ? (
            <p className="mt-1 text-sm text-muted">Signed in as {login}</p>
          ) : null}
        </div>
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/admin/login' });
          }}
        >
          <button
            type="submit"
            className="h-10 rounded-lg border border-[color:var(--color-line)] px-4 text-sm text-muted hover:text-ink"
          >
            Sign out
          </button>
        </form>
      </header>

      <div className="mt-6">
        <SummaryCards summary={summary} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Breakdown
          title="Top interests"
          rows={categories}
          labeler={(key) => CATEGORY_LABELS[key as Category] ?? key}
        />
        <Breakdown title="Top sources" rows={sources} />
      </div>

      <div className="mt-6">
        <FilterBar filters={filters} />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted">
          {list.total.toLocaleString()} result{list.total === 1 ? '' : 's'}
        </p>
        <p className="text-sm text-muted">
          Page {page} of {totalPages}
        </p>
      </div>

      <div className="mt-2">
        <WaitlistTable rows={list.rows} />
      </div>

      {totalPages > 1 && (
        <nav className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={pageHref(page - 1)}
              className="rounded-lg border border-[color:var(--color-line)] px-4 py-2 text-sm text-ink hover:border-[color:var(--color-line-strong)]"
            >
              ← Prev
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={pageHref(page + 1)}
              className="rounded-lg border border-[color:var(--color-line)] px-4 py-2 text-sm text-ink hover:border-[color:var(--color-line-strong)]"
            >
              Next →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

import type { NextRequest } from 'next/server';
import { auth, isAllowedAdmin } from '@/lib/auth/config';
import { listLeadsForExport } from '@/lib/db/queries/admin';
import { parseLeadFilters } from '@/lib/admin/filters';
import { toCsv } from '@/lib/admin/csv';
import { istDateKey } from '@/lib/admin/time';
import { localAdminPreviewAllowed } from '@/lib/auth/local-preview';

/**
 * CSV export of the current filtered view (plan §15). This is the ONE place raw contact
 * data leaves the DB, so it independently re-verifies auth + allowlist as its first line —
 * it never trusts that only the dashboard links here.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!isAllowedAdmin(session) && !localAdminPreviewAllowed(req.headers.get('host'))) {
    return new Response('Unauthorized', { status: 401 });
  }

  const filters = parseLeadFilters(
    Object.fromEntries(req.nextUrl.searchParams.entries()),
  );
  const rows = await listLeadsForExport(filters);
  const csv = toCsv(rows);
  const date = istDateKey(new Date());

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="waitlist-export-${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}

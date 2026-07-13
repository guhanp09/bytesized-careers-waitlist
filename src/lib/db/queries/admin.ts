import 'server-only';
import { and, desc, eq, gte, ilike, lte, or, sql, type SQL } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { waitlistLeads } from '@/lib/db/schema';
import type { Role, CompletionStatus } from '@/types/waitlist';

/** Filters shared by the admin table and the CSV export, so both reflect the same view. */
export interface LeadFilters {
  role?: Role;
  category?: string;
  whatsappConsent?: boolean;
  completion?: CompletionStatus;
  verification?: string;
  dateFrom?: string;
  dateTo?: string;
  q?: string;
}

function buildWhere(filters: LeadFilters): SQL | undefined {
  const conditions: SQL[] = [];

  if (filters.role) conditions.push(eq(waitlistLeads.role, filters.role));
  if (filters.completion) {
    conditions.push(eq(waitlistLeads.completionStatus, filters.completion));
  }
  if (filters.verification) {
    conditions.push(
      sql`${waitlistLeads.emailVerificationStatus} = ${filters.verification}`,
    );
  }
  if (typeof filters.whatsappConsent === 'boolean') {
    conditions.push(eq(waitlistLeads.whatsappConsent, filters.whatsappConsent));
  }
  if (filters.category) {
    const match = or(
      sql`${waitlistLeads.jobCategories} @> ARRAY[${filters.category}]::text[]`,
      sql`${waitlistLeads.talentCategories} @> ARRAY[${filters.category}]::text[]`,
    );
    if (match) conditions.push(match);
  }
  if (filters.dateFrom) {
    conditions.push(gte(waitlistLeads.createdAt, new Date(filters.dateFrom)));
  }
  if (filters.dateTo) {
    conditions.push(lte(waitlistLeads.createdAt, new Date(filters.dateTo)));
  }
  if (filters.q) {
    conditions.push(ilike(waitlistLeads.normalizedEmail, `%${filters.q}%`));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

export interface WaitlistSummary {
  total: number;
  emailOnly: number;
  partial: number;
  completed: number;
  seekers: number;
  recruiters: number;
  both: number;
  whatsappConsented: number;
  verified: number;
  unverified: number;
}

/** Single-round-trip summary counts (plan §15). */
export async function getWaitlistSummary(): Promise<WaitlistSummary> {
  const db = getDb();
  const rows = await db
    .select({
      total: sql<number>`cast(count(*) as int)`,
      emailOnly: sql<number>`cast(count(*) filter (where ${waitlistLeads.completionStatus} = 'email_only') as int)`,
      partial: sql<number>`cast(count(*) filter (where ${waitlistLeads.completionStatus} = 'partial') as int)`,
      completed: sql<number>`cast(count(*) filter (where ${waitlistLeads.completionStatus} = 'completed') as int)`,
      seekers: sql<number>`cast(count(*) filter (where ${waitlistLeads.role} = 'seeker') as int)`,
      recruiters: sql<number>`cast(count(*) filter (where ${waitlistLeads.role} = 'recruiter') as int)`,
      both: sql<number>`cast(count(*) filter (where ${waitlistLeads.role} = 'both') as int)`,
      whatsappConsented: sql<number>`cast(count(*) filter (where ${waitlistLeads.whatsappConsent}) as int)`,
      verified: sql<number>`cast(count(*) filter (where ${waitlistLeads.emailVerificationStatus} = 'verified') as int)`,
      unverified: sql<number>`cast(count(*) filter (where ${waitlistLeads.emailVerificationStatus} <> 'verified') as int)`,
    })
    .from(waitlistLeads);

  return (
    rows[0] ?? {
      total: 0,
      emailOnly: 0,
      partial: 0,
      completed: 0,
      seekers: 0,
      recruiters: 0,
      both: 0,
      whatsappConsented: 0,
      verified: 0,
      unverified: 0,
    }
  );
}

export interface Breakdown {
  key: string;
  count: number;
}

/** Category breakdown across job + talent selections (plan §15). */
export async function getCategoryBreakdown(): Promise<Breakdown[]> {
  const db = getDb();
  const rows = await db.execute<{ key: string; count: number }>(sql`
    select cat as key, cast(count(*) as int) as count
    from (
      select unnest(${waitlistLeads.jobCategories}) as cat from ${waitlistLeads}
      union all
      select unnest(${waitlistLeads.talentCategories}) as cat from ${waitlistLeads}
    ) t
    group by cat
    order by count desc
  `);
  return normalizeRows(rows);
}

/** Source breakdown (utm_source, 'direct' when null). */
export async function getSourceBreakdown(): Promise<Breakdown[]> {
  const db = getDb();
  const rows = await db.execute<{ key: string; count: number }>(sql`
    select coalesce(${waitlistLeads.utmSource}, 'direct') as key, cast(count(*) as int) as count
    from ${waitlistLeads}
    group by 1
    order by count desc
  `);
  return normalizeRows(rows);
}

/** Daily signup timeline for the last 30 days. */
export async function getSignupTimeline(): Promise<Breakdown[]> {
  const db = getDb();
  const rows = await db.execute<{ key: string; count: number }>(sql`
    select to_char(date_trunc('day', ${waitlistLeads.createdAt}), 'YYYY-MM-DD') as key,
           cast(count(*) as int) as count
    from ${waitlistLeads}
    where ${waitlistLeads.createdAt} >= now() - interval '30 days'
    group by 1
    order by 1 asc
  `);
  return normalizeRows(rows);
}

// db.execute returns different shapes across drivers (array vs { rows }). Normalize both.
function normalizeRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === 'object' && 'rows' in result) {
    return (result as { rows: T[] }).rows;
  }
  return [];
}

export type AdminLeadRow = {
  id: string;
  originalEmail: string;
  role: Role | null;
  completionStatus: CompletionStatus;
  emailVerificationStatus: string;
  jobCategories: string[];
  talentCategories: string[];
  workFormats: string[];
  organisationTypes: string[];
  phoneE164: string | null;
  whatsappConsent: boolean;
  utmSource: string | null;
  createdAt: Date;
};

const LEAD_COLUMNS = {
  id: waitlistLeads.id,
  originalEmail: waitlistLeads.originalEmail,
  role: waitlistLeads.role,
  completionStatus: waitlistLeads.completionStatus,
  emailVerificationStatus: waitlistLeads.emailVerificationStatus,
  jobCategories: waitlistLeads.jobCategories,
  talentCategories: waitlistLeads.talentCategories,
  workFormats: waitlistLeads.workFormats,
  organisationTypes: waitlistLeads.organisationTypes,
  phoneE164: waitlistLeads.phoneE164,
  whatsappConsent: waitlistLeads.whatsappConsent,
  utmSource: waitlistLeads.utmSource,
  createdAt: waitlistLeads.createdAt,
} as const;

/** Filtered, paginated lead list for the table (plan §15). */
export async function listLeads(
  filters: LeadFilters,
  limit = 50,
  offset = 0,
): Promise<{ rows: AdminLeadRow[]; total: number }> {
  const db = getDb();
  const where = buildWhere(filters);

  const rows = await db
    .select(LEAD_COLUMNS)
    .from(waitlistLeads)
    .where(where)
    .orderBy(desc(waitlistLeads.createdAt))
    .limit(limit)
    .offset(offset);

  const countRows = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(waitlistLeads)
    .where(where);

  return { rows, total: countRows[0]?.count ?? 0 };
}

/** Full filtered result set for CSV export (no pagination). */
export async function listLeadsForExport(
  filters: LeadFilters,
): Promise<AdminLeadRow[]> {
  const db = getDb();
  return db
    .select(LEAD_COLUMNS)
    .from(waitlistLeads)
    .where(buildWhere(filters))
    .orderBy(desc(waitlistLeads.createdAt));
}

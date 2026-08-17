import 'server-only';
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  isNull,
  lt,
  or,
  sql,
  type SQL,
  type SQLWrapper,
} from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { waitlistLeads } from '@/lib/db/schema';
import { normalizeNeedProfile } from '@/lib/leads/needs';
import {
  istDateKey,
  istEndOfDayExclusive,
  istStartOfDay,
  readablePercent,
  shiftIstDateKey,
} from '@/lib/admin/time';
import type { NeedProfileV1 } from '@/types/lead-domain';
import type { Role, CompletionStatus } from '@/types/waitlist';
import type { AttributionTouchV1 } from '@/lib/attribution/campaign';

export type AttributionModel = 'first' | 'last';

/** Filters shared by the admin list and CSV export. */
export interface LeadFilters {
  sort?: 'newest' | 'oldest' | 'name_asc' | 'name_desc';
  role?: Role;
  completion?: CompletionStatus;
  verification?: 'unverified' | 'pending' | 'verified' | 'bounced';
  phonePresent?: boolean;
  phoneVerified?: boolean;
  seekerGroup?: string;
  seekerNeed?: string;
  recruiterGroup?: string;
  recruiterNeed?: string;
  hasCustomResponse?: boolean;
  hasAdditionalContext?: boolean;
  source?: string;
  medium?: string;
  utmCampaign?: string;
  attributionModel?: AttributionModel;
  dateFrom?: string;
  dateTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
  q?: string;
}

function jsonContains(column: SQLWrapper, value: unknown) {
  return sql`${column} @> ${JSON.stringify(value)}::jsonb`;
}

function hasCustom(column: SQLWrapper): SQL {
  return sql`exists (
    select 1
    from jsonb_array_elements(${column}->'groups') as need_group
    where length(trim(coalesce(need_group->>'customResponse', ''))) > 0
  )`;
}

function attributionValue(
  model: AttributionModel,
  field: 'source' | 'medium' | 'campaign',
): SQL<string> {
  const structured =
    model === 'first'
      ? waitlistLeads.firstTouchAttribution
      : waitlistLeads.lastTouchAttribution;
  if (model === 'first' && field === 'source') {
    return sql`coalesce(nullif(trim(${structured}->>'source'), ''), nullif(trim(${waitlistLeads.utmSource}), ''), nullif(trim(${waitlistLeads.source}), ''), 'Legacy / Unknown')`;
  }
  if (model === 'first' && field === 'medium') {
    return sql`coalesce(nullif(trim(${structured}->>'medium'), ''), nullif(trim(${waitlistLeads.utmMedium}), ''), 'Not provided')`;
  }
  if (model === 'first' && field === 'campaign') {
    return sql`coalesce(nullif(trim(${structured}->>'campaign'), ''), nullif(trim(${waitlistLeads.utmCampaign}), ''), 'Not provided')`;
  }
  if (field === 'source') {
    return sql`coalesce(nullif(trim(${structured}->>'source'), ''), 'Legacy / Unknown')`;
  }
  if (field === 'medium') {
    return sql`coalesce(nullif(trim(${structured}->>'medium'), ''), 'Not provided')`;
  }
  return sql`coalesce(nullif(trim(${structured}->>'campaign'), ''), 'Not provided')`;
}

function buildWhere(filters: LeadFilters): SQL | undefined {
  const conditions: SQL[] = [];
  const attributionModel = filters.attributionModel ?? 'first';

  if (filters.role) conditions.push(eq(waitlistLeads.role, filters.role));
  if (filters.completion) {
    conditions.push(eq(waitlistLeads.completionStatus, filters.completion));
  }
  if (filters.verification) {
    conditions.push(eq(waitlistLeads.emailVerificationStatus, filters.verification));
  }
  if (typeof filters.phonePresent === 'boolean') {
    conditions.push(
      filters.phonePresent
        ? isNotNull(waitlistLeads.phoneE164)
        : isNull(waitlistLeads.phoneE164),
    );
  }
  if (typeof filters.phoneVerified === 'boolean') {
    conditions.push(
      filters.phoneVerified
        ? eq(waitlistLeads.phoneVerificationStatus, 'verified')
        : sql`${waitlistLeads.phoneVerificationStatus} <> 'verified'`,
    );
  }
  if (filters.seekerGroup) {
    conditions.push(
      jsonContains(waitlistLeads.seekerNeeds, {
        groups: [{ id: filters.seekerGroup }],
      }),
    );
  }
  if (filters.seekerNeed) {
    conditions.push(
      jsonContains(waitlistLeads.seekerNeeds, {
        groups: [{ selections: [filters.seekerNeed] }],
      }),
    );
  }
  if (filters.recruiterGroup) {
    conditions.push(
      jsonContains(waitlistLeads.recruiterNeeds, {
        groups: [{ id: filters.recruiterGroup }],
      }),
    );
  }
  if (filters.recruiterNeed) {
    conditions.push(
      jsonContains(waitlistLeads.recruiterNeeds, {
        groups: [{ selections: [filters.recruiterNeed] }],
      }),
    );
  }
  if (typeof filters.hasCustomResponse === 'boolean') {
    const custom = or(
      hasCustom(waitlistLeads.seekerNeeds),
      hasCustom(waitlistLeads.recruiterNeeds),
      sql`length(trim(coalesce(${waitlistLeads.platformOther}, ''))) > 0`,
      sql`length(trim(coalesce(${waitlistLeads.nicheOther}, ''))) > 0`,
    );
    if (custom) conditions.push(filters.hasCustomResponse ? custom : sql`not (${custom})`);
  }
  if (typeof filters.hasAdditionalContext === 'boolean') {
    const present = sql`length(trim(coalesce(${waitlistLeads.additionalNotes}, ''))) > 0`;
    conditions.push(filters.hasAdditionalContext ? present : sql`not (${present})`);
  }
  if (filters.source) {
    conditions.push(sql`${attributionValue(attributionModel, 'source')} = ${filters.source}`);
  }
  if (filters.medium) {
    conditions.push(sql`${attributionValue(attributionModel, 'medium')} = ${filters.medium}`);
  }
  if (filters.utmCampaign) {
    conditions.push(sql`${attributionValue(attributionModel, 'campaign')} = ${filters.utmCampaign}`);
  }
  if (filters.dateFrom) {
    conditions.push(gte(waitlistLeads.createdAt, istStartOfDay(filters.dateFrom)));
  }
  if (filters.dateTo) {
    conditions.push(lt(waitlistLeads.createdAt, istEndOfDayExclusive(filters.dateTo)));
  }
  if (filters.updatedFrom) {
    conditions.push(gte(waitlistLeads.updatedAt, istStartOfDay(filters.updatedFrom)));
  }
  if (filters.updatedTo) {
    conditions.push(lt(waitlistLeads.updatedAt, istEndOfDayExclusive(filters.updatedTo)));
  }
  if (filters.q) {
    const term = `%${filters.q}%`;
    const search = or(
      ilike(waitlistLeads.normalizedEmail, term),
      ilike(waitlistLeads.originalEmail, term),
      ilike(waitlistLeads.fullName, term),
      ilike(waitlistLeads.phoneE164, term),
      ilike(waitlistLeads.additionalNotes, term),
      ilike(waitlistLeads.platformOther, term),
      ilike(waitlistLeads.nicheOther, term),
      sql`${waitlistLeads.seekerNeeds}::text ilike ${term}`,
      sql`${waitlistLeads.recruiterNeeds}::text ilike ${term}`,
      sql`array_to_string(${waitlistLeads.platforms}, ' ') ilike ${term}`,
      sql`array_to_string(${waitlistLeads.niches}, ' ') ilike ${term}`,
    );
    if (search) conditions.push(search);
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

export interface WaitlistSummary {
  total: number;
  new7Days: number;
  new30Days: number;
  emailOnly: number;
  partial: number;
  completed: number;
  seekers: number;
  recruiters: number;
  both: number;
  verified: number;
  unverified: number;
  phonePresent: number;
  phoneVerified: number;
  withCustomResponse: number;
  withAdditionalContext: number;
  completedWithAdditionalContext: number;
}

export async function getWaitlistSummary(): Promise<WaitlistSummary> {
  const db = getDb();
  const custom = or(
    hasCustom(waitlistLeads.seekerNeeds),
    hasCustom(waitlistLeads.recruiterNeeds),
    sql`length(trim(coalesce(${waitlistLeads.platformOther}, ''))) > 0`,
    sql`length(trim(coalesce(${waitlistLeads.nicheOther}, ''))) > 0`,
  );
  const rows = await db
    .select({
      total: sql<number>`cast(count(*) as int)`,
      new7Days: sql<number>`cast(count(*) filter (where ${waitlistLeads.createdAt} >= ((date_trunc('day', now() at time zone 'Asia/Kolkata') - interval '6 days') at time zone 'Asia/Kolkata')) as int)`,
      new30Days: sql<number>`cast(count(*) filter (where ${waitlistLeads.createdAt} >= ((date_trunc('day', now() at time zone 'Asia/Kolkata') - interval '29 days') at time zone 'Asia/Kolkata')) as int)`,
      emailOnly: sql<number>`cast(count(*) filter (where ${waitlistLeads.completionStatus} = 'email_only') as int)`,
      partial: sql<number>`cast(count(*) filter (where ${waitlistLeads.completionStatus} = 'partial') as int)`,
      completed: sql<number>`cast(count(*) filter (where ${waitlistLeads.completionStatus} = 'completed') as int)`,
      seekers: sql<number>`cast(count(*) filter (where ${waitlistLeads.role} = 'seeker') as int)`,
      recruiters: sql<number>`cast(count(*) filter (where ${waitlistLeads.role} = 'recruiter') as int)`,
      both: sql<number>`cast(count(*) filter (where ${waitlistLeads.role} = 'both') as int)`,
      verified: sql<number>`cast(count(*) filter (where ${waitlistLeads.emailVerificationStatus} = 'verified') as int)`,
      unverified: sql<number>`cast(count(*) filter (where ${waitlistLeads.emailVerificationStatus} <> 'verified') as int)`,
      phonePresent: sql<number>`cast(count(*) filter (where ${waitlistLeads.phoneE164} is not null) as int)`,
      phoneVerified: sql<number>`cast(count(*) filter (where ${waitlistLeads.phoneVerificationStatus} = 'verified') as int)`,
      withCustomResponse: sql<number>`cast(count(*) filter (where ${custom}) as int)`,
      withAdditionalContext: sql<number>`cast(count(*) filter (where length(trim(coalesce(${waitlistLeads.additionalNotes}, ''))) > 0) as int)`,
      completedWithAdditionalContext: sql<number>`cast(count(*) filter (where ${waitlistLeads.completionStatus} = 'completed' and length(trim(coalesce(${waitlistLeads.additionalNotes}, ''))) > 0) as int)`,
    })
    .from(waitlistLeads);

  return rows[0] ?? {
    total: 0,
    new7Days: 0,
    new30Days: 0,
    emailOnly: 0,
    partial: 0,
    completed: 0,
    seekers: 0,
    recruiters: 0,
    both: 0,
    verified: 0,
    unverified: 0,
    phonePresent: 0,
    phoneVerified: 0,
    withCustomResponse: 0,
    withAdditionalContext: 0,
    completedWithAdditionalContext: 0,
  };
}

export interface Breakdown {
  key: string;
  count: number;
}

export async function getNeedBreakdown(side: 'seeker' | 'recruiter'): Promise<Breakdown[]> {
  const db = getDb();
  const column = side === 'seeker' ? waitlistLeads.seekerNeeds : waitlistLeads.recruiterNeeds;
  const rows = await db.execute<{ key: string; count: number }>(sql`
    select selection as key, cast(count(distinct ${waitlistLeads.id}) as int) as count
    from ${waitlistLeads}
    cross join lateral jsonb_array_elements(${column}->'groups') as need_group
    cross join lateral jsonb_array_elements_text(need_group->'selections') as selection
    group by selection
    order by count desc, selection asc
  `);
  return normalizeRows(rows);
}

export async function getSourceBreakdown(): Promise<Breakdown[]> {
  const db = getDb();
  const rows = await db.execute<{ key: string; count: number }>(sql`
    select ${attributionValue('first', 'source')} as key,
           cast(count(*) as int) as count
    from ${waitlistLeads}
    group by 1
    order by count desc, key asc
  `);
  return normalizeRows(rows);
}

function normalizeRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === 'object' && 'rows' in result) {
    return (result as { rows: T[] }).rows;
  }
  return [];
}

export interface AdminLeadRow {
  id: string;
  fullName: string | null;
  originalEmail: string;
  role: Role | null;
  completionStatus: CompletionStatus;
  lastCompletedStep: number;
  lastMeaningfulStep: string;
  leadDataVersion: number;
  emailVerificationStatus: string;
  emailVerificationRequestedAt: Date | null;
  emailVerificationSentAt: Date | null;
  emailVerifiedAt: Date | null;
  emailVerificationFailureCode: string | null;
  lastTransactionalEmailStatus: string;
  lastTransactionalEmailAt: Date | null;
  phoneE164: string | null;
  phoneCountryIso: string | null;
  phoneWhatsappConsent: boolean;
  phoneSmsConsent: boolean;
  phoneVoiceConsent: boolean;
  phoneConsentVersion: string | null;
  phoneConsentRecordedAt: Date | null;
  phoneConsentSource: string | null;
  phoneVerificationStatus: string;
  phoneVerificationRequestedAt: Date | null;
  phoneVerificationLastSentAt: Date | null;
  phoneVerifiedAt: Date | null;
  seekerNeeds: NeedProfileV1;
  recruiterNeeds: NeedProfileV1;
  workFormats: string[];
  organisationTypes: string[];
  platforms: string[];
  niches: string[];
  platformOther: string | null;
  nicheOther: string | null;
  experienceLevel: string | null;
  availabilityToStart: string | null;
  portfolioUrl: string | null;
  hiringFrequency: string | null;
  talentSeniority: string | null;
  hiringTimeline: string | null;
  teamSize: string | null;
  companyUrl: string | null;
  additionalNotes: string | null;
  source: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrer: string | null;
  firstTouchAttribution: AttributionTouchV1 | null;
  lastTouchAttribution: AttributionTouchV1 | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

const LEAD_COLUMNS = {
  id: waitlistLeads.id,
  fullName: waitlistLeads.fullName,
  originalEmail: waitlistLeads.originalEmail,
  role: waitlistLeads.role,
  completionStatus: waitlistLeads.completionStatus,
  lastCompletedStep: waitlistLeads.lastCompletedStep,
  lastMeaningfulStep: waitlistLeads.lastMeaningfulStep,
  leadDataVersion: waitlistLeads.leadDataVersion,
  emailVerificationStatus: waitlistLeads.emailVerificationStatus,
  emailVerificationRequestedAt: waitlistLeads.emailVerificationRequestedAt,
  emailVerificationSentAt: waitlistLeads.emailVerificationSentAt,
  emailVerifiedAt: waitlistLeads.emailVerifiedAt,
  emailVerificationFailureCode: waitlistLeads.emailVerificationFailureCode,
  lastTransactionalEmailStatus: waitlistLeads.lastTransactionalEmailStatus,
  lastTransactionalEmailAt: waitlistLeads.lastTransactionalEmailAt,
  phoneE164: waitlistLeads.phoneE164,
  phoneCountryIso: waitlistLeads.phoneCountryIso,
  phoneWhatsappConsent: waitlistLeads.phoneWhatsappConsent,
  phoneSmsConsent: waitlistLeads.phoneSmsConsent,
  phoneVoiceConsent: waitlistLeads.phoneVoiceConsent,
  phoneConsentVersion: waitlistLeads.phoneConsentVersion,
  phoneConsentRecordedAt: waitlistLeads.phoneConsentRecordedAt,
  phoneConsentSource: waitlistLeads.phoneConsentSource,
  phoneVerificationStatus: waitlistLeads.phoneVerificationStatus,
  phoneVerificationRequestedAt: waitlistLeads.phoneVerificationRequestedAt,
  phoneVerificationLastSentAt: waitlistLeads.phoneVerificationLastSentAt,
  phoneVerifiedAt: waitlistLeads.phoneVerifiedAt,
  seekerNeeds: waitlistLeads.seekerNeeds,
  recruiterNeeds: waitlistLeads.recruiterNeeds,
  legacyJobCategories: waitlistLeads.jobCategories,
  legacyTalentCategories: waitlistLeads.talentCategories,
  legacyJobOthers: waitlistLeads.jobCategoryOthers,
  legacyTalentOthers: waitlistLeads.talentCategoryOthers,
  workFormats: waitlistLeads.workFormats,
  organisationTypes: waitlistLeads.organisationTypes,
  platforms: waitlistLeads.platforms,
  niches: waitlistLeads.niches,
  platformOther: waitlistLeads.platformOther,
  nicheOther: waitlistLeads.nicheOther,
  experienceLevel: waitlistLeads.experienceLevel,
  availabilityToStart: waitlistLeads.availabilityToStart,
  portfolioUrl: waitlistLeads.portfolioUrl,
  hiringFrequency: waitlistLeads.hiringFrequency,
  talentSeniority: waitlistLeads.talentSeniority,
  hiringTimeline: waitlistLeads.hiringTimeline,
  teamSize: waitlistLeads.teamSize,
  companyUrl: waitlistLeads.companyUrl,
  additionalNotes: waitlistLeads.additionalNotes,
  source: waitlistLeads.source,
  utmSource: waitlistLeads.utmSource,
  utmMedium: waitlistLeads.utmMedium,
  utmCampaign: waitlistLeads.utmCampaign,
  referrer: waitlistLeads.referrer,
  firstTouchAttribution: waitlistLeads.firstTouchAttribution,
  lastTouchAttribution: waitlistLeads.lastTouchAttribution,
  createdAt: waitlistLeads.createdAt,
  updatedAt: waitlistLeads.updatedAt,
  completedAt: waitlistLeads.completedAt,
} as const;

type RawAdminRow = Awaited<ReturnType<typeof selectRawRows>>[number];

async function selectRawRows(filters: LeadFilters, limit?: number, offset?: number) {
  const nameMissing = sql`case when nullif(trim(${waitlistLeads.fullName}), '') is null then 1 else 0 end`;
  const order =
    filters.sort === 'oldest'
      ? [asc(waitlistLeads.createdAt)]
      : filters.sort === 'name_asc'
        ? [asc(nameMissing), asc(sql`lower(${waitlistLeads.fullName})`), desc(waitlistLeads.createdAt)]
        : filters.sort === 'name_desc'
          ? [asc(nameMissing), desc(sql`lower(${waitlistLeads.fullName})`), desc(waitlistLeads.createdAt)]
          : [desc(waitlistLeads.createdAt)];
  let query = getDb()
    .select(LEAD_COLUMNS)
    .from(waitlistLeads)
    .where(buildWhere(filters))
    .orderBy(...order);
  if (limit !== undefined) query = query.limit(limit) as typeof query;
  if (offset !== undefined) query = query.offset(offset) as typeof query;
  return query;
}

function toAdminLeadRow(row: RawAdminRow): AdminLeadRow {
  const {
    legacyJobCategories,
    legacyTalentCategories,
    legacyJobOthers,
    legacyTalentOthers,
    ...current
  } = row;
  return {
    ...current,
    seekerNeeds: normalizeNeedProfile(
      row.seekerNeeds,
      'seeker',
      legacyJobCategories,
      legacyJobOthers,
    ),
    recruiterNeeds: normalizeNeedProfile(
      row.recruiterNeeds,
      'recruiter',
      legacyTalentCategories,
      legacyTalentOthers,
    ),
  };
}

export async function listLeads(
  filters: LeadFilters,
  limit = 50,
  offset = 0,
): Promise<{ rows: AdminLeadRow[]; total: number }> {
  const db = getDb();
  const [rawRows, countRows] = await Promise.all([
    selectRawRows(filters, limit, offset),
    db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(waitlistLeads)
      .where(buildWhere(filters)),
  ]);
  return {
    rows: rawRows.map(toAdminLeadRow),
    total: countRows[0]?.count ?? 0,
  };
}

export async function listLeadsForExport(filters: LeadFilters): Promise<AdminLeadRow[]> {
  const rows = await selectRawRows(filters);
  return rows.map(toAdminLeadRow);
}

export type TrendPeriod = '7' | '30' | 'all';

export interface TrendPoint {
  date: string;
  total: number;
  completed: number;
  verified: number;
}

export interface CountWithPercent extends Breakdown {
  percentage: number;
  completed?: number;
  customCount?: number;
}

export interface FunnelStage {
  key: string;
  label: string;
  count: number;
  percentage: number;
  note?: string;
}

export interface VerificationMetric {
  key: string;
  label: string;
  count: number;
  percentage: number;
}

export interface RecentComment {
  id: string;
  fullName: string | null;
  email: string;
  role: Role | null;
  comment: string;
  createdAt: Date;
  completedAt: Date | null;
}

export interface AttributionPerformanceRow {
  source: string;
  medium: string;
  campaign: string;
  savedEmailCount: number;
  verifiedCount: number;
  completedCount: number;
  seekerCount: number;
  recruiterCount: number;
  bothCount: number;
}

export interface DashboardAnalytics {
  trend: TrendPoint[];
  trendPeriod: TrendPeriod;
  roleDistribution: CountWithPercent[];
  completionFunnel: FunnelStage[];
  verification: VerificationMetric[];
  seekerRelevantLeads: number;
  recruiterRelevantLeads: number;
  seekerGroups: CountWithPercent[];
  seekerSelections: CountWithPercent[];
  recruiterGroups: CountWithPercent[];
  recruiterSelections: CountWithPercent[];
  sources: CountWithPercent[];
  campaigns: CountWithPercent[];
  firstTouchPerformance: AttributionPerformanceRow[];
  lastTouchPerformance: AttributionPerformanceRow[];
  recentComments: RecentComment[];
}

function numberOf(value: unknown): number {
  return typeof value === 'number' ? value : Number(value ?? 0);
}

export async function getAttributionPerformance(
  model: AttributionModel,
): Promise<AttributionPerformanceRow[]> {
  const source = attributionValue(model, 'source');
  const medium = attributionValue(model, 'medium');
  const campaign = attributionValue(model, 'campaign');
  const result = await getDb().execute<{
    source: string;
    medium: string;
    campaign: string;
    saved_email_count: number;
    verified_count: number;
    completed_count: number;
    seeker_count: number;
    recruiter_count: number;
    both_count: number;
  }>(sql`
    select ${source} as source,
           ${medium} as medium,
           ${campaign} as campaign,
           cast(count(*) as int) as saved_email_count,
           cast(count(*) filter (where ${waitlistLeads.emailVerificationStatus} = 'verified') as int) as verified_count,
           cast(count(*) filter (where ${waitlistLeads.completionStatus} = 'completed') as int) as completed_count,
           cast(count(*) filter (where ${waitlistLeads.role} = 'seeker') as int) as seeker_count,
           cast(count(*) filter (where ${waitlistLeads.role} = 'recruiter') as int) as recruiter_count,
           cast(count(*) filter (where ${waitlistLeads.role} = 'both') as int) as both_count
    from ${waitlistLeads}
    group by 1, 2, 3
    order by saved_email_count desc, source asc, medium asc, campaign asc
  `);
  return normalizeRows<{
    source: string;
    medium: string;
    campaign: string;
    saved_email_count: number;
    verified_count: number;
    completed_count: number;
    seeker_count: number;
    recruiter_count: number;
    both_count: number;
  }>(result).map((row) => ({
    source: row.source,
    medium: row.medium,
    campaign: row.campaign,
    savedEmailCount: numberOf(row.saved_email_count),
    verifiedCount: numberOf(row.verified_count),
    completedCount: numberOf(row.completed_count),
    seekerCount: numberOf(row.seeker_count),
    recruiterCount: numberOf(row.recruiter_count),
    bothCount: numberOf(row.both_count),
  }));
}

export function withPercent<T extends { key: string; count: number }>(
  rows: T[],
  total: number,
): Array<T & { percentage: number }> {
  return rows.map((row) => ({ ...row, percentage: readablePercent(row.count, total) }));
}

export function fillTrend(rows: TrendPoint[], period: TrendPeriod, now = new Date()): TrendPoint[] {
  const today = istDateKey(now);
  const start =
    period === '7'
      ? shiftIstDateKey(today, -6)
      : period === '30'
        ? shiftIstDateKey(today, -29)
        : rows[0]?.date ?? today;
  const byDate = new Map(rows.map((row) => [row.date, row]));
  const filled: TrendPoint[] = [];
  for (let cursor = start; cursor <= today; cursor = shiftIstDateKey(cursor, 1)) {
    filled.push(byDate.get(cursor) ?? { date: cursor, total: 0, completed: 0, verified: 0 });
  }
  return filled;
}

/** Server-side aggregates only; full lead records never enter the overview browser payload. */
export async function getDashboardAnalytics(
  period: TrendPeriod = '30',
): Promise<DashboardAnalytics> {
  const db = getDb();
  const periodWhere =
    period === 'all'
      ? sql``
      : sql`where ${waitlistLeads.createdAt} >= ((date_trunc('day', now() at time zone 'Asia/Kolkata') - ${sql.raw(period === '7' ? "interval '6 days'" : "interval '29 days'")}) at time zone 'Asia/Kolkata')`;

  const [
    trendResult,
    funnelResult,
    seekerGroupResult,
    seekerSelectionResult,
    recruiterGroupResult,
    recruiterSelectionResult,
    sourceResult,
    campaignResult,
    firstTouchPerformance,
    lastTouchPerformance,
    commentRows,
  ] = await Promise.all([
    db.execute<{ date: string; total: number; completed: number; verified: number }>(sql`
      select to_char(${waitlistLeads.createdAt} at time zone 'Asia/Kolkata', 'YYYY-MM-DD') as date,
             cast(count(*) as int) as total,
             cast(count(*) filter (where ${waitlistLeads.completionStatus} = 'completed') as int) as completed,
             cast(count(*) filter (where ${waitlistLeads.emailVerificationStatus} = 'verified') as int) as verified
      from ${waitlistLeads}
      ${periodWhere}
      group by 1
      order by 1
    `),
    db.execute<Record<string, number>>(sql`
      select
        cast(count(*) as int) as email_captured,
        cast(count(*) filter (where ${waitlistLeads.role} = 'seeker') as int) as seekers,
        cast(count(*) filter (where ${waitlistLeads.role} = 'recruiter') as int) as recruiters,
        cast(count(*) filter (where ${waitlistLeads.role} = 'both') as int) as both,
        cast(count(*) filter (where ${waitlistLeads.role} in ('seeker', 'both')) as int) as seeker_relevant,
        cast(count(*) filter (where ${waitlistLeads.role} in ('recruiter', 'both')) as int) as recruiter_relevant,
        cast(count(*) filter (where ${waitlistLeads.role} is not null) as int) as role_provided,
        cast(count(*) filter (where
          exists (select 1 from jsonb_array_elements(${waitlistLeads.seekerNeeds}->'groups') g where jsonb_array_length(coalesce(g->'selections', '[]'::jsonb)) > 0 or length(trim(coalesce(g->>'customResponse', ''))) > 0)
          or exists (select 1 from jsonb_array_elements(${waitlistLeads.recruiterNeeds}->'groups') g where jsonb_array_length(coalesce(g->'selections', '[]'::jsonb)) > 0 or length(trim(coalesce(g->>'customResponse', ''))) > 0)
        ) as int) as core_preferences,
        cast(count(*) filter (where
          cardinality(${waitlistLeads.workFormats}) > 0 or cardinality(${waitlistLeads.organisationTypes}) > 0
          or cardinality(${waitlistLeads.platforms}) > 0 or cardinality(${waitlistLeads.niches}) > 0
          or ${waitlistLeads.experienceLevel} is not null or ${waitlistLeads.availabilityToStart} is not null
          or ${waitlistLeads.portfolioUrl} is not null or ${waitlistLeads.hiringTimeline} is not null
          or ${waitlistLeads.teamSize} is not null or ${waitlistLeads.companyUrl} is not null
        ) as int) as richer_context,
        cast(count(*) filter (where ${waitlistLeads.phoneE164} is not null) as int) as phone_supplied,
        cast(count(*) filter (where ${waitlistLeads.completionStatus} = 'completed') as int) as completed,
        cast(count(*) filter (where ${waitlistLeads.emailVerificationStatus} = 'verified') as int) as email_verified,
        cast(count(*) filter (where ${waitlistLeads.phoneVerificationStatus} = 'verified') as int) as phone_verified
      from ${waitlistLeads}
    `),
    db.execute<{ key: string; count: number; custom_count: number }>(sql`
      select g->>'id' as key,
             cast(count(distinct ${waitlistLeads.id}) as int) as count,
             cast(count(distinct ${waitlistLeads.id}) filter (where length(trim(coalesce(g->>'customResponse', ''))) > 0) as int) as custom_count
      from ${waitlistLeads}
      cross join lateral jsonb_array_elements(${waitlistLeads.seekerNeeds}->'groups') g
      where ${waitlistLeads.role} in ('seeker', 'both')
        and (jsonb_array_length(coalesce(g->'selections', '[]'::jsonb)) > 0 or length(trim(coalesce(g->>'customResponse', ''))) > 0)
      group by 1 order by count desc, key asc
    `),
    db.execute<{ key: string; count: number }>(sql`
      select selection as key, cast(count(distinct ${waitlistLeads.id}) as int) as count
      from ${waitlistLeads}
      cross join lateral jsonb_array_elements(${waitlistLeads.seekerNeeds}->'groups') g
      cross join lateral jsonb_array_elements_text(g->'selections') selection
      where ${waitlistLeads.role} in ('seeker', 'both') and selection not like '%_other'
      group by selection order by count desc, selection asc limit 12
    `),
    db.execute<{ key: string; count: number; custom_count: number }>(sql`
      select g->>'id' as key,
             cast(count(distinct ${waitlistLeads.id}) as int) as count,
             cast(count(distinct ${waitlistLeads.id}) filter (where length(trim(coalesce(g->>'customResponse', ''))) > 0) as int) as custom_count
      from ${waitlistLeads}
      cross join lateral jsonb_array_elements(${waitlistLeads.recruiterNeeds}->'groups') g
      where ${waitlistLeads.role} in ('recruiter', 'both')
        and (jsonb_array_length(coalesce(g->'selections', '[]'::jsonb)) > 0 or length(trim(coalesce(g->>'customResponse', ''))) > 0)
      group by 1 order by count desc, key asc
    `),
    db.execute<{ key: string; count: number }>(sql`
      select selection as key, cast(count(distinct ${waitlistLeads.id}) as int) as count
      from ${waitlistLeads}
      cross join lateral jsonb_array_elements(${waitlistLeads.recruiterNeeds}->'groups') g
      cross join lateral jsonb_array_elements_text(g->'selections') selection
      where ${waitlistLeads.role} in ('recruiter', 'both') and selection not like '%_other'
      group by selection order by count desc, selection asc limit 12
    `),
    db.execute<{ key: string; count: number; completed: number }>(sql`
      select ${attributionValue('first', 'source')} as key,
             cast(count(*) as int) as count,
             cast(count(*) filter (where ${waitlistLeads.completionStatus} = 'completed') as int) as completed
      from ${waitlistLeads}
      group by 1 order by count desc, key asc limit 12
    `),
    db.execute<{ key: string; count: number; completed: number }>(sql`
      select ${attributionValue('first', 'campaign')} as key,
             cast(count(*) as int) as count,
             cast(count(*) filter (where ${waitlistLeads.completionStatus} = 'completed') as int) as completed
      from ${waitlistLeads}
      group by 1 order by count desc, key asc limit 10
    `),
    getAttributionPerformance('first'),
    getAttributionPerformance('last'),
    db.select({
      id: waitlistLeads.id,
      fullName: waitlistLeads.fullName,
      email: waitlistLeads.originalEmail,
      role: waitlistLeads.role,
      comment: waitlistLeads.additionalNotes,
      createdAt: waitlistLeads.createdAt,
      completedAt: waitlistLeads.completedAt,
    })
      .from(waitlistLeads)
      .where(sql`length(trim(coalesce(${waitlistLeads.additionalNotes}, ''))) > 0`)
      .orderBy(desc(waitlistLeads.updatedAt))
      .limit(5),
  ]);

  const trendRows = normalizeRows<{ date: string; total: number; completed: number; verified: number }>(trendResult)
    .map((row) => ({ date: row.date, total: numberOf(row.total), completed: numberOf(row.completed), verified: numberOf(row.verified) }));
  const funnelRaw = normalizeRows<Record<string, number>>(funnelResult)[0] ?? {};
  const total = numberOf(funnelRaw.email_captured);
  const stage = (key: string, label: string, note?: string): FunnelStage => ({
    key,
    label,
    count: numberOf(funnelRaw[key]),
    percentage: readablePercent(numberOf(funnelRaw[key]), total),
    ...(note ? { note } : {}),
  });
  const seekerRelevant = numberOf(funnelRaw.seeker_relevant);
  const recruiterRelevant = numberOf(funnelRaw.recruiter_relevant);

  const normalizeCountRows = (result: unknown) =>
    normalizeRows<{ key: string; count: number }>(result).map((row) => ({ key: row.key, count: numberOf(row.count) }));
  const normalizeGroupRows = (result: unknown) =>
    normalizeRows<{ key: string; count: number; custom_count: number }>(result).map((row) => ({
      key: row.key,
      count: numberOf(row.count),
      customCount: numberOf(row.custom_count),
    }));
  const sources = normalizeRows<{ key: string; count: number; completed: number }>(sourceResult).map((row) => ({
    key: row.key,
    count: numberOf(row.count),
    completed: numberOf(row.completed),
  }));
  const campaigns = normalizeRows<{ key: string; count: number; completed: number }>(campaignResult).map((row) => ({
    key: row.key,
    count: numberOf(row.count),
    completed: numberOf(row.completed),
  }));

  return {
    trend: fillTrend(trendRows, period),
    trendPeriod: period,
    roleDistribution: withPercent([
      { key: 'seeker', count: numberOf(funnelRaw.seekers) },
      { key: 'recruiter', count: numberOf(funnelRaw.recruiters) },
      { key: 'both', count: numberOf(funnelRaw.both) },
    ], total),
    completionFunnel: [
      stage('email_captured', 'Email captured'),
      stage('role_provided', 'Role provided'),
      stage('core_preferences', 'Core preferences'),
      stage('richer_context', 'Richer context'),
      stage('phone_supplied', 'Phone supplied', 'Optional'),
      stage('completed', 'Profile completed'),
      stage('email_verified', 'Email verified', 'Independent of completion'),
    ],
    verification: [
      stage('email_verified', 'Verified email'),
      { key: 'email_unverified', label: 'Email pending / unverified', count: total - numberOf(funnelRaw.email_verified), percentage: readablePercent(total - numberOf(funnelRaw.email_verified), total) },
      stage('phone_supplied', 'Phone supplied'),
      stage('phone_verified', 'Phone verified (legacy)', 'No longer part of the flow'),
      stage('email_verified', 'Contactable by verified email'),
    ],
    seekerRelevantLeads: seekerRelevant,
    recruiterRelevantLeads: recruiterRelevant,
    seekerGroups: withPercent(normalizeGroupRows(seekerGroupResult), seekerRelevant),
    seekerSelections: withPercent(normalizeCountRows(seekerSelectionResult), seekerRelevant),
    recruiterGroups: withPercent(normalizeGroupRows(recruiterGroupResult), recruiterRelevant),
    recruiterSelections: withPercent(normalizeCountRows(recruiterSelectionResult), recruiterRelevant),
    sources: withPercent(sources, total),
    campaigns: withPercent(campaigns, total),
    firstTouchPerformance,
    lastTouchPerformance,
    recentComments: commentRows
      .filter((row): row is typeof row & { comment: string } => Boolean(row.comment))
      .map((row) => ({ ...row, comment: row.comment })),
  };
}

export async function getAdminFilterOptions(
  model: AttributionModel = 'first',
): Promise<{ sources: string[]; mediums: string[]; campaigns: string[] }> {
  const db = getDb();
  const [sourceRows, mediumRows, campaignRows] = await Promise.all([
    db.execute<{ value: string }>(sql`
      select distinct ${attributionValue(model, 'source')} as value
      from ${waitlistLeads} order by 1
    `),
    db.execute<{ value: string }>(sql`
      select distinct ${attributionValue(model, 'medium')} as value
      from ${waitlistLeads} order by 1
    `),
    db.execute<{ value: string }>(sql`
      select distinct ${attributionValue(model, 'campaign')} as value
      from ${waitlistLeads} order by 1
    `),
  ]);
  return {
    sources: normalizeRows<{ value: string }>(sourceRows).map((row) => row.value),
    mediums: normalizeRows<{ value: string }>(mediumRows).map((row) => row.value),
    campaigns: normalizeRows<{ value: string }>(campaignRows).map((row) => row.value),
  };
}

/**
 * Permanently remove one registration, returning what was deleted so the action can write
 * an audit line. Everything the waitlist stores about a person lives on this row (including
 * verification state), so a single delete leaves no orphaned rows behind — `rate_limit_hits`
 * is keyed by peppered-hash subject, never by lead.
 *
 * Hard delete is deliberate: this backs data-subject erasure requests as well as clearing
 * test signups, and a soft delete would keep the contact data we were asked to remove.
 */
export async function deleteLeadById(
  leadId: string,
): Promise<{ deleted: boolean; normalizedEmail: string | null }> {
  const db = getDb();
  const rows = await db
    .delete(waitlistLeads)
    .where(eq(waitlistLeads.id, leadId))
    .returning({ normalizedEmail: waitlistLeads.normalizedEmail });
  const row = rows[0];
  return { deleted: Boolean(row), normalizedEmail: row?.normalizedEmail ?? null };
}

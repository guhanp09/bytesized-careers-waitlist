import type { LeadFilters } from '@/lib/db/queries/admin';
import {
  CATEGORY_GROUP_IDS,
  JOB_CATEGORY_VALUES,
  TALENT_CATEGORY_VALUES,
} from '@/lib/validation/constants';
import type { Role, CompletionStatus } from '@/types/waitlist';

const ROLES: Role[] = ['seeker', 'recruiter', 'both'];
const COMPLETIONS: CompletionStatus[] = ['email_only', 'partial', 'completed'];
const VERIFICATIONS = ['unverified', 'pending', 'verified', 'bounced'] as const;
const SORTS = ['newest', 'oldest', 'name_asc', 'name_desc'] as const;

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.trim() !== '' ? v.trim() : undefined;
}

function booleanParam(value: string | undefined): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

export function parseLeadFilters(params: RawParams): LeadFilters {
  const filters: LeadFilters = {};
  const sort = first(params.sort);
  if (sort && (SORTS as readonly string[]).includes(sort)) filters.sort = sort as LeadFilters['sort'];
  const role = first(params.role);
  if (role && (ROLES as string[]).includes(role)) filters.role = role as Role;

  const completion = first(params.completion);
  if (completion && (COMPLETIONS as string[]).includes(completion)) {
    filters.completion = completion as CompletionStatus;
  }

  const verification = first(params.verification);
  if (verification && (VERIFICATIONS as readonly string[]).includes(verification)) {
    filters.verification = verification as LeadFilters['verification'];
  }

  const phonePresent = booleanParam(first(params.phonePresent));
  if (phonePresent !== undefined) filters.phonePresent = phonePresent;
  const phoneVerified = booleanParam(first(params.phoneVerified));
  if (phoneVerified !== undefined) filters.phoneVerified = phoneVerified;
  const hasCustomResponse = booleanParam(first(params.hasCustomResponse));
  if (hasCustomResponse !== undefined) filters.hasCustomResponse = hasCustomResponse;
  const hasAdditionalContext = booleanParam(first(params.hasAdditionalContext));
  if (hasAdditionalContext !== undefined) filters.hasAdditionalContext = hasAdditionalContext;

  const seekerGroup = first(params.seekerGroup);
  if (seekerGroup && (CATEGORY_GROUP_IDS as readonly string[]).includes(seekerGroup)) {
    filters.seekerGroup = seekerGroup;
  }
  const seekerNeed = first(params.seekerNeed);
  if (seekerNeed && (JOB_CATEGORY_VALUES as readonly string[]).includes(seekerNeed)) {
    filters.seekerNeed = seekerNeed;
  }
  const recruiterGroup = first(params.recruiterGroup);
  if (recruiterGroup && (CATEGORY_GROUP_IDS as readonly string[]).includes(recruiterGroup)) {
    filters.recruiterGroup = recruiterGroup;
  }
  const recruiterNeed = first(params.recruiterNeed);
  if (recruiterNeed && (TALENT_CATEGORY_VALUES as readonly string[]).includes(recruiterNeed)) {
    filters.recruiterNeed = recruiterNeed;
  }

  const source = first(params.source);
  if (source) filters.source = source.slice(0, 120);
  const medium = first(params.medium);
  if (medium) filters.medium = medium.slice(0, 120);
  const utmCampaign = first(params.utmCampaign);
  if (utmCampaign) filters.utmCampaign = utmCampaign.slice(0, 160);
  const attributionModel = first(params.attributionModel);
  if (attributionModel === 'first' || attributionModel === 'last') {
    filters.attributionModel = attributionModel;
  }
  const dateFrom = first(params.dateFrom);
  if (dateFrom && isIsoDate(dateFrom)) filters.dateFrom = dateFrom;
  const dateTo = first(params.dateTo);
  if (dateTo && isIsoDate(dateTo)) filters.dateTo = dateTo;
  const updatedFrom = first(params.updatedFrom);
  if (updatedFrom && isIsoDate(updatedFrom)) filters.updatedFrom = updatedFrom;
  const updatedTo = first(params.updatedTo);
  if (updatedTo && isIsoDate(updatedTo)) filters.updatedTo = updatedTo;
  const q = first(params.q);
  if (q) filters.q = q.slice(0, 320);
  return filters;
}

export function filtersToQuery(filters: LeadFilters): string {
  const params = new URLSearchParams();
  const entries: [keyof LeadFilters, string][] = [
    ['sort', filters.sort ?? ''],
    ['role', filters.role ?? ''],
    ['completion', filters.completion ?? ''],
    ['verification', filters.verification ?? ''],
    ['seekerGroup', filters.seekerGroup ?? ''],
    ['seekerNeed', filters.seekerNeed ?? ''],
    ['recruiterGroup', filters.recruiterGroup ?? ''],
    ['recruiterNeed', filters.recruiterNeed ?? ''],
    ['source', filters.source ?? ''],
    ['medium', filters.medium ?? ''],
    ['utmCampaign', filters.utmCampaign ?? ''],
    ['attributionModel', filters.attributionModel ?? ''],
    ['dateFrom', filters.dateFrom ?? ''],
    ['dateTo', filters.dateTo ?? ''],
    ['updatedFrom', filters.updatedFrom ?? ''],
    ['updatedTo', filters.updatedTo ?? ''],
    ['q', filters.q ?? ''],
  ];
  for (const [key, value] of entries) if (value) params.set(key, value);
  for (const key of [
    'phonePresent',
    'phoneVerified',
    'hasCustomResponse',
    'hasAdditionalContext',
  ] as const) {
    const value = filters[key];
    if (typeof value === 'boolean') params.set(key, String(value));
  }
  return params.toString();
}

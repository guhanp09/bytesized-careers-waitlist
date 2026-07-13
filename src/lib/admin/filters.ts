import type { LeadFilters } from '@/lib/db/queries/admin';
import type { Role, CompletionStatus } from '@/types/waitlist';

const ROLES: Role[] = ['seeker', 'recruiter', 'both'];
const COMPLETIONS: CompletionStatus[] = ['email_only', 'partial', 'completed'];
const VERIFICATIONS = ['unverified', 'pending', 'verified', 'bounced'];

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.trim() !== '' ? v : undefined;
}

/** Parse admin filters from URL searchParams (shared by the table page and CSV export). */
export function parseLeadFilters(params: RawParams): LeadFilters {
  const filters: LeadFilters = {};

  const role = first(params.role);
  if (role && (ROLES as string[]).includes(role)) filters.role = role as Role;

  const completion = first(params.completion);
  if (completion && (COMPLETIONS as string[]).includes(completion)) {
    filters.completion = completion as CompletionStatus;
  }

  const verification = first(params.verification);
  if (verification && VERIFICATIONS.includes(verification)) {
    filters.verification = verification;
  }

  const whatsapp = first(params.whatsappConsent);
  if (whatsapp === 'true') filters.whatsappConsent = true;
  else if (whatsapp === 'false') filters.whatsappConsent = false;

  const category = first(params.category);
  if (category) filters.category = category;

  const dateFrom = first(params.dateFrom);
  if (dateFrom) filters.dateFrom = dateFrom;

  const dateTo = first(params.dateTo);
  if (dateTo) filters.dateTo = dateTo;

  const q = first(params.q);
  if (q) filters.q = q;

  return filters;
}

/** Serialize filters back into a query string (for the CSV export link + pagination). */
export function filtersToQuery(filters: LeadFilters): string {
  const params = new URLSearchParams();
  if (filters.role) params.set('role', filters.role);
  if (filters.completion) params.set('completion', filters.completion);
  if (filters.verification) params.set('verification', filters.verification);
  if (typeof filters.whatsappConsent === 'boolean') {
    params.set('whatsappConsent', String(filters.whatsappConsent));
  }
  if (filters.category) params.set('category', filters.category);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  if (filters.q) params.set('q', filters.q);
  return params.toString();
}

import {
  ATTRIBUTION_PARAMETER_LIMITS,
  sanitizeAttributionParameter,
  type AttributionParameter,
} from './campaign';

export type PublicSearchParams = Record<string, string | string[] | undefined>;

/** Forward only the bounded first-party campaign/referral allowlist. */
export function withSupportedAttribution(
  pathname: string,
  searchParams: PublicSearchParams,
): string {
  const forwarded = new URLSearchParams();

  for (const key of Object.keys(ATTRIBUTION_PARAMETER_LIMITS) as AttributionParameter[]) {
    const candidate = searchParams[key];
    // Repeated campaign keys are ambiguous and are not forwarded.
    if (Array.isArray(candidate)) continue;
    const value = candidate ? sanitizeAttributionParameter(key, candidate) : undefined;
    if (!value) continue;
    forwarded.set(key, value);
  }

  const query = forwarded.toString();
  return query ? `${pathname}?${query}` : pathname;
}

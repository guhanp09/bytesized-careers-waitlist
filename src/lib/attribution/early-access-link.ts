const ATTRIBUTION_LIMITS = {
  source: 120,
  ref: 120,
  utm_source: 200,
  utm_medium: 200,
  utm_campaign: 200,
} as const;

export type PublicSearchParams = Record<string, string | string[] | undefined>;

/** Forward only the attribution keys already understood by the registration flow. */
export function withSupportedAttribution(
  pathname: string,
  searchParams: PublicSearchParams,
): string {
  const forwarded = new URLSearchParams();

  for (const [key, maxLength] of Object.entries(ATTRIBUTION_LIMITS)) {
    const candidate = searchParams[key];
    const value = Array.isArray(candidate) ? candidate[0] : candidate;
    if (!value || value.length > maxLength || /[\u0000-\u001f\u007f]/u.test(value)) continue;
    forwarded.set(key, value);
  }

  const query = forwarded.toString();
  return query ? `${pathname}?${query}` : pathname;
}

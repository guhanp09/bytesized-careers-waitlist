/**
 * Client-side attribution capture (plan §10). Read once on mount and passed to the
 * Step 1 server action, which persists it as first-touch attribution.
 */
export interface Attribution {
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
}

export function readAttribution(): Attribution {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const get = (key: string) => params.get(key) ?? undefined;
  const attribution: Attribution = {
    source: get('source') ?? get('ref'),
    utmSource: get('utm_source'),
    utmMedium: get('utm_medium'),
    utmCampaign: get('utm_campaign'),
    referrer: document.referrer || undefined,
  };
  return attribution;
}

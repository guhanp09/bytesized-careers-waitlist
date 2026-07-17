import { z } from 'zod';

export const ATTRIBUTION_VERSION = 1 as const;

export const ATTRIBUTION_PARAMETER_LIMITS = {
  utm_source: 100,
  utm_medium: 100,
  utm_campaign: 150,
  utm_content: 150,
  utm_term: 150,
  utm_geo: 50,
  utm_placement: 100,
  ref: 100,
} as const;

export type AttributionParameter = keyof typeof ATTRIBUTION_PARAMETER_LIMITS;
export type AttributionKind = 'campaign' | 'referral' | 'direct';

export interface AttributionTouchV1 {
  version: typeof ATTRIBUTION_VERSION;
  kind: AttributionKind;
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  geo?: string;
  placement?: string;
  referral?: string;
  referrerHost?: string;
  landingPath: '/' | '/early-access';
  capturedAt: string;
}

export interface AttributionStateV1 {
  version: typeof ATTRIBUTION_VERSION;
  firstTouch: AttributionTouchV1;
  lastTouch: AttributionTouchV1;
}

export interface AttributionSubmission extends AttributionStateV1 {
  /** Present only when this page view introduced a new non-direct last touch. */
  currentTouch?: AttributionTouchV1;
}

const unsafeText = /[\p{Cc}\p{Cf}\uFFFD<>]/u;

function normalizeText(value: string, lowerCase: boolean): string | undefined {
  if (unsafeText.test(value)) return undefined;
  const normalized = value.trim().replace(/\s+/gu, ' ');
  if (!normalized) return undefined;
  return lowerCase ? normalized.toLowerCase() : normalized;
}

export function sanitizeAttributionParameter(
  key: AttributionParameter,
  value: string,
): string | undefined {
  const normalized = normalizeText(
    value,
    key === 'utm_source' || key === 'utm_medium' || key === 'utm_geo',
  );
  if (!normalized || normalized.length > ATTRIBUTION_PARAMETER_LIMITS[key]) return undefined;
  return normalized;
}

function safeTouchText(max: number, lowerCase = false) {
  return z
    .string()
    .max(max)
    .transform((value) => normalizeText(value, lowerCase))
    .refine((value): value is string => value !== undefined, 'Unsafe attribution value');
}

const capturedAtSchema = z.string().refine(
  (value) => Number.isFinite(Date.parse(value)) && value === new Date(value).toISOString(),
  'Invalid attribution timestamp',
);

export const attributionTouchSchema = z
  .object({
    version: z.literal(ATTRIBUTION_VERSION),
    kind: z.enum(['campaign', 'referral', 'direct']),
    source: safeTouchText(100, true).optional(),
    medium: safeTouchText(100, true).optional(),
    campaign: safeTouchText(150).optional(),
    content: safeTouchText(150).optional(),
    term: safeTouchText(150).optional(),
    geo: safeTouchText(50, true).optional(),
    placement: safeTouchText(100).optional(),
    referral: safeTouchText(100).optional(),
    referrerHost: z.string().max(253).regex(/^[a-z0-9.-]+$/u).optional(),
    landingPath: z.enum(['/', '/early-access']),
    capturedAt: capturedAtSchema,
  })
  .strict()
  .superRefine((touch, ctx) => {
    if (touch.kind === 'direct' && touch.source !== 'direct') {
      ctx.addIssue({ code: 'custom', path: ['source'], message: 'Invalid direct attribution' });
    }
  });

export const attributionStateSchema = z
  .object({
    version: z.literal(ATTRIBUTION_VERSION),
    firstTouch: attributionTouchSchema,
    lastTouch: attributionTouchSchema,
  })
  .strict();

export const attributionSubmissionSchema = attributionStateSchema
  .extend({ currentTouch: attributionTouchSchema.optional() })
  .strict()
  .superRefine((submission, ctx) => {
    if (submission.currentTouch?.kind === 'direct') {
      ctx.addIssue({ code: 'custom', path: ['currentTouch'], message: 'Direct is not an update' });
    }
  });

function acceptedParameter(params: URLSearchParams, key: AttributionParameter) {
  const values = params.getAll(key);
  if (values.length !== 1) return undefined;
  return sanitizeAttributionParameter(key, values[0] ?? '');
}

export function externalReferrerHost(referrer: string, origin: string): string | undefined {
  if (!referrer) return undefined;
  try {
    const referrerUrl = new URL(referrer);
    const currentOrigin = new URL(origin).origin;
    if (referrerUrl.origin === currentOrigin) return undefined;
    const host = referrerUrl.hostname.toLowerCase();
    return host && host.length <= 253 && /^[a-z0-9.-]+$/u.test(host) ? host : undefined;
  } catch {
    return undefined;
  }
}

export function isInternalReferrer(referrer: string, origin: string): boolean {
  if (!referrer) return false;
  try {
    return new URL(referrer).origin === new URL(origin).origin;
  } catch {
    return false;
  }
}

export function attributionTouchFromVisit(input: {
  search: string;
  referrer: string;
  origin: string;
  landingPath: '/' | '/early-access';
  now?: Date;
}): AttributionTouchV1 {
  const params = new URLSearchParams(input.search);
  const source = acceptedParameter(params, 'utm_source');
  const medium = acceptedParameter(params, 'utm_medium');
  const campaign = acceptedParameter(params, 'utm_campaign');
  const content = acceptedParameter(params, 'utm_content');
  const term = acceptedParameter(params, 'utm_term');
  const geo = acceptedParameter(params, 'utm_geo');
  const placement = acceptedParameter(params, 'utm_placement');
  const referral = acceptedParameter(params, 'ref');
  const referrerHost = externalReferrerHost(input.referrer, input.origin);
  const hasUtm = Boolean(source || medium || campaign || content || term || geo || placement);
  const capturedAt = (input.now ?? new Date()).toISOString();

  if (hasUtm || referral) {
    return {
      version: ATTRIBUTION_VERSION,
      kind: hasUtm ? 'campaign' : 'referral',
      ...(source ? { source } : referral ? { source: referral.toLowerCase() } : {}),
      ...(medium ? { medium } : referral && !hasUtm ? { medium: 'referral' } : {}),
      ...(campaign ? { campaign } : {}),
      ...(content ? { content } : {}),
      ...(term ? { term } : {}),
      ...(geo ? { geo } : {}),
      ...(placement ? { placement } : {}),
      ...(referral ? { referral } : {}),
      ...(referrerHost ? { referrerHost } : {}),
      landingPath: input.landingPath,
      capturedAt,
    };
  }

  if (referrerHost) {
    return {
      version: ATTRIBUTION_VERSION,
      kind: 'referral',
      source: referrerHost,
      medium: 'referral',
      referrerHost,
      landingPath: input.landingPath,
      capturedAt,
    };
  }

  return {
    version: ATTRIBUTION_VERSION,
    kind: 'direct',
    source: 'direct',
    landingPath: input.landingPath,
    capturedAt,
  };
}

const comparableTouchKeys = [
  'kind',
  'source',
  'medium',
  'campaign',
  'content',
  'term',
  'geo',
  'placement',
  'referral',
  'referrerHost',
] as const;

export function sameAttributionTouch(a: AttributionTouchV1, b: AttributionTouchV1): boolean {
  return comparableTouchKeys.every((key) => a[key] === b[key]);
}

export function mergeAttributionVisit(
  current: AttributionStateV1 | null,
  visit: AttributionTouchV1,
  internalNavigation = false,
): AttributionSubmission {
  if (!current) {
    return {
      version: ATTRIBUTION_VERSION,
      firstTouch: visit,
      lastTouch: visit,
      ...(visit.kind === 'direct' ? {} : { currentTouch: visit }),
    };
  }

  if (
    visit.kind === 'direct' ||
    (sameAttributionTouch(current.lastTouch, visit) &&
      (internalNavigation ||
        (current.lastTouch.landingPath === '/' && visit.landingPath === '/early-access')))
  ) {
    return {
      version: ATTRIBUTION_VERSION,
      firstTouch: current.firstTouch,
      lastTouch: current.lastTouch,
    };
  }

  return {
    version: ATTRIBUTION_VERSION,
    firstTouch: current.firstTouch,
    lastTouch: visit,
    currentTouch: visit,
  };
}

/** Extract a hostname from old full-URL referrer data without exposing its path/query. */
export function legacyReferrerHostname(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value).hostname.toLowerCase() || undefined;
  } catch {
    const normalized = value.trim().toLowerCase();
    return /^[a-z0-9.-]+$/u.test(normalized) ? normalized : undefined;
  }
}

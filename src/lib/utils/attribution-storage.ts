'use client';

import {
  ATTRIBUTION_VERSION,
  attributionStateSchema,
  attributionTouchFromVisit,
  isInternalReferrer,
  mergeAttributionVisit,
  type AttributionStateV1,
  type AttributionSubmission,
} from '@/lib/attribution/campaign';

export const ATTRIBUTION_STORAGE_KEY = 'bytesized_waitlist_attribution';

let cachedPageCapture: { key: string; value: AttributionSubmission } | null = null;

function isReloadNavigation(): boolean {
  try {
    const navigation = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    return navigation?.type === 'reload';
  } catch {
    return false;
  }
}

function migrateStoredAttribution(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  const candidate = value as Record<string, unknown>;
  if (candidate.version !== 0) return value;
  const upgradeTouch = (touch: unknown) =>
    touch && typeof touch === 'object'
      ? { ...(touch as Record<string, unknown>), version: ATTRIBUTION_VERSION }
      : touch;
  return {
    version: ATTRIBUTION_VERSION,
    firstTouch: upgradeTouch(candidate.firstTouch),
    lastTouch: upgradeTouch(candidate.lastTouch),
  };
}

export function loadAttribution(): AttributionStateV1 | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) return null;
    const decoded = JSON.parse(raw) as unknown;
    const migrated = migrateStoredAttribution(decoded);
    const parsed = attributionStateSchema.safeParse(migrated);
    if (!parsed.success) {
      window.localStorage.removeItem(ATTRIBUTION_STORAGE_KEY);
      return null;
    }
    if (migrated !== decoded) {
      window.localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(parsed.data));
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function storeAttribution(state: AttributionStateV1): void {
  if (typeof window === 'undefined') return;
  const parsed = attributionStateSchema.safeParse({
    version: state.version,
    firstTouch: state.firstTouch,
    lastTouch: state.lastTouch,
  });
  if (!parsed.success) return;
  try {
    window.localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(parsed.data));
  } catch {
    // Storage may be unavailable; the URL payload can still reach the first save.
  }
}

export function captureAttribution(
  landingPath: '/' | '/early-access',
): AttributionSubmission | undefined {
  if (typeof window === 'undefined') return undefined;
  const cacheKey = `${window.location.href}\n${document.referrer}\n${landingPath}`;
  if (cachedPageCapture?.key === cacheKey) return cachedPageCapture.value;

  const visit = attributionTouchFromVisit({
    search: window.location.search,
    referrer: document.referrer,
    origin: window.location.origin,
    landingPath,
  });
  const value = mergeAttributionVisit(
    loadAttribution(),
    visit,
    isInternalReferrer(document.referrer, window.location.origin) || isReloadNavigation(),
  );
  storeAttribution(value);
  cachedPageCapture = { key: cacheKey, value };
  return value;
}

export function replaceStoredAttribution(state: AttributionStateV1): void {
  storeAttribution(state);
  cachedPageCapture = null;
}

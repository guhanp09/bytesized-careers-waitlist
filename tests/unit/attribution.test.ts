import { beforeEach, describe, expect, it } from 'vitest';
import {
  ATTRIBUTION_VERSION,
  attributionStateSchema,
  attributionSubmissionSchema,
  attributionTouchFromVisit,
  mergeAttributionVisit,
} from '@/lib/attribution/campaign';
import {
  ATTRIBUTION_STORAGE_KEY,
  loadAttribution,
  storeAttribution,
} from '@/lib/utils/attribution-storage';

const NOW = new Date('2026-07-17T10:00:00.000Z');

function visit(search = '', referrer = '') {
  return attributionTouchFromVisit({
    search,
    referrer,
    origin: 'https://bytesizedcareers.com',
    landingPath: '/early-access',
    now: NOW,
  });
}

describe('campaign attribution capture', () => {
  it('captures the complete allowlist with conservative normalization', () => {
    expect(
      visit(
        '?utm_source=Meta&utm_medium=Paid-Social&utm_campaign=ea_talent_india&utm_content=video-editor-static-a&utm_term=video%20editing&utm_geo=IN&utm_placement=ig-reels&ref=Partner-A&gclid=discard',
        'https://www.google.com/search?q=sensitive',
      ),
    ).toEqual({
      version: 1,
      kind: 'campaign',
      source: 'meta',
      medium: 'paid-social',
      campaign: 'ea_talent_india',
      content: 'video-editor-static-a',
      term: 'video editing',
      geo: 'in',
      placement: 'ig-reels',
      referral: 'Partner-A',
      referrerHost: 'www.google.com',
      landingPath: '/early-access',
      capturedAt: NOW.toISOString(),
    });
  });

  it('supports partial campaigns, external referrers, and direct visits', () => {
    expect(visit('?utm_campaign=launch')).toMatchObject({
      kind: 'campaign',
      campaign: 'launch',
    });
    expect(visit('', 'https://news.ycombinator.com/item?id=1')).toMatchObject({
      kind: 'referral',
      source: 'news.ycombinator.com',
      medium: 'referral',
      referrerHost: 'news.ycombinator.com',
    });
    expect(visit('', 'https://bytesizedcareers.com/')).toMatchObject({
      kind: 'direct',
      source: 'direct',
    });
  });

  it('rejects malformed, overlong, markup, control, and repeated values without retaining unknown parameters', () => {
    const result = visit(
      `?utm_source=first&utm_source=second&utm_medium=${'x'.repeat(101)}&utm_campaign=%3Cscript%3Ealert(1)%3C%2Fscript%3E&utm_content=line%0Abreak&email=person%40example.com&resumeToken=secret&fbclid=discard`,
    );
    expect(result).toEqual({
      version: 1,
      kind: 'direct',
      source: 'direct',
      landingPath: '/early-access',
      capturedAt: NOW.toISOString(),
    });
    expect(JSON.stringify(result)).not.toMatch(/email|resume|fbclid|script/i);
  });

  it('keeps first touch immutable and updates last touch only for a new explicit visit', () => {
    const reddit = visit('?utm_source=reddit&utm_medium=community&utm_campaign=feedback');
    const initial = mergeAttributionVisit(null, reddit);
    const directReturn = mergeAttributionVisit(initial, visit(''));
    expect(directReturn.firstTouch).toEqual(reddit);
    expect(directReturn.lastTouch).toEqual(reddit);
    expect(directReturn.currentTouch).toBeUndefined();

    const meta = visit('?utm_source=meta&utm_medium=paid-social&utm_campaign=india');
    const updated = mergeAttributionVisit(directReturn, meta);
    expect(updated.firstTouch).toEqual(reddit);
    expect(updated.lastTouch).toEqual(meta);
    expect(updated.currentTouch).toEqual(meta);

    const internalDuplicate = mergeAttributionVisit(updated, meta, true);
    expect(internalDuplicate).toEqual({
      version: 1,
      firstTouch: reddit,
      lastTouch: meta,
    });
  });

  it('rejects arbitrary nested fields in server-bound submissions', () => {
    const touch = visit('?utm_source=meta');
    expect(
      attributionSubmissionSchema.safeParse({
        version: 1,
        firstTouch: { ...touch, email: 'not-allowed@example.com' },
        lastTouch: touch,
      }).success,
    ).toBe(false);
  });
});

describe('attribution browser persistence', () => {
  beforeEach(() => window.localStorage.clear());

  it('stores no personal information and restores a valid versioned state', () => {
    const touch = visit('?utm_source=reddit');
    const state = { version: ATTRIBUTION_VERSION, firstTouch: touch, lastTouch: touch };
    storeAttribution(state);
    expect(loadAttribution()).toEqual(state);
    expect(window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY)).not.toMatch(/email|token/i);
  });

  it('clears invalid stored state and safely migrates version zero', () => {
    window.localStorage.setItem(ATTRIBUTION_STORAGE_KEY, '{"version":1,"bad":true}');
    expect(loadAttribution()).toBeNull();
    expect(window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY)).toBeNull();

    const touch = visit('?utm_source=linkedin');
    const legacyTouch = { ...touch, version: 0 };
    window.localStorage.setItem(
      ATTRIBUTION_STORAGE_KEY,
      JSON.stringify({ version: 0, firstTouch: legacyTouch, lastTouch: legacyTouch }),
    );
    const migrated = loadAttribution();
    expect(attributionStateSchema.safeParse(migrated).success).toBe(true);
    expect(migrated?.version).toBe(1);
    expect(JSON.parse(window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY) ?? '{}').version).toBe(1);
  });
});

import { describe, expect, it } from 'vitest';
import { filtersToQuery, parseLeadFilters } from '@/lib/admin/filters';

describe('admin filter contract', () => {
  it('parses practical outreach combinations and ignores invalid taxonomy keys', () => {
    const parsed = parseLeadFilters({
      role: 'both',
      completion: 'completed',
      verification: 'verified',
      phonePresent: 'true',
      seekerGroup: 'strategy_growth',
      seekerNeed: 'content_strategy',
      recruiterNeed: 'video_editors',
      hasCustomResponse: 'true',
      hasAdditionalContext: 'true',
      source: 'linkedin',
      utmCampaign: 'launch-2026',
      updatedFrom: '2026-07-05',
      updatedTo: '2026-07-20',
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
      sort: 'name_desc',
    });
    expect(parsed).toMatchObject({
      role: 'both',
      completion: 'completed',
      verification: 'verified',
      phonePresent: true,
      seekerGroup: 'strategy_growth',
      seekerNeed: 'content_strategy',
      recruiterNeed: 'video_editors',
      hasCustomResponse: true,
      hasAdditionalContext: true,
      source: 'linkedin',
      utmCampaign: 'launch-2026',
      updatedFrom: '2026-07-05',
      updatedTo: '2026-07-20',
      sort: 'name_desc',
    });
  });

  it('round-trips URL-synced filters', () => {
    const filters = parseLeadFilters({
      role: 'seeker',
      seekerNeed: 'video_editing',
      phoneVerified: 'false',
      sort: 'oldest',
    });
    const query = Object.fromEntries(new URLSearchParams(filtersToQuery(filters)));
    expect(query).toEqual({
      role: 'seeker',
      seekerNeed: 'video_editing',
      phoneVerified: 'false',
      sort: 'oldest',
    });
  });
});

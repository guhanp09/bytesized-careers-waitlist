import { describe, expect, it } from 'vitest';
import { withSupportedAttribution } from '@/lib/attribution/early-access-link';

describe('early-access attribution links', () => {
  it('forwards only supported bounded attribution parameters', () => {
    expect(
      withSupportedAttribution('/early-access', {
        utm_source: 'linkedin',
        utm_medium: 'outbound',
        utm_campaign: 'launch',
        utm_content: 'agency-dm-a',
        utm_term: 'creator-hiring',
        utm_geo: 'IN',
        utm_placement: 'dm',
        ref: 'partner-a',
        source: 'legacy-is-not-forwarded',
        arbitrary: 'not-forwarded',
      }),
    ).toBe('/early-access?utm_source=linkedin&utm_medium=outbound&utm_campaign=launch&utm_content=agency-dm-a&utm_term=creator-hiring&utm_geo=in&utm_placement=dm&ref=partner-a');
  });

  it('ignores repeated extras, control characters, empty values, and oversized input', () => {
    expect(
      withSupportedAttribution('/early-access', {
        ref: ['partner', 'ignored'],
        utm_medium: 'social\nunsafe',
        utm_campaign: 'x'.repeat(201),
        utm_source: '',
      }),
    ).toBe('/early-access');
  });
});

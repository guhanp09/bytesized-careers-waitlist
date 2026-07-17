import { describe, expect, it } from 'vitest';
import { withSupportedAttribution } from '@/lib/attribution/early-access-link';

describe('early-access attribution links', () => {
  it('forwards only supported bounded attribution parameters', () => {
    expect(
      withSupportedAttribution('/early-access', {
        utm_source: 'linkedin',
        utm_campaign: 'launch',
        source: 'invite',
        arbitrary: 'not-forwarded',
      }),
    ).toBe('/early-access?source=invite&utm_source=linkedin&utm_campaign=launch');
  });

  it('ignores repeated extras, control characters, empty values, and oversized input', () => {
    expect(
      withSupportedAttribution('/early-access', {
        ref: ['partner', 'ignored'],
        utm_medium: 'social\nunsafe',
        utm_campaign: 'x'.repeat(201),
        utm_source: '',
      }),
    ).toBe('/early-access?ref=partner');
  });
});

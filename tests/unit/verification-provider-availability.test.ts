import { describe, expect, it } from 'vitest';
import { resolveVerificationAvailability } from '@/lib/verification/providers';

const enabled = {
  emailVerificationEnabled: true,
  localVerificationEnabled: false,
  emailDeliveryEnabled: true,
  resendConfigured: true,
};

describe('verification provider availability', () => {
  it('uses Resend only when every production email gate is enabled', () => {
    expect(resolveVerificationAvailability('email', enabled)).toEqual({
      available: true,
      mode: 'resend',
    });
  });

  it.each([
    ['verification_disabled', { ...enabled, emailVerificationEnabled: false }],
    ['email_delivery_disabled', { ...enabled, emailDeliveryEnabled: false }],
    ['resend_not_configured', { ...enabled, resendConfigured: false }],
  ] as const)('returns the honest %s fallback reason', (reason, config) => {
    expect(resolveVerificationAvailability('email', config)).toEqual({
      available: false,
      reason,
    });
  });

  it('keeps local development and unsupported phone verification distinct', () => {
    expect(
      resolveVerificationAvailability('email', {
        ...enabled,
        localVerificationEnabled: true,
      }),
    ).toEqual({ available: true, mode: 'local' });
    expect(resolveVerificationAvailability('phone', enabled)).toEqual({
      available: false,
      reason: 'unsupported_channel',
    });
  });
});

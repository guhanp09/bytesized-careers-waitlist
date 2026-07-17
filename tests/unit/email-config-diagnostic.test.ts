import { describe, expect, it } from 'vitest';
import {
  getProductionEmailConfigDiagnostic,
  getUnexpectedProductionEmailConfig,
} from '@/lib/email/config-diagnostic';

const healthyConfig = {
  EMAIL_VERIFICATION_ENABLED: 'true',
  EMAIL_DELIVERY_ENABLED: 'true',
  RESEND_API_KEY: 'synthetic-key-material',
  EMAIL_FROM_ADDRESS: 'Synthetic Sender <sender@example.test>',
  LOCAL_VERIFICATION_ENABLED: 'false',
};

describe('production email configuration diagnostic', () => {
  it('reports only sanitized release statuses for a healthy configuration', () => {
    const diagnostic = getProductionEmailConfigDiagnostic(healthyConfig);

    expect(diagnostic).toEqual({
      EMAIL_VERIFICATION_ENABLED: 'enabled',
      EMAIL_DELIVERY_ENABLED: 'enabled',
      RESEND_API_KEY: 'present',
      EMAIL_FROM_ADDRESS: 'present',
      LOCAL_VERIFICATION_ENABLED: 'disabled',
    });
    expect(Object.keys(diagnostic)).toHaveLength(5);
    expect(getUnexpectedProductionEmailConfig(diagnostic)).toEqual([]);

    const serialized = JSON.stringify(diagnostic);
    expect(serialized).not.toContain(healthyConfig.RESEND_API_KEY);
    expect(serialized).not.toContain(healthyConfig.EMAIL_FROM_ADDRESS);
  });

  it.each([
    ['EMAIL_VERIFICATION_ENABLED', { EMAIL_VERIFICATION_ENABLED: 'false' }],
    ['EMAIL_DELIVERY_ENABLED', { EMAIL_DELIVERY_ENABLED: undefined }],
    ['RESEND_API_KEY', { RESEND_API_KEY: '   ' }],
    ['EMAIL_FROM_ADDRESS', { EMAIL_FROM_ADDRESS: '' }],
    ['LOCAL_VERIFICATION_ENABLED', { LOCAL_VERIFICATION_ENABLED: 'true' }],
  ] as const)('identifies an unsafe %s status by name only', (key, override) => {
    const diagnostic = getProductionEmailConfigDiagnostic({
      ...healthyConfig,
      ...override,
    });

    expect(getUnexpectedProductionEmailConfig(diagnostic)).toEqual([key]);
  });

  it('uses the runtime flag semantics, including the supported 1 form', () => {
    const diagnostic = getProductionEmailConfigDiagnostic({
      ...healthyConfig,
      EMAIL_VERIFICATION_ENABLED: '1',
      EMAIL_DELIVERY_ENABLED: '1',
      LOCAL_VERIFICATION_ENABLED: '0',
    });

    expect(getUnexpectedProductionEmailConfig(diagnostic)).toEqual([]);
  });
});

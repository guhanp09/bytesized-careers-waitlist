export const productionEmailConfigKeys = [
  'EMAIL_VERIFICATION_ENABLED',
  'EMAIL_DELIVERY_ENABLED',
  'RESEND_API_KEY',
  'EMAIL_FROM_ADDRESS',
  'LOCAL_VERIFICATION_ENABLED',
] as const;

export type ProductionEmailConfigKey = (typeof productionEmailConfigKeys)[number];

export type ProductionEmailConfigDiagnostic = Readonly<{
  EMAIL_VERIFICATION_ENABLED: 'enabled' | 'disabled';
  EMAIL_DELIVERY_ENABLED: 'enabled' | 'disabled';
  RESEND_API_KEY: 'present' | 'missing';
  EMAIL_FROM_ADDRESS: 'present' | 'missing';
  LOCAL_VERIFICATION_ENABLED: 'enabled' | 'disabled';
}>;

type EnvironmentSource = Readonly<Record<string, string | undefined>>;

/** Keep feature-flag interpretation identical to the application's runtime parsing. */
export function isEnabledFlag(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}

function isPresent(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

/**
 * Return a deliberately lossy configuration view that is safe for build logs.
 * Source values must never be added to this result.
 */
export function getProductionEmailConfigDiagnostic(
  source: EnvironmentSource,
): ProductionEmailConfigDiagnostic {
  return {
    EMAIL_VERIFICATION_ENABLED: isEnabledFlag(source.EMAIL_VERIFICATION_ENABLED)
      ? 'enabled'
      : 'disabled',
    EMAIL_DELIVERY_ENABLED: isEnabledFlag(source.EMAIL_DELIVERY_ENABLED)
      ? 'enabled'
      : 'disabled',
    RESEND_API_KEY: isPresent(source.RESEND_API_KEY) ? 'present' : 'missing',
    EMAIL_FROM_ADDRESS: isPresent(source.EMAIL_FROM_ADDRESS) ? 'present' : 'missing',
    // Inspect the configured flag, not env.localVerificationEnabled: runtime parsing
    // intentionally masks this flag in production, while the release gate must catch it.
    LOCAL_VERIFICATION_ENABLED: isEnabledFlag(source.LOCAL_VERIFICATION_ENABLED)
      ? 'enabled'
      : 'disabled',
  };
}

/** Return names only; callers must never attach the corresponding source values. */
export function getUnexpectedProductionEmailConfig(
  diagnostic: ProductionEmailConfigDiagnostic,
): ProductionEmailConfigKey[] {
  const unexpected: ProductionEmailConfigKey[] = [];

  if (diagnostic.EMAIL_VERIFICATION_ENABLED !== 'enabled') {
    unexpected.push('EMAIL_VERIFICATION_ENABLED');
  }
  if (diagnostic.EMAIL_DELIVERY_ENABLED !== 'enabled') {
    unexpected.push('EMAIL_DELIVERY_ENABLED');
  }
  if (diagnostic.RESEND_API_KEY !== 'present') {
    unexpected.push('RESEND_API_KEY');
  }
  if (diagnostic.EMAIL_FROM_ADDRESS !== 'present') {
    unexpected.push('EMAIL_FROM_ADDRESS');
  }
  if (diagnostic.LOCAL_VERIFICATION_ENABLED !== 'disabled') {
    unexpected.push('LOCAL_VERIFICATION_ENABLED');
  }

  return unexpected;
}

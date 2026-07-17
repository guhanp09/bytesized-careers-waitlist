import {
  getProductionEmailConfigDiagnostic,
  getUnexpectedProductionEmailConfig,
} from '../src/lib/email/config-diagnostic';

function isProductionCheck(): boolean {
  if (process.argv.includes('--production')) return true;

  return (
    process.env.VERCEL_TARGET_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production'
  );
}

const diagnostic = getProductionEmailConfigDiagnostic(process.env);
const unexpected = getUnexpectedProductionEmailConfig(diagnostic);

// This object is deliberately the only configuration data written to stdout.
console.log(JSON.stringify(diagnostic, null, 2));

if (isProductionCheck() && unexpected.length > 0) {
  // Names and expected statuses are public configuration; source values stay unread.
  console.error(
    `[production-email-config] FAILED: unexpected status for ${unexpected.join(', ')}.`,
  );
  process.exitCode = 1;
}

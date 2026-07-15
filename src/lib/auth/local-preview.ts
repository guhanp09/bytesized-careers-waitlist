import 'server-only';
import { env } from '@/lib/env';
import { isLocalPreviewRequest } from '@/lib/auth/local-preview-shared';

export { isLocalPreviewRequest } from '@/lib/auth/local-preview-shared';

/** Disabled by default and impossible on non-local hosts or production builds. */
export function localAdminPreviewAllowed(host: string | null): boolean {
  return isLocalPreviewRequest({
    enabled: env.localAdminPreviewEnabled,
    nodeEnv: env.NODE_ENV,
    host,
  });
}

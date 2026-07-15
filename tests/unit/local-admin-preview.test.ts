import { describe, expect, it } from 'vitest';
import { isLocalPreviewRequest } from '@/lib/auth/local-preview-shared';

describe('local admin preview security boundary', () => {
  it('requires the explicit flag and a local development host', () => {
    expect(isLocalPreviewRequest({ enabled: false, nodeEnv: 'development', host: 'localhost:3001' })).toBe(false);
    expect(isLocalPreviewRequest({ enabled: true, nodeEnv: 'development', host: 'localhost:3001' })).toBe(true);
    expect(isLocalPreviewRequest({ enabled: true, nodeEnv: 'development', host: '127.0.0.1:3001' })).toBe(true);
  });

  it('cannot activate in production or on a public host', () => {
    expect(isLocalPreviewRequest({ enabled: true, nodeEnv: 'production', host: 'localhost:3001' })).toBe(false);
    expect(isLocalPreviewRequest({ enabled: true, nodeEnv: 'development', host: 'bytesizedcareers.com' })).toBe(false);
  });
});

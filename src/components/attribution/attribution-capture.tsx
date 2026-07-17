'use client';

import { useEffect } from 'react';
import { captureAttribution } from '@/lib/utils/attribution-storage';

export function AttributionCapture({ landingPath }: { landingPath: '/' | '/early-access' }) {
  useEffect(() => {
    captureAttribution(landingPath);
  }, [landingPath]);
  return null;
}

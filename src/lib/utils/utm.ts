import { captureAttribution } from '@/lib/utils/attribution-storage';

/** Read the validated browser record, incorporating the current early-access visit. */
export function readAttribution() {
  return captureAttribution('/early-access');
}

import { redirect } from 'next/navigation';
import {
  withSupportedAttribution,
  type PublicSearchParams,
} from '@/lib/attribution/early-access-link';

export default async function PrivacyRedirect({
  searchParams,
}: {
  searchParams: Promise<PublicSearchParams>;
}) {
  redirect(withSupportedAttribution('/early-access/privacy', await searchParams));
}

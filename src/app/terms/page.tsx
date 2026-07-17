import { redirect } from 'next/navigation';
import {
  withSupportedAttribution,
  type PublicSearchParams,
} from '@/lib/attribution/early-access-link';

export default async function TermsRedirect({
  searchParams,
}: {
  searchParams: Promise<PublicSearchParams>;
}) {
  redirect(withSupportedAttribution('/early-access/terms', await searchParams));
}

import {
  createShareImage,
  shareImageContentType,
  shareImageSize,
} from '@/lib/social/share-image';

export const size = shareImageSize;
export const contentType = shareImageContentType;
export const alt = 'ByteSized Careers early access for creator-economy work and talent';

export default function OpenGraphImage() {
  return createShareImage({
    kicker: 'ByteSized Careers · Early access',
    headline: 'Your brief for creator-economy work and talent.',
    body: 'Join before launch and tell us what kind of work or reliable talent you are looking for.',
  });
}

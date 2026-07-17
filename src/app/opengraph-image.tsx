import {
  createShareImage,
  shareImageContentType,
  shareImageSize,
} from '@/lib/social/share-image';

export const size = shareImageSize;
export const contentType = shareImageContentType;
export const alt = 'ByteSized Careers — a creator-economy hiring marketplace being built';

export default function OpenGraphImage() {
  return createShareImage({
    kicker: 'ByteSized Careers · In development',
    headline: 'Creator-economy hiring, brought into focus.',
    body: 'A focused marketplace for creator-economy work and reliable talent is being built.',
  });
}

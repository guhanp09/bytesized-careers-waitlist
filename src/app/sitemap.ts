import type { MetadataRoute } from 'next';

const origin = 'https://bytesizedcareers.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${origin}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${origin}/early-access`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${origin}/early-access/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${origin}/early-access/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${origin}/early-access/cookies`, changeFrequency: 'yearly', priority: 0.3 },
  ];
}

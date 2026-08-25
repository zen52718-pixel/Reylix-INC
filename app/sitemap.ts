import type { MetadataRoute } from 'next';
import { siteUrl } from '@/components/marketing/content';

/** Public, indexable pages. Privacy and terms are excluded while they are placeholders. */
const ROUTES = ['', '/products', '/for-clients', '/for-publishers', '/about', '/contact', '/become-a-partner'];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const lastModified = new Date();
  return ROUTES.map((path) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: path === '' ? 1 : 0.7,
  }));
}

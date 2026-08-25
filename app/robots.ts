import type { MetadataRoute } from 'next';
import { siteUrl } from '@/components/marketing/content';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The API is not content; keeping crawlers out of it avoids pointless POST probing.
      disallow: ['/api/'],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}

import type { MetadataRoute } from 'next';
import { siteUrl } from '@/components/marketing/content';

/**
 * Public, indexable pages. Privacy and terms are excluded while they are placeholders and
 * carry `noindex`; listing a noindexed URL in a sitemap sends search engines two opposite
 * instructions about the same page.
 *
 * Deliberately only `url`, with no `lastModified`, `changeFrequency` or `priority`:
 *
 *  - `lastModified` used to be `new Date()`, which meant every page claimed to have changed
 *    at build time on every single build, including pages nobody had touched. A lastmod that
 *    is always "now" is noise, and search engines learn to ignore the field. Stating nothing
 *    is more honest than stating something false, so the field is omitted until there is a
 *    real per-page modification date to report.
 *  - `changeFrequency` and `priority` are documented by Google as ignored, and Bing treats
 *    them as hints at best. They were decoration.
 */
const ROUTES = [
  '',
  '/products',
  '/for-clients',
  '/for-publishers',
  '/about',
  '/contact',
  '/become-a-partner',
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return ROUTES.map((path) => ({ url: `${base}${path}` }));
}

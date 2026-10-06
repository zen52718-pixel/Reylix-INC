import type { Metadata } from 'next';
import {
  COMPANY_ADDRESS,
  CONTACT_EMAIL,
  LEGAL_NAME,
  siteUrl,
} from '@/components/marketing/content';

/**
 * Metadata and structured data helpers.
 *
 * Both exist for the same reason: the facts about Reylix should be stated once. Before this,
 * every page inherited the root layout's `openGraph` block wholesale, so all nine pages
 * shared one og:title, one og:description and — worse — one og:url pointing at the homepage.
 * Sharing any inner page presented it as the homepage.
 *
 * Nothing here asserts anything the site does not already say in its own copy. No social
 * profiles, no phone number, no founding date, no ratings, no awards: unverified properties
 * are omitted rather than guessed, because structured data is a machine-readable claim and a
 * wrong one is worse than a missing one.
 */

const SITE_NAME = 'Reylix INC';

/** Stable @id anchors so nodes can reference each other instead of repeating themselves. */
export const ORG_ID = `${siteUrl()}/#organization`;
export const WEBSITE_ID = `${siteUrl()}/#website`;

/** Absolute URL for a site-relative path. Schema.org wants absolute, unlike Next metadata. */
function abs(path: string): string {
  return path === '/' ? siteUrl() : `${siteUrl()}${path}`;
}

type PageMetaInput = {
  /** Site-relative, leading slash. `/` for the homepage. */
  path: string;
  /** The page title WITHOUT the "| Reylix INC" suffix — the template adds it. */
  title: string;
  description: string;
  /** Only for pages deliberately kept out of the index. */
  robots?: Metadata['robots'];
};

/**
 * Per-page metadata with Open Graph and Twitter that actually describe THAT page.
 *
 * `openGraph.title` repeats the suffix by hand because Next applies `title.template` to the
 * document title, not to Open Graph — without it, a shared link reads "About" with no company
 * name attached.
 */
export function pageMetadata({ path, title, description, robots }: PageMetaInput): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_US',
      title: fullTitle,
      description,
      url: path,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
    },
    ...(robots ? { robots } : {}),
  };
}

/** The company. Address and email are the ones already published on the site. */
export function organizationSchema() {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_NAME,
    legalName: 'REYLIX INC.',
    url: siteUrl(),
    // 180x180, comfortably over the 112px minimum Google asks of an Organization logo.
    logo: abs('/apple-icon.png'),
    image: abs('/opengraph-image.png'),
    email: CONTACT_EMAIL,
    description:
      `${LEGAL_NAME} is a U.S.-registered customer acquisition company that builds and operates ` +
      'customer acquisition systems for businesses, connecting marketing, intelligent automation, ' +
      'sales and follow-up into one connected system.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: COMPANY_ADDRESS.line1,
      addressLocality: COMPANY_ADDRESS.city,
      addressRegion: COMPANY_ADDRESS.state,
      postalCode: COMPANY_ADDRESS.postalCode,
      addressCountry: 'US',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        email: CONTACT_EMAIL,
        areaServed: 'US',
        availableLanguage: 'English',
      },
    ],
  };
}

/** The site itself. No SearchAction: there is no site search, and claiming one would be false. */
export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: siteUrl(),
    name: SITE_NAME,
    inLanguage: 'en-US',
    publisher: { '@id': ORG_ID },
  };
}

type Crumb = { name: string; path: string };

/** Breadcrumbs. Omitted on the homepage, where a single-item trail says nothing. */
export function breadcrumbSchema(crumbs: readonly Crumb[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: abs(c.path),
    })),
  };
}

type PageSchemaInput = {
  path: string;
  name: string;
  description: string;
  /** `WebPage` unless the page is specifically an about or contact page. */
  type?: 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage';
  breadcrumbs?: readonly Crumb[];
};

/** The page node, tied back to the site and company rather than restating them. */
export function webPageSchema({
  path,
  name,
  description,
  type = 'WebPage',
  breadcrumbs,
}: PageSchemaInput) {
  return {
    '@type': type,
    '@id': `${abs(path)}#webpage`,
    url: abs(path),
    name,
    description,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORG_ID },
    inLanguage: 'en-US',
    ...(breadcrumbs?.length ? { breadcrumb: breadcrumbSchema(breadcrumbs) } : {}),
  };
}

/**
 * A service Reylix provides. `provider` points at the Organization node.
 *
 * No `offers`, no `aggregateRating`, no `priceRange` — none of that is published, and
 * inventing it would be a false claim in a format search engines treat as factual.
 */
export function serviceSchema({
  name,
  description,
  serviceType,
}: {
  name: string;
  description: string;
  serviceType: string;
}) {
  return {
    '@type': 'Service',
    name,
    description,
    serviceType,
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'Country', name: 'United States' },
  };
}

/** Wrap nodes into one @graph document, which is tidier than many separate script tags. */
export function graph(...nodes: object[]) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}

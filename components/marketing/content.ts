/**
 * Site content that appears in more than one place.
 *
 * Kept out of the page components so the industry list, nav and legal name have exactly
 * one definition — adding a vertical is a one-line change, not a search-and-replace
 * across six pages.
 *
 * This is marketing copy only. It deliberately does not import from `src/` — the public
 * site has no business reaching into the platform's domain layer.
 */

/** Registered company name, shown in the footer and legal pages. */
export const LEGAL_NAME = 'Reylix INC';

/**
 * Canonical origin, used for metadataBase, every page's canonical URL, Open Graph, the
 * sitemap and robots.txt.
 *
 * Resolution order: NEXT_PUBLIC_SITE_URL, then the host Vercel is serving from, then
 * localhost. Set NEXT_PUBLIC_SITE_URL once the real domain exists; until then the site
 * self-describes as its deployment host, which is true, rather than as a domain nobody owns.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  // Fall back to the host the deployment is actually served from. Guessing a domain here is
  // not a cosmetic default: this value becomes every page's canonical URL, and a canonical
  // pointing at a domain we do not control tells search engines to de-index the real site.
  // Vercel injects these; VERCEL_URL is the per-deployment host used for previews.
  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;

  return 'http://localhost:3000';
}

/**
 * Public contact details. One definition, so the footer, the contact page and the legal
 * pages cannot drift apart.
 *
 * The two addresses below are also the defaults for form routing in `src/config/env.ts`
 * (CONTACT_INQUIRY_EMAIL / PUBLISHER_INQUIRY_EMAIL). They are duplicated deliberately: this
 * file is bundled for the browser and must never import server configuration. If one side
 * changes, change the other.
 *
 * `noreply@reylixinc.com` is the SMTP sending identity and is NEVER displayed publicly.
 */
export const CONTACT_EMAIL = 'info@reylixinc.com';
export const PUBLISHER_EMAIL = 'publishers@reylixinc.com';

export const COMPANY_ADDRESS = {
  line1: '159 Avis Street',
  city: 'Rochester',
  state: 'NY',
  postalCode: '14615',
  country: 'USA',
} as const;

/** The address as a human reads it, one line per row. */
export const ADDRESS_LINES: readonly string[] = [
  COMPANY_ADDRESS.line1,
  `${COMPANY_ADDRESS.city}, ${COMPANY_ADDRESS.state} ${COMPANY_ADDRESS.postalCode}`,
  COMPANY_ADDRESS.country,
];

export interface NavItem {
  href: string;
  label: string;
}

export const NAV: NavItem[] = [
  { href: '/products', label: 'Products' },
  { href: '/for-clients', label: 'For Clients' },
  { href: '/for-publishers', label: 'For Publishers' },
  { href: '/about', label: 'About' },
];

export interface Vertical {
  slug: string;
  name: string;
  /** One line, used on the home page industries list. */
  short: string;
  /** The fuller description used on /products. */
  detail: string;
}

/**
 * The industry systems Reylix operates.
 *
 * Real Estate is where the system started; each of the others is built around how that
 * industry actually acquires and qualifies customers. Order here is the order they appear
 * across the site. All five are operating — none is ever labelled planned or coming soon.
 */
export const VERTICALS: Vertical[] = [
  {
    slug: 'real-estate',
    name: 'Real Estate',
    short: 'Buyer and seller acquisition systems.',
    detail:
      'Buyer and seller acquisition systems built around high-value transactions and long decision cycles.',
  },
  {
    slug: 'home-services',
    name: 'Home Services',
    short: 'Lead capture, qualification, booking, and follow-up systems.',
    detail:
      'Lead capture, qualification, booking, and follow-up systems for time-sensitive service requests.',
  },
  {
    slug: 'legal',
    name: 'Legal',
    short: 'Intake and qualification systems designed around high-intent inquiries.',
    detail:
      'Intake and qualification systems designed around high-intent, high-stakes inquiries.',
  },
  {
    slug: 'insurance',
    name: 'Insurance',
    short: 'Customer acquisition and qualification workflows.',
    detail:
      'Customer acquisition and qualification workflows built for policy and coverage decisions.',
  },
  {
    slug: 'healthcare',
    name: 'Healthcare',
    short: 'Patient and customer acquisition systems.',
    detail: 'Patient and customer acquisition systems built around trust and responsiveness.',
  },
];

/** Industry options offered in the contact form's Industry select. */
export const INDUSTRY_OPTIONS = [...VERTICALS.map((v) => v.name), 'Other'];

/**
 * Consent wording, shown beside the checkbox and stored verbatim with the submission.
 *
 * These two must never drift apart: what the record says a person agreed to has to be the
 * exact text they were shown. That is the whole point of keeping it in one place.
 */
export const CONSENT_CONTACT =
  'I agree to be contacted by Reylix about my enquiry, including by phone, email and SMS. Consent is not a condition of purchase. Message and data rates may apply.';

export const CONSENT_PARTNER =
  'I agree to be contacted by Reylix about my application, including by phone, email and SMS. Consent is not a condition of participation. Message and data rates may apply.';

/**
 * The six stages of a Reylix acquisition system, from the approved design handoff.
 * Sequential, so the numbering carries real information rather than decorating the page.
 */
export const STAGES = [
  {
    n: '01',
    title: 'Discover',
    body: 'Reach the right audience through targeted acquisition channels.',
  },
  {
    n: '02',
    title: 'Capture',
    body: 'Convert interest into measurable, actionable prospects.',
  },
  {
    n: '03',
    title: 'Qualify',
    body: 'Identify intent, fit, and readiness before opportunities reach sales.',
  },
  {
    n: '04',
    title: 'Engage',
    body: 'Use intelligent workflows to respond at the right moment.',
  },
  {
    n: '05',
    title: 'Follow Up',
    body: 'Keep prospects engaged with consistent communication.',
  },
  {
    n: '06',
    title: 'Convert',
    body: 'Move qualified opportunities toward customers.',
  },
] as const;

/** The six pieces of infrastructure the system is assembled from (home, dark section). */
export const INFRASTRUCTURE = [
  { name: 'AI', body: 'Intelligent conversations and qualification.' },
  { name: 'Automation', body: 'Workflows that eliminate repetitive manual processes.' },
  { name: 'CRM', body: 'Centralized customer and opportunity management.' },
  { name: 'Websites', body: 'Conversion-focused digital experiences.' },
  { name: 'Paid Acquisition', body: 'Traffic and demand generation.' },
  { name: 'Sales Systems', body: 'Processes that turn opportunities into revenue.' },
] as const;

/** What breaks when acquisition is assembled from disconnected parts (home, section 2). */
export const BROKEN_JOURNEY = [
  'Traffic',
  'Disconnected forms',
  'Slow response',
  'Weak qualification',
  'Missed follow-up',
  'Lost customer',
] as const;

/** Capability tags shown against every industry system on /products. */
export const CAPABILITY_TAGS = [
  'Acquisition',
  'Lead Capture',
  'Qualification',
  'Automation',
  'Follow-Up',
  'CRM / Sales Workflow',
  'Conversion',
] as const;

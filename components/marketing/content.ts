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
  summary: string;
  capabilities: string[];
}

/**
 * The industry systems Reylix operates.
 *
 * Real Estate is where the system started; each of the others is built around how that
 * industry actually acquires and qualifies customers. Order here is the order they appear
 * across the site.
 */
export const VERTICALS: Vertical[] = [
  {
    slug: 'real-estate',
    name: 'Real Estate',
    summary:
      'Buyer and seller acquisition systems for real estate professionals — combining digital presence, property presentation, lead capture, qualification, automated follow-up, property matching and appointment booking.',
    capabilities: [
      'Digital presence and property presentation',
      'Buyer and seller lead capture',
      'Requirement and timeline qualification',
      'Property matching',
      'Automated follow-up',
      'Showing and consultation booking',
    ],
  },
  {
    slug: 'home-services',
    name: 'Home Services',
    summary:
      'Customer acquisition systems for contractors, roofers, remodelers and service businesses — from estimate requests and qualification to scheduling and follow-up.',
    capabilities: [
      'Estimate request capture',
      'Job and service-area qualification',
      'Scheduling',
      'Automated follow-up',
    ],
  },
  {
    slug: 'legal',
    name: 'Legal',
    summary:
      'Client acquisition systems for law firms and legal practices — structured intake, case qualification, practice-area routing and consultation scheduling.',
    capabilities: [
      'Structured intake',
      'Case qualification',
      'Practice-area routing',
      'Consultation scheduling',
    ],
  },
  {
    slug: 'insurance',
    name: 'Insurance',
    summary:
      'Customer acquisition systems for insurance businesses — quote capture, qualification, routing and structured follow-up.',
    capabilities: [
      'Quote request capture',
      'Coverage and eligibility qualification',
      'Agent and product routing',
      'Structured follow-up',
    ],
  },
  {
    slug: 'healthcare',
    name: 'Healthcare',
    summary:
      'Patient acquisition systems for clinics, practices and healthcare providers — enquiry capture, service routing, qualification, appointment scheduling and automated follow-up.',
    capabilities: [
      'Patient enquiry capture',
      'Service and specialty routing',
      'Qualification',
      'Appointment scheduling',
      'Automated follow-up',
    ],
  },
];

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
 * The five stages of a Reylix acquisition system, used on the home page and the client
 * page. Sequential, so the numbering carries real information.
 */
export const STAGES = [
  {
    n: '01',
    title: 'Presence',
    body: 'The digital experience where customers first encounter the business.',
  },
  {
    n: '02',
    title: 'Capture',
    body: 'Industry-specific forms and conversion points designed to collect the information the business actually needs.',
  },
  {
    n: '03',
    title: 'Qualification',
    body: 'Structured questions and workflows identify intent, fit, timeline and requirements.',
  },
  {
    n: '04',
    title: 'Engagement',
    body: 'Automated follow-up and AI-powered agents keep prospects engaged and move conversations forward.',
  },
  {
    n: '05',
    title: 'Conversion',
    body: 'Qualified prospects are routed into the CRM, followed up, scheduled and moved toward a real business conversation.',
  },
] as const;

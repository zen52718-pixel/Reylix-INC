/**
 * Site content that appears in more than one place.
 *
 * Kept out of the page components so the vertical list, nav and legal name have exactly one
 * definition — adding the fifth vertical should be a one-line change, not a search-and-replace
 * across six pages.
 *
 * This is marketing copy only. It deliberately does not import from `src/` — the public site
 * has no business reaching into the platform's domain layer.
 */

/** Registered company name, shown in the footer and legal pages. */
export const LEGAL_NAME = 'Reylix INC';

/**
 * Canonical origin, used for the sitemap and robots file.
 *
 * The production domain has not been chosen yet, so this reads from the environment and
 * falls back to a placeholder. Set NEXT_PUBLIC_SITE_URL in Vercel before launch, or the
 * sitemap will advertise URLs on a domain nobody owns.
 */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://reylix.com';
  return raw.replace(/\/$/, '');
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

export type VerticalStatus = 'available' | 'in-development' | 'planned';

export interface Vertical {
  slug: string;
  name: string;
  status: VerticalStatus;
  summary: string;
  capabilities: string[];
}

/**
 * The vertical systems, in the order they are being built. Real Estate is Product #1;
 * the rest are named because prospects ask "what else", not because they are ready.
 */
export const VERTICALS: Vertical[] = [
  {
    slug: 'real-estate',
    name: 'Real Estate',
    status: 'in-development',
    summary:
      'A complete acquisition system for real estate professionals: buyer and seller capture, qualification, property matching and appointment booking.',
    capabilities: [
      'Buyer and seller capture forms',
      'Automated qualification and follow-up',
      'Property presentation and matching',
      'Appointment scheduling',
      'CRM integration',
    ],
  },
  {
    slug: 'home-services',
    name: 'Home Services',
    status: 'planned',
    summary:
      'Estimate requests, job qualification and scheduling for contractors, roofers and trades.',
    capabilities: [
      'Estimate request capture',
      'Job qualification',
      'Service-area routing',
      'Scheduling and reminders',
    ],
  },
  {
    slug: 'legal',
    name: 'Legal',
    status: 'planned',
    summary:
      'Case intake and qualification for practices where matching the right case matters more than volume.',
    capabilities: ['Case intake', 'Practice-area routing', 'Qualification', 'Consultation booking'],
  },
  {
    slug: 'insurance',
    name: 'Insurance',
    status: 'planned',
    summary: 'Quote requests, coverage qualification and agent handoff for agencies and carriers.',
    capabilities: ['Quote request capture', 'Coverage qualification', 'Agent routing'],
  },
];

export const STATUS_LABEL: Record<VerticalStatus, string> = {
  available: 'Available',
  'in-development': 'In development',
  planned: 'Planned',
};

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

/** The four stages of what Reylix operates, used on the home page and the client page. */
export const STAGES = [
  {
    n: '01',
    title: 'Presence',
    body: 'The site, the profiles and the property or service presentation a customer actually lands on.',
  },
  {
    n: '02',
    title: 'Capture',
    body: 'Forms built for the vertical, so the first contact collects what the business needs to act.',
  },
  {
    n: '03',
    title: 'Qualification',
    body: 'Automated follow-up that finds out intent, timeline and fit before anyone picks up the phone.',
  },
  {
    n: '04',
    title: 'Conversion',
    body: 'Booked appointments in the calendar and a record in the CRM, not a list of names to chase.',
  },
] as const;

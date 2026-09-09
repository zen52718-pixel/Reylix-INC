import Link from 'next/link';
import { LEGAL_NAME, VERTICALS } from '@/components/marketing/content';
import { LogoMark } from '@/components/ui/Logo';

const YEAR = new Date().getFullYear();

const COLUMNS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/for-clients', label: 'For Clients' },
      { href: '/for-publishers', label: 'For Publishers' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Service' },
      { href: '/become-a-partner', label: 'Become a Partner' },
    ],
  },
];

/**
 * The drawer at the bottom of the cabinet: guide headings, then the index beneath each.
 * Headings are set as guide-card lettering rather than as small tracked labels.
 */
export function SiteFooter() {
  return (
    <footer className="border-t-2 border-signal-orange bg-steel-950">
      <div className="gutter grid gap-x-10 gap-y-12 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <LogoMark className="h-6 w-6 text-signal-orange-up" />
          <p className="mt-5 max-w-[30ch] text-fine leading-relaxed text-steel-300">
            Customer acquisition systems for businesses that need customers, not clicks.
          </p>
        </div>

        <nav aria-label="Products">
          <h2 className="border-b border-steel-700 pb-2 font-gothic text-base font-bold uppercase tracking-tab text-card">
            Products
          </h2>
          <ul className="mt-4 space-y-3">
            {VERTICALS.map((v) => (
              <li key={v.slug}>
                <Link
                  href={`/products#${v.slug}`}
                  className="text-fine text-steel-200 transition-colors hover:text-signal-orange-up"
                >
                  {v.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {COLUMNS.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <h2 className="border-b border-steel-700 pb-2 font-gothic text-base font-bold uppercase tracking-tab text-card">
              {col.heading}
            </h2>
            <ul className="mt-4 space-y-3">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-fine text-steel-200 transition-colors hover:text-signal-orange-up"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-steel-800">
        <div className="gutter flex flex-col gap-2 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="datum text-steel-300">
            &copy; {YEAR} {LEGAL_NAME}
          </p>
          {/* State of incorporation intentionally unstated until confirmed. */}
          <p className="datum text-steel-300">A United States C Corporation</p>
        </div>
      </div>
    </footer>
  );
}

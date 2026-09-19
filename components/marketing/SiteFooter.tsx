import Link from 'next/link';
import {
  ADDRESS_LINES,
  CONTACT_EMAIL,
  LEGAL_NAME,
  PUBLISHER_EMAIL,
} from '@/components/marketing/content';

const YEAR = new Date().getFullYear();

const NAVIGATION = [
  { href: '/products', label: 'Products' },
  { href: '/for-clients', label: 'For Clients' },
  { href: '/for-publishers', label: 'For Publishers' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/become-a-partner', label: 'Become a Partner' },
];

const LEGAL = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
];

/**
 * Dark footer: brand block plus two link columns, 1.6fr/1fr/1fr collapsing to one column
 * below 768px, with a hairline-separated bottom bar.
 *
 * Link padding is deliberate, not decoration: without it these sit at 15px tall, under the
 * 24px minimum tap target WCAG 2.5.8 asks for.
 */
export function SiteFooter() {
  return (
    <footer className="bg-surface-darker pb-8 pt-[72px] text-neutral-400">
      <div className="container-rx">
        <div className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xl font-bold text-white">
              <span aria-hidden="true" className="h-[9px] w-[9px] rounded-[2px] bg-brand" />
              REYLIX
            </div>
            <p className="max-w-[320px] text-sm">Customer Acquisition Systems.</p>

            {/* `not-italic` because browsers italicise <address> by default. */}
            <address className="mt-5 text-sm not-italic">
              {ADDRESS_LINES.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>

            <ul className="mt-5 flex flex-col gap-1.5 text-sm">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="inline-block py-1 text-neutral-400 transition-colors hover:text-white"
                >
                  {CONTACT_EMAIL}
                </a>
                <span className="ml-2 text-neutral-400">General</span>
              </li>
              <li>
                <a
                  href={`mailto:${PUBLISHER_EMAIL}`}
                  className="inline-block py-1 text-neutral-400 transition-colors hover:text-white"
                >
                  {PUBLISHER_EMAIL}
                </a>
                <span className="ml-2 text-neutral-400">Publishers</span>
              </li>
            </ul>
          </div>

          <nav aria-label="Navigation">
            <h2 className="mb-4 text-[13px] font-bold uppercase tracking-[0.06em] text-neutral-50">
              Navigation
            </h2>
            <ul className="flex flex-col gap-1.5">
              {NAVIGATION.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-block py-1 text-sm text-neutral-400 transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h2 className="mb-4 text-[13px] font-bold uppercase tracking-[0.06em] text-neutral-50">
              Legal
            </h2>
            <ul className="flex flex-col gap-1.5">
              {LEGAL.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-block py-1 text-sm text-neutral-400 transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-14 flex flex-wrap justify-between gap-3 border-t border-neutral-800 pt-6 text-[13px]">
          <span>
            &copy; {YEAR} {LEGAL_NAME.toUpperCase()}. All rights reserved.
          </span>
          {/*
            This slot used to read "United States". The address above now states the country,
            and both inboxes are listed there too, so anything here would just repeat itself.
            State of incorporation remains deliberately unstated until confirmed.
          */}
        </div>
      </div>
    </footer>
  );
}

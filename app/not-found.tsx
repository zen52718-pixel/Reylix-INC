import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { NAV } from '@/components/marketing/content';
import { PullTab, SectionHead } from '@/components/marketing/primitives';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

/**
 * A branded 404.
 *
 * `app/not-found.tsx` sits outside the (marketing) route group, so it does not inherit that
 * group's layout and has to bring its own header and footer. Without them a mistyped URL is a
 * dead end: Next's default 404 has no navigation at all.
 */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="gutter py-24 sm:py-32">
        <SectionHead title="That page is not in the file." datum="Error 404" />
        <p className="mt-8 max-w-measure text-lead text-steel-200">
          The address you followed does not match anything on this site. It may have been mistyped,
          or the page may have moved.
        </p>

        <nav aria-label="Site sections" className="mt-12">
          <h2 className="border-b-2 border-card-edge pb-2 font-gothic text-lg font-bold uppercase tracking-tab text-card">
            Where to go instead
          </h2>
          <ul className="mt-1">
            {NAV.map((item, i) => (
              <li key={item.href} className="border-b border-steel-700 last:border-0">
                <Link
                  href={item.href}
                  className="flex items-baseline gap-5 py-4 transition-colors hover:text-signal-orange-up"
                >
                  <span className="datum w-6 shrink-0 text-ink-faint">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-gothic text-lg font-semibold uppercase tracking-tab text-card">
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-12">
          <PullTab href="/">Back to the home page</PullTab>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

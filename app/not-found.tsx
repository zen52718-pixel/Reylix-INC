import type { Metadata } from 'next';
import Link from 'next/link';
import { NAV } from '@/components/marketing/content';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { Container, Eyebrow, PrimaryButton } from '@/components/marketing/primitives';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

/**
 * `app/not-found.tsx` sits outside the (marketing) route group, so it does not inherit that
 * group's layout and has to bring its own header and footer. Without them a mistyped URL is
 * a dead end: Next's default 404 has no navigation at all.
 */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="section bg-white pt-[72px]">
        <Container className="max-w-prose">
          <Eyebrow>Error 404</Eyebrow>
          <h1 className="text-[clamp(34px,5vw,56px)] leading-[1.1]">
            We couldn&rsquo;t find that page.
          </h1>
          <p className="mt-5 text-lg">
            The address you followed does not match anything on this site. It may have been
            mistyped, or the page may have moved.
          </p>

          <nav aria-label="Site sections" className="mt-10">
            <h2 className="tag mb-3">Where to go instead</h2>
            <ul className="flex flex-col">
              {NAV.map((item, i) => (
                <li key={item.href} className="border-b border-hairline last:border-0">
                  <Link
                    href={item.href}
                    className="flex items-baseline gap-5 py-4 text-body hover:text-heading"
                  >
                    <span className="text-[13px] font-bold text-muted">0{i + 1}</span>
                    <span className="text-lg font-bold text-heading">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-10">
            <PrimaryButton href="/">Back to the home page</PrimaryButton>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

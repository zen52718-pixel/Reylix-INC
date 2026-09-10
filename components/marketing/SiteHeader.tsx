'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NAV } from '@/components/marketing/content';

/**
 * Sticky 76px navbar: translucent white with a 10px backdrop blur, gaining a bottom border
 * and shadow after 8px of scroll. Below 900px the links and the secondary button collapse
 * into a full-screen menu behind the hamburger.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the menu on navigation — without this the panel stays open over the new page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // A full-screen menu over a scrollable page scrolls the page behind it.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <nav
        aria-label="Main"
        className={`sticky top-0 z-50 border-b bg-white/90 backdrop-blur-[10px] transition-[border-color,box-shadow] duration-300 ${
          scrolled ? 'border-hairline shadow-xs' : 'border-transparent'
        }`}
      >
        <Container>
          <div className="flex h-[76px] items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-[-0.01em] text-heading hover:text-heading">
              <span aria-hidden="true" className="h-[9px] w-[9px] rounded-[2px] bg-brand" />
              REYLIX
            </Link>

            <div className="hidden items-center gap-8 min-[900px]:flex">
              {NAV.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`text-sm font-medium transition-colors ${
                      active ? 'text-heading' : 'text-body hover:text-heading'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/become-a-partner"
                className="hidden rounded-pill border border-neutral-300 px-5 py-2.5 text-sm font-bold text-heading transition-colors hover:border-neutral-400 hover:text-heading min-[900px]:inline-flex"
              >
                Become a Partner
              </Link>
              <Link
                href="/contact"
                className="inline-flex rounded-pill bg-brand px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover hover:text-white"
              >
                Let&rsquo;s Talk
              </Link>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls="mobile-menu"
                className="-mr-2 inline-flex h-11 w-11 items-center justify-center text-heading min-[900px]:hidden"
              >
                <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d={open ? 'M6 6l12 12M6 18L18 6' : 'M4 7h16M4 12h16M4 17h16'} />
                </svg>
              </button>
            </div>
          </div>
        </Container>
      </nav>

      {open && (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 bottom-0 top-[76px] z-40 flex flex-col gap-2 overflow-y-auto bg-white p-6 min-[900px]:hidden"
        >
          {[...NAV, { href: '/become-a-partner', label: 'Become a Partner' }, { href: '/contact', label: "Let's Talk" }].map(
            (item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border-b border-hairline px-1 py-3.5 text-lg font-semibold text-heading hover:text-heading"
              >
                {item.label}
              </Link>
            ),
          )}
        </div>
      )}
    </>
  );
}

function Container({ children }: { children: React.ReactNode }) {
  return <div className="container-rx">{children}</div>;
}

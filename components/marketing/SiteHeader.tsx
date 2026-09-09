'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NAV } from '@/components/marketing/content';
import { Logo } from '@/components/ui/Logo';

/**
 * The rail across the head of the cabinet. Navigation is a row of guide tabs; the one you are
 * standing in is the raised tab, marked by its own signal edge rather than by colour alone.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu on navigation — without this the panel stays open over the new page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-steel-950 bg-steel-900/95 backdrop-blur">
      <div className="gutter flex h-16 items-stretch justify-between gap-6">
        <Link
          href="/"
          aria-label="Reylix home"
          className="flex shrink-0 items-center text-card transition-colors hover:text-signal-orange-up"
        >
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-stretch md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center border-t-2 px-5 font-gothic text-[0.875rem] font-semibold uppercase tracking-tab transition-colors ${
                  active
                    ? 'border-signal-orange-up bg-steel-800 text-card'
                    : 'border-transparent text-steel-300 hover:border-steel-500 hover:text-card'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/contact"
            className="ml-4 flex items-center bg-signal-orange px-6 font-gothic text-[0.875rem] font-semibold uppercase tracking-tab text-card transition-colors hover:bg-[#a03712]"
          >
            Talk to Reylix
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="-mr-2 inline-flex h-16 w-12 items-center justify-center text-card md:hidden"
        >
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            {open ? (
              <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" />
            ) : (
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div id="mobile-nav" className="border-t border-steel-700 bg-steel-900 md:hidden">
          <nav aria-label="Main" className="gutter flex flex-col py-2">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`border-b border-steel-700 py-4 font-gothic text-base font-semibold uppercase tracking-tab last:border-0 ${
                    active ? 'text-signal-orange-up' : 'text-steel-200'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/contact"
              className="mb-3 mt-4 bg-signal-orange px-5 py-4 text-center font-gothic text-base font-semibold uppercase tracking-tab text-card"
            >
              Talk to Reylix
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

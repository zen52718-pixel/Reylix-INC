'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NAV } from '@/components/marketing/content';
import { Logo } from '@/components/ui/Logo';

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu on navigation — without this the panel stays open over the new page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-ink-200 bg-white/90 backdrop-blur">
      <div className="gutter flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label="Reylix home" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`text-[0.92rem] transition-colors hover:text-brand-700 ${
                  active ? 'text-brand-700' : 'text-ink-600'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/contact"
            className="rounded-sm bg-brand-700 px-4 py-2 text-[0.88rem] font-semibold text-white transition-colors hover:bg-brand-800"
          >
            Talk to us
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="-mr-2 inline-flex h-10 w-10 items-center justify-center text-ink-700 md:hidden"
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
        <div id="mobile-nav" className="border-t border-ink-200 bg-white md:hidden">
          <nav aria-label="Main" className="gutter flex flex-col py-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border-b border-ink-100 py-3 text-ink-700 last:border-0"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="mt-3 rounded-sm bg-brand-700 px-4 py-3 text-center font-semibold text-white"
            >
              Talk to us
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

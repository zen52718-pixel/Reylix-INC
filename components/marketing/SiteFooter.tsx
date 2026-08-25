import Link from 'next/link';
import { LEGAL_NAME, VERTICALS } from '@/components/marketing/content';
import { LogoMark } from '@/components/ui/Logo';

const YEAR = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink-200 bg-ink-50">
      <div className="gutter grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <LogoMark className="h-5 w-5 text-brand-700" />
          <p className="mt-4 max-w-[28ch] text-[0.92rem] leading-relaxed text-ink-600">
            Customer acquisition systems for businesses that need customers, not clicks.
          </p>
        </div>

        <nav aria-label="Products">
          <h2 className="label text-ink-500">Products</h2>
          <ul className="mt-4 space-y-2.5">
            {VERTICALS.map((v) => (
              <li key={v.slug}>
                <Link
                  href={`/products#${v.slug}`}
                  className="text-[0.92rem] text-ink-600 hover:text-brand-700"
                >
                  {v.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Company">
          <h2 className="label text-ink-500">Company</h2>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link href="/about" className="text-[0.92rem] text-ink-600 hover:text-brand-700">
                About
              </Link>
            </li>
            <li>
              <Link
                href="/for-clients"
                className="text-[0.92rem] text-ink-600 hover:text-brand-700"
              >
                For Clients
              </Link>
            </li>
            <li>
              <Link
                href="/for-publishers"
                className="text-[0.92rem] text-ink-600 hover:text-brand-700"
              >
                For Publishers
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-[0.92rem] text-ink-600 hover:text-brand-700">
                Contact
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Legal">
          <h2 className="label text-ink-500">Legal</h2>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link href="/privacy" className="text-[0.92rem] text-ink-600 hover:text-brand-700">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-[0.92rem] text-ink-600 hover:text-brand-700">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link
                href="/become-a-partner"
                className="text-[0.92rem] text-ink-600 hover:text-brand-700"
              >
                Become a Partner
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-ink-200">
        <div className="gutter flex flex-col gap-2 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="label text-ink-500">
            &copy; {YEAR} {LEGAL_NAME}
          </p>
          {/* State of incorporation intentionally unstated until confirmed. */}
          <p className="label text-ink-400">A United States C corporation</p>
        </div>
      </div>
    </footer>
  );
}

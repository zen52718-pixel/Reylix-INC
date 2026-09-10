import type { Metadata } from 'next';
import { siteUrl } from '@/components/marketing/content';
import './globals.css';

/**
 * No webfont is loaded. The handoff specifies the system sans stack as the intentional
 * brand choice — it renders instantly, costs nothing to download, and cannot cause a
 * font-swap layout shift. The stack itself lives in `tailwind.config.ts`.
 */

const TITLE = 'Reylix INC — Customer Acquisition Systems';
const DESCRIPTION =
  'Reylix builds customer acquisition systems that connect marketing, intelligent automation, sales and follow-up into one connected system — across real estate, home services, legal, insurance and healthcare.';

export const metadata: Metadata = {
  // Without metadataBase, Next resolves social and canonical URLs against localhost and
  // warns at build time. siteUrl() follows the deployment rather than guessing a domain.
  metadataBase: new URL(siteUrl()),
  title: { default: TITLE, template: '%s | Reylix INC' },
  description: DESCRIPTION,
  applicationName: 'Reylix INC',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Reylix INC',
    title: TITLE,
    description: DESCRIPTION,
    url: '/',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US">
      <body className="bg-white font-sans text-body antialiased">{children}</body>
    </html>
  );
}

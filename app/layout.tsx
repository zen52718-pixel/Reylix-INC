import type { Metadata } from 'next';
import { Public_Sans, Saira_Condensed } from 'next/font/google';
import { siteUrl } from '@/components/marketing/content';
import './globals.css';

/**
 * Two faces, two jobs.
 *
 * Saira Condensed is the engineered lettering of the system: signal tabs, reference datums,
 * rails, navigation and headings. Condensed because a tab is narrow and the caps have to fit.
 * Public Sans is what every fact is actually read in — a workhorse built for public records,
 * legible on a phone in bad light, which is where these visitors are.
 *
 * Both are self-hosted at build time by next/font, so no request leaves the visitor's browser
 * for a font and there is no render-blocking hop.
 */
const gothic = Saira_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-gothic',
  display: 'swap',
});

const text = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-text',
  display: 'swap',
});

const TITLE = 'Reylix INC — Customer Acquisition Systems';
const DESCRIPTION =
  'Reylix INC builds industry-specific customer acquisition systems — digital presence, lead capture, qualification, AI automation, CRM integration and appointment booking, connected as one system.';

export const metadata: Metadata = {
  // Without metadataBase, Next resolves social and canonical URLs against localhost and warns
  // at build time. siteUrl() reads NEXT_PUBLIC_SITE_URL, so this follows the deployment.
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
    <html lang="en-US" className={`${gothic.variable} ${text.variable}`}>
      <body className="bg-steel-800 font-sans text-card antialiased">{children}</body>
    </html>
  );
}

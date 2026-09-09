import type { Metadata } from 'next';
import { Public_Sans, Saira_Condensed } from 'next/font/google';
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

export const metadata: Metadata = {
  title: {
    default: 'Reylix INC — Customer Acquisition Systems',
    template: '%s | Reylix INC',
  },
  description:
    'Reylix INC builds industry-specific customer acquisition systems — digital presence, lead capture, qualification, AI automation, CRM integration and appointment booking, connected as one system.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US" className={`${gothic.variable} ${text.variable}`}>
      <body className="bg-steel-800 font-sans text-card antialiased">{children}</body>
    </html>
  );
}

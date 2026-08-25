import type { Metadata } from 'next';
import { Archivo, JetBrains_Mono, Source_Sans_3 } from 'next/font/google';
import './globals.css';

// Self-hosted at build time by next/font — no request to Google from the visitor's browser,
// which keeps the site free of third-party font tracking and avoids a render-blocking hop.
const display = Archivo({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Reylix INC — Customer acquisition systems',
    template: '%s | Reylix INC',
  },
  description:
    'Reylix builds and operates industry-specific customer acquisition systems that help businesses capture, qualify and convert customers.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="bg-white font-sans text-ink-900 antialiased">{children}</body>
    </html>
  );
}

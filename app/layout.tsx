import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Reylix INC',
    template: '%s | Reylix INC',
  },
  description:
    'Reylix INC builds and owns products, and runs a publisher channel that connects US advertisers with customers.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US">
      <body className="font-sans">{children}</body>
    </html>
  );
}

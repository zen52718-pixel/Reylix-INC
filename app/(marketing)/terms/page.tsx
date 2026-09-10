import type { Metadata } from 'next';
import { LegalPage } from '@/components/marketing/LegalPage';
import { LEGAL_NAME } from '@/components/marketing/content';

export const metadata: Metadata = {
  alternates: { canonical: '/terms' },
  title: 'Terms of Service',
  description: 'The terms under which the Reylix INC website is provided.',
  // Kept noindex until the terms have been through counsel. See docs/production-launch.md.
  robots: { index: false, follow: true },
};

const SECTIONS: [string, string][] = [
  [
    'Use of Site',
    'By accessing this website, you agree to use it only for lawful purposes and in accordance with these terms.',
  ],
  [
    'Description of Services',
    `${LEGAL_NAME} provides customer acquisition systems and related services to businesses. Information on this website is provided for general informational purposes and does not constitute a guarantee of results.`,
  ],
  [
    'Intellectual Property',
    `All content on this website, including text, graphics, and design, is the property of ${LEGAL_NAME} unless otherwise noted, and may not be reproduced without permission.`,
  ],
  [
    'Forms & Submissions',
    'Information submitted through forms on this website is used solely to respond to your inquiry or application and is not shared with unrelated third parties.',
  ],
  [
    'Disclaimers',
    'This website and its content are provided "as is" without warranties of any kind, express or implied.',
  ],
  [
    'Limitation of Liability',
    `${LEGAL_NAME} shall not be liable for any indirect, incidental, or consequential damages arising from use of this website.`,
  ],
  [
    'Governing Law',
    'These terms are governed by the laws of the United States, without regard to conflict-of-law principles.',
  ],
  [
    'Changes to Terms',
    'We may update these terms from time to time. Continued use of the website constitutes acceptance of the updated terms.',
  ],
  ['Contact', 'Questions about these terms can be submitted through our Contact page.'],
];

export default function TermsPage() {
  return <LegalPage title="Terms of Service" sections={SECTIONS} />;
}

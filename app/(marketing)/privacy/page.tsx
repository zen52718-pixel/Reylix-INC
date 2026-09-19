import type { Metadata } from 'next';
import { LegalPage } from '@/components/marketing/LegalPage';
import { ADDRESS_LINES, CONTACT_EMAIL, LEGAL_NAME } from '@/components/marketing/content';

export const metadata: Metadata = {
  alternates: { canonical: '/privacy' },
  title: 'Privacy Policy',
  description: 'How Reylix INC handles information collected through this website.',
  // Kept noindex until the policy has been through counsel. See docs/production-launch.md.
  robots: { index: false, follow: true },
};

const SECTIONS: [string, string][] = [
  [
    'Information We Collect',
    'We may collect information you provide directly, such as your name, business name, email, phone number, and messages submitted through our forms. We may also collect standard technical information such as browser type and pages visited.',
  ],
  [
    'How We Use Information',
    'We use the information we collect to respond to inquiries, operate and improve our website, and communicate with prospective clients and partners. We do not sell personal information.',
  ],
  [
    'Consent to Contact',
    'Where you tick the consent box on a form, we record the exact wording you were shown, the time you submitted it, and the IP address the submission came from. Consent is not a condition of purchase or participation, and you can withdraw it at any time by replying to any message from us and asking us to stop.',
  ],
  [
    'Cookies & Tracking',
    'Our website may use cookies and similar technologies to understand site usage and improve performance. You can control cookie preferences through your browser settings.',
  ],
  [
    'Third-Party Services',
    'We may use third-party tools for analytics, communication, and marketing. These providers may process information on our behalf under their own privacy practices.',
  ],
  [
    'Data Security',
    'We take reasonable measures to protect information submitted to us. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.',
  ],
  [
    'Your Rights',
    'You may contact us to request access to, correction of, or deletion of your personal information, subject to applicable law.',
  ],
  [
    'Changes to This Policy',
    'We may update this privacy policy from time to time. Continued use of the website constitutes acceptance of the updated policy.',
  ],
  [
    'Contact',
    `Questions about this policy can be submitted through our Contact page, or sent to ${CONTACT_EMAIL}. ${LEGAL_NAME}, ${ADDRESS_LINES.join(', ')}.`,
  ],
];

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" sections={SECTIONS} />;
}

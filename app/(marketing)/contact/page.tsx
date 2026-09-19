import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactForm } from '@/components/marketing/ContactForm';
import {
  ADDRESS_LINES,
  CONTACT_EMAIL,
  LEGAL_NAME,
  PUBLISHER_EMAIL,
} from '@/components/marketing/content';
import { Container, Eyebrow } from '@/components/marketing/primitives';

export const metadata: Metadata = {
  alternates: { canonical: '/contact' },
  title: 'Contact',
  description:
    'Tell us about your business and what you are looking to build. We respond to every inquiry personally.',
};

export default function ContactPage() {
  return (
    <section className="section bg-white pt-[72px]">
      <Container>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow>Contact</Eyebrow>
            <h1 className="text-[clamp(32px,4.5vw,52px)] leading-[1.1]">
              Let&rsquo;s build your acquisition system.
            </h1>
            <p className="mt-5 max-w-[420px] text-[17px]">
              Tell us about your business and what you&rsquo;re looking to build. We respond to
              every inquiry personally.
            </p>

            <div className="mt-10 space-y-6 border-t border-hairline pt-6">
              <div>
                <div className="tag">{LEGAL_NAME}</div>
                {/*
                  A postal address is a factual claim, so it is rendered as one: <address> is
                  the element for the contact details of its nearest article or document.
                  `not-italic` because browsers italicise it by default, which the type scale
                  does not ask for.
                */}
                <address className="mt-2 text-[15px] not-italic">
                  {ADDRESS_LINES.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
              </div>

              <div>
                <div className="tag">General inquiries</div>
                <p className="mt-2 text-[15px]">
                  <a href={`mailto:${CONTACT_EMAIL}`} className="inline-block py-1 underline underline-offset-4">
                    {CONTACT_EMAIL}
                  </a>
                </p>
              </div>

              <div>
                <div className="tag">Publisher inquiries</div>
                <p className="mt-2 text-[15px]">
                  <a href={`mailto:${PUBLISHER_EMAIL}`} className="inline-block py-1 underline underline-offset-4">
                    {PUBLISHER_EMAIL}
                  </a>
                </p>
                <p className="mt-1 max-w-[420px] text-[13px] text-muted">
                  Applying to the publisher network?{' '}
                  <Link href="/become-a-partner" className="inline-block py-1 underline underline-offset-4">
                    The application form
                  </Link>{' '}
                  reaches the right place faster.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-hairline p-6 sm:p-10">
            <ContactForm />
          </div>
        </div>
      </Container>
    </section>
  );
}

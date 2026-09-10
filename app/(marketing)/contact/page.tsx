import type { Metadata } from 'next';
import { ContactForm } from '@/components/marketing/ContactForm';
import { LEGAL_NAME } from '@/components/marketing/content';
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

            <div className="mt-10 border-t border-hairline pt-6">
              <div className="tag">{LEGAL_NAME}</div>
              {/* No address, phone or email is stated until real ones exist. */}
              <p className="mt-2 text-[15px]">United States</p>
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

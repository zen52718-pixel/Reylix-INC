import type { Metadata } from 'next';
import { ContactForm } from '@/components/marketing/ContactForm';
import { PageHeader } from '@/components/marketing/primitives';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Tell Reylix about your business and what you are trying to grow. We reply to every enquiry.',
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Tell us what you are trying to grow."
        standfirst="Whether you need customers or you can send them, this is the right form. We reply to every enquiry, including the ones we are not a fit for."
      />

      <section className="border-b border-ink-200">
        <div className="gutter grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
          <div>
            <ContactForm />
          </div>

          <aside className="space-y-8 lg:border-l lg:border-ink-200 lg:pl-12">
            <div>
              <h2 className="label text-ink-500">What happens next</h2>
              <ol className="mt-4 space-y-3 text-[0.94rem] leading-relaxed text-ink-600">
                <li>
                  <span className="font-semibold text-ink-800">We read it.</span> Every enquiry is
                  read by a person, not scored by a bot.
                </li>
                <li>
                  <span className="font-semibold text-ink-800">We reply by email.</span> Usually
                  within two business days.
                </li>
                <li>
                  <span className="font-semibold text-ink-800">We say no when it is a no.</span> If
                  Reylix is not the right fit, we will tell you rather than book a call to tell you.
                </li>
              </ol>
            </div>

            <div className="border-t border-ink-200 pt-6">
              <h2 className="label text-ink-500">Partners</h2>
              <p className="mt-4 text-[0.94rem] leading-relaxed text-ink-600">
                If you want to promote Reylix offers, the partner application asks the right
                questions and gets to the right place faster.
              </p>
              <a
                href="/become-a-partner"
                className="mt-3 inline-block text-[0.94rem] font-semibold text-brand-700 hover:text-brand-800"
              >
                Become a partner &rarr;
              </a>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

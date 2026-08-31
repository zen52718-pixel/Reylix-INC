import type { Metadata } from 'next';
import { ContactForm } from '@/components/marketing/ContactForm';
import { PageHeader } from '@/components/marketing/primitives';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Tell us what you are trying to grow, how customers currently find you and where the process breaks down. We will review it and determine whether Reylix is a fit.',
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Let's talk about your acquisition system."
        standfirst="Tell us what you are trying to grow, how customers currently find you and where the process breaks down. We will review the information and determine whether Reylix is a fit."
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
                  <span className="font-semibold text-ink-800">A person reads it.</span> Every
                  enquiry is read, not scored by a bot.
                </li>
                <li>
                  <span className="font-semibold text-ink-800">We reply by email.</span> Usually
                  within two business days.
                </li>
                <li>
                  <span className="font-semibold text-ink-800">We say no when it is a no.</span>{' '}
                  If an industry-specific acquisition system is not the right fit, we will tell
                  you rather than book a call to tell you.
                </li>
              </ol>
            </div>

            <div className="border-t border-ink-200 pt-6">
              <h2 className="label text-ink-500">Useful to include</h2>
              <p className="mt-4 text-[0.94rem] leading-relaxed text-ink-600">
                Your industry, the markets you serve, how customers reach you today, and the
                point where the process stops working. That is usually enough to tell whether
                there is a fit.
              </p>
            </div>

            <div className="border-t border-ink-200 pt-6">
              <h2 className="label text-ink-500">Publishers</h2>
              <p className="mt-4 text-[0.94rem] leading-relaxed text-ink-600">
                If you want to promote Reylix offers, the publisher application asks the right
                questions and reaches the right place faster.
              </p>
              <a
                href="/become-a-partner"
                className="mt-3 inline-block text-[0.94rem] font-semibold text-brand-700 hover:text-brand-800"
              >
                Become a Publisher &rarr;
              </a>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactForm } from '@/components/marketing/ContactForm';
import {
  PageHeader,
  RecordCard,
  Section,
  SignalTab,
} from '@/components/marketing/primitives';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Tell us what you are trying to grow, how customers currently find you and where the process breaks down. We will review it and determine whether Reylix is a fit.',
};

const NEXT_STEPS = [
  {
    lead: 'A person reads it.',
    rest: 'Every enquiry is read, not scored by a bot.',
  },
  {
    lead: 'We reply by email.',
    rest: 'Usually within two business days.',
  },
  {
    lead: 'We say no when it is a no.',
    rest: 'If an industry-specific acquisition system is not the right fit, we will tell you rather than book a call to tell you.',
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Let's talk about your acquisition system."
        datum="Contact"
        standfirst="Tell us what you are trying to grow, how customers currently find you and where the process breaks down. We will review the information and determine whether Reylix is a fit."
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
          {/* The intake card. This is the record being opened. */}
          <RecordCard raised tabs={<SignalTab>New enquiry</SignalTab>}>
            <div className="px-6 py-9 sm:px-9">
              <ContactForm />
            </div>
          </RecordCard>

          <aside className="space-y-10">
            <div>
              <h2 className="border-b-2 border-card-edge pb-2 font-gothic text-lg font-bold uppercase tracking-tab text-card">
                What happens next
              </h2>
              <ol className="mt-1">
                {NEXT_STEPS.map((s, i) => (
                  <li
                    key={s.lead}
                    className="flex items-baseline gap-5 border-b border-steel-700 py-4 last:border-0"
                  >
                    <span className="datum w-6 shrink-0 text-signal-orange-up">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="text-fine leading-relaxed text-steel-200">
                      <span className="font-semibold text-card">{s.lead}</span> {s.rest}
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h2 className="border-b-2 border-card-edge pb-2 font-gothic text-lg font-bold uppercase tracking-tab text-card">
                Useful to include
              </h2>
              <p className="mt-4 text-fine leading-relaxed text-steel-200">
                Your industry, the markets you serve, how customers reach you today, and the point
                where the process stops working. That is usually enough to tell whether there is a
                fit.
              </p>
            </div>

            <div>
              <h2 className="border-b-2 border-signal-plum-up pb-2 font-gothic text-lg font-bold uppercase tracking-tab text-card">
                Publishers
              </h2>
              <p className="mt-4 text-fine leading-relaxed text-steel-200">
                If you want to promote Reylix offers, the publisher application asks the right
                questions and reaches the right place faster.
              </p>
              <Link
                href="/become-a-partner"
                className="mt-4 inline-block font-gothic text-[0.9375rem] font-semibold uppercase tracking-tab text-signal-plum-up underline decoration-steel-600 underline-offset-4 transition-colors hover:text-card hover:decoration-card"
              >
                Become a Publisher &rarr;
              </Link>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}

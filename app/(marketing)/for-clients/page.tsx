import type { Metadata } from 'next';
import { STAGES } from '@/components/marketing/content';
import { CallToAction, PageHeader, Prose, Section, Stages } from '@/components/marketing/primitives';

export const metadata: Metadata = {
  title: 'For Clients',
  description:
    'Reylix deploys a complete customer acquisition system for your industry and connects it to the CRM you already use.',
};

const INCLUDED = [
  {
    title: 'Digital presence',
    body: 'The site customers actually land on, built for the vertical rather than adapted from a template.',
  },
  {
    title: 'Capture built for the industry',
    body: 'Forms that ask what your business needs to act on the first contact, not a generic name-and-email box.',
  },
  {
    title: 'Automated qualification',
    body: 'Follow-up that establishes intent, timeline and fit before the conversation reaches you.',
  },
  {
    title: 'Your CRM, connected',
    body: 'Everything lands in the system you already work in. Reylix integrates with it rather than replacing it.',
  },
  {
    title: 'Appointment booking',
    body: 'The output is time on your calendar with someone who is ready to talk.',
  },
  {
    title: 'Reporting',
    body: 'What came in, what was qualified, what converted — and where it came from.',
  },
];

export default function ForClientsPage() {
  return (
    <>
      <PageHeader
        eyebrow="For clients"
        title="A system that hands you booked appointments."
        standfirst="Reylix deploys the acquisition system for your industry, connects it to the tools you already use, and operates it. You are buying an outcome, not a project."
      />

      <Section label="What you get" title="The whole path, not a piece of it.">
        <ul className="mt-12 grid gap-px overflow-hidden border border-ink-200 bg-ink-200 sm:grid-cols-2 lg:grid-cols-3">
          {INCLUDED.map((item) => (
            <li key={item.title} className="bg-white p-6">
              <h3 className="font-display text-base font-semibold text-ink-900">{item.title}</h3>
              <p className="mt-2 text-[0.94rem] leading-relaxed text-ink-600">{item.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section label="How it works" title="Four stages you never have to stitch together.">
        <Stages items={STAGES} />
      </Section>

      <Section label="Working with us" title="What we need from you.">
        <Prose>
          <p>
            Reylix configures a system that already exists rather than building yours from
            scratch. That keeps deployment measured in weeks and means improvements made for one
            client reach every client on the same product.
          </p>
          <p>
            What we need from you is the part only you have: how your business actually qualifies
            a good customer, what you want to know before a first conversation, and access to the
            CRM and calendar you already work in.
          </p>
          <p>
            You keep your data. Consumer records live in your CRM, under your account, and the
            relationship with your customers stays yours.
          </p>
        </Prose>
      </Section>

      <Section label="Honest scope" title="Where Reylix is right now.">
        <Prose>
          <p>
            Reylix is early. The Real Estate system is the first product and is in active
            development; the other verticals are named because they are planned, not because they
            are shipping.
          </p>
          <p>
            If you are considering working with us, you would be an early client, with the access
            and the risk that implies. We would rather say that plainly than discover it together
            three months in.
          </p>
        </Prose>
      </Section>

      <CallToAction
        title="Tell us what you are trying to grow."
        body="Describe your business and what a good customer looks like. If Reylix is not the right fit, we will tell you."
        primary={{ href: '/contact', label: 'Start a conversation' }}
        secondary={{ href: '/products', label: 'See the products' }}
      />
    </>
  );
}

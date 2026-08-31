import type { Metadata } from 'next';
import { LEGAL_NAME } from '@/components/marketing/content';
import { CallToAction, PageHeader, Prose, Section } from '@/components/marketing/primitives';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Reylix INC is a United States customer acquisition company building repeatable, industry-specific acquisition systems with AI workflows, automation and CRM integration.',
};

const CAPABILITIES = [
  {
    title: 'Industry-specific systems',
    body: 'Acquisition systems built around how a given industry captures, qualifies and converts customers.',
  },
  {
    title: 'AI-powered workflows',
    body: 'Agents that respond, qualify and collect what is missing before a person is involved.',
  },
  {
    title: 'Automation',
    body: 'Follow-up, routing and scheduling that run without anyone remembering to do them.',
  },
  {
    title: 'CRM integration',
    body: 'Acquisition connected to the system a business already operates in.',
  },
  {
    title: 'Publisher network',
    body: 'Our own acquisition channel, where partners promote our offers under tracked attribution.',
  },
  {
    title: 'Productized delivery',
    body: 'Systems designed to be configured per client rather than rebuilt per client.',
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="Building the infrastructure behind customer acquisition."
        standfirst={`${LEGAL_NAME} is a United States customer acquisition company. We build repeatable, industry-specific systems that capture demand, qualify it, engage it and move it toward a real business conversation.`}
      />

      <Section label="What we build" title="Infrastructure, not campaigns.">
        <ul className="mt-12 grid gap-px overflow-hidden border border-ink-200 bg-ink-200 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c) => (
            <li key={c.title} className="bg-white p-6">
              <h3 className="font-display text-base font-semibold text-ink-900">{c.title}</h3>
              <p className="mt-2 text-[0.94rem] leading-relaxed text-ink-600">{c.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section label="Philosophy" title="Build once. Configure intelligently. Improve continuously.">
        <Prose>
          <p>
            Every vertical system is built to be deployed repeatedly. The first client in an
            industry gets a system built for that industry; the next gets the same system
            configured differently, not a second project built from nothing.
          </p>
          <p>
            That constraint is why improvements compound. A qualification step that works better
            for one deployment becomes available to every future deployment on that system,
            instead of living inside one bespoke build nobody else benefits from.
          </p>
        </Prose>
      </Section>

      <Section label="The model" title="Two sides, deliberately separate.">
        <Prose>
          <p>
            One side is the client system: the presence, capture, qualification, engagement,
            CRM and booking that a business runs its customer acquisition on. Those customers
            belong to the client and live in the client&rsquo;s CRM.
          </p>
          <p>
            The other is our own acquisition network, where publishers promote our offers under
            tracked attribution and earn commission on approved leads.
          </p>
          <p className="text-ink-900">
            These are kept strictly apart. A publisher&rsquo;s relationship with us has nothing
            to do with a client&rsquo;s relationship with their own customers, and the two are
            never mixed into one pile of records.
          </p>
        </Prose>
      </Section>

      <Section label="Where we are" title="Real Estate first, by design.">
        <Prose>
          <p>
            Real Estate is the vertical the company started in, and Home Services, Legal,
            Insurance and Healthcare run on the same core system. Starting in one industry and
            generalising deliberately is what makes the others repeatable rather than bespoke.
          </p>
          <p>
            {LEGAL_NAME} is a United States C Corporation. There are no case studies or customer
            numbers published here yet. When there are, they will be real ones.
          </p>
        </Prose>
      </Section>

      <CallToAction
        title="Two ways to work with us."
        body="Either you need customers, or you can send them. Both start with a conversation."
        primary={{ href: '/contact', label: 'I Need Customers' }}
        secondary={{ href: '/become-a-partner', label: 'Become a Publisher' }}
      />
    </>
  );
}

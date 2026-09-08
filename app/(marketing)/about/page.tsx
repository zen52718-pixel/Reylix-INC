import type { Metadata } from 'next';
import { LEGAL_NAME } from '@/components/marketing/content';
import {
  CallToAction,
  Manifest,
  PageHeader,
  Prose,
  Section,
  SectionHead,
} from '@/components/marketing/primitives';

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
        title="Building the infrastructure behind customer acquisition."
        datum="About"
        standfirst={`${LEGAL_NAME} is a United States customer acquisition company. We build repeatable, industry-specific systems that capture demand, qualify it, engage it and move it toward a real business conversation.`}
      />

      <Section className="bg-steel-900">
        <SectionHead title="Infrastructure, not campaigns." datum="What we build" />
        <div className="mt-12">
          <Manifest items={CAPABILITIES} tab="Capabilities · 6" />
        </div>
      </Section>

      <Section>
        <SectionHead
          title="Build once. Configure intelligently. Improve continuously."
          datum="Philosophy"
          hue="green"
        />
        <div className="mt-10">
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
        </div>
      </Section>

      {/* The two sides, set as two planes with the cabinet showing between them. */}
      <Section className="bg-steel-900">
        <SectionHead title="Two sides, deliberately separate." datum="The model" hue="blue" />
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <div className="border-t-2 border-signal-orange-up pt-6">
            <h3 className="font-gothic text-2xl font-bold uppercase leading-none tracking-display text-card">
              The client system
            </h3>
            <p className="mt-5 max-w-measure text-body text-steel-200">
              The presence, capture, qualification, engagement, CRM and booking that a business
              runs its customer acquisition on. Those customers belong to the client and live in
              the client&rsquo;s CRM.
            </p>
          </div>
          <div className="border-t-2 border-signal-plum-up pt-6">
            <h3 className="font-gothic text-2xl font-bold uppercase leading-none tracking-display text-card">
              The publisher network
            </h3>
            <p className="mt-5 max-w-measure text-body text-steel-200">
              Our own acquisition network, where publishers promote our offers under tracked
              attribution and earn commission on approved leads.
            </p>
          </div>
        </div>
        <p className="mt-10 max-w-measure border-l-2 border-card pl-5 text-body text-card">
          These are kept strictly apart. A publisher&rsquo;s relationship with us has nothing to
          do with a client&rsquo;s relationship with their own customers, and the two are never
          mixed into one pile of records.
        </p>
      </Section>

      <Section>
        <SectionHead title="Real Estate first, by design." datum="Where we are" hue="amber" />
        <div className="mt-10">
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
        </div>
      </Section>

      <CallToAction
        title="Two ways to work with us."
        body="Either you need customers, or you can send them. Both start with a conversation."
        primary={{ href: '/contact', label: 'I Need Customers' }}
        secondary={{ href: '/become-a-partner', label: 'Become a Publisher' }}
        datum="Next"
      />
    </>
  );
}

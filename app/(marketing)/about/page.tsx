import type { Metadata } from 'next';
import { LEGAL_NAME } from '@/components/marketing/content';
import { CallToAction, PageHeader, Prose, Section } from '@/components/marketing/primitives';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Reylix INC is a United States customer acquisition company. It builds and operates industry-specific systems and runs its own partner channel.',
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="A customer acquisition company."
        standfirst={`${LEGAL_NAME} builds and operates the systems businesses use to acquire customers, and runs its own partner channel to drive demand into them.`}
      />

      <Section label="The model" title="Two sides, deliberately separate.">
        <Prose>
          <p>
            Reylix operates two connected layers. The first is the acquisition platform: products,
            offers, campaigns, publishers, referral links, attribution, commission and payouts.
            That is how demand is generated and how partners are paid for generating it.
          </p>
          <p>
            The second is the systems clients actually run their business on — the site, the
            capture, the qualification and the CRM their customers live in.
          </p>
          <p className="text-ink-900">
            These are kept strictly separate. A partner&rsquo;s relationship with Reylix has
            nothing to do with a client&rsquo;s relationship with their own customers, and the two
            should never be mixed into one pile of records.
          </p>
        </Prose>
      </Section>

      <Section label="How we build" title="Build once, configure many times.">
        <Prose>
          <p>
            Every vertical system is built to be deployed repeatedly. The first client in an
            industry gets a system built for that industry; the second gets the same system
            configured differently, not a second project built from nothing.
          </p>
          <p>
            That constraint is the reason improvements compound. A qualification question that
            works better for one realtor reaches every realtor on the product, instead of living
            in one bespoke build nobody else benefits from.
          </p>
        </Prose>
      </Section>

      <Section label="Where we are" title="Early, and saying so.">
        <Prose>
          <p>
            Reylix is a United States C corporation building its first vertical. The Real Estate
            system is in active development and the partner channel is being built alongside it.
          </p>
          <p>
            There are no case studies to show yet and no customer numbers to quote. When there
            are, they will be real ones.
          </p>
        </Prose>
      </Section>

      <CallToAction
        title="Two ways to work with Reylix."
        body="Either you need customers, or you can send them. Both start with a conversation."
        primary={{ href: '/contact', label: 'I need customers' }}
        secondary={{ href: '/become-a-partner', label: 'I drive traffic' }}
      />
    </>
  );
}

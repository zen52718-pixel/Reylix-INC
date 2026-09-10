import type { Metadata } from 'next';
import { Reveal } from '@/components/marketing/Reveal';
import {
  CTASection,
  PageHero,
  PrimaryButton,
  Section,
  StageRow,
} from '@/components/marketing/primitives';

export const metadata: Metadata = {
  alternates: { canonical: '/for-publishers' },
  title: 'For Publishers',
  description:
    'The Reylix publisher network lets publishers promote Reylix offers and generate qualified opportunities with clear tracking and attribution.',
};

/** The seven-step publisher flow from the design handoff. */
const FLOW = [
  'Publisher',
  'Traffic',
  'Reylix Offer',
  'Tracking',
  'Lead',
  'Attribution',
  'Commission',
].map((title) => ({ title }));

const VALUE = [
  ['Clear tracking', 'Every click and lead is tracked back to its source with full attribution.'],
  [
    'Qualified offers',
    'Promote acquisition offers across real estate, home services, legal, insurance, and healthcare.',
  ],
  ['Performance-based earnings', 'Commissions are tied to measurable, attributed outcomes.'],
];

export default function ForPublishersPage() {
  return (
    <>
      <PageHero
        eyebrow="For Publishers"
        title="Turn traffic into measurable opportunities."
        standfirst="The Reylix publisher network lets publishers promote Reylix products and offers, generating qualified opportunities with clear tracking and attribution."
        action={<PrimaryButton href="/become-a-partner">Become a Partner</PrimaryButton>}
      />

      <Section tone="gray">
        <Reveal>
          <StageRow stages={FLOW} compact />
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <div className="rx-grid sm:grid-cols-2 lg:grid-cols-3">
            {VALUE.map(([title, body]) => (
              <div key={title} className="cell">
                <h2 className="text-lg">{title}</h2>
                <p className="mt-2 text-[15px]">{body}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/*
          The wall between the two sides of the business. The handoff does not carry this
          paragraph, but a publisher page that never says what a publisher cannot reach is a
          compliance gap, not a design choice.
        */}
        <p className="mt-10 max-w-copy text-[15px] text-muted">
          Publishers promote Reylix offers. They do not receive access to any client&rsquo;s CRM,
          customer database or pipeline — those records belong to the client and stay in the
          client&rsquo;s system.
        </p>
      </Section>

      <CTASection
        heading="Ready to promote Reylix offers?"
        copy="Apply to join the Reylix publisher network."
        primary={{ href: '/become-a-partner', label: 'Become a Partner' }}
      />
    </>
  );
}

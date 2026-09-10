import type { Metadata } from 'next';
import { PartnerForm } from '@/components/marketing/PartnerForm';
import { Reveal } from '@/components/marketing/Reveal';
import { Container, PageHero, Section, StageRow } from '@/components/marketing/primitives';

export const metadata: Metadata = {
  alternates: { canonical: '/become-a-partner' },
  title: 'Become a Partner',
  description:
    'Apply to the Reylix publisher network. Promote customer acquisition offers with tracked referral links and earn commission on approved leads.',
};

/** The seven-step partner flow from the design handoff. */
const FLOW = [
  'Apply',
  'Get Approved',
  'Access Offers',
  'Promote',
  'Generate Leads',
  'Track Performance',
  'Earn Commissions',
].map((title) => ({ title }));

export default function BecomeAPartnerPage() {
  return (
    <>
      <PageHero
        eyebrow="Partner Program"
        title="Build with Reylix."
        standfirst="Apply to promote Reylix acquisition offers. Tell us about your audience, your traffic sources and how you promote — every application is reviewed and answered either way."
      />

      <Section tone="gray">
        <Reveal>
          <StageRow stages={FLOW} compact />
        </Reveal>
      </Section>

      <Section>
        <Container className="max-w-[900px]">
          <div className="rounded-xl border border-hairline p-6 sm:p-10">
            <PartnerForm />
          </div>
        </Container>
      </Section>
    </>
  );
}

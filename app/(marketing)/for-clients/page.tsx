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
  alternates: { canonical: '/for-clients' },
  title: 'For Clients',
  description:
    'Reylix builds the infrastructure behind customer growth — website, acquisition channels, qualification, automation, CRM and sales follow-up, operated as one connected system.',
};

/** The nine-step client journey from the design handoff. */
const JOURNEY = [
  'Strategy',
  'Digital Presence',
  'Acquisition',
  'Capture',
  'Qualification',
  'Automation',
  'CRM',
  'Sales',
  'Conversion',
].map((title) => ({ title }));

const PRINCIPLES = [
  ['Strategy first.', 'Every system starts with how your business actually converts customers.'],
  ['Built to connect.', 'Website, automation, and CRM operate as one system, not separate tools.'],
  ['Measured by outcomes.', 'Success is qualified opportunities and closed customers.'],
];

export default function ForClientsPage() {
  return (
    <>
      <PageHero
        eyebrow="For Clients"
        title="Turn your customer acquisition into a system."
        standfirst="Reylix builds the infrastructure behind customer growth — from your website and acquisition channels to qualification, automation, CRM, and sales follow-up."
        action={<PrimaryButton href="/contact">Build My System</PrimaryButton>}
      />

      <Section tone="gray">
        <Reveal className="mb-10">
          <div className="tag">The Client Journey</div>
        </Reveal>
        <Reveal>
          <StageRow stages={JOURNEY} compact />
        </Reveal>
      </Section>

      <Section>
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-[clamp(26px,4vw,38px)]">One point of accountability for growth.</h2>
            <p className="mt-4 text-base">
              Instead of coordinating separate vendors for marketing, web, automation, and sales
              tools, Reylix designs and operates the connected system — so every stage of your
              acquisition works together.
            </p>
          </div>
          <div className="rounded-lg border border-hairline p-8">
            <ul className="flex flex-col gap-4 text-[15px] text-body">
              {PRINCIPLES.map(([lead, rest]) => (
                <li key={lead}>
                  <strong className="text-heading">{lead}</strong> {rest}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <CTASection
        heading="Build My System"
        copy="Let's design the acquisition infrastructure your business needs to grow."
        primary={{ href: '/contact', label: 'Build My System' }}
      />
    </>
  );
}

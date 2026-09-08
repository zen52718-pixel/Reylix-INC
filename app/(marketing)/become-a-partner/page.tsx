import type { Metadata } from 'next';
import { PartnerForm } from '@/components/marketing/PartnerForm';
import { PageHeader, RecordCard, Section, SignalTab } from '@/components/marketing/primitives';

export const metadata: Metadata = {
  title: 'Become a Partner',
  description:
    'Apply to the Reylix publisher network. Promote customer acquisition offers with tracked referral links and earn commission on approved leads.',
};

const PROGRAM = [
  'Tracked referral links, one per offer, tied to your publisher code.',
  'Commission set by the terms of each individual offer.',
  'Transparent attribution — referral parameter first, then cookie.',
  'Lead approval, with a stated reason on every rejection.',
  'Visibility of attributed leads, approved leads and commission.',
  'Payouts per period by ACH, PayPal or check.',
];

const LOOKING_FOR = [
  'Traffic you can describe honestly — where it comes from and what it responds to.',
  'Compliance with US marketing rules, particularly around consent for phone contact.',
  'Approved traffic sources and a promotion method you can explain.',
];

function RuledList({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-1">
      {items.map((item, i) => (
        <li
          key={item}
          className="flex items-baseline gap-5 border-b border-steel-700 py-3.5 last:border-0"
        >
          <span className="datum w-6 shrink-0 text-signal-plum-up">
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="text-fine leading-relaxed text-steel-200">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function BecomeAPartnerPage() {
  return (
    <>
      <PageHeader
        title="Become a Reylix Publisher."
        datum="Publisher network"
        standfirst="We work with publishers who can drive qualified traffic to customer acquisition offers across our industry verticals. Tell us about your audience and how you promote."
        hue="plum"
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
          <RecordCard raised tabs={<SignalTab hue="plum">New application</SignalTab>}>
            <div className="px-6 py-9 sm:px-9">
              <PartnerForm />
            </div>
          </RecordCard>

          <aside className="space-y-10">
            <div>
              <h2 className="border-b-2 border-signal-plum-up pb-2 font-gothic text-lg font-bold uppercase tracking-tab text-card">
                How the program works
              </h2>
              <RuledList items={PROGRAM} />
            </div>

            <div>
              <h2 className="border-b-2 border-signal-plum-up pb-2 font-gothic text-lg font-bold uppercase tracking-tab text-card">
                What we look for
              </h2>
              <RuledList items={LOOKING_FOR} />
            </div>

            <div>
              <h2 className="border-b-2 border-card-edge pb-2 font-gothic text-lg font-bold uppercase tracking-tab text-card">
                Scope
              </h2>
              <p className="mt-4 text-fine leading-relaxed text-steel-200">
                Publishers promote Reylix offers. They do not receive access to any
                client&rsquo;s CRM, customer database or pipeline.
              </p>
              <p className="mt-3 text-fine leading-relaxed text-steel-200">
                The publisher portal is being rolled out. Applications are reviewed now and
                access details are sent by email.
              </p>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}

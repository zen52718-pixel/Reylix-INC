import type { Metadata } from 'next';
import {
  CallToAction,
  PageHeader,
  Prose,
  RecordCard,
  Section,
  SectionHead,
  SignalTab,
} from '@/components/marketing/primitives';

export const metadata: Metadata = {
  title: 'For Publishers',
  description:
    'Promote Reylix customer acquisition offers with tracked referral links. Transparent attribution, lead approval, commission visibility and payouts under stated offer terms.',
};

const FLOW = [
  {
    n: '01',
    title: 'Apply',
    body: 'Tell us about your audience and traffic sources. Every application is reviewed.',
  },
  {
    n: '02',
    title: 'Access offers',
    body: 'Approved publishers receive offers across our industry verticals, each with its own terms.',
  },
  {
    n: '03',
    title: 'Promote',
    body: 'Each offer gives you a tracked referral link tied to your publisher code. The link is yours and does not change.',
  },
  {
    n: '04',
    title: 'Earn',
    body: 'Attributed leads are reviewed. Approved leads earn commission, paid under the terms of that offer.',
  },
];

export default function ForPublishersPage() {
  return (
    <>
      {/* Plum throughout: the publisher drawer is a different colour from the client drawer,
          everywhere on the site, so the two are never visually confused. */}
      <PageHeader
        title="Turn traffic into revenue."
        datum="For publishers"
        standfirst="We operate our own acquisition offers across five industries. Publishers promote those offers with tracked referral links and earn commission on approved leads."
        hue="plum"
      />

      <Section className="bg-steel-900">
        <SectionHead title="From link to payout." datum="How it works" hue="plum" />
        <ol className="mt-12 grid gap-x-px gap-y-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-0">
          {FLOW.map((s, i) => (
            <li key={s.n} className="seat flex flex-col" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="flex items-end gap-1 pl-4">
                <SignalTab hue="plum">{s.n}</SignalTab>
              </div>
              <div className="flex flex-1 flex-col border-t-2 border-card-edge bg-card px-5 py-6 shadow-rest">
                <h3 className="font-gothic text-xl font-bold uppercase leading-none tracking-display text-ink">
                  {s.title}
                </h3>
                <p className="mt-3 text-fine leading-relaxed text-ink-soft">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* Attribution set as the rule it actually is: an ordered resolution, first match wins. */}
      <Section>
        <SectionHead
          title="You can see what you were credited for."
          datum="Attribution"
          hue="plum"
        />
        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          <RecordCard tabs={<SignalTab hue="plum">Resolution order</SignalTab>}>
            <ol className="px-6 py-2 sm:px-8">
              {[
                ['1st', 'An explicit referral parameter on the link.'],
                ['2nd', 'The referral cookie, when no parameter is present.'],
                ['—', 'Neither: the lead is unattributed and nobody is credited.'],
              ].map(([rank, rule]) => (
                <li
                  key={rank}
                  className="flex items-baseline gap-5 border-b border-card-rule py-4 last:border-0"
                >
                  <span className="datum w-8 shrink-0 text-signal-plum">{rank}</span>
                  <span className="text-fine leading-relaxed text-ink-soft">{rule}</span>
                </li>
              ))}
            </ol>
          </RecordCard>

          <Prose>
            <p>
              Attribution is the part most partner programs are vague about, so here is exactly
              how ours resolves. An explicit referral parameter on the link wins. If there is no
              parameter, the referral cookie is used. If there is neither, the lead is
              unattributed and nobody is credited for it.
            </p>
            <p>
              Repeat clicks from the same visitor on the same link inside the deduplication
              window are recorded but not counted as unique. Attributed leads, approved leads and
              commission are all visible to you.
            </p>
            <p className="border-l-2 border-signal-plum-up pl-5 text-card">
              When a lead is rejected, you see the reason. A rejection without a stated reason is
              not something we ask you to accept.
            </p>
          </Prose>
        </div>
      </Section>

      <Section className="bg-steel-900">
        <SectionHead
          title="Commission is set by the offer."
          datum="Commission and payment"
          hue="plum"
        />
        <div className="mt-10">
          <Prose>
            <p>
              Each offer carries its own commission terms. A lead is reviewed after it arrives,
              and the commission is set and locked onto that lead at the moment it is approved —
              so a later change to an offer never alters what you have already earned.
            </p>
            <p>
              Payouts are issued per period under the terms of the offer, by ACH, PayPal or
              check. There is no minimum threshold to clear and no balance that expires: what is
              approved is owed.
            </p>
          </Prose>
        </div>
      </Section>

      <Section>
        <SectionHead
          title="What the publisher network is, and is not."
          datum="Scope"
          hue="plum"
        />
        <div className="mt-10">
          <Prose>
            <p>
              Publishers promote our own acquisition offers. They do not receive access to a
              client&rsquo;s CRM, customer database or pipeline, and they do not manage anyone
              else&rsquo;s customers. Those records belong to the client and stay in the
              client&rsquo;s system.
            </p>
            <p>
              The publisher portal is being rolled out. Applications submitted now are reviewed,
              and access details are sent by email — there is no live dashboard to log into yet.
            </p>
          </Prose>
        </div>
      </Section>

      <CallToAction
        title="Have an audience? Put it to work."
        body="Tell us about your traffic sources and how you promote. Every application is reviewed and answered either way."
        primary={{ href: '/become-a-partner', label: 'Become a Publisher' }}
        secondary={{ href: '/products', label: 'See what you would promote' }}
        datum="Next"
        hue="plum"
      />
    </>
  );
}

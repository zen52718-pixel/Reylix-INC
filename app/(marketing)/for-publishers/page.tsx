import type { Metadata } from 'next';
import { CallToAction, PageHeader, Prose, Section } from '@/components/marketing/primitives';

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
      <PageHeader
        eyebrow="For publishers"
        title="Turn traffic into revenue."
        standfirst="We operate our own acquisition offers across five industries. Publishers promote those offers with tracked referral links and earn commission on approved leads."
      />

      <Section label="How it works" title="From link to payout.">
        <ol className="mt-12 grid gap-px overflow-hidden border border-ink-200 bg-ink-200 sm:grid-cols-2 lg:grid-cols-4">
          {FLOW.map((s) => (
            <li key={s.n} className="bg-white p-6">
              <span className="label text-brand-700">{s.n}</span>
              <h3 className="mt-3 font-display text-base font-semibold text-ink-900">{s.title}</h3>
              <p className="mt-2 text-[0.94rem] leading-relaxed text-ink-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section label="Attribution" title="You can see what you were credited for.">
        <Prose>
          <p>
            Attribution is the part most partner programs are vague about, so here is exactly
            how ours resolves. An explicit referral parameter on the link wins. If there is no
            parameter, the referral cookie is used. If there is neither, the lead is
            unattributed and nobody is credited for it.
          </p>
          <p>
            Repeat clicks from the same visitor on the same link inside the deduplication window
            are recorded but not counted as unique. Attributed leads, approved leads and
            commission are all visible to you.
          </p>
          <p className="text-ink-900">
            When a lead is rejected, you see the reason. A rejection without a stated reason is
            not something we ask you to accept.
          </p>
        </Prose>
      </Section>

      <Section label="Commission and payment" title="Commission is set by the offer.">
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
      </Section>

      <Section label="Scope" title="What the publisher network is, and is not.">
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
      </Section>

      <CallToAction
        title="Have an audience? Put it to work."
        body="Tell us about your traffic sources and how you promote. Every application is reviewed and answered either way."
        primary={{ href: '/become-a-partner', label: 'Become a Publisher' }}
        secondary={{ href: '/products', label: 'See what you would promote' }}
      />
    </>
  );
}

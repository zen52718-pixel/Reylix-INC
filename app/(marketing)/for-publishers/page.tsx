import type { Metadata } from 'next';
import { CallToAction, PageHeader, Prose, Section } from '@/components/marketing/primitives';

export const metadata: Metadata = {
  title: 'For Publishers',
  description:
    'Promote Reylix offers with tracked referral links, see exactly what was attributed to you, and get paid on approved leads.',
};

const FLOW = [
  {
    n: '01',
    title: 'Apply',
    body: 'Tell us about your audience and how you plan to promote. We review every application.',
  },
  {
    n: '02',
    title: 'Get your links',
    body: 'Each offer gives you a referral link tied to your publisher code. The link is yours and does not change.',
  },
  {
    n: '03',
    title: 'Send traffic',
    body: 'Clicks are recorded and deduplicated. Attribution follows the referral parameter first, then the cookie.',
  },
  {
    n: '04',
    title: 'Get paid',
    body: 'Approved leads earn a commission. Payouts are issued per period by ACH, PayPal or check.',
  },
];

export default function ForPublishersPage() {
  return (
    <>
      <PageHeader
        eyebrow="For publishers"
        title="Get paid for the customers you send."
        standfirst="Reylix runs a partner channel for its own products. You promote offers with tracked links, and you are paid on leads that are approved."
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
            Attribution is the part most partner programs are vague about, so here is exactly how
            ours resolves. An explicit referral parameter on the link wins. If there is no
            parameter, the referral cookie is used. If there is neither, the lead is unattributed
            and nobody is credited for it.
          </p>
          <p>
            Repeat clicks from the same visitor on the same link inside the deduplication window
            are recorded but not counted as unique. Your dashboard shows clicks, leads, approved
            leads, commission earned, and what has been paid against what is still owed.
          </p>
          <p className="text-ink-900">
            When a lead is rejected, you see the reason. A rejection without a stated reason is
            not something we ask you to accept.
          </p>
        </Prose>
      </Section>

      <Section label="Commission and payment" title="Flat commission per approved lead.">
        <Prose>
          <p>
            Each offer carries a commission amount. A lead is reviewed after it arrives, and the
            commission is set and locked onto that lead at the moment it is approved — so a later
            change to an offer never alters what you have already earned.
          </p>
          <p>
            Payouts are issued per period and are processed manually at this stage, by ACH, PayPal
            or check. There is no minimum threshold to clear and no balance that expires: what is
            approved is owed.
          </p>
        </Prose>
      </Section>

      <Section label="Honest scope" title="The program is launching.">
        <Prose>
          <p>
            The partner channel is being built alongside the first product. Applications submitted
            now are reviewed and you will be contacted when the program opens — we are not going
            to pretend there is a live dashboard waiting for you today.
          </p>
        </Prose>
      </Section>

      <CallToAction
        title="Apply to the partner program."
        body="Tell us about your audience and how you promote. We review every application and reply either way."
        primary={{ href: '/become-a-partner', label: 'Become a partner' }}
        secondary={{ href: '/products', label: 'See what you would promote' }}
      />
    </>
  );
}

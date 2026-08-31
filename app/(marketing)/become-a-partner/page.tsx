import type { Metadata } from 'next';
import { PartnerForm } from '@/components/marketing/PartnerForm';
import { PageHeader } from '@/components/marketing/primitives';

export const metadata: Metadata = {
  title: 'Become a Partner',
  description:
    'Apply to the Reylix publisher network. Promote customer acquisition offers with tracked referral links and earn commission on approved leads.',
};

export default function BecomeAPartnerPage() {
  return (
    <>
      <PageHeader
        eyebrow="Publisher network"
        title="Become a Reylix Publisher."
        standfirst="We work with publishers who can drive qualified traffic to customer acquisition offers across our industry verticals. Tell us about your audience and how you promote."
      />

      <section className="border-b border-ink-200">
        <div className="gutter grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
          <div>
            <PartnerForm />
          </div>

          <aside className="space-y-8 lg:border-l lg:border-ink-200 lg:pl-12">
            <div>
              <h2 className="label text-ink-500">How the program works</h2>
              <ul className="mt-4 space-y-3 text-[0.94rem] leading-relaxed text-ink-600">
                <li>Tracked referral links, one per offer, tied to your publisher code.</li>
                <li>Commission set by the terms of each individual offer.</li>
                <li>Transparent attribution — referral parameter first, then cookie.</li>
                <li>Lead approval, with a stated reason on every rejection.</li>
                <li>Visibility of attributed leads, approved leads and commission.</li>
                <li>Payouts per period by ACH, PayPal or check.</li>
              </ul>
            </div>

            <div className="border-t border-ink-200 pt-6">
              <h2 className="label text-ink-500">What we look for</h2>
              <ul className="mt-4 space-y-3 text-[0.94rem] leading-relaxed text-ink-600">
                <li>Traffic you can describe honestly — where it comes from and what it responds to.</li>
                <li>Compliance with US marketing rules, particularly around consent for phone contact.</li>
                <li>Approved traffic sources and a promotion method you can explain.</li>
              </ul>
            </div>

            <div className="border-t border-ink-200 pt-6">
              <h2 className="label text-ink-500">Scope</h2>
              <p className="mt-4 text-[0.94rem] leading-relaxed text-ink-600">
                Publishers promote Reylix offers. They do not receive access to any
                client&rsquo;s CRM, customer database or pipeline.
              </p>
              <p className="mt-3 text-[0.94rem] leading-relaxed text-ink-600">
                The publisher portal is being rolled out. Applications are reviewed now and
                access details are sent by email.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

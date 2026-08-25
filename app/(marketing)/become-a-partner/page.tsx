import type { Metadata } from 'next';
import { PartnerForm } from '@/components/marketing/PartnerForm';
import { PageHeader } from '@/components/marketing/primitives';

export const metadata: Metadata = {
  title: 'Become a Partner',
  description:
    'Apply to the Reylix partner program. Promote offers with tracked referral links and earn commission on approved leads.',
};

export default function BecomeAPartnerPage() {
  return (
    <>
      <PageHeader
        eyebrow="Partner program"
        title="Apply to send traffic."
        standfirst="Tell us about your audience and how you promote. We review every application and reply either way."
      />

      <section className="border-b border-ink-200">
        <div className="gutter grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
          <div>
            <PartnerForm />
          </div>

          <aside className="space-y-8 lg:border-l lg:border-ink-200 lg:pl-12">
            <div>
              <h2 className="label text-ink-500">What we look for</h2>
              <ul className="mt-4 space-y-3 text-[0.94rem] leading-relaxed text-ink-600">
                <li>Traffic you can describe honestly — where it comes from and what it responds to.</li>
                <li>Compliance with US marketing rules, particularly around consent for phone contact.</li>
                <li>A promotion method you can explain, not a black box.</li>
              </ul>
            </div>

            <div className="border-t border-ink-200 pt-6">
              <h2 className="label text-ink-500">How you get paid</h2>
              <p className="mt-4 text-[0.94rem] leading-relaxed text-ink-600">
                Commission is set per offer and locked onto a lead when it is approved. Payouts are
                issued per period by ACH, PayPal or check. When a lead is rejected you are told
                why.
              </p>
            </div>

            <div className="border-t border-ink-200 pt-6">
              <h2 className="label text-ink-500">Be aware</h2>
              <p className="mt-4 text-[0.94rem] leading-relaxed text-ink-600">
                The program is still being built. Applying now puts you in the queue for when it
                opens — there is no live dashboard to log into today.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

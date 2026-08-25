import type { Metadata } from 'next';
import { STATUS_LABEL, VERTICALS } from '@/components/marketing/content';
import { CallToAction, PageHeader, Prose, Section } from '@/components/marketing/primitives';

export const metadata: Metadata = {
  title: 'Products',
  description:
    'Reylix builds a complete customer acquisition system per industry. Real Estate is the first; Home Services, Legal and Insurance follow.',
};

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Products"
        title="One system per industry."
        standfirst="Acquisition is not generic. What qualifies a home seller has nothing in common with what qualifies an insurance quote, so each vertical gets its own system rather than a re-skinned template."
      />

      <Section label="Why per-industry" title="The qualification is the product.">
        <Prose>
          <p>
            The website and the forms are the visible part, but they are not what makes a system
            work. What matters is knowing which questions separate a customer who is ready from
            one who is browsing — and those questions are completely different in each industry.
          </p>
          <p>
            That knowledge is what Reylix encodes into each vertical system, and it is why one
            generic funnel sold to every industry underperforms in all of them.
          </p>
        </Prose>
      </Section>

      <section className="border-b border-ink-200">
        <div className="gutter py-16 sm:py-20">
          <p className="label text-ink-500">The verticals</p>
          <div className="mt-12 space-y-px bg-ink-200">
            {VERTICALS.map((v) => (
              <article
                key={v.slug}
                id={v.slug}
                className="scroll-mt-20 bg-white p-7 sm:p-9 lg:grid lg:grid-cols-[1fr_1.3fr] lg:gap-12"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-xl font-semibold tracking-tight text-ink-900">
                      {v.name}
                    </h2>
                    <span
                      className={`label rounded-sm px-2 py-1 ${
                        v.status === 'in-development'
                          ? 'bg-brand-50 text-brand-700'
                          : 'bg-ink-100 text-ink-500'
                      }`}
                    >
                      {STATUS_LABEL[v.status]}
                    </span>
                  </div>
                  <p className="mt-4 max-w-measure text-[1.0rem] leading-relaxed text-ink-600">
                    {v.summary}
                  </p>
                </div>

                <div className="mt-6 lg:mt-0">
                  <h3 className="label text-ink-500">Includes</h3>
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {v.capabilities.map((c) => (
                      <li
                        key={c}
                        className="flex gap-2.5 text-[0.94rem] leading-relaxed text-ink-600"
                      >
                        <span aria-hidden="true" className="mt-2 h-px w-3 shrink-0 bg-brand-600" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Section label="Real Estate" title="Product one, in development now.">
        <Prose>
          <p>
            The Real Estate system covers both sides of the market, because a realtor needs both.
            On the buyer side it captures requirements, qualifies budget and timeline, and moves
            toward matching properties and booking a viewing. On the seller side it handles
            valuation and consultation requests and the follow-up that turns interest into an
            appointment.
          </p>
          <p>
            It is designed to be configured per realtor rather than rebuilt per realtor — the same
            system, with different branding, market and property data behind it.
          </p>
        </Prose>
      </Section>

      <CallToAction
        title="Want the system for your industry?"
        body="If your vertical is on the list, tell us where you operate. If it is not, tell us anyway — the roadmap follows demand."
        primary={{ href: '/contact', label: 'Talk to us' }}
        secondary={{ href: '/for-clients', label: 'How it works for clients' }}
      />
    </>
  );
}

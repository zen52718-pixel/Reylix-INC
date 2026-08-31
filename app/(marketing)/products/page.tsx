import type { Metadata } from 'next';
import { VERTICALS } from '@/components/marketing/content';
import { CallToAction, PageHeader, Prose, Section } from '@/components/marketing/primitives';

export const metadata: Metadata = {
  title: 'Industry-Specific Acquisition Systems',
  description:
    'Customer acquisition systems for real estate, home services, legal, insurance and healthcare — capture, qualification, AI engagement, CRM integration and appointment booking in one system.',
};

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Systems"
        title="Industry-specific customer acquisition systems."
        standfirst="Every industry has a different customer journey. The acquisition system is built around that journey — from the first interaction through qualification, engagement, CRM management and conversion."
      />

      <Section label="Why per-industry" title="The qualification is the product.">
        <Prose>
          <p>
            The website and the forms are the visible part, but they are not what makes a
            system work. What matters is knowing which questions separate a customer who is
            ready from one who is looking — and those questions are entirely different in each
            industry.
          </p>
          <p>
            That knowledge is what gets encoded into each system, and it is why one generic
            funnel sold into every industry underperforms in all of them.
          </p>
        </Prose>
      </Section>

      <section className="border-b border-ink-200">
        <div className="gutter py-16 sm:py-20">
          <p className="label text-ink-500">The systems</p>
          <div className="mt-12 space-y-px bg-ink-200">
            {VERTICALS.map((v) => (
              <article
                key={v.slug}
                id={v.slug}
                className="scroll-mt-20 bg-white p-7 sm:p-9 lg:grid lg:grid-cols-[1fr_1.3fr] lg:gap-12"
              >
                <div>
                  <h2 className="font-display text-xl font-semibold tracking-tight text-ink-900">
                    {v.name}
                  </h2>
                  <p className="mt-4 max-w-measure text-[1.0rem] leading-relaxed text-ink-600">
                    {v.summary}
                  </p>
                </div>

                <div className="mt-6 lg:mt-0">
                  <h3 className="label text-ink-500">The system includes</h3>
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

      <Section label="Real Estate" title="A complete acquisition system for real estate.">
        <Prose>
          <p>
            The real estate system supports both sides of the market, because a realtor needs
            both. A buyer discovers properties, submits requirements, budget, location and
            timeline, receives relevant property information, continues through automated
            follow-up and schedules a showing or consultation.
          </p>
          <p>
            A seller requests a valuation, submits property information, enters a seller
            qualification workflow and moves through automated follow-up toward a scheduled
            conversation with the realtor.
          </p>
          <p>
            The same core system is configured per realtor — different branding, market,
            properties, qualification criteria, calendar and CRM configuration. Built once and
            configured intelligently rather than rebuilt for every client.
          </p>
        </Prose>
      </Section>

      <Section label="Shared infrastructure" title="What every system has underneath it.">
        <Prose>
          <p>
            Presence, capture, qualification, AI-powered engagement, automated follow-up, CRM
            integration, appointment booking and reporting are common to every vertical. What
            changes between them is the customer journey, the qualification criteria and the
            conversion model.
          </p>
          <p>
            That is what makes the systems repeatable: improvements made for one deployment are
            available to the next rather than trapped in a bespoke build.
          </p>
        </Prose>
      </Section>

      <CallToAction
        title="Want the system for your industry?"
        body="Tell us what your business sells, who you want to reach and where your current acquisition process breaks down."
        primary={{ href: '/contact', label: 'Start a Conversation' }}
        secondary={{ href: '/for-clients', label: 'How it works for clients' }}
      />
    </>
  );
}

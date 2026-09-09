import type { Metadata } from 'next';
import { VERTICALS } from '@/components/marketing/content';
import {
  CallToAction,
  PageHeader,
  Prose,
  RecordCard,
  Section,
  SectionHead,
  SignalTab,
  VERTICAL_HUE,
} from '@/components/marketing/primitives';

export const metadata: Metadata = {
  alternates: { canonical: '/products' },
  title: 'Industry-Specific Acquisition Systems',
  description:
    'Customer acquisition systems for real estate, home services, legal, insurance and healthcare — capture, qualification, AI engagement, CRM integration and appointment booking in one system.',
};

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        title="Industry-specific customer acquisition systems."
        datum="Systems · 5 in operation"
        standfirst="Every industry has a different customer journey. The acquisition system is built around that journey — from the first interaction through qualification, engagement, CRM management and conversion."
      />

      <Section className="bg-steel-900">
        <SectionHead title="The qualification is the product." datum="Why per-industry" />
        <div className="mt-10">
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
        </div>
      </Section>

      {/* The drawer, pulled open: one card per system, every tab visible at once. */}
      <Section>
        <SectionHead title="The systems." datum="Index" />
        <div className="mt-12 space-y-8">
          {VERTICALS.map((v, i) => (
            <article key={v.slug} id={v.slug} className="scroll-mt-24">
              <RecordCard
                tabs={
                  <>
                    <SignalTab hue={VERTICAL_HUE[v.slug]}>{v.name}</SignalTab>
                    <SignalTab hue={VERTICAL_HUE[v.slug]} className="opacity-60">
                      {String(i + 1).padStart(2, '0')}
                    </SignalTab>
                  </>
                }
              >
                <div className="grid gap-x-12 gap-y-8 px-6 py-9 sm:px-9 lg:grid-cols-[1fr_1.15fr]">
                  <div>
                    <h2 className="font-gothic text-3xl font-bold uppercase leading-none tracking-display text-ink">
                      {v.name}
                    </h2>
                    <p className="mt-5 max-w-measure text-body leading-relaxed text-ink-soft">
                      {v.summary}
                    </p>
                  </div>

                  <div className="lg:border-l lg:border-card-rule lg:pl-12">
                    <h3 className="border-b-2 border-card-edge pb-2 font-gothic text-base font-bold uppercase tracking-tab text-ink">
                      The system includes
                    </h3>
                    <ul className="mt-1">
                      {v.capabilities.map((c, ci) => (
                        <li
                          key={c}
                          className="flex items-baseline gap-4 border-b border-card-rule py-2.5 last:border-0"
                        >
                          <span className="datum w-6 shrink-0 text-ink-faint">
                            {String(ci + 1).padStart(2, '0')}
                          </span>
                          <span className="text-fine leading-relaxed text-ink-soft">{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </RecordCard>
            </article>
          ))}
        </div>
      </Section>

      <Section className="bg-steel-900">
        <SectionHead title="A complete acquisition system for real estate." datum="Real Estate" />
        <div className="mt-10">
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
        </div>
      </Section>

      <Section>
        <SectionHead
          title="What every system has underneath it."
          datum="Shared infrastructure"
        />
        <div className="mt-10">
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
        </div>
      </Section>

      <CallToAction
        title="Want the system for your industry?"
        body="Tell us what your business sells, who you want to reach and where your current acquisition process breaks down."
        primary={{ href: '/contact', label: 'Start a Conversation' }}
        secondary={{ href: '/for-clients', label: 'How it works for clients' }}
        datum="Next"
      />
    </>
  );
}

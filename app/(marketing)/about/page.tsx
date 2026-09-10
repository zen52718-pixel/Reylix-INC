import type { Metadata } from 'next';
import { Reveal } from '@/components/marketing/Reveal';
import { CTASection, PageHero, Section } from '@/components/marketing/primitives';

export const metadata: Metadata = {
  alternates: { canonical: '/about' },
  title: 'About',
  description:
    'Reylix is a customer acquisition company. We design and operate the systems that connect marketing, technology, automation and sales into one connected system.',
};

const FOCUS = [
  ['Systems', 'Connected infrastructure, not isolated tools.'],
  ['Technology', 'AI, automation, and CRM built to work together.'],
  ['Acquisition', 'Reaching and converting the right prospects.'],
  ['Automation', 'Consistent execution without manual bottlenecks.'],
  ['Sales Alignment', 'Marketing and sales operating from the same system.'],
  ['Measurable Outcomes', 'Infrastructure judged on results.'],
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Reylix"
        title="We're building the infrastructure behind customer growth."
        standfirst="Reylix is a customer acquisition company. We design and operate the systems that connect marketing, technology, automation, and sales into one measurable system."
      />

      <Section tone="gray">
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-[clamp(26px,4vw,38px)]">Systems over services.</h2>
            <p className="mt-4 text-base">
              Most businesses acquire customers through disconnected pieces — a website here, a
              marketing channel there, a sales process running separately. Reylix builds the
              connective infrastructure between them: acquisition, qualification, automation, CRM,
              and sales working as one system.
            </p>
          </div>
          <p className="max-w-copy text-base lg:pt-2">
            We work across real estate, home services, legal, insurance, and healthcare —
            industries where the cost of a missed or mishandled customer is high, and where a
            connected system produces a measurable difference in outcomes.
          </p>
        </div>
      </Section>

      <Section>
        <Reveal className="mb-10 max-w-measure">
          <h2 className="text-[clamp(26px,4vw,36px)]">What we focus on.</h2>
        </Reveal>
        <Reveal>
          <div className="rx-grid sm:grid-cols-2 lg:grid-cols-3">
            {FOCUS.map(([title, body]) => (
              <div key={title} className="cell">
                <h3 className="text-[17px]">{title}</h3>
                <p className="mt-2 text-[15px]">{body}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/*
          Kept from the audited copy: there is nothing to cite yet, and saying so is better
          than a page that implies otherwise by staying silent.
        */}
        <p className="mt-10 max-w-copy text-[15px] text-muted">
          There are no case studies or customer numbers published here yet. When there are, they
          will be real ones.
        </p>
      </Section>

      <CTASection
        heading="Let's talk about your acquisition system."
        copy="We work alongside operators who want infrastructure, not another vendor."
        primary={{ href: '/contact', label: 'Talk to Reylix' }}
      />
    </>
  );
}

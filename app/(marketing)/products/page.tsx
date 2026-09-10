import type { Metadata } from 'next';
import { CAPABILITY_TAGS, VERTICALS } from '@/components/marketing/content';
import { Reveal } from '@/components/marketing/Reveal';
import {
  CTASection,
  PageHero,
  SecondaryButton,
  Section,
} from '@/components/marketing/primitives';

export const metadata: Metadata = {
  alternates: { canonical: '/products' },
  title: 'Industry-Specific Acquisition Systems',
  description:
    'Vertical-specific customer acquisition systems for real estate, home services, legal, insurance and healthcare — acquisition, capture, qualification, automation, follow-up, CRM and conversion in one system.',
};

export default function ProductsPage() {
  return (
    <>
      <PageHero
        eyebrow="Products"
        title="Acquisition systems built around the way your business grows."
        standfirst="Reylix develops vertical-specific customer acquisition systems — each one connecting acquisition, capture, qualification, automation, follow-up, CRM, and conversion into a single operating system for growth."
      />

      <Section tone="gray" className="!pt-6">
        {VERTICALS.map((v, i) => (
          <Reveal key={v.slug} className="mb-6 last:mb-0">
            <article
              id={v.slug}
              className="scroll-mt-24 rounded-lg border border-hairline bg-white p-8 sm:p-10"
            >
              <div className="mb-7 flex flex-wrap items-start justify-between gap-6">
                <div>
                  <div className="text-xs font-bold tracking-[0.05em] text-brand">0{i + 1}</div>
                  <h2 className="mt-1.5 text-[28px]">{v.name}</h2>
                  <p className="mt-2 max-w-[480px]">{v.detail}</p>
                </div>
                <SecondaryButton href="/contact">Build My System</SecondaryButton>
              </div>

              <ul className="flex flex-wrap gap-2.5">
                {CAPABILITY_TAGS.map((c) => (
                  <li
                    key={c}
                    className="rounded-pill border border-hairline px-4 py-2 text-[13px] font-semibold text-body"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        ))}
      </Section>

      <CTASection
        eyebrow="Get Started"
        heading="Ready to build a better way to acquire customers?"
        copy="Let's design the system behind your next stage of growth."
        primary={{ href: '/contact', label: 'Start a Conversation' }}
        secondary={{ href: '/become-a-partner', label: 'Become a Partner' }}
      />
    </>
  );
}

import Link from 'next/link';
import {
  BROKEN_JOURNEY,
  INFRASTRUCTURE,
  STAGES,
  VERTICALS,
} from '@/components/marketing/content';
import { JourneyScroller } from '@/components/marketing/JourneyScroller';
import { Reveal } from '@/components/marketing/Reveal';
import {
  ButtonRow,
  Container,
  CTASection,
  Eyebrow,
  PrimaryButton,
  SecondaryButton,
  Section,
  StageRow,
} from '@/components/marketing/primitives';
import { StageIcon } from '@/components/marketing/StageIcon';

export default function HomePage() {
  return (
    <>
      {/* Hero: text left, the acquisition architecture as a dark timeline card right. */}
      <section className="section bg-white pt-[72px]">
        <Container>
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
            <div>
              <Eyebrow>Customer Acquisition Systems</Eyebrow>
              <h1 className="text-[clamp(40px,6vw,72px)] leading-[1.05]">Customers, not clicks.</h1>
              <p className="mt-6 max-w-[480px] text-[19px]">
                Reylix builds customer acquisition systems that connect marketing, intelligent
                automation, sales, and follow-up into one connected system.
              </p>
              <ButtonRow className="mt-9">
                <PrimaryButton href="/contact">Build Your Acquisition System</PrimaryButton>
                <SecondaryButton href="/products">Explore Reylix</SecondaryButton>
              </ButtonRow>
            </div>

            <div className="rounded-xl border border-hairline bg-surface-darker p-8">
              <div className="tag text-neutral-400">Acquisition Architecture</div>
              <ol className="mt-5">
                {STAGES.map((s, i) => (
                  <li key={s.title} className="flex items-center gap-4">
                    <div className="flex w-6 flex-col items-center self-stretch">
                      <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-dark" />
                      {i < STAGES.length - 1 && (
                        <span aria-hidden="true" className="min-h-[28px] w-px flex-1 bg-neutral-700" />
                      )}
                    </div>
                    <div className="py-2.5 text-[15px] font-bold text-neutral-50">{s.title}</div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Container>
      </section>

      {/* The problem: the broken journey, then the same journey as one system. */}
      <Section tone="gray">
        <Reveal className="mb-14 max-w-measure">
          <Eyebrow>The Problem</Eyebrow>
          <h2 className="text-[clamp(28px,4vw,42px)]">
            Growth breaks when the pieces don&rsquo;t work together.
          </h2>
          <p className="mt-4 text-[17px]">
            Traffic alone doesn&rsquo;t create customers. A high-performing acquisition system
            connects every stage of the journey — from first interaction to qualified opportunity
            and conversion.
          </p>
        </Reveal>

        <Reveal className="mb-12">
          <ul className="flex flex-wrap items-center gap-2">
            {BROKEN_JOURNEY.map((step, i) => (
              <li key={step} className="flex items-center gap-2">
                <span className="rounded-sm border border-hairline bg-white px-4 py-2.5 text-sm text-muted">
                  {step}
                </span>
                {i < BROKEN_JOURNEY.length - 1 && (
                  <span aria-hidden="true" className="text-neutral-400">
                    &rarr;
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal>
          <div className="tag mb-3">Reylix System</div>
          <StageRow stages={STAGES} />
        </Reveal>
      </Section>

      {/* The system, one cell per stage. */}
      <Section>
        <Reveal className="mb-12 max-w-measure">
          <Eyebrow>The System</Eyebrow>
          <h2 className="text-[clamp(28px,4vw,42px)]">One system. Every stage of acquisition.</h2>
        </Reveal>
        <Reveal>
          <div className="rx-grid sm:grid-cols-2 lg:grid-cols-3">
            {STAGES.map((s) => (
              <div key={s.title} className="cell">
                <span className="text-brand">
                  <StageIcon title={s.title} />
                </span>
                <h3 className="mt-4 text-[17px]">{s.title}</h3>
                <p className="mt-2 text-[15px]">{s.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* Industries as full-width rows, each linking through to the system. */}
      <Section tone="gray">
        <Reveal className="mb-12 max-w-measure">
          <Eyebrow>Industries</Eyebrow>
          <h2 className="text-[clamp(28px,4vw,42px)]">
            Built for industries where every customer matters.
          </h2>
        </Reveal>
        <Reveal>
          <ul className="flex flex-col gap-px">
            {VERTICALS.map((v, i) => (
              <li key={v.slug}>
                <Link
                  href={`/products#${v.slug}`}
                  className="flex flex-wrap items-center justify-between gap-6 border border-hairline bg-white px-7 py-8 text-body transition-colors hover:text-body"
                >
                  <span className="flex items-baseline gap-6">
                    <span className="text-[13px] font-bold text-muted">0{i + 1}</span>
                    <span className="text-[22px] font-bold text-heading">{v.name}</span>
                  </span>
                  <span className="max-w-[320px] text-[15px] sm:text-right">{v.short}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>

      {/* Infrastructure: the parts, resolving into one system. */}
      <Section tone="dark">
        <Reveal className="mb-12 max-w-measure">
          <Eyebrow onDark>Infrastructure</Eyebrow>
          <h2 className="text-[clamp(28px,4vw,42px)]">
            Technology is the infrastructure. Acquisition is the outcome.
          </h2>
        </Reveal>
        <Reveal className="mb-10">
          <div className="rx-grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {INFRASTRUCTURE.map((p) => (
              <div key={p.name} className="px-5 py-7">
                <div className="text-[15px] font-bold text-neutral-50">{p.name}</div>
                <div className="mt-2 text-[13px] text-neutral-400">{p.body}</div>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal className="pt-8 text-center">
          <div aria-hidden="true" className="text-sm text-neutral-400">
            &darr;
          </div>
          <div className="mt-2 inline-block rounded-pill border border-brand-dark px-6 py-2.5 text-sm font-bold tracking-[0.04em] text-brand-dark">
            ONE CUSTOMER ACQUISITION SYSTEM
          </div>
        </Reveal>
      </Section>

      {/* The journey, as a scrollytelling pair. */}
      <Section tone="gray">
        <Reveal className="mb-12 max-w-measure">
          <Eyebrow>The Journey</Eyebrow>
          <h2 className="text-[clamp(28px,4vw,42px)]">From first click to closed customer.</h2>
        </Reveal>
        <JourneyScroller stages={STAGES} />
      </Section>

      <Section>
        <Container className="max-w-[760px] text-center">
          <Reveal>
            <div className="flex justify-center">
              <Eyebrow>Partnership</Eyebrow>
            </div>
            <h2 className="text-[clamp(26px,4vw,38px)]">
              Built for operators who want a system, not another vendor.
            </h2>
            <p className="mt-4 text-[17px]">
              Reylix works alongside businesses to build the infrastructure behind customer
              acquisition — combining strategy, technology, automation, and sales execution into
              one connected system.
            </p>
            <ButtonRow className="mt-7 justify-center">
              <SecondaryButton href="/contact">Talk to Reylix</SecondaryButton>
            </ButtonRow>
          </Reveal>
        </Container>
      </Section>

      <CTASection
        eyebrow="Let's Build"
        heading="Ready to build a better way to acquire customers?"
        copy="Let's design the system behind your next stage of growth."
        primary={{ href: '/contact', label: 'Start a Conversation' }}
        secondary={{ href: '/become-a-partner', label: 'Become a Partner' }}
      />
    </>
  );
}

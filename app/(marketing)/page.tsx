import Link from 'next/link';
import { STAGES, VERTICALS } from '@/components/marketing/content';
import {
  CallToAction,
  GhostTab,
  Prose,
  PullTab,
  RecordCard,
  Section,
  SectionHead,
  SignalTab,
  Stages,
  VERTICAL_HUE,
} from '@/components/marketing/primitives';

const DISCONNECTED = [
  'Website',
  'Advertising',
  'CRM',
  'Automation',
  'Lead management',
  'Appointment booking',
];

/** The break between two vendors. Drawn, at icon scale, in one consistent stroke. */
function Handoff() {
  return (
    <svg viewBox="0 0 14 28" aria-hidden="true" className="h-7 w-3.5 shrink-0 text-signal-orange-up">
      <path d="M9 0 5 14l4 14" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <>
      {/*
        First viewport: the top card of an open file, pulled proud of the cabinet. No eyebrow
        above the headline — the tabs on the card's edge carry the reference, and the headline
        carries itself.
      */}
      <section className="gutter pb-20 pt-10 sm:pb-24 sm:pt-14">
        <RecordCard
          raised
          className="seat"
          tabs={
            <>
              <SignalTab>Reylix INC</SignalTab>
              <SignalTab hue="green">Customer acquisition</SignalTab>
            </>
          }
        >
          <div className="grid lg:grid-cols-[1.15fr_1fr]">
            <div className="px-6 py-10 sm:px-10 sm:py-14">
              <h1 className="max-w-[11ch] font-gothic text-[clamp(3rem,9vw,6rem)] font-bold uppercase leading-[0.86] tracking-display text-ink">
                Customers, not clicks.
              </h1>
              <p className="mt-8 max-w-measure text-lead text-ink-soft">
                We build industry-specific customer acquisition systems. One system connects
                digital presence, lead capture, qualification, AI-powered engagement, automated
                follow-up, CRM and appointment booking — so the demand that arrives is actually
                converted rather than lost between tools.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
                <PullTab href="/for-clients">I Need Customers</PullTab>
                <Link
                  href="/become-a-partner"
                  className="font-gothic text-[0.9375rem] font-semibold uppercase tracking-tab text-ink-soft underline decoration-card-edge underline-offset-4 transition-colors hover:text-signal-orange hover:decoration-signal-orange"
                >
                  Or send traffic as a publisher
                </Link>
              </div>
            </div>

            {/* The index down the card's right edge: what the system is made of, in order. */}
            {/* The closing line is pinned to the foot of the card, so the index column ends
                with the card rather than leaving a hole under the last stage. */}
            <div className="flex flex-col border-t border-card-rule px-6 py-10 sm:px-10 lg:border-l lg:border-t-0 lg:py-14">
              <ol className="space-y-0">
                {STAGES.map((s) => (
                  <li
                    key={s.n}
                    className="flex items-baseline gap-5 border-b border-card-rule py-3.5 last:border-0"
                  >
                    <span className="datum w-6 shrink-0 text-signal-orange">{s.n}</span>
                    <span className="font-gothic text-lg font-semibold uppercase tracking-tab text-ink">
                      {s.title}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-8 border-t border-card-rule pt-5 text-fine text-ink-faint lg:mt-auto">
                Five stages, one system, one accountable owner.
              </p>
            </div>
          </div>
        </RecordCard>
      </section>

      {/*
        The problem, drawn rather than described: six competent tools with the steel of the
        cabinet showing through every handoff between them. The gaps are the argument.
      */}
      <Section className="bg-steel-900">
        <SectionHead title="The tools are fine. The gaps between them are not." datum="Ref. 01" />

        <div className="mt-12 grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <ul className="flex flex-wrap items-stretch gap-y-4">
              {DISCONNECTED.map((tool, i) => (
                <li key={tool} className="flex items-center">
                  {i > 0 && <Handoff />}
                  <span className="border-t-2 border-card-edge bg-card px-4 py-3 font-gothic text-[0.9375rem] font-semibold uppercase tracking-tab text-ink">
                    {tool}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-8 max-w-field text-fine text-steel-300">
              Every mark above is a handoff. Nobody sells the handoff.
            </p>
          </div>

          <Prose>
            <p>
              Most businesses buy acquisition in pieces — a site from one vendor, advertising
              from another, a CRM from a third, automation from whoever was available. Each
              piece can be perfectly competent on its own.
            </p>
            <p>
              What fails is the space between them. A form that captures too little to act on. A
              reply that arrives a day late. Follow-up that depends on someone remembering. A
              record that never reaches the CRM. Every handoff is a place where an opportunity
              quietly stops moving.
            </p>
            <p className="border-l-2 border-signal-orange-up pl-5 text-card">
              Most businesses do not have a lead problem. They have an acquisition system
              problem.
            </p>
          </Prose>
        </div>
      </Section>

      {/* What gets built — the industry-specific argument, made concretely. */}
      <Section>
        <SectionHead
          title="One acquisition system. Built around your industry."
          datum="Ref. 02"
          hue="green"
        />
        <div className="mt-10 grid gap-8 text-body text-steel-200 lg:grid-cols-2 lg:gap-16">
          <p className="max-w-measure">
            Every industry has different customers, different qualification criteria and a
            different path to a decision. A real estate buyer should not be qualified like an
            insurance prospect. A homeowner asking for a roofing estimate should not enter the
            same workflow as a legal case enquiry.
          </p>
          <p className="max-w-measure">
            So the system is built around how that industry actually acquires and converts
            customers — which questions matter, what has to be known before a conversation is
            worth having, and what happens next. The infrastructure is shared. The journey is
            not.
          </p>
        </div>
      </Section>

      {/* The file itself: five cards, every tab visible at once. */}
      <Section className="bg-steel-900">
        <SectionHead title="Five stages, owned end to end." datum="Ref. 03" />
        <div className="mt-12">
          <Stages items={STAGES} />
        </div>
      </Section>

      {/*
        Industries as full-width record rows rather than a card grid — which also means five
        industries cannot leave a hole in a two-column layout the way they used to.
      */}
      <Section>
        <SectionHead
          title="Built around the way each industry acquires customers."
          datum="Ref. 04"
          hue="blue"
        />
        <div className="mt-8 flex flex-wrap items-baseline justify-between gap-6">
          <p className="max-w-measure text-body text-steel-200">
            Customer acquisition is not generic. Each system is built around the customer
            journey, qualification process and conversion model of its industry.
          </p>
          <Link
            href="/products"
            className="font-gothic text-[0.9375rem] font-semibold uppercase tracking-tab text-signal-orange-up underline decoration-steel-600 underline-offset-4 transition-colors hover:decoration-signal-orange-up"
          >
            All systems &rarr;
          </Link>
        </div>

        <ul className="mt-12 space-y-6">
          {VERTICALS.map((v, i) => (
            <li key={v.slug} className="seat" style={{ animationDelay: `${i * 60}ms` }}>
              <RecordCard
                tabs={
                  <SignalTab hue={VERTICAL_HUE[v.slug]}>
                    {String(i + 1).padStart(2, '0')}
                  </SignalTab>
                }
              >
                <div className="grid gap-x-12 gap-y-7 px-6 py-8 sm:px-9 lg:grid-cols-[1fr_1.1fr]">
                  <div>
                    <h3 className="font-gothic text-2xl font-bold uppercase leading-none tracking-display text-ink">
                      {v.name}
                    </h3>
                    <p className="mt-4 max-w-measure text-fine leading-relaxed text-ink-soft sm:text-body">
                      {v.summary}
                    </p>
                  </div>
                  {/* Two-up so a six-capability system and a four-capability one stay the same
                      shape, instead of one card running tall and leaving the other half empty. */}
                  <ul className="grid gap-x-10 gap-y-0 sm:grid-cols-2 lg:border-l lg:border-card-rule lg:pl-10">
                    {v.capabilities.map((c) => (
                      <li
                        key={c}
                        // Fixed line pitch. A ruled form's lines are the same distance apart
                        // whether the entry is one line or two, and the rules have to align
                        // across both columns or the card stops reading as ruled stock.
                        className="flex min-h-[3.5rem] items-center border-b border-card-rule py-2 text-fine leading-snug text-ink-soft"
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </RecordCard>
            </li>
          ))}
        </ul>
      </Section>

      {/* Real Estate — the first vertical, given room. */}
      <Section className="bg-steel-900">
        <SectionHead title="A complete acquisition system for real estate." datum="Ref. 05" />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <RecordCard tabs={<SignalTab>Buyers</SignalTab>}>
            <p className="px-6 py-8 text-fine leading-relaxed text-ink-soft sm:px-9 sm:text-body">
              A buyer discovers properties, submits requirements, budget, location and timeline,
              and says what matters to them. Relevant property information comes back, automated
              follow-up keeps the conversation moving, and a showing or consultation is
              scheduled.
            </p>
          </RecordCard>
          <RecordCard tabs={<SignalTab hue="green">Sellers</SignalTab>}>
            <p className="px-6 py-8 text-fine leading-relaxed text-ink-soft sm:px-9 sm:text-body">
              A seller requests a valuation, submits property information and enters a seller
              qualification workflow. Follow-up runs automatically, and the outcome is a
              scheduled conversation with the realtor rather than a name on a list.
            </p>
          </RecordCard>
        </div>
        <p className="mt-10 max-w-measure text-body text-steel-200">
          The same core system is configured per realtor — different branding, market,
          properties, qualification criteria, calendar and CRM. Built once and configured
          intelligently, rather than rebuilt for every client.
        </p>
      </Section>

      {/* AI and automation — infrastructure, not a replacement for people. */}
      <Section>
        <SectionHead
          title="The system keeps working after the form is submitted."
          datum="Ref. 06"
          hue="amber"
        />
        <div className="mt-10 lg:pl-[38%]">
          <Prose>
            <p>
              Capturing a lead is the beginning, not the outcome. Automation and AI agents
              respond quickly, ask the qualifying questions the industry requires, collect what
              is missing, provide the information a prospect asked for and guide them toward the
              next step.
            </p>
            <p>
              Follow-up runs on its own. Appointments are scheduled. The CRM is updated. When a
              conversation needs a person, the business is notified.
            </p>
            <p className="border-l-2 border-signal-amber-up pl-5 text-card">
              This is infrastructure for responding faster and removing repetitive manual work —
              not a replacement for the people who close the business.
            </p>
          </Prose>
        </div>
      </Section>

      {/* CRM. */}
      <Section className="bg-steel-900">
        <SectionHead title="Every conversation has a place to go." datum="Ref. 07" hue="blue" />
        <div className="mt-10 lg:pl-[38%]">
          <Prose>
            <p>
              Opportunities should not end up in spreadsheets, inboxes or a follow-up list nobody
              opens. Acquisition workflows connect to the CRM the client already operates in, and
              that CRM becomes the layer where conversations, opportunities, follow-ups and
              appointments are managed.
            </p>
            <p>
              Where it suits the implementation, GoHighLevel is used. It is a tool inside the
              system, not the system itself.
            </p>
          </Prose>
        </div>
      </Section>

      {/*
        The publisher network. A different drawer of the cabinet, and it looks like one — the
        client's record cards do not appear here, because a publisher never sees them.
      */}
      <Section>
        <SectionHead title="Have an audience? Put it to work." datum="Ref. 08 · Publishers" hue="plum" />
        <p className="mt-8 max-w-measure text-body text-steel-200">
          We work with publishers who can generate qualified traffic for our own acquisition
          offers. Promote offers with tracked referral links and earn commission on approved
          leads.
        </p>
        <p className="mt-5 max-w-measure text-fine text-steel-300">
          The publisher network and client customer records are separate systems. Publishers work
          from offers and tracked links, never from a client&rsquo;s customer data.
        </p>
        <div className="mt-10">
          <GhostTab href="/become-a-partner">Become a Publisher</GhostTab>
        </div>
      </Section>

      <CallToAction
        title="Ready to build a better acquisition system?"
        body="Tell us what your business sells, who you want to reach and where your current acquisition process breaks down. We will assess whether an industry-specific acquisition system is the right fit."
        primary={{ href: '/contact', label: 'Start a Conversation' }}
        secondary={{ href: '/products', label: 'Explore Our Systems' }}
        datum="Ref. 09"
      />
    </>
  );
}

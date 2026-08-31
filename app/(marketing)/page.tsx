import Link from 'next/link';
import { STAGES, VERTICALS } from '@/components/marketing/content';
import { CallToAction, Stages } from '@/components/marketing/primitives';

const DISCONNECTED = [
  'Website',
  'Advertising',
  'CRM',
  'Automation',
  'Lead management',
  'Appointment booking',
];

export default function HomePage() {
  return (
    <>
      {/* Hero — the thesis. The product is an outcome, so the headline names the outcome. */}
      <section className="border-b border-ink-200">
        <div className="gutter py-20 sm:py-28">
          <p className="label text-brand-700">Customer acquisition systems</p>
          <h1 className="mt-6 max-w-[16ch] font-display text-[2.6rem] font-bold leading-[1.02] tracking-tight text-ink-900 sm:text-6xl">
            Customers, not clicks.
          </h1>
          <p className="mt-7 max-w-measure text-lg leading-relaxed text-ink-600">
            We build industry-specific customer acquisition systems. One system connects
            digital presence, lead capture, qualification, AI-powered engagement, automated
            follow-up, CRM and appointment booking — so the demand that arrives is actually
            converted rather than lost between tools.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/for-clients"
              className="rounded-sm bg-brand-700 px-5 py-3 text-[0.95rem] font-semibold text-white transition-colors hover:bg-brand-800"
            >
              I Need Customers
            </Link>
            <Link
              href="/become-a-partner"
              className="rounded-sm border border-ink-300 px-5 py-3 text-[0.95rem] font-semibold text-ink-800 transition-colors hover:border-brand-600 hover:text-brand-700"
            >
              Become a Partner
            </Link>
          </div>
        </div>
      </section>

      {/* The problem, named precisely — it is the reason the product exists. */}
      <section className="border-b border-ink-200 bg-ink-50">
        <div className="gutter grid gap-10 py-16 sm:py-20 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div>
            <p className="label text-ink-500">The problem</p>
            <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
              The tools are fine. The gaps between them are not.
            </h2>
            <ul className="mt-8 flex flex-wrap gap-2">
              {DISCONNECTED.map((tool) => (
                <li
                  key={tool}
                  className="label rounded-sm border border-ink-200 bg-white px-2.5 py-1.5 text-ink-500"
                >
                  {tool}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-5 text-[1.02rem] leading-relaxed text-ink-600">
            <p>
              Most businesses buy acquisition in pieces — a site from one vendor, advertising
              from another, a CRM from a third, automation from whoever was available. Each
              piece can be perfectly competent on its own.
            </p>
            <p>
              What fails is the space between them. A form that captures too little to act on.
              A reply that arrives a day late. Follow-up that depends on someone remembering. A
              record that never reaches the CRM. Every handoff is a place where an opportunity
              quietly stops moving.
            </p>
            <p className="text-ink-900">
              Most businesses do not have a lead problem. They have an acquisition system
              problem.
            </p>
          </div>
        </div>
      </section>

      {/* What gets built — the industry-specific argument, made concretely. */}
      <section className="border-b border-ink-200">
        <div className="gutter py-16 sm:py-20">
          <p className="label text-ink-500">What we build</p>
          <h2 className="mt-4 max-w-[26ch] font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            One acquisition system. Built around your industry.
          </h2>
          <div className="mt-8 grid gap-8 text-[1.02rem] leading-relaxed text-ink-600 lg:grid-cols-2 lg:gap-14">
            <p>
              Every industry has different customers, different qualification criteria and a
              different path to a decision. A real estate buyer should not be qualified like an
              insurance prospect. A homeowner asking for a roofing estimate should not enter the
              same workflow as a legal case enquiry.
            </p>
            <p>
              So the system is built around how that industry actually acquires and converts
              customers — which questions matter, what has to be known before a conversation is
              worth having, and what happens next. The infrastructure is shared. The journey is
              not.
            </p>
          </div>
        </div>
      </section>

      {/* Five stages. Sequential, so the numbering carries real information. */}
      <section className="border-b border-ink-200">
        <div className="gutter py-16 sm:py-20">
          <p className="label text-ink-500">How it works</p>
          <h2 className="mt-4 max-w-[24ch] font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            Five stages, owned end to end.
          </h2>
          <Stages items={STAGES} />
        </div>
      </section>

      {/* Industries. */}
      <section className="border-b border-ink-200">
        <div className="gutter py-16 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label text-ink-500">Industries</p>
              <h2 className="mt-4 max-w-[26ch] font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
                Built around the way each industry acquires customers.
              </h2>
              <p className="mt-5 max-w-measure text-[1.02rem] leading-relaxed text-ink-600">
                Customer acquisition is not generic. Each system is built around the customer
                journey, qualification process and conversion model of its industry.
              </p>
            </div>
            <Link
              href="/products"
              className="text-[0.95rem] font-semibold text-brand-700 hover:text-brand-800"
            >
              All systems &rarr;
            </Link>
          </div>

          <ul className="mt-12 grid gap-px overflow-hidden border border-ink-200 bg-ink-200 sm:grid-cols-2">
            {VERTICALS.map((v, i) => (
              <li
                key={v.slug}
                // An odd number of industries would leave the last grid cell empty, which
                // shows through as a grey block against the hairline background. The final
                // card spans the row instead, so the grid stays closed at any count.
                className={`bg-white p-7 ${
                  i === VERTICALS.length - 1 && VERTICALS.length % 2 === 1 ? 'sm:col-span-2' : ''
                }`}
              >
                <h3 className="font-display text-lg font-semibold text-ink-900">{v.name}</h3>
                <p className="mt-3 text-[0.96rem] leading-relaxed text-ink-600">{v.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Real Estate — the first vertical, given room. */}
      <section className="border-b border-ink-200 bg-ink-50">
        <div className="gutter py-16 sm:py-20">
          <p className="label text-ink-500">Real Estate</p>
          <h2 className="mt-4 max-w-[24ch] font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            A complete acquisition system for real estate.
          </h2>
          <div className="mt-10 grid gap-px overflow-hidden border border-ink-200 bg-ink-200 lg:grid-cols-2">
            <div className="bg-white p-7 sm:p-9">
              <p className="label text-brand-700">Buyers</p>
              <p className="mt-4 text-[0.98rem] leading-relaxed text-ink-600">
                A buyer discovers properties, submits requirements, budget, location and
                timeline, and says what matters to them. Relevant property information comes
                back, automated follow-up keeps the conversation moving, and a showing or
                consultation is scheduled.
              </p>
            </div>
            <div className="bg-white p-7 sm:p-9">
              <p className="label text-brand-700">Sellers</p>
              <p className="mt-4 text-[0.98rem] leading-relaxed text-ink-600">
                A seller requests a valuation, submits property information and enters a seller
                qualification workflow. Follow-up runs automatically, and the outcome is a
                scheduled conversation with the realtor rather than a name on a list.
              </p>
            </div>
          </div>
          <p className="mt-8 max-w-measure text-[1.02rem] leading-relaxed text-ink-600">
            The same core system is configured per realtor — different branding, market,
            properties, qualification criteria, calendar and CRM. Built once and configured
            intelligently, rather than rebuilt for every client.
          </p>
        </div>
      </section>

      {/* AI and automation — infrastructure, not a replacement for people. */}
      <section className="border-b border-ink-200">
        <div className="gutter grid gap-10 py-16 sm:py-20 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div>
            <p className="label text-ink-500">AI and automation</p>
            <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
              The system keeps working after the form is submitted.
            </h2>
          </div>
          <div className="space-y-5 text-[1.02rem] leading-relaxed text-ink-600">
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
            <p className="text-ink-900">
              This is infrastructure for responding faster and removing repetitive manual work —
              not a replacement for the people who close the business.
            </p>
          </div>
        </div>
      </section>

      {/* CRM. */}
      <section className="border-b border-ink-200">
        <div className="gutter grid gap-10 py-16 sm:py-20 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div>
            <p className="label text-ink-500">CRM</p>
            <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
              Every conversation has a place to go.
            </h2>
          </div>
          <div className="space-y-5 text-[1.02rem] leading-relaxed text-ink-600">
            <p>
              Opportunities should not end up in spreadsheets, inboxes or a follow-up list
              nobody opens. Acquisition workflows connect to the CRM the client already operates
              in, and that CRM becomes the layer where conversations, opportunities, follow-ups
              and appointments are managed.
            </p>
            <p>
              Where it suits the implementation, GoHighLevel is used. It is a tool inside the
              system, not the system itself.
            </p>
          </div>
        </div>
      </section>

      {/* Publisher network — deliberately framed as a separate side of the business. */}
      <section className="border-b border-ink-200 bg-ink-50">
        <div className="gutter py-16 sm:py-20">
          <p className="label text-ink-500">Publishers</p>
          <h2 className="mt-4 max-w-[22ch] font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            Have an audience? Put it to work.
          </h2>
          <p className="mt-5 max-w-measure text-[1.02rem] leading-relaxed text-ink-600">
            We work with publishers who can generate qualified traffic for our own acquisition
            offers. Promote offers with tracked referral links and earn commission on approved
            leads.
          </p>
          <Link
            href="/become-a-partner"
            className="mt-8 inline-block rounded-sm border border-ink-300 bg-white px-5 py-3 text-[0.95rem] font-semibold text-ink-800 transition-colors hover:border-brand-600 hover:text-brand-700"
          >
            Become a Publisher
          </Link>
        </div>
      </section>

      <CallToAction
        title="Ready to build a better acquisition system?"
        body="Tell us what your business sells, who you want to reach and where your current acquisition process breaks down. We will assess whether an industry-specific acquisition system is the right fit."
        primary={{ href: '/contact', label: 'Start a Conversation' }}
        secondary={{ href: '/products', label: 'Explore Our Systems' }}
      />
    </>
  );
}

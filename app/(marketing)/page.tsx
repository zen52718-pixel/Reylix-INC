import Link from 'next/link';
import { STAGES, STATUS_LABEL, VERTICALS } from '@/components/marketing/content';
import { CallToAction, Stages } from '@/components/marketing/primitives';

export default function HomePage() {
  return (
    <>
      {/* Hero — the thesis. Reylix sells outcomes, so the headline names the outcome. */}
      <section className="border-b border-ink-200">
        <div className="gutter py-20 sm:py-28">
          <p className="label text-brand-700">Customer acquisition</p>
          <h1 className="mt-6 max-w-[16ch] font-display text-[2.6rem] font-bold leading-[1.02] tracking-tight text-ink-900 sm:text-6xl">
            Customers, not clicks.
          </h1>
          <p className="mt-7 max-w-measure text-lg leading-relaxed text-ink-600">
            Reylix builds and operates industry-specific customer acquisition systems. Each one
            handles the whole path — presence, capture, qualification and conversion — so a
            business gets booked appointments instead of a list of names to chase.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/for-clients"
              className="rounded-sm bg-brand-700 px-5 py-3 text-[0.95rem] font-semibold text-white transition-colors hover:bg-brand-800"
            >
              I need customers
            </Link>
            <Link
              href="/for-publishers"
              className="rounded-sm border border-ink-300 px-5 py-3 text-[0.95rem] font-semibold text-ink-800 transition-colors hover:border-brand-600 hover:text-brand-700"
            >
              I drive traffic
            </Link>
          </div>
        </div>
      </section>

      {/* Positioning. The category confusion is the objection, so it is answered immediately. */}
      <section className="border-b border-ink-200 bg-ink-50">
        <div className="gutter grid gap-10 py-16 sm:py-20 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div>
            <p className="label text-ink-500">What Reylix is</p>
            <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
              One system, not four vendors.
            </h2>
          </div>
          <div className="space-y-5 text-[1.02rem] leading-relaxed text-ink-600">
            <p>
              Most businesses assemble customer acquisition from parts: a web agency, an ad
              agency, a CRM consultant, and whoever set up the automations. Every handoff between
              them is a place where a customer goes cold.
            </p>
            <p>
              Reylix builds the whole path as one system, specific to an industry. The site, the
              forms, the qualification, the follow-up and the booking are designed together,
              because they only work together.
            </p>
            <p className="text-ink-900">
              Reylix is not a website agency, an AI agency, a lead vendor or a CRM. It is the
              system those four things are usually a substitute for.
            </p>
          </div>
        </div>
      </section>

      {/* The four stages. Sequential, so the numbering carries real information. */}
      <section className="border-b border-ink-200">
        <div className="gutter py-16 sm:py-20">
          <p className="label text-ink-500">How it works</p>
          <h2 className="mt-4 max-w-[22ch] font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            Four stages, owned end to end.
          </h2>
          <Stages items={STAGES} />
        </div>
      </section>

      {/* Verticals. Status is stated honestly — nothing here claims to be shipping that isn't. */}
      <section className="border-b border-ink-200">
        <div className="gutter py-16 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label text-ink-500">Products</p>
              <h2 className="mt-4 max-w-[24ch] font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
                Built per industry, because acquisition is not generic.
              </h2>
            </div>
            <Link
              href="/products"
              className="text-[0.95rem] font-semibold text-brand-700 hover:text-brand-800"
            >
              All products &rarr;
            </Link>
          </div>

          <ul className="mt-12 grid gap-px overflow-hidden border border-ink-200 bg-ink-200 sm:grid-cols-2">
            {VERTICALS.map((v) => (
              <li key={v.slug} className="bg-white p-7">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-display text-lg font-semibold text-ink-900">{v.name}</h3>
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
                <p className="mt-3 text-[0.96rem] leading-relaxed text-ink-600">{v.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The two sides of the business, stated plainly rather than buried in a nav menu. */}
      <section className="border-b border-ink-200">
        <div className="gutter grid gap-px overflow-hidden border border-ink-200 bg-ink-200 py-0 sm:grid-cols-2">
          <div className="bg-white p-8 sm:p-10">
            <p className="label text-brand-700">For clients</p>
            <h2 className="mt-4 font-display text-xl font-semibold tracking-tight text-ink-900">
              You need more customers.
            </h2>
            <p className="mt-3 text-[0.98rem] leading-relaxed text-ink-600">
              Reylix deploys the acquisition system for your industry and connects it to the CRM
              you already work in. You get qualified people on the calendar.
            </p>
            <Link
              href="/for-clients"
              className="mt-6 inline-block text-[0.95rem] font-semibold text-brand-700 hover:text-brand-800"
            >
              How it works for clients &rarr;
            </Link>
          </div>
          <div className="bg-white p-8 sm:p-10">
            <p className="label text-brand-700">For publishers</p>
            <h2 className="mt-4 font-display text-xl font-semibold tracking-tight text-ink-900">
              You have an audience.
            </h2>
            <p className="mt-3 text-[0.98rem] leading-relaxed text-ink-600">
              Promote Reylix offers with tracked referral links, see exactly what was attributed
              to you, and get paid on approved leads.
            </p>
            <Link
              href="/for-publishers"
              className="mt-6 inline-block text-[0.95rem] font-semibold text-brand-700 hover:text-brand-800"
            >
              How the partner program works &rarr;
            </Link>
          </div>
        </div>
      </section>

      <CallToAction
        title="Tell us what you are trying to grow."
        body="A short conversation is enough to tell whether Reylix is the right fit for your business, and we will say so if it is not."
        primary={{ href: '/contact', label: 'Start a conversation' }}
        secondary={{ href: '/products', label: 'See the products' }}
      />
    </>
  );
}

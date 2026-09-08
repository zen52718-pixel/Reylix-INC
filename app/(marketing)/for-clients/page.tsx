import type { Metadata } from 'next';
import { STAGES } from '@/components/marketing/content';
import {
  CallToAction,
  Manifest,
  PageHeader,
  Prose,
  Section,
  SectionHead,
  Stages,
} from '@/components/marketing/primitives';

export const metadata: Metadata = {
  title: 'For Clients',
  description:
    'A customer acquisition system built around your business — digital presence, lead capture, qualification, AI automation, CRM integration, appointment booking and reporting.',
};

const INCLUDED = [
  {
    title: 'Digital Presence',
    body: 'Industry-specific website and customer experience, built for how your market actually decides.',
  },
  {
    title: 'Lead Capture',
    body: 'Forms and conversion points designed around your business, collecting what you need to act on the first contact.',
  },
  {
    title: 'Qualification',
    body: 'Questions and workflows that determine whether a prospect is worth pursuing, before anyone picks up the phone.',
  },
  {
    title: 'AI & Automation',
    body: 'Automated conversations, follow-up and task handling that continue after the form is submitted.',
  },
  {
    title: 'CRM',
    body: 'Centralized management of customer records and opportunities, in the system your team works in.',
  },
  {
    title: 'Appointment Booking',
    body: 'Move qualified prospects toward scheduled conversations rather than a list to chase.',
  },
  {
    title: 'Reporting',
    body: 'Understand where opportunities came from and what happened after capture.',
  },
];

export default function ForClientsPage() {
  return (
    <>
      <PageHeader
        title="A customer acquisition system built around your business."
        datum="For clients"
        standfirst="A website is not the product. We deploy the acquisition infrastructure around the business — presence, capture, qualification, engagement, CRM and booking, connected as one system."
      />

      {/* The manifest: one ruled line per component, numbered, at catalogue density. */}
      <Section className="bg-steel-900">
        <SectionHead title="The whole path, not a piece of it." datum="What gets deployed" />
        <div className="mt-12">
          <Manifest items={INCLUDED} tab="Manifest · 7 components" />
        </div>
      </Section>

      <Section>
        <SectionHead
          title="Five stages you never have to stitch together."
          datum="How it works"
          hue="green"
        />
        <div className="mt-12">
          <Stages items={STAGES} />
        </div>
      </Section>

      <Section className="bg-steel-900">
        <SectionHead title="What we need from you." datum="Working with us" hue="amber" />
        <div className="mt-10">
          <Prose>
            <p>
              The system already exists; it is configured for your business rather than built
              from scratch. That keeps deployment measured in weeks, and means improvements made
              for one client reach every client on the same system.
            </p>
            <p>
              What we need from you is the part only you have: how your business actually
              qualifies a good customer, what you want to know before a first conversation, and
              access to the CRM and calendar your team already works in.
            </p>
            <p className="border-l-2 border-signal-amber-up pl-5 text-card">
              You keep your data. Customer records live in your CRM, under your account, and the
              relationship with your customers stays yours.
            </p>
          </Prose>
        </div>
      </Section>

      {/* The wall between the two sides of the business, stated where a client will read it. */}
      <Section>
        <SectionHead
          title="Your customers are not part of our network."
          datum="Two separate things"
          hue="plum"
        />
        <div className="mt-10">
          <Prose>
            <p>
              We also operate a publisher network that promotes our own acquisition offers. That
              is a separate side of the business, and the two do not touch.
            </p>
            <p>
              Publishers promote offers using tracked referral links. They have no access to your
              CRM, your customer records or your pipeline. The customers your system acquires
              belong to you and are managed in your CRM.
            </p>
          </Prose>
        </div>
      </Section>

      <CallToAction
        title="Tell us what you are trying to grow."
        body="Describe your business, who you want to reach and where the process breaks down today. If an industry-specific acquisition system is not the right fit, we will say so."
        primary={{ href: '/contact', label: 'Talk to Reylix' }}
        secondary={{ href: '/products', label: 'Explore Our Systems' }}
        datum="Next"
      />
    </>
  );
}

import type { Metadata } from 'next';
import { LEGAL_NAME } from '@/components/marketing/content';
import { PageHeader, Prose, Section } from '@/components/marketing/primitives';

export const metadata: Metadata = {
  alternates: { canonical: '/privacy' },
  title: 'Privacy Policy',
  description: 'How Reylix INC handles information collected through this website.',
  robots: { index: false, follow: true },
};

/**
 * PLACEHOLDER. This page states plainly what the site currently does with a submission and
 * says explicitly that it is not the reviewed policy. Publishing invented legal text that
 * looks authoritative would be worse than publishing nothing, because people rely on it.
 */
export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        title="Privacy Policy"
        datum="Legal"
        standfirst="This is a placeholder. It describes what the site does today, but it has not been reviewed by counsel and is not the final policy."
      />

      <Section title="Not yet a reviewed policy." datum="Status">
        <Prose>
          <p>
            {LEGAL_NAME} is preparing a full privacy policy with legal counsel. Until it is
            published, this page describes honestly what happens when you use this site, so that
            you can make an informed decision about submitting anything.
          </p>
        </Prose>
      </Section>

      <Section title="Only what you type into a form." datum="What we collect">
        <Prose>
          <p>
            This site has no analytics, no advertising pixels and no third-party trackers. Fonts
            are served from this domain rather than a font provider, so loading a page does not
            report your visit to anyone else.
          </p>
          <p>
            When you submit the contact or partner form we receive what you entered — your name,
            email, and any phone number, company, and message you chose to provide — along with
            your consent selection, the time of submission, and the IP address the request came
            from.
          </p>
        </Prose>
      </Section>

      <Section title="To reply to you." datum="How we use it">
        <Prose>
          <p>
            We use what you submit to respond to your enquiry or assess your partner application.
            Consenting to contact is not a condition of purchase or participation, and you can
            withdraw it at any time by replying to any message from us and asking us to stop.
          </p>
          <p>
            We do not sell what you submit through this website.
          </p>
        </Prose>
      </Section>

      <Section title="Ask us before you send anything you are unsure about." datum="Questions">
        <Prose>
          <p>
            If you want to know how a particular piece of information would be handled, ask
            through the contact form before submitting it, and we will answer before you decide.
          </p>
        </Prose>
      </Section>
    </>
  );
}

import type { Metadata } from 'next';
import { LEGAL_NAME } from '@/components/marketing/content';
import { PageHeader, Prose, Section } from '@/components/marketing/primitives';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms governing use of the Reylix INC website.',
  robots: { index: false, follow: true },
};

/**
 * PLACEHOLDER. See the note on the privacy page: stating that terms are pending is more
 * useful, and more honest, than generated boilerplate that reads as if it were binding.
 */
export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Terms of Service"
        standfirst="This is a placeholder. Full terms are being prepared with legal counsel and have not been published yet."
      />

      <Section label="Status" title="Terms are pending.">
        <Prose>
          <p>
            {LEGAL_NAME} has not yet published terms of service for this website. Rather than post
            boilerplate that reads as though it had been reviewed, this page says so directly.
          </p>
        </Prose>
      </Section>

      <Section label="In the meantime" title="What this site is.">
        <Prose>
          <p>
            This website is informational. Nothing on it is an offer, a contract, or a guarantee
            of a result. Descriptions of products under development describe what is intended, not
            what is currently available — where something is not yet shipping, the page says so.
          </p>
          <p>
            Any actual engagement between {LEGAL_NAME} and a client or a partner is governed by a
            separate written agreement, not by this website.
          </p>
        </Prose>
      </Section>

      <Section label="Questions" title="Ask before relying on anything here.">
        <Prose>
          <p>
            If you need something on this site confirmed in writing before you act on it, ask
            through the contact form and we will confirm or correct it.
          </p>
        </Prose>
      </Section>
    </>
  );
}

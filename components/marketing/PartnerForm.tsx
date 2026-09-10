'use client';

import { useState } from 'react';
import { CONSENT_PARTNER, INDUSTRY_OPTIONS } from '@/components/marketing/content';
import {
  ConsentField,
  FormError,
  FormSuccess,
  Honeypot,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
} from '@/components/marketing/fields';

type Status = 'idle' | 'sending' | 'sent';

/**
 * The design's partner application, wired to the real endpoint.
 *
 * The handoff's fields map almost exactly onto the existing schema: Traffic Source is
 * `audienceType`, Monthly Volume is `audienceSize`, Message is `promoDescription`. Only
 * Primary Industry has no column, so it is folded into the description with a label.
 */
const TRAFFIC_SOURCES = [
  { value: 'paid', label: 'Paid Search' },
  { value: 'social', label: 'Paid Social' },
  { value: 'seo', label: 'SEO / Organic' },
  { value: 'email', label: 'Email' },
  { value: 'other', label: 'Affiliate Network' },
];

export function PartnerForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus('sending');

    const form = new FormData(event.currentTarget);
    const str = (k: string) => String(form.get(k) ?? '').trim();

    const industry = str('industry');
    const promoDescription =
      [industry ? `Primary industry: ${industry}` : null, str('message') || null]
        .filter(Boolean)
        .join('\n\n') || str('message');

    const payload = {
      name: str('name'),
      email: str('email'),
      phone: str('phone'),
      company: str('company'),
      website: str('website'),
      audienceType: str('audienceType') || 'other',
      audienceSize: str('audienceSize'),
      promoDescription,
      consent: form.get('consent') === 'on',
      hp: str('hp'),
    };

    try {
      const res = await fetch('/api/become-a-partner', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error?.message ?? 'Something went wrong. Please try again.');
        setStatus('idle');
        return;
      }
      setStatus('sent');
    } catch {
      setError('We could not reach the server. Check your connection and try again.');
      setStatus('idle');
    }
  }

  if (status === 'sent') {
    return (
      <FormSuccess
        title="Application received."
        body="Thanks. We review every application and will reply by email either way — including if you are not a fit right now."
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="relative grid gap-5 sm:grid-cols-2">
      <Honeypot name="hp" />

      <TextField label="Full Name" name="name" required autoComplete="name" />
      <TextField label="Company" name="company" required autoComplete="organization" />
      <TextField label="Email" name="email" type="email" required autoComplete="email" />
      <TextField label="Phone" name="phone" type="tel" autoComplete="tel" />
      <TextField label="Website" name="website" placeholder="https://" autoComplete="url" />

      <SelectField label="Traffic Source" name="audienceType" options={TRAFFIC_SOURCES} />
      <SelectField
        label="Primary Industry"
        name="industry"
        options={INDUSTRY_OPTIONS.map((i) => ({ value: i, label: i }))}
      />
      <TextField
        label="Monthly Traffic / Lead Volume"
        name="audienceSize"
        placeholder="Monthly visitors, list size, followers…"
      />

      <TextAreaField
        label="Message"
        name="message"
        required
        rows={5}
        placeholder="Which verticals, which channels, and what your traffic usually converts on."
        className="sm:col-span-2"
      />

      <div className="sm:col-span-2">
        <ConsentField name="consent" wording={CONSENT_PARTNER} />
      </div>

      {error && (
        <div className="sm:col-span-2">
          <FormError message={error} />
        </div>
      )}

      <div className="sm:col-span-2">
        <SubmitButton pending={status === 'sending'}>Apply to Become a Partner</SubmitButton>
      </div>
    </form>
  );
}

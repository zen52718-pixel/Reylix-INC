'use client';

import { useState } from 'react';
import { CONSENT_PARTNER } from '@/components/marketing/content';
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

export function PartnerForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus('sending');

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      phone: String(form.get('phone') ?? ''),
      company: String(form.get('company') ?? ''),
      website: String(form.get('website') ?? ''),
      audienceType: String(form.get('audienceType') ?? 'other'),
      audienceSize: String(form.get('audienceSize') ?? ''),
      promoDescription: String(form.get('promoDescription') ?? ''),
      consent: form.get('consent') === 'on',
      hp: String(form.get('hp') ?? ''),
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
    <form onSubmit={onSubmit} className="relative space-y-5">
      <Honeypot name="hp" />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Name" name="name" required autoComplete="name" />
        <TextField label="Email" name="email" type="email" required autoComplete="email" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Phone" name="phone" type="tel" autoComplete="tel" placeholder="(555) 123-4567" />
        <TextField label="Company" name="company" autoComplete="organization" />
      </div>

      <TextField
        label="Website or main channel"
        name="website"
        placeholder="https://"
        autoComplete="url"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="Primary traffic type"
          name="audienceType"
          options={[
            { value: 'paid', label: 'Paid traffic' },
            { value: 'seo', label: 'SEO / organic' },
            { value: 'social', label: 'Social' },
            { value: 'email', label: 'Email list' },
            { value: 'other', label: 'Other' },
          ]}
        />
        <TextField
          label="Audience size"
          name="audienceSize"
          placeholder="Monthly visitors, list size, followers…"
        />
      </div>

      <TextAreaField
        label="How do you plan to promote?"
        name="promoDescription"
        required
        rows={6}
        placeholder="Which verticals, which channels, and what your traffic usually converts on."
      />

      <ConsentField name="consent" wording={CONSENT_PARTNER} />

      {error && <FormError message={error} />}

      <SubmitButton pending={status === 'sending'}>Apply to Become a Publisher</SubmitButton>
    </form>
  );
}

'use client';

import { useState } from 'react';
import { CONSENT_CONTACT, INDUSTRY_OPTIONS } from '@/components/marketing/content';
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
 * The design's contact form, wired to the real endpoint.
 *
 * The handoff's prototype was frontend-only (`preventDefault(); setSent(true)`). Its extra
 * fields — Industry and "What are you looking to build?" — have no column in the Inquiry
 * record, so rather than change the API contract they are folded into the message with a
 * label. Nothing a visitor types is discarded, and the endpoint's schema is untouched.
 */
export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus('sending');

    const form = new FormData(event.currentTarget);
    const str = (k: string) => String(form.get(k) ?? '').trim();

    const industry = str('industry');
    const goal = str('goal');
    const message = [
      industry ? `Industry: ${industry}` : null,
      goal ? `Looking to build: ${goal}` : null,
      str('message') || null,
    ]
      .filter(Boolean)
      .join('\n\n');

    const payload = {
      name: str('name'),
      email: str('email'),
      phone: str('phone'),
      company: str('company'),
      website: str('website'),
      interestType: 'brand',
      message,
      consent: form.get('consent') === 'on',
      hp: str('hp'),
    };

    try {
      const res = await fetch('/api/contact', {
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
        title="Thanks — we've got it."
        body="Someone from Reylix will follow up by email. If it is urgent, say so in a reply and we will move it up."
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="relative grid gap-5 sm:grid-cols-2">
      <Honeypot name="hp" />

      <TextField label="Full Name" name="name" required autoComplete="name" />
      <TextField label="Business Name" name="company" required autoComplete="organization" />
      <TextField label="Email" name="email" type="email" required autoComplete="email" />
      <TextField label="Phone" name="phone" type="tel" autoComplete="tel" />

      <SelectField
        label="Industry"
        name="industry"
        options={INDUSTRY_OPTIONS.map((i) => ({ value: i, label: i }))}
      />
      <TextField label="Website" name="website" placeholder="https://" autoComplete="url" />

      <TextField
        label="What are you looking to build?"
        name="goal"
        placeholder="e.g. a full acquisition system for buyer leads"
        className="sm:col-span-2"
      />
      <TextAreaField label="Message" name="message" rows={5} className="sm:col-span-2" />

      <div className="sm:col-span-2">
        <ConsentField name="consent" wording={CONSENT_CONTACT} />
      </div>

      {error && (
        <div className="sm:col-span-2">
          <FormError message={error} />
        </div>
      )}

      <div className="sm:col-span-2">
        <SubmitButton pending={status === 'sending'}>Start the Conversation</SubmitButton>
      </div>
    </form>
  );
}

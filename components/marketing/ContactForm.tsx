'use client';

import { useState } from 'react';
import { CONSENT_CONTACT } from '@/components/marketing/content';
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

export function ContactForm() {
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
      interestType: String(form.get('interestType') ?? 'other'),
      message: String(form.get('message') ?? ''),
      consent: form.get('consent') === 'on',
      website: String(form.get('website') ?? ''),
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
        title="Message received."
        body="Thanks — we have your enquiry and will reply by email. If it is urgent, say so in a reply and we will move it up."
      />
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate={false} className="relative space-y-5">
      <Honeypot name="website" />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Name" name="name" required autoComplete="name" />
        <TextField label="Email" name="email" type="email" required autoComplete="email" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Phone" name="phone" type="tel" autoComplete="tel" placeholder="(555) 123-4567" />
        <TextField label="Company" name="company" autoComplete="organization" />
      </div>

      <SelectField
        label="What is this about?"
        name="interestType"
        options={[
          { value: 'brand', label: 'I need customers for my business' },
          { value: 'publisher', label: 'I want to send traffic as a partner' },
          { value: 'other', label: 'Something else' },
        ]}
      />

      <TextAreaField
        label="How can we help?"
        name="message"
        rows={6}
        placeholder="Tell us about your business and what you are trying to grow."
      />

      <ConsentField name="consent" wording={CONSENT_CONTACT} />

      {error && <FormError message={error} />}

      <SubmitButton pending={status === 'sending'}>Send message</SubmitButton>
    </form>
  );
}

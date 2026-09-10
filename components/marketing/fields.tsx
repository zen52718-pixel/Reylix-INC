'use client';

import type { ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { useId } from 'react';

/**
 * Form field primitives, restyled to the design handoff.
 *
 * Two things the handoff does NOT have, kept anyway because removing them would break the
 * site or the law:
 *
 * 1. **The consent checkbox.** The handoff's forms are `preventDefault(); setSent(true)`
 *    prototypes with no consent step. The real API requires `consent: true` and stores the
 *    wording verbatim for TCPA. It stays.
 * 2. **A honeypot.** Bot protection the prototype has no need for.
 *
 * Every field renders a real <label> bound by id, so the form works with a screen reader and
 * clicking a label focuses its control.
 */

const fieldClass =
  'block w-full rounded-sm border border-hairline bg-surface-card px-4 py-3 text-sm text-heading placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25';

function Label({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm text-body">
      {children}
      {required && (
        <span className="ml-1 text-brand" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

export function TextField({
  label,
  name,
  type = 'text',
  required,
  placeholder,
  autoComplete,
  className = '',
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={fieldClass}
      />
    </div>
  );
}

export function TextAreaField({
  label,
  name,
  required,
  rows = 5,
  placeholder,
  className = '',
}: {
  label: string;
  name: string;
  required?: boolean;
  rows?: number;
  placeholder?: string;
  className?: string;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'name' | 'rows' | 'className'>) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        required={required}
        placeholder={placeholder}
        className={fieldClass}
      />
    </div>
  );
}

export function SelectField({
  label,
  name,
  options,
  required,
  placeholder = 'Select…',
  className = '',
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  className?: string;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'name' | 'className'>) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <select id={id} name={name} required={required} className={`${fieldClass} rx-select`}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** The consent checkbox. The wording is passed in so it always matches what gets stored. */
export function ConsentField({ name, wording }: { name: string; wording: string }) {
  const id = useId();
  return (
    <div className="flex gap-3 border-t border-hairline pt-5">
      <input
        id={id}
        name={name}
        type="checkbox"
        required
        className="rx-check mt-px h-6 w-6 shrink-0"
      />
      <label htmlFor={id} className="text-[13px] leading-relaxed text-body">
        {wording}
      </label>
    </div>
  );
}

/** Off-screen honeypot. Hidden from people and from assistive tech, visible to naive bots. */
export function Honeypot({ name }: { name: string }) {
  return (
    <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
      <label htmlFor={`hp-${name}`}>Leave this field empty</label>
      <input id={`hp-${name}`} name={name} type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-pill bg-brand px-6 py-3 text-[15px] font-bold text-white transition-colors duration-150 hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-neutral-400"
    >
      {pending ? 'Sending…' : children}
      {pending && (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 animate-spin">
          <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="12 36" />
        </svg>
      )}
    </button>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-sm border border-brand/40 bg-brand-soft/40 px-4 py-3 text-sm text-heading">
      {message}
    </p>
  );
}

export function FormSuccess({ title, body }: { title: string; body: string }) {
  return (
    <div role="status" className="rounded-lg border border-hairline p-10 text-center">
      <h3 className="text-[22px]">{title}</h3>
      <p className="mt-2 text-body">{body}</p>
    </div>
  );
}

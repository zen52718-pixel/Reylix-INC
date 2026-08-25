'use client';

import type { ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { useId } from 'react';

/**
 * Form field primitives.
 *
 * Every field renders a real <label> bound by id, so the whole form is usable with a screen
 * reader and clicking a label focuses its control. Required fields are marked in the label
 * rather than only by a red outline after failure.
 */

const fieldClass =
  'mt-2 w-full rounded-sm border border-ink-300 bg-white px-3.5 py-2.5 text-[0.95rem] text-ink-900 placeholder:text-ink-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20';

function Label({ htmlFor, children, required }: { htmlFor: string; children: ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block text-[0.88rem] font-semibold text-ink-800">
      {children}
      {required && <span className="ml-1 text-brand-700">*</span>}
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
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  const id = useId();
  return (
    <div>
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
}: {
  label: string;
  name: string;
  required?: boolean;
  rows?: number;
  placeholder?: string;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'name' | 'rows'>) {
  const id = useId();
  return (
    <div>
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
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  required?: boolean;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'name'>) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <select id={id} name={name} required={required} className={fieldClass}>
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
    <div className="flex gap-3 border-t border-ink-200 pt-5">
      <input
        id={id}
        name={name}
        type="checkbox"
        required
        className="mt-1 h-4 w-4 shrink-0 rounded-sm border-ink-400 text-brand-700 focus:ring-brand-600"
      />
      <label htmlFor={id} className="text-[0.86rem] leading-relaxed text-ink-600">
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
      className="rounded-sm bg-brand-700 px-5 py-3 text-[0.95rem] font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-ink-400"
    >
      {pending ? 'Sending…' : children}
    </button>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-sm bg-red-50 px-4 py-3 text-[0.9rem] text-red-800">
      {message}
    </p>
  );
}

export function FormSuccess({ title, body }: { title: string; body: string }) {
  return (
    <div role="status" className="border-l-2 border-accent-600 bg-accent-50 px-5 py-6">
      <h3 className="font-display text-lg font-semibold text-ink-900">{title}</h3>
      <p className="mt-2 text-[0.96rem] leading-relaxed text-ink-700">{body}</p>
    </div>
  );
}

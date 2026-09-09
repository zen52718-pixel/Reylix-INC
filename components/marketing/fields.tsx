'use client';

import type { ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { useId } from 'react';

/**
 * Form field primitives — the intake side of the record system.
 *
 * Every field renders a real <label> bound by id, so the whole form is usable with a screen
 * reader and clicking a label focuses its control. Required fields are marked in the label
 * rather than only by a red outline after failure.
 *
 * The visual world changed here; the contract did not. Field names, required flags, the
 * honeypot and the consent wording are untouched, because the API routes and the stored
 * consent record depend on all four.
 */

const fieldClass =
  'mt-2 w-full border border-card-edge bg-white px-3.5 py-2.5 text-[0.95rem] text-ink placeholder:text-ink-faint focus:border-signal-orange focus:outline-none focus:ring-2 focus:ring-signal-orange/25';

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
    <label
      htmlFor={htmlFor}
      className="block font-gothic text-[0.9375rem] font-semibold uppercase tracking-tab text-ink"
    >
      {children}
      {required && (
        <span className="ml-1.5 text-signal-orange" aria-hidden="true">
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
      <select id={id} name={name} required={required} className={`${fieldClass} rx-select`}>
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
    <div className="flex gap-3 border-t border-card-rule pt-5">
      <input
        id={id}
        name={name}
        type="checkbox"
        required
        className="rx-check mt-px h-6 w-6 shrink-0 rounded-none"
      />
      <label htmlFor={id} className="text-[0.875rem] leading-relaxed text-ink-soft">
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

/** The submit control is the same pulled tab as every other primary action on the site. */
export function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="group inline-flex items-center gap-3 bg-signal-orange px-6 py-4 font-gothic text-tab font-semibold uppercase tracking-tab text-card transition-transform duration-300 ease-pull hover:translate-x-1.5 disabled:translate-x-0 disabled:cursor-not-allowed disabled:bg-ink-faint"
      style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 1rem 100%, 0 calc(100% - 0.6rem))' }}
    >
      {pending ? 'Sending…' : children}
      {pending ? (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 animate-spin">
          <circle
            cx="10"
            cy="10"
            r="7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="12 36"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 20 12" aria-hidden="true" className="h-3 w-5">
          <path
            d="M0 6h17M12.5 1.5 17.5 6l-5 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
          />
        </svg>
      )}
    </button>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="border-t-2 border-signal-orange bg-card-shade px-4 py-3 text-[0.9375rem] text-ink"
    >
      {message}
    </p>
  );
}

export function FormSuccess({ title, body }: { title: string; body: string }) {
  return (
    <div role="status" className="border-t-2 border-signal-green bg-card-shade px-6 py-7">
      <h3 className="font-gothic text-2xl font-bold uppercase leading-none tracking-display text-ink">
        {title}
      </h3>
      <p className="mt-4 text-body leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}

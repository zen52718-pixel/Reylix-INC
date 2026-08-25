import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Shared page furniture. These exist so every page shares one rhythm — the same eyebrow
 * treatment, the same vertical spacing, the same closing call to action — instead of each
 * page inventing its own and drifting apart.
 */

export function PageHeader({
  eyebrow,
  title,
  standfirst,
}: {
  eyebrow: string;
  title: string;
  standfirst?: string;
}) {
  return (
    <header className="border-b border-ink-200">
      <div className="gutter py-16 sm:py-20">
        <p className="label text-brand-700">{eyebrow}</p>
        <h1 className="mt-5 max-w-[18ch] font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink-900 sm:text-5xl">
          {title}
        </h1>
        {standfirst && (
          <p className="mt-6 max-w-measure text-lg leading-relaxed text-ink-600">{standfirst}</p>
        )}
      </div>
    </header>
  );
}

export function Section({
  label,
  title,
  children,
  className = '',
}: {
  label?: string;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border-b border-ink-200 ${className}`}>
      <div className="gutter py-16 sm:py-20">
        {label && <p className="label text-ink-500">{label}</p>}
        {title && (
          <h2 className="mt-4 max-w-[24ch] font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            {title}
          </h2>
        )}
        {children}
      </div>
    </section>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="mt-8 max-w-measure space-y-5 text-[1.02rem] leading-relaxed text-ink-600">
      {children}
    </div>
  );
}

/**
 * The numbered stage list. The numbering is real information here — these are sequential
 * stages a customer moves through, not decoration.
 */
export function Stages({
  items,
}: {
  items: readonly { n: string; title: string; body: string }[];
}) {
  return (
    <ol className="mt-12 grid gap-px overflow-hidden border border-ink-200 bg-ink-200 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((s) => (
        <li key={s.n} className="bg-white p-6">
          <span className="label text-brand-700">{s.n}</span>
          <h3 className="mt-3 font-display text-base font-semibold text-ink-900">{s.title}</h3>
          <p className="mt-2 text-[0.94rem] leading-relaxed text-ink-600">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

export function CallToAction({
  title,
  body,
  primary,
  secondary,
}: {
  title: string;
  body: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="bg-brand-900">
      <div className="gutter py-16 sm:py-20">
        <h2 className="max-w-[20ch] font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {title}
        </h2>
        <p className="mt-4 max-w-measure text-[1.02rem] leading-relaxed text-brand-200">{body}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={primary.href}
            className="rounded-sm bg-white px-5 py-3 text-[0.95rem] font-semibold text-brand-900 transition-colors hover:bg-brand-50"
          >
            {primary.label}
          </Link>
          {secondary && (
            <Link
              href={secondary.href}
              className="rounded-sm border border-brand-400/40 px-5 py-3 text-[0.95rem] font-semibold text-white transition-colors hover:border-brand-300 hover:bg-brand-800"
            >
              {secondary.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * The Reylix component vocabulary, recreated from the design handoff.
 *
 * The prototype was Babel-in-browser React with inline styles; this is the same visual
 * system expressed in the conventions this codebase already uses (Next App Router +
 * Tailwind). Structure is not copied from the prototype where a Next idiom fits better —
 * internal links are `next/link`, not `<a href="*.html">`.
 */

export function Container({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`container-rx ${className}`}>{children}</div>;
}

export function Section({
  children,
  tone = 'light',
  className = '',
  id,
}: {
  children: ReactNode;
  tone?: 'light' | 'gray' | 'dark';
  className?: string;
  id?: string;
}) {
  const toneClass =
    tone === 'dark' ? 'section-dark' : tone === 'gray' ? 'bg-surface-page' : 'bg-white';
  return (
    <section id={id} className={`section ${toneClass} ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

/**
 * The accent-dotted label above a heading. Used on almost every section in the handoff.
 *
 * `onDark` switches to the accent's dark-ground value — the light-ground accent is dark
 * enough to fail contrast against the near-black band.
 */
export function Eyebrow({ children, onDark = false }: { children: ReactNode; onDark?: boolean }) {
  const tone = onDark ? 'text-brand-dark' : 'text-brand';
  const dot = onDark ? 'bg-brand-dark' : 'bg-brand';
  return (
    <div className={`mb-4 inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-label ${tone}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {children}
    </div>
  );
}

const BTN_BASE =
  'inline-flex items-center justify-center gap-2 rounded-pill px-6 py-3 text-[15px] font-bold transition-colors duration-150 ease-base';

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function PrimaryButton({
  href,
  children,
  noArrow = false,
}: {
  href: string;
  children: ReactNode;
  noArrow?: boolean;
}) {
  return (
    <Link href={href} className={`${BTN_BASE} bg-brand text-white hover:bg-brand-hover hover:text-white`}>
      {children}
      {!noArrow && <Arrow />}
    </Link>
  );
}

export function SecondaryButton({
  href,
  children,
  noArrow = false,
}: {
  href: string;
  children: ReactNode;
  noArrow?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`${BTN_BASE} border border-neutral-300 bg-white text-heading hover:border-neutral-400 hover:text-heading`}
    >
      {children}
      {!noArrow && <Arrow />}
    </Link>
  );
}

export function ButtonRow({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`flex flex-wrap items-center gap-3 ${className}`}>{children}</div>;
}

/**
 * A stage node: number, title, optional description. The row lays them out horizontally
 * with arrow glyphs between, and stacks vertically with rotated arrows below 768px.
 *
 * The handoff sets `overflow-x: auto` here. That works for the six-stage row but silently
 * clips the nine-step client journey off the right edge behind a scrollbar nobody sees, so
 * the row wraps instead: every step stays visible at every width, and the arrows still read
 * left to right.
 */
export interface Stage {
  readonly n?: string;
  readonly title: string;
  readonly body?: string;
}

export function StageRow({
  stages,
  compact = false,
}: {
  stages: readonly Stage[];
  compact?: boolean;
}) {
  return (
    <ol className="flex flex-col items-stretch gap-y-2 md:flex-row md:flex-wrap md:gap-y-3">
      {stages.map((s, i) => (
        <li key={s.title} className="contents">
          <div
            className={`flex-1 rounded-md border border-hairline bg-white px-4 py-6 ${
              compact ? 'md:min-w-[130px]' : 'md:min-w-[150px]'
            }`}
          >
            <div className="text-xs font-bold tracking-[0.05em] text-brand">
              {s.n ?? `0${i + 1}`}
            </div>
            <div className="mt-1.5 text-base font-bold text-heading">{s.title}</div>
            {s.body && <p className="mt-1.5 text-[13px] leading-normal text-body">{s.body}</p>}
          </div>
          {i < stages.length - 1 && (
            <div
              aria-hidden="true"
              className="flex h-5 w-full shrink-0 rotate-90 items-center justify-center text-neutral-400 md:h-auto md:w-7 md:rotate-0"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

/** A flat bordered card that lifts on hover, per the handoff's `.card` rule. */
export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-hairline p-8 transition duration-300 ease-base hover:-translate-y-[3px] hover:shadow-md ${className}`}
    >
      {children}
    </div>
  );
}

/** The dark closing band that ends every page except Contact. */
export function CTASection({
  eyebrow,
  heading,
  copy,
  primary,
  secondary,
}: {
  eyebrow?: string;
  heading: string;
  copy: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="section section-dark">
      <Container className="max-w-[760px] text-center">
        {eyebrow && (
          <div className="flex justify-center">
            <Eyebrow onDark>{eyebrow}</Eyebrow>
          </div>
        )}
        <h2 className="text-[clamp(28px,4vw,44px)] leading-tight">{heading}</h2>
        <p className="mt-4 text-lg">{copy}</p>
        <ButtonRow className="mt-8 justify-center">
          <PrimaryButton href={primary.href}>{primary.label}</PrimaryButton>
          {secondary && <SecondaryButton href={secondary.href}>{secondary.label}</SecondaryButton>}
        </ButtonRow>
      </Container>
    </section>
  );
}

/** Standard interior page hero: eyebrow, H1, standfirst, optional action. */
export function PageHero({
  eyebrow,
  title,
  standfirst,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  standfirst?: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="section bg-white pt-[72px]">
      <Container className="max-w-prose">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="text-[clamp(34px,5vw,56px)] leading-[1.1]">{title}</h1>
        {standfirst && <p className="mt-5 text-lg">{standfirst}</p>}
        {action && <ButtonRow className="mt-7">{action}</ButtonRow>}
        {children}
      </Container>
    </section>
  );
}

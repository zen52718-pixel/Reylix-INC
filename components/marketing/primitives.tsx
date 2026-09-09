import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * The Visible Record vocabulary.
 *
 * Every page is a file. Content sits on buff card stock; the steel cabinet shows between the
 * cards. Status and sequence are carried by signal tabs clipped to a card's edge, the way a
 * visible-record system encodes a card without anyone opening it.
 *
 * Two rules this file exists to enforce:
 *
 * 1. A reference datum is set at the END of its heading's line, catalog-style — never as a
 *    small tracked label stacked above the heading. That stacked label is the single most
 *    reliable tell that a page was generated rather than designed, and it was on every
 *    section of every page here before this rewrite.
 * 2. Nothing functional is set below 12px. The old `.label` was 10.88px and appeared 54 times.
 */

export type SignalHue = 'orange' | 'green' | 'blue' | 'amber' | 'plum';

const TAB_SURFACE: Record<SignalHue, string> = {
  orange: 'bg-signal-orange',
  green: 'bg-signal-green',
  blue: 'bg-signal-blue',
  amber: 'bg-signal-amber',
  plum: 'bg-signal-plum',
};

/** Edge rule for a heading set on card stock. */
const TAB_EDGE: Record<SignalHue, string> = {
  orange: 'border-signal-orange',
  green: 'border-signal-green',
  blue: 'border-signal-blue',
  amber: 'border-signal-amber',
  plum: 'border-signal-plum',
};

/**
 * The same five codes on the steel ground. The deep plastics sink into the cabinet and drop
 * under the 3:1 a rule needs to read as a signal, so each one is lifted rather than reused.
 */
const TAB_EDGE_UP: Record<SignalHue, string> = {
  orange: 'border-signal-orange-up',
  green: 'border-signal-green-up',
  blue: 'border-signal-blue-up',
  amber: 'border-signal-amber-up',
  plum: 'border-signal-plum-up',
};

/**
 * Each industry gets one tab colour and keeps it everywhere on the site. That is what makes a
 * signal colour a code rather than an accent: it means the same thing on every page.
 */
export const VERTICAL_HUE: Record<string, SignalHue> = {
  'real-estate': 'orange',
  'home-services': 'amber',
  legal: 'blue',
  insurance: 'green',
  healthcare: 'plum',
};

/**
 * A plastic signal tab. Small, stamped, and carrying one code — never a decorative pill.
 * The notch on the right edge is what makes it read as clipped-on rather than printed.
 */
export function SignalTab({
  children,
  hue = 'orange',
  inert = false,
  className = '',
}: {
  children: ReactNode;
  hue?: SignalHue;
  /** A tab with no code clipped to it. Not a second colour — the absence of one. */
  inert?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`tabtype inline-flex items-center gap-1.5 px-2.5 py-1 ${
        inert ? 'bg-card-shade text-ink-soft ring-1 ring-inset ring-card-rule' : `text-card ${TAB_SURFACE[hue]}`
      } ${className}`}
      style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0.5rem 100%, 0 calc(100% - 0.35rem))' }}
    >
      {children}
    </span>
  );
}

/**
 * A record card. `tabs` clip to the top edge and sit proud of it, which is why the strip is a
 * separate row rather than absolute positioning: at any width the tabs push the card down
 * instead of overlapping the first line of its content.
 */
export function RecordCard({
  tabs,
  children,
  raised = false,
  className = '',
  style,
}: {
  tabs?: ReactNode;
  children: ReactNode;
  raised?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`flex flex-col ${className}`} style={style}>
      {tabs && <div className="flex flex-wrap items-end gap-1 pl-5">{tabs}</div>}
      <div
        className={`flex-1 bg-card text-ink ${raised ? 'shadow-pull' : 'shadow-rest'} border-t-2 border-card-edge`}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Section heading. The datum rides at the end of the heading's own line — title left,
 * catalogue number right, one rule across the top — so the label never becomes a kicker.
 */
export function SectionHead({
  title,
  datum,
  hue = 'orange',
  onCard = false,
  id,
}: {
  title: string;
  datum: string;
  hue?: SignalHue;
  onCard?: boolean;
  id?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-t-2 pt-4 ${
        onCard ? TAB_EDGE[hue] : TAB_EDGE_UP[hue]
      }`}
    >
      <h2
        id={id}
        className={`max-w-[22ch] font-gothic text-3xl font-bold uppercase leading-[0.95] tracking-display sm:text-4xl ${
          onCard ? 'text-ink' : 'text-card'
        }`}
      >
        {title}
      </h2>
      <span className={`datum shrink-0 ${onCard ? 'text-ink-faint' : 'text-steel-300'}`}>{datum}</span>
    </div>
  );
}

/** A ruled field inside a card: the label is set beside its value, not above it. */
export function Field({
  label,
  children,
  last = false,
}: {
  label: string;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`grid gap-x-6 gap-y-1 px-6 py-4 sm:grid-cols-[9rem_1fr] sm:px-8 ${
        last ? '' : 'border-b border-card-rule'
      }`}
    >
      <dt className="datum self-baseline text-ink-faint">{label}</dt>
      <dd className="max-w-measure text-fine leading-relaxed text-ink-soft sm:text-body">
        {children}
      </dd>
    </div>
  );
}

/** The primary action. A tab you pull: it slides out of the file on hover, and only it does. */
export function PullTab({
  href,
  children,
  hue = 'orange',
}: {
  href: string;
  children: ReactNode;
  hue?: SignalHue;
}) {
  return (
    <Link
      href={href}
      className={`tabtype group inline-flex items-center gap-3 px-6 py-4 text-card transition-transform duration-300 ease-pull hover:translate-x-1.5 ${TAB_SURFACE[hue]}`}
      style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 1rem 100%, 0 calc(100% - 0.6rem))' }}
    >
      {children}
      <svg viewBox="0 0 20 12" aria-hidden="true" className="h-3 w-5">
        <path
          d="M0 6h17M12.5 1.5 17.5 6l-5 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        />
      </svg>
    </Link>
  );
}

/** The secondary action. Deliberately quieter: an outlined tab, never a second filled one. */
export function GhostTab({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="tabtype inline-flex items-center gap-3 border border-steel-500 px-6 py-4 text-card transition-colors duration-200 hover:border-card hover:bg-steel-700"
    >
      {children}
    </Link>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="max-w-measure space-y-5 text-body text-steel-200">{children}</div>;
}

/**
 * The file itself. Five cards on one rail, every tab visible at once — which is the whole
 * point of a visible-record system, and the reason the numbering is not decoration: these
 * are sequential stages a prospect actually moves through.
 */
export function Stages({
  items,
}: {
  items: readonly { n: string; title: string; body: string }[];
}) {
  return (
    <ol className="grid gap-x-px gap-y-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-y-0">
      {items.map((s, i) => (
        <li key={s.n} className="flex flex-col">
          <div className="flex items-end gap-1 pl-4">
            <SignalTab inert={i !== 0}>{s.n}</SignalTab>
          </div>
          <div className="flex flex-1 flex-col border-t-2 border-card-edge bg-card px-5 py-6 shadow-rest">
            <h3 className="font-gothic text-xl font-bold uppercase leading-none tracking-display text-ink">
              {s.title}
            </h3>
            <p className="mt-3 text-fine leading-relaxed text-ink-soft">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * A manifest: one ruled, numbered line per component. This is the replacement for the row of
 * equal icon-and-heading cards that used to carry these lists — the lazy container the craft
 * floor refuses, and the reason those pages all read the same.
 */
export function Manifest({
  items,
  tab,
  hue = 'orange',
}: {
  items: readonly { title: string; body: string }[];
  tab: string;
  hue?: SignalHue;
}) {
  return (
    <RecordCard tabs={<SignalTab hue={hue}>{tab}</SignalTab>}>
      <ol>
        {items.map((item, i) => (
          <li
            key={item.title}
            className="grid gap-x-8 gap-y-1 border-b border-card-rule px-6 py-5 last:border-0 sm:grid-cols-[3rem_14rem_1fr] sm:px-9"
          >
            <span className="datum text-ink-faint">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="font-gothic text-lg font-semibold uppercase leading-tight tracking-tab text-ink">
              {item.title}
            </h3>
            <p className="max-w-measure text-fine leading-relaxed text-ink-soft">{item.body}</p>
          </li>
        ))}
      </ol>
    </RecordCard>
  );
}

/** Interior route header. Same law as SectionHead: the datum ends the line, never precedes it. */
export function PageHeader({
  title,
  datum,
  standfirst,
  hue = 'orange',
}: {
  title: string;
  datum: string;
  standfirst?: string;
  hue?: SignalHue;
}) {
  return (
    <header className="gutter pb-2 pt-12 sm:pb-4 sm:pt-16">
      <div
        className={`flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-t-2 pt-5 ${TAB_EDGE_UP[hue]}`}
      >
        <h1 className="max-w-[16ch] font-gothic text-[clamp(2.25rem,5vw,3.5rem)] font-bold uppercase leading-[0.9] tracking-display text-card">
          {title}
        </h1>
        <span className="datum shrink-0 text-steel-300">{datum}</span>
      </div>
      {standfirst && (
        <p className="mt-8 max-w-measure text-lead text-steel-200">{standfirst}</p>
      )}
    </header>
  );
}

/**
 * A section band. Pass `title` + `datum` for the common case and it renders the heading with
 * the right rule and spacing; pass children alone when the section composes its own head.
 */
export function Section({
  children,
  className = '',
  title,
  datum,
  hue = 'orange',
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  datum?: string;
  hue?: SignalHue;
}) {
  return (
    <section className={`gutter py-16 sm:py-20 ${className}`}>
      {title && datum ? (
        <>
          <SectionHead title={title} datum={datum} hue={hue} />
          <div className="mt-10">{children}</div>
        </>
      ) : (
        children
      )}
    </section>
  );
}

/** The closing action, anchored on the darkest plane in the cabinet. */
export function CallToAction({
  title,
  body,
  primary,
  secondary,
  datum,
  hue = 'orange',
}: {
  title: string;
  body: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
  datum: string;
  hue?: SignalHue;
}) {
  return (
    <section className="bg-steel-950">
      <div className="gutter py-16 sm:py-20">
        <SectionHead title={title} datum={datum} hue={hue} />
        <p className="mt-7 max-w-measure text-lead text-steel-200">{body}</p>
        <div className="mt-10 flex flex-wrap items-start gap-4">
          <PullTab href={primary.href} hue={hue}>
            {primary.label}
          </PullTab>
          {secondary && <GhostTab href={secondary.href}>{secondary.label}</GhostTab>}
        </div>
      </div>
    </section>
  );
}

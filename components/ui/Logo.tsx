/**
 * Reylix mark and wordmark.
 *
 * The mark is three converging strokes: many sources of traffic resolving into one customer.
 * It is the attribution idea drawn as simply as it can be drawn, and it stays legible at
 * favicon size where anything more detailed turns to mud.
 */
export function LogoMark({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label="Reylix"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M2 4h13" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
      <path d="M2 12h9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
      <path d="M2 20h13" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
      <path
        d="M15 4c0 4 6 4 6 8s-6 4-6 8"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="square"
        opacity="0.45"
      />
    </svg>
  );
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-5 w-5 text-brand-700" />
      <span className="font-display text-[1.05rem] font-bold tracking-tight text-ink-900">
        Reylix
      </span>
    </span>
  );
}

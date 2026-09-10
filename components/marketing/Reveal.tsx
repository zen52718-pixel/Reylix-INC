'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Scroll reveal: fade and slide up 16px on entering the viewport, once.
 *
 * The handoff drives this with a document-wide IntersectionObserver over `.reveal`. Here it
 * is a component so each block owns its own observer and unobserves itself — no global query
 * that would miss anything rendered later.
 *
 * If the observer never runs (no support, or an error), `visible` stays false and the CSS
 * keeps the element at opacity 0 — so the fallback below sets it visible immediately when
 * IntersectionObserver is unavailable. Content is never left hidden.
 */
export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'in-view' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

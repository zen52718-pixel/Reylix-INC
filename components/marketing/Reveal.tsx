'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Scroll reveal: fade and slide up 16px on entering the viewport, once.
 *
 * Progressive enhancement, deliberately. The rendered markup carries no hidden state, so the
 * server HTML is already visible and readable. Only after this effect runs — meaning the
 * script loaded, parsed, hydrated, and IntersectionObserver exists — does it mark an element
 * `data-reveal="pending"` to hide it for the animation.
 *
 * This is the inverse of what it used to do. The CSS previously set `.reveal { opacity: 0 }`
 * and relied on JavaScript adding `.in-view` to make content readable, so anything that
 * stopped the observer from firing left every section below the hero permanently blank while
 * still occupying its full height. Content must never need JavaScript to become visible.
 *
 * Three things keep that promise even now:
 *
 *  - Nothing is hidden that the visitor can already see. An element at or above the fold is
 *    left alone, which also means no flash of content disappearing and fading back in.
 *  - The observer uses `threshold: 0` with a bottom margin rather than `threshold: 0.15`.
 *    A section taller than the viewport can never reach 15% visibility, so on narrow screens
 *    — where these sections are several viewports tall — the old threshold was unreachable
 *    and those blocks could never reveal.
 *  - If the observer produces no callback at all within FAILSAFE_MS, it is not working, and
 *    the element is shown. A healthy observer always delivers an initial entry almost
 *    immediately, so this never fires in normal use.
 */

/** A healthy IntersectionObserver reports within a frame or two; this is pure insurance. */
const FAILSAFE_MS = 2000;

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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No observer, or motion is unwelcome: leave the element exactly as rendered — visible.
    if (typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    // Never hide something already on screen, or already scrolled past.
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    const show = () => {
      delete el.dataset.reveal;
    };

    el.dataset.reveal = 'pending';

    let answered = false;
    const io = new IntersectionObserver(
      (entries) => {
        answered = true;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            show();
            io.unobserve(entry.target);
          }
        }
      },
      // Trigger once the element's top clears the fold by 80px, independent of its height.
      { threshold: 0, rootMargin: '0px 0px -80px 0px' },
    );
    io.observe(el);

    const failsafe = window.setTimeout(() => {
      if (!answered) show();
    }, FAILSAFE_MS);

    return () => {
      window.clearTimeout(failsafe);
      io.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

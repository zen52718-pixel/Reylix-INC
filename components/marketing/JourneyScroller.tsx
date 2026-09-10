'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * The home page's scrollytelling journey.
 *
 * The left column is the stage list; the right is a sticky card whose highlighted entry
 * follows whichever stage is crossing the 60% viewport threshold. Below `lg` the sticky
 * card is hidden rather than stacked — a duplicate list of the same six names directly
 * under the list it mirrors reads as an accident on a phone.
 */
export function JourneyScroller({
  stages,
}: {
  stages: readonly { title: string; body?: string; n?: string }[];
}) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const i = Number((entry.target as HTMLElement).dataset.i);
            if (!Number.isNaN(i)) setActive(i);
          }
        }
      },
      { threshold: 0.6 },
    );
    for (const el of refs.current) if (el) io.observe(el);
    return () => io.disconnect();
  }, [stages.length]);

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      <ol>
        {stages.map((s, i) => (
          <li
            key={s.title}
            data-i={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="border-b border-hairline py-12 last:border-0"
          >
            <div className="text-xs font-bold tracking-[0.05em] text-brand">
              {s.n ?? `0${i + 1}`}
            </div>
            <h3
              className={`mt-2 text-2xl transition-colors duration-300 ${
                active === i ? 'text-brand' : 'text-heading'
              }`}
            >
              {s.title}
            </h3>
            {s.body && <p className="mt-2 text-[15px]">{s.body}</p>}
          </li>
        ))}
      </ol>

      <div className="hidden lg:block">
        <div className="sticky top-[110px] rounded-xl border border-hairline bg-white p-8">
          <ul className="flex flex-col gap-1">
            {stages.map((s, i) => (
              <li
                key={s.title}
                className={`flex items-center gap-3 rounded-sm px-3 py-2.5 transition-colors duration-300 ${
                  active === i ? 'bg-surface-page' : ''
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-full ${active === i ? 'bg-brand' : 'bg-neutral-300'}`}
                />
                <span
                  className={
                    active === i ? 'font-bold text-heading' : 'font-medium text-muted'
                  }
                >
                  {s.title}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

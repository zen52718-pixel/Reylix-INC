'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Decorative hover grid behind the hero, from the "Reylix Marketing Site Build" handoff.
 *
 * Cells are laid out at roughly CELL_SIZE and re-measured with a ResizeObserver. Hovering a
 * cell tints it; 200ms after the pointer leaves, the tint clears over 900ms.
 *
 * Two deliberate departures from the handoff file:
 *
 *  - Colour. The handoff tints cells with saturated indigo (#433bff). Reylix is orange, and
 *    these cells sit directly behind the headline and body copy, so the palette here is the
 *    brand at partial alpha. A fully saturated block behind 15px body text would not survive a
 *    contrast check, and every other colour decision on this site has had to. The alphas were
 *    picked against the real text colours rather than by eye: the strongest, 0.30, leaves body
 *    copy at 5.5:1 and the headline at 10.9:1, both clear of the 4.5:1 minimum.
 *  - It renders nothing until it has measured itself. The hero must not depend on this: if
 *    the script never runs, `cols` stays 0, no cells and no grid lines are drawn, and the
 *    hero looks exactly as it did before. Same rule as Reveal — decoration never gates
 *    content.
 *
 * `aria-hidden` throughout: this is texture, and there is nothing here to announce.
 */

const CELL_SIZE = 110;

/**
 * Brand at low alpha. Repeats are intentional — they weight the random pick.
 *
 * Typed as a non-empty tuple so index 0 is a `string` rather than `string | undefined`, which
 * gives the random pick below a real fallback under `noUncheckedIndexedAccess`.
 */
const CELL_PALETTE: readonly [string, ...string[]] = [
  'rgba(250, 90, 21, 0.30)',
  'rgba(174, 64, 12, 0.22)',
  'rgba(250, 90, 21, 0.18)',
  'rgba(174, 64, 12, 0.28)',
];

/** Matches the handoff: a beat before clearing, then a long ease-out. */
const CLEAR_DELAY_MS = 200;

export function HeroGrid() {
  const gridRef = useRef<HTMLDivElement>(null);
  const timeouts = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const [dims, setDims] = useState({ cols: 0, rows: 0 });
  const [filled, setFilled] = useState<Record<number, string>>({});

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    // Motion is unwelcome: leave the grid unmeasured, so nothing renders at all.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      setDims({
        cols: Math.max(1, Math.ceil(width / CELL_SIZE)),
        rows: Math.max(1, Math.ceil(height / CELL_SIZE)),
      });
    };

    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();

    const pending = timeouts.current;
    return () => {
      ro.disconnect();
      Object.values(pending).forEach(clearTimeout);
    };
  }, []);

  const onEnter = useCallback((i: number) => {
    const pending = timeouts.current[i];
    if (pending) {
      clearTimeout(pending);
      delete timeouts.current[i];
    }
    const color =
      CELL_PALETTE[Math.floor(Math.random() * CELL_PALETTE.length)] ?? CELL_PALETTE[0];
    setFilled((f) => ({ ...f, [i]: color }));
  }, []);

  const onLeave = useCallback((i: number) => {
    timeouts.current[i] = setTimeout(() => {
      setFilled((f) => {
        const next = { ...f };
        delete next[i];
        return next;
      });
      delete timeouts.current[i];
    }, CLEAR_DELAY_MS);
  }, []);

  const total = dims.cols * dims.rows;

  return (
    <div
      ref={gridRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 grid"
      style={
        total
          ? {
              gridTemplateColumns: `repeat(${dims.cols}, 1fr)`,
              gridTemplateRows: `repeat(${dims.rows}, 1fr)`,
            }
          : undefined
      }
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          onMouseEnter={() => onEnter(i)}
          onMouseLeave={() => onLeave(i)}
          // `hover-none:pointer-events-none` keeps a tap on a touch screen from painting cells.
          className="pointer-events-auto border-b border-l border-hairline [@media(hover:none)]:pointer-events-none"
          style={{
            background: filled[i] ?? 'transparent',
            transition: 'background 900ms cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        />
      ))}
    </div>
  );
}

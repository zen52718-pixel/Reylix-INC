/**
 * The Reylix mark: a white chevron in a rounded tile.
 *
 * Geometry is taken from the brand asset canvas, not approximated. Every exported asset in
 * that canvas (lg-primary, lg-symbol, lg-appicon, lg-favicon, lg-avatar) draws the identical
 * chevron at the identical proportions, so it is expressed once here in a 100x100 box:
 *
 *   corner radius  25% of the tile
 *   chevron        M38,28 -> 62,50 -> 38,72
 *   stroke         9% of the tile, round cap and round join
 *
 * Drawn as a stroke rather than a filled outline so the round caps stay true at every size;
 * `vectorEffect` is deliberately NOT used, because the stroke is meant to scale with the mark.
 *
 * The tile uses the vivid brand orange (#fa5a15, the `brand-dark` token) rather than the
 * darker `brand` used for buttons and links. That is not an inconsistency: WCAG 1.4.11 exempts
 * logotypes from the contrast minimum, so the brand colour is correct here while text and
 * interactive elements still need the accessible #ae400c.
 */
type BrandMarkProps = {
  /** `solid` for light grounds; `inverse` (white tile, orange chevron) for dark ones. */
  variant?: 'solid' | 'inverse';
  className?: string;
};

export function BrandMark({ variant = 'solid', className = 'h-7 w-7' }: BrandMarkProps) {
  const tile = variant === 'solid' ? '#fa5a15' : '#ffffff';
  const chevron = variant === 'solid' ? '#ffffff' : '#fa5a15';

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      // Decorative: every use sits beside the REYLIX wordmark, which carries the name already.
      aria-hidden="true"
      focusable="false"
    >
      <rect width="100" height="100" rx="25" fill={tile} />
      <path
        d="M38 28 L62 50 L38 72"
        fill="none"
        stroke={chevron}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

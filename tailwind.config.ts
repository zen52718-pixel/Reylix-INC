import type { Config } from 'tailwindcss';

/**
 * Reylix design tokens — from the approved design handoff.
 *
 * The values are the handoff's own, adapted from the ScrewFast base system. Neutrals,
 * spacing, radius and shadow are taken unchanged; the brand accent is the base system's
 * orange, which the handoff marks as a PLACEHOLDER pending Reylix's real accent colour.
 * Swapping it is a one-line change here because nothing hard-codes the hex.
 *
 * Colours are OKLCH exactly as the handoff specifies, so lightness and chroma stay
 * predictable if the ramp is ever extended.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Base neutral ramp — every surface, border and text colour comes from here.
        neutral: {
          50: 'oklch(0.985 0 0)',
          100: 'oklch(0.97 0 0)',
          200: 'oklch(0.922 0 0)',
          300: 'oklch(0.87 0 0)',
          400: 'oklch(0.708 0 0)',
          500: 'oklch(0.556 0 0)',
          600: 'oklch(0.439 0 0)',
          700: 'oklch(0.371 0 0)',
          800: 'oklch(0.269 0 0)',
          900: 'oklch(0.205 0 0)',
          950: 'oklch(0.145 0 0)',
        },
        /**
         * The accent. Still a placeholder pending Reylix's real brand colour — the handoff
         * says so explicitly — but NOT the handoff's own orange-400, which fails WCAG AA
         * everywhere it is used:
         *
         *   #fa5a15 on white .......... 3.21:1  (needs 4.5)
         *   #fa5a15 on the gray band ... 2.55:1  (needs 4.5)
         *   white on #fa5a15 ........... 3.21:1  (needs 4.5 — this is the primary CTA)
         *
         * This is the lightest burnt orange in the same family that clears 4.5:1 against
         * white AND against the gray section band, so eyebrows, links and the primary
         * button all pass wherever the design puts them:
         *
         *   #ae400c on white ........... 5.93:1
         *   #ae400c on the gray band ... 4.71:1
         *
         * Swap these two values when the real brand colour exists — and check it against
         * both grounds before shipping it.
         */
        brand: {
          DEFAULT: '#ae400c',
          hover: '#8f350a',
          soft: 'oklch(0.901 0.076 70.697)',
          /**
           * The same accent for the dark sections. A single accent cannot clear 4.5:1
           * against both white and near-black — darkening it far enough for white takes it
           * to 2.96:1 on the dark band. This is the handoff's original orange, which is
           * 5.58:1 on #171717 and is used ONLY on dark grounds.
           */
          dark: '#fa5a15',
        },
        // Semantic roles. Components reference these, not the ramp.
        heading: 'oklch(0.269 0 0)',
        body: 'oklch(0.439 0 0)',
        // neutral-500 (#737373) is only 3.76:1 on the gray section band. This clears it.
        muted: '#616161',
        hairline: 'oklch(0.922 0 0)',
        surface: {
          page: 'oklch(0.922 0 0)',
          card: 'oklch(0.97 0 0)',
          dark: 'oklch(0.269 0 0)',
          darker: 'oklch(0.205 0 0)',
        },
      },
      fontFamily: {
        // The handoff declares no webfont: the system stack is the intentional choice.
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif',
        ],
        mono: ['ui-mono', 'SFMono-Regular', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
      },
      maxWidth: {
        container: '85rem',
        prose: '760px',
        measure: '640px',
        // For running body copy: a character-based cap, so it holds at any font size.
        copy: '68ch',
      },
      borderRadius: {
        sm: '0.5rem',
        DEFAULT: '0.75rem',
        md: '0.75rem',
        lg: '0.75rem',
        xl: '0.75rem',
        pill: '9999px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
      transitionTimingFunction: {
        base: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      letterSpacing: {
        heading: '-0.02em',
        label: '0.08em',
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from 'tailwindcss';

/**
 * Reylix design tokens — the Visible Record world.
 *
 * The subject is a records system: mid-century American visible-record office equipment,
 * where a card's status was read from a coloured plastic tab clipped to its edge, without
 * opening the file. That is the whole language here.
 *
 * `steel` is the cabinet the file lives in — a green-biased gray, not a neutral one, so the
 * secondary text tinted from it sits in the same hue family rather than reading as washed-out
 * gray on a colour.
 * `card` is the record stock: buff, ruled, the surface every fact is set into.
 * `signal` is the tab plastic. Five hues, and each one is a code with a fixed meaning —
 * never decoration, never an accent scattered for warmth.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        steel: {
          50: '#f2f3ee',
          100: '#e6e9e3',
          200: '#d2d7d0',
          300: '#b0b8b1',
          400: '#8b958d',
          500: '#6b756f',
          600: '#535d58',
          700: '#414a46',
          800: '#2e3836',
          900: '#232b2a',
          950: '#171c1c',
        },
        card: {
          DEFAULT: '#f4f2ec',
          shade: '#e9e5da',
          rule: '#d3cec0',
          edge: '#c2bcaa',
        },
        ink: {
          DEFAULT: '#1a1f1d',
          soft: '#4a534e',
          faint: '#5c655e',
        },
        /**
         * Tab plastic. The deep values are for a tab sitting ON card stock — saturated ink
         * carrying near-white stamped caps. The `-up` values are the same five codes lifted
         * for use ON the steel ground, where the deep versions would sink into it and fail
         * contrast. Same meaning, two grounds; never two different codes.
         */
        signal: {
          orange: '#b83f16',
          green: '#186252',
          blue: '#234f74',
          amber: '#8f6410',
          plum: '#6d2c47',
          'orange-up': '#ef8b5a',
          'green-up': '#5cbfa4',
          'blue-up': '#87b6e0',
          'amber-up': '#e3b053',
          'plum-up': '#d691ad',
        },
      },
      fontFamily: {
        // Condensed engineered gothic: tabs, captions, nav, datums, headings.
        gothic: ['var(--font-gothic)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // The face every fact is actually read in.
        sans: ['var(--font-text)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // 12px is the floor for anything functional. Nothing below it ships.
        tab: ['0.75rem', { lineHeight: '1', letterSpacing: '0.09em' }],
        datum: ['0.75rem', { lineHeight: '1.35', letterSpacing: '0.075em' }],
        fine: ['0.8125rem', { lineHeight: '1.55' }],
        body: ['1rem', { lineHeight: '1.6' }],
        lead: ['1.125rem', { lineHeight: '1.55' }],
      },
      maxWidth: {
        // 68ch sits inside the 65–75ch reading measure.
        measure: '68ch',
        field: '58ch',
      },
      letterSpacing: {
        tab: '0.09em',
        display: '-0.025em',
      },
      boxShadow: {
        // A pulled card casts a real shadow: offset plus soft blur, never a zero-offset halo.
        pull: '0 10px 24px -8px rgb(11 15 14 / 0.55), 0 2px 6px -2px rgb(11 15 14 / 0.4)',
        rest: '0 3px 10px -4px rgb(11 15 14 / 0.45)',
      },
      transitionTimingFunction: {
        // Exponential ease-out: fast departure, long settle.
        pull: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;

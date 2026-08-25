import type { Config } from 'tailwindcss';

/**
 * Reylix design tokens — PROPOSED, pending brand sign-off.
 *
 * The visual language is built around what Reylix actually does: knowing where a customer
 * came from. That means an instrument aesthetic — hairline rules, monospace labels, tabular
 * figures, a strict grid — rather than the gradient-and-rounded-card look every SaaS site
 * shares.
 *
 * `brand` is a deep, saturated blue: the convention for financial trust in US B2B.
 * `accent` is reserved for money and positive state (earned, approved, paid).
 * `ink` is the neutral, biased slightly blue so it sits with the brand rather than against it.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f5ff',
          100: '#e0eaff',
          200: '#c7d8fe',
          300: '#a3bdfc',
          400: '#7897f8',
          500: '#5372f1',
          600: '#3a4ee5',
          700: '#2f3cc9',
          800: '#2a34a2',
          900: '#151a4a',
          950: '#0d1030',
        },
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          300: '#6ee7b7',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        ink: {
          50: '#f6f7fb',
          100: '#eceef6',
          200: '#dcdfec',
          300: '#bcc2d8',
          400: '#8f97b8',
          500: '#6b7397',
          600: '#525978',
          700: '#414762',
          800: '#2b3049',
          900: '#171b30',
          950: '#0c0f1e',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'Consolas', 'monospace'],
      },
      maxWidth: {
        measure: '68ch',
      },
      letterSpacing: {
        label: '0.14em',
      },
    },
  },
  plugins: [],
};

export default config;

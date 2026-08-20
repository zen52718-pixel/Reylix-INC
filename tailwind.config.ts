import type { Config } from 'tailwindcss';

/**
 * Reylix design tokens — PROPOSED, pending brand sign-off.
 *
 * `brand` is a deep, saturated blue: the convention for financial trust in US B2B SaaS.
 * `accent` is reserved for money and positive state (earned, approved, paid) so that
 * "this is a number that matters" reads instantly without relying on colour alone.
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
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

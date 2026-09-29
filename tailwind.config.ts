import type { Config } from 'tailwindcss';

// Design language: warm bone paper, deep forest, muted sage — editorial,
// photography-forward, generous whitespace. Nothing neon, nothing glassy.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bone:   { 50: '#FAF9F5', 100: '#F4F2EA', 200: '#EDEADE', 300: '#E3DFD0' },
        paper:  '#FFFEFB',
        line:   '#DAD5C4',
        forest: { 600: '#3C5540', 700: '#2A3D2C', 800: '#1F2E21', 900: '#162118' },
        sage:   { 300: '#C3CDB4', 400: '#A4B391', 500: '#8A9A78', 600: '#6E7F5C', 700: '#556346' },
        clay:   { 500: '#B4603A', 600: '#95492A' },
        ochre:  { 500: '#C2811A' },
      },
      fontFamily: {
        sans:  ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      borderColor: { DEFAULT: '#DAD5C4' },
      letterSpacing: { wordmark: '0.08em' },
      boxShadow: {
        card: '0 1px 2px rgba(22,33,24,.04), 0 8px 24px -16px rgba(22,33,24,.18)',
      },
    },
  },
  plugins: [],
};
export default config;

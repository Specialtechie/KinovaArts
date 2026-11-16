import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-work)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-plex)', 'monospace'],
      },
      colors: {
        ink: '#211C2E',
        parchment: '#F1E8D4',
        panel: '#FBF5E7',
        indigo: { DEFAULT: '#16305C', deep: '#0D1F3B' },
        gold: '#C6952C',
        clay: '#AE5030',
        green: '#3F6B4A',
        line: '#D8C9A3',
      },
      boxShadow: {
        soft: '0 12px 32px rgba(20,15,5,0.12)',
      },
    },
  },
  plugins: [],
};

export default config;

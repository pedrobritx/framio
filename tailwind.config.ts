import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)',
        ivory: 'var(--ivory)',
        stone: 'var(--stone)',
        sand: 'var(--sand)',
        midnight: 'var(--midnight)',
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
        },
        brass: {
          DEFAULT: 'var(--brass)',
          soft: 'var(--brass-soft)',
        },
      },
      fontFamily: {
        ui: ['var(--font-ui)', 'system-ui', 'sans-serif'],
        editorial: ['var(--font-editorial)', 'Georgia', 'serif'],
      },
      letterSpacing: {
        label: '0.08em',
      },
      transitionTimingFunction: {
        // Museum pacing — deliberate ease in/out.
        gallery: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};

export default config;

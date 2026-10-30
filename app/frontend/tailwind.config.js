/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        page: 'var(--c-page)',
        card: 'var(--c-card)',
        raised: 'var(--c-raised)',
        border: 'var(--c-border)',
        'border-strong': 'var(--c-border-strong)',
        text: 'var(--c-text)',
        muted: 'var(--c-muted)',
        accent: 'var(--c-accent)',
        'accent-hover': 'var(--c-accent-hover)',
        'accent-wash': 'var(--c-accent-wash)',
        'on-accent': 'var(--c-on-accent)',
        chart: 'var(--c-chart)',
        error: 'var(--c-error)',
        success: 'var(--c-success)',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '14px',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};

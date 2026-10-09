import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-raised': 'rgb(var(--surface-raised) / <alpha-value>)',
        'surface-border': 'rgb(var(--surface-border) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        'foreground-muted': 'rgb(var(--foreground-muted) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
          hover: 'rgb(var(--accent-hover) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
        },
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        destructive: {
          DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
          foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)',
        },
        ring: 'rgb(var(--ring) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      fontSize: {
        // Large geometric display sizes for hero/section headlines.
        'display-xl': [
          'clamp(3.5rem, 9vw, 8rem)',
          { lineHeight: '0.95', letterSpacing: '-0.02em' },
        ],
        'display-lg': [
          'clamp(2.75rem, 6vw, 5.5rem)',
          { lineHeight: '0.98', letterSpacing: '-0.02em' },
        ],
        'display-md': ['clamp(2rem, 4vw, 3.5rem)', { lineHeight: '1', letterSpacing: '-0.01em' }],
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
      },
      spacing: {
        section: 'var(--space-section)',
        'section-sm': 'var(--space-section-sm)',
      },
    },
  },
  plugins: [animate],
};

export default config;

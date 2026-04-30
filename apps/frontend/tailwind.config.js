// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Unified accent color for site components
        accent: '#0284c7',

        // DraftDock Material Design 3 tokens
        "primary": "#000000",
        "on-primary": "#e2e2e2",
        "primary-container": "#3b3b3b",
        "on-primary-container": "#ffffff",
        "primary-fixed": "#5e5e5e",
        "primary-fixed-dim": "#474747",
        "on-primary-fixed": "#ffffff",
        "on-primary-fixed-variant": "#e2e2e2",

        "secondary": "#785900",
        "on-secondary": "#ffffff",
        "secondary-container": "#ffce5d",
        "on-secondary-container": "#261a00",
        "secondary-fixed": "#fabd00",
        "secondary-fixed-dim": "#d8a300",
        "on-secondary-fixed": "#261a00",
        "on-secondary-fixed-variant": "#4d3800",

        "tertiary": "#3b3b3b",
        "on-tertiary": "#e2e2e2",
        "tertiary-container": "#747474",
        "on-tertiary-container": "#ffffff",
        "tertiary-fixed": "#5e5e5e",
        "tertiary-fixed-dim": "#474747",
        "on-tertiary-fixed": "#ffffff",
        "on-tertiary-fixed-variant": "#e2e2e2",

        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#410002",

        "surface": "#f8f9fa",
        "on-surface": "#191c1d",
        "on-surface-variant": "#474747",
        "surface-variant": "#e1e3e4",
        "surface-bright": "#f8f9fa",
        "surface-dim": "#d9dadb",
        "surface-tint": "#5e5e5e",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f4f5",
        "surface-container": "#edeeef",
        "surface-container-high": "#e7e8e9",
        "surface-container-highest": "#e1e3e4",

        "background": "#f8f9fa",
        "on-background": "#191c1d",
        "outline": "#777777",
        "outline-variant": "#c6c6c6",
        "inverse-surface": "#2e3132",
        "inverse-on-surface": "#f0f1f2",
        "inverse-primary": "#c6c6c6",

        // Legacy tokens
        main: 'var(--main)',
        overlay: 'var(--overlay)',
        bg: 'var(--bg)',
        bw: 'var(--bw)',
        blank: 'var(--blank)',
        text: 'var(--text)',
        mtext: 'var(--mtext)',
        border: 'var(--border)',
        ring: 'var(--ring)',
        ringOffset: 'var(--ring-offset)',
        secondaryBlack: '#212121',
      },
      borderRadius: {
        base: '5px',
      },
      boxShadow: {
        shadow: 'var(--shadow)',
        'editorial': '0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.04)',
      },
      translate: {
        boxShadowX: '4px',
        boxShadowY: '4px',
        reverseBoxShadowX: '-4px',
        reverseBoxShadowY: '-4px',
      },
      fontWeight: {
        base: '500',
        heading: '700',
      },
      fontFamily: {
        playfair: ['"Playfair Display"', 'serif'],
        "headline": ["Space Grotesk", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}
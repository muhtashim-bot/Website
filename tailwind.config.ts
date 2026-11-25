import type { Config } from 'tailwindcss';

// iFarmer brand tokens, read from the live ifarmer.asia computed styles (Nov 2026).
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: { DEFAULT: '1.25rem', md: '2rem' }, screens: { '2xl': '1240px' } },
    extend: {
      colors: {
        leaf: { DEFAULT: '#88BB41', 50: '#F5F9EC', 100: '#E8F2D6', 200: '#CFE4AA', 600: '#6FA02C', 700: '#5E852B' },
        field: { DEFAULT: '#038F2F', 700: '#02722A', 900: '#04451C' },
        lime: { DEFAULT: '#DDFF80', soft: '#EEFFC2' },
        cream: { DEFAULT: '#FFF5D9', deep: '#F7E7B8' },
        mint: '#F5F9EC',
        teal: { DEFAULT: '#022B36', 800: '#0A3A45', 700: '#124A55' },
        ink: { DEFAULT: '#1B2A1F', soft: '#4A5A4E', mute: '#6B786E' },
        paddy: '#E9B949',
      },
      fontFamily: {
        sans: ['Quicksand', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['clamp(2.6rem, 5.6vw, 5.2rem)', { lineHeight: '1.02', letterSpacing: '-0.035em' }],
        'h1': ['clamp(2.2rem, 4.2vw, 3.6rem)', { lineHeight: '1.06', letterSpacing: '-0.03em' }],
        'h2': ['clamp(1.8rem, 3vw, 2.6rem)', { lineHeight: '1.12', letterSpacing: '-0.025em' }],
        'h3': ['1.35rem', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        'lead': ['1.2rem', { lineHeight: '1.6' }],
      },
      borderRadius: { blob: '2.25rem' },
      maxWidth: { prose: '66ch' },
    },
  },
  plugins: [],
};

export default config;

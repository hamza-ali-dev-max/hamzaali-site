// Tailwind settings: brand colours, fonts and the dark mode switch.
// Colours that change between light and dark mode are CSS variables set in src/styles.css.
const path = require('node:path');

module.exports = {
  content: [path.join(__dirname, 'dist', 'index.html'), path.join(__dirname, 'src', '*.js')],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Nunito Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'Arial', 'sans-serif'],
        display: ['Poppins', '"Nunito Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        page: 'var(--page)',
        tint: 'var(--tint)',
        mint: 'var(--mint)',
        card: 'var(--card)',
        ink: 'var(--ink)',
        body: 'var(--body)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        chip: 'var(--chip)',
        pill: 'var(--pill)',
        'pill-ink': 'var(--pill-ink)',
        link: 'var(--link)',
        sky: { DEFAULT: '#1570EF', bright: '#2E9BFF', deep: '#0B4FB8' },
        leaf: { DEFAULT: '#22A447', deep: '#15803D' },
        sun: '#FFC93C',
        whatsapp: '#25D366',
        night: '#081226',
      },
      borderRadius: { card: '28px' },
      boxShadow: {
        card: '0 1px 2px rgba(8,18,38,.06), 0 12px 32px -12px rgba(8,18,38,.18)',
        float: '0 2px 4px rgba(8,18,38,.08), 0 24px 48px -16px rgba(8,18,38,.35)',
        pill: '0 2px 6px rgba(8,18,38,.10), 0 14px 34px -14px rgba(8,18,38,.35)',
      },
    },
  },
};

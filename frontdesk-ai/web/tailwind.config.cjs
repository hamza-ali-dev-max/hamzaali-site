// Tailwind settings: colours, font and the dark mode switch.
// Colours that change between light and dark are CSS variables set in src/styles.css.
const path = require('node:path');

module.exports = {
  content: [path.join(__dirname, 'dist', 'index.html'), path.join(__dirname, 'src', '*.js')],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'Arial', 'sans-serif'],
      },
      colors: {
        bg: 'var(--bg)',
        soft: 'var(--soft)',
        card: 'var(--card)',
        ink: 'var(--ink)',
        body: 'var(--body)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        brand: 'var(--brand)',
        'on-brand': 'var(--on-brand)',
        coral: 'var(--coral)',
      },
    },
  },
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          light: 'var(--primary-light)',
          dark: 'var(--primary-dark)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          hover: 'var(--secondary-hover)',
          light: 'var(--secondary-light)',
          dark: 'var(--secondary-dark)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          light: 'var(--accent-light)',
          dark: 'var(--accent-dark)',
        },
        pico: {
          purple: 'var(--pico-purple)',
          'purple-light': 'var(--pico-purple-light)',
          'purple-dark': 'var(--pico-purple-dark)',
        },
      },
    },
  },
  plugins: [],
}

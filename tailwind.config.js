/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        paper: 'hsl(var(--paper))',
        foreground: 'hsl(var(--foreground))',
        muted: 'hsl(var(--muted))',
        accent: 'hsl(var(--accent))',
        ink: 'hsl(var(--ink))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out forwards',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate')
  ],
}
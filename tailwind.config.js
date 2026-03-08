/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Cortex brand
        lime:   { DEFAULT: '#c8f560', dark: '#a8d445' },
        indigo: { DEFAULT: '#5c6bff', light: '#8b99ff' },
        pink:   '#ff8fab',
        amber:  '#f5a623',
        rose:   '#ff5c5c',
        violet: '#a78bfa',

        // Dark theme surfaces
        dark: {
          bg:       '#0d0e10',
          bg2:      '#0a0b0d',
          surface:  '#141618',
          surface2: '#1a1d21',
          surface3: '#21252b',
          border:   '#272b33',
          border2:  '#333840',
        },

        // Light theme surfaces
        light: {
          bg:       '#f2f3f7',
          bg2:      '#e8eaf0',
          surface:  '#ffffff',
          surface2: '#f0f1f5',
          surface3: '#e4e6ed',
          border:   '#dde0e9',
          border2:  '#c8ccd8',
        },
      },

      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body:    ['DM Sans', 'system-ui', 'sans-serif'],
      },

      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
      },

      boxShadow: {
        card:  '0 2px 10px rgba(0,0,0,0.3)',
        panel: '0 8px 32px rgba(0,0,0,0.5)',
      },

      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { transform: 'scale(1)',   opacity: '1' },
          '50%':      { transform: 'scale(1.4)', opacity: '0.7' },
        },
      },

      animation: {
        'fade-up': 'fadeUp 0.22s ease both',
        'pulse-dot': 'pulse 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

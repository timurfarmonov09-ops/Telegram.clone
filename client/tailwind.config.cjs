/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        telegram: {
          blue: '#0088cc',
          'blue-dark': '#0077b6',
          dark: '#17212b',
          darker: '#0e1621',
          gray: '#2b5278',
          'gray-light': '#8b9dc3',
          light: '#f4f4f5',
          'light-gray': '#f8f9fa',
          border: '#e1e5e9',
          'border-dark': '#182533'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'telegram': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'telegram-dark': '0 2px 8px rgba(0, 0, 0, 0.3)'
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' }
        }
      }
    },
  },
  plugins: [],
}
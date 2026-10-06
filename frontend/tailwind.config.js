/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f1f8ed', 100: '#dcefd2', 200: '#bce0a8', 300: '#94cb78', 400: '#6db44e',
          500: '#4f9a35', 600: '#3e7c2a', 700: '#326224', 800: '#2b4f21', 900: '#24421d',
        },
        earth: {
          50: '#faf6f1', 100: '#f1e8dc', 200: '#e2d0b8', 300: '#cfb08a', 400: '#bb9061',
          500: '#a97847', 600: '#8f6139', 700: '#744b30',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'sans-serif'],
      },
      boxShadow: { soft: '0 4px 20px rgba(36, 66, 29, 0.08)' },
    },
  },
  plugins: [],
};

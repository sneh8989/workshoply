/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#14213D',
          hover: '#0E172B',
          light: '#1F3158',
        },
        secondary: {
          DEFAULT: '#F97316',
          hover: '#EA580C',
          light: '#FFEDD5',
        },
        background: '#FAF7F2',
        surface: '#FFFFFF',
        accent: {
          DEFAULT: '#14B8A6',
          hover: '#0D9488',
          light: '#CCFBF1',
        },
        main: '#202124',
        muted: '#64748B',
        success: {
          DEFAULT: '#16A34A',
          light: '#DCFCE7',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
        },
        border: '#E7E5E4',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card': '0 4px 6px -1px rgba(20, 33, 61, 0.06), 0 2px 4px -2px rgba(20, 33, 61, 0.04)',
        'card-hover': '0 12px 20px -3px rgba(20, 33, 61, 0.1), 0 4px 6px -4px rgba(20, 33, 61, 0.05)',
        'modal': '0 20px 25px -5px rgba(20, 33, 61, 0.15), 0 8px 10px -6px rgba(20, 33, 61, 0.1)',
      }
    },
  },
  plugins: [],
}

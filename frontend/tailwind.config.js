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
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        page: '#F8FAFC',
        card: '#FFFFFF',
        textPrimary: '#1E293B',
        textSecondary: '#64748B',
        borderColor: '#E2E8F0',
      }
    },
  },
  plugins: [],
}

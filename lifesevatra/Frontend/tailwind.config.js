/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#13ec13",
        "primary-dark": "#0fa80f",
        "background-light": "#f8fafc",
        "background-dark": "#102210",
        "surface-dark": "#162916",
        "surface-darker": "#0a160a",
        "input-dark": "#142614",
        "danger": "#ef4444",
        "warning": "#f59e0b",
      },
      fontFamily: {
        "display": ["Manrope", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.75rem",
        "lg": "1rem",
        "xl": "1.5rem",
        "full": "9999px"
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}


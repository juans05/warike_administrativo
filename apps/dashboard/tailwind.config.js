/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "rgb(var(--primary-rgb) / <alpha-value>)",
          light: "var(--primary-light)",
          hover: "rgb(var(--primary-hover-rgb) / <alpha-value>)",
          soft: "rgb(var(--primary-rgb) / 0.1)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary-rgb) / <alpha-value>)",
        },
        success: "rgb(var(--success-rgb) / <alpha-value>)",
        danger: "rgb(var(--danger-rgb) / <alpha-value>)",
        accent: {
          DEFAULT: "var(--accent)",
        },
        background: "var(--background)",
        surface: "var(--surface)",
        text: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
        },
        border: "var(--border)",
      },
      borderRadius: {
        card: "12px",
        control: "10px",
      },
      boxShadow: {
        card: "0 1px 2px rgb(45 36 36 / 0.04), 0 1px 3px rgb(45 36 36 / 0.06)",
        modal: "0 12px 32px rgb(45 36 36 / 0.16)",
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-lora)', 'Georgia', 'serif'],
        accent: ['var(--font-caveat)', 'cursive'],
        warike: ['var(--font-lora)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

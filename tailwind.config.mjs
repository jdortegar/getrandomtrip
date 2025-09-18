/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        fraunces: ['Fraunces', 'serif'],
        jost: ['Jost', 'sans-serif'],
        caveat: ['Caveat', 'cursive'],
        display: ['Caveat', 'cursive'], // Add display alias
        heading: ['Jost', 'sans-serif'], // Add heading alias
        body: ['Jost', 'sans-serif'], // Add body alias
      },
    },
  },
  plugins: [],
};

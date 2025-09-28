/** @type {import('tailwindcss').Config} */
export default {
  // Use relative paths from the config file's location.
  // This is the standard and most reliable method for ES Modules.
  content: [
    '/frontend/index.html',
    '/frontend/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}


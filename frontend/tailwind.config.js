import { join } from 'path'

/** @type {import('tailwindcss').Config} */
export default {
  // Use join from Node's path module to create absolute paths.
  // This is more reliable in different build environments.
  content: [
    join(__dirname, 'index.html'),
    join(__dirname, 'src/**/*.{js,ts,jsx,tsx}')
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}


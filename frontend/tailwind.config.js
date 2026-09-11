/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        // Paleta corporativa tomada del logo de Prevenseg (rojo + gris oscuro)
        primary: {
          50: '#fbecec',
          100: '#f3d0d0',
          500: '#a01f27',
          600: '#8a1a21',
          700: '#6e151b'
        },
        accent: '#3d3d3d'
      }
    }
  },
  plugins: []
};

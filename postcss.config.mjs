// Tailwind v4 ships its PostCSS plugin as a separate package and handles
// autoprefixing internally (Lightning CSS), so `autoprefixer` is dropped.
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;

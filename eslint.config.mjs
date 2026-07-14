// ESLint 9 flat config (Next 16 removed `next lint`; we run the ESLint CLI).
// eslint-config-next already registers the jsx-a11y plugin, so we can't add its
// flat config again (that redefines the plugin). Instead we layer the full
// jsx-a11y/recommended *rules* on top — preserving the a11y guarantees the old
// .eslintrc.json (next/core-web-vitals + plugin:jsx-a11y/recommended) provided.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import jsxA11y from 'eslint-plugin-jsx-a11y';

const config = [
  {
    ignores: [
      '.next/**',
      'out/**',
      'node_modules/**',
      'public/icons/**',
      'next-env.d.ts',
    ],
  },
  ...nextCoreWebVitals,
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs}'],
    rules: { ...jsxA11y.flatConfigs.recommended.rules },
  },
  {
    // Next 16's bundled react-hooks plugin adds two React-Compiler-era rules
    // that flag pre-existing, intentional patterns: mount-time setState for
    // SSR-safe hydration (theme/frame-size/store read from localStorage after
    // mount) and CropStage reading a measured ref during render. These work as
    // written; reworking them for the React Compiler is a separate, behaviour-
    // sensitive pass, so they're warnings (visible, non-blocking) not errors.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
];

export default config;

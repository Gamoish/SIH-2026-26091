import next from 'eslint-config-next';

export default [
  {
    ignores: [
      // any Next build dir, including the e2e one (NEXT_DIST_DIR=.next-e2e)
      '.next*/**',
      'node_modules/**',
      'next-env.d.ts',
      'test-results/**',
      'playwright-report/**',
    ],
  },
  ...next,
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'react-hooks/set-state-in-effect': 'warn',
      '@next/next/no-page-custom-font': 'off',
    },
  },
  {
    files: ['tests/**', 'scripts/**'],
    rules: { 'no-console': 'off' },
  },
  {
    files: ['eslint.config.mjs'],
    rules: { 'import/no-anonymous-default-export': 'off' },
  },
];

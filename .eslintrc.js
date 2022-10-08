module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: ['prettier', 'tap', '@typescript-eslint'],
  extends: ['prettier', 'plugin:@typescript-eslint/recommended'],
  rules: {
    'prettier/prettier': ['error'],
    '@typescript-eslint/indent': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-empty-function': 'off',

    // Tap
    'tap/no-identical-title': 'error',
    'tap/no-ignored-test-files': 'error',
    'tap/no-only-test': 'error',
    'tap/no-skip-test': 'error',
    'tap/no-statement-after-end': 'error',
    'tap/test-ended': 'error',
    'tap/use-t-well': 'error',
    'tap/use-t': 'error',
  },
};

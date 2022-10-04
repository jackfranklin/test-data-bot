module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: ['prettier', 'mocha', '@typescript-eslint'],
  extends: ['prettier', 'plugin:@typescript-eslint/recommended'],
  rules: {
    'prettier/prettier': ['error'],
    '@typescript-eslint/indent': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-empty-function': 'off',

    'mocha/no-skipped-tests': 'error',
    'mocha/no-exclusive-tests': 'error',
  },
};

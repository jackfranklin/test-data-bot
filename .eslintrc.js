module.exports = {
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: ['prettier', 'jest', '@typescript-eslint'],
  extends: ['prettier', 'plugin:@typescript-eslint/recommended'],
  rules: {
    'prettier/prettier': ['error'],
    '@typescript-eslint/indent': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-empty-function': 'off',

    // rules from eslint-plugin-jest
    'jest/no-disabled-tests': 'error',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/no-test-prefixes': 'error',
    'jest/valid-expect': 'error',
  },
};

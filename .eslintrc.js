module.exports = {
  env: {
    es6: true,
    node: true,
    jest: true
  },
  parserOptions: { ecmaVersion: 2018 },
  plugins: ["prettier", "jest"],
  extends: ["unobtrusive", "prettier"],
  rules: {
    "prettier/prettier": ["error"],

    // generic rules
    "no-unused-vars": "error",

    // rules from eslint-plugin-jest
    "jest/no-disabled-tests": "error",
    "jest/no-focused-tests": "error",
    "jest/no-identical-title": "error",
    "jest/no-test-prefixes": "error",
    "jest/valid-expect": "error"
  }
};

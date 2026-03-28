const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const localRulesPlugin = require("eslint-plugin-local-rules");

module.exports = [
  {
    files: ["src/locators/apps/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "local-rules": localRulesPlugin,
    },
    rules: {
      "local-rules/locator-getByRole-warn": "warn",
      "local-rules/locator-strategies-error": "error",
    },
  },
];

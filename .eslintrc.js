module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'local-rules'],
  overrides: [
    {
      files: ['src/locators/apps/**/*.ts'],
      rules: {
        'local-rules/locator-strategy-convention': 'error',
      },
    },
  ],
  // Adjust getByRole to warning
  settings: {
    'local-rules/locator-strategy-convention': {
      // In a real plugin we would use meta to distinguish, 
      // here we will just adjust the rule severity logic in the rule if needed, 
      // or simply rely on the 'warn' vs 'error' level in the config.
    }
  }
};

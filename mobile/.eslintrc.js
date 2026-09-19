/**
 * ESLint configuration for the mobile app.
 * Uses React Native community config + TypeScript support.
 */
module.exports = {
  root: true,
  extends: ['@react-native'],
  rules: {
    // Additional project-specific rules
    'react-hooks/exhaustive-deps': 'warn',
    // Allow default exports for screen components
    'import/no-anonymous-default-export': 'off',
  },
};

/**
 * Babel configuration for bare React Native CLI project.
 * Uses Metro bundler with the standard React Native preset.
 * Path alias `@/*` → `src/*` enabled via babel-plugin-module-resolver.
 */
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
        },
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      },
    ],
  ],
};
const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration for bare React Native CLI.
 * Add any overrides or plugins here.
 */
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

// With unstable_enablePackageExports on, Metro picks tslib's "import"
// condition (an ESM build) even for require() calls, which leaves helpers
// like __extends undefined at runtime on Hermes — a known Metro/tslib
// interaction (amazon-cognito-identity-js is a CJS consumer of tslib).
// Forcing tslib to its CommonJS entry point sidesteps that without having to
// disable package-exports resolution for everything else.
const tslibCjsPath = path.resolve(workspaceRoot, 'node_modules/tslib/tslib.js');

const config = {
  resolver: {
    extraNodeModules: {
      'react-native': path.resolve(workspaceRoot, 'node_modules/react-native'),
      '@react-native': path.resolve(workspaceRoot, 'node_modules/@react-native'),
    },
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    unstable_enablePackageExports: true,
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'tslib') {
        return { type: 'sourceFile', filePath: tslibCjsPath };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
  watchFolders: [workspaceRoot],
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);

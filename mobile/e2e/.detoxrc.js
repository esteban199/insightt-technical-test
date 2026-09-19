module.exports = {
  testEnvironment: './tests/e2e/environment',

  specs: './e2e/**/*.test.ts',

  configurations: {
    'ios.sim.debug': {
      type: 'ios.simulator',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/InsighttTasks.app',
      build:
        'xcodebuild -workspace ios/InsighttTasks.xcworkspace -scheme InsighttTasks -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
      startupTimeout: 120000,
    },

    'android.emu.debug': {
      type: 'android.emulator',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build:
        'cd android && ./gradlew assembleDebug assembleAndroidTest && cd ..',
      startupTimeout: 180000,
    },
  },
};

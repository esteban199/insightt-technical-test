import { Platform } from 'react-native';

// The Android emulator doesn't share the host's network namespace, so
// "localhost" resolves to the emulator itself rather than the Mac running the
// backend — 10.0.2.2 is Android's alias for the host loopback. iOS Simulator
// shares the host network stack, so localhost works there as-is.
// On a physical device, swap this for your machine's LAN IP instead.
export const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:4000',
  default: 'http://localhost:4000',
});

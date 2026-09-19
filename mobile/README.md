# Insightt Task List — Mobile App

A React Native mobile app for managing tasks (list, create, edit, delete, mark done). Built with bare React Native CLI workflow.

## Prerequisites

- **Node.js** >= 18
- **macOS** (for iOS development)
- **Xcode** (latest stable) with a simulator or physical device
- **Android Studio** / Android SDK (for Android development)
- **Java 17+** (for Android)

## Setup

The native `ios/` and `android/` projects are committed to this repo (bare React Native CLI), so no scaffold-generation step is required.

### 1. Install dependencies

From the repo root (npm workspaces install both `backend` and `mobile`):

```bash
npm install
```

### 2. Install iOS pods (macOS only)

```bash
cd mobile/ios && pod install && cd ../..
```

### 3. Set the API base URL

The app connects to a backend at the URL configured in `src/config/env.ts`. It already auto-selects the right host per platform:

- **iOS Simulator** → `http://localhost:4000` (shares the host's network stack)
- **Android Emulator** → `http://10.0.2.2:4000` (Android's alias for the host loopback — `localhost` on the emulator refers to the emulator itself, not your Mac)

For a **physical device** (either platform), replace the URL with your machine's LAN IP:

1. Find your LAN IP: `ifconfig | grep "inet " | grep 192.168.x.x`
2. Edit `src/config/env.ts` and set the URL to `http://<YOUR_LAN_IP>:4000`

### 4. Set the Cognito App Client

Authentication goes straight from this app to AWS Cognito (the backend never sees passwords). Edit `src/config/cognito.ts` and fill in the User Pool ID and App Client ID from the pool you created — see the root `README.md` for the console steps.

### 5. Run the app

```bash
# Metro bundler (run in its own terminal, keep it running)
npm start

# iOS Simulator
npm run ios

# Android Emulator
npm run android
```

## Authentication

Sign-up, sign-in, and email confirmation go directly from the app to AWS Cognito via `amazon-cognito-identity-js` (see `src/auth/cognito.ts`) — the backend is never involved in that part. Once Cognito hands back an ID token, it's attached as a Bearer token on every backend request. Session persistence and token refresh are handled by the Cognito SDK's own storage, backed by AsyncStorage.

Registering a new user requires confirming a 6-digit code emailed by Cognito before you can log in — that's the `ConfirmRegistrationScreen`.

## Backend API

The app expects a REST + GraphQL API running at the base URL from `src/config/env.ts`:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tasks` | List tasks — optional query: `?status=PENDING` |
| GET | `/api/tasks/:id` | Get single task |
| POST | `/api/tasks` | Create task — body: `{ title, description?, status? }` |
| PATCH | `/api/tasks/:id` | Update task — body: `{ title?, description?, status? }` |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/graphql` | `markTaskDone(id)` mutation — the only way to mark a task done |

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Metro bundler |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS |
| `npm test` | Run Jest tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type check |

## Testing

Unit tests use **Jest** with `@testing-library/react-native`.

```bash
npm test
```

Sample test files live in `tests/components/`.

## E2E Testing (Detox)

Detox config is in `e2e/.detoxrc.js`. To run e2e tests:

```bash
npm run detox:build:ios
npm run detox:test:ios
```

## Project Structure

```
mobile/
├── src/
│   ├── api/           # Axios client + API endpoint modules (client.ts, tasks.api.ts)
│   ├── auth/          # Cognito SDK wrapper (signUp, signIn, session restore)
│   ├── components/    # Reusable UI components
│   ├── config/       # App configuration (env vars, Cognito pool)
│   ├── context/      # React context (AuthContext)
│   ├── hooks/        # Custom hooks (useAuth, useTasks, useTask)
│   ├── navigation/   # React Navigation navigators
│   ├── screens/      # Screen components
│   ├── theme/        # React Native Paper theme
│   └── types/        # TypeScript type definitions
├── e2e/              # Detox e2e tests
├── tests/            # Jest unit tests
├── ios/              # Native iOS project (Xcode/CocoaPods)
├── android/          # Native Android project (Gradle)
├── App.tsx           # Root component
├── index.js          # App entry point
└── README.md
```

## Screens

- **LoginScreen** — Email + password login against Cognito, with RHF + Zod validation
- **RegisterScreen** — Name + email + password sign-up against Cognito
- **ConfirmRegistrationScreen** — Enter the email verification code Cognito sends after sign-up (with resend)
- **TaskListScreen** — FlatList of tasks with status filter chips, FAB for creation, swipe-to-delete
- **TaskFormScreen** — Create or edit a task

## Screenshots

<!-- Add screenshots here after running the app -->

## Issues Fixed During Development

The app was originally built and tested on iOS only. Bringing Android to parity surfaced a few platform-specific issues, documented here for transparency:

1. **Native crash on launch (`libhermes_executor.so` / `libjscexecutor.so` not found).**
   React Native 0.76+ merged its native libraries into a single `libreactnative.so`. `MainApplication.kt` must initialize `SoLoader` with the merged mapping (`SoLoader.init(this, OpenSourceMergedSoMapping)`); without it, the native libraries fail to resolve and the app crashes before JS ever loads. Fixed in `android/app/src/main/java/com/insightttasks/MainApplication.kt`.
2. **"Network error" on login (Android emulator only).**
   `localhost` inside the Android emulator refers to the emulator itself, not the host machine running the backend. Fixed by making `src/config/env.ts` platform-aware: Android uses `10.0.2.2` (the documented alias for the host loopback), other platforms keep `localhost`.
3. **Vector icons not rendering on Android.**
   `react-native-vector-icons` needs its `.ttf` font files copied into `android/app/src/main/assets/fonts/`. iOS gets these via `Info.plist` + the CocoaPods resource bundle, but Android has no equivalent auto-linking step. Fixed by running `npx react-native-asset` to copy the fonts into place.

## Known Limitations

- No offline mode — all data is fetched from the API
- No push notifications
- No image picker for task attachments
- Android swipe-to-delete uses react-native-gesture-handler Swipeable; behavior may vary across Android versions
- Cognito ID tokens expire after 1 hour. They're refreshed automatically on app restart (`restoreSession()` calls `getSession()`, which refreshes if needed), but not proactively in the background — a session left open for over an hour will need a re-login on the next request that 401s.

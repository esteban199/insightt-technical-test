# Architecture & Design Decisions

Notes on the choices made while building this, mostly around places where I deviated from the spec and why.

## Auth: AWS Cognito, not a self-issued JWT

First pass at this used `jsonwebtoken` + `bcrypt` — simpler to stand up, zero external accounts. Went back and switched to Cognito User Pools once it was clear the spec treats it as a hard requirement, not a suggestion ("Preferred" only decides Cognito vs. Auth0, not whether to use a provider at all).

The shift changes where identity lives: Cognito issues and owns the tokens, the mobile app talks to it directly for sign-up/sign-in (`amazon-cognito-identity-js`), and the backend's only job is verifying the ID token on each request (`aws-jwt-verify`, checking signature + issuer + audience against the pool's JWKS). There's no `User` collection anymore — a task's `ownerId` is just the Cognito `sub`, since Cognito is now the single source of truth for who a user is. That also means new users have to confirm a code emailed by Cognito before they can log in, which is why there's a `ConfirmRegistrationScreen` in the mobile app now.

Trade-off worth calling out: the backend integration tests mock the Cognito verifier (`config/cognito.ts`) instead of hitting a real user pool, so they stay fast and don't need network access or a test AWS account. They still exercise the real REST/GraphQL handlers, services, and MongoDB — only the "is this signature valid" step is stubbed.

## Mark-as-done: GraphQL resolver, not REST

The spec calls this out twice — once as one of the three CRUD verbs, once as its own numbered requirement — that marking a task done specifically has to go through a Cloud Function, a GraphQL resolver, or a separate web service, not just another REST route.

Went with a GraphQL resolver: added Apollo Server on top of the existing Express app, mounted at `/graphql`, with exactly one mutation (`markTaskDone`). Everything else — list/create/edit/delete — stays plain REST, which the spec's communication requirement (point 4) explicitly allows since it only asks for *one* of GraphQL/REST/RPC as the general strategy, and separately carves out mark-as-done as needing its own mechanism. A dedicated Lambda or a second HTTP service would satisfy the letter of the requirement too, but would mean standing up and mocking out real cloud infra just to keep the test suite runnable — a resolver gets the same isolation (own module: `services/markAsDone.service.ts`, own schema, own error mapping) without that cost.

The atomicity guarantee didn't change: it's still a single `findOneAndUpdate` filtered on `status != DONE`, so under concurrent requests exactly one caller gets `DONE` back and the rest get a `409 ALREADY_DONE` GraphQL error. The integration test fires two mutations at once and checks exactly that.

## Database: MongoDB Atlas free tier

Spec didn't specify a database. Went with Atlas M0 — no local Mongo install, connection string works from anywhere, and Mongoose gives schema validation without much boilerplate. The document model also maps onto a task pretty directly.

Would move to a dedicated cluster (M10+) for anything real.

## Mobile: bare React Native CLI, not Expo

Went with bare RN CLI per the preference in the brief — full control over the native iOS/Android projects, no reliance on Expo Go, and if a native module were ever needed there's nothing in the way. Trade-off is the usual one: slower initial setup, no OTA updates, and you need Xcode/Android Studio to actually run it, which is why both `ios/` and `android/` are committed to the repo rather than regenerated on install.

If OTA updates ever mattered I'd look at Expo's prebuild + EAS Update, which lets you keep the bare-CLI native code while getting OTA back.

## UI library: React Native Paper

The spec's suggested UI libraries (MUI, Bootstrap, Ant Design) are all web-first. MUI and Bootstrap don't have RN builds at all; Ant Design's mobile variant exists but the component set is thinner than the others. React Native Paper is the standard Material Design 3 implementation for RN — actively maintained, typed, decent theming/dark-mode support out of the box. `react-native-elements` was the other option I looked at, but Paper's MD3 support felt more current.

## Getting Android to parity with iOS

The app was built and tested on iOS first, then brought up on Android — that surfaced three platform-specific bugs, all fixed in this repo:

- **Native crash on launch.** RN 0.76+ merges native libraries into a single `libreactnative.so` and needs `SoLoader.init(this, OpenSourceMergedSoMapping)` in `MainApplication.kt` to resolve it. That call was missing, so the app crashed before JS even loaded.
- **Login failing with a network error.** The Android emulator doesn't share the host's network namespace, so `localhost` inside the emulator points at the emulator itself, not the machine running the backend. `src/config/env.ts` now picks `10.0.2.2` on Android and `localhost` everywhere else.
- **Icons not rendering.** iOS picks up vector-icon fonts automatically through the CocoaPods resource bundle; Android needs the `.ttf` files copied into `android/app/src/main/assets/fonts/` manually (`npx react-native-asset` handles this).

Full technical detail is in `mobile/README.md`. Both native projects are committed to the repo specifically so these fixes ship with the code instead of getting lost if someone regenerates the native folders from scratch.

## `ARCHIVED` has no dedicated button in the UI

The backend's state machine (`STATUS_TRANSITIONS` in `task.service.ts`) supports the full chain — PENDING → IN_PROGRESS → DONE → ARCHIVED — and it's covered by tests, including rejecting invalid jumps. What's missing is a UI action that triggers the last step; the app currently only exposes create, edit, mark-done, delete, and filter-by-status.

Re-reading the spec, it asks the state machine to support the transition, not that the UI expose a button for it, so I left it out of scope given the time available. Adding it later is trivial — a swipe action or menu item on a DONE task calling the existing `PATCH /api/tasks/:id` with `{ status: 'ARCHIVED' }`, no backend changes required.

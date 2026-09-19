# Insightt Task List

A full-stack mobile task management application built with React Native (bare CLI), Express.js, MongoDB Atlas, and AWS Cognito authentication.

## Stack Overview

| Layer         | Technology                        |
|---------------|-----------------------------------|
| Frontend      | React Native bare CLI + React Paper |
| Backend       | Express.js (Node.js)              |
| Database      | MongoDB Atlas (M0 free tier)      |
| Auth          | AWS Cognito User Pool             |
| Communication | REST (Axios) + one GraphQL mutation for mark-as-done |
| Tests         | Jest (unit + integration)          |

## Architecture

```
                 sign up / sign in
[Mobile App] ───────────────────────► [AWS Cognito User Pool]
     |                                          |
     | REST + GraphQL, Cognito ID token Bearer  | issues/verifies ID tokens
     v                                          |
[Express.js API] --- [Logger Middleware] ◄──────┘
     |          \
     | Mongoose  \ GraphQL resolver (markTaskDone)
     v            v
[MongoDB Atlas]  [Apollo Server]
```

## Repo Structure

```
.
├── package.json          # npm workspaces root
├── .gitignore
├── README.md
├── DECISIONS.md
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── server.ts              # Express + Apollo app entry
│   │   ├── config/                # env.ts, db.ts, cognito.ts (JWT verifier)
│   │   ├── middleware/             # auth.ts, logger.ts, validate.ts, error.ts
│   │   ├── models/                # Task.ts
│   │   ├── controllers/           # task.controller.ts
│   │   ├── routes/                # task.routes.ts
│   │   ├── services/              # task.service.ts, markAsDone.service.ts
│   │   ├── graphql/               # schema.ts, resolvers.ts, context.ts
│   │   ├── validators/            # task.validator.ts (Zod)
│   │   └── utils/                 # AppError.ts, asyncHandler.ts
│   └── tests/
│       ├── unit/task.service.test.ts
│       └── integration/markAsDone.test.ts
└── mobile/                        # React Native bare CLI (iOS + Android)
    ├── package.json
    ├── App.tsx
    ├── ios/                        # Native iOS project (committed)
    ├── android/                    # Native Android project (committed)
    ├── e2e/                        # Detox e2e tests
    ├── tests/                      # Jest component tests
    └── src/
        ├── api/                    # Axios client + endpoint modules
        ├── auth/                   # Cognito SDK wrapper
        ├── context/                # AuthContext
        ├── hooks/                  # useAuth, useTasks, useTask
        ├── navigation/             # React Navigation stacks
        ├── screens/                # LoginScreen, ConfirmRegistrationScreen, TaskListScreen, ...
        └── components/             # StatusChip, TaskItem, ...
```

## Prerequisites

- Node.js 18+
- npm 9+
- Xcode (iOS) or Android Studio (Android)
- JDK 17+
- CocoaPods (iOS only)
- MongoDB Atlas account (M0 free tier)
- AWS account (for Cognito — free tier covers this comfortably)

## Setup Steps

1. **Clone the repo**
   ```bash
   git clone <repo-url>
   cd insightt-technical-test
   ```

2. **Create a Cognito User Pool** (AWS Console → Cognito → Create user pool)
   - Sign-in method: Email
   - Password policy: minimum length 8 (relax the other requirements to keep it simple)
   - MFA: off
   - App client: **Public client**, no client secret
   - After creation, note down the **User Pool ID**, **App client ID**, and **Region**

3. **Install workspace dependencies**
   ```bash
   npm install
   ```
   This installs packages for both `backend` and `mobile` workspaces via npm workspaces. (The native `ios/` and `android/` projects are already committed — no scaffold-generation step needed.)

4. **Install iOS pods** (macOS only, required before running on iOS)
   ```bash
   cd mobile/ios && pod install && cd ../..
   ```

5. **Configure backend environment**
   ```bash
   cp backend/.env.example backend/.env
   ```
   Then open `backend/.env` and fill in:
   - `MONGO_URI` — your MongoDB Atlas connection string (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/tasklist?retryWrites=true&w=majority`)
   - `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `COGNITO_REGION` — from step 2

6. **Configure the mobile app's Cognito client**
   Edit `mobile/src/config/cognito.ts` and fill in the same User Pool ID and App Client ID from step 2 (these are public client identifiers, not secrets — safe to embed in the app).

7. **Mobile API base URL (already configured)**
   `mobile/src/config/env.ts` auto-selects the right backend host per platform (`10.0.2.2` for the Android emulator, `localhost` for iOS). For a physical device, replace it with your machine's LAN IP — see `mobile/README.md`.

8. **Run the backend**
   ```bash
   npm run dev:backend
   ```
   Server starts on `http://localhost:4000` (GraphQL at `/graphql`).

9. **Run the mobile app**
   ```bash
   npm run dev:mobile                   # Metro bundler (keep running in its own terminal)
   npm run ios --workspace mobile       # iOS simulator
   npm run android --workspace mobile   # Android emulator
   ```

## Features Delivered

| # | Feature                                              | Status |
|---|-------------------------------------------------------|--------|
| 1 | User registration via AWS Cognito (+ email confirmation) | Done |
| 2 | Login via AWS Cognito, ID token verified on every request | Done |
| 3 | Create a task (title + description)                   | Done |
| 4 | View task list (owner-scoped)                          | Done |
| 5 | Edit task (title + description)                        | Done |
| 6 | Delete task                                            | Done |
| 7 | Mark task as DONE via a GraphQL resolver (atomic, isolated service) | Done |
| 8 | Reject mark-as-DONE on already-DONE tasks (409)        | Done   |
| 9 | Concurrent mark-as-DONE requests handled safely        | Done   |
|10 | State machine: PENDING → IN_PROGRESS → DONE → ARCHIVED | Done   |
|11 | Edit-lock on DONE tasks (title only, no desc/status)   | Done   |
|12 | Filter tasks by status                                 | Done   |
|13 | Request logging middleware (timestamp + actor + I/O)   | Done   |
|14 | Cognito auth middleware on all task + GraphQL routes   | Done   |
|15 | Runs on both iOS and Android from the same codebase    | Done   |

## API Reference

See [backend/README.md](backend/README.md) for full endpoint documentation, request/response shapes, and error codes.

## Cross-Platform Notes

The mobile app was initially validated on iOS only; a few Android-specific issues (a native `SoLoader` crash on launch, an emulator networking issue, and missing vector-icon fonts) were found and fixed while bringing Android to parity. See [mobile/README.md § Issues Fixed During Development](mobile/README.md#issues-fixed-during-development) for details.

## Test Commands

```bash
# Run all workspace tests
npm test

# Backend tests only
npm run test --workspace backend

# Mobile tests only (if present)
npm run test --workspace mobile

# Lint all workspaces
npm run lint
```

## Spec Deviations

| Item         | Spec            | Implemented          | Reason                                            |
|--------------|-----------------|----------------------|---------------------------------------------------|
| DB           | Not specified   | MongoDB Atlas M0     | Free tier, zero-config, fast setup                |
| Mobile UI    | MUI/Bootstrap/Ant | React Native Paper | Spec options are web-only; Paper is Material-native for RN |
| Scaffold     | Not specified   | React Native bare CLI | Full native project control for iOS/Android builds    |

Auth (AWS Cognito) and the mark-as-done GraphQL resolver are implemented as specified, not deviations. See [DECISIONS.md](DECISIONS.md) for the reasoning behind the remaining ones, plus the ARCHIVED-transition note.

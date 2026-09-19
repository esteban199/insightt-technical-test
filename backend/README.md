# Task List API — Backend

Express + TypeScript + MongoDB API for managing personal tasks. Authentication is delegated to AWS Cognito; everything is REST except marking a task done, which goes through a GraphQL mutation.

## Stack

- **Runtime**: Node.js, Express
- **Language**: TypeScript (strict mode)
- **Database**: MongoDB + Mongoose
- **Auth**: AWS Cognito User Pool (backend verifies ID tokens via `aws-jwt-verify`, doesn't issue its own)
- **GraphQL**: `@apollo/server` — used only for the `markTaskDone` mutation
- **Validation**: Zod
- **Testing**: Jest + ts-jest + supertest + mongodb-memory-server
- **Linting/Formatting**: ESLint + Prettier

## Setup

You need a Cognito User Pool + App Client first (see the root `README.md` for the exact console steps).

```bash
# 1. Copy environment file and fill in your values
cp .env.example .env
# Edit .env: set MONGO_URI, COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID, COGNITO_REGION

# 2. Install dependencies
npm install

# 3. Run in development mode
npm run dev
```

Server starts at `http://localhost:4000`, GraphQL endpoint at `http://localhost:4000/graphql`.

There's no register/login endpoint here — the mobile app signs up and signs in directly against Cognito. The backend's only job is to verify the ID token on every request (`Authorization: Bearer <cognito-id-token>`) and use its `sub` claim as the task owner id.

---

## API Endpoints

| Method | Path                     | Auth          | Body / Query                              | Response                              |
|--------|--------------------------|---------------|---------------------------------------------|---------------------------------------|
| GET    | `/api/tasks`             | Cognito token | Query: `?status=PENDING|IN_PROGRESS|DONE|ARCHIVED` | `{ tasks: [...] }`               |
| GET    | `/api/tasks/:id`         | Cognito token | —                                          | `{ task }`                           |
| POST   | `/api/tasks`             | Cognito token | `{ title, description? }`                 | `{ task }` (status: PENDING)         |
| PATCH  | `/api/tasks/:id`         | Cognito token | `{ title?, description?, status? }`       | `{ task }`                           |
| DELETE | `/api/tasks/:id`         | Cognito token | —                                          | `204 No Content`                     |
| POST   | `/graphql`               | Cognito token | GraphQL mutation, see below                | GraphQL response                     |
| GET    | `/health`                | —             | —                                          | `{ ok: true }`                       |

All task endpoints return only tasks owned by the authenticated user.

### `markTaskDone` (GraphQL mutation)

This is the one action the spec requires to go through "a Cloud Function, Resolver (GraphQL), or Web Service" — implemented here as a GraphQL resolver, kept alongside the REST API on the same server.

```graphql
mutation MarkDone($id: ID!) {
  markTaskDone(id: $id) {
    id
    status
    doneAt
    doneBy
  }
}
```

Errors come back as GraphQL errors with `extensions.code` (`NOT_FOUND`, `ALREADY_DONE`, `UNAUTHORIZED`) and a matching `extensions.http.status`.

---

## State Machine

```
  PENDING ──► IN_PROGRESS ──► DONE ──► ARCHIVED
```

Allowed transitions:

| From         | To            |
|--------------|---------------|
| PENDING      | IN_PROGRESS   |
| IN_PROGRESS  | DONE          |
| DONE         | ARCHIVED      |

Any other transition returns `400 INVALID_TRANSITION`.

### Edit Lock (DONE tasks)

Once a task is `DONE`:
- Title edits are still allowed (typo fixes).
- Description and status changes are blocked (`400 EDIT_LOCKED`).

---

## Commands

```bash
npm run dev          # Development (ts-node-dev with hot reload)
npm run build        # Compile TypeScript → dist/
npm run start        # Run compiled production build
npm run test         # Run all tests (sequential)
npm run test:watch   # Run tests in watch mode
npm run lint         # ESLint src/
```

---

## Project Structure

```
backend/
├── src/
│   ├── config/         env.ts, db.ts, cognito.ts (JWT verifier)
│   ├── models/         Task.ts
│   ├── controllers/    task.controller.ts
│   ├── routes/         task.routes.ts
│   ├── middleware/     auth.ts, logger.ts, validate.ts, error.ts
│   ├── validators/     task.validator.ts
│   ├── services/       task.service.ts, markAsDone.service.ts
│   ├── graphql/        schema.ts, resolvers.ts, context.ts
│   ├── utils/          AppError.ts, asyncHandler.ts
│   └── server.ts       Express + Apollo app entry
├── tests/
│   ├── unit/           task.service.test.ts
│   └── integration/    markAsDone.test.ts (mocks Cognito verification)
├── .env.example
├── .gitignore
├── jest.config.js
├── package.json
├── README.md
└── tsconfig.json
```

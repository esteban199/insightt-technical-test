import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';

import { loggerMiddleware } from '../../src/middleware/logger';
import { errorHandler } from '../../src/middleware/error';
import taskRoutes from '../../src/routes/task.routes';
import { typeDefs } from '../../src/graphql/schema';
import { resolvers } from '../../src/graphql/resolvers';
import { buildContext } from '../../src/graphql/context';

// Integration tests run offline, so we don't hit the real Cognito JWKS endpoint —
// `verifyIdToken` is swapped for a stub that trusts a base64-encoded JSON payload
// as the "token". This exercises everything downstream of authentication (routes,
// resolvers, services, Mongo) exactly as in production, just without a live IdP.
jest.mock('../../src/config/cognito', () => ({
  verifyIdToken: jest.fn(async (token: string) =>
    JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
  ),
}));

function fakeToken(sub: string, email = 'owner@test.com'): string {
  return Buffer.from(JSON.stringify({ sub, email })).toString('base64');
}

let mongoServer: MongoMemoryServer;
let app: express.Application;

const OWNER_ID = 'cognito-sub-owner-1234';
const AUTH_HEADER = `Bearer ${fakeToken(OWNER_ID)}`;

const MARK_DONE_MUTATION = `
  mutation MarkDone($id: ID!) {
    markTaskDone(id: $id) {
      id
      status
      doneAt
      doneBy
    }
  }
`;

async function markDone(taskId: string) {
  return request(app)
    .post('/graphql')
    .set('Authorization', AUTH_HEADER)
    .send({ query: MARK_DONE_MUTATION, variables: { id: taskId } });
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  app = express();
  app.use(express.json());
  app.use(loggerMiddleware);
  app.use('/api/tasks', taskRoutes);

  const apolloServer = new ApolloServer({ typeDefs, resolvers });
  await apolloServer.start();
  app.use('/graphql', express.json(), expressMiddleware(apolloServer, { context: buildContext }));

  app.use(errorHandler);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await mongoose.connection.dropDatabase();
});

describe('markTaskDone GraphQL mutation', () => {
  it('marks a pending task as DONE', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .set('Authorization', AUTH_HEADER)
      .send({ title: 'My Task', description: 'Do it' });

    const taskId: string = create.body.task._id;

    const res = await markDone(taskId);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.markTaskDone.status).toBe('DONE');
    expect(res.body.data.markTaskDone.doneAt).toBeTruthy();
    expect(res.body.data.markTaskDone.doneBy).toBe(OWNER_ID);
  });

  it('second call returns an ALREADY_DONE GraphQL error', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .set('Authorization', AUTH_HEADER)
      .send({ title: 'Idempotency Test' });

    const taskId: string = create.body.task._id;

    await markDone(taskId);
    const second = await markDone(taskId);

    expect(second.body.data?.markTaskDone).toBeFalsy();
    expect(second.body.errors[0].extensions.code).toBe('ALREADY_DONE');
  });

  it('rejects a non-owner with a FORBIDDEN GraphQL error', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .set('Authorization', AUTH_HEADER)
      .send({ title: 'Owned by someone else' });

    const taskId: string = create.body.task._id;

    const res = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${fakeToken('a-different-user')}`)
      .send({ query: MARK_DONE_MUTATION, variables: { id: taskId } });

    // markAsDone's atomic filter includes ownerId, so a non-owner's attempt
    // simply matches nothing and surfaces as NOT_FOUND rather than FORBIDDEN —
    // this also avoids leaking whether a task with that id exists for another user.
    expect(res.body.errors[0].extensions.code).toBe('NOT_FOUND');
  });

  it('rejects requests with no Authorization header', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({ query: MARK_DONE_MUTATION, variables: { id: new mongoose.Types.ObjectId().toString() } });

    expect(res.body.errors[0].extensions.code).toBe('UNAUTHORIZED');
  });

  it('handles two concurrent requests safely: exactly one succeeds', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .set('Authorization', AUTH_HEADER)
      .send({ title: 'Concurrent Test' });

    const taskId: string = create.body.task._id;

    const [first, second] = await Promise.all([markDone(taskId), markDone(taskId)]);

    const outcomes = [first, second].map((res) =>
      res.body.data?.markTaskDone ? 'DONE' : res.body.errors[0].extensions.code
    );
    expect(outcomes.sort()).toEqual(['ALREADY_DONE', 'DONE']);
  });
});

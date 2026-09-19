import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import { env } from './config/env';
import { connectDB } from './config/db';
import { loggerMiddleware } from './middleware/logger';
import { errorHandler } from './middleware/error';
import taskRoutes from './routes/task.routes';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { buildContext } from './graphql/context';

const app = express();

// Security & parsing
app.use(helmet());
app.use(cors());
app.use(express.json());

// Logger first — wraps every request
app.use(loggerMiddleware);

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// REST routes (everything except marking a task done — see /graphql)
app.use('/api/tasks', taskRoutes);

const apolloServer = new ApolloServer({ typeDefs, resolvers });

async function start(): Promise<void> {
  await connectDB();
  await apolloServer.start();
  app.use('/graphql', express.json(), expressMiddleware(apolloServer, { context: buildContext }));

  // Central error handler — must be mounted after every route, REST and GraphQL
  app.use(errorHandler);

  app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
    console.log(`GraphQL endpoint at http://localhost:${env.PORT}/graphql`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

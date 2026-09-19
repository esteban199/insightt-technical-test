import { GraphQLError } from 'graphql';
import { markAsDone } from '../services/markAsDone.service';
import { AppError } from '../utils/AppError';
import type { TaskLean } from '../services/task.service';
import type { GraphQLContext } from './context';

function toGraphQLTask(task: TaskLean) {
  return {
    id: task._id.toString(),
    title: task.title,
    description: task.description ?? null,
    status: task.status,
    ownerId: task.ownerId,
    version: task.version,
    doneAt: task.doneAt ? task.doneAt.toISOString() : null,
    doneBy: task.doneBy ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export const resolvers = {
  Query: {
    health: () => 'ok',
  },
  Mutation: {
    async markTaskDone(_parent: unknown, args: { id: string }, context: GraphQLContext) {
      try {
        const task = await markAsDone(args.id, context.user.sub);
        return toGraphQLTask(task);
      } catch (err) {
        if (err instanceof AppError) {
          throw new GraphQLError(err.message, {
            extensions: { code: err.code, http: { status: err.status } },
          });
        }
        throw err;
      }
    },
  },
};

import { GraphQLError } from 'graphql';
import type { Request } from 'express';
import { verifyIdToken, type CognitoUser } from '../config/cognito';

export interface GraphQLContext {
  user: CognitoUser;
}

// Same Bearer-token check as the REST auth middleware, just adapted to Apollo's
// context shape — the GraphQL endpoint needs to be authenticated too.
export async function buildContext({ req }: { req: Request }): Promise<GraphQLContext> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new GraphQLError('Missing or invalid authorization header', {
      extensions: { code: 'UNAUTHORIZED', http: { status: 401 } },
    });
  }

  try {
    const user = await verifyIdToken(authHeader.slice(7));
    // Also stamp it on the Express request so loggerMiddleware's `req.user?.sub`
    // reports the real actor for GraphQL calls too, not just REST ones.
    (req as Request & { user?: CognitoUser }).user = user;
    return { user };
  } catch {
    throw new GraphQLError('Invalid or expired token', {
      extensions: { code: 'UNAUTHORIZED', http: { status: 401 } },
    });
  }
}

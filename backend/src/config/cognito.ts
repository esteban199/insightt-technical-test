import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { env } from './env';

const verifier = CognitoJwtVerifier.create({
  userPoolId: env.COGNITO_USER_POOL_ID,
  tokenUse: 'id',
  clientId: env.COGNITO_CLIENT_ID,
});

export interface CognitoUser {
  sub: string;
  email: string;
  name?: string;
}

// Verifies the signature, issuer, audience (client id) and expiry of a Cognito
// ID token against the user pool's public JWKS (cached internally by the verifier).
export async function verifyIdToken(token: string): Promise<CognitoUser> {
  const payload = await verifier.verify(token);
  return {
    sub: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : '',
    name: typeof payload.name === 'string' ? payload.name : undefined,
  };
}

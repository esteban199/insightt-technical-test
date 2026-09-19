import { CognitoUserPool } from 'amazon-cognito-identity-js';

// These are the User Pool's public client identifiers, not secrets — the app
// client is configured as a "public client" (no client secret) specifically so
// it's safe to ship inside a mobile app. Fill these in after creating the User
// Pool in the AWS Console (see mobile/README.md).
export const COGNITO_USER_POOL_ID = 'us-east-2_6xq7mBcOF';
export const COGNITO_CLIENT_ID = '50o4j3go9k58pm9h752ckhk8r7';

export const userPool = new CognitoUserPool({
  UserPoolId: COGNITO_USER_POOL_ID,
  ClientId: COGNITO_CLIENT_ID,
});

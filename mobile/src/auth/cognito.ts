import {
  CognitoUser,
  CognitoUserAttribute,
  AuthenticationDetails,
  type CognitoUserSession,
} from 'amazon-cognito-identity-js';
import { userPool } from '@/config/cognito';
import type { User } from '@/types/user';

export interface Session {
  idToken: string;
  user: User;
}

function toSession(session: CognitoUserSession): Session {
  const payload = session.getIdToken().payload;
  return {
    idToken: session.getIdToken().getJwtToken(),
    user: {
      id: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : '',
      name: typeof payload.name === 'string' ? payload.name : '',
      createdAt: new Date().toISOString(),
    },
  };
}

export function signUp(email: string, password: string, name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const attributes = [new CognitoUserAttribute({ Name: 'name', Value: name })];
    userPool.signUp(email, password, attributes, [], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export function confirmSignUp(email: string, code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
    cognitoUser.confirmRegistration(code, true, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export function resendConfirmationCode(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
    cognitoUser.resendConfirmationCode((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export function signIn(email: string, password: string): Promise<Session> {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
    const authDetails = new AuthenticationDetails({ Username: email, Password: password });

    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (session) => resolve(toSession(session)),
      onFailure: (err) => reject(err),
    });
  });
}

export function signOut(): void {
  userPool.getCurrentUser()?.signOut();
}

// Called once on app launch. `storage.sync()` hydrates the RN storage adapter's
// in-memory cache from AsyncStorage (see amazon-cognito-identity-js's
// StorageHelper-rn.js); only then does getCurrentUser()/getSession() see a
// previously logged-in user. getSession() also transparently refreshes the ID
// token if it's expired but the refresh token (30-day default) is still valid.
export function restoreSession(): Promise<Session | null> {
  return new Promise((resolve) => {
    // `storage` (the RN-specific AsyncStorage-backed adapter) isn't part of the
    // library's public TS types, even though it's documented for RN usage.
    const storage = (userPool as unknown as {
      storage: { sync(cb: (err: Error | null, result?: string) => void): void };
    }).storage;

    storage.sync((syncErr, result) => {
      if (syncErr || result !== 'SUCCESS') return resolve(null);

      const cognitoUser = userPool.getCurrentUser();
      if (!cognitoUser) return resolve(null);

      cognitoUser.getSession((sessionErr: Error | null, session: CognitoUserSession | null) => {
        if (sessionErr || !session || !session.isValid()) return resolve(null);
        resolve(toSession(session));
      });
    });
  });
}

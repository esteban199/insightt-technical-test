import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { User } from '@/types/user';
import * as cognito from '@/auth/cognito';
import { setAuthToken, setUnauthorizedHandler } from '@/api/client';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}

export interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  confirmRegistration: (email: string, code: string) => Promise<void>;
  resendConfirmationCode: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cognito owns session persistence/refresh in its own AsyncStorage-backed
  // storage; on launch we just ask it whether a valid (or refreshable) session
  // exists already, instead of managing our own token cache.
  useEffect(() => {
    let cancelled = false;

    cognito.restoreSession().then((session) => {
      if (cancelled) return;
      if (session) {
        setAuthToken(session.idToken);
        setUser(session.user);
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = useCallback(() => {
    cognito.signOut();
    setAuthToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(handleLogout);
  }, [handleLogout]);

  const handleLogin = useCallback(async (email: string, password: string) => {
    const session = await cognito.signIn(email, password);
    setAuthToken(session.idToken);
    setUser(session.user);
  }, []);

  const handleRegister = useCallback(async (email: string, password: string, name: string) => {
    await cognito.signUp(email, password, name);
  }, []);

  const handleConfirmRegistration = useCallback(async (email: string, code: string) => {
    await cognito.confirmSignUp(email, code);
  }, []);

  const handleResendCode = useCallback(async (email: string) => {
    await cognito.resendConfirmationCode(email);
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    login: handleLogin,
    register: handleRegister,
    confirmRegistration: handleConfirmRegistration,
    resendConfirmationCode: handleResendCode,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return ctx;
}

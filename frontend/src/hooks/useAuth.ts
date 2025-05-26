import { useState, useEffect, useCallback } from 'react';
import type { Session, User, AuthError, SignUpWithPasswordCredentials, SignInWithPasswordCredentials, Provider } from '@supabase/supabase-js';
import * as authService from '../services/authService';

export interface UseAuthReturn {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAnonymous: boolean;
  error: AuthError | null;
  signUp: (credentials: SignUpWithPasswordCredentials) => Promise<{ user: User | null; error: AuthError | null }>;
  signIn: (credentials: SignInWithPasswordCredentials) => Promise<{ user: User | null; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  signInWithOAuth: (provider: Provider) => Promise<{ error: AuthError | null }>;
  ensureSession: () => Promise<Session | null>;
}

export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  const handleAuthChange = useCallback((_event: string, sessionState: Session | null) => {
    setSession(sessionState);
    setUser(sessionState?.user ?? null);
    setError(null); // Clear previous errors on auth change
    if (_event === 'INITIAL_SESSION' || _event === 'SIGNED_IN' || _event === 'SIGNED_OUT' || _event === 'USER_UPDATED') {
      setIsLoading(false);
    }
    console.log(`Auth event: ${_event}`, sessionState);
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    authService.getCurrentSession().then(s => {
      if (!isMounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (!s) {
        authService.ensureUserSession().then(anonSession => {
          if (!isMounted) return;
          setSession(anonSession);
          setUser(anonSession?.user ?? null);
          setIsLoading(false);
        }).catch(err => {
          if (!isMounted) return;
          console.error("Error ensuring user session on initial load:", err);
          setError(err as AuthError);
          setIsLoading(false);
        });
      } else {
         setIsLoading(false);
      }
    }).catch(err => {
        if (!isMounted) return;
        console.error("Error getting current session on initial load:", err);
        setError(err as AuthError);
        setIsLoading(false);
    });

    const authSubscription = authService.onAuthStateChange(handleAuthChange);

    return () => {
      isMounted = false;
      authSubscription?.unsubscribe(); // authSubscription is now Subscription | null
    };
  }, [handleAuthChange]);

  const isAnonymousUser = user?.is_anonymous ?? (session ? !user?.email : false);

  const signUp = async (credentials: SignUpWithPasswordCredentials) => {
    setIsLoading(true);
    setError(null);
    const result = await authService.appSignUp(credentials);
    if (result.error) setError(result.error);
    setIsLoading(false);
    return result;
  };

  const signIn = async (credentials: SignInWithPasswordCredentials) => {
    setIsLoading(true);
    setError(null);
    const result = await authService.appSignIn(credentials);
    if (result.error) setError(result.error);
    setIsLoading(false);
    return result;
  };

  const signOut = async () => {
    setIsLoading(true);
    setError(null);
    const result = await authService.appSignOut();
    if (result.error) setError(result.error);
    setIsLoading(false);
    return result;
  };
  
  const signInWithOAuth = async (provider: Provider) => {
    setIsLoading(true);
    setError(null);
    const result = await authService.signInWithOAuth(provider);
    if (result.error) setError(result.error);
    setIsLoading(false); 
    return result;
  };

  const ensureSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const currentSession = await authService.ensureUserSession();
        if (currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);
        }
        setIsLoading(false);
        return currentSession;
    } catch (e) {
        setError(e as AuthError);
        setIsLoading(false);
        return null;
    }
  }, []);

  return {
    session,
    user,
    isLoading,
    isAnonymous: isAnonymousUser,
    error,
    signUp,
    signIn,
    signOut,
    signInWithOAuth,
    ensureSession,
  };
} 
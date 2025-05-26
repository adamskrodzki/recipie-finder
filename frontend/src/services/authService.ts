import { supabase } from './supabaseClient';
import type { Session, User, SignUpWithPasswordCredentials, SignInWithPasswordCredentials, Provider, AuthError, Subscription } from '@supabase/supabase-js';

export async function getCurrentSession(): Promise<Session | null> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting current session:', error.message);
    // Potentially throw a more specific error or handle as per app requirements
  }
  return session;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error.message);
  }
  return user;
}

export async function ensureUserSession(): Promise<Session | null> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
      console.error('Error getting session during ensureUserSession:', sessionError);
      return null;
  }

  if (session) {
      console.log('Existing session found:', session);
      return session;
  }

  // No active session, try to sign in anonymously
  console.log('No active session, attempting anonymous sign-in...');
  const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();

  if (anonError) {
    console.error('Error signing in anonymously:', anonError);
    // Handle error: show message to user, maybe disable save features
    return null;
  }
  if (anonData?.session) {
    console.log('Anonymous session created:', anonData.session);
  } else {
    console.warn('Anonymous sign-in did not return a session.');
  }
  return anonData?.session ?? null;
}

// Placeholder for full auth, to be implemented later as per guidelines
export async function appSignUp(credentials: SignUpWithPasswordCredentials): Promise<{ user: User | null; error: AuthError | null }> {
  console.warn('appSignUp not fully implemented, using Supabase default. Ensure anonymous session linking is handled if needed.');
  const { data, error } = await supabase.auth.signUp(credentials);
  return { user: data.user, error };
}

export async function appSignIn(credentials: SignInWithPasswordCredentials): Promise<{ user: User | null; error: AuthError | null }> {
  console.warn('appSignIn not fully implemented, using Supabase default.');
  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  return { user: data.user, error };
}

export async function appSignOut(): Promise<{ error: AuthError | null }> {
  console.warn('appSignOut not fully implemented, using Supabase default.');
  const { error } = await supabase.auth.signOut();
  return { error };
}

export function onAuthStateChange(callback: (event: string, session: Session | null) => void): Subscription | null {
  const { data: authListenerData } = supabase.auth.onAuthStateChange(callback);

  if (!authListenerData || !authListenerData.subscription) {
    console.error('Failed to subscribe to auth state changes or subscription is missing.');
    return null;
  }
  return authListenerData.subscription;
}

export async function signInWithOAuth(provider: Provider): Promise<{ error: AuthError | null }> {
  console.warn('signInWithOAuth not fully implemented, using Supabase default.');
  const { error } = await supabase.auth.signInWithOAuth({ provider });
  return { error };
} 
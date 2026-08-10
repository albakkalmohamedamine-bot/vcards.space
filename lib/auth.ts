import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';

export async function getSession(): Promise<Session | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      return null;
    }
    return data.session;
  } catch (err) {
    console.error('Error fetching auth session:', err);
    return null;
  }
}

export async function getUser(): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return null;
    }
    return data.user;
  } catch (err) {
    console.error('Error fetching auth user:', err);
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ success: boolean; session?: Session | null; error?: string }> {
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedEmail || !password) {
    return { success: false, error: 'Please enter both email and password.' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.session) {
      return { success: false, error: 'Unable to start session. Please try again.' };
    }

    return { success: true, session: data.session };
  } catch (err: any) {
    console.error('Sign in error:', err);
    return { success: false, error: err?.message || 'An unexpected authentication error occurred.' };
  }
}

export async function signOut(): Promise<{ success: boolean }> {
  try {
    await supabase.auth.signOut();
    return { success: true };
  } catch (e) {
    console.error('Sign out error:', e);
    return { success: false };
  }
}





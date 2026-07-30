import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';

export async function getSession(): Promise<Session | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;
    return session;
  } catch (e) {
    console.error('Error fetching Supabase auth session:', e);
    return null;
  }
}

export async function getUser(): Promise<User | null> {
  const session = await getSession();
  return session ? session.user : null;
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.session) {
      return { success: false, error: 'Invalid credentials' };
    }

    return { success: true };
  } catch (err) {
    console.error('Sign in error:', err);
    return { success: false, error: 'Invalid credentials' };
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

// Backward-compatibility fallback export
export async function logout(): Promise<void> {
  await signOut();
}


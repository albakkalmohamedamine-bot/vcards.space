import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';

export function updateAuthCookie(session: Session | null) {
  if (typeof document === 'undefined') return;
  if (session) {
    document.cookie = 'vcard_auth=true; path=/; max-age=604800; SameSite=Lax';
  } else {
    document.cookie = 'vcard_auth=; path=/; max-age=0; SameSite=Lax';
  }
}

if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((_event, session) => {
    updateAuthCookie(session);
  });
}

export async function getSession(): Promise<Session | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      updateAuthCookie(null);
      return null;
    }
    updateAuthCookie(session);
    return session;
  } catch (e) {
    console.error('Error fetching Supabase auth session:', e);
    updateAuthCookie(null);
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
      updateAuthCookie(null);
      return { success: false, error: 'Invalid credentials' };
    }

    updateAuthCookie(data.session);
    return { success: true };
  } catch (err) {
    console.error('Sign in error:', err);
    updateAuthCookie(null);
    return { success: false, error: 'Invalid credentials' };
  }
}

export async function signOut(): Promise<{ success: boolean }> {
  try {
    await supabase.auth.signOut();
    updateAuthCookie(null);
    return { success: true };
  } catch (e) {
    console.error('Sign out error:', e);
    updateAuthCookie(null);
    return { success: false };
  }
}


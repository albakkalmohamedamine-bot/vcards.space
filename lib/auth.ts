import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';

export const TEMPORARY_ADMIN_MODE = true;

const MOCK_ADMIN_SESSION: any = {
  access_token: 'temp-admin-token-12345',
  token_type: 'bearer',
  expires_in: 86400,
  refresh_token: 'temp-refresh-token-12345',
  user: {
    id: 'admin-0000-0000-0000-000000000000',
    app_metadata: { provider: 'email' },
    user_metadata: { name: 'Admin' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'admin@vcards.space',
  },
};

export function setAdminCookies() {
  if (typeof document !== 'undefined') {
    document.cookie = "temp_admin_session=true; path=/; max-age=86400; SameSite=Lax";
    try {
      localStorage.setItem('temp_admin_session', 'true');
    } catch (e) {}
  }
}

export function clearAdminCookies() {
  if (typeof document !== 'undefined') {
    document.cookie = "temp_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; path=/";
    try {
      localStorage.removeItem('temp_admin_session');
    } catch (e) {}
  }
}

export async function getSession(): Promise<Session | null> {
  return MOCK_ADMIN_SESSION as unknown as Session;
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
): Promise<{ success: boolean; session?: Session | null; error?: string }> {
  const trimmedInput = email.trim().toLowerCase();

  // Allow "admin" / "admin" or "admin@vcards.space" / "admin"
  if ((trimmedInput === 'admin' || trimmedInput === 'admin@vcards.space') && password === 'admin') {
    setAdminCookies();
    return { success: true, session: MOCK_ADMIN_SESSION as unknown as Session };
  }

  // Fallback to Supabase Auth if credentials match Supabase user
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedInput,
      password,
    });

    if (error || !data.session) {
      return { success: false, error: 'Invalid username/email or password (Default: admin / admin)' };
    }

    setAdminCookies();

    return { success: true, session: data.session };
  } catch (err) {
    console.error('Sign in error:', err);
    return { success: false, error: 'Invalid username/email or password (Default: admin / admin)' };
  }
}

export async function signOut(): Promise<{ success: boolean }> {
  try {
    clearAdminCookies();
    await supabase.auth.signOut();
    return { success: true };
  } catch (e) {
    console.error('Sign out error:', e);
    return { success: false };
  }
}




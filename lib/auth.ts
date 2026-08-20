import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';

// Supabase Authentication enabled for production
export const AUTH_DISABLED_FOR_DEVELOPMENT = false;

const DEV_MOCK_USER: User = {
  id: 'dev-admin-user',
  app_metadata: {},
  user_metadata: { name: 'Admin (Dev Mode)' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'admin@dev.local',
} as unknown as User;

const DEV_MOCK_SESSION: Session = {
  access_token: 'dev-token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'dev-refresh',
  user: DEV_MOCK_USER,
} as unknown as Session;

export async function getSession(): Promise<Session | null> {
  if (AUTH_DISABLED_FOR_DEVELOPMENT) {
    return DEV_MOCK_SESSION;
  }

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
  if (AUTH_DISABLED_FOR_DEVELOPMENT) {
    return DEV_MOCK_USER;
  }

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
  if (AUTH_DISABLED_FOR_DEVELOPMENT) {
    return true;
  }
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





import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import type { User as AppUser } from '@/types';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UseAuthOptions {
  initialize?: boolean;
}

function isAuthSessionError(error?: { status?: number; message?: string } | null) {
  if (!error) return false;
  const message = error.message?.toLowerCase() || '';
  return (
    error.status === 401 ||
    error.status === 403 ||
    message.includes('jwt') ||
    message.includes('token') ||
    message.includes('session') ||
    message.includes('not authenticated')
  );
}

function mapSupabaseUser(user: SupabaseUser, profileName?: string, role?: string): AppUser {
  return {
    id: user.id,
    name: profileName || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
    email: user.email || '',
    role: (role as AppUser['role']) || 'viewer',
    permissions: ['all'],
  };
}

export function useAuth(options: UseAuthOptions = {}) {
  const { initialize = true } = options;
  const { setUser, setUserRole, logout: storeLogout } = useAppStore();

  const [loading, setLoading] = useState(initialize);

  const clearInvalidSession = useCallback(async () => {
    await supabase.auth.signOut().catch(() => undefined);
    storeLogout();
  }, [storeLogout]);

  const syncAuthState = useCallback(async (sessionUser: SupabaseUser | null) => {
    if (!sessionUser) {
      storeLogout();
      return;
    }

    try {
      const { data: userResponse, error: userError } = await supabase.auth.getUser();
      const verifiedUser = userResponse.user;

      if (userError || !verifiedUser || verifiedUser.id !== sessionUser.id) {
        await clearInvalidSession();
        return;
      }

      const [profileResponse, roleResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select('name')
          .eq('id', verifiedUser.id)
          .maybeSingle(),
        supabase.rpc('get_user_role', { _user_id: verifiedUser.id })
      ]);

      if (isAuthSessionError(profileResponse.error) || isAuthSessionError(roleResponse.error)) {
        await clearInvalidSession();
        return;
      }

      const role = roleResponse.data || 'viewer';
      const appUser = mapSupabaseUser(verifiedUser, profileResponse.data?.name, role);
      setUser(appUser);
      setUserRole(role);
    } catch (e) {
      console.error('Auth sync error:', e);
    }
  }, [clearInvalidSession, setUser, setUserRole, storeLogout]);

  useEffect(() => {
    if (!initialize) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const isSyncing = { current: false };

    const runSync = async (sessionUser: SupabaseUser | null) => {
      if (!mounted || isSyncing.current) return;
      isSyncing.current = true;
      try {
        await syncAuthState(sessionUser);
      } finally {
        if (mounted) {
          setLoading(false);
          isSyncing.current = false;
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setTimeout(() => {
          if (mounted) void runSync(session?.user ?? null);
        }, 0);
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) void runSync(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initialize, syncAuthState]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut().catch(() => undefined);
    storeLogout();
  }, [storeLogout]);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

  return { loading, signIn, signUp, signOut, resetPassword };
}

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import { authService } from '@/services/system/authService';
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

export function useAuth(options: UseAuthOptions = {}) {
  const { initialize = true } = options;
  const { setUser, setUserRole, setActiveCompany, logout: storeLogout } = useAppStore();
  const [loading, setLoading] = useState(initialize);

  const clearInvalidSession = useCallback(async () => {
    await authService.signOut();
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

      const [profile, role] = await Promise.all([
        authService.getProfile(verifiedUser.id),
        authService.getUserRole(verifiedUser.id)
      ]);

      const appUser = authService.mapSupabaseUser(verifiedUser, profile?.name, role);
      setUser(appUser);
      setUserRole(role);
      // setActiveCompany(mockCompanies[0] ?? null); // Note: active company logic might need better handling
    } catch (error: any) {
      if (isAuthSessionError(error)) {
        await clearInvalidSession();
      }
    }
  }, [clearInvalidSession, setUser, setUserRole, storeLogout]);

  useEffect(() => {
    if (!initialize) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const runSync = async (sessionUser: SupabaseUser | null) => {
      try {
        await syncAuthState(sessionUser);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        void runSync(session?.user ?? null);
      }, 0);
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      void runSync(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initialize, syncAuthState]);

  return { 
    loading, 
    signIn: authService.signIn, 
    signUp: authService.signUp, 
    signOut: authService.signOut, 
    resetPassword: authService.resetPassword 
  };
}

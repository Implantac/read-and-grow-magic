import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';

interface UseAuthOptions {
  initialize?: boolean;
}

export function useAuth(options: UseAuthOptions = {}) {
  const { initialize = true } = options;
  const { logout: storeLogout } = useAppStore();
  const [loading, setLoading] = useState(initialize);

  useEffect(() => {
    if (!initialize) {
      setLoading(false);
      return;
    }

    let mounted = true;

    // Reduced complexity here to favor EnterpriseProvider's sync logic
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session && mounted) {
          const state = useAppStore.getState();
          if (state.isAuthenticated) {
            useAppStore.setState((s) => ({ ...s, isAuthenticated: false, user: null, userRole: null }));
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && mounted) {
        const currentState = useAppStore.getState();
        if (currentState.isAuthenticated) {
          storeLogout();
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initialize, storeLogout]);

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
